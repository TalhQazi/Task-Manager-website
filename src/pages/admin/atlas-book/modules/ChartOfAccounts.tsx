import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { ListTree, Plus, Search, RefreshCw, Calculator, FileText, Building2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function ChartOfAccounts() {
  const [items, setItems] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ code: "", name: "", type: "Asset", description: "", company: "", companyLocation: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [res, companiesRes] = await Promise.all([
        apiFetch("/api/atlasbook/accounts"),
        apiFetch("/api/companies")
      ]);
      if (res?.success) setItems(res.items || []);
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
      const res = await apiFetch("/api/atlasbook/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ code: "", name: "", type: "Asset", description: "", company: "", companyLocation: "" });
        setCompanyLocations([]);
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(q.toLowerCase()) || 
    i.code?.toLowerCase().includes(q.toLowerCase()) ||
    i.type?.toLowerCase().includes(q.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ListTree className="h-8 w-8 text-primary" />
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">Define your organization's account structure for financial tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Account</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {["Asset", "Liability", "Equity", "Revenue", "Expense"].map(type => (
          <Card key={type} className="shadow-soft bg-card/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">{type}s</span>
              <span className="text-2xl font-black">{items.filter(i => i.type === type).length}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search accounts by code, name or type..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">No accounts found.</TableCell></TableRow>
              ) : (
                filtered.sort((a,b) => a.code.localeCompare(b.code)).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-mono text-sm font-bold text-primary">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        item.type === "Asset" ? "border-emerald-500 text-emerald-600" :
                        item.type === "Liability" ? "border-red-500 text-red-600" :
                        item.type === "Equity" ? "border-indigo-500 text-indigo-600" :
                        item.type === "Revenue" ? "border-blue-500 text-blue-600" :
                        "border-orange-500 text-orange-600"
                      }>
                        {item.type}
                      </Badge>
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
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.description || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-bold">${item.balance?.toLocaleString() || "0"}</TableCell>
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
            <DialogTitle>Define Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                <label className="text-sm font-medium">Account Code</label>
                <Input placeholder="1001" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Account Name</label>
                <Input placeholder="e.g., Main Checking" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                placeholder="Optional notes about this account..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
