import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import { AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export function IncidentHistory() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const data = await apiFetch("/api/health/incidents?limit=10");
      setIncidents(data.incidents || []);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#121A2F] border border-white/10 rounded-2xl shadow-xl flex flex-col h-[400px]">
      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-400" />
          Recent Incidents
        </h2>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar p-4">
        {loading ? (
          <div className="text-white/40 text-center mt-4">Loading...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-white/40 mt-10">No recent incidents. System is stable.</div>
        ) : (
          <div className="relative border-l border-white/10 ml-4 space-y-6 pb-4">
            {incidents.map((incident) => (
              <div key={incident._id} className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-[#121A2F] ${incident.status === 'OPEN' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium flex items-center gap-2">
                        {incident.websiteId?.siteName || "Unknown System"}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${incident.type === 'DOWN' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {incident.type}
                        </span>
                      </h4>
                      <p className="text-sm text-white/40 mt-1">{incident.errorDetails || "No details provided"}</p>
                    </div>
                    
                    <div className="text-right text-xs text-white/40 whitespace-nowrap">
                      {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Clock className="h-3.5 w-3.5" />
                      Started: {format(new Date(incident.startedAt), "MMM d, HH:mm")}
                    </div>
                    {incident.status === 'RESOLVED' && incident.resolvedAt ? (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved: {format(new Date(incident.resolvedAt), "MMM d, HH:mm")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        Ongoing
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
