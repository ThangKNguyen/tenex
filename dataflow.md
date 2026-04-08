```
                                    DATA FLOW
                                    =========

  ┌─────────────────────────────────── FRONTEND ───────────────────────────────────┐
  │                                                                                │
  │   User drops file                                                              │
  │        │                                                                       │
  │        ▼                                                                       │
  │   UploadZone.tsx ──► DashboardPage.tsx ──► api.ts                              │
  │                      (uploadMutation)      (axios + JWT)                       │
  │                                               │                                │
  └───────────────────────────────────────────────┼────────────────────────────────┘
                                                  │
                                         POST /upload (FormData)
                                                  │
  ┌───────────────────────────────────────────────┼────────────────────────────────┐
  │                                               ▼                 BACKEND        │
  │                                                                                │
  │   routes/upload.py ─── validates file extension                                │
  │        │                                                                       │
  │        ▼                                                                       │
  │   log_parser.py ────── parse CSV → structured rows + summary stats             │
  │        │                                                                       │
  │        ▼                                                                       │
  │   ai_analysis.py ──── sends all rows to Gemini ──────────► Google Gemini API   │
  │        │                                          ◄──────── {narrative,         │
  │        │                                                     anomalies}         │
  │        ▼                                                                       │
  │   models/upload.py ── saves to PostgreSQL (JSONB)                              │
  │        │                                    │                                  │
  │        │                                    ▼                                  │
  │        │                              ┌──────────┐                             │
  │        │                              │ Supabase │                             │
  │        │                              │ Postgres │                             │
  │        │                              └──────────┘                             │
  │        ▼                                                                       │
  │   JSON response: { summary, rows, ai_analysis }                                │
  │                                                                                │
  └───────────────────────────────────────────────┬────────────────────────────────┘
                                                  │
                                            JSON response
                                                  │
  ┌───────────────────────────────────────────────┼────────────────────────────────┐
  │                                               ▼                 FRONTEND       │
  │                                                                                │
  │   DashboardPage.tsx receives result, passes data to:                           │
  │                                                                                │
  │        result.summary ──────────────► SummaryCards.tsx                          │
  │                                       (requests, blocked %, threats)            │
  │                                                                                │
  │        result.ai_analysis.narrative ► AiNarrativeSummary.tsx                   │
  │                                       (plain-English AI paragraph)             │
  │                                                                                │
  │        result.summary ──────────────► EventTimeline.tsx                         │
  │                                       (bar chart: allowed vs blocked by hour)  │
  │                                                                                │
  │        result.ai_analysis.anomalies ► AnomalyPanel.tsx                         │
  │                                       (flagged rows + reason + confidence)     │
  │                                                                                │
  │        result.rows + anomalies ─────► LogTable.tsx                              │
  │                                       (full table, red highlights on flagged)  │
  │                                                                                │
  └────────────────────────────────────────────────────────────────────────────────┘
```
