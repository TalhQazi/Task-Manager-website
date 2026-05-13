import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { LayoutDashboard, Plus, Search, RefreshCw, Home, User, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function UnitManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ property: "", unitNumber: "", type: "Residential", status: "Vacant", rentalPrice: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [unitsRes, propsRes] = await Promise.all([
        apiFetch("/api/atlasbook/units"),
        apiFetch("/api/atlasbook/properties")
      ]);
      if (unitsRes?.success) setItems(unitsRes.items || []);
      if (propsRes?.success) setProperties(propsRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/units", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ property: "", unitNumber: "", type: "Residential", status: "Vacant", rentalPrice: "" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.unitNumber?.toLowerCase().includes(q.toLowerCase()) || 
    i.property?.name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Unit Management
          </h1>
          <p className="text-muted-foreground">Manage individual units, occupancy, and rental information.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Unit</Button>
        </div>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search units or properties..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit #</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Occupant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No units found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold flex items-center gap-2"><Home size={14} className="text-primary" /> {item.unitNumber}</TableCell>
                    <TableCell className="text-sm">{item.property?.name || "N/A"}</TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Occupied" ? "default" : item.status === "Vacant" ? "secondary" : "outline"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">${item.rentalPrice?.toLocaleString() || "0"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <User size={12} className="text-muted-foreground" /> {item.occupantName || "None"}
                      </div>
                    </TableCell>
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
            <DialogTitle>Add New Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Property</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                value={form.property}
                onChange={e => setForm({...form, property: e.target.value})}
              >
                <option value="">Select Property...</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Number / ID</label>
              <Input placeholder="e.g., Suite 101" value={form.unitNumber} onChange={e => setForm({...form, unitNumber: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Rent</label>
                <Input type="number" placeholder="0.00" value={form.rentalPrice} onChange={e => setForm({...form, rentalPrice: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
