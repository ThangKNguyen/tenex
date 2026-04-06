"""
Extension instances live here, outside of create_app(), to avoid circular imports.
Pattern: instantiate here → import in create_app() → call .init_app(app).
This way any module can import db/jwt without importing the app itself.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
cors = CORS()
