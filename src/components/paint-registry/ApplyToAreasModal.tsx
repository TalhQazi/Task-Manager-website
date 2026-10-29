import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { Label } from "@/components/admin/ui/label";
import { Input } from "@/components/admin/ui/input";
import {
  Copy,
  Layers,
  Building2,
  Check,
  AlertTriangle,
  Loader2,
  Plus,
} from "lucide-react";
import { PaintSwatch } from "./PaintSwatch";
import { applyToOtherAreas } from "@/lib/paintRegistryApi";
import type { FinishRecord } from "@/types/paintRegistry";
import { toast } from "sonner";

interface DestinationItem {
  id: string;
  category: "Common" | "Unit" | "Exterior" | "Utility";
  unitAreaName: string;
  roomZoneName?: string;
  surfaceTypeName: string;
  label: string;
}

interface ApplyToAreasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finish: FinishRecord;
  onApplied?: () => void;
}

export const ApplyToAreasModal: React.FC<ApplyToAreasModalProps> = ({
  open,
  onOpenChange,
  finish,
  onApplied,
}) => {
  // Preset list of standard destinations for a property
  const DEFAULT_DESTINATIONS: DestinationItem[] = [
    { id: "d1", category: "Common", unitAreaName: "Common Areas", roomZoneName: "Lobby", surfaceTypeName: finish.surfaceTypeName, label: "Common Areas → Lobby" },
    { id: "d2", category: "Common", unitAreaName: "Common Areas", roomZoneName: "Hallways", surfaceTypeName: finish.surfaceTypeName, label: "Common Areas → Hallways" },
    { id: "d3", category: "Common", unitAreaName: "Common Areas", roomZoneName: "Stairwells", surfaceTypeName: finish.surfaceTypeName, label: "Common Areas → Stairwells" },
    { id: "d4", category: "Unit", unitAreaName: "Unit 1", roomZoneName: "All Rooms", surfaceTypeName: finish.surfaceTypeName, label: "Unit 1 → All Rooms" },
    { id: "d5", category: "Unit", unitAreaName: "Unit 2", roomZoneName: "All Rooms", surfaceTypeName: finish.surfaceTypeName, label: "Unit 2 → All Rooms" },
    { id: "d6", category: "Unit", unitAreaName: "Unit 3", roomZoneName: "All Rooms", surfaceTypeName: finish.surfaceTypeName, label: "Unit 3 → All Rooms" },
    { id: "d7", category: "Unit", unitAreaName: "Unit 4", roomZoneName: "All Rooms", surfaceTypeName: finish.surfaceTypeName, label: "Unit 4 → All Rooms" },
    { id: "d8", category: "Unit", unitAreaName: "Unit 5", roomZoneName: "All Rooms", surfaceTypeName: finish.surfaceTypeName, label: "Unit 5 → All Rooms" },
    { id: "d9", category: "Exterior", unitAreaName: "Exterior", roomZoneName: "North Facade", surfaceTypeName: finish.surfaceTypeName, label: "Exterior → North Facade" },
    { id: "d10", category: "Exterior", unitAreaName: "Exterior", roomZoneName: "South Facade", surfaceTypeName: finish.surfaceTypeName, label: "Exterior → South Facade" },
    { id: "d11", category: "Utility", unitAreaName: "Maintenance Shop", roomZoneName: "Service Bay", surfaceTypeName: finish.surfaceTypeName, label: "Maintenance Shop → Service Bay" },
  ];

  const [destinations, setDestinations] = useState<DestinationItem[]>(DEFAULT_DESTINATIONS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customUnit, setCustomUnit] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [makeIndependentCopies, setMakeIndependentCopies] = useState(false);
  const [setCurrent, setSetCurrent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toggleDestination = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(destinations.map((d) => d.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUnit.trim()) return;
    const newItem: DestinationItem = {
      id: `custom_${Date.now()}`,
      category: "Unit",
      unitAreaName: customUnit.trim(),
      roomZoneName: customRoom.trim() || undefined,
      surfaceTypeName: finish.surfaceTypeName,
      label: `${customUnit.trim()}${customRoom.trim() ? ` → ${customRoom.trim()}` : ""}`,
    };
    setDestinations((prev) => [newItem, ...prev]);
    setSelectedIds((prev) => new Set(prev).add(newItem.id));
    setCustomUnit("");
    setCustomRoom("");
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one destination area.");
      return;
    }

    try {
      setSubmitting(true);
      const chosen = destinations.filter((d) => selectedIds.has(d.id));
      const payloadDestinations = chosen.map((d) => ({
        propertyId: finish.propertyId,
        propertyName: finish.propertyName,
        unitAreaName: d.unitAreaName,
        roomZoneName: d.roomZoneName || "",
        surfaceTypeId: finish.surfaceTypeId,
        surfaceTypeName: finish.surfaceTypeName,
      }));

      const res = await applyToOtherAreas(finish.id || (finish as any)._id, {
        destinations: payloadDestinations,
        setCurrent,
        makeIndependentCopies,
      });

      toast.success(res.message || `Successfully applied to ${chosen.length} destination(s).`);
      onOpenChange(false);
      if (onApplied) onApplied();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply finish to areas.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
              <Copy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Apply Finish to Other Areas
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Associate this finish specification with multiple units, rooms, or surfaces
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1">
          {/* Source Record Snapshot */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PaintSwatch color={finish.hexColor} size="lg" />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {finish.colorName || "Custom Paint"}
                </p>
                <p className="text-xs font-mono font-bold text-blue-700">
                  {finish.colorCode || "No Code"} • {finish.surfaceTypeName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {finish.manufacturer} ({finish.sheenFinish || "Eggshell"})
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-xs font-semibold">
              Source Finish
            </Badge>
          </div>

          {/* Quick Custom Destination Input */}
          <form onSubmit={handleAddCustom} className="flex items-end gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Add Custom Area / Unit</Label>
              <Input
                placeholder="e.g. Unit 302 or Penthouse"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Room / Zone (Optional)</Label>
              <Input
                placeholder="e.g. Master Bedroom"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </form>

          {/* Destination Selection Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Destinations ({selectedIds.size} of {destinations.length} selected)
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border rounded-xl border-slate-200">
              {destinations.map((dest) => {
                const isChecked = selectedIds.has(dest.id);
                return (
                  <label
                    key={dest.id}
                    onClick={() => toggleDestination(dest.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                      isChecked
                        ? "bg-blue-50/70 border-blue-300 font-semibold text-blue-900 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleDestination(dest.id)}
                    />
                    <div className="flex-1 truncate">
                      <span className="block truncate">{dest.label}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Surface: {dest.surfaceTypeName}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Application Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={setCurrent}
                onCheckedChange={(c) => setSetCurrent(!!c)}
                className="mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-800">Set as Current finish</span>
                <p className="text-slate-500 text-[11px]">
                  Automatically sets this finish as the active Current specification for selected locations, archiving any conflicting current entries as Previous.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
              <Checkbox
                checked={makeIndependentCopies}
                onCheckedChange={(c) => setMakeIndependentCopies(!!c)}
                className="mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-800">Create independent record copies</span>
                <p className="text-slate-500 text-[11px]">
                  When checked, separate editable copies of this record will be created for each area, allowing custom local overrides without altering the shared definition.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-600 font-semibold"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedIds.size === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 h-9 shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Applying...
              </>
            ) : (
              `Apply to ${selectedIds.size} Area(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

