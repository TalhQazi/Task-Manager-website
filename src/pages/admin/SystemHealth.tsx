import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import { ServerGraphs } from "@/components/health/ServerGraphs";
import { SystemResourcePies } from "@/components/health/SystemResourcePies";
import { WebsiteStatusTable } from "@/components/health/WebsiteStatusTable";
import { IncidentHistory } from "@/components/health/IncidentHistory";
import { Activity } from "lucide-react";

export default function SystemHealth() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const data = await apiFetch("/api/health/overview");
      setOverview(data);
    } catch (err) {
      console.error("Failed to fetch health overview", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Health Center</h1>
            <p className="text-white/60">Monitor servers, websites, and incidents in real-time</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
            <div className="text-white/60 text-sm font-medium mb-2">Servers</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{overview?.servers?.live || 0}</span>
              <span className="text-white/40">/ {overview?.servers?.total || 0} Live</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
            <div className="text-white/60 text-sm font-medium mb-2">Websites</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{overview?.websites?.live || 0}</span>
              <span className="text-white/40">/ {overview?.websites?.total || 0} Live</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
            <div className="text-white/60 text-sm font-medium mb-2">Open Incidents</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${overview?.openIncidents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {overview?.openIncidents || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Host Resource Usage (RAM & Disk pie charts) */}
        <SystemResourcePies />

        {/* Main Content Grids */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-8">
            <ServerGraphs />
            <IncidentHistory />
          </div>
          <div>
            <WebsiteStatusTable />
          </div>
        </div>
      </div>
    </div>
  );
}
