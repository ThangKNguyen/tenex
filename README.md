# LogSentinel

A full-stack web application for SOC analysts to upload, parse, and analyze ZScaler Web Proxy log files. Includes JWT authentication, an AI-powered threat analysis pipeline via Google Gemini, and a dark analyst-focused dashboard.

**Live demo**: [https://tenex-neon.vercel.app](https://tenex-neon.vercel.app)

**Note:** I'm using a free version of Gemini API on the application, so there's a chance the AI analysis won't work if I run out of usage. In that case, please just refer to my video for demo or download this project locally and use your own API key. Thank you for your understanding!

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State / Data | TanStack Query, Zustand |
| Backend | Python, Flask |
| Auth | Flask-JWT-Extended, bcrypt |
| Database | PostgreSQL (Supabase) |
| ORM + Migrations | SQLAlchemy, Flask-Migrate |
| AI | Google Gemini API (gemini-2.5-flash-lite) |
| Deployment | Render (backend), Vercel (frontend), Supabase (database) |

---

## How It Works

1. User uploads a `.log`, `.txt`, or `.csv` file containing [ZScaler Web Proxy logs](https://help.zscaler.com/zia/nss-feed-output-format-web-logs)
2. Backend parses the log into structured rows and computes summary statistics (total requests, blocked %, threats by severity, data transferred, activity by hour)
3. All parsed rows are sent to Google Gemini for AI analysis
4. Results are displayed in a dashboard: summary cards, AI narrative, activity timeline, full log table with anomaly highlights, and a flagged anomalies panel

Three sample log files (`logexample.txt`, `logexample2.txt`, `logexample3.txt`) are included in the root directory for testing. They follow the ZScaler NSS feed output format.

---

## AI Anomaly Detection

Anomaly detection is handled entirely by **Google Gemini (gemini-2.5-flash-lite)**. No heuristic scoring or rule-based filtering is used for anomaly flagging — Gemini receives the full parsed log and returns both a narrative summary and per-row anomaly flags.

### Key design decision

Gemini analyzes the **entire** log file, not just blocked rows. This means it catches anomalies in allowed traffic too — large uploads that could be exfiltration, scripted access via curl, brute-force login attempts (repeated 401s), and off-hours activity. For example, `logexample2.txt` has only 4 blocked requests but Gemini flags 15 anomalies across both allowed and blocked traffic.

### What Gemini returns

For each flagged row:
- **row_index** — maps back to the exact position in the log table
- **reason** — plain-English explanation of why it's suspicious
- **confidence** — 0.0 to 1.0, how certain the model is
- **tags** — categorical labels (e.g. `malware`, `potential-exfiltration`, `brute-force`)

### Prompt

**System instruction:**
```
You are a senior SOC analyst reviewing ZScaler web proxy logs.
```

**User prompt:**
```
You will be given a complete JSON array of all log entries from a ZScaler web proxy log file.
Each entry has a "row_index" field — use that exact value in your anomaly output, not the
position in this array. Other fields: timestamp, user, department, src_ip, dst_ip, protocol,
url, action, reason, url_category, bytes_sent, bytes_received, http_method, response_code,
threat_name, risk_score, threat_severity, rule_applied.

Your job is to:
1. Write a concise plain-English narrative (5-7 sentences) summarizing what happened across
   the entire log file. Highlight the most important security events. Write it so a SOC
   analyst can read it in 10 seconds and know exactly what needs attention.
   Rules for the narrative:
   - Always refer to users by their email address, never by IP address.
   - Always flag repeated failed login attempts (HTTP 401 responses to the same endpoint
     in quick succession) as a brute force indicator.
   - Mention post-block uploads or outbound transfers from the same user/IP as potential
     exfiltration.

2. Identify anomalous entries across all rows — including allowed traffic. Look for:
   - High risk scores (>70) or critical/high threat severity
   - Malware, spyware, or suspicious domain access
   - Large data uploads (potential exfiltration), even if allowed
   - Unusual user agents (curl, scripts) accessing any URLs
   - Repeated blocked requests from the same user/IP
   - Access at unusual hours (outside 8am-6pm)
   - Suspicious cross-row patterns (e.g., block followed by large upload from same IP)

Return ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "narrative": "<plain English summary>",
  "anomalies": [
    {
      "row_index": <int, 0-based>,
      "reason": "<brief human-readable explanation>",
      "confidence": <float 0.0-1.0>,
      "tags": ["<tag1>", "<tag2>"]
    }
  ]
}

If no anomalies are found, return "anomalies": [].

Log entries:
{log_json}
```

### Limitations and scaling considerations

This prototype sends the **entire parsed log** to Gemini in a single prompt. This works well for small-to-medium logs like the included examples (5–20 rows), but breaks down with large log files because:

- **Token cost** — every row is serialized as JSON, so a 10,000-row log would consume a massive number of tokens per request
- **Context window** — Gemini has a finite context limit. Logs beyond a few hundred rows risk exceeding it, causing truncated or failed analysis

For production-scale log analysis, possible approaches include:

- **Chunked analysis** — split the log into batches (e.g. 100 rows each), run Gemini on each chunk, then use a final summarization pass to merge the per-chunk narratives and deduplicate anomalies
- **Pre-filter with heuristics** — use deterministic rules (high risk score, known bad categories, off-hours access) to flag candidate rows first, then only send those candidates + surrounding context to Gemini for deeper analysis
- **Embeddings + RAG** — embed each log row, retrieve the most relevant clusters, and send only those to Gemini with a focused prompt

---

## Local Setup

### Prerequisites
- Docker and Docker Compose
- A [Google Gemini API key](https://ai.google.dev/)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/ThangKNguyen/tenex.git
cd tenex

# 2. Copy and fill in environment variables
cp .env.example .env
# Set GEMINI_API_KEY and SECRET_KEY in .env

# 3. Start all services (Postgres, Flask backend, React frontend)
docker compose up --build

# App is live at:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:5000
```

### Manual setup (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set environment variables (or use a .env file)
export DATABASE_URL=postgresql://logsentinel:password@localhost:5432/logsentinel
export SECRET_KEY=your-secret-key
export GEMINI_API_KEY=your-gemini-key
export FLASK_APP=wsgi.py

flask db upgrade
flask run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment

- **Backend** — deployed on [Render](https://render.com) as a Docker web service. Gunicorn serves the Flask app, with `flask db upgrade` running on startup.
- **Database** — hosted on [Supabase](https://supabase.com) (PostgreSQL). Connected via session pooler for IPv4 compatibility with Render.
- **Frontend** — deployed on [Vercel](https://vercel.com). `VITE_API_URL` is set as a build-time environment variable pointing to the Render backend.
