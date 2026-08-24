import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Receipt, Plus, Search, RefreshCw, AlertCircle, CheckCircle2, Clock, Building2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function AccountsPayable() {
  const [items, setItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vendor: "", company: "", companyLocation: "", billNumber: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "", description: "", status: "Unpaid" });

  const [filterCompany, setFilterCompany] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterLocations, setFilterLocations] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const [billsRes, vendorsRes, companiesRes] = await Promise.all([
        apiFetch("/api/atlasbook/bills"),
        apiFetch("/api/vendors"),
        apiFetch("/api/companies"),
      ]);
      if (billsRes?.success) setItems(billsRes.items || []);
      if (vendorsRes) setVendors(Array.isArray(vendorsRes) ? vendorsRes : (vendorsRes.items || []));
      if (companiesRes) setCompanies(companiesRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Load locations when company changes
  const loadLocations = async (companyId: string) => {
    if (!companyId) { setCompanyLocations([]); return; }
    try {
      const res = await apiFetch(`/api/company-locations?company=${companyId}`);
      setCompanyLocations(res?.items || []);
    } catch { setCompanyLocations([]); }
  };

  const loadFilterLocations = async (companyId: string) => {
    if (!companyId) { setFilterLocations([]); return; }
    try {
      const res = await apiFetch(`/api/company-locations?company=${companyId}`);
      setFilterLocations(res?.items || []);
    } catch { setFilterLocations([]); }
  };

  const handleCompanyChange = (companyId: string) => {
    setForm({ ...form, company: companyId, companyLocation: "" });
    loadLocations(companyId);
  };

  const handleCreate = async () => {
    try {
      const payload = { ...form };
      if (!payload.company) delete (payload as any).company;
      if (!payload.companyLocation) delete (payload as any).companyLocation;
      const res = await apiFetch("/api/atlasbook/bills", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ vendor: "", company: "", companyLocation: "", billNumber: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "", description: "", status: "Unpaid" });
        setCompanyLocations([]);
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => {
    const matchesQ = i.billNumber?.toLowerCase().includes(q.toLowerCase()) || 
      i.vendor?.name?.toLowerCase().includes(q.toLowerCase()) ||
      i.company?.name?.toLowerCase().includes(q.toLowerCase());
    const matchesCompany = filterCompany ? (i.company?._id === filterCompany || i.company?.id === filterCompany) : true;
    const matchesLocation = filterLocation ? (i.companyLocation?._id === filterLocation || i.companyLocation?.id === filterLocation) : true;
    
    return matchesQ && matchesCompany && matchesLocation;
  });

  const totalUnpaid = items.filter(i => i.status === "Unpaid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Accounts Payable
          </h1>
          <p className="text-muted-foreground">Manage vendor bills and outstanding payment obligations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Bill</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft bg-orange-500/10 border-orange-500/20 col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-2xl text-white"><Clock size={24} /></div>
              <div>
                <p className="text-xs font-bold uppercase text-orange-600">Total Unpaid Bills</p>
                <h3 className="text-3xl font-black">${totalUnpaid.toLocaleString()}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Across {items.filter(i => i.status === "Unpaid").length} invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search bills, vendors, or companies..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-4 md:w-1/2">
            <select 
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterCompany}
              onChange={(e) => {
                setFilterCompany(e.target.value);
                setFilterLocation("");
                loadFilterLocations(e.target.value);
              }}
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
            </select>
            
            <select 
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              disabled={!filterCompany}
            >
              <option value="">All Locations</option>
              {filterLocations.map(loc => (
                <option key={loc._id} value={loc._id}>
                  {loc.label}{loc.address?.city ? ` — ${loc.address.city}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">No bills found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold">{item.billNumber}</TableCell>
                    <TableCell className="text-sm">{item.vendor?.name || "Unknown Vendor"}</TableCell>
                    <TableCell className="text-sm">
                      {item.company ? (
                        <span className="flex items-center gap-1">
                          <Building2 size={12} className="text-muted-foreground" />
                          {item.company.name}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.companyLocation ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-muted-foreground" />
                          {item.companyLocation.label}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">
                      {item.dueDate ? (
                        <span className={new Date(item.dueDate) < new Date() && item.status !== "Paid" ? "text-rose-500 font-bold" : ""}>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Paid" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black">${item.amount.toLocaleString()}</TableCell>
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
            <DialogTitle>Add Vendor Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}>
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1"><Building2 size={14} /> Company</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
                  <option value="">None</option>
                  {companies.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1"><MapPin size={14} /> Location</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.companyLocation} onChange={e => setForm({...form, companyLocation: e.target.value})} disabled={!form.company}>
                  <option value="">None</option>
                  {companyLocations.map(loc => <option key={loc._id} value={loc._id}>{loc.label}{loc.address?.city ? ` — ${loc.address.city}, ${loc.address.state}` : ""}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Number</label>
                <Input placeholder="INV-001" value={form.billNumber} onChange={e => setForm({...form, billNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Service or items purchased" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
