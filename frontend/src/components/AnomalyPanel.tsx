/**
 * Panel listing all blocked rows, enriched with AI analysis where available.
 *
 * Each row shows a brief summary by default. A "Learn more" toggle reveals
 * the full context — concern, watch for, recommended action, confidence bar,
 * and tags — so the panel stays scannable at a glance.
 */

import { useState } from "react";
import type { AiAnalysis, LogRow } from "@/types/log";

interface AnomalyPanelProps {
  rows: LogRow[];
  analysis: AiAnalysis | null;
}

interface PolicyContext {
  concern: string;
  watchFor: string;
  action: string;
}

function buildPolicyContext(row: LogRow): PolicyContext {
  const category = row.url_category ?? "unknown category";
  const reason = row.reason ?? "policy rule";
  const agent = row.user_agent ?? null;
  const isScriptAgent = agent !== null && /curl|python|wget|requests|go-http/i.test(agent);
  const isHttpNotHttps = row.protocol === "HTTP";

  let concern = `This destination falls under "${category}".`;
  if (isScriptAgent) {
    concern += ` The request was made with a scripted client (${agent}), which may indicate automated activity rather than a browser.`;
  } else if (isHttpNotHttps) {
    concern += " The request used unencrypted HTTP, which can expose credentials or session data in transit.";
  }

  let watchFor = `Check whether ${row.user ?? "this user"} has repeated requests to the same category or destination.`;
  if (isScriptAgent) {
    watchFor += " Scripted user agents accessing blocked domains can indicate exfiltration attempts or compromised endpoints running malicious scripts.";
  }

  let action = "Review the user's recent activity for patterns.";
  if (reason.toLowerCase().includes("productivity")) {
    action = "Confirm this is a one-off request and not a recurring pattern that indicates policy circumvention.";
  } else if (reason.toLowerCase().includes("malware") || reason.toLowerCase().includes("spyware")) {
    action = "Investigate the endpoint immediately — escalate to incident response if the user was not aware of the request.";
  } else if (isScriptAgent) {
    action = "Audit the process or script responsible for this request on the source machine.";
  }

  return { concern, watchFor, action };
}

export function AnomalyPanel({ rows, analysis }: AnomalyPanelProps) {
  // Tracks which row indices have their details expanded.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpanded(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  const aiByIndex = new Map(
    (analysis?.anomalies ?? []).map((a) => [a.row_index, a])
  );

  const blockedRows = rows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.action === "Blocked");

  if (blockedRows.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-surface border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Blocked Requests{" "}
          <span className="text-accent-red font-mono ml-1">{blockedRows.length}</span>
        </h2>
      </div>

      <div className="divide-y divide-slate-800">
        {blockedRows.map(({ row, idx }) => {
          const aiAnomaly = aiByIndex.get(idx);
          const confidencePct = aiAnomaly ? Math.round(aiAnomaly.confidence * 100) : null;
          const ctx = buildPolicyContext(row);
          const isExpanded = expanded.has(idx);

          // The single summary line shown collapsed — AI reason if available,
          // otherwise a plain "what happened" derived from the row fields.
          const summary = aiAnomaly?.reason
            ?? `Request to ${row.url ?? row.dst_ip ?? "unknown"} was blocked by ${(row.reason ?? "policy rule").toLowerCase()}.`;

          return (
            <div key={idx} className="px-6 py-5">
              {/* Row identity + confidence badge */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <span className="font-mono text-[11px] text-text-muted">Row {idx + 1}</span>
                  <p className="font-mono text-xs text-text-primary truncate mt-0.5">
                    {row.url ?? row.dst_ip ?? "—"}
                  </p>
                  {row.user && (
                    <p className="text-xs text-text-muted mt-0.5">{row.user}</p>
                  )}
                </div>

                {confidencePct !== null ? (
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
                ) : (
                  <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full border bg-slate-800 text-text-muted border-slate-700">
                    Policy block
                  </span>
                )}
              </div>

              {/* Summary — always visible */}
              <p className="text-sm text-text-muted leading-relaxed mb-3">{summary}</p>

              {/* Expanded details */}
              {isExpanded && (
                <div className="space-y-3 mb-3">
                  {/* Confidence bar + tags — AI rows only */}
                  {aiAnomaly && (
                    <>
                      {confidencePct !== null && (
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
                      )}
                      {aiAnomaly.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {aiAnomaly.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono bg-slate-800 text-text-muted px-2 py-0.5 rounded border border-slate-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Contextual guidance — all blocked rows */}
                  {!aiAnomaly && <ContextLine label="Potential concern" value={ctx.concern} />}
                  <ContextLine label="Watch for" value={ctx.watchFor} />
                  <ContextLine label="Recommended action" value={ctx.action} />
                </div>
              )}

              {/* Learn more / Show less toggle */}
              <button
                onClick={() => toggleExpanded(idx)}
                className="text-[11px] text-accent-cyan hover:text-accent-cyan/80 transition-colors"
              >
                {isExpanded ? "Show less ↑" : "Learn more ↓"}
              </button>
            </div>
          );
        })}
      </div>
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
