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
- Docker Compose + Postgres setup
- Flask-Migrate database migrations
- Log parser (`services/log_parser.py`)
- AI analysis service (`services/ai_analysis.py`)
- Full upload endpoint
- React frontend