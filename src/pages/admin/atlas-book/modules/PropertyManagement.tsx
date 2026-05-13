import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { Landmark, Plus, Search, RefreshCw, MapPin, DollarSign, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function PropertyManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  // New Property Form
  const [form, setForm] = useState({ name: "", address: "", parcelInformation: "", purchasePrice: "", status: "Active" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/properties");
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
      const res = await apiFetch("/api/atlasbook/properties", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ name: "", address: "", parcelInformation: "", purchasePrice: "", status: "Active" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(q.toLowerCase()) || 
    i.address?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            Property Management
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Register and track all company-owned properties and parcels.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={load} disabled={loading} className="flex-1 sm:flex-none">
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          </Button>
          <Button onClick={() => setOpen(true)} className="flex-1 sm:flex-none gap-2">
            <Plus size={16} /> Add Property
          </Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search by name or address..." 
              className="pl-10" 
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No properties found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin size={12} /> {item.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign size={12} /> {item.purchasePrice?.toLocaleString() || "0"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Manage Units</Button>
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
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Enter the legal and financial details of the property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Name</label>
              <Input placeholder="e.g., Downtown Plaza" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Full physical address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Price</label>
                <Input type="number" placeholder="0.00" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
