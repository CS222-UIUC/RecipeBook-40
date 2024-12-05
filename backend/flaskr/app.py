from flask import Flask, request, jsonify
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import bcrypt



# App Configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../database.sql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)


# JWT Configuration
JWT_SECRET_KEY = 'your_jwt_secret_key'
JWT_EXPIRATION_DELTA = timedelta(hours=1)

# In-memory blacklist for tokens
blacklisted_tokens = set()

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    salt = db.Column(db.String(10), nullable=False)

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.PickleType, nullable=False)
    ingredients = db.Column(db.PickleType, nullable=False)
    is_personal = db.Column(db.Boolean, nullable=False, default=True)
    users = db.Column(db.PickleType, nullable=False)
    owner = db.Column(db.String, nullable=False)

# JWT Utilities
def generate_jwt(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + JWT_EXPIRATION_DELTA
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')
    return token

def verify_jwt(token):
    if token in blacklisted_tokens:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def jwt_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "Missing or invalid token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_jwt(token)
        if not user_id:
            return jsonify({"message": "Invalid or expired token"}), 401
        
        # Attach user_id to the request context
        request.user_id = user_id
        return func(*args, **kwargs)
    return wrapper

# Routes
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    # Check if the username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify(message="Username already exists."), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify(message="Email already exists."), 400

    # Generate salt and hash the password
    salt = bcrypt.gensalt().decode('utf-8')
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt.encode('utf-8')).decode('utf-8')

    # Create and save the user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        salt=salt
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify(message="Sign-up successful!")

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if not user:
        return jsonify({"message": "Invalid username or password"}), 401

    # Hash the provided password using the stored salt
    provided_password_hashed = bcrypt.hashpw(data['password'].encode('utf-8'), user.salt.encode('utf-8')).decode('utf-8')

    # Compare the hashed password
    if provided_password_hashed == user.password:
        # Generate a JWT token upon successful login
        token = generate_jwt(user.id)
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200

    return jsonify({"message": "Invalid username or password"}), 401


@app.route('/auth-status', methods=['GET'])
@jwt_required
def auth_status():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"isAuthenticated": False}), 401
    return jsonify({
        "isAuthenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200

@app.route('/logout', methods=['POST'])
@jwt_required
def logout():
    token = request.headers.get('Authorization').split(" ")[1]
    blacklisted_tokens.add(token)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/recipes', methods=['GET', 'POST'])
@jwt_required
def recipes():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if request.method == 'POST':
        data = request.get_json()
        new_recipe = Recipe(
            name=data['name'],
            description=data['description'],
            steps=data['steps'],
            ingredients=data['ingredients'],
            is_personal=data['isPersonal'],
            users=data['users'],
            owner=user.username
        )
        db.session.add(new_recipe)
        db.session.commit()
        return jsonify({"message": "Recipe added successfully!"}), 200

    elif request.method == 'GET':
        recipes = Recipe.query.filter_by(owner=user.username).all()
        recipe_list = [
            {
                "id": recipe.id,
                "name": recipe.name,
                "description": recipe.description,
                "steps": recipe.steps,
                "ingredients": recipe.ingredients,
                "isPersonal": recipe.is_personal,
                "users": recipe.users,
                "owner": recipe.owner
            }
            for recipe in recipes
        ]
        return jsonify({"recipes": recipe_list})

@app.route('/recipes/<int:recipe_id>', methods=['GET'])
@jwt_required
def get_recipe(recipe_id):
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Fetch the recipe by ID
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "Recipe not found"}), 404

    # Ensure the recipe belongs to the user or is shared with them
    if recipe.owner != user.username and user.username not in recipe.users:
        return jsonify({"message": "Unauthorized"}), 403

    recipe.ingredients = [thing for thing in recipe.ingredients if thing]
    recipe.steps = [thing for thing in recipe.steps if thing]

    return jsonify({
        "recipe": {
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "ingredients": recipe.ingredients if recipe.ingredients else [],
            "steps": recipe.steps if recipe.steps else [],
            "isPersonal": recipe.is_personal,
            "users": recipe.users,
            "owner": recipe.owner
        }
    }), 200

@app.route('/add-recipe', methods=['POST'])
@jwt_required
def add_recipe():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    new_recipe = Recipe(
        name=data['name'],
        description=data['description'],
        steps=data['steps'],
        ingredients=data['ingredients'],
        is_personal=data['isPersonal'],
        users=data['users'],
        owner=user.username
    )
    db.session.add(new_recipe)
    db.session.commit()

    return jsonify({"message": "Recipe added successfully!"}), 200

@app.route('/shared-recipes', methods=['GET'])
@jwt_required
def shared_recipes():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Fetch recipes where the user is part of the `users` field but not the owner
    shared_recipes = Recipe.query.filter(
        Recipe.is_personal == False
    ).all()

    recipe_list = [
        {
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "steps": recipe.steps,
            "ingredients": recipe.ingredients,
            "isPersonal": recipe.is_personal,
            "users": recipe.users,
            "owner": recipe.owner
        }
        for recipe in shared_recipes
    ]

    return jsonify({"recipes": recipe_list}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
