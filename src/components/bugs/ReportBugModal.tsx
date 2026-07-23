import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Bug, Upload, X, Video, RefreshCw, FileText, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

type ReportBugModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultSourcePanel?: string;
};

type AttachmentFile = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
  duration?: number;
  isVideo: boolean;
  isDoc: boolean;
};

export default function ReportBugModal({ open, onOpenChange, onSuccess, defaultSourcePanel = "system" }: ReportBugModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [priority, setPriority] = useState("medium");
  const [module, setModule] = useState("");
  const [company, setCompany] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setPriority("medium");
    setModule("");
    setCompany("");
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    if (attachments.length + rawFiles.length > 10) {
      setSubmitError("Maximum 10 attachments allowed per report.");
      return;
    }

    setSubmitError(null);

    const newAttachments: AttachmentFile[] = [];

    for (const file of rawFiles) {
      const mime = file.type.toLowerCase();
      const isVideo = mime.startsWith("video/") || /\.(mp4|mov|webm|ogg|mkv)$/i.test(file.name);
      const isImage = mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name);
      const isDoc = /\.(pdf|docx|xlsx)$/i.test(file.name) || mime.includes("pdf") || mime.includes("word") || mime.includes("spreadsheet");

      if (!isImage && !isVideo && !isDoc) {
        setSubmitError(`Unsupported file format: ${file.name}`);
        continue;
      }

      if (isImage && file.size > 20 * 1024 * 1024) {
        setSubmitError(`Image ${file.name} exceeds 20 MB limit.`);
        continue;
      }

      if (isVideo && file.size > 150 * 1024 * 1024) {
        setSubmitError(`Video ${file.name} exceeds 150 MB limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const att: AttachmentFile = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        progress: 100,
        isVideo,
        isDoc,
      };

      if (isVideo) {
        // Read video duration using standard HTMLVideoElement
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = previewUrl;
        tempVideo.onloadedmetadata = () => {
          att.duration = Math.round(tempVideo.duration || 0);
          if (att.duration > 180) {
            setSubmitError(`Video ${file.name} duration exceeds 3 minutes (180s) limit.`);
            setAttachments((prev) => prev.filter((a) => a.id !== att.id));
          }
        };
      }

      newAttachments.push(att);
    }

    const totalCombinedSize = [...attachments, ...newAttachments].reduce((sum, a) => sum + a.file.size, 0);
    if (totalCombinedSize > 250 * 1024 * 1024) {
      setSubmitError("Combined attachment size exceeds 250 MB limit.");
      return;
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setSubmitError("Title and description are required.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Upload files via multipart API endpoint if files exist
      let uploadedAttachmentData: any[] = [];

      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((att) => {
          formData.append("files", att.file);
        });

        const uploadRes = await apiFetch<{ items?: any[] }>("/api/bugs/upload", {
          method: "POST",
          body: formData,
        });

        uploadedAttachmentData = Array.isArray(uploadRes?.items) ? uploadRes.items : [];
      }

      // Create Bug Report
      await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          priority,
          module: module.trim(),
          company: company.trim(),
          attachments: uploadedAttachmentData,
          source: { panel: defaultSourcePanel, path: window.location.pathname },
        }),
      });

      setSubmitSuccess("Bug report submitted successfully!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit bug report. Title and description preserved.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Bug className="h-6 w-6 text-primary" />
            Report a Bug
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Describe the issue with steps to reproduce. Add images, videos, or documents to help fix it quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Issue Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Save button unclickable on Vendor form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Severity & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Severity</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor cosmetic</SelectItem>
                  <SelectItem value="medium">Medium - Functional glitch</SelectItem>
                  <SelectItem value="high">High - Feature broken</SelectItem>
                  <SelectItem value="critical">Critical - System down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Module & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Module (Optional)</label>
              <Input
                placeholder="e.g. Tasks, CRM, Vehicles"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Company (Optional)</label>
              <Input
                placeholder="e.g. Se7en Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={4}
              placeholder="Step-by-step description of what happened, expected behavior, and browser info..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-y min-h-[100px]"
            />
          </div>

          {/* Evidence & Attachments Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold">Evidence & Attachments ({attachments.length}/10)</label>
              <span className="text-[10px] text-muted-foreground">Max 250MB combined</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {attachments.map((att) => (
                <div key={att.id} className="relative group rounded-lg border bg-card overflow-hidden shadow-sm flex flex-col h-28">
                  {att.isVideo ? (
                    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                      <video src={att.previewUrl} className="w-full h-full object-cover opacity-80" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                      {att.duration !== undefined && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white font-mono px-1 rounded">
                          {Math.floor(att.duration / 60)}:{(att.duration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  ) : att.isDoc ? (
                    <div className="flex-1 bg-muted/40 flex flex-col items-center justify-center p-2 text-center">
                      <FileText className="h-7 w-7 text-primary mb-1" />
                      <span className="text-[10px] font-medium truncate w-full">{att.file.name}</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-hidden bg-muted">
                      <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-1 bg-card border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[80px]">{att.file.name}</span>
                    <span>{(att.file.size / (1024 * 1024)).toFixed(1)}MB</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {attachments.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1.5 p-2 transition-all bg-muted/20 hover:bg-muted/40"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-foreground">Add Media / File</span>
                  <span className="text-[9px] text-muted-foreground">Images, Videos, Docs</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm,.pdf,.docx,.xlsx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 rounded-md bg-green-500/10 text-green-600 text-xs font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !title.trim() || !description.trim()}>
            {submitting ? "Submitting..." : "Submit Bug Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
