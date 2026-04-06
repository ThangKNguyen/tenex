"""
WSGI entry point.
Gunicorn loads this module and calls create_app() to get the Flask application.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
