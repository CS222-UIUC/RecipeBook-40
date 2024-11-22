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
        recipes = Recipe.query.all()
        recipe_list = [
            {
                "id": recipe.id,
                "name": recipe.name,
                "description": recipe.description,
                "steps": recipe.steps,
                "ingredients": recipe.ingredients,
                "isPersonal": recipe.is_personal,
                "users": recipe.users,
                "isOwner": recipe.isOwner
            }
            for recipe in recipes
        ]
        return jsonify({"recipes": recipe_list})

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    ingredients = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    is_personal = db.Column(db.Boolean, nullable=False, default=True)
    users = db.Column(db.String, nullable=True)  # Store usernames as a comma-separated string
    isOwner = db.Column(db.Boolean, nullable=False, default=True)

# Route to add a recipe
@app.route('/add-recipe', methods=['POST'])
def add_recipe():
    data = request.get_json()  # Get data sent from the frontend

    # Parse the received data
    new_recipe = Recipe(
        name=data.get('name'),
        description=data.get('description'),
        steps=data.get('steps'),
        ingredients=data.get('ingredients'),
        is_personal=data.get('isPersonal'),
        users=data.get('users'),
        isOwner=data.get('isOwner')
    )

    # Save the new recipe to the database
    db.session.add(new_recipe)
    db.session.commit()

    return jsonify({"message": "Recipe added successfully"}), 200

@app.route("/recipe/gather", methods=['POST'])
def check_recipe():
    data = request.get_json()
    ingredients = data.get('ingredients')
    # Now parse through all the recipes that the user has and check for the right incredient
    recipe_available_list = []
    for rec in db.session.query(Recipe).all():
        # Compare if everything 
        okay = True
        for k, v in rec.ingredients.items():
            if k not in ingredients:
                okay = False
                break
            if ingredients[k] < v:
                okay = False
                break
        if okay:
            recipe_available_list.append(rec.id)
    return jsonify({"message": recipe_available_list})

@app.route("/recipes", methods=["GET"])
def get_recipe_list():
    return jsonify(message=db.session.query(Recipe).all())

@app.route("/recipes/populate", methods=["GET"])
def populate_recipes():
    # Add a few recipes: TODO    
    return jsonify(message="Ok")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True)
