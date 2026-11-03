import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Textarea } from "@/components/admin/ui/textarea";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Plus,
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Check,
  Building2,
  MapPin,
  Layers,
  Palette,
  DollarSign,
  FileText,
  Calendar,
  Save,
} from "lucide-react";
import { PaintSwatch } from "./PaintSwatch";
import {
  createFinish,
  updateFinish,
  uploadFinishPhotos,
  fetchTaxonomies,
} from "@/lib/paintRegistryApi";
import type {
  FinishRecord,
  PhotoType,
  RecordStatus,
  UseType,
} from "@/types/paintRegistry";
import { toast } from "sonner";

interface AddEditPaintRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName?: string;
  editRecord?: FinishRecord | null;
  prefills?: {
    unitAreaName?: string;
    roomZoneName?: string;
    surfaceTypeName?: string;
  };
  onSuccess?: (record: FinishRecord) => void;
}

interface PendingPhoto {
  file?: File;
  dataUrl: string;
  photoType: PhotoType;
  caption: string;
  fileName: string;
}

export const AddEditPaintRecordModal: React.FC<AddEditPaintRecordModalProps> = ({
  open,
  onOpenChange,
  propertyId,
  propertyName = "Current Location",
  editRecord,
  prefills,
  onSuccess,
}) => {
  const isEditing = !!editRecord;

  // Form State
  const [unitAreaName, setUnitAreaName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomZoneName, setRoomZoneName] = useState("");
  const [surfaceTypeName, setSurfaceTypeName] = useState("Walls");

  const [manufacturer, setManufacturer] = useState("");
  const [productLine, setProductLine] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [customMixFormula, setCustomMixFormula] = useState("");
  const [sheenFinish, setSheenFinish] = useState("Eggshell");
  const [useType, setUseType] = useState<UseType>("Interior");
  const [primerUsed, setPrimerUsed] = useState("");
  const [coats, setCoats] = useState<number>(2);

  const [quantityUsed, setQuantityUsed] = useState<number>(1);
  const [quantityUnit, setQuantityUnit] = useState("Gallons");
  const [coverageNotes, setCoverageNotes] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [dateApplied, setDateApplied] = useState("");
  const [appliedBy, setAppliedBy] = useState("");

  const [notes, setNotes] = useState("");
  const [hexColor, setHexColor] = useState("#FFFFFF");
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("CURRENT");

  // Photos state
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Taxonomies
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [sheens, setSheens] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft local storage key
  const draftKey = `paint_draft_${propertyId}`;

  // Populate on open or edit
  useEffect(() => {
    if (!open) return;

    loadTaxonomies();

    if (editRecord) {
      setUnitAreaName(editRecord.unitAreaName || "");
      setBuildingName(editRecord.buildingName || "");
      setRoomZoneName(editRecord.roomZoneName || "");
      setSurfaceTypeName(editRecord.surfaceTypeName || "Walls");
      setManufacturer(editRecord.manufacturer || "");
      setProductLine(editRecord.productLine || "");
      setColorName(editRecord.colorName || "");
      setColorCode(editRecord.colorCode || "");
      setCustomMixFormula(editRecord.customMixFormula || "");
      setSheenFinish(editRecord.sheenFinish || "Eggshell");
      setUseType(editRecord.useType || "Interior");
      setPrimerUsed(editRecord.primerUsed || "");
      setCoats(editRecord.coats || 2);
      setQuantityUsed(editRecord.quantityUsed || 1);
      setQuantityUnit(editRecord.quantityUnit || "Gallons");
      setCoverageNotes(editRecord.coverageNotes || "");
      setPurchasedFrom(editRecord.purchasedFrom || "");
      setStoreLocation(editRecord.storeLocation || "");
      setUnitCost(editRecord.unitCost || 0);
      setCurrency(editRecord.currency || "USD");
      setDateApplied(
        editRecord.dateApplied ? editRecord.dateApplied.slice(0, 10) : ""
      );
      setAppliedBy(editRecord.appliedBy || "");
      setNotes(editRecord.notes || "");
      setHexColor(editRecord.hexColor || "#FFFFFF");
      setRecordStatus(editRecord.recordStatus || "CURRENT");
      setPendingPhotos([]);
    } else {
      // Prefills or restore draft
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !prefills?.surfaceTypeName) {
        try {
          const parsed = JSON.parse(savedDraft);
          setUnitAreaName(parsed.unitAreaName || "");
          setColorName(parsed.colorName || "");
          setColorCode(parsed.colorCode || "");
          setManufacturer(parsed.manufacturer || "");
          setHexColor(parsed.hexColor || "#FFFFFF");
        } catch {
          // ignore corrupted draft
        }
      }

      if (prefills) {
        if (prefills.unitAreaName) setUnitAreaName(prefills.unitAreaName);
        if (prefills.roomZoneName) setRoomZoneName(prefills.roomZoneName);
        if (prefills.surfaceTypeName) setSurfaceTypeName(prefills.surfaceTypeName);
      }
    }
  }, [open, editRecord, prefills]);

  const loadTaxonomies = async () => {
    try {
      const tax = await fetchTaxonomies();
      setSurfaces(tax.surfaces || ["Walls", "Ceiling", "Doors", "Baseboards", "Exterior Siding"]);
      setSheens(tax.sheens || ["Flat", "Matte", "Eggshell", "Satin", "Semi-Gloss", "Gloss"]);
    } catch {
      setSurfaces(["Walls", "Ceiling", "Doors", "Door Trim", "Baseboards", "Exterior Siding"]);
      setSheens(["Flat", "Eggshell", "Satin", "Semi-Gloss", "Gloss"]);
    }
  };

  // Auto-save draft locally for safety
  useEffect(() => {
    if (!isEditing && open && (colorName || colorCode || manufacturer)) {
      const draft = {
        unitAreaName,
        surfaceTypeName,
        colorName,
        colorCode,
        manufacturer,
        hexColor,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [unitAreaName, surfaceTypeName, colorName, colorCode, manufacturer, hexColor, isEditing, open]);

  // Handle Image Captures / Uploads
  const handleFilesSelected = (files: FileList | null, photoType: PhotoType = "paint_can") => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = String(e.target?.result || "");
        setPendingPhotos((prev) => [
          ...prev,
          {
            file,
            dataUrl,
            photoType,
            caption: file.name,
            fileName: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePendingPhoto = (idx: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surfaceTypeName.trim()) {
      toast.error("Surface type is required.");
      return;
    }
    if (!colorName.trim() && !colorCode.trim()) {
      toast.error("Please provide at least a Color Name or Color Code.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        propertyId,
        propertyName,
        buildingName: buildingName.trim(),
        unitAreaName: unitAreaName.trim() || "Common Areas",
        roomZoneName: roomZoneName.trim(),
        surfaceTypeId: surfaceTypeName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        surfaceTypeName: surfaceTypeName.trim(),
        materialCategory: "paint" as const,
        recordStatus,
        manufacturer: manufacturer.trim(),
        productLine: productLine.trim(),
        colorName: colorName.trim(),
        colorCode: colorCode.trim(), // Exact color code string preserved!
        customMixFormula: customMixFormula.trim(),
        sheenFinish: sheenFinish.trim(),
        useType,
        primerUsed: primerUsed.trim(),
        coats: Number(coats) || 1,
        quantityUsed: Number(quantityUsed) || 0,
        quantityUnit: quantityUnit.trim(),
        coverageNotes: coverageNotes.trim(),
        purchasedFrom: purchasedFrom.trim(),
        storeLocation: storeLocation.trim(),
        unitCost: Number(unitCost) || 0,
        currency: currency.trim() || "USD",
        dateApplied: dateApplied ? new Date(dateApplied).toISOString() : null,
        appliedBy: appliedBy.trim(),
        notes: notes.trim(),
        hexColor: hexColor.trim(),
      };

      let savedRecord: FinishRecord;

      if (isEditing && editRecord) {
        const res = await updateFinish(editRecord.id || (editRecord as any)._id, {
          ...payload,
          version: editRecord.version,
        });
        savedRecord = res.finish;
        toast.success("Paint record updated successfully.");
      } else {
        const res = await createFinish(payload);
        savedRecord = res.finish;
        if (res.supersededRecordId) {
          toast.success("New Current paint recorded! Previous record marked as historical.");
        } else {
          toast.success("Paint finish record created successfully.");
        }
        localStorage.removeItem(draftKey);
      }

      // Upload pending photos if any
      if (pendingPhotos.length > 0 && (savedRecord.id || (savedRecord as any)._id)) {
        setUploadProgress(true);
        const recordId = savedRecord.id || (savedRecord as any)._id;
        const formData = new FormData();
        pendingPhotos.forEach((p, idx) => {
          if (p.file) {
            formData.append("photos", p.file);
            formData.append(`photoType_${idx}`, p.photoType);
            formData.append(`caption_${idx}`, p.caption);
          } else if (p.dataUrl) {
            formData.append("photoDataUrl", p.dataUrl);
            formData.append("photoType", p.photoType);
            formData.append("caption", p.caption);
          }
        });

        await uploadFinishPhotos(recordId, formData);
        setUploadProgress(false);
      }

      onOpenChange(false);
      if (onSuccess) onSuccess(savedRecord);
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes("conflict")) {
        toast.error("Conflict detected: This record was edited elsewhere. Please refresh before saving.");
      } else {
        toast.error(err.message || "Failed to save paint record.");
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
                <Palette className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {isEditing ? "Edit Paint Record" : "Add Paint & Finish Record"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Record exact formulation, manufacturer specifications, and label evidence
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-semibold px-2.5 py-1">
              {propertyName}
            </Badge>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* SECTION 1: Location Hierarchy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Location Hierarchy
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unit / Area</Label>
                <Input
                  placeholder="e.g. Unit 4, Common Areas, Exterior"
                  value={unitAreaName}
                  onChange={(e) => setUnitAreaName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Room / Zone (Optional)</Label>
                <Input
                  placeholder="e.g. Bedroom 2, Lobby, Ceiling"
                  value={roomZoneName}
                  onChange={(e) => setRoomZoneName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Surface Type *</span>
                </Label>
                <Select value={surfaceTypeName} onValueChange={setSurfaceTypeName}>
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Surface" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {surfaces.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Paint Specification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <Palette className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Paint & Coating Specifications
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Manufacturer</Label>
                <Input
                  placeholder="e.g. Sherwin-Williams, Benjamin Moore"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Product Line</Label>
                <Input
                  placeholder="e.g. Emerald, SuperPaint, Regal Select"
                  value={productLine}
                  onChange={(e) => setProductLine(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900">Color Name *</Label>
                <Input
                  placeholder="e.g. Agreeable Gray, Alabaster"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-900">
                  Exact Color / Mix Code *
                </Label>
                <Input
                  placeholder="e.g. SW 7029, HC-172, 001-4A"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Sheen / Finish</Label>
                <Select value={sheenFinish} onValueChange={setSheenFinish}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Sheen" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sheens.map((sh) => (
                      <SelectItem key={sh} value={sh} className="text-xs">
                        {sh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Use Type</Label>
                <Select value={useType} onValueChange={(v) => setUseType(v as UseType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Use Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interior" className="text-xs">Interior</SelectItem>
                    <SelectItem value="Exterior" className="text-xs">Exterior</SelectItem>
                    <SelectItem value="Both" className="text-xs">Both</SelectItem>
                    <SelectItem value="N/A" className="text-xs">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Custom Tint / Mix Formula
                </Label>
                <Input
                  placeholder="e.g. CCE*ColorCast: BAC W1 24/32, B1 4/32, Y3 12/32"
                  value={customMixFormula}
                  onChange={(e) => setCustomMixFormula(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Swatch & Hex */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Visual Swatch (Hex)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexColor.startsWith("#") ? hexColor : "#FFFFFF"}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="h-8 w-10 p-0.5 rounded cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Usage, Primer, & Purchasing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Purchasing & Application Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Purchased From</Label>
                <Input
                  placeholder="e.g. Lowe's, Home Depot, SW Store"
                  value={purchasedFrom}
                  onChange={(e) => setPurchasedFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Store Location / Address</Label>
                <Input
                  placeholder="e.g. Store #1043, Main St."
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unit Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 64.99"
                  value={unitCost || ""}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Date Applied</Label>
                <Input
                  type="date"
                  value={dateApplied}
                  onChange={(e) => setDateApplied(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Quantity Used</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={quantityUsed || ""}
                  onChange={(e) => setQuantityUsed(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Quantity Unit</Label>
                <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gallons" className="text-xs">Gallons</SelectItem>
                    <SelectItem value="Quarts" className="text-xs">Quarts</SelectItem>
                    <SelectItem value="Pints" className="text-xs">Pints</SelectItem>
                    <SelectItem value="Liters" className="text-xs">Liters</SelectItem>
                    <SelectItem value="Buckets (5-Gal)" className="text-xs">5-Gal Buckets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Number of Coats</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={coats}
                  onChange={(e) => setCoats(parseInt(e.target.value, 10) || 1)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Applied By</Label>
                <Input
                  placeholder="e.g. John Doe / Pro Maintenance"
                  value={appliedBy}
                  onChange={(e) => setAppliedBy(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Internal Notes / Instructions</Label>
              <Textarea
                placeholder="Specific room prep notes, scuff marks instructions, touch-up suggestions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          {/* SECTION 4: Photo & Label Evidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Photo & Label Evidence
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Can, Mix Label, Finished Wall, or Receipt
              </span>
            </div>

            {/* Upload Buttons: Camera & File Picker */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files, "paint_can")}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files, "color_code_label")}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="h-8 text-xs bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Capture with Camera
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Images / PDF
              </Button>
            </div>

            {/* Pending Photos Preview */}
            {pendingPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {pendingPhotos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="h-20 rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={p.dataUrl}
                        alt="Evidence preview"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <Select
                      value={p.photoType}
                      onValueChange={(val) => {
                        setPendingPhotos((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, photoType: val as PhotoType } : item
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="h-6 text-[10px] px-1.5 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paint_can" className="text-xs">Paint Can</SelectItem>
                        <SelectItem value="color_code_label" className="text-xs">Color Code Label</SelectItem>
                        <SelectItem value="finished_surface" className="text-xs">Finished Surface</SelectItem>
                        <SelectItem value="receipt" className="text-xs">Receipt</SelectItem>
                        <SelectItem value="other" className="text-xs">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => removePendingPhoto(idx)}
                      className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Record Status Selector */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Record Status</p>
              <p className="text-[11px] text-slate-500">
                Current will supersede existing finish for this surface. Draft can be finalized later.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={recordStatus === "CURRENT" ? "default" : "outline"}
                onClick={() => setRecordStatus("CURRENT")}
                className={`h-7 text-xs font-bold ${
                  recordStatus === "CURRENT"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600"
                }`}
              >
                Current Active
              </Button>
              <Button
                type="button"
                size="sm"
                variant={recordStatus === "DRAFT" ? "default" : "outline"}
                onClick={() => setRecordStatus("DRAFT")}
                className={`h-7 text-xs font-bold ${
                  recordStatus === "DRAFT"
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    : "text-slate-600"
                }`}
              >
                Draft
              </Button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-slate-50 border-t flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-600 font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploadProgress}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 h-9 shadow-md"
          >
            {submitting || uploadProgress ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                {uploadProgress ? "Uploading Photos..." : "Saving..."}
              </>
            ) : (
              <>{isEditing ? "Update Paint Record" : "Save Paint Record"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

