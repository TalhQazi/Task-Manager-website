import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Box, Plus, Search, RefreshCw, AlertTriangle, Package, Warehouse } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ name: "", sku: "", category: "Finished Good", quantity: "", unitCost: "", warehouse: "" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/inventory");
      if (res?.success) setItems(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/inventory", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ name: "", sku: "", category: "Finished Good", quantity: "", unitCost: "", warehouse: "" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(q.toLowerCase()) || 
    i.sku?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Box className="h-8 w-8 text-primary" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground">Track stock levels, warehouse locations, and inventory valuation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Package size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Total SKUs</p>
              <h3 className="text-2xl font-black">{items.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600"><AlertTriangle size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-600">Low Stock</p>
              <h3 className="text-2xl font-black">{items.filter(i => i.quantity <= i.reorderLevel).length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search inventory by name or SKU..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No inventory found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground flex items-center gap-1 mt-3"><Warehouse size={10} /> {item.warehouse || "Default"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${item.quantity <= item.reorderLevel ? "text-amber-600" : ""}`}>{item.quantity} {item.unitOfMeasure}</span>
                        {item.quantity <= item.reorderLevel && <AlertTriangle size={12} className="text-amber-600" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${item.unitCost?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-black">${(item.quantity * item.unitCost).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name</label>
              <Input placeholder="e.g., Office Desk" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU / Code</label>
                <Input placeholder="DESK-101" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="Finished Good">Finished Good</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Office Supply">Office Supply</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost</label>
                <Input type="number" placeholder="0.00" value={form.unitCost} onChange={e => setForm({...form, unitCost: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse / Location</label>
              <Input placeholder="e.g., Main Warehouse A" value={form.warehouse} onChange={e => setForm({...form, warehouse: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
