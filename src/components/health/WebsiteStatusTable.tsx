import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import { Globe, Shield, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function WebsiteStatusTable() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsites = async () => {
    try {
      const data = await apiFetch("/api/health/websites");
      setWebsites(data.websites || []);
    } catch (err) {
      console.error("Failed to fetch websites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
    const interval = setInterval(fetchWebsites, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-white/60 p-6">Loading website status...</div>;
  }

  return (
    <div className="bg-[#121A2F] border border-white/10 rounded-2xl shadow-xl flex flex-col h-[600px]">
      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-400" />
          Website Status
        </h2>
        <div className="text-sm text-white/40 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Auto-updates every 60s
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar p-2">
        {websites.length === 0 ? (
          <div className="p-8 text-center text-white/40">No websites are currently being monitored. Enable monitoring in Digital Assets.</div>
        ) : (
          <div className="space-y-2">
            {websites.map((site) => (
              <div key={site._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  {/* Status Indicator */}
                  {site.healthStatus === "LIVE" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : site.healthStatus === "DEGRADED" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  ) : site.healthStatus === "DOWN" ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-dashed animate-spin" />
                  )}
                  
                  <div>
                    <h3 className="text-white font-medium">{site.siteName}</h3>
                    <a href={site.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      {site.url}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-white/40 uppercase font-semibold mb-1 tracking-wider">Response</div>
                    <div className={`text-sm font-medium ${site.responseTimeMs > 3000 ? 'text-amber-400' : 'text-white/80'}`}>
                      {site.responseTimeMs ? `${site.responseTimeMs}ms` : "---"}
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <div className="text-xs text-white/40 uppercase font-semibold mb-1 tracking-wider">SSL Status</div>
                    <div className="flex items-center gap-1 justify-end">
                      <Shield className={`h-3 w-3 ${site.sslStatus === 'VALID' ? 'text-emerald-400' : site.sslStatus === 'UNKNOWN' ? 'text-white/20' : 'text-red-400'}`} />
                      <span className={`text-sm ${site.sslStatus === 'VALID' ? 'text-emerald-400' : site.sslStatus === 'UNKNOWN' ? 'text-white/40' : 'text-red-400'}`}>
                        {site.sslStatus === "VALID" ? "Secure" : site.sslStatus}
                      </span>
                    </div>
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
