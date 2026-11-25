import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Building2,
  MapPin,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  Tag,
  ImageIcon,
} from "lucide-react";
import { PaintSwatch } from "./PaintSwatch";
import { quickLookupFinish, fetchTaxonomies } from "@/lib/paintRegistryApi";
import type { FinishRecord } from "@/types/paintRegistry";
import { toProxiedUrl } from "@/lib/admin/apiClient";

interface WhatPaintDoINeedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName?: string;
  onOpenAddModal?: (prefills: {
    unitAreaName: string;
    roomZoneName: string;
    surfaceTypeName: string;
  }) => void;
  onOpenDetailModal?: (finish: FinishRecord) => void;
}

export const WhatPaintDoINeedModal: React.FC<WhatPaintDoINeedModalProps> = ({
  open,
  onOpenChange,
  propertyId,
  propertyName = "Current Property",
  onOpenAddModal,
  onOpenDetailModal,
}) => {
  // 4 Steps / Taps:
  // 1. Property (Pre-filled or selected)
  // 2. Unit / Area
  // 3. Room / Zone (optional)
  // 4. Surface
  const [unitArea, setUnitArea] = useState<string>("Common Areas");
  const [customUnit, setCustomUnit] = useState<string>("");
  const [roomZone, setRoomZone] = useState<string>("");
  const [surfaceType, setSurfaceType] = useState<string>("Walls");

  const [availableSurfaces, setAvailableSurfaces] = useState<string[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(false);

  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultFinish, setResultFinish] = useState<FinishRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const COMMON_AREAS = [
    "Common Areas",
    "Exterior",
    "Lobby",
    "Hallways",
    "Leasing Office",
    "Maintenance Shop",
    "Unit 1",
    "Unit 2",
    "Unit 3",
    "Unit 4",
    "Unit 5",
    "Unit 6",
    "Custom Unit...",
  ];

  const COMMON_ROOMS = [
    "Living Room",
    "Master Bedroom",
    "Bedroom 2",
    "Kitchen",
    "Bathroom",
    "Entryway",
    "Balcony / Patio",
  ];

  useEffect(() => {
    if (open) {
      loadTaxonomies();
    }
  }, [open]);

  const loadTaxonomies = async () => {
    try {
      setLoadingTaxonomies(true);
      const tax = await fetchTaxonomies();
      setAvailableSurfaces(tax.surfaces || ["Walls", "Ceiling", "Doors", "Door Trim", "Baseboards", "Exterior Siding"]);
    } catch {
      setAvailableSurfaces(["Walls", "Ceiling", "Doors", "Door Trim", "Baseboards", "Exterior Siding"]);
    } finally {
      setLoadingTaxonomies(false);
    }
  };

  const executeLookup = async (unit: string, room: string, surface: string) => {
    if (!propertyId || !surface) return;
    try {
      setSearching(true);
      setErrorMessage(null);
      setHasSearched(true);
      const activeUnit = unit === "Custom Unit..." ? customUnit : unit;
      const res = await quickLookupFinish({
        propertyId,
        unitAreaName: activeUnit || undefined,
        roomZoneName: room || undefined,
        surfaceTypeName: surface,
      });

      if (res.found && res.finish) {
        setResultFinish(res.finish);
      } else {
        setResultFinish(null);
        setErrorMessage(
          res.message ||
            `No Current paint record found for ${surface} at ${activeUnit || "Property level"}.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to lookup paint specifications.");
      setResultFinish(null);
    } finally {
      setSearching(false);
    }
  };

  // Immediate lookup on surface or unit change once initial search is triggered
  useEffect(() => {
    if (open && propertyId) {
      executeLookup(unitArea, roomZone, surfaceType);
    }
  }, [unitArea, customUnit, roomZone, surfaceType, open, propertyId]);

  const activeUnit = unitArea === "Custom Unit..." ? customUnit : unitArea;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                What Paint Do I Need?
              </DialogTitle>
              <p className="text-blue-100 text-xs mt-0.5">
                Instant 4-tap lookup for maintenance technicians and field crews
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1">
          {/* Quick Select Grid (Mobile Optimized Big Touch Targets) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200">
            {/* Tap 1: Unit / Area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-blue-600" /> 1. Unit / Area
              </Label>
              <Select value={unitArea} onValueChange={setUnitArea}>
                <SelectTrigger className="h-10 text-xs font-medium bg-white">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COMMON_AREAS.map((a) => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unitArea === "Custom Unit..." && (
                <Input
                  placeholder="e.g. Unit 402 or Attic"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="h-8 text-xs mt-1 bg-white"
                />
              )}
            </div>

            {/* Tap 2: Room / Zone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" /> 2. Room (Optional)
              </Label>
              <Select value={roomZone} onValueChange={setRoomZone}>
                <SelectTrigger className="h-10 text-xs font-medium bg-white">
                  <SelectValue placeholder="Any / Entire Area" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="" className="text-xs">
                    Entire Area / All Rooms
                  </SelectItem>
                  {COMMON_ROOMS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tap 3: Surface */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-emerald-600" /> 3. Surface
              </Label>
              <Select value={surfaceType} onValueChange={setSurfaceType}>
                <SelectTrigger className="h-10 text-xs font-medium bg-white">
                  <SelectValue placeholder="Select Surface" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableSurfaces.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-medium">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Lookup Result Card */}
          {searching ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Retrieving verified paint record...</p>
            </div>
          ) : resultFinish ? (
            <div className="p-5 bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border-2 border-blue-200 shadow-md space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase px-2.5 py-0.5 shadow-sm">
                    Verified Current Paint
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {resultFinish.useType || "Interior"}
                  </span>
                </div>
                {resultFinish.updatedAt && (
                  <span className="text-[11px] text-slate-400">
                    Recorded {new Date(resultFinish.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Main Swatch & Color Information */}
              <div className="flex items-start gap-4">
                <PaintSwatch
                  color={resultFinish.hexColor}
                  size="xl"
                  allowCopy={true}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {resultFinish.colorName || "Custom Paint Formulation"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-sm bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md">
                      {resultFinish.colorCode || "No Code Recorded"}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold text-slate-700">
                      {resultFinish.sheenFinish || "Eggshell"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1.5">
                    {resultFinish.manufacturer || "Manufacturer Unspecified"}
                    {resultFinish.productLine ? ` • ${resultFinish.productLine}` : ""}
                  </p>
                </div>
              </div>

              {/* Purchasing & Application Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/80 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Store / Source
                  </span>
                  <p className="font-semibold text-slate-800 truncate mt-0.5">
                    {resultFinish.purchasedFrom || "Not Recorded"}
                  </p>
                  {resultFinish.storeLocation && (
                    <span className="text-[10px] text-slate-500 truncate block">
                      {resultFinish.storeLocation}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Coats & Primer
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {resultFinish.coats ? `${resultFinish.coats} Coat(s)` : "Standard"}
                  </p>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {resultFinish.primerUsed ? `Primer: ${resultFinish.primerUsed}` : "Self-priming"}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Quantity Used
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {resultFinish.quantityUsed
                      ? `${resultFinish.quantityUsed} ${resultFinish.quantityUnit || "Gal"}`
                      : "Unspecified"}
                  </p>
                  {resultFinish.unitCost ? (
                    <span className="text-[10px] text-slate-500 block">
                      ${resultFinish.unitCost} / {resultFinish.quantityUnit || "gal"}
                    </span>
                  ) : null}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Mix Formula
                  </span>
                  <p className="font-semibold text-slate-800 truncate mt-0.5">
                    {resultFinish.customMixFormula || "Factory Standard"}
                  </p>
                </div>
              </div>

              {/* Photos Preview */}
              {resultFinish.photos && resultFinish.photos.length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                    Can & Color Label Photos ({resultFinish.photos.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {resultFinish.photos.map((p, idx) => (
                      <div
                        key={idx}
                        className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-sm"
                      >
                        <img
                          src={toProxiedUrl(p.thumbnailUrl || p.fileUrl)}
                          alt="Paint photo"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    if (onOpenDetailModal) onOpenDetailModal(resultFinish);
                  }}
                  className="h-8 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View Full Record & History
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${resultFinish.manufacturer || ""} ${resultFinish.colorName || ""} (${resultFinish.colorCode || ""}) - ${resultFinish.sheenFinish || ""}`
                    );
                    alert("Paint specifications copied to clipboard!");
                  }}
                  className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  Copy Specs to Clipboard
                </Button>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="p-8 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">No Current Paint Recorded</h4>
                <p className="text-xs text-amber-700 mt-1 max-w-sm mx-auto">
                  {errorMessage ||
                    `We don't have a verified paint record for ${surfaceType} in ${activeUnit || "this location"}.`}
                </p>
              </div>
              {onOpenAddModal && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenAddModal({
                      unitAreaName: activeUnit,
                      roomZoneName: roomZone,
                      surfaceTypeName: surfaceType,
                    });
                  }}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Record This Paint Now
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold h-8"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

