import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Wallet, Plus, Search, RefreshCw, Send, CheckCircle2, User, Building2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function AccountsReceivable() {
  const [items, setItems] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ customerName: "", tenant: "", company: "", companyLocation: "", invoiceNumber: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "", status: "Sent" });

  const load = async () => {
    try {
      setLoading(true);
      const [invRes, tenantsRes, companiesRes] = await Promise.all([
        apiFetch("/api/atlasbook/invoices"),
        apiFetch("/api/atlasbook/tenants"),
        apiFetch("/api/companies"),
      ]);
      if (invRes?.success) setItems(invRes.items || []);
      if (tenantsRes?.success) setTenants(tenantsRes.items || []);
      if (companiesRes) setCompanies(companiesRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadLocations = async (companyId: string) => {
    if (!companyId) { setCompanyLocations([]); return; }
    try {
      const res = await apiFetch(`/api/company-locations?company=${companyId}`);
      setCompanyLocations(res?.items || []);
    } catch { setCompanyLocations([]); }
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
      if (!payload.tenant) delete (payload as any).tenant;
      const res = await apiFetch("/api/atlasbook/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ customerName: "", tenant: "", company: "", companyLocation: "", invoiceNumber: "", date: new Date().toISOString().split("T")[0], dueDate: "", amount: "", status: "Sent" });
        setCompanyLocations([]);
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.invoiceNumber?.toLowerCase().includes(q.toLowerCase()) || 
    i.customerName?.toLowerCase().includes(q.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(q.toLowerCase())
  );

  const totalOutstanding = items.filter(i => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Accounts Receivable
          </h1>
          <p className="text-muted-foreground">Manage customer invoices and payment collections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> New Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft bg-blue-500/10 border-blue-500/20 col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-2xl text-white"><Send size={24} /></div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-600">Outstanding Receivables</p>
                <h3 className="text-3xl font-black">${totalOutstanding.toLocaleString()}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{items.filter(i => i.status !== "Paid").length} pending invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search invoices, customers, or companies..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer / Tenant</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">No invoices found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold">{item.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>{item.customerName}</span>
                        {item.tenant && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><User size={8} /> Tenant</span>}
                      </div>
                    </TableCell>
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
                    <TableCell className="text-xs">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}</TableCell>
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
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name</label>
              <Input placeholder="John Doe or Company Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to Tenant (Optional)</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tenant} onChange={e => setForm({...form, tenant: e.target.value})}>
                <option value="">None</option>
                {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
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
                <label className="text-sm font-medium">Invoice Number</label>
                <Input placeholder="INV-2024-001" value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Issue Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
