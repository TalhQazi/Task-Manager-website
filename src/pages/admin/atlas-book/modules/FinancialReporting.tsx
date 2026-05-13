import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { PieChart, Download, RefreshCw, FileText, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function FinancialReporting() {
  const [pl, setPl] = useState<any>(null);
  const [bs, setBs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"PL" | "BS">("PL");

  const load = async () => {
    try {
      setLoading(true);
      const [plRes, bsRes] = await Promise.all([
        apiFetch("/api/atlasbook/reports/pl"),
        apiFetch("/api/atlasbook/reports/balance-sheet")
      ]);
      if (plRes?.success) setPl(plRes);
      if (bsRes?.success) setBs(bsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PieChart className="h-8 w-8 text-primary" />
            Financial Reporting
          </h1>
          <p className="text-muted-foreground">Comprehensive financial health reports including P&L and Balance Sheet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button className="gap-2"><Download size={16} /> Export PDF</Button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button 
          onClick={() => setView("PL")}
          className={`pb-4 px-4 font-bold text-sm transition-all ${view === "PL" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Profit & Loss
        </button>
        <button 
          onClick={() => setView("BS")}
          className={`pb-4 px-4 font-bold text-sm transition-all ${view === "BS" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Balance Sheet
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div>
      ) : view === "PL" ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-soft bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold uppercase text-emerald-600">Total Revenue</p>
                  <ArrowUpRight className="text-emerald-500" size={20} />
                </div>
                <h3 className="text-3xl font-black">${pl?.revenue?.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-rose-500/5 border-rose-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold uppercase text-rose-600">Total Expenses</p>
                  <ArrowDownRight className="text-rose-500" size={20} />
                </div>
                <h3 className="text-3xl font-black">${pl?.expenses?.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase text-primary mb-2">Net Operating Income</p>
                <h3 className="text-3xl font-black">${pl?.netProfit?.toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-lg">Income Statement Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow><TableHead className="pl-6">Account Name</TableHead><TableHead className="text-right pr-6">Balance</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-emerald-50/30 hover:bg-emerald-50/50"><TableCell colSpan={2} className="font-bold text-xs uppercase pl-6 py-2 text-emerald-700">Revenue</TableCell></TableRow>
                  {pl?.breakdown?.revenue.map((a: any) => (
                    <TableRow key={a._id} className="border-none"><TableCell className="pl-10 py-1 text-sm">{a.name}</TableCell><TableCell className="text-right pr-6 font-mono text-emerald-600">${Math.abs(a.balance).toLocaleString()}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-rose-50/30 hover:bg-rose-50/50"><TableCell colSpan={2} className="font-bold text-xs uppercase pl-6 py-2 text-rose-700 mt-4">Expenses</TableCell></TableRow>
                  {pl?.breakdown?.expenses.map((a: any) => (
                    <TableRow key={a._id} className="border-none"><TableCell className="pl-10 py-1 text-sm">{a.name}</TableCell><TableCell className="text-right pr-6 font-mono text-rose-600">${a.balance.toLocaleString()}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-soft bg-slate-900 text-white">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total Assets</p>
                  <h3 className="text-3xl font-black">${bs?.totalAssets?.toLocaleString()}</h3>
                </div>
                <Scale className="text-slate-500 h-10 w-10 opacity-20" />
              </CardContent>
            </Card>
            <Card className="shadow-soft bg-slate-900 text-white">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Liabilities + Equity</p>
                  <h3 className="text-3xl font-black">${(bs?.totalLiabilities + bs?.totalEquity).toLocaleString()}</h3>
                </div>
                <div className={`p-2 rounded-lg ${bs?.isBalanced ? "bg-emerald-500" : "bg-rose-500"}`}>
                  <Badge className="bg-white text-black text-[10px]">{bs?.isBalanced ? "BALANCED" : "OUT OF BALANCE"}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader className="py-3 bg-muted/20"><CardTitle className="text-sm uppercase tracking-wider">Assets</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {bs?.assets.map((a: any) => (
                      <TableRow key={a._id} className="border-none"><TableCell className="pl-6 py-2 text-sm font-medium">{a.name}</TableCell><TableCell className="text-right pr-6 font-mono font-bold">${a.balance.toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-black"><TableCell className="pl-6 py-3">Total Assets</TableCell><TableCell className="text-right pr-6">${bs?.totalAssets.toLocaleString()}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="py-3 bg-muted/20"><CardTitle className="text-sm uppercase tracking-wider">Liabilities & Equity</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/10"><TableCell colSpan={2} className="text-[10px] font-bold uppercase pl-6 py-1">Liabilities</TableCell></TableRow>
                    {bs?.liabilities.map((a: any) => (
                      <TableRow key={a._id} className="border-none"><TableCell className="pl-8 py-2 text-sm">{a.name}</TableCell><TableCell className="text-right pr-6 font-mono">${Math.abs(a.balance).toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/10"><TableCell colSpan={2} className="text-[10px] font-bold uppercase pl-6 py-1">Equity</TableCell></TableRow>
                    {bs?.equity.map((a: any) => (
                      <TableRow key={a._id} className="border-none"><TableCell className="pl-8 py-2 text-sm">{a.name}</TableCell><TableCell className="text-right pr-6 font-mono">${Math.abs(a.balance).toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-black"><TableCell className="pl-6 py-3">Total Liabilities & Equity</TableCell><TableCell className="text-right pr-6">${(bs?.totalLiabilities + bs?.totalEquity).toLocaleString()}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
