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
  ChevronRight,
  Edit,
  Copy,
  Archive,
  RefreshCw,
  Sparkles,
  Layers,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  Camera,
  Image as ImageIcon,
  History,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PaintSwatch } from "./PaintSwatch";
import { PhotoGalleryModal } from "./PhotoGalleryModal";
import { ApplyToAreasModal } from "./ApplyToAreasModal";
import {
  setCurrentFinish,
  archiveFinish,
  restoreFinish,
} from "@/lib/paintRegistryApi";
import type { FinishRecord, FinishRecordPhoto } from "@/types/paintRegistry";
import { toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface PaintRecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finish: FinishRecord;
  onEdit?: (finish: FinishRecord) => void;
  onRefresh?: () => void;
}

export const PaintRecordDetailModal: React.FC<PaintRecordDetailModalProps> = ({
  open,
  onOpenChange,
  finish,
  onEdit,
  onRefresh,
}) => {
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [showAudits, setShowAudits] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status badge styling
  const statusBadges = {
    CURRENT: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    PREVIOUS: "bg-slate-100 text-slate-700 border-slate-300 font-semibold",
    DRAFT: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
    ARCHIVED: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
  };

  // Incomplete check: missing store or manufacturer
  const isIncomplete =
    !finish.colorCode || !finish.manufacturer || !finish.purchasedFrom;

  const handleSetCurrent = async () => {
    try {
      setActionLoading(true);
      await setCurrentFinish(finish.id || (finish as any)._id);
      toast.success("Finish promoted to Current active specification.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to set as Current.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading(true);
      await archiveFinish(finish.id || (finish as any)._id);
      toast.success("Finish record archived.");
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to archive record.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setActionLoading(true);
      await restoreFinish(finish.id || (finish as any)._id);
      toast.success("Finish record restored as previous version.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore record.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white">
            {/* Breadcrumb Hierarchy */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">
                {finish.propertyName || "Property"}
              </span>
              {finish.unitAreaName && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold text-blue-300">
                    {finish.unitAreaName}
                  </span>
                </>
              )}
              {finish.roomZoneName && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-300">{finish.roomZoneName}</span>
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              <Badge
                variant="outline"
                className="bg-blue-400/10 text-blue-300 border-blue-400/30 text-[11px] font-bold"
              >
                {finish.surfaceTypeName}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PaintSwatch color={finish.hexColor} size="lg" />
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {finish.colorName || "Custom Paint Specification"}
                  </DialogTitle>
                  <p className="text-sm font-mono font-bold text-blue-300 flex items-center gap-2 mt-0.5">
                    <span>{finish.colorCode || "NO-CODE"}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-xs font-sans text-slate-300">
                      {finish.sheenFinish || "Eggshell"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  className={`border uppercase text-xs px-2.5 py-0.5 ${
                    statusBadges[finish.recordStatus] || ""
                  }`}
                >
                  {finish.recordStatus}
                </Badge>
                {isIncomplete && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Incomplete Specs
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Manufacturer
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                  {finish.manufacturer || "Not specified"}
                </p>
                <span className="text-[11px] text-slate-500 truncate block">
                  {finish.productLine || "Standard Line"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Sheen & Use Type
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                  {finish.sheenFinish || "Eggshell"}
                </p>
                <span className="text-[11px] text-slate-500 truncate block">
                  {finish.useType || "Interior"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Store / Vendor
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                  {finish.purchasedFrom || "Not recorded"}
                </p>
                <span className="text-[11px] text-slate-500 truncate block">
                  {finish.storeLocation || "No address"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Coats & Quantity
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                  {finish.coats ? `${finish.coats} Coat(s)` : "Standard"}
                </p>
                <span className="text-[11px] text-slate-500 truncate block">
                  {finish.quantityUsed
                    ? `${finish.quantityUsed} ${finish.quantityUnit || "Gal"}`
                    : "No quantity logged"}
                </span>
              </div>
            </div>

            {/* Tint Formula & Hex Code */}
            {(finish.customMixFormula || finish.hexColor) && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Tint Formulation & Color Metric
                  </span>
                  {finish.hexColor && (
                    <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-slate-200">
                      HEX: {finish.hexColor}
                    </span>
                  )}
                </div>
                {finish.customMixFormula ? (
                  <p className="font-mono text-xs bg-black/40 p-2.5 rounded-lg border border-white/10 text-emerald-300">
                    {finish.customMixFormula}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Factory standard shade (no custom tint formulation required)
                  </p>
                )}
              </div>
            )}

            {/* Application & Painter Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Application Info
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Date Applied:</span>{" "}
                  {finish.dateApplied
                    ? new Date(finish.dateApplied).toLocaleDateString()
                    : "Not recorded"}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Applied By:</span>{" "}
                  {finish.appliedBy || "Unknown Crew"}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Primer Used:</span>{" "}
                  {finish.primerUsed || "Self-Priming"}
                </p>
                {finish.unitCost ? (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">Unit Cost:</span> $
                    {finish.unitCost} / {finish.quantityUnit || "Gallon"}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Coverage & Prep Notes
                </p>
                <p className="text-slate-700 italic leading-relaxed">
                  {finish.notes || finish.coverageNotes || "No notes recorded for this finish."}
                </p>
              </div>
            </div>

            {/* Photo & Evidence Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-rose-600" />
                  Photo & Label Evidence ({finish.photos?.length || 0})
                </p>
                {finish.photos && finish.photos.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPhotoIndex(0);
                      setPhotoGalleryOpen(true);
                    }}
                    className="h-7 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Open Zoom Viewer
                  </Button>
                )}
              </div>

              {finish.photos && finish.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {finish.photos.map((photo, idx) => (
                    <div
                      key={photo.id || photo._id || idx}
                      onClick={() => {
                        setSelectedPhotoIndex(idx);
                        setPhotoGalleryOpen(true);
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video cursor-zoom-in bg-slate-100 transition-all hover:scale-[1.02] hover:shadow-md"
                    >
                      <img
                        src={toProxiedUrl(photo.thumbnailUrl || photo.fileUrl)}
                        alt={photo.caption || "Paint photo"}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[10px] text-white font-semibold truncate">
                          {photo.caption || photo.photoType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No photos or label attachments logged for this finish.
                </div>
              )}
            </div>

            {/* Historical Finishes for this Surface */}
            {finish.previousRecords && finish.previousRecords.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-500" />
                  Historical Finish Versions ({finish.previousRecords.length})
                </p>
                <div className="space-y-2">
                  {finish.previousRecords.map((prev) => (
                    <div
                      key={prev.id || (prev as any)._id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <PaintSwatch color={prev.hexColor} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {prev.colorName} ({prev.colorCode})
                          </p>
                          <span className="text-[10px] text-slate-500">
                            Replaced on{" "}
                            {prev.effectiveTo
                              ? new Date(prev.effectiveTo).toLocaleDateString()
                              : "Earlier"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {prev.recordStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immutable Audit Trail Accordion */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAudits(!showAudits)}
                className="flex items-center justify-between w-full py-2 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900"
              >
                <span>Audit Trail ({finish.audits?.length || 0} events)</span>
                {showAudits ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAudits && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
                  {finish.audits && finish.audits.length > 0 ? (
                    finish.audits.map((a, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-blue-700 mr-2">
                            {a.action}
                          </span>
                          <span className="text-slate-600">
                            by {a.actorUsername || "User"}
                          </span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-2">
                      No audit history logged.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {finish.recordStatus !== "CURRENT" && finish.recordStatus !== "ARCHIVED" && (
                <Button
                  size="sm"
                  onClick={handleSetCurrent}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Set as Current
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setApplyModalOpen(true)}
                className="text-xs font-semibold h-8 text-slate-700 border-slate-300 hover:bg-slate-100"
              >
                <Copy className="h-3.5 w-3.5 mr-1 text-blue-600" /> Apply to Other Areas
              </Button>

              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(finish);
                  }}
                  className="text-xs font-semibold h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {finish.recordStatus === "ARCHIVED" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="text-xs font-semibold h-8 text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Restore Record
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleArchive}
                  disabled={actionLoading}
                  className="text-xs font-semibold h-8 text-slate-500 hover:text-red-600"
                >
                  <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs font-semibold h-8"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modal */}
      {finish.photos && finish.photos.length > 0 && (
        <PhotoGalleryModal
          open={photoGalleryOpen}
          onOpenChange={setPhotoGalleryOpen}
          photos={finish.photos}
          finishId={finish.id || (finish as any)._id}
          initialIndex={selectedPhotoIndex}
          onPhotosUpdated={onRefresh}
        />
      )}

      {/* Apply to Other Areas Modal */}
      <ApplyToAreasModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        finish={finish}
        onApplied={onRefresh}
      />
    </>
  );
};

