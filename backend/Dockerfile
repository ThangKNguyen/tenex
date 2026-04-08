FROM python:3.12-slim

WORKDIR /app

# Install dependencies as a separate layer so Docker cache skips this
# on rebuilds where only source code changed.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations then start gunicorn.
# $PORT is injected by Render at runtime — fall back to 5000 for local Docker.
CMD ["sh", "-c", "flask db upgrade && gunicorn -b 0.0.0.0:${PORT:-5000} wsgi:app"]
