import { useRef, useState } from "react";
import { Video, Upload, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoRecorderModal } from "@/components/admin/VideoRecorderModal";
import { toProxiedUrl } from "@/lib/admin/apiClient";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Legacy external links (YouTube/Vimeo) can't play in a <video> tag — detect them
// so we can show a link fallback instead of a broken player.
function isExternalStreamingUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

interface VideoUploadFieldProps {
  /** Current value: "" | existing S3/external URL | base64 data URL */
  value?: string;
  onChange: (value: string) => void;
}

export function VideoUploadField({ value, onChange }: VideoUploadFieldProps) {
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      console.error("Failed to read video file:", err);
      alert("Could not read the selected video file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasValue = !!value;
  const isExternal = hasValue && !value!.startsWith("data:") && isExternalStreamingUrl(value!);
  const previewSrc = hasValue && !isExternal ? (value!.startsWith("data:") ? value! : toProxiedUrl(value!) || value!) : "";

  return (
    <div className="space-y-2">
      {hasValue ? (
        <div className="space-y-2">
          {isExternal ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-sm text-muted-foreground truncate">Current video (external link)</span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-border bg-black">
              <video src={previewSrc} controls className="w-full max-h-[240px] object-contain bg-black" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange("")}
            className="h-8 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Remove video
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRecorderOpen(true)}
            disabled={loading}
            className="gap-2"
          >
            <Video className="w-4 h-4" /> Record video
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload video
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <VideoRecorderModal
        isOpen={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onSave={(file) => void handleFile(file)}
      />
    </div>
  );
}
