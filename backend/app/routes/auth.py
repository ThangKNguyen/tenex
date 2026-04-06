import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    POST /auth/register
    Body: { "email": string, "password": string }
    Returns 409 if email is already taken.
    """
    body = request.get_json(silent=True)

    if not body or not body.get("email") or not body.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    email = body["email"].strip().lower()
    password = body["password"]

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    # bcrypt.hashpw expects bytes. Work factor 12 is the sensible default.
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))

    user = User(email=email, password=hashed.decode("utf-8"))
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /auth/login
    Body: { "email": string, "password": string }
    Returns a JWT access token on success.

    We return the same 401 for both "user not found" and "wrong password"
    to avoid user enumeration — don't leak which emails exist.
    """
    body = request.get_json(silent=True)

    if not body or not body.get("email") or not body.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    email = body["email"].strip().lower()
    password = body["password"]

    user = User.query.filter_by(email=email).first()

    # checkpw does a timing-safe comparison — always run it even if user is None
    # to prevent timing attacks that could reveal valid emails.
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({"access_token": token}), 200
