import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Building, Plus, Search, RefreshCw, Landmark, Truck, Monitor, Wrench } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function FixedAssetManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ name: "", category: "Equipment", purchaseDate: "", purchasePrice: "", assetTag: "", usefulLifeYears: "5" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/assets");
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
      const res = await apiFetch("/api/atlasbook/assets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ name: "", category: "Equipment", purchaseDate: "", purchasePrice: "", assetTag: "", usefulLifeYears: "5" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(q.toLowerCase()) || 
    i.assetTag?.toLowerCase().includes(q.toLowerCase())
  );

  const totalValue = items.reduce((sum, i) => sum + i.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Fixed Asset Management
          </h1>
          <p className="text-muted-foreground">Track capital assets, calculate depreciation, and manage your asset register.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Register Asset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-slate-900 text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl"><Landmark size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Asset Value</p>
              <h3 className="text-2xl font-black">${totalValue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search assets by name or tag..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name / Tag</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Book Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No assets registered.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.assetTag}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.category === "Vehicle" && <Truck size={14} className="text-muted-foreground" />}
                        {item.category === "IT Hardware" && <Monitor size={14} className="text-muted-foreground" />}
                        {item.category === "Equipment" && <Wrench size={14} className="text-muted-foreground" />}
                        <span className="text-sm">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">${item.purchasePrice?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-black text-primary">${item.currentBookValue?.toLocaleString() || item.purchasePrice?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
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
            <DialogTitle>Register Fixed Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Name</label>
              <Input placeholder="e.g., Company Delivery Truck" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="Land">Land</option>
                  <option value="Building">Building</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Furniture">Furniture</option>
                  <option value="IT Hardware">IT Hardware</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Tag / S/N</label>
                <Input placeholder="TAG-2024-001" value={form.assetTag} onChange={e => setForm({...form, assetTag: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Price</label>
                <Input type="number" placeholder="0.00" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Useful Life (Years)</label>
              <Input type="number" value={form.usefulLifeYears} onChange={e => setForm({...form, usefulLifeYears: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
