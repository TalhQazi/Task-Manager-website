import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { Loader2, Video, Plus, Edit3, Trash2, Play } from "lucide-react";

const MESSAGE_TYPES = [
  "birthday",
  "30d",
  "6m",
  "1y",
  "2y",
  "3y",
  "4y",
  "5y",
  "6y",
  "7y",
  "8y",
  "9y",
  "10y",
  "top-performer",
];

interface VideoMessageItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  videoUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function getVideoEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";

      if (host.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/")[2] || "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      }
    }

    if (host.includes("vimeo.com")) {
      const match = rawUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const videoId = match?.[1] || "";
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function VideoMessages() {
  const [messages, setMessages] = useState<VideoMessageItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>(MESSAGE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideoFile, setUploadingVideoFile] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<VideoMessageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ items: VideoMessageItem[] }>("/api/video/messages");
      setMessages(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const handleVideoFileUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a valid video file.");
      return;
    }

    setUploadingVideoFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch<{ attachment: { url: string } }>("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      setVideoUrl(response.attachment.url);
      setVideoFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video file.");
    } finally {
      setUploadingVideoFile(false);
    }
  };

  const onVideoDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleVideoFileUpload(file);
  };

  const onVideoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    await handleVideoFileUpload(file);
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setVideoUrl("");
    setVideoFile(null);
    setSelectedType(MESSAGE_TYPES[0]);
    setIsActive(true);
    setEditingMessageId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoUrl.trim()) {
      setError("Please enter a video URL or upload a video file.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const endpoint = editingMessageId ? `/api/video/messages/${encodeURIComponent(editingMessageId)}` : "/api/video/messages";
      const method = editingMessageId ? "PUT" : "POST";
      await apiFetch<{ item: VideoMessageItem }>(endpoint, {
        method,
        body: JSON.stringify({
          type: selectedType,
          title: title.trim(),
          subtitle: subtitle.trim(),
          videoUrl: videoUrl.trim(),
          isActive,
        }),
      });
      resetForm();
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save video message");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (message: VideoMessageItem) => {
    setEditingMessageId(message.id);
    setSelectedType(message.type);
    setTitle(message.title);
    setSubtitle(message.subtitle || "");
    setVideoUrl(message.videoUrl);
    setIsActive(message.isActive);
    setVideoFile(null);
    setError(null);
    setPreviewMessage(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm("Delete this video message?")) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/video/messages/${encodeURIComponent(messageId)}`, {
        method: "DELETE",
      });
      if (previewMessage?.id === messageId) {
        setPreviewMessage(null);
      }
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video message");
    } finally {
      setLoading(false);
    }
  };

  const showPreview = (message: VideoMessageItem) => {
    setPreviewMessage(message);
  };

  useEffect(() => {
    if (previewMessage && previewVideoRef.current) {
      void previewVideoRef.current.play().catch(() => {
        // Autoplay may be blocked in some browsers; user can still click play.
      });
    }
  }, [previewMessage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-300">
            <Video className="h-5 w-5 text-primary" />
            <span className="text-sm uppercase tracking-[0.25em]">Executive Video</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white">Video Messages</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Create executive video messages for birthdays, milestones, and top performer recognition.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Video Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Message Type</label>
                <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a message type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Video URL</label>
                <Input
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={onVideoDrop}
              className="mt-4 rounded-2xl border border-dashed border-slate-600 bg-slate-950 p-5 text-center text-slate-300 transition hover:border-slate-400 hover:bg-slate-900"
            >
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onVideoFileChange}
              />
              <p className="text-sm font-medium">Drag & drop a video file here</p>
              <p className="text-xs text-slate-500">or <button type="button" onClick={() => videoFileInputRef.current?.click()} className="font-semibold text-primary hover:underline">browse</button> to upload</p>
              {videoFile ? (
                <p className="mt-3 text-sm text-slate-200">Selected file: {videoFile.name}</p>
              ) : null}
              {uploadingVideoFile ? (
                <p className="mt-2 text-xs text-slate-400">Uploading video…</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Title</label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Message title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Subtitle</label>
                <Input
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Optional subtitle"
                />
              </div>
            </div>

            {previewMessage ? (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4 mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Preview: {previewMessage.title}</p>
                    <p className="text-xs text-slate-500">{previewMessage.subtitle || "Executive video message preview"}</p>
                  </div>
                  <button type="button" onClick={() => setPreviewMessage(null)} className="text-slate-300 hover:text-white">Close</button>
                </div>
                <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-black">
                  {getVideoEmbedUrl(previewMessage.videoUrl) ? (
                    <iframe
                      title={`video-preview-${previewMessage.id}`}
                      src={getVideoEmbedUrl(previewMessage.videoUrl) || ""}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-[360px] bg-black"
                    />
                  ) : (
                    <video
                      key={previewMessage.videoUrl}
                      ref={previewVideoRef}
                      src={toProxiedUrl(previewMessage.videoUrl) || previewMessage.videoUrl}
                      controls
                      autoPlay
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={() => {
                        if (previewVideoRef.current) {
                          void previewVideoRef.current.play().catch(() => {});
                        }
                      }}
                      className="w-full max-h-[360px] bg-black"
                    />
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                />
                Active
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {editingMessageId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                ) : null}
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingMessageId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingMessageId ? "Save Changes" : "Create Message"}
                </Button>
              </div>
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Video Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading messages...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Video URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="whitespace-nowrap font-medium text-slate-100">{message.type}</TableCell>
                      <TableCell>{message.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <a href={toProxiedUrl(message.videoUrl) || message.videoUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                            Open link
                          </a>
                          <button type="button" onClick={() => showPreview(message)} className="text-slate-300 hover:text-white text-sm">
                            <Play className="inline h-3.5 w-3.5 mr-1" /> Preview
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{message.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{message.createdAt ? new Date(message.createdAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap">
                        <button type="button" onClick={() => startEdit(message)} className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm">
                          <Edit3 className="h-4 w-4" /> Edit
                        </button>
                        <button type="button" onClick={() => deleteMessage(message.id)} className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-200 text-sm">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
