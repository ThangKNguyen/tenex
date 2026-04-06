from flask import Flask
from .config import Config
from .extensions import db, jwt, migrate, cors


def create_app() -> Flask:
    """
    Flask app factory.
    Using a factory instead of a module-level app instance lets us create
    isolated app instances for testing and avoids circular import issues.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Bind extensions to this app instance.
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Allow all origins for now — fine for a local prototype.
    # In production this would be locked to the frontend's domain.
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints — each owns a logical slice of the API.
    from .routes.auth import auth_bp
    from .routes.upload import upload_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(upload_bp)

    return app
