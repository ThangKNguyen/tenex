/**
 * Panel listing all AI-flagged anomalies.
 *
 * Driven entirely by analysis.anomalies — includes any row the AI flagged,
 * not just blocked ones. Allowed rows can be anomalous too (e.g. large
 * uploads after a blocked malware hit).
 */

import { useState } from "react";
import type { AiAnalysis, LogRow } from "@/types/log";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 2;

interface AnomalyPanelProps {
  rows: LogRow[];
  analysis: AiAnalysis | null;
}

interface PolicyContext {
  watchFor: string;
  action: string;
}

// Generates contextual guidance from the row's structured fields.
// Used to enrich the "learn more" section for every flagged entry.
function buildPolicyContext(row: LogRow): PolicyContext {
  const reason = row.reason ?? "policy rule";
  const agent = row.user_agent ?? null;
  const isScriptAgent = agent !== null && /curl|python|wget|requests|go-http/i.test(agent);

  let watchFor = `Check whether ${row.user ?? "this user"} has repeated requests to the same category or destination.`;
  if (isScriptAgent) {
    watchFor += " Scripted user agents can indicate automated exfiltration or a compromised endpoint.";
  }

  let action = "Review the user's recent activity for patterns.";
  if (reason.toLowerCase().includes("productivity")) {
    action = "Confirm this is a one-off request and not a recurring pattern indicating policy circumvention.";
  } else if (reason.toLowerCase().includes("malware") || reason.toLowerCase().includes("spyware")) {
    action = "Investigate the endpoint immediately — escalate to incident response if the user was unaware.";
  } else if (isScriptAgent) {
    action = "Audit the process or script responsible for this request on the source machine.";
  } else if (row.action === "Allowed" && (row.bytes_sent ?? 0) > 100000) {
    action = "Verify the upload was intentional and authorised. Check if sensitive data was involved.";
  }

  return { watchFor, action };
}

export function AnomalyPanel({ rows, analysis }: AnomalyPanelProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  function toggleExpanded(rowIndex: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }

  const anomalies = analysis?.anomalies ?? [];

  if (anomalies.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(anomalies.length / PAGE_SIZE);
  const pageSlice = anomalies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-bg-surface border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Flagged Anomalies{" "}
          <span className="text-accent-red font-mono ml-1">{anomalies.length}</span>
        </h2>
      </div>

      <div className="divide-y divide-slate-800">
        {pageSlice.map((anomaly) => {
          const row = rows[anomaly.row_index];
          const confidencePct = Math.round(anomaly.confidence * 100);
          const ctx = row ? buildPolicyContext(row) : null;
          const isExpanded = expanded.has(anomaly.row_index);

          return (
            <div key={anomaly.row_index} className="px-6 py-5 min-h-[130px]">
              {/* Row identity + confidence badge */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-text-muted">Row {anomaly.row_index + 1}</span>
                    {row?.action && (
                      <span className={[
                        "text-[10px] font-mono px-1.5 py-0.5 rounded",
                        row.action === "Blocked"
                          ? "bg-red-950/50 text-accent-red"
                          : "bg-green-950/50 text-accent-green",
                      ].join(" ")}>
                        {row.action}
                      </span>
                    )}
                  </div>
                  {row && (
                    <p className="font-mono text-xs text-text-primary truncate mt-0.5">
                      {row.url ?? row.dst_ip ?? "—"}
                    </p>
                  )}
                  {row?.user && (
                    <p className="text-xs text-text-muted mt-0.5">{row.user}</p>
                  )}
                </div>

                <span className={[
                  "shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full border",
                  confidencePct >= 80
                    ? "bg-red-950/50 text-accent-red border-red-900/40"
                    : confidencePct >= 50
                    ? "bg-yellow-950/50 text-accent-yellow border-yellow-900/40"
                    : "bg-slate-800 text-text-muted border-slate-700",
                ].join(" ")}>
                  {confidencePct}%
                </span>
              </div>

              {/* AI reason — always visible */}
              <p className="text-sm text-text-muted leading-relaxed mb-3">
                {anomaly.reason}
              </p>

              {/* Expanded: confidence bar, tags, contextual guidance */}
              {isExpanded && (
                <div className="space-y-3 mb-3">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={[
                        "h-full rounded-full",
                        confidencePct >= 80 ? "bg-accent-red"
                          : confidencePct >= 50 ? "bg-accent-yellow"
                          : "bg-slate-600",
                      ].join(" ")}
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>

                  {anomaly.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {anomaly.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono bg-slate-800 text-text-muted px-2 py-0.5 rounded border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {ctx && (
                    <>
                      <ContextLine label="Watch for" value={ctx.watchFor} />
                      <ContextLine label="Recommended action" value={ctx.action} />
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => toggleExpanded(anomaly.row_index)}
                className="text-[11px] text-accent-cyan hover:text-accent-cyan/80 transition-colors"
              >
                {isExpanded ? "Show less ↑" : "Learn more ↓"}
              </button>
            </div>
          );
        })}

        {/* Placeholder slots to keep panel height stable across pages */}
        {Array.from({ length: PAGE_SIZE - pageSlice.length }).map((_, i) => (
          <div key={`placeholder-${i}`} className="min-h-[130px]" aria-hidden />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p className="text-sm text-text-muted leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}
