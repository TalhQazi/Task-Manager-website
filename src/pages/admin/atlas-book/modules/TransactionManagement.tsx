import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { ArrowRightLeft, Plus, Search, RefreshCw, TrendingUp, TrendingDown, Calendar, Wallet, Building2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function TransactionManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], type: "Expense", amount: "", account: "", company: "", companyLocation: "", description: "", paymentMethod: "Bank Transfer" });

  const load = async () => {
    try {
      setLoading(true);
      const [transRes, accountsRes, companiesRes] = await Promise.all([
        apiFetch("/api/atlasbook/transactions"),
        apiFetch("/api/atlasbook/accounts"),
        apiFetch("/api/companies"),
      ]);
      if (transRes?.success) setItems(transRes.items || []);
      if (accountsRes?.success) setAccounts(accountsRes.items || []);
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
      const res = await apiFetch("/api/atlasbook/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ date: new Date().toISOString().split("T")[0], type: "Expense", amount: "", account: "", company: "", companyLocation: "", description: "", paymentMethod: "Bank Transfer" });
        setCompanyLocations([]);
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => 
    i.description?.toLowerCase().includes(q.toLowerCase()) || 
    i.type?.toLowerCase().includes(q.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(q.toLowerCase())
  );

  const totalIncome = items.filter(i => i.type === "Income").reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = items.filter(i => i.type === "Expense").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-8 w-8 text-primary" />
            Transaction Management
          </h1>
          <p className="text-muted-foreground">Track all incoming and outgoing business transactions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> New Transaction</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white"><TrendingUp size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-600">Total Income</p>
              <h3 className="text-2xl font-black">${totalIncome.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-rose-500/10 border-rose-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-500 rounded-2xl text-white"><TrendingDown size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-rose-600">Total Expenses</p>
              <h3 className="text-2xl font-black">${totalExpense.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl text-white"><Wallet size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-primary">Net Balance</p>
              <h3 className="text-2xl font-black">${(totalIncome - totalExpense).toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search transactions or companies..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">No transactions found.</TableCell></TableRow>
              ) : (
                filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="text-sm font-medium"><Calendar size={12} className="inline mr-1" /> {new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === "Income" ? "default" : "secondary"} className={item.type === "Income" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600 text-white"}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{item.account?.name}</TableCell>
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
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell className="text-xs">{item.paymentMethod}</TableCell>
                    <TableCell className={`text-right font-bold ${item.type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {item.type === "Income" ? "+" : "-"}${item.amount.toLocaleString()}
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
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Income">Income (+)</option>
                  <option value="Expense">Expense (-)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GL Account</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.account} onChange={e => setForm({...form, account: e.target.value})}>
                <option value="">Select Account...</option>
                {accounts.map(a => <option key={a._id} value={a._id}>[{a.code}] {a.name}</option>)}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="What was this for?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Post Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
