// DropboxFilePicker Modal
// Connects to Dropbox, lists files, and allows attaching file references.
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/admin/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import {
  Loader2,
  FolderOpen,
  FileText,
  ChevronRight,
  ArrowLeft,
  Check,
  CloudOff,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Archive,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "@/components/admin/ui/use-toast";

// ── Exported Types ──────────────────────────────────────────

// Dropbox file/folder entry
export type DropboxFileEntry = {
  id: string;
  name: string;
  path: string;
  pathDisplay: string;
  type: "file" | "folder";
  size: number;
  modified: string;
};

// Selected Dropbox file metadata sent to backend
export type DropboxSelectedFile = {
  file_name: string;
  file_type: string;
  file_size: number;
  dropbox_file_id: string;
  dropbox_path: string;
  temporary_link: string;
};

// Dialog Props
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: DropboxSelectedFile[]) => void;
  multiple?: boolean;
};

// ── Helpers ─────────────────────────────────────────────────

// Format byte count to human-readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Extract file extension
function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Map file extension to MIME type
function getMimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mov: "video/quicktime",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    psd: "image/vnd.adobe.photoshop",
  };
  return map[ext] || "application/octet-stream";
}

/** Return the appropriate Lucide icon for a file based on its extension. */
function getFileIcon(name: string) {
  const ext = getFileExtension(name);
  const images = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "psd"];
  const videos = ["mp4", "mov", "avi", "mkv", "webm"];
  const archives = ["zip", "rar", "7z", "tar", "gz"];
  const spreadsheets = ["xls", "xlsx", "csv"];

  if (images.includes(ext)) return <ImageIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
  if (videos.includes(ext)) return <Film className="w-5 h-5 text-purple-400 flex-shrink-0" />;
  if (archives.includes(ext)) return <Archive className="w-5 h-5 text-amber-400 flex-shrink-0" />;
  if (spreadsheets.includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-green-400 flex-shrink-0" />;
  if (ext === "pdf") return <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />;
  return <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />;
}

// ── Reusable Components ─────────────────────────────────────

/** Dropbox brand color constant */
const DROPBOX_BLUE = "#0061FF";

// Dropbox logo icon (SVG)
export function DropboxIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 43 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dropbox"
    >
      <path d="M12.5 0L0 8.1L8.6 13.7L21.5 5.9L12.5 0Z" fill={DROPBOX_BLUE} />
      <path d="M0 21.9L12.5 30L21.5 22.1L8.6 13.7L0 21.9Z" fill={DROPBOX_BLUE} />
      <path d="M21.5 22.1L30.5 30L43 21.9L34.4 13.7L21.5 22.1Z" fill={DROPBOX_BLUE} />
      <path d="M43 8.1L30.5 0L21.5 5.9L34.4 13.7L43 8.1Z" fill={DROPBOX_BLUE} />
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function DropboxFilePicker({ open, onOpenChange, onSelect, multiple = false }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [entries, setEntries] = useState<DropboxFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([""]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  /** Inline error message shown in the file browser area */
  const [browserError, setBrowserError] = useState<string | null>(null);

  // ── Check Dropbox connection status ──────────────────────

  const checkStatus = useCallback(async () => {
    try {
      setConnected(null);
      setBrowserError(null);
      const res = await apiFetch<{ connected: boolean }>("/api/dropbox/status");
      setConnected(res.connected);
      if (res.connected) {
        void loadFolder("");
      }
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setBrowserError(null);
      void checkStatus();
    }
  }, [open, checkStatus]);

  // ── Listen for OAuth popup success ───────────────────────

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "DROPBOX_AUTH_SUCCESS") {
        toast({ title: "Dropbox Connected", description: "Your Dropbox account has been linked successfully." });
        void checkStatus();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [checkStatus]);

  // ── OAuth popup ──────────────────────────────────────────

  const startOAuth = async () => {
    try {
      const res = await apiFetch<{ authUrl: string }>("/api/dropbox/auth-url");
      if (!res.authUrl) {
        toast({ title: "Error", description: "Failed to get Dropbox auth URL.", variant: "destructive" });
        return;
      }
      const w = 600;
      const h = 700;
      const left = window.screenX + (window.innerWidth - w) / 2;
      const top = window.screenY + (window.innerHeight - h) / 2;
      const popup = window.open(res.authUrl, "dropbox-auth", `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);

      // Detect if popup was blocked by the browser
      if (!popup || popup.closed) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to start Dropbox auth.", variant: "destructive" });
    }
  };

  // ── Load folder contents ─────────────────────────────────

  const loadFolder = async (path: string) => {
    try {
      setLoading(true);
      setBrowserError(null);
      const res = await apiFetch<{ entries: DropboxFileEntry[] }>("/api/dropbox/files/list", {
        method: "POST",
        body: JSON.stringify({ path }),
      });
      setEntries(res.entries || []);
      setCurrentPath(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load files";
      setBrowserError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /** Navigate into a subfolder */
  const navigateToFolder = (folderPath: string) => {
    setPathHistory((prev) => [...prev, folderPath]);
    void loadFolder(folderPath);
  };

  /** Navigate back to the parent folder */
  const navigateBack = () => {
    if (pathHistory.length <= 1) return;
    const newHistory = [...pathHistory];
    newHistory.pop();
    const parentPath = newHistory[newHistory.length - 1];
    setPathHistory(newHistory);
    void loadFolder(parentPath);
  };

  // ── Selection logic ──────────────────────────────────────

  /** Toggle file selection, or navigate into folder */
  const toggleSelect = (entry: DropboxFileEntry) => {
    if (entry.type === "folder") {
      navigateToFolder(entry.path);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
      } else {
        if (!multiple) next.clear();
        next.add(entry.id);
      }
      return next;
    });
  };

  // ── Confirm selection → fetch temporary links ────────────

  /** Confirm selection: fetch fresh temporary links and pass to parent */
  const confirmSelection = async () => {
    const selectedEntries = entries.filter((e) => selected.has(e.id) && e.type === "file");
    if (selectedEntries.length === 0) return;

    try {
      setConfirming(true);
      const results: DropboxSelectedFile[] = await Promise.all(
        selectedEntries.map(async (entry) => {
          const linkRes = await apiFetch<{ link: string; metadata: { id: string; name: string; size: number; path: string } }>(
            "/api/dropbox/files/temporary-link",
            { method: "POST", body: JSON.stringify({ path: entry.path }) }
          );
          const ext = getFileExtension(entry.name);
          return {
            file_name: entry.name,
            file_type: getMimeFromExt(ext),
            file_size: entry.size,
            dropbox_file_id: entry.id,
            dropbox_path: entry.path,
            temporary_link: linkRes.link || "",
          };
        })
      );

      onSelect(results);
      onOpenChange(false);
      toast({ title: "Files attached", description: `${results.length} file(s) attached from Dropbox.` });
    } catch (err) {
      toast({ title: "Failed to attach", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  // ── Breadcrumb from path ─────────────────────────────────

  const pathParts = currentPath ? currentPath.split("/").filter(Boolean) : [];

  // Sort: folders first, then alphabetical
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });

  // ── Render ───────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[580px] max-h-[85vh] overflow-hidden flex flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DropboxIcon size={20} />
            Attach from Dropbox
          </DialogTitle>
          <DialogDescription>Browse your Dropbox files and select files to attach.</DialogDescription>
        </DialogHeader>

        {/* ── Not connected state ── */}
        {connected === false && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CloudOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Connect your Dropbox account to browse and attach files directly.
            </p>
            <Button
              onClick={startOAuth}
              className="gap-2 text-white"
              style={{ backgroundColor: DROPBOX_BLUE }}
              aria-label="Connect your Dropbox account"
            >
              <DropboxIcon size={16} />
              Connect Dropbox
            </Button>
          </div>
        )}

        {/* ── Loading connection status ── */}
        {connected === null && (
          <div className="flex items-center justify-center py-16" role="status" aria-label="Checking connection">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ── Connected: File Browser ── */}
        {connected === true && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Breadcrumb navigation */}
            <nav
              className="flex items-center gap-1 px-1 py-2 text-xs text-muted-foreground border-b border-border mb-2 flex-wrap"
              aria-label="Dropbox folder breadcrumb"
            >
              <button
                onClick={() => { setPathHistory([""]); void loadFolder(""); }}
                className="hover:text-foreground transition-colors font-medium"
                aria-label="Navigate to Dropbox root"
              >
                Dropbox
              </button>
              {pathParts.map((part, i) => {
                const fullPath = "/" + pathParts.slice(0, i + 1).join("/");
                return (
                  <span key={fullPath} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" aria-hidden="true" />
                    <button
                      onClick={() => {
                        setPathHistory((prev) => prev.slice(0, prev.indexOf(fullPath) + 1 || prev.length));
                        void loadFolder(fullPath);
                      }}
                      className="hover:text-foreground transition-colors"
                    >
                      {part}
                    </button>
                  </span>
                );
              })}
              {/* Refresh button */}
              <button
                onClick={() => void loadFolder(currentPath)}
                className="ml-auto p-1 hover:bg-muted rounded transition-colors"
                title="Refresh folder"
                aria-label="Refresh current folder"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </nav>

            {/* Back button */}
            {pathHistory.length > 1 && (
              <button
                onClick={navigateBack}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors mb-1"
                aria-label="Go back to parent folder"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {/* Inline error state */}
            {browserError && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">{browserError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadFolder(currentPath)}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              </div>
            )}

            {/* File list */}
            {!browserError && (
              <div
                className="flex-1 overflow-y-auto min-h-0 max-h-[350px] space-y-0.5 pr-1"
                role="listbox"
                aria-label="Dropbox files"
                aria-multiselectable={multiple}
              >
                {loading ? (
                  // Loading skeleton — feels more polished than a bare spinner
                  <div className="space-y-1 py-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse">
                        <div className="w-5 h-5 rounded bg-muted" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-muted rounded w-3/4" />
                          <div className="h-2.5 bg-muted/60 rounded w-1/3" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : sortedEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FolderOpen className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">This folder is empty</p>
                  </div>
                ) : (
                  sortedEntries.map((entry) => {
                    const isFolder = entry.type === "folder";
                    const isSelected = selected.has(entry.id);

                    return (
                      <button
                        key={entry.id}
                        onClick={() => toggleSelect(entry)}
                        role="option"
                        aria-selected={isSelected}
                        title={entry.name}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                            : "hover:bg-muted/60 border border-transparent"
                        }`}
                      >
                        {/* Icon */}
                        {isFolder ? (
                          <FolderOpen className="w-5 h-5 text-amber-400 flex-shrink-0" aria-hidden="true" />
                        ) : (
                          getFileIcon(entry.name)
                        )}

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-foreground">{entry.name}</p>
                          {!isFolder && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatBytes(entry.size)}
                              {entry.modified && ` · ${new Date(entry.modified).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>

                        {/* Selection indicator or folder arrow */}
                        {isFolder ? (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        ) : isSelected ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: DROPBOX_BLUE }}
                            aria-hidden="true"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {connected === true && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground self-center" aria-live="polite">
              {selected.size > 0 ? `${selected.size} file(s) selected` : "Select a file to attach"}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSelection}
                disabled={selected.size === 0 || confirming}
                size="sm"
                className="gap-2 text-white"
                style={{ backgroundColor: selected.size > 0 ? DROPBOX_BLUE : undefined }}
                aria-label={`Attach ${selected.size} selected file(s)`}
              >
                {confirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Attach {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
