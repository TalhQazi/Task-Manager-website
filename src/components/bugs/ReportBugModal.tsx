import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Bug, Upload, X, Video, RefreshCw, FileText, AlertCircle, Camera, Monitor, Square, Check } from "lucide-react";
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

  // Video recording states
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "preview">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isScreenRecording, setIsScreenRecording] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async (type: "screen" | "camera") => {
    try {
      setSubmitError(null);
      let stream: MediaStream;
      if (type === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "",
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedPreviewUrl(url);
        setRecordingState("preview");
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      // Handle user stopping screen share via browser bar
      if (stream.getVideoTracks()[0]) {
        stream.getVideoTracks()[0].onended = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
      }

      recorder.start(1000);
      setRecordingState("recording");
      setIsScreenRecording(type === "screen");
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 179) {
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start video recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    stopRecording();
    if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    setRecordedBlob(null);
    setRecordedPreviewUrl(null);
    setRecordingState("idle");
  };

  const attachRecordedVideo = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `bug-recording-${Date.now()}.webm`, { type: "video/webm" });
    const previewUrl = recordedPreviewUrl || URL.createObjectURL(file);

    const att: AttachmentFile = {
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl,
      progress: 100,
      isVideo: true,
      isDoc: false,
      duration: recordingTime,
    };

    setAttachments((prev) => [...prev, att]);
    setRecordingState("idle");
    setRecordedBlob(null);
    setRecordedPreviewUrl(null);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setPriority("medium");
    setModule("");
    setCompany("");
    cancelRecording();
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setSubmitError(null);
    setSubmitSuccess(null);
  };
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

          {/* Live Video Recording Widget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Video className="h-4 w-4 text-primary" /> Record Bug Video (Screen or Camera)
              </label>
              <span className="text-[10px] text-muted-foreground">Max 3 minutes</span>
            </div>

            {recordingState === "recording" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
                  <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                      {isScreenRecording ? <Monitor className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                      Recording {isScreenRecording ? "Screen" : "Camera"}...
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Duration: {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:
                      {(recordingTime % 60).toString().padStart(2, "0")} / 03:00
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5 h-8 text-xs font-semibold">
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop Recording
                </Button>
              </div>
            )}

            {recordingState === "preview" && recordedPreviewUrl && (
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <div className="relative aspect-video max-h-48 rounded bg-black overflow-hidden">
                  <video src={recordedPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={cancelRecording} className="h-8 text-xs">
                    Discard
                  </Button>
                  <Button size="sm" onClick={attachRecordedVideo} className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <Check className="h-3.5 w-3.5" /> Attach Video to Report
                  </Button>
                </div>
              </div>
            )}

            {recordingState === "idle" && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void startRecording("screen")}
                  className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Monitor className="h-3.5 w-3.5" /> Record Screen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void startRecording("camera")}
                  className="h-8 text-xs gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Camera className="h-3.5 w-3.5" /> Record Camera
                </Button>
              </div>
            )}
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
