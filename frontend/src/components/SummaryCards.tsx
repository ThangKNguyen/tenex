/**
 * Summary stat cards — first thing the analyst reads after uploading.
 * Colored left border accent lets the eye quickly map color to meaning.
 */

import type { LogSummary } from "@/types/log";

interface SummaryCardsProps {
  summary: LogSummary;
  vertical?: boolean; // stack cards in a single column instead of a row
}

interface CardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "red" | "green" | "yellow";
}

function Card({ label, value, sub, accent = "cyan" }: CardProps) {
  const colors = {
    cyan:   { text: "text-accent-cyan",   border: "border-l-accent-cyan"   },
    red:    { text: "text-accent-red",    border: "border-l-accent-red"    },
    green:  { text: "text-accent-green",  border: "border-l-accent-green"  },
    yellow: { text: "text-accent-yellow", border: "border-l-accent-yellow" },
  };

  const c = colors[accent];

  return (
    <div className={`bg-bg-surface border border-slate-700 border-l-2 ${c.border} rounded-xl p-5`}>
      <p className="text-text-muted text-xs uppercase tracking-wider font-medium mb-2">{label}</p>
      <p className={`text-3xl font-semibold font-mono ${c.text}`}>{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

export function SummaryCards({ summary, vertical = false }: SummaryCardsProps) {
  const timeRange =
    summary.time_range?.start && summary.time_range?.end
      ? `${summary.time_range.start.slice(0, 10)} — ${summary.time_range.end.slice(0, 10)}`
      : "—";

  return (
    <div className={vertical ? "flex flex-col gap-4 h-full [&>*]:flex-1" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"}>
      <Card
        label="Total Requests"
        value={summary.total_requests.toLocaleString()}
        sub={timeRange}
      />
      <Card
        label="Blocked"
        value={`${summary.blocked_pct}%`}
        sub={`${summary.blocked_count} of ${summary.total_requests}`}
        accent="red"
      />
      <Card
        label="Threats"
        value={summary.threats_detected}
        sub={
          summary.threats_detected > 0
            ? `${summary.critical_threats} critical · ${summary.high_threats} high`
            : "none detected"
        }
        accent={summary.threats_detected > 0 ? "red" : "green"}
      />
      <Card
        label="Unique Users"
        value={summary.unique_users}
        sub={`${summary.unique_src_ips} source IPs`}
      />
      <Card
        label="Data Transferred"
        value={`${summary.data_transferred_mb} MB`}
        sub="sent + received"
      />
    </div>
  );
}
