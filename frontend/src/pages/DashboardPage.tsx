/**
 * Main dashboard after login.
 *
 * History is hidden by default and toggled via a navbar button.
 * It slides in as an overlay drawer so it never displaces the main content.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import { UploadZone } from "@/components/UploadZone";
import { SummaryCards } from "@/components/SummaryCards";
import { LogTable } from "@/components/LogTable";
import { UploadHistory } from "@/components/UploadHistory";
import type { UploadResult } from "@/types/log";

export default function DashboardPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [showLogs, setShowLogs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const { data } = await apiClient.get("/uploads");
      return data as UploadResult[];
    },
  });

  const detailQuery = useQuery({
    queryKey: ["upload", selectedId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/uploads/${selectedId}`);
      return data as UploadResult;
    },
    enabled: selectedId !== null,
  });

  const uploadMutation = useMutation<UploadResult, AxiosError<{ error: string }>, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await apiClient.post<UploadResult>("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      setSelectedId(data.upload_id);
      setShowLogs(false);
      historyQuery.refetch();
    },
  });

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleSelectHistory(id: string) {
    setSelectedId(id);
    setShowLogs(false);
    setShowHistory(false); // close drawer after selecting
  }

  const result = selectedId ? detailQuery.data : uploadMutation.data;

  return (
    <div className="min-h-screen bg-bg-primary">

      {/* Navbar */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-bg-primary z-30">
        <h1 className="text-lg font-semibold tracking-tight">
          Log<span className="text-accent-cyan">Sentinel</span>
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`text-sm transition-colors ${showHistory ? "text-accent-cyan" : "text-text-muted hover:text-text-primary"}`}
          >
            History
            {historyQuery.data?.length ? (
              <span className="ml-1.5 text-[10px] bg-slate-700 text-text-muted font-mono px-1.5 py-0.5 rounded-full">
                {historyQuery.data.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={handleLogout}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* History drawer — slides in from the right as an overlay */}
      {showHistory && (
        <>
          {/* Backdrop — clicking it closes the drawer */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowHistory(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-72 z-50 bg-bg-surface border-l border-slate-700 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <p className="text-sm font-medium text-text-primary">Upload History</p>
              <button
                onClick={() => setShowHistory(false)}
                className="text-text-muted hover:text-text-primary text-lg leading-none"
              >
                ×
              </button>
            </div>
            <UploadHistory
              items={historyQuery.data ?? []}
              selectedId={selectedId}
              onSelect={handleSelectHistory}
            />
          </aside>
        </>
      )}

      {/* Main content — full width always */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <UploadZone
          onFile={(file) => uploadMutation.mutate(file)}
          isLoading={uploadMutation.isPending}
        />

        {uploadMutation.isError && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl px-5 py-4">
            <p className="text-accent-red text-sm font-medium">Upload failed</p>
            <p className="text-text-muted text-sm mt-1">
              {uploadMutation.error.response?.data?.error ?? "Invalid file or unexpected error."}
            </p>
          </div>
        )}

        {detailQuery.isFetching && (
          <div className="flex items-center justify-center py-12 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-slate-700 border-t-accent-cyan animate-spin" />
            <p className="text-text-muted text-sm">Loading report…</p>
          </div>
        )}

        {!result && !detailQuery.isFetching && !uploadMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-2xl">
              🛡️
            </div>
            <p className="text-text-primary font-medium">No report loaded</p>
            <p className="text-text-muted text-sm mt-1.5 max-w-xs">
              Upload a ZScaler log file above, or open History to revisit a previous report.
            </p>
          </div>
        )}

        {result && !detailQuery.isFetching && (
          <>
            <SummaryCards summary={result.summary} />

            <div className="flex justify-end">
              <button
                onClick={() => setShowLogs((prev) => !prev)}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-all"
              >
                {showLogs ? "Hide Logs ↑" : "View Logs ↓"}
              </button>
            </div>

            {showLogs && <LogTable rows={result.rows} />}
          </>
        )}
      </main>
    </div>
  );
}
