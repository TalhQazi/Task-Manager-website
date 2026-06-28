import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import { Server, Activity, Cpu, HardDrive } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export function ServerGraphs() {
  const [servers, setServers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch list of servers
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await apiFetch("/api/health/servers");
        if (data.servers && data.servers.length > 0) {
          setServers(data.servers);
          setSelectedServer(data.servers[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch servers", err);
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  // Fetch metrics for selected server
  useEffect(() => {
    if (!selectedServer) return;

    const fetchMetrics = async () => {
      try {
        // Fetch last 12 hours
        const data = await apiFetch(`/api/health/servers/${selectedServer}/metrics?hours=12`);
        
        // Format for Recharts
        const formatted = (data.metrics || []).map((m: any) => ({
          time: format(new Date(m.recordedAt), "HH:mm"),
          cpu: m.cpuUsagePercent,
          memory: m.memoryUsagePercent,
          disk: m.diskUsagePercent,
        }));
        
        setMetrics(formatted);
      } catch (err) {
        console.error("Failed to fetch server metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [selectedServer]);

  if (loading) {
    return <div className="text-white/60 p-6">Loading server metrics...</div>;
  }

  if (servers.length === 0) {
    return (
      <div className="bg-[#121A2F] border border-white/10 rounded-2xl p-6 shadow-xl text-center">
        <Server className="h-10 w-10 text-white/20 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">No Servers Monitored</h3>
        <p className="text-sm text-white/40 max-w-sm mx-auto">
          Deploy the server health agent script to your machines to start collecting metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121A2F] border border-white/10 rounded-2xl shadow-xl flex flex-col h-[500px]">
      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 flex-wrap gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-400" />
          Server Resources
        </h2>
        
        <select 
          className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5 outline-none focus:border-blue-500"
          value={selectedServer || ""}
          onChange={(e) => setSelectedServer(e.target.value)}
        >
          {servers.map(s => (
            <option key={s._id} value={s._id}>{s.name || s._id}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {metrics.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
            Waiting for first metric payload...
          </div>
        ) : (
          <>
            {/* CPU Chart */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute top-0 left-0 flex items-center gap-2 text-xs text-blue-400 font-medium">
                <Cpu className="h-3.5 w-3.5" /> CPU Usage (%)
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} tickMargin={8} minTickGap={30} />
                  <YAxis stroke="#ffffff40" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Memory Chart */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute top-0 left-0 flex items-center gap-2 text-xs text-amber-400 font-medium">
                <Activity className="h-3.5 w-3.5" /> Memory Usage (%)
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} tickMargin={8} minTickGap={30} />
                  <YAxis stroke="#ffffff40" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fbbf24' }}
                  />
                  <Line type="monotone" dataKey="memory" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
