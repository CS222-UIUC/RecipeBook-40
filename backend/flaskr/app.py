from flask import Flask, request, jsonify
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import bcrypt
from flask_jwt_extended import JWTManager, jwt_required, verify_jwt_in_request, get_jwt_identity, create_access_token
from flask_mail import Mail, Message
import base64
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle

# Scopes required for sending email
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

import os

def authenticate_gmail():
    creds = None
    # Dynamically determine the absolute path
    credentials_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json')
    
    # Check if credentials.json exists
    if not os.path.exists(credentials_path):
        raise FileNotFoundError(f"Could not find {credentials_path}. Make sure the file is in the correct location.")
    
    # Authenticate and generate the token
    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
    creds = flow.run_local_server(port=0)
    # Save the token for future use
    with open('token.pickle', 'wb') as token:
        pickle.dump(creds, token)
    print("Authentication complete. Token saved to token.pickle.")


def get_authenticated_service():
    creds = None
    # Load the saved token
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)  # Load using pickle
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            raise Exception("Please run the authentication script to generate token.pickle")
    service = build('gmail', 'v1', credentials=creds)
    return service


def send_email(service, sender_email, recipient_email, subject, body):
    # Create MIMEText email
    message = MIMEText(body)
    message['to'] = recipient_email
    message['from'] = sender_email
    message['subject'] = subject

    # Encode message to base64
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

    # Send the email
    message = {'raw': raw_message}
    try:
        service.users().messages().send(userId='me', body=message).execute()
    except Exception as e:
        print(f"An error occurred: {e}")


# App Configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../database.sql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_IDENTITY_CLAIM'] = 'user_id'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Gmail SMTP server
app.config['MAIL_PORT'] = 587  # Gmail uses port 587 for TLS
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'dish.diaries222@gmail.com'
app.config['MAIL_PASSWORD'] = 'dishdiaries123'  # Ensure this is secure
app.config['MAIL_DEFAULT_SENDER'] = 'dish.diaries222@gmail.com'

mail = Mail(app)

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)


# JWT Configuration
JWT_SECRET_KEY = 'your_jwt_secret_key'
JWT_EXPIRATION_DELTA = timedelta(hours=1)
j = JWTManager(app)

# In-memory blacklist for tokens
blacklisted_tokens = set()

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    salt = db.Column(db.String(10), nullable=False)
    total_recipes = db.Column(db.Integer, default=0)
    member_since = db.Column(db.DateTime, default=datetime.utcnow)

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
        'sub': user_id,  # Add the required 'sub' claim for the subject
        'exp': datetime.utcnow() + JWT_EXPIRATION_DELTA
    }
    token = create_access_token(identity=user_id)
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

    if not data['username'] or not data['email']:
        return jsonify(message="Invalid Username or Password"), 400

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
    user.total_recipes += 1
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

    shared_recipes = [
        recipe for recipe in shared_recipes if (user.username in recipe.users or recipe.owner == user.username)
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
        for recipe in shared_recipes
    ]

    return jsonify({"recipes": recipe_list}), 200

def get_user_data(user):
    return {
        "username": user.username,
        "email": user.email,
        "memberSince": user.member_since.strftime("%Y-%m-%d %H:%M:%S")
    }

# Endpoints
@app.route('/account', methods=['GET'])
@jwt_required
def get_account_info():
    # Explicitly verify the JWT in the request
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401

    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    total_recipes = Recipe.query.filter_by(owner=user.username).count()
    stats = {"totalRecipes": total_recipes}
    return jsonify({"user": get_user_data(user), "stats": stats}), 200

@app.route('/account/username', methods=['PUT'])
def update_username():
    try:
        # Verify JWT in the request
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
    except Exception as e:
        return jsonify({"error": str(e)}), 401

    # Fetch the user from the database
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get the new username from the request body
    data = request.json
    new_username = data.get("username")
    if not new_username:
        return jsonify({"error": "Username is required"}), 400

    # Check if the username is already taken
    if User.query.filter_by(username=new_username).first():
        return jsonify({"error": "Username already taken"}), 400

    # Update the username
    user.username = new_username
    db.session.commit()
    return jsonify({"message": "Username updated successfully"}), 200



@app.route('/account/password', methods=['PUT'])
def update_password():
    try:
        # Verify JWT in the request
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
    except Exception as e:
        return jsonify({"error": str(e)}), 401

    # Fetch the user from the database
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get the new password from the request body
    data = request.json
    new_password = data.get("password")
    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    # Hash the new password with bcrypt
    salt = bcrypt.gensalt().decode('utf-8')
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt.encode('utf-8')).decode('utf-8')

    # Update the password and salt
    user.password = hashed_password
    user.salt = salt
    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200

@app.route('/lost-username', methods=['POST'])
def lost_username():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()  # Assuming you have a User model
    if user:
        service = get_authenticated_service()  # Initialize Gmail API service
        send_email(
            service=service,
            sender_email='dish.diaries222@gmail.com',
            recipient_email=email,
            subject="Your Username",
            body=f"Your username is: {user.username}"
        )
        return jsonify({"message": "Username sent to your email."}), 200
    return jsonify({"message": "Email not found."}), 404


@app.route('/reset-password-request', methods=['POST'])
def reset_password_request():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        service = get_authenticated_service()  # Initialize Gmail API service
        token = generate_jwt(user.id)  # Use the `generate_jwt` function to create a reset token
        reset_link = f"http://127.0.0.1:3000/reset-password?token={token}"  # Update link if hosted elsewhere
        print(token)

        # Send reset link via email
        send_email(
            service=service,
            sender_email='dish.diaries222@gmail.com',
            recipient_email=email,
            subject="Password Reset Request",
            body=f"Click the link to reset your password: {reset_link}"
        )
        return jsonify({"message": "Password reset link sent to your email."}), 200

    return jsonify({"message": "Email not found."}), 404


def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('user_id')  # Extract user ID
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Token invalid


@app.route('/reset-password', methods=['POST'])
def reset_password():
    token = request.json.get('token')  # Token from the reset link
    print(token)
    new_password = request.json.get('new_password')  # New password from the user

    if not token or not new_password:
        return jsonify({"message": "Token and new password are required"}), 400

    user_id = verify_jwt(token)  # Verify the token
    if not user_id:
        return jsonify({"message": "Invalid or expired token"}), 400

    # Fetch the user and update the password
    user = User.query.get(user_id)
    if user:
        salt = bcrypt.gensalt().decode('utf-8')
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt.encode('utf-8')).decode('utf-8')

        user.password = hashed_password  # Save the hashed password
        user.salt = salt
        db.session.commit()

        return jsonify({"message": "Password reset successful"}), 200

    return jsonify({"message": "User not found"}), 404



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
