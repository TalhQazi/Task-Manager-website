import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { PieChart, Plus, Search, RefreshCw, BarChart3, Target, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function BudgetManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ fiscalYear: "2024", account: "", allocatedAmount: "", description: "", period: "Annual" });

  const load = async () => {
    try {
      setLoading(true);
      const [budgetRes, accountsRes] = await Promise.all([
        apiFetch("/api/atlasbook/budgets"),
        apiFetch("/api/atlasbook/accounts")
      ]);
      if (budgetRes?.success) setItems(budgetRes.items || []);
      if (accountsRes?.success) setAccounts(accountsRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/budgets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ fiscalYear: "2024", account: "", allocatedAmount: "", description: "", period: "Annual" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalBudgeted = items.reduce((sum, i) => sum + i.allocatedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PieChart className="h-8 w-8 text-primary" />
            Budget Management
          </h1>
          <p className="text-muted-foreground">Plan and monitor annual budgets vs actual expenditures.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> New Budget Line</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft bg-primary/5 border-primary/20 col-span-2">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-primary text-white rounded-3xl"><Target size={32} /></div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-primary mb-1">Total Fiscal Budget (2024)</p>
              <h3 className="text-3xl font-black">${totalBudgeted.toLocaleString()}</h3>
              <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "45%" }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">45% of budget utilized</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Actual Spent</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No budget lines defined.</TableCell></TableRow>
              ) : (
                items.map((item) => {
                  const percent = (item.actualSpent / item.allocatedAmount) * 100 || 0;
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-bold">{item.account?.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.period}</Badge></TableCell>
                      <TableCell className="text-right font-mono">${item.allocatedAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${item.actualSpent.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold">{percent.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {percent > 100 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit"><AlertCircle size={10} /> Over Budget</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 w-fit">On Track</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Budget Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fiscal Year</label>
                <Input placeholder="2024" value={form.fiscalYear} onChange={e => setForm({...form, fiscalYear: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.period} onChange={e => setForm({...form, period: e.target.value})}>
                  <option value="Annual">Annual</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Account</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.account} onChange={e => setForm({...form, account: e.target.value})}>
                <option value="">Choose Account...</option>
                {accounts.filter(a => a.type === "Expense").map(a => <option key={a._id} value={a._id}>[{a.code}] {a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Allocated Amount</label>
              <Input type="number" placeholder="0.00" value={form.allocatedAmount} onChange={e => setForm({...form, allocatedAmount: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Set Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
