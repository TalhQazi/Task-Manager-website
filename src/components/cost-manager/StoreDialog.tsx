import React, { useEffect, useState } from "react";
import {
  CostLineItem,
  CostSheetPayload,
  InventoryRecord,
  createInventoryRecord,
  deleteInventoryRecord,
  fileToDataUrl,
  getItemInventory,
} from "@/lib/costManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Loader2, MapPin, QrCode, Trash2 } from "lucide-react";

// Mark as Received & Store workflow. Supports splitting quantity across
// multiple physical locations; each record gets a QR lookup code.
export default function StoreDialog({
  item,
  onClose,
  onSaved,
  onError,
}: {
  item: CostLineItem;
  onClose: () => void;
  onSaved: (payload: CostSheetPayload) => void;
  onError: (err: unknown) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    locationName: "",
    address: "",
    building: "",
    room: "",
    aisle: "",
    shelf: "",
    bin: "",
    qtyStored: String(item.qty || 1),
    unit: item.unit || "",
    notes: "",
  });

  useEffect(() => {
    getItemInventory(item.id)
      .then((res) => setRecords(res.items))
      .catch(() => undefined)
      .finally(() => setLoadingRecords(false));
  }, [item.id]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const hasDetail = [form.building, form.room, form.aisle, form.shelf, form.bin].some((v) => v.trim().length > 0);
  const valid = form.locationName.trim().length > 0 && hasDetail;

  const save = async () => {
    setSaving(true);
    try {
      const payload = await createInventoryRecord(item.id, {
        locationName: form.locationName.trim(),
        address: form.address,
        building: form.building,
        room: form.room,
        aisle: form.aisle,
        shelf: form.shelf,
        bin: form.bin,
        qtyStored: Number(form.qtyStored) || 0,
        unit: form.unit,
        notes: form.notes,
        ...(photoFile ? { photoDataUrl: await fileToDataUrl(photoFile) } : {}),
        markStored: true,
      });
      onSaved(payload);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Received &amp; Store</DialogTitle>
          <DialogDescription>
            "{item.itemName}" — record exactly where this item is stored. Add multiple records to split quantity
            across locations.
          </DialogDescription>
        </DialogHeader>

        {!loadingRecords && records.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Current storage locations</p>
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs">
                <div className="min-w-0">
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span className="truncate">
                      {[r.locationName, r.building, r.room, r.aisle, r.shelf, r.bin].filter(Boolean).join(" / ")}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {r.qtyStored > 0 && `${r.qtyStored}${r.unit ? ` ${r.unit}` : ""} stored`}
                    {r.storedByUsername && ` by ${r.storedByUsername}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 cursor-pointer"
                    title="Copy lookup code"
                    onClick={() => void navigator.clipboard?.writeText(r.qrCode)}
                  >
                    <QrCode className="w-3 h-3" /> {r.qrCode} <Copy className="w-2.5 h-2.5" />
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (!window.confirm("Remove this storage record?")) return;
                      try {
                        const payload = await deleteInventoryRecord(r.id);
                        setRecords((prev) => prev.filter((x) => x.id !== r.id));
                        onSaved(payload);
                      } catch (err) {
                        onError(err);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label className="text-xs">Location Name * (e.g. Pittsfield Warehouse, Brewer Shop)</Label>
            <Input value={form.locationName} onChange={(e) => set("locationName", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Street Address</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Building / Warehouse</Label>
            <Input value={form.building} onChange={(e) => set("building", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Room / Zone</Label>
            <Input value={form.room} onChange={(e) => set("room", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Aisle / Rack</Label>
            <Input value={form.aisle} onChange={(e) => set("aisle", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Shelf</Label>
            <Input value={form.shelf} onChange={(e) => set("shelf", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Bin / Cabinet / Drawer</Label>
            <Input value={form.bin} onChange={(e) => set("bin", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Quantity Stored</Label>
            <div className="flex gap-1">
              <Input type="number" min="0" value={form.qtyStored} onChange={(e) => set("qtyStored", e.target.value)} />
              <Input
                className="w-20"
                placeholder="unit"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Photo of bin / shelf / pallet (optional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[40px]" />
          </div>
          {!valid && (
            <p className="col-span-2 text-xs text-amber-600">
              A location name plus at least one exact placement (building, room, aisle, shelf, or bin) is required.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} disabled={saving || !valid}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <MapPin className="w-3.5 h-3.5 mr-1" /> Store Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
