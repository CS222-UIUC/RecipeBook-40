import os
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from flask import Flask

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configuration test
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'localhost:5432'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SESSION_TYPE'] = 'filesystem'
db = SQLAlchemy(app)

# Updated user
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    salt = db.Column(db.String(10), nullable=False)

    def get_id(self):
        return self.id
    
# Updated recipe
class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    ingredients = db.Column(db.PickleType, nullable=False)  # Or a different type if preferred
    is_personal = db.Column(db.Boolean, nullable=False, default=True)
    users = db.Column(db.String, nullable=True)  # Store usernames as a comma-separated string
    isOwner = db.Column(db.Boolean, nullable=False, default=True)

# Updated fridge
class Fridge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    salt = db.Column(db.String(255), nullable=False)

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello
    @app.route('/')
    def root():
        return 'Recipe app'

    return app


if __name__ == "__main__":
    print("Starting server..", flush=True)
    app = create_app()
    app.run(host='0.0.0.0', port=443)