import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { CreditCard, TrendingUp, TrendingDown, Landmark, ArrowRight, Gauge } from "lucide-react";

export default function CreditMonitoring() {
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
              <h3 className="text-5xl font-black text-emerald-600">748</h3>
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
              <h3 className="text-4xl font-black">1.85x</h3>
              <Badge className="bg-emerald-500 text-white border-none">Healthy</Badge>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4">
              <div className="bg-emerald-500 h-full" style={{ width: "75%" }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Target: &gt;1.25x</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Loan-to-Value (LTV) Ratio</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black">62.4%</h3>
              <Badge variant="secondary">Prime</Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-4">
              <div className="bg-primary h-full" style={{ width: "62%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Maximum: 80%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Outstanding Credit Facilities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Chase Business Line of Credit", amount: "$50,000", used: "12%", color: "text-blue-600" },
              { name: "SBA EIDL Loan", amount: "$150,000", used: "100%", color: "text-slate-600" },
              { name: "Amex Corporate Gold", amount: "$25,000", used: "45%", color: "text-amber-600" }
            ].map((loan, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${loan.color}`}><Landmark size={16} /></div>
                  <div>
                    <p className="text-sm font-bold">{loan.name}</p>
                    <p className="text-[10px] text-muted-foreground">Credit Limit: {loan.amount}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{loan.used}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Utilization</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs gap-2">View Full Credit Report <ArrowRight size={14} /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
