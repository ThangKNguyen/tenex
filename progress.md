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

## v4 — Log Parser + Upload Endpoint (Milestone 2 complete)

### What was done
- Created `services/log_parser.py` — pure function `parse_zscaler_log(file_bytes) -> (rows, summary)`
  - Maps columns by fixed ZScaler NSS position order
  - Normalizes null sentinels ("None", "N/A", "NA", "") → None
  - Casts numeric fields (bytes, risk_score, response_code) to int
  - Converts ZScaler timestamp → ISO 8601
  - Builds summary stats: totals, blocked %, threats, top users, top categories, requests by hour
- Updated `routes/upload.py` — full `POST /upload` endpoint
  - JWT protected, validates file extension (.log, .txt, .csv)
  - Runs parser, saves result to `uploads` table, returns JSON
- Updated `logexample.txt` with 5 varied rows (blocked, allowed, malware, normal traffic)
- Tested end-to-end via Postman — all 5 rows parsed correctly, summary stats accurate

### Milestone 2 complete ✓
Upload log → parsed rows + summary returned, saved to DB

---

## v5 — React Frontend (Milestone 2 frontend complete)

### What was done
- Set up Vite + React 18 + TypeScript + Tailwind CSS + shadcn config
- Created `types/log.ts` — TypeScript types mirroring backend data shapes
- Created `lib/api.ts` — Axios instance with JWT interceptor auto-injecting auth header
- Created `store/authStore.ts` — Zustand store persisted to localStorage
- Created `App.tsx` — React Router with auth guard (redirect to /login if no token)
- Created `LoginPage.tsx` — login/register toggle, polished with shield icon and subtle background
- Created `UploadZone.tsx` — drag-and-drop file upload with spinner loading state
- Created `SummaryCards.tsx` — 5 stat cards with colored left border accents
- Created `LogTable.tsx` — full log table with:
  - Separate Date and Time columns
  - Action filter (All / Allowed / Blocked)
  - Click-to-expand rows showing secondary fields (user agent, protocol, bytes, etc.)
  - URL column truncated, full URL visible in expanded row
- Created `UploadHistory.tsx` — history drawer with file/threat icons and pill badges
- Created `DashboardPage.tsx` — main dashboard with:
  - History drawer toggled from navbar (doesn't take up main content space)
  - Empty state when no report loaded
  - View Logs ↓ toggle button
  - Spinner when loading history item
- Added `GET /uploads` and `GET /uploads/<id>` backend endpoints for history feature
- History persists across refreshes — reports saved to DB, reloadable from history drawer

### Not done yet
- Gemini AI analysis (`services/ai_analysis.py`)
- AI narrative + anomaly panel on frontend