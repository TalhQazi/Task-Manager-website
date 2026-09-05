import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Calculator, Plus, Search, RefreshCw, FileText, ArrowRightLeft, Calendar, Building2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function GeneralLedger() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLocations, setCompanyLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // New Journal Entry Form
  const [form, setForm] = useState({
    description: "",
    transactionDate: new Date().toISOString().split("T")[0],
    company: "",
    companyLocation: "",
    lines: [
      { account: "", debit: 0, credit: 0 },
      { account: "", debit: 0, credit: 0 }
    ]
  });

  const load = async () => {
    try {
      setLoading(true);
      const [journalRes, accountsRes, companiesRes] = await Promise.all([
        apiFetch("/api/atlasbook/journal"),
        apiFetch("/api/atlasbook/accounts"),
        apiFetch("/api/companies"),
      ]);
      if (journalRes?.success) setItems(journalRes.items || []);
      if (accountsRes?.success) setAccounts(accountsRes.items || []);
      if (companiesRes) setCompanies(companiesRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddLine = () => {
    setForm({ ...form, lines: [...form.lines, { account: "", debit: 0, credit: 0 }] });
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...form.lines];
    (newLines[index] as any)[field] = value;
    setForm({ ...form, lines: newLines });
  };

  const totalDebit = form.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

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
    if (!isBalanced) return;
    try {
      const payload = { ...form };
      if (!payload.company) delete (payload as any).company;
      if (!payload.companyLocation) delete (payload as any).companyLocation;

      const res = await apiFetch("/api/atlasbook/journal", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        setOpen(false);
        setForm({
          description: "",
          transactionDate: new Date().toISOString().split("T")[0],
          company: "",
          companyLocation: "",
          lines: [{ account: "", debit: 0, credit: 0 }, { account: "", debit: 0, credit: 0 }]
        });
        setCompanyLocations([]);
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            General Ledger
          </h1>
          <p className="text-muted-foreground">Double-entry accounting journal for all financial transactions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus size={16} /> New Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div>
        ) : items.length === 0 ? (
          <Card className="shadow-soft border-dashed border-2 bg-muted/20 py-20 flex flex-col items-center">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold">No Transactions Recorded</h3>
            <p className="text-muted-foreground">Start by creating your first journal entry.</p>
          </Card>
        ) : (
          items.sort((a,b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map((item) => (
            <Card key={item._id} className="shadow-soft overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="bg-muted/30 py-3 flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <Calendar size={14} className="text-primary" />
                    {new Date(item.transactionDate).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="bg-background">{item.reference || "JE-" + item._id.slice(-6)}</Badge>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </div>
                <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                  {item.company && (
                    <span className="flex items-center gap-0.5"><Building2 size={10} /> {item.company.name}</span>
                  )}
                  {item.companyLocation && (
                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {item.companyLocation.label}</span>
                  )}
                  <span>Posted by System</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Account</TableHead>
                      <TableHead className="text-right w-32">Debit</TableHead>
                      <TableHead className="text-right w-32 pr-6">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.lines.map((line: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-muted/10 border-none">
                        <TableCell className="pl-6 py-2">
                          <div className="flex flex-col">
                            <span className={line.credit > 0 ? "pl-8 text-muted-foreground" : "font-medium"}>
                              {line.account?.name || "Unknown Account"}
                            </span>
                            <span className={`text-[10px] font-mono ${line.credit > 0 ? "pl-8" : ""}`}>{line.account?.code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">{line.debit > 0 ? "$" + line.debit.toLocaleString() : ""}</TableCell>
                        <TableCell className="text-right font-mono text-sm pr-6 py-2">{line.credit > 0 ? "$" + line.credit.toLocaleString() : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Date</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.transactionDate} onChange={e => setForm({...form, transactionDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input type="text" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Monthly Rent Payment" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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

            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2 text-xs font-bold uppercase text-muted-foreground px-2">
                <div className="col-span-3">Account</div>
                <div className="text-right">Debit</div>
                <div className="text-right">Credit</div>
                <div />
              </div>
              {form.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 items-center">
                  <div className="col-span-3">
                    <select 
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={line.account}
                      onChange={e => handleLineChange(i, "account", e.target.value)}
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(a => <option key={a._id} value={a._id}>[{a.code}] {a.name}</option>)}
                    </select>
                  </div>
                  <input type="number" className="h-9 rounded-md border border-input bg-background px-2 text-sm text-right" placeholder="0" value={line.debit} onChange={e => handleLineChange(i, "debit", e.target.value)} />
                  <input type="number" className="h-9 rounded-md border border-input bg-background px-2 text-sm text-right" placeholder="0" value={line.credit} onChange={e => handleLineChange(i, "credit", e.target.value)} />
                  <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => setForm({...form, lines: form.lines.filter((_, idx) => idx !== i)})}><Plus size={14} className="rotate-45" /></Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={handleAddLine} className="text-primary text-xs">+ Add Line</Button>
            </div>

            <div className="flex justify-end gap-10 border-t pt-4 px-10">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Debits</p>
                <p className="text-xl font-black font-mono">${totalDebit.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Credits</p>
                <p className="text-xl font-black font-mono">${totalCredit.toLocaleString()}</p>
              </div>
            </div>
            {!isBalanced && totalDebit > 0 && (
              <p className="text-xs text-destructive text-center font-medium">Journal entry must be balanced (Debits = Credits)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!isBalanced} className={isBalanced ? "bg-green-600 hover:bg-green-700" : ""}>Post Journal Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
