import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Landmark, Plus, RefreshCw, Calendar, TrendingDown, Percent } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function LoanFinancing() {
  const [items, setItems] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ lender: "", loanType: "Mortgage", principalAmount: "", interestRate: "", termMonths: "360", startDate: "", property: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [loansRes, propRes] = await Promise.all([
        apiFetch("/api/atlasbook/loans"),
        apiFetch("/api/atlasbook/properties")
      ]);
      if (loansRes?.success) setItems(loansRes.items || []);
      if (propRes?.success) setProperties(propRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/loans", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ lender: "", loanType: "Mortgage", principalAmount: "", interestRate: "", termMonths: "360", startDate: "", property: "" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalDebt = items.reduce((sum, i) => sum + i.principalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            Loan & Financing
          </h1>
          <p className="text-muted-foreground">Track business loans, mortgages, and credit facilities with automated interest tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> New Facility</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-slate-900 text-white border-none">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total Outstanding Principal</p>
            <h3 className="text-3xl font-black">${totalDebt.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Loan Registry</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Lender / Facility</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Rate (%)</TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No active loans found.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6 font-bold">{item.lender}</TableCell>
                    <TableCell><Badge variant="outline">{item.loanType}</Badge></TableCell>
                    <TableCell className="font-bold">${item.principalAmount.toLocaleString()}</TableCell>
                    <TableCell className="flex items-center gap-1"><Percent size={12} className="text-primary" /> {item.interestRate}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.termMonths} Months</TableCell>
                    <TableCell className="text-right pr-6"><Badge>{item.status}</Badge></TableCell>
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
            <DialogTitle>Register Loan Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lender Name</label>
              <Input placeholder="e.g., JPMorgan Chase" value={form.lender} onChange={e => setForm({...form, lender: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Loan Type</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.loanType} onChange={e => setForm({...form, loanType: e.target.value})}>
                  <option value="Mortgage">Mortgage</option>
                  <option value="Line of Credit">Line of Credit</option>
                  <option value="Term Loan">Term Loan</option>
                  <option value="SBA Loan">SBA Loan</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Principal Amount</label>
                <Input type="number" placeholder="0.00" value={form.principalAmount} onChange={e => setForm({...form, principalAmount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Rate (%)</label>
                <Input type="number" placeholder="6.5" value={form.interestRate} onChange={e => setForm({...form, interestRate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Term (Months)</label>
                <Input type="number" placeholder="360" value={form.termMonths} onChange={e => setForm({...form, termMonths: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Associated Property (Optional)</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.property} onChange={e => setForm({...form, property: e.target.value})}>
                <option value="">None</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Loan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
