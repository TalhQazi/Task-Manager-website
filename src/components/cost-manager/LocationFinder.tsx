import React, { useEffect, useState } from "react";
import { InventorySearchResult, PURCHASE_STATUS_META, searchInventory } from "@/lib/costManager";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, QrCode, Search } from "lucide-react";

// Global inventory search across every project: find any purchased item by
// name, vendor, project, warehouse, room, aisle, shelf, bin, or QR code.
export default function LocationFinder({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InventorySearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      searchInventory(search)
        .then((res) => setResults(res.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Inventory Location Finder
          </DialogTitle>
          <DialogDescription>
            Search all stored items across every project, warehouse, shop, and storage unit.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Item, vendor, project, warehouse, room, shelf, bin, or QR code..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "No stored items match that search." : "No inventory records yet — store a purchased item first."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="px-2 py-1.5">Item</th>
                  <th className="px-2 py-1.5">Project</th>
                  <th className="px-2 py-1.5">Qty</th>
                  <th className="px-2 py-1.5">Location</th>
                  <th className="px-2 py-1.5">Code</th>
                  <th className="px-2 py-1.5">Stored By</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-2">
                      <p className="font-medium">{r.itemName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] ${PURCHASE_STATUS_META[r.purchaseStatus]?.className || ""}`}>
                          {PURCHASE_STATUS_META[r.purchaseStatus]?.label || r.purchaseStatus}
                        </Badge>
                        {r.vendorName && <span className="text-muted-foreground">{r.vendorName}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2">{r.projectName || "—"}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {r.qtyStored > 0 ? `${r.qtyStored}${r.unit ? ` ${r.unit}` : ""}` : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {[r.locationName, r.building, r.room, r.aisle, r.shelf, r.bin].filter(Boolean).join(" / ")}
                      </span>
                      {r.address && <p className="text-muted-foreground mt-0.5">{r.address}</p>}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                        <QrCode className="w-3 h-3" /> {r.qrCode}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {r.storedByUsername || "—"}
                      {r.storedAt && (
                        <p className="text-muted-foreground">{new Date(r.storedAt).toLocaleDateString()}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
