USE THIS FILE TO TRACK PROJECT PROGRESS

---

## v1 — Flask Backend Skeleton (Milestone 1)

### What was done
- Set up folder structure: `backend/app/models`, `routes`, `services`, `migrations`
- Created `config.py` — loads all settings from environment variables
- Created `extensions.py` — instantiates `db`, `jwt`, `migrate`, `cors` outside of app factory to avoid circular imports
- Created `app/__init__.py` — `create_app()` factory pattern, registers blueprints
- Created `models/user.py` — `users` table with UUID primary key, email, bcrypt password, timestamp
- Created `models/upload.py` — `uploads` table with JSONB columns for parsed data, summary, and AI analysis
- Created `routes/auth.py` — `POST /auth/register` (bcrypt hash, duplicate check) and `POST /auth/login` (timing-safe password check, returns JWT)
- Created `routes/upload.py` — stub for `POST /upload`, JWT protected, to be filled in Milestone 2
- Created `wsgi.py` — WSGI entry point for Flask dev server and gunicorn
- Created `requirements.txt` and installed all backend dependencies into a venv
- Created `.env` and `.env.example` with all required environment variables

### Not done yet (next milestones)
- Log parser (`services/log_parser.py`)
- AI analysis service (`services/ai_analysis.py`)
- Full upload endpoint
- React frontend

---

## v2 — Docker + PostgreSQL + Migrations (Milestone 1 continued)

### What was done
- Created `docker-compose.yml` — runs Postgres and Flask backend as Docker services
- Created `backend/Dockerfile` — builds Flask app, runs `flask db upgrade` on start
- Created `backend/.dockerignore` — excludes venv, pycache, .env from Docker build
- Ran `flask db init` — initialized Flask-Migrate migrations folder
- Changed Docker Postgres external port from `5432` to `5433` to avoid conflict with local Postgres installation
- Ran `flask db migrate -m "initial"` — auto-generated migration from models
- Ran `flask db upgrade` — applied migration, created `users` and `uploads` tables in Postgres
- Verified in pgAdmin: `users`, `uploads`, and `alembic_version` tables exist under `logsentinel` database

### Not done yet (next milestones)
- Log parser (`services/log_parser.py`)
- AI analysis service (`services/ai_analysis.py`)
- Full upload endpoint
- React frontend

---

## v3 — Auth Endpoints Tested (Milestone 1 complete)

### What was done
- Ran Flask dev server locally with venv activated and env vars set
- Tested `POST /auth/register` via Postman — user created successfully
- Tested `POST /auth/login` via Postman — returned valid JWT access token
- Verified JWT is correctly signed and contains user UUID in `sub` claim

### Milestone 1 complete ✓
Register → login → JWT working end-to-end

---

## v4 — Next: Milestone 2 (Log Parser + Upload Endpoint)