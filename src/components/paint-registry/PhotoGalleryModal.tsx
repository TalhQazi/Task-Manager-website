import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Trash2,
  Download,
  Image as ImageIcon,
  Tag,
  Check,
  Edit2,
} from "lucide-react";
import type { FinishRecordPhoto, PhotoType } from "@/types/paintRegistry";
import { toProxiedUrl } from "@/lib/admin/apiClient";
import { updateFinishPhoto, deleteFinishPhoto } from "@/lib/paintRegistryApi";
import { toast } from "sonner";

interface PhotoGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: FinishRecordPhoto[];
  finishId: string;
  initialIndex?: number;
  canEdit?: boolean;
  onPhotosUpdated?: () => void;
}

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  paint_can: "Paint Can",
  color_code_label: "Color Code Label",
  finished_surface: "Finished Surface",
  receipt: "Purchase Receipt",
  other: "Other Attachment",
};

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  open,
  onOpenChange,
  photos,
  finishId,
  initialIndex = 0,
  canEdit = true,
  onPhotosUpdated,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [filterType, setFilterType] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionInput, setCaptionInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPhotos = photos.filter((p) => {
    if (filterType === "all") return true;
    return p.photoType === filterType;
  });

  const activePhoto = filteredPhotos[selectedIndex] || filteredPhotos[0] || null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.5, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleSaveCaption = async () => {
    if (!activePhoto?.id && !activePhoto?._id) return;
    const photoId = String(activePhoto.id || activePhoto._id);
    try {
      await updateFinishPhoto(finishId, photoId, { caption: captionInput });
      setIsEditingCaption(false);
      toast.success("Photo caption updated");
      if (onPhotosUpdated) onPhotosUpdated();
    } catch (err: any) {
      toast.error("Failed to update caption: " + (err.message || "Unknown error"));
    }
  };

  const handleDeletePhoto = async () => {
    if (!activePhoto?.id && !activePhoto?._id) return;
    const photoId = String(activePhoto.id || activePhoto._id);
    try {
      setIsDeleting(true);
      await deleteFinishPhoto(finishId, photoId);
      toast.success("Photo deleted");
      setIsDeleting(false);
      if (onPhotosUpdated) onPhotosUpdated();
      setSelectedIndex(0);
    } catch (err: any) {
      setIsDeleting(false);
      toast.error("Failed to delete photo: " + (err.message || "Unknown error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-slate-950 text-white flex flex-col h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-blue-400" />
            <DialogTitle className="text-base font-semibold text-white">
              Photo & Evidence Viewer ({photos.length} item{photos.length === 1 ? "" : "s"})
            </DialogTitle>
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterType("all");
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({photos.length})
            </button>
            {(["paint_can", "color_code_label", "finished_surface", "receipt"] as PhotoType[]).map(
              (type) => {
                const count = photos.filter((p) => p.photoType === type).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFilterType(type);
                      setSelectedIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterType === type
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {PHOTO_TYPE_LABELS[type]} ({count})
                  </button>
                );
              }
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Canvas & Zoom Controls */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-0">
          {activePhoto ? (
            <div
              className="w-full h-full flex items-center justify-center p-4 select-none overflow-auto"
              style={{ cursor: zoomLevel > 1 ? "grab" : "default" }}
            >
              {activePhoto.fileUrl.toLowerCase().endsWith(".pdf") ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-white/10 text-center">
                  <p className="text-sm font-semibold mb-3">PDF Attachment</p>
                  <a
                    href={toProxiedUrl(activePhoto.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Open Full PDF in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={toProxiedUrl(activePhoto.fileUrl)}
                  alt={activePhoto.caption || "Paint Evidence"}
                  className="max-h-full max-w-full object-contain transition-transform duration-150 rounded-lg shadow-2xl"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                  draggable={false}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm">
              No photos found in this category.
            </div>
          )}

          {/* Floating Zoom Bar */}
          {activePhoto && !activePhoto.fileUrl.toLowerCase().endsWith(".pdf") && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl text-xs z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.75}
                className="h-7 w-7 text-white hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="w-12 text-center font-mono font-bold text-blue-400 text-xs">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="h-7 w-7 text-white hover:bg-white/10"
                title="Zoom In (Read Mix Labels)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-[1px] bg-white/20 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="h-7 w-7 text-white hover:bg-white/10"
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Footer Details & Thumbnails Carousel */}
        <div className="px-6 py-3 bg-slate-900/95 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Active Photo Info */}
          <div className="flex-1 min-w-0">
            {activePhoto && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] uppercase font-bold px-2 py-0.5">
                    {PHOTO_TYPE_LABELS[activePhoto.photoType] || activePhoto.photoType}
                  </Badge>
                  {activePhoto.uploadedByName && (
                    <span className="text-[11px] text-slate-400">
                      Uploaded by {activePhoto.uploadedByName}
                    </span>
                  )}
                </div>

                {isEditingCaption ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={captionInput}
                      onChange={(e) => setCaptionInput(e.target.value)}
                      placeholder="Add caption or label note..."
                      className="h-7 text-xs px-2 rounded bg-slate-800 border border-slate-700 text-white w-64"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveCaption}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-3"
                    >
                      <Check className="h-3 w-3 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingCaption(false)}
                      className="h-7 text-xs text-slate-400"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <span className="italic truncate">
                      {activePhoto.caption || "No caption provided"}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setCaptionInput(activePhoto.caption || "");
                          setIsEditingCaption(true);
                        }}
                        className="text-slate-400 hover:text-white"
                        title="Edit caption"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thumbnails strip */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1">
            {filteredPhotos.map((photo, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={photo.id || photo._id || idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setZoomLevel(1);
                    setRotation(0);
                    setIsEditingCaption(false);
                  }}
                  className={`h-12 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/50 scale-105"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={toProxiedUrl(photo.thumbnailUrl || photo.fileUrl)}
                    alt="Thumbnail"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          {activePhoto && (
            <div className="flex items-center gap-2">
              <a
                href={toProxiedUrl(activePhoto.fileUrl)}
                download={activePhoto.metadata?.originalName || "paint_evidence.jpg"}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Download original file"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>

              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePhoto}
                  disabled={isDeleting}
                  className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5"
                  title="Delete photo"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

