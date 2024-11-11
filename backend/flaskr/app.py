from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import bcrypt  # Import bcrypt for hashing

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'your_secret_key'  # Change this to a strong secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# User Model
class User(db.Model):
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
        return self.id

# Create the database
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return jsonify(message="Welcome to the Flask API!")

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    # Check if the username or email already exists
    if User.query.filter_by(email=data['email']).first() or User.query.filter_by(username=data['username']).first():
        return jsonify(message="Email or username already exists."), 400  # Return an error message

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
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        session['user_id'] = user.id  # Store user ID in session
        return jsonify(message="Login successful")
    return jsonify(message="Invalid email or password"), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)  # Remove user ID from session
    return jsonify(message="Logged out successfully")

@app.route('/auth-status', methods=['GET'])
def auth_status():
    return jsonify(isAuthenticated='user_id' in session)

@app.route('/reset-db', methods=['POST'])
def reset_db():
    db.drop_all()  # This drops all tables
    db.create_all()  # This recreates all tables
    return jsonify(message="Database has been reset.")


@app.route("/recipes", methods=["GET"])
def get_recipe_list():
    return jsonify(message=db.session.query(Recipe).all())

@app.route("/recipes/populate", methods=["GET"])
def populate_recipes():
    # Add a few recipes: TODO    
    return jsonify(message="Ok")

if __name__ == '__main__':
    app.run(debug=True, port=443)