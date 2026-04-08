"""
AI analysis service — wraps Google Gemini.

Isolated as a single function so the upload route doesn't need to know
anything about Gemini internals. Easy to mock in tests and easy to disable
gracefully if the API is unavailable.
"""

import json
from google import genai
from google.genai import types


# Only send fields the prompt actually uses — trimming irrelevant columns
# reduces token count and lowers the chance of the model fixating on noise.
_RELEVANT_FIELDS = {
    "timestamp", "user", "department", "src_ip", "dst_ip", "protocol",
    "url", "action", "reason", "url_category", "bytes_sent",
    "bytes_received", "http_method", "response_code", "threat_name",
    "risk_score", "threat_severity", "rule_applied",
}

_SYSTEM_INSTRUCTION = "You are a senior SOC analyst reviewing ZScaler web proxy logs."

# All rows are sent so the narrative has full context and anomaly detection
# can catch cross-row patterns (e.g. allowed upload after a blocked malware hit).
# row_index is embedded explicitly so Gemini's output maps back to the correct
# position in the original unfiltered table regardless of array position.
_PROMPT_TEMPLATE = """\
You will be given a complete JSON array of all log entries from a ZScaler web proxy log file.
Each entry has a "row_index" field — use that exact value in your anomaly output, not the position in this array.
Other fields: timestamp, user, department, src_ip, dst_ip, protocol, url, action,
reason, url_category, bytes_sent, bytes_received, http_method,
response_code, threat_name, risk_score, threat_severity, rule_applied.

Your job is to:
1. Write a concise plain-English narrative (5-7 sentences) summarizing
   what happened across the entire log file. Highlight the most important security
   events. Write it so a SOC analyst can read it in 10 seconds and know
   exactly what needs attention.
   Rules for the narrative:
   - Always refer to users by their email address, never by IP address.
   - Always flag repeated failed login attempts (HTTP 401 responses to the same endpoint in quick succession) as a brute force indicator.
   - Mention post-block uploads or outbound transfers from the same user/IP as potential exfiltration.

2. Identify anomalous entries across all rows — including allowed traffic. Look for:
   - High risk scores (>70) or critical/high threat severity
   - Malware, spyware, or suspicious domain access
   - Large data uploads (potential exfiltration), even if allowed
   - Unusual user agents (curl, scripts) accessing any URLs
   - Repeated blocked requests from the same user/IP
   - Access at unusual hours (outside 8am-6pm)
   - Suspicious cross-row patterns (e.g., block followed by large upload from same IP)

Return ONLY a JSON object (no markdown, no explanation) in this exact format:
{{
  "narrative": "<plain English summary>",
  "anomalies": [
    {{
      "row_index": <int, 0-based>,
      "reason": "<brief human-readable explanation>",
      "confidence": <float 0.0-1.0>,
      "tags": ["<tag1>", "<tag2>"]
    }}
  ]
}}

If no anomalies are found, return "anomalies": [].

Log entries:
{log_json}"""


def analyze_log(rows: list[dict]) -> dict:
    """
    Send all parsed log rows to Gemini and return AI analysis.

    Sends the full log so the narrative has complete context and anomaly
    detection can catch cross-row patterns across allowed and blocked traffic.

    Args:
        rows: Parsed log rows from log_parser.parse_zscaler_log().

    Returns:
        Dict with "narrative" (str) and "anomalies" (list) keys.

    Raises:
        ValueError: If Gemini returns something that isn't valid JSON.
    """
    if not rows:
        return {"narrative": "Log file contained no rows.", "anomalies": []}

    client = genai.Client()

    # Embed row_index explicitly in each row so Gemini's anomaly output
    # always references the correct original position in the table.
    trimmed_rows = []
    for idx, row in enumerate(rows):
        trimmed = {k: v for k, v in row.items() if k in _RELEVANT_FIELDS}
        trimmed["row_index"] = idx
        trimmed_rows.append(trimmed)

    prompt = _PROMPT_TEMPLATE.format(log_json=json.dumps(trimmed_rows, indent=2))

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_INSTRUCTION,
        ),
        contents=prompt,
    )

    raw_text = response.text.strip()

    # Gemini sometimes wraps the JSON in a markdown code fence despite
    # explicit instructions not to — strip it if present.
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        inner = lines[1:]
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        raw_text = "\n".join(inner)

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON response: {raw_text[:300]}") from exc
