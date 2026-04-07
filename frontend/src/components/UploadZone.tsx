/**
 * Drag-and-drop file upload zone.
 * Presentation only — the actual upload mutation lives in DashboardPage.
 */

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  isLoading: boolean;
}

export function UploadZone({ onFile, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
      className={[
        "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
        isDragging
          ? "border-accent-cyan bg-cyan-950/20 scale-[1.01]"
          : "border-slate-700 hover:border-slate-500 bg-bg-surface hover:bg-slate-800/40",
        isLoading ? "pointer-events-none" : "",
      ].join(" ")}
    >
      <input ref={inputRef} type="file" accept=".log,.txt,.csv" onChange={handleFileInput} className="hidden" />

      {isLoading ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-accent-cyan animate-spin" />
          </div>
          <p className="text-text-primary font-medium">Parsing log file…</p>
          <p className="text-text-muted text-sm">Running analysis, this may take a moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDragging ? "bg-cyan-900/50" : "bg-slate-800"
            }`}>
              <svg className={`w-6 h-6 transition-colors ${isDragging ? "text-accent-cyan" : "text-text-muted"}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-text-primary font-medium">
              Drop your ZScaler log here{" "}
              <span className="text-text-muted font-normal">or</span>{" "}
              <span className="text-accent-cyan">browse</span>
            </p>
            <p className="text-text-muted text-xs mt-1.5 font-mono">.log · .txt · .csv — up to 50 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
