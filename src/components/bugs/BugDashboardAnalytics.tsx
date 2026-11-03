import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Bug, Clock, CheckCircle2, RefreshCw, AlertTriangle, Layers, Users } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

type AnalyticsData = {
  total: number;
  pendingBugs: number;
  awaitingConfirmation: number;
  reopenedBugs: number;
  closedVerified: number;
  avgResolutionTimeHours: string;
  acceptanceRate: number;
  reopenRate: number;
  topModules: { name: string; count: number }[];
  topDevelopers: { name: string; count: number }[];
  topReporters: { name: string; count: number }[];
};

export default function BugDashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<AnalyticsData>("/api/bugs/analytics");
      if (res) setData(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-card border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Pending Bugs</p>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">{data.pendingBugs}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[#00C6FF]/10 text-[#00C6FF] flex items-center justify-center">
              <Bug className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Awaiting Verify</p>
              <h3 className="text-xl font-extrabold text-indigo-500 mt-0.5">{data.awaitingConfirmation}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Reopened</p>
              <h3 className="text-xl font-extrabold text-destructive mt-0.5">{data.reopenedBugs}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Res Time</p>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">{data.avgResolutionTimeHours}h</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Acceptance Rate</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{data.acceptanceRate}%</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Reopen Rate</p>
              <h3 className="text-xl font-extrabold text-amber-500 mt-0.5">{data.reopenRate}%</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
