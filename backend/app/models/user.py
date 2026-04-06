import uuid
from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    """
    Stores registered users.
    Passwords are bcrypt-hashed before storage — raw passwords never touch the DB.
    """

    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email = db.Column(db.String(255), unique=True, nullable=False)

    # bcrypt output is always 60 chars, 255 gives room if the algorithm changes.
    password = db.Column(db.String(255), nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    uploads = db.relationship("Upload", back_populates="user", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
