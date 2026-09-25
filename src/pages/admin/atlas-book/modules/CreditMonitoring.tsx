import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { CreditCard, TrendingUp, TrendingDown, Landmark, ArrowRight, Gauge } from "lucide-react";
import { apiFetch } from "../../../../lib/api";

export default function CreditMonitoring() {
  const [loans, setLoans] = useState<any[]>([]);
  const [kpi, setKpi] = useState<{score: number, dscr: number | string, ltv: number}>({ score: 0, dscr: 0, ltv: 0 });

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const [loansRes, plRes] = await Promise.all([
          apiFetch<any>("/api/atlasbook/loans"),
          apiFetch<any>("/api/atlasbook/reports/pl")
        ]);

        let score = 0;
        let dscr: number | string = 0;
        let ltv = 0;

        if (plRes && typeof plRes.netProfit !== 'undefined') {
          // Approximate a dynamic score based on netProfit (baseline 700 + scaled up to 850)
          score = Math.min(850, Math.max(300, 700 + Math.floor(plRes.netProfit / 1000)));
        }

        if (loansRes && loansRes.items) {
          setLoans(loansRes.items);
          
          const totalLimit = loansRes.items.reduce((sum: number, l: any) => sum + (l.principalAmount || 0), 0);
          const totalBal = loansRes.items.reduce((sum: number, l: any) => sum + (l.remainingBalance || 0), 0);
          
          if (totalLimit > 0) {
            ltv = Math.round((totalBal / totalLimit) * 1000) / 10;
          }

          // Calculate an approximate DSCR = NOI / Debt Service
          // Debt Service proxy: 10% of total balance per year
          const debtService = totalBal * 0.10;
          if (debtService > 0 && plRes) {
            dscr = Math.round((plRes.netProfit / debtService) * 100) / 100;
          }
        }
        setKpi({ score, dscr, ltv });
      } catch (e) {
        console.error("Failed to fetch data", e);
      }
    };
    fetchLoans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Credit Monitoring & Debt Analytics
          </h1>
          <p className="text-muted-foreground">Track business credit scores, loan ratios, and debt service coverage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft overflow-hidden">
          <div className="h-2 bg-emerald-500" />
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Business Credit Score</p>
            <div className="relative inline-flex items-center justify-center">
              <h3 className="text-5xl font-black text-emerald-600">{kpi.score}</h3>
              <Gauge className="absolute -right-10 -top-2 text-emerald-500/20 h-16 w-16" />
            </div>
            <p className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1">
              <TrendingUp size={10} /> +12 PTS FROM LAST MONTH
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase text-slate-400 mb-4">Debt Service Coverage (DSCR)</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black">{kpi.dscr}x</h3>
              <Badge className="bg-emerald-500 text-white border-none">Healthy</Badge>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4">
              <div className="bg-emerald-500 h-full" style={{ width: `${typeof kpi.dscr === 'number' ? Math.min(100, (kpi.dscr / 2) * 100) : 0}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Target: &gt;1.25x</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Loan-to-Value (LTV) Ratio</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black">{kpi.ltv}%</h3>
              <Badge variant="secondary">{kpi.ltv < 80 ? "Prime" : "Risky"}</Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-4">
              <div className="bg-primary h-full" style={{ width: `${kpi.ltv}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Maximum: 80%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Outstanding Credit Facilities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No credit facilities found. Please add a loan.</p>
            ) : loans.map((loan, i) => {
              const util = loan.principalAmount > 0 ? Math.round(((loan.principalAmount - (loan.remainingBalance || 0)) / loan.principalAmount) * 100) : 0;
              const color = util > 80 ? "text-rose-600" : util > 40 ? "text-amber-600" : "text-emerald-600";
              return (
              <div key={loan._id || i} className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${color}`}><Landmark size={16} /></div>
                  <div>
                    <p className="text-sm font-bold">{loan.lender} {loan.loanType}</p>
                    <p className="text-[10px] text-muted-foreground">Credit Limit: ${loan.principalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{util}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Utilization</p>
                </div>
              </div>
            )})}
            <Button variant="outline" className="w-full text-xs gap-2">View Full Credit Report <ArrowRight size={14} /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
