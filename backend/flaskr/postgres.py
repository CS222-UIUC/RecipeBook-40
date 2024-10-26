import os
import psycopg2
from flask import Flask, g

def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(os.getenv('DATABASE_URI'))
    return g.db

def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py', silent=True) if test_config is None else app.config.from_mapping(test_config)
    app.teardown_appcontext(close_db)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    @app.route('/')
    def root():
        return 'Recipe app connected to PostgreSQL'

    return app