import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Users, Plus, RefreshCw, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function InvestorReporting() {
  const [items, setItems] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ investorName: "", period: "Q1 2024", capitalContribution: "", distributionAmount: "", property: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [invRes, propRes] = await Promise.all([
        apiFetch("/api/atlasbook/investor-statements"),
        apiFetch("/api/atlasbook/properties")
      ]);
      if (invRes?.success) setItems(invRes.items || []);
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
      const res = await apiFetch("/api/atlasbook/investor-statements", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ investorName: "", period: "Q1 2024", capitalContribution: "", distributionAmount: "", property: "" });
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
            <Users className="h-8 w-8 text-primary" />
            Investor Reporting
          </h1>
          <p className="text-muted-foreground">Manage capital contributions, distributions, and investor performance statements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> New Statement</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white"><TrendingUp size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-600">Avg. Portfolio ROI</p>
              <h3 className="text-2xl font-black">12.4%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Investor Distributions & Contributions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Investor</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Contribution</TableHead>
                <TableHead className="text-right">Distribution</TableHead>
                <TableHead className="text-right pr-6">ROI (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No investor statements found.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6 font-bold">{item.investorName}</TableCell>
                    <TableCell><Badge variant="secondary">{item.period}</Badge></TableCell>
                    <TableCell className="text-xs">{item.property?.name || "Global Portfolio"}</TableCell>
                    <TableCell className="text-right font-mono">${item.capitalContribution?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 font-bold">${item.distributionAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6 font-black">{item.roi || "12.0"}%</TableCell>
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
            <DialogTitle>Issue Investor Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Investor Name</label>
              <Input placeholder="e.g., Summit Equity Group" value={form.investorName} onChange={e => setForm({...form, investorName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reporting Period</label>
                <Input placeholder="Q1 2024" value={form.period} onChange={e => setForm({...form, period: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.property} onChange={e => setForm({...form, property: e.target.value})}>
                  <option value="">Global Portfolio</option>
                  {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Capital Contribution</label>
                <Input type="number" placeholder="0.00" value={form.capitalContribution} onChange={e => setForm({...form, capitalContribution: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distribution Amount</label>
                <Input type="number" placeholder="0.00" value={form.distributionAmount} onChange={e => setForm({...form, distributionAmount: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Issue Statement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
