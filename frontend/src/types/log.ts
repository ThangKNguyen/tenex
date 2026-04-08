/**
 * TypeScript types mirroring the backend's data shapes.
 * Single source of truth for the frontend — if the API changes, update here.
 */

export interface LogRow {
  timestamp: string | null;
  user: string | null;
  department: string | null;
  src_ip: string | null;
  dst_ip: string | null;
  protocol: string | null;
  url: string | null;
  action: "Allowed" | "Blocked" | string | null;
  reason: string | null;
  url_category: string | null;
  bytes_sent: number | null;
  bytes_received: number | null;
  http_method: string | null;
  response_code: number | null;
  user_agent: string | null;
  threat_name: string | null;
  risk_score: number | null;
  threat_severity: string | null;
  rule_applied: string | null;
}

export interface LogSummary {
  total_requests: number;
  time_range: { start: string | null; end: string | null } | null;
  unique_users: number;
  unique_src_ips: number;
  blocked_count: number;
  allowed_count: number;
  blocked_pct: number;
  threats_detected: number;
  critical_threats: number;
  high_threats: number;
  top_blocked_users: { user: string; count: number }[];
  top_categories: { category: string; count: number }[];
  requests_by_hour: { hour: string; allowed: number; blocked: number }[];
  data_transferred_mb: number;
}

export interface Anomaly {
  row_index: number;
  reason: string;
  confidence: number; // 0.0–1.0
  tags: string[];
}

export interface AiAnalysis {
  narrative: string;
  anomalies: Anomaly[];
}

export interface UploadResult {
  upload_id: string;
  filename?: string;
  uploaded_at?: string;
  summary: LogSummary;
  rows: LogRow[];
  ai_analysis: AiAnalysis | null;
}
