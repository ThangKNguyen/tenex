from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_log():
    """
    POST /upload — stub for Milestone 2.
    JWT protection is wired up now so we can verify auth is working end-to-end.
    Log parsing + AI analysis will be added in the next milestone.
    """
    return jsonify({"message": "upload endpoint ready — parser coming in Milestone 2"}), 200
