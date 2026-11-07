import React from "react";
import { UploadProgressInfo } from "@/lib/uploadWithProgress";
import { UploadCloud, CheckCircle2, AlertCircle, XCircle, ArrowUpCircle } from "lucide-react";

interface UploadingModalProps {
  isOpen: boolean;
  progress: UploadProgressInfo;
  fileName?: string;
  totalFiles?: number;
  errorMessage?: string;
  onCancel?: () => void;
  onClose?: () => void;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0 || !bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const UploadingModal: React.FC<UploadingModalProps> = ({
  isOpen,
  progress,
  fileName,
  totalFiles = 1,
  errorMessage,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const isDone = progress.status === "done" || progress.percent >= 100;
  const isError = progress.status === "error";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-zinc-950/95 border border-zinc-800 text-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon + Title */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isDone 
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : isError
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : "bg-primary/15 border-primary/30 text-primary animate-pulse"
          }`}>
            {isDone ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isError ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{isDone ? "Upload Complete!" : isError ? "Upload Error" : "Uploading Large File..."}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                1 GB Limit Supported
              </span>
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5" title={fileName}>
              {fileName ? fileName : `${totalFiles} file(s) in queue`}
            </p>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400">
              {progress.total > 0 
                ? `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`
                : "Transferring..."}
            </span>
            <span className="text-primary font-bold text-sm">
              {progress.percent}%
            </span>
          </div>

          <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isDone 
                  ? "bg-emerald-500" 
                  : isError
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-primary via-indigo-500 to-violet-500 shadow-lg shadow-primary/50"
              }`}
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/60 border border-zinc-850 rounded-xl p-3.5">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Speed</span>
            <span className="font-semibold text-zinc-200 text-sm">
              {progress.speedMBps > 0 ? `${progress.speedMBps} MB/s` : "Calculating..."}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Estimated Time</span>
            <span className="font-semibold text-zinc-200 text-sm">
              {progress.etaSeconds > 0 
                ? progress.etaSeconds < 60 
                  ? `${progress.etaSeconds}s remaining` 
                  : `${Math.round(progress.etaSeconds / 60)}m remaining`
                : isDone ? "Finished" : "Calculating..."}
            </span>
          </div>
        </div>

        {/* Information banner */}
        {!isDone && !isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <ArrowUpCircle className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
            <span>Upload in progress. Please keep this page open until completion.</span>
          </div>
        )}

        {/* Error banner */}
        {isError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Upload Failed</span>
              <p className="text-zinc-300 break-words">{errorMessage || "An error occurred during upload. Check server upload limits."}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          {!isDone && !isError && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Upload</span>
            </button>
          )}

          {isError && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
            >
              <span>Dismiss</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

