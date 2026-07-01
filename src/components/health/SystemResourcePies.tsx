import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HardDrive, MemoryStick, Server } from "lucide-react";

interface ResourceUsage {
  total: number;
  used: number;
  free: number;
}

interface SystemStats {
  hostname?: string;
  platform?: string;
  uptimeSeconds?: number;
  cpuCount?: number;
  ram?: ResourceUsage;
  disk?: ResourceUsage | null;
}

const USED_COLOR = "#f43f5e"; // rose-500
const FREE_COLOR = "#10b981"; // emerald-500

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 GB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

function UsagePie({
  title,
  icon,
  usage,
}: {
  title: string;
  icon: React.ReactNode;
  usage: ResourceUsage | null | undefined;
}) {
  if (!usage || !usage.total) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 flex flex-col">
        <div className="flex items-center gap-2 text-white/80 font-semibold mb-4">
          {icon}
          {title}
        </div>
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm min-h-[180px]">
          Data unavailable
        </div>
      </div>
    );
  }

  const usedPct = usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0;
  const data = [
    { name: "Used", value: usage.used },
    { name: "Available", value: usage.free },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 text-white/80 font-semibold mb-2">
        {icon}
        {title}
      </div>

      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              <Cell fill={USED_COLOR} />
              <Cell fill={FREE_COLOR} />
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatBytes(value), name]}
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{usedPct}%</span>
          <span className="text-[11px] text-white/50 uppercase tracking-wider">Used</span>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-white/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: USED_COLOR }} />
            Used
          </span>
          <span className="text-white font-medium">{formatBytes(usage.used)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-white/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FREE_COLOR }} />
            Available
          </span>
          <span className="text-white font-medium">{formatBytes(usage.free)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-white/50">Total</span>
          <span className="text-white/80 font-medium">{formatBytes(usage.total)}</span>
        </div>
      </div>
    </div>
  );
}

export function SystemResourcePies() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await apiFetch<SystemStats>("/api/health/system");
        if (!mounted) return;
        setStats(data);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch system stats", err);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-[#121A2F] border border-white/10 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-400" />
          Host Resources
        </h2>
        {stats?.hostname && (
          <span className="text-xs text-white/40">{stats.hostname}</span>
        )}
      </div>

      {loading ? (
        <div className="text-white/60 text-sm py-10 text-center">Loading system resources...</div>
      ) : error ? (
        <div className="text-white/40 text-sm py-10 text-center">Failed to load system resources.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <UsagePie
            title="RAM Usage"
            icon={<MemoryStick className="h-4 w-4 text-amber-400" />}
            usage={stats?.ram}
          />
          <UsagePie
            title="Server Disk Space"
            icon={<HardDrive className="h-4 w-4 text-blue-400" />}
            usage={stats?.disk}
          />
        </div>
      )}
    </div>
  );
}
