/**
 * Reusable pagination controls.
 * Kept intentionally minimal — prev/next arrows + "Page X of Y".
 */

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
      >
        ← Prev
      </button>

      <span className="text-[11px] font-mono text-text-muted">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
      >
        Next →
      </button>
    </div>
  );
}
