from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.upload import Upload
from ..services.log_parser import parse_zscaler_log

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {".log", ".txt", ".csv"}


@upload_bp.route("/uploads", methods=["GET"])
@jwt_required()
def list_uploads():
    """
    GET /uploads
    Returns a lightweight list of the current user's uploads — no rows/parsed_data,
    just enough to render the history panel (id, filename, date, summary stats).
    We exclude parsed_data here because it can be large and the list only needs metadata.
    """
    user_id = get_jwt_identity()

    uploads = (
        Upload.query
        .filter_by(user_id=user_id)
        .order_by(Upload.uploaded_at.desc())
        .all()
    )

    return jsonify([
        {
            "upload_id": str(u.id),
            "filename": u.filename,
            "uploaded_at": u.uploaded_at.isoformat(),
            "status": u.status,
            "summary": u.summary,
        }
        for u in uploads
    ]), 200


@upload_bp.route("/uploads/<upload_id>", methods=["GET"])
@jwt_required()
def get_upload(upload_id: str):
    """
    GET /uploads/<upload_id>
    Returns the full upload including parsed rows and AI analysis.
    We check user_id to ensure users can only access their own uploads.
    """
    user_id = get_jwt_identity()

    upload = Upload.query.filter_by(id=upload_id, user_id=user_id).first()

    if not upload:
        return jsonify({"error": "upload not found"}), 404

    return jsonify({
        "upload_id": str(upload.id),
        "filename": upload.filename,
        "uploaded_at": upload.uploaded_at.isoformat(),
        "summary": upload.summary,
        "rows": upload.parsed_data,
        "ai_analysis": upload.ai_analysis,
    }), 200


@upload_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_log():
    """
    POST /upload
    Header: Authorization: Bearer <token>
    Body:   multipart/form-data, field name "file"

    Parses the uploaded ZScaler log and persists the result.
    AI analysis will be added in Milestone 3.
    """
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "no file provided — use field name 'file'"}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "filename is empty"}), 400

    ext = ("." + file.filename.rsplit(".", 1)[-1].lower()) if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"unsupported file type '{ext}'. Use .log, .txt, or .csv"}), 400

    file_bytes = file.read()

    try:
        rows, summary = parse_zscaler_log(file_bytes)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    upload = Upload(
        user_id=user_id,
        filename=file.filename,
        status="done",
        parsed_data=rows,
        summary=summary,
        ai_analysis=None,  # Milestone 3
    )
    db.session.add(upload)
    db.session.commit()

    return jsonify({
        "upload_id": str(upload.id),
        "summary": summary,
        "rows": rows,
        "ai_analysis": None,
    }), 200
