import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, toProxiedUrl } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Bug, Upload, X, ZoomIn, ChevronLeft, ChevronRight, Video } from "lucide-react";

type BugStatus = "open" | "closed";

type BugItem = {
  id: string;
  title: string;
  description: string;
  status?: BugStatus;
  taskTitle?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdAt?: string;
  source?: { panel?: string; path?: string };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
};

const isVideoAttachment = (att?: { url?: string; mimeType?: string; fileName?: string } | string | null) => {
  if (!att) return false;
  const url = typeof att === "string" ? att : att.url || "";
  const mimeType = typeof att === "string" ? "" : att.mimeType || "";
  const fileName = typeof att === "string" ? "" : att.fileName || "";

  if (mimeType.startsWith("video/")) return true;
  if (url.startsWith("data:video/")) return true;
  const lowerUrl = (url || fileName).toLowerCase();
  return /\.(mp4|webm|mov|ogg|m4v|mkv)(\?.*)?$/i.test(lowerUrl);
};

type StatusFilter = "all" | "open" | "closed";

function toText(v: unknown) {
  return typeof v === "string" ? v : "";
}

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function ManagerBugs() {
  const auth = getAuthState();

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BugItem[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Lightbox
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<BugItem | null>(null);
  const [updating, setUpdating] = useState(false);

  // Submit dialog
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitFiles, setSubmitFiles] = useState<File[]>([]);
  const [submitPreviews, setSubmitPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await apiFetch<{ items?: any[] }>("/api/bugs");
    const list = Array.isArray(res?.items) ? res.items : [];
    const mapped: BugItem[] = list
      .map((x: any) => ({
        id: String(x.id || x._id || ""),
        title: toText(x.title),
        description: toText(x.description),
        status: (x.status === "closed" ? "closed" : "open") as BugStatus,
        taskTitle: toText(x.taskTitle),
        createdByUsername: toText(x.createdByUsername),
        createdByRole: toText(x.createdByRole),
        createdAt: toText(x.createdAt),
        source: x.source && typeof x.source === "object" ? x.source : undefined,
        attachments: Array.isArray(x.attachments) ? x.attachments : [],
      }))
      .filter((x) => Boolean(x.id));
    setItems(mapped);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setApiError(null);
        await load();
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load bugs");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((b) => {
      const where = `${b.title} ${b.description} ${b.taskTitle || ""} ${b.createdByUsername || ""} ${b.source?.path || ""}`.toLowerCase();
      return where.includes(query);
    });
  }, [items, q, statusFilter]);

  const openCount = items.filter((b) => b.status === "open").length;

  const openBug = async (b: BugItem) => {
    setSelected(b);
    setViewOpen(true);
    try {
      const res = await apiFetch<{ item: BugItem }>(`/api/bugs/${encodeURIComponent(b.id)}`);
      if (res?.item) setSelected((prev) => (prev?.id === b.id ? { ...prev, ...res.item } : prev));
    } catch { /* ignore */ }
  };

  const updateStatus = async (next: BugStatus) => {
    if (!selected) return;
    try {
      setUpdating(true);
      const res = await apiFetch<{ item?: any }>(`/api/bugs/${encodeURIComponent(selected.id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      const merged: BugItem = {
        ...selected,
        status: (res?.item?.status === "closed" ? "closed" : "open") as BugStatus,
      };
      setSelected(merged);
      setItems((prev) => prev.map((x) => (x.id === merged.id ? { ...x, status: merged.status } : x)));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update bug");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - submitFiles.length);
    setSubmitFiles((p) => [...p, ...files]);
    setSubmitPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(submitPreviews[i]);
    setSubmitFiles((p) => p.filter((_, idx) => idx !== i));
    setSubmitPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const resetSubmit = () => {
    setSubmitTitle("");
    setSubmitDesc("");
    submitPreviews.forEach((u) => URL.revokeObjectURL(u));
    setSubmitFiles([]);
    setSubmitPreviews([]);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async () => {
    if (!submitTitle.trim() || !submitDesc.trim()) {
      setSubmitError("Title and description are required.");
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const attachments = await Promise.all(
        submitFiles.map(async (f) => ({
          fileName: f.name,
          url: await toDataUrl(f),
          mimeType: f.type,
          size: f.size,
        }))
      );
      await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          title: submitTitle.trim(),
          description: submitDesc.trim(),
          attachments,
          source: { panel: "manager", path: window.location.pathname },
        }),
      });
      setSubmitSuccess("Bug report submitted successfully!");
      await load();
      setTimeout(() => {
        setSubmitOpen(false);
        resetSubmit();
      }, 1200);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit bug report.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: `All (${items.length})`, value: "all" },
    { label: `Open (${openCount})`, value: "open" },
    { label: `Closed (${items.length - openCount})`, value: "closed" },
  ];

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            Bug Reports
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Review and manage bug reports. {openCount > 0 ? `${openCount} open bug${openCount !== 1 ? "s" : ""}.` : "No open bugs."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
            Refresh
          </Button>
          <Button onClick={() => { resetSubmit(); setSubmitOpen(true); }} className="w-full sm:w-auto">
            + Report Bug
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-destructive break-words">{apiError}</p>
        </div>
      )}

      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            placeholder="Search bugs..."
            className="h-9 sm:h-10 text-sm sm:text-base sm:max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
            Bug Reports ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted By</TableHead>
                      <TableHead>Where</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openBug(b)}>
                        <TableCell>
                          <p className="font-semibold text-sm line-clamp-1">{b.title}</p>
                          {b.taskTitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">Task: {b.taskTitle}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === "closed" ? "secondary" : "default"} className="text-xs">
                            {b.status === "closed" ? "Closed" : "Open"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.createdByUsername || "-"}
                          {b.createdByRole ? ` (${b.createdByRole})` : ""}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.source?.path || b.source?.panel || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm italic">
                          No bugs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-3">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    onClick={() => openBug(b)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={b.status === "closed" ? "secondary" : "default"} className="text-[10px] uppercase">
                        {b.status === "closed" ? "Closed" : "Open"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{b.source?.path?.split("/").pop() || "System"}</span>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{b.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground">{b.createdByUsername}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm italic">No bugs found.</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.title || "Bug"}</DialogTitle>
            <DialogDescription>{selected?.source?.path || selected?.source?.panel || ""}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selected.status === "closed" ? "secondary" : "default"}>
                  {selected.status === "closed" ? "Closed" : "Open"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selected.createdByUsername ? `Posted by ${selected.createdByUsername}` : ""}
                  {selected.createdByRole ? ` (${selected.createdByRole})` : ""}
                </span>
              </div>
              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
              </div>
              {selected.attachments && selected.attachments.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Attachments ({selected.attachments.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selected.attachments.map((att, i) => {
                      const src = toProxiedUrl(String(att.url)) ?? "";
                      const allUrls = selected.attachments!.map(a => toProxiedUrl(String(a.url)) ?? "");
                      const isVid = isVideoAttachment(att);

                      if (isVid) {
                        return (
                          <div key={i} className="rounded-lg border bg-black overflow-hidden flex flex-col justify-center">
                            <video src={src} controls className="w-full h-44 object-contain" />
                            <div className="p-1.5 bg-muted/40 text-[10px] text-muted-foreground flex items-center justify-between">
                              <span className="truncate flex items-center gap-1 font-medium"><Video className="h-3 w-3 text-primary shrink-0" /> {att.fileName || `Video ${i + 1}`}</span>
                              <button 
                                type="button" 
                                className="text-xs text-primary font-bold hover:underline shrink-0"
                                onClick={() => setLightbox({ urls: allUrls, index: i })}
                              >
                                Fullscreen
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={i}
                          className="relative group overflow-hidden rounded-lg border bg-muted/20 cursor-zoom-in"
                          onClick={() => setLightbox({ urls: allUrls, index: i })}
                        >
                          <img
                            src={src}
                            alt={String(att.fileName || `Attachment ${i + 1}`)}
                            className="w-full h-36 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewOpen(false)} disabled={updating}>Close</Button>
            {selected?.status === "closed" ? (
              <Button onClick={() => void updateStatus("open")} disabled={updating}>Reopen</Button>
            ) : (
              <Button onClick={() => void updateStatus("closed")} disabled={updating}>Mark Closed</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={submitOpen} onOpenChange={(o) => { if (!o) resetSubmit(); setSubmitOpen(o); }}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Report a Bug
            </DialogTitle>
            <DialogDescription>Describe the issue you encountered. Screenshots and videos are helpful.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="Brief summary of the issue"
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="Steps to reproduce, expected vs actual behavior..."
                value={submitDesc}
                onChange={(e) => setSubmitDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments: Images & Videos (up to 5)</label>
              <div className="flex flex-wrap gap-2">
                {submitPreviews.map((url, i) => {
                  const file = submitFiles[i];
                  const isVid = file?.type?.startsWith("video/") || isVideoAttachment(url);
                  return (
                    <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border bg-black">
                      {isVid ? (
                        <>
                          <video src={url} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                            <Video className="h-6 w-6 text-white drop-shadow-md" />
                          </div>
                        </>
                      ) : (
                        <img src={url} alt={`preview ${i}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-black z-10"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  );
                })}
                {submitFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add Media</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-green-600">{submitSuccess}</p>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => { resetSubmit(); setSubmitOpen(false); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Counter */}
          {lightbox.urls.length > 1 && (
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightbox.index + 1} / {lightbox.urls.length}
            </span>
          )}

          {/* Prev */}
          {lightbox.urls.length > 1 && lightbox.index > 0 && (
            <button
              className="absolute left-2 sm:left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: lb.index - 1 } : null); }}
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
          )}

          {/* Media Content */}
          {isVideoAttachment(lightbox.urls[lightbox.index]) ? (
            <video
              src={lightbox.urls[lightbox.index]}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.urls[lightbox.index]}
              alt={`Attachment ${lightbox.index + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              style={{ maxWidth: "100vw", maxHeight: "100dvh" }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Next */}
          {lightbox.urls.length > 1 && lightbox.index < lightbox.urls.length - 1 && (
            <button
              className="absolute right-2 sm:right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: lb.index + 1 } : null); }}
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
