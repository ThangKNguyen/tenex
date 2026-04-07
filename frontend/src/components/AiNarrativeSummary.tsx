/**
 * Prominent AI narrative card — the first thing an analyst should read
 * after the summary cards. Intentionally distinct from other panels so
 * the eye lands here before scrolling down to the raw table.
 *
 * Highlights users (emails) and departments inline so they jump out
 * while reading — analysts scan for names, not just keywords.
 */

import type { AiAnalysis, LogRow } from "@/types/log";

interface AiNarrativeSummaryProps {
  analysis: AiAnalysis;
  rows: LogRow[];
}

/**
 * Splits the narrative string into plain text and highlighted segments.
 * We highlight two things:
 *  - Email addresses (users) — cyan, monospace
 *  - Department names extracted from the log rows — yellow
 *
 * Strategy: build one regex that matches any known entity, then walk the
 * string left-to-right emitting either a plain or highlighted React node.
 */
function highlightEntities(text: string, users: string[], departments: string[]) {
  // Escape special regex characters in entity strings before building the pattern.
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Email regex covers the general case — users not extracted from rows still get highlighted.
  const emailPattern = "[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}";

  const entityPatterns = [
    emailPattern,
    ...users.filter(Boolean).map(escape),
    ...departments.filter(Boolean).map(escape),
  ];

  // Nothing to highlight — return the text as-is.
  if (entityPatterns.length === 0) {
    return [<span key="plain">{text}</span>];
  }

  const combined = new RegExp(`(${entityPatterns.join("|")})`, "gi");
  const parts = text.split(combined);

  const departmentSet = new Set(departments.map((d) => d.toLowerCase()));

  return parts.map((part, i) => {
    // Even indices are plain text between matches; odd indices are matches.
    if (i % 2 === 0) {
      return <span key={i}>{part}</span>;
    }

    const isEmail = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(part);
    const isDepartment = departmentSet.has(part.toLowerCase());

    if (isEmail) {
      return (
        <span key={i} className="font-mono text-accent-cyan bg-accent-cyan/10 px-1 rounded">
          {part}
        </span>
      );
    }

    if (isDepartment) {
      return (
        <span key={i} className="font-medium text-accent-yellow">
          {part}
        </span>
      );
    }

    // Matched by user pattern but not clearly an email or department — still highlight.
    return (
      <span key={i} className="font-mono text-accent-cyan bg-accent-cyan/10 px-1 rounded">
        {part}
      </span>
    );
  });
}

export function AiNarrativeSummary({ analysis, rows }: AiNarrativeSummaryProps) {
  const anomalyCount = analysis.anomalies.length;

  // Extract unique users and departments from the log rows.
  const users = [...new Set(rows.map((r) => r.user).filter(Boolean))] as string[];
  const departments = [...new Set(rows.map((r) => r.department).filter(Boolean))] as string[];

  const highlighted = highlightEntities(analysis.narrative, users, departments);

  return (
    <div className="bg-slate-900/60 border border-accent-cyan/20 rounded-xl px-6 py-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Pulse dot signals "live" AI output */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-accent-cyan">
            AI Analysis
          </span>
        </div>

        {anomalyCount > 0 && (
          <span className="text-[11px] font-mono bg-red-950/60 text-accent-red border border-red-900/40 px-2 py-0.5 rounded-full">
            {anomalyCount} {anomalyCount === 1 ? "anomaly" : "anomalies"} flagged
          </span>
        )}
      </div>

      {/* Narrative — slightly larger than body text, analyst reads this first */}
      <p className="text-text-primary leading-relaxed text-[15px]">
        {highlighted}
      </p>
    </div>
  );
}
