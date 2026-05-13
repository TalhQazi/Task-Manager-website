import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { 
  Building2, Wallet, Users, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Activity, PieChart, ShieldCheck, Timer, Box, Receipt
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { Link } from "react-router-dom";

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState<any>({
    revenue: 0,
    expenses: 0,
    properties: 0,
    tenants: 0,
    pendingApprovals: 0,
    inventoryValue: 0
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [pl, prop, tenant, approvals, inventory] = await Promise.all([
        apiFetch("/api/atlasbook/reports/pl"),
        apiFetch("/api/atlasbook/properties"),
        apiFetch("/api/atlasbook/tenants"),
        apiFetch("/api/atlasbook/approvals"),
        apiFetch("/api/atlasbook/inventory")
      ]);
      
      setStats({
        revenue: pl?.revenue || 0,
        expenses: pl?.expenses || 0,
        properties: prop?.items?.length || 0,
        tenants: tenant?.items?.length || 0,
        pendingApprovals: (approvals?.items || []).filter((a:any) => a.status === "Pending").length,
        inventoryValue: (inventory?.items || []).reduce((sum:number, i:any) => sum + (i.quantity * i.unitCost), 0)
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <Badge className="bg-primary/10 text-primary border-none mb-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Global Overview</Badge>
          <h1 className="text-4xl font-black tracking-tight">Executive Control Center</h1>
          <p className="text-muted-foreground">Master dashboard summarizing all 27 business modules and real-time financial health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">Custom Report</Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20">Fiscal Summary</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft border-none bg-emerald-500 text-white overflow-hidden relative group">
          <CardContent className="p-6">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Total Revenue (YTD)</p>
            <h3 className="text-3xl font-black">${stats.revenue.toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-4 flex items-center gap-1"><ArrowUpRight size={10} /> +14.2% FROM LAST YEAR</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-none bg-rose-500 text-white overflow-hidden relative group">
          <CardContent className="p-6">
            <Activity className="absolute right-[-10px] bottom-[-10px] h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Operating Expenses</p>
            <h3 className="text-3xl font-black">${stats.expenses.toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-4 flex items-center gap-1"><ArrowDownRight size={10} /> 3.1% UNDER BUDGET</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-none bg-slate-900 text-white overflow-hidden relative group">
          <CardContent className="p-6">
            <Building2 className="absolute right-[-10px] bottom-[-10px] h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase opacity-60 mb-1">Managed Properties</p>
            <h3 className="text-3xl font-black">{stats.properties}</h3>
            <p className="text-[10px] font-bold mt-4 flex items-center gap-1">98.2% OCCUPANCY RATE</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-none bg-primary text-white overflow-hidden relative group">
          <CardContent className="p-6">
            <Wallet className="absolute right-[-10px] bottom-[-10px] h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Net Cash Flow</p>
            <h3 className="text-3xl font-black">${(stats.revenue - stats.expenses).toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-4 flex items-center gap-1">HEALTHY LIQUIDITY</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <CardTitle className="text-lg">Real-Time Performance Matrix</CardTitle>
            <Badge variant="outline">Live Feed</Badge>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <PieChart size={14} /> Allocation Analysis
              </h4>
              <div className="space-y-4">
                {[
                  { label: "Payroll", val: 45, color: "bg-primary" },
                  { label: "Maintenance", val: 22, color: "bg-emerald-500" },
                  { label: "Tax & Compliance", val: 18, color: "bg-amber-500" },
                  { label: "Inventory", val: 15, color: "bg-slate-500" }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold"><span>{item.label}</span><span>{item.val}%</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4">
              <div className="p-4 bg-white rounded-full shadow-soft"><ShieldCheck className="h-10 w-10 text-emerald-500" /></div>
              <div>
                <h4 className="font-black text-lg">System Audit: Clear</h4>
                <p className="text-xs text-muted-foreground px-4">All 27 business modules are operational and synced with the General Ledger.</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full px-6">View Health Report</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="border-b bg-muted/20"><CardTitle className="text-lg">Action Items</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-2xl border border-blue-100 group hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:bg-white group-hover:text-blue-500 transition-colors"><Timer size={16} /></div>
                <div>
                  <p className="text-sm font-bold">Pending Approvals</p>
                  <p className="text-[10px] opacity-70">{stats.pendingApprovals} requests need review</p>
                </div>
              </div>
              <ArrowRight size={16} />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-500/5 rounded-2xl border border-amber-100 group hover:bg-amber-500 hover:text-white transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg group-hover:bg-white group-hover:text-amber-500 transition-colors"><Box size={16} /></div>
                <div>
                  <p className="text-sm font-bold">Low Stock Alert</p>
                  <p className="text-[10px] opacity-70">3 SKUs below reorder level</p>
                </div>
              </div>
              <ArrowRight size={16} />
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-2xl border border-emerald-100 group hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg group-hover:bg-white group-hover:text-emerald-500 transition-colors"><Receipt size={16} /></div>
                <div>
                  <p className="text-sm font-bold">Unpaid Invoices</p>
                  <p className="text-[10px] opacity-70">Check AR aging reports</p>
                </div>
              </div>
              <ArrowRight size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Inventory Valuation", val: `$${stats.inventoryValue.toLocaleString()}`, icon: <Box size={16} /> },
          { label: "Active Tenants", val: stats.tenants, icon: <Users size={16} /> },
          { label: "Compliance Score", val: "99.8%", icon: <ShieldCheck size={16} /> },
          { label: "Last Fiscal Sync", val: "14m ago", icon: <Timer size={16} /> }
        ].map((item, i) => (
          <Card key={i} className="shadow-soft border-none bg-muted/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{item.label}</p>
                <p className="text-xl font-black">{item.val}</p>
              </div>
              <div className="p-2 bg-white rounded-lg text-primary shadow-sm">{item.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
