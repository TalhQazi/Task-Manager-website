import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Users, Plus, Search, RefreshCw, Mail, Phone, UserCheck, ShieldAlert } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function TenantManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    type: "Individual", 
    status: "Active",
    assignedProperty: "",
    assignedUnit: "",
    locationName: "",
    address: ""
  });

  const load = async () => {
    try {
      setLoading(true);
      const [tenantsRes, propsRes, unitsRes, locationsRes] = await Promise.all([
        apiFetch("/api/atlasbook/tenants"),
        apiFetch("/api/atlasbook/properties").catch(() => null),
        apiFetch("/api/atlasbook/units").catch(() => null),
        apiFetch("/api/locations").catch(() => null)
      ]);
      if (tenantsRes?.success) setItems(tenantsRes.items || []);
      if (propsRes?.success) setProperties(propsRes.items || []);
      if (unitsRes?.success) setUnits(unitsRes.items || []);
      if (locationsRes?.items) setLocations(locationsRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/tenants", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ 
          name: "", 
          email: "", 
          phone: "", 
          type: "Individual", 
          status: "Active",
          assignedProperty: "",
          assignedUnit: "",
          locationName: "",
          address: ""
        });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(q.toLowerCase()) || 
    i.email?.toLowerCase().includes(q.toLowerCase()) ||
    i.assignedProperty?.toLowerCase().includes(q.toLowerCase()) ||
    i.assignedUnit?.toLowerCase().includes(q.toLowerCase()) ||
    i.locationName?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Tenant Management
          </h1>
          <p className="text-muted-foreground">Manage tenant profiles, contact information, and lease history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Tenant</Button>
        </div>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search tenants by name, email, property, unit, or location..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>History</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground italic">No tenants found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={10} /> {item.email || "No email"}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={10} /> {item.phone || "No phone"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.assignedProperty || "None"}</TableCell>
                    <TableCell className="text-sm">{item.assignedUnit || "None"}</TableCell>
                    <TableCell className="text-sm">{item.address || "None"}</TableCell>
                    <TableCell className="text-sm">{item.locationName || "None"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">No lease history</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
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
            <DialogTitle>Add New Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name / Entity Name</label>
              <Input placeholder="e.g., Jane Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Former">Former</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring text-foreground"
                  value={form.assignedProperty}
                  onChange={e => setForm({...form, assignedProperty: e.target.value})}
                >
                  <option value="">None</option>
                  {properties.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring text-foreground"
                  value={form.locationName}
                  onChange={e => setForm({...form, locationName: e.target.value})}
                >
                  <option value="">None</option>
                  {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Input placeholder="e.g. Apt 4B, Suite 100" value={form.assignedUnit} onChange={e => setForm({...form, assignedUnit: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Street Address, City, State, ZIP" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
