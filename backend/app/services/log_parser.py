"""
ZScaler Web Proxy log parser.

Pure function — no Flask dependencies. Only knows about bytes in → (rows, summary) out.
Easy to unit test in isolation and easy to swap log formats later.
"""

import csv
import io
from datetime import datetime
from collections import Counter, defaultdict
from typing import Any


# Fixed ZScaler NSS feed column order.
# ZScaler doesn't output a header row by default so we map by position.
ZSCALER_COLUMNS = [
    "timestamp", "user", "protocol", "url", "action", "appname", "appclass",
    "bytes_sent", "bytes_received", "unused1", "unused2", "reason",
    "url_category", "url_super_category", "threat_name", "malware_category",
    "risk_score", "threat_severity", "malware_class", "location",
    "department", "src_ip", "dst_ip", "http_method", "response_code",
    "user_agent", "referer", "rule_type", "rule_applied",
    "forwarding_method", "ssl_decrypted", "url_class", "url_cat_method", "action2",
]

# ZScaler outputs these strings when a field has no value — normalize them to None.
NULL_SENTINELS = {"None", "N/A", "NA", ""}

# Fields that should be cast to int — everything else stays as a string.
INT_FIELDS = {"bytes_sent", "bytes_received", "risk_score", "response_code", "unused1", "unused2"}


def _normalize(field_name: str, value: str) -> Any:
    """
    Normalize a single raw CSV field.
    - Sentinel strings → None
    - Numeric fields → int (None if non-numeric)
    - Everything else → stripped string
    """
    stripped = value.strip()

    if stripped in NULL_SENTINELS:
        return None

    if field_name in INT_FIELDS:
        try:
            return int(stripped)
        except ValueError:
            return None

    return stripped


def _parse_timestamp(raw: str) -> str | None:
    """
    Convert ZScaler's timestamp format ("Mon Jun 20 15:29:11 2022") to ISO 8601.
    Returns None if unparseable rather than crashing the whole parse run.
    """
    if not raw:
        return None

    try:
        dt = datetime.strptime(raw.strip(), "%a %b %d %H:%M:%S %Y")
        return dt.isoformat()
    except ValueError:
        return None


def _looks_like_header(first_row: list[str]) -> bool:
    """
    Heuristic: if the first field of the first row doesn't parse as a ZScaler
    timestamp, assume the file has a header row and skip it.
    """
    if not first_row:
        return False

    return _parse_timestamp(first_row[0]) is None


def _build_summary(rows: list[dict]) -> dict:
    """
    Compute aggregate stats from the parsed rows.
    Pre-computed here so the frontend just renders values without recalculating.
    """
    if not rows:
        return {
            "total_requests": 0,
            "time_range": None,
            "unique_users": 0,
            "unique_src_ips": 0,
            "blocked_count": 0,
            "allowed_count": 0,
            "blocked_pct": 0.0,
            "threats_detected": 0,
            "critical_threats": 0,
            "high_threats": 0,
            "top_blocked_users": [],
            "top_categories": [],
            "requests_by_hour": [],
            "data_transferred_mb": 0.0,
        }

    timestamps = sorted(r["timestamp"] for r in rows if r["timestamp"])

    blocked_count = sum(1 for r in rows if r.get("action") == "Blocked")
    allowed_count = sum(1 for r in rows if r.get("action") == "Allowed")
    total = len(rows)

    # Count by severity so all three numbers use the same criteria.
    # threat_name alone is unreliable — some high-severity rows (e.g. curl-based
    # suspicious access) have a severity set but no specific threat_name populated.
    critical_threats = sum(
        1 for r in rows
        if r.get("threat_severity") and r["threat_severity"].lower() == "critical"
    )
    high_threats = sum(
        1 for r in rows
        if r.get("threat_severity") and r["threat_severity"].lower() == "high"
    )
    threats_detected = critical_threats + high_threats

    blocked_user_counts: Counter = Counter()
    for r in rows:
        if r.get("action") == "Blocked" and r.get("user"):
            blocked_user_counts[r["user"]] += 1

    top_blocked_users = [
        {"user": user, "count": count}
        for user, count in blocked_user_counts.most_common(5)
    ]

    category_counts: Counter = Counter()
    for r in rows:
        if r.get("url_category"):
            category_counts[r["url_category"]] += 1

    top_categories = [
        {"category": cat, "count": count}
        for cat, count in category_counts.most_common(5)
    ]

    # Group by hour for the bar chart — "2022-06-20T15:29:11" → "15:00"
    hour_buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"allowed": 0, "blocked": 0})
    for r in rows:
        if r.get("timestamp"):
            hour_key = r["timestamp"][11:13] + ":00"
            if r.get("action") == "Allowed":
                hour_buckets[hour_key]["allowed"] += 1
            elif r.get("action") == "Blocked":
                hour_buckets[hour_key]["blocked"] += 1

    requests_by_hour = [
        {"hour": hour, "allowed": counts["allowed"], "blocked": counts["blocked"]}
        for hour, counts in sorted(hour_buckets.items())
    ]

    total_bytes = sum(
        (r.get("bytes_sent") or 0) + (r.get("bytes_received") or 0) for r in rows
    )

    return {
        "total_requests": total,
        "time_range": {
            "start": timestamps[0] if timestamps else None,
            "end": timestamps[-1] if timestamps else None,
        },
        "unique_users": len({r.get("user") for r in rows if r.get("user")}),
        "unique_src_ips": len({r.get("src_ip") for r in rows if r.get("src_ip")}),
        "blocked_count": blocked_count,
        "allowed_count": allowed_count,
        "blocked_pct": round((blocked_count / total) * 100, 1) if total > 0 else 0.0,
        "threats_detected": threats_detected,
        "critical_threats": critical_threats,
        "high_threats": high_threats,
        "top_blocked_users": top_blocked_users,
        "top_categories": top_categories,
        "requests_by_hour": requests_by_hour,
        "data_transferred_mb": round(total_bytes / (1024 * 1024), 2),
    }


def parse_zscaler_log(file_bytes: bytes) -> tuple[list[dict], dict]:
    """
    Parse a ZScaler NSS Web Proxy log file.

    Args:
        file_bytes: Raw bytes of the uploaded log file.

    Returns:
        (rows, summary) tuple.

    Raises:
        ValueError: if the file is empty or has no parseable rows.
    """
    text = file_bytes.decode("utf-8", errors="replace")
    all_rows = list(csv.reader(io.StringIO(text)))

    if not all_rows:
        raise ValueError("Log file is empty")

    # Skip header row if detected.
    start_index = 1 if _looks_like_header(all_rows[0]) else 0
    data_rows = all_rows[start_index:]

    if not data_rows:
        raise ValueError("Log file contains no data rows")

    parsed_rows = []
    for raw_row in data_rows:
        # Skip clearly malformed rows.
        if len(raw_row) < 5:
            continue

        row: dict[str, Any] = {}
        for i, col_name in enumerate(ZSCALER_COLUMNS):
            if i < len(raw_row):
                row[col_name] = _normalize(col_name, raw_row[i])
            else:
                row[col_name] = None

        # Overwrite timestamp with parsed ISO 8601 version.
        row["timestamp"] = _parse_timestamp(raw_row[0]) if raw_row else None

        # Drop internal ZScaler columns that add noise in the UI.
        row.pop("unused1", None)
        row.pop("unused2", None)

        parsed_rows.append(row)

    summary = _build_summary(parsed_rows)
    return parsed_rows, summary
