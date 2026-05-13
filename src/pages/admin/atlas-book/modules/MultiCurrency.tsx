import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin/ui/dialog";
import { Globe, Plus, RefreshCw, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function MultiCurrency() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ targetCurrency: "", rate: "" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/exchange-rates");
      if (res?.success) setItems(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await apiFetch("/api/atlasbook/exchange-rates", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setOpen(false);
        setForm({ targetCurrency: "", rate: "" });
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
            <Globe className="h-8 w-8 text-primary" />
            Multi-Currency Module
          </h1>
          <p className="text-muted-foreground">Manage foreign exchange rates, currency translations, and exchange gains/losses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Add Exchange Rate</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Base Currency</p>
            <h3 className="text-3xl font-black flex items-center gap-2">USD <Badge className="bg-emerald-500 border-none">Primary</Badge></h3>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Live Exchange Rates</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Pair</TableHead>
                <TableHead>Target Currency</TableHead>
                <TableHead>Current Rate (1 USD = )</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No exchange rates defined.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="pl-6 font-bold">USD / {item.targetCurrency}</TableCell>
                    <TableCell>{item.targetCurrency}</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{item.rate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6"><Badge variant="outline">Active</Badge></TableCell>
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
            <DialogTitle>Update Exchange Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Currency Code (e.g. EUR, GBP)</label>
              <Input placeholder="EUR" value={form.targetCurrency} onChange={e => setForm({...form, targetCurrency: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rate (Relative to 1 USD)</label>
              <Input type="number" placeholder="0.92" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Update Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
