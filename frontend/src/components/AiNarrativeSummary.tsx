/**
 * Prominent AI narrative card — the first thing an analyst should read
 * after the summary cards. Intentionally distinct from other panels so
 * the eye lands here before scrolling down to the raw table.
 *
 * Highlights users (emails) and departments inline so they jump out
 * while reading — analysts scan for names, not just keywords.
 */

import type { AiAnalysis } from "@/types/log";

interface AiNarrativeSummaryProps {
  analysis: AiAnalysis;
}

const EMAIL_REGEX = /([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;

// Splits narrative text and wraps email addresses in a cyan highlight.
function highlightEmails(text: string) {
  const parts = text.split(EMAIL_REGEX);
  return parts.map((part, i) =>
    EMAIL_REGEX.test(part) ? (
      <span key={i} className="font-mono text-accent-cyan bg-accent-cyan/10 px-1 rounded">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function AiNarrativeSummary({ analysis }: AiNarrativeSummaryProps) {
  const anomalyCount = analysis.anomalies.length;

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
        {highlightEmails(analysis.narrative)}
      </p>
    </div>
  );
}
