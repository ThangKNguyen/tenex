/**
 * Upload history panel — rendered inside the drawer in DashboardPage.
 * Clicking an item loads the full report without re-uploading.
 */

interface HistoryItem {
  upload_id: string;
  filename: string;
  uploaded_at: string;
  summary: {
    total_requests: number;
    blocked_pct: number;
    threats_detected: number;
  } | null;
}

interface UploadHistoryProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function UploadHistory({ items, selectedId, onSelect }: UploadHistoryProps) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-3 text-lg">
          📂
        </div>
        <p className="text-text-muted text-sm">No uploads yet.</p>
        <p className="text-text-muted text-xs mt-1">Upload a log file to get started.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-800/60">
      {items.map((item) => {
        const isSelected = selectedId === item.upload_id;
        const hasThreats = (item.summary?.threats_detected ?? 0) > 0;

        return (
          <li key={item.upload_id}>
            <button
              onClick={() => onSelect(item.upload_id)}
              className={[
                "w-full text-left px-5 py-4 transition-all",
                isSelected
                  ? "bg-cyan-950/20 border-l-2 border-accent-cyan"
                  : "hover:bg-white/[0.03] border-l-2 border-transparent",
              ].join(" ")}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-0.5 shrink-0">
                  {hasThreats ? "🔴" : "📄"}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? "text-accent-cyan" : "text-text-primary"}`}>
                    {item.filename}
                  </p>
                  <p className="text-text-muted text-[11px] font-mono mt-0.5">
                    {new Date(item.uploaded_at).toLocaleString()}
                  </p>
                  {item.summary && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] bg-slate-800 text-text-muted px-1.5 py-0.5 rounded font-mono">
                        {item.summary.total_requests} req
                      </span>
                      <span className="text-[10px] bg-red-950/40 text-accent-red px-1.5 py-0.5 rounded font-mono">
                        {item.summary.blocked_pct}% blocked
                      </span>
                      {hasThreats && (
                        <span className="text-[10px] bg-yellow-950/40 text-accent-yellow px-1.5 py-0.5 rounded font-mono">
                          {item.summary.threats_detected} threat{item.summary.threats_detected !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
