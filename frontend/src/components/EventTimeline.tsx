/**
 * Bar chart showing requests by hour, split by allowed vs blocked.
 * Gives the analyst a quick read on when activity spiked and whether
 * those spikes were mostly blocks (bad) or allowed traffic.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LogSummary } from "@/types/log";

interface EventTimelineProps {
  summary: LogSummary;
}

// Match the design token colors from tailwind.config — Recharts doesn't
// read CSS variables so we pass the hex values directly.
const COLOR_ALLOWED = "#22c55e";
const COLOR_BLOCKED = "#ef4444";

export function EventTimeline({ summary }: EventTimelineProps) {
  const data = summary.requests_by_hour;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-surface border border-slate-700 rounded-xl px-6 py-5">
      <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-4">
        Activity Timeline
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1d27",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f1f5f9", fontFamily: "JetBrains Mono, monospace" }}
            itemStyle={{ color: "#94a3b8" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
          />
          <Bar dataKey="allowed" name="Allowed" fill={COLOR_ALLOWED} radius={[3, 3, 0, 0]} />
          <Bar dataKey="blocked" name="Blocked" fill={COLOR_BLOCKED} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
