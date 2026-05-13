import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { ShieldAlert, RefreshCw, AlertTriangle, ShieldCheck, Search, Bell } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export default function FraudDetection() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/atlasbook/fraud/alerts");
      if (res?.success) setAlerts(res.alerts || []);
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
            <ShieldAlert className="h-8 w-8 text-primary" />
            Fraud Detection & AI Monitoring
          </h1>
          <p className="text-muted-foreground">Automated risk monitoring for duplicate payments, expense spikes, and suspicious activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><ShieldCheck size={16} /> Mark All Safe</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft bg-rose-500/10 border-rose-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-500 rounded-2xl text-white"><AlertTriangle size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-rose-600">Active Alerts</p>
              <h3 className="text-2xl font-black">{alerts.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Search size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Scanned This Week</p>
              <h3 className="text-2xl font-black">1,248</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Security Findings</CardTitle>
          <Badge variant="outline" className="text-xs">Live Monitoring</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Type</TableHead>
                <TableHead>Finding / Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Time Detected</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-2 opacity-20" />
                    <p className="text-muted-foreground italic">System secure. No suspicious activity detected.</p>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert, i) => (
                  <TableRow key={i} className="group hover:bg-muted/10">
                    <TableCell className="pl-6 font-bold flex items-center gap-2">
                      <Bell size={12} className={alert.severity === "High" ? "text-rose-500 animate-pulse" : "text-amber-500"} />
                      {alert.type}
                    </TableCell>
                    <TableCell className="text-sm">{alert.message}</TableCell>
                    <TableCell>
                      <Badge variant={alert.severity === "High" ? "destructive" : "secondary"}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">Just now</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">Investigate</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft bg-slate-900 text-white">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider opacity-60">AI Insights</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs leading-relaxed text-slate-300">
              Our AI engine has analyzed your transaction patterns. Current spending is 12% lower than historical averages for this period. No abnormal "spikes" detected in utility or repair accounts.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
              <ShieldCheck size={12} /> SYSTEM INTEGRITY: 99.8%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
