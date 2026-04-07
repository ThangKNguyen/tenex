/**
 * Full parsed log table with action filter and expandable rows.
 *
 * Always visible columns: Time, User, Action, URL, Category, Threat, Threat Severity, Risk, Src IP, Dst IP, Reason, User Agent.
 * Clicking a row expands it to show all remaining fields — keeps the table
 * scannable while still surfacing every piece of data.
 */

import { useState } from "react";
import type { Anomaly, LogRow } from "@/types/log";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 5;

interface LogTableProps {
  rows: LogRow[];
  // Anomalies from AI analysis — used to highlight flagged rows.
  // Optional so the table still works when AI analysis is unavailable.
  anomalies?: Anomaly[];
}

type ActionFilter = "all" | "Allowed" | "Blocked";

// Fields already shown as columns — excluded from the expanded detail view
// to avoid showing the same data twice.
const PRIMARY_FIELDS = new Set([
  "timestamp", "user", "action",
  "threat_name", "threat_severity", "risk_score", "src_ip",
  "dst_ip", "reason",
]);

export function LogTable({ rows, anomalies = [] }: LogTableProps) {
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const anomalyByIndex = new Map(anomalies.map((a) => [a.row_index, a]));

  const filtered = filter === "all" ? rows : rows.filter((r) => r.action === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever the filter changes so we don't land on an empty page.
  function handleFilter(f: ActionFilter) {
    setFilter(f);
    setPage(1);
    setExpandedIdx(null);
  }

  function toggleRow(idx: number) {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className="bg-bg-surface border border-slate-700 rounded-xl overflow-hidden">

      {/* Header + filter */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Log Entries{" "}
          <span className="text-text-primary font-mono ml-1">{filtered.length}</span>
          {totalPages > 1 && (
            <span className="text-text-muted font-mono ml-2 text-xs normal-case tracking-normal">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} shown
            </span>
          )}
        </h2>
        <div className="flex gap-1 bg-bg-primary rounded-lg p-1">
          {(["all", "Allowed", "Blocked"] as ActionFilter[]).map((opt) => (
            <button
              key={opt}
              onClick={() => handleFilter(opt)}
              className={[
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                filter === opt ? "bg-bg-surface text-text-primary" : "text-text-muted hover:text-text-primary",
              ].join(" ")}
            >
              {opt === "all" ? "All" : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 sticky top-0 bg-bg-surface z-10">
              {/* Empty header for the expand chevron column */}
              <th className="w-8" />
              {[
                "Date", "Time", "User", "Action", "URL",
                "Threat", "Severity", "Risk", "Src IP", "Dst IP", "Reason",
              ].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-text-muted font-medium uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((row, filteredIdx) => {
              const originalIdx = rows.indexOf(row);
              const anomaly = anomalyByIndex.get(originalIdx);
              const isFlagged = anomaly !== undefined;

              return (
              <>
                {/* Main row — red left border + tinted bg when anomalous */}
                <tr
                  key={`row-${originalIdx}`}
                  onClick={() => toggleRow(filteredIdx)}
                  title={isFlagged ? `⚠ ${anomaly.reason} (${Math.round(anomaly.confidence * 100)}% confidence)` : undefined}
                  className={[
                    "border-b border-slate-800 cursor-pointer transition-colors",
                    isFlagged
                      ? "bg-red-950/20 border-l-2 border-l-accent-red"
                      : expandedIdx === filteredIdx
                      ? "bg-slate-800/40"
                      : filteredIdx % 2 !== 0
                      ? "bg-white/[0.01]"
                      : "",
                    "hover:bg-white/[0.03]",
                  ].join(" ")}
                >
                  {/* Expand chevron — shows ⚠ instead when row is anomalous */}
                  <td className="pl-4 pr-1 py-3 text-text-muted">
                    {isFlagged ? (
                      <span className="text-accent-red text-xs">⚠</span>
                    ) : (
                      <span className={`inline-block transition-transform ${expandedIdx === filteredIdx ? "rotate-90" : ""}`}>
                        ›
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono text-text-muted whitespace-nowrap">
                    {row.timestamp ? row.timestamp.slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted whitespace-nowrap">
                    {row.timestamp ? row.timestamp.slice(11, 19) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-primary max-w-[140px] truncate">
                    {row.user ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={[
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      row.action === "Allowed" ? "bg-green-950/50 text-accent-green" :
                      row.action === "Blocked" ? "bg-red-950/50 text-accent-red" :
                      "bg-slate-800 text-text-muted",
                    ].join(" ")}>
                      {row.action ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted w-[120px] max-w-[120px] truncate">
                    {row.url ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.threat_name
                      ? <span className="text-accent-red">{row.threat_name}</span>
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.threat_severity
                      ? <span className={
                          row.threat_severity.toLowerCase() === "critical" ? "text-accent-red" :
                          row.threat_severity.toLowerCase() === "high" ? "text-accent-yellow" :
                          "text-text-muted"
                        }>{row.threat_severity}</span>
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {row.risk_score !== null ? (
                      <span className={
                        row.risk_score >= 70 ? "text-accent-red" :
                        row.risk_score >= 40 ? "text-accent-yellow" :
                        "text-text-muted"
                      }>
                        {row.risk_score}
                      </span>
                    ) : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted">{row.src_ip ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{row.dst_ip ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted max-w-[160px] truncate">{row.reason ?? "—"}</td>
                </tr>

                {/* Expanded detail row — shows all remaining fields as key/value pairs */}
                {expandedIdx === filteredIdx && (
                  <tr key={`expanded-${originalIdx}`} className="border-b border-slate-800 bg-slate-900/50">
                    <td colSpan={12} className="px-8 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                        {Object.entries(row)
                          .filter(([key, val]) => !PRIMARY_FIELDS.has(key) && val !== null)
                          .map(([key, val]) => (
                            <div key={key}>
                              <span className="text-text-muted text-[10px] uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
                              <p className="text-text-primary font-mono text-xs mt-0.5 truncate">{String(val)}</p>
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-10">No rows match this filter.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
