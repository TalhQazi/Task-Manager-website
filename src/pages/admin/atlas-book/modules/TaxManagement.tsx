import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Scale, Plus, RefreshCw, FileText, Landmark, Calculator } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function TaxManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ country: "", taxName: "", rate: "", account: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [taxRes, accountsRes] = await Promise.all([
        apiFetch("/api/atlasbook/tax-settings"),
        apiFetch("/api/atlasbook/accounts")
      ]);
      if (taxRes?.success) setItems(taxRes.items || []);
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
      const res = await apiFetch("/api/atlasbook/tax-settings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ country: "", taxName: "", rate: "", account: "" });
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
            <Scale className="h-8 w-8 text-primary" />
            Tax Management
          </h1>
          <p className="text-muted-foreground">Configure regional tax rates (VAT/GST/Sales Tax) and automate tax accounting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Configure Tax</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Calculator size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Active Tax Rules</p>
              <h3 className="text-2xl font-black">{items.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Regional Tax Configuration</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Region / Country</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead>Tax Rate (%)</TableHead>
                <TableHead>Linked GL Account</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No tax rules configured.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6 font-bold">{item.country}</TableCell>
                    <TableCell><Badge variant="secondary">{item.taxName}</Badge></TableCell>
                    <TableCell className="font-mono font-bold text-primary">{item.rate}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">{item.account?.name || "Not linked"}</TableCell>
                    <TableCell className="text-right pr-6"><Badge className="bg-emerald-500">Active</Badge></TableCell>
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
            <DialogTitle>Configure New Tax Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Region / Country</label>
              <Input placeholder="e.g., United Kingdom" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Name</label>
                <Input placeholder="VAT / GST" value={form.taxName} onChange={e => setForm({...form, taxName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rate (%)</label>
                <Input type="number" placeholder="20.0" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Linked Liability Account</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.account} onChange={e => setForm({...form, account: e.target.value})}>
                <option value="">Select Account...</option>
                {accounts.filter(a => a.type === "Liability").map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Tax Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
