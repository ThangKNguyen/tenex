FROM python:3.12-slim

WORKDIR /app

# Install dependencies as a separate layer so Docker cache skips this
# on rebuilds where only source code changed.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations then start the dev server.
# Using flask run (not gunicorn) for now since this is local dev.
CMD ["sh", "-c", "flask db upgrade && flask run --host=0.0.0.0 --port=5000"]
