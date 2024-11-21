from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_login import LoginManager, login_user, login_required, logout_user, current_user, UserMixin
import bcrypt
from datetime import timedelta

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configurations
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../database.sql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
db = SQLAlchemy(app)
Session(app)  # Initialize session management

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Custom unauthorized handler for API response
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "You must be logged in to access this resource"}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# User model
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    salt = db.Column(db.String(10), nullable=False)

    def get_id(self):
        return self.id

class RecipeUserAssociation(db.Model):
    __tablename__ = 'recipe_user_association'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.id'))

# Routes
@app.route('/auth-status', methods=['GET'])
def auth_status():
    return jsonify(isAuthenticated=current_user.is_authenticated)

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify(message="Username already exists."), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify(message="Email already exists."), 400

    # Hash the password using bcrypt
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password.decode('utf-8'),  # Store as string
        salt=salt
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="Sign-up successful!")

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        login_user(user)
        session.permanent = True  # Set session to be permanent
        return jsonify(message="Login successful")
    return jsonify(message="Invalid username or password"), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    logout_user()
    return jsonify(message="Logged out successfully")

@app.route('/recipes', methods=['GET', 'POST'])
@login_required
def recipes():
    if request.method == 'POST':
        return jsonify(message=f"Welcome to your Recipe Board, {current_user.username}!")
    elif request.method == 'GET':
        # Retrieve recipes from the database
        # recipes = Recipe.query.filter( (Recipe.users.contains(current_user.username))).all()
        recipes = Recipe.query.all()
        filtered_recipes = [
            recipe for recipe in recipes if current_user.username in recipe.users
        ]
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
            for recipe in filtered_recipes
        ]
        return jsonify({"recipes": recipe_list})

@app.route('/shared-recipes', methods=['GET'])
@login_required
def sharedRecipes():
    # Retrieve recipes from the database
    # recipes = Recipe.query.filter( (Recipe.users.contains(current_user.username))).all()
    recipes = Recipe.query.all()
    filtered_recipes = [
        recipe for recipe in recipes if (current_user.username in recipe.users and current_user.username != recipe.owner)
    ]
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
        for recipe in filtered_recipes
    ]
    return jsonify({"recipes": recipe_list})

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    ingredients = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    is_personal = db.Column(db.Boolean, nullable=False, default=True)
    users = db.Column(db.PickleType, nullable=False)  # Store usernames as a comma-separated string
    owner = db.Column(db.String, nullable=False)

# Route to add a recipe

@app.route('/add-recipe', methods=['POST'])
@login_required
def add_recipe():
    data = request.get_json()
    print(data)
    # Parse the received data
    name = data.get('name')
    description = data.get('description')
    steps = data.get('steps')
    ingredients = data.get('ingredients')
    is_personal = data.get('isPersonal')
    users = data.get('users', "")  # List of usernames
    owner = current_user.username
    users = users.split(",")
    users = [user.strip() for user in users]
    users.append(current_user.username)
    new_recipe = Recipe(
        name=name,
        description=description,
        steps=steps,
        ingredients=ingredients,
        is_personal=is_personal,
        users=users,
        owner=owner
    )
    db.session.add(new_recipe)
    db.session.commit()
    shared_with = []

    for username in users:
        if username == current_user.username:
            continue
        username = username.strip()
        user = User.query.filter_by(username=username).first()
        if user:
            shared_with.append(username)
        else:
            print(f"User {username} does not exist.")

    db.session.commit()

    return jsonify({
        "message": "Recipe added successfully",
        "shared_with": shared_with,
        "owner": owner,
        "users": users
    }), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True)
