import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, RefreshCcw, Volume2, VolumeX, X } from "lucide-react";
import { replayVideoMessage } from "@/Employee/lib/api";

export interface VideoMessagePayload {
  id: string;
  messageType: string;
  title: string;
  subtitle?: string;
  videoUrl: string;
  replayCount?: number;
  deliveredAt?: string;
  acknowledgedAt?: string | null;
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

interface VideoMessageModalProps {
  isOpen: boolean;
  videoMessage?: VideoMessagePayload | null;
  deliveryId?: string;
  onClose: () => void;
  onAcknowledge: (response: string, watchDuration: number, replayCount: number) => Promise<void>;
  hideAcknowledge?: boolean;
}

export function VideoMessageModal({
  isOpen,
  videoMessage,
  deliveryId,
  onClose,
  onAcknowledge,
  hideAcknowledge = false,
}: VideoMessageModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [watchDuration, setWatchDuration] = useState(0);
  const [replayCount, setReplayCount] = useState(videoMessage?.replayCount || 0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayingRequest, setIsReplayingRequest] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setReply("");
      setIsReplaying(false);
      setWatchDuration(0);
      setReplayCount(videoMessage?.replayCount || 0);
    }
  }, [isOpen, videoMessage]);

  const handleAcknowledge = async () => {
    if (!deliveryId) return;
    setIsSubmitting(true);
    try {
      await onAcknowledge(reply.trim(), watchDuration, replayCount);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplay = async () => {
    if (!deliveryId) {
      setIsReplaying(true);
      window.setTimeout(() => setIsReplaying(false), 50);
      return;
    }

    setIsReplayingRequest(true);
    try {
      const response = await replayVideoMessage(deliveryId);
      setReplayCount(response.item.replayCount || replayCount + 1);
      setIsReplaying(true);
      window.setTimeout(() => setIsReplaying(false), 50);
      videoRef.current?.play().catch(() => {});
    } finally {
      setIsReplayingRequest(false);
    }
  };

  const handleTimeUpdate = () => {
    const current = Math.floor(videoRef.current?.currentTime || 0);
    setWatchDuration((prev) => Math.max(prev, current));
  };

  if (!videoMessage) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="fixed inset-0 z-50 m-0 h-screen w-screen p-0 bg-black/95 sm:p-6">
        <div className="flex h-full flex-col justify-between overflow-hidden rounded-none bg-slate-950 text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Message from Nathan Reardon</p>
              <DialogTitle className="text-xl font-semibold">{videoMessage.title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-300">
                {videoMessage.subtitle || "A short executive message for you"}
              </DialogDescription>
            </div>
            <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 px-5 py-6 sm:px-10">
            <div className="relative mx-auto h-[calc(100%-4rem)] max-h-[calc(100vh-14rem)] w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              {getVideoEmbedUrl(videoMessage.videoUrl) ? (
                <iframe
                  title={`video-preview-${videoMessage.id}`}
                  src={getVideoEmbedUrl(videoMessage.videoUrl) || ""}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <video
                  ref={videoRef}
                  key={isReplaying ? `replay-${Date.now()}` : videoMessage.videoUrl}
                  src={videoMessage.videoUrl}
                  preload="auto"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 px-5 py-4 sm:px-10">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={handleReplay} className="w-full" disabled={isReplayingRequest}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Replay
              </Button>
              <Button variant="secondary" onClick={() => setIsMuted((current) => !current)} className="w-full">
                {isMuted ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            </div>

            <div className="space-y-2">
              <label htmlFor="video-reply" className="text-sm font-medium text-slate-200">
                Optional reply message
              </label>
              <textarea
                id="video-reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                placeholder="Write a short note back to leadership (optional)."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-xs text-slate-400">
                <p>This message will be logged and is available for replay for the next 24 hours.</p>
                <p>Replay count: {replayCount}</p>
                <p>Watch duration: {watchDuration}s</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
                {!hideAcknowledge && (
                  <Button disabled={!deliveryId || isSubmitting} onClick={handleAcknowledge} className="w-full sm:w-auto">
                    <MessageCircle className="mr-2 h-4 w-4" /> Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
