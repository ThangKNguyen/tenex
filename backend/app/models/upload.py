import uuid
from datetime import datetime, timezone
from ..extensions import db


class Upload(db.Model):
    """
    Records each log file upload.
    Parsed rows, summary stats, and AI analysis are stored as JSONB —
    avoids needing separate tables for highly variable data shapes.
    """

    __tablename__ = "uploads"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )
    filename = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Simple state machine: 'processing' → 'done' | 'error'
    status = db.Column(db.String(20), nullable=False, default="processing")

    parsed_data = db.Column(db.JSON, nullable=True)   # full array of parsed log rows
    summary = db.Column(db.JSON, nullable=True)        # pre-computed aggregate stats
    ai_analysis = db.Column(db.JSON, nullable=True)    # { narrative, anomalies }

    user = db.relationship("User", back_populates="uploads")

    def __repr__(self) -> str:
        return f"<Upload {self.filename} [{self.status}]>"
