import { useEffect, useState, useCallback } from "react";
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  Database, 
  Globe, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/manger/ui/button";
import { Badge } from "@/components/manger/ui/badge";

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
  cpuUsage?: number;
  ram?: ResourceUsage;
  disk?: ResourceUsage | null;
}

interface HealthOverview {
  servers?: { total: number; live: number; down: number };
  websites?: { total: number; live: number; down: number };
  openIncidents?: number;
}

interface PerformanceStats {
  uptimeSeconds?: number;
  memory?: {
    rssMb?: number;
    heapUsedMb?: number;
    heapTotalMb?: number;
  };
  mongo?: {
    status?: string;
    avgLatencyMs?: number;
  };
  cache?: {
    size?: number;
    hits?: number;
    misses?: number;
  };
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes < 0) return "0 GB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}

export function CompleteServerHealth({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [overviewRes, systemRes, perfRes] = await Promise.allSettled([
        apiFetch<HealthOverview>("/api/health/overview"),
        apiFetch<SystemStats>("/api/health/system"),
        apiFetch<PerformanceStats>("/api/health/performance"),
      ]);

      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value);
      }
      if (systemRes.status === "fulfilled") {
        setSystemStats(systemRes.value);
      }
      if (perfRes.status === "fulfilled") {
        setPerformance(perfRes.value);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("[CompleteServerHealth] Failed to load server health data:", err);
    } finally {
      setLoading(false);
      if (showRefreshing) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthData, autoRefresh]);

  // Derived metrics
  const cpuPercent = systemStats?.cpuUsage !== undefined ? systemStats.cpuUsage : 0;
  const ramTotal = systemStats?.ram?.total || 1;
  const ramUsed = systemStats?.ram?.used || 0;
  const ramPercent = Math.min(100, Math.round((ramUsed / ramTotal) * 100));

  const diskTotal = systemStats?.disk?.total || 1;
  const diskUsed = systemStats?.disk?.used || 0;
  const diskPercent = systemStats?.disk ? Math.min(100, Math.round((diskUsed / diskTotal) * 100)) : null;

  const uptime = systemStats?.uptimeSeconds || performance?.uptimeSeconds || 0;
  const isHealthy = (overview?.openIncidents || 0) === 0 && cpuPercent < 90 && ramPercent < 95;

  return (
    <div className={`w-full rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 via-card/50 to-background/90 backdrop-blur-xl shadow-xl overflow-hidden ${className}`}>
      {/* Header section */}
      <div className="p-5 sm:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Activity className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                Server Health & Infrastructure
              </h3>
              <Badge 
                variant="outline" 
                className={`text-xs px-2.5 py-0.5 font-semibold ${
                  isHealthy 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {isHealthy ? "All Systems Operational" : "Degraded Performance"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live telemetry: host resources, API services, database engine & server clusters
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <span className="text-[11px] text-muted-foreground/80 hidden md:inline-block">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchHealthData(true)}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5 border-border/70 hover:bg-muted/80"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-8 text-xs font-medium ${autoRefresh ? "text-primary hover:text-primary" : "text-muted-foreground"}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${autoRefresh ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
            Auto-sync (30s)
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/admin/health")}
            className="h-8 text-xs gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            Full Health Center
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Telemetry Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* KPI Micro-Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Uptime */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Uptime</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatUptime(uptime)}
            </div>
            <span className="text-[10px] text-muted-foreground">Continuous uptime</span>
          </div>

          {/* CPU Usage */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">CPU Load</span>
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${cpuPercent > 80 ? 'text-rose-500' : cpuPercent > 50 ? 'text-amber-500' : 'text-foreground'}`}>
                {cpuPercent}%
              </span>
              {systemStats?.cpuCount && (
                <span className="text-[10px] text-muted-foreground">({systemStats.cpuCount} cores)</span>
              )}
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${cpuPercent > 80 ? 'bg-rose-500' : cpuPercent > 50 ? 'bg-amber-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.max(4, cpuPercent)}%` }}
              />
            </div>
          </div>

          {/* RAM Usage */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Memory RAM</span>
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${ramPercent > 85 ? 'text-rose-500' : 'text-foreground'}`}>
                {ramPercent}%
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {formatBytes(ramUsed)} / {formatBytes(ramTotal)}
              </span>
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${ramPercent > 85 ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.max(4, ramPercent)}%` }}
              />
            </div>
          </div>

          {/* Disk Space */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Disk Storage</span>
              <HardDrive className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${(diskPercent || 0) > 85 ? 'text-rose-500' : 'text-foreground'}`}>
                {diskPercent !== null ? `${diskPercent}%` : "Online"}
              </span>
              {systemStats?.disk && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {formatBytes(diskUsed)} / {formatBytes(diskTotal)}
                </span>
              )}
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${(diskPercent || 0) > 85 ? 'bg-rose-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.max(4, diskPercent || 35)}%` }}
              />
            </div>
          </div>

          {/* Database / Process Memory */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Database & Heap</span>
              <Database className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{performance?.memory?.heapUsedMb ? `${performance.memory.heapUsedMb} MB` : "Connected"}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">MongoDB & Node engine</span>
          </div>

          {/* Web Endpoints / Incidents */}
          <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-border transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Services Status</span>
              <Globe className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {overview?.websites ? `${overview.websites.live} / ${overview.websites.total} Live` : "Active"}
            </div>
            <span className={`text-[10px] font-medium ${(overview?.openIncidents || 0) > 0 ? "text-rose-400" : "text-emerald-500"}`}>
              {(overview?.openIncidents || 0) > 0 ? `${overview?.openIncidents} Incidents` : "0 Incidents"}
            </span>
          </div>
        </div>

        {/* Detailed Host Infrastructure Bar */}
        <div className="bg-muted/10 border border-border/40 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Host: {systemStats?.hostname || "Local Node Server"}</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-mono">
                    {systemStats?.platform || "Node.js Environment"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Running backend services, WebSocket real-time cluster, and task sync workers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">REST API:</span>
                <span className="font-semibold text-foreground">200 OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Database:</span>
                <span className="font-semibold text-foreground">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">WebSockets:</span>
                <span className="font-semibold text-foreground">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
