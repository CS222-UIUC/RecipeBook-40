from flask import Blueprint, request, jsonify
from models import db, User  # Import models here to avoid circular dependency
from flask_login import login_user, logout_user, login_required, current_user
import bcrypt


auth = Blueprint('auth', __name__)

@auth.route('/signup', methods=['POST'])
def signup():
    # data = request.get_json()
    # hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    # new_user = User(
    #     username=data['username'],
    #     email=data['email'],
    #     password=hashed_password.decode('utf-8')  # Store as string
    # )
    # db.session.add(new_user)
    # db.session.commit()
    return jsonify(message="Sign-up successful!")

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):  # Check hashed password
        login_user(user)
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@auth.route('/auth-status', methods=['GET'])
def auth_status():
    return jsonify({"isAuthenticated": current_user.is_authenticated})