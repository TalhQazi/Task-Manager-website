import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Coins, Plus, Search, RefreshCw, User, CreditCard, Calendar, FileText } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function PayrollManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    employee: "", 
    payPeriodStart: new Date().toISOString().split("T")[0], 
    payPeriodEnd: new Date().toISOString().split("T")[0], 
    baseSalary: "", 
    bonuses: "0", 
    deductions: "0" 
  });

  const load = async () => {
    try {
      setLoading(true);
      const [payrollRes, empRes] = await Promise.all([
        apiFetch("/api/atlasbook/payroll"),
        apiFetch("/api/employees")
      ]);
      if (payrollRes?.success) setItems(payrollRes.items || []);
      if (empRes) setEmployees(Array.isArray(empRes) ? empRes : (empRes.items || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const netPay = (Number(form.baseSalary) || 0) + (Number(form.bonuses) || 0) - (Number(form.deductions) || 0);
    try {
      const res = await apiFetch("/api/atlasbook/payroll", {
        method: "POST",
        body: JSON.stringify({ ...form, netPay }),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ employee: "", payPeriodStart: "", payPeriodEnd: "", baseSalary: "", bonuses: "0", deductions: "0" });
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalPaid = items.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            Payroll Module
          </h1>
          <p className="text-muted-foreground">Manage employee compensation, deductions, and payment cycles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Process Payroll</Button>
        </div>
      </div>

      <Card className="shadow-soft bg-indigo-500/10 border-indigo-500/20 max-w-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white"><CreditCard size={24} /></div>
          <div>
            <p className="text-xs font-bold uppercase text-indigo-600">Total Paid (YTD)</p>
            <h3 className="text-2xl font-black">${totalPaid.toLocaleString()}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No payroll records found.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-bold flex items-center gap-2"><User size={14} className="text-muted-foreground" /> {item.employee?.name}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(item.payPeriodStart).toLocaleDateString()} - {new Date(item.payPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${item.baseSalary?.toLocaleString()}</TableCell>
                    <TableCell className="text-rose-600">-${item.deductions?.toLocaleString()}</TableCell>
                    <TableCell className="font-black text-emerald-600">${item.netPay?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={item.status === "Paid" ? "default" : "secondary"}>{item.status}</Badge></TableCell>
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
            <DialogTitle>Process Payroll Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}>
                <option value="">Choose Employee...</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Period Start</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payPeriodStart} onChange={e => setForm({...form, payPeriodStart: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period End</label>
                <input type="date" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payPeriodEnd} onChange={e => setForm({...form, payPeriodEnd: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Salary</label>
              <Input type="number" placeholder="0.00" value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bonuses</label>
                <Input type="number" placeholder="0.00" value={form.bonuses} onChange={e => setForm({...form, bonuses: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deductions</label>
                <Input type="number" placeholder="0.00" value={form.deductions} onChange={e => setForm({...form, deductions: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Post Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
