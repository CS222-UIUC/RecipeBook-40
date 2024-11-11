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
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
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

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    recipe = db.Column(db.JSON)

    def get_id(self):
        return str(self.id)

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
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'))
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
        recipes = [
            {"id": 1, "title": "Spaghetti Carbonara", "description": "A classic Italian pasta dish."},
            {"id": 2, "title": "Chicken Tikka Masala", "description": "A flavorful, spiced Indian curry."},
            {"id": 3, "title": "Avocado Toast", "description": "Simple and delicious avocado toast."}
        ]
        return jsonify({"recipes": recipes})


@app.route("/recipes", methods=["GET"])
def get_recipe_list():
    return jsonify(message=db.session.query(Recipe).all())

@app.route("/recipes/populate", methods=["GET"])
def populate_recipes():
    # Add a few recipes: TODO    
    return jsonify(message="Ok")

if __name__ == '__main__':
    app.run(debug=True, port=443)