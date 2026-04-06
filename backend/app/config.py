import os
from datetime import timedelta


class Config:
    """
    Central config loaded from environment variables.
    Using a class so Flask's app.config.from_object() can consume it directly.
    All secrets must be set via environment — no hardcoded values in production.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://logsentinel:password@db:5432/logsentinel",
    )

    # Disable SQLAlchemy event tracking — we don't use it and it adds overhead.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    # 50MB max upload — ZScaler logs can be large.
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
