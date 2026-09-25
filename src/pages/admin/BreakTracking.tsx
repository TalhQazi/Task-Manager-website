import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { 
  Coffee, 
  Clock, 
  Search, 
  ShieldAlert, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Utensils,
  RefreshCw
} from "lucide-react";
import { apiFetch, toProxiedUrl } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

interface BreakSession {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "LUNCH" | "BREAK";
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  isLate: boolean;
  exceededMinutes: number;
  avatar?: string;
}

interface WeeklyStat {
  employeeId: string;
  employeeName: string;
  totalLunchMinutes: number;
  totalBreakMinutes: number;
  lunchSessionsCount: number;
  breakSessionsCount: number;
  lateReturnsCount: number;
  totalExceededMinutes: number;
  avatar?: string;
}

interface LiveStatus {
  _id: string;
  name: string;
  current_status: "AVAILABLE" | "LUNCH" | "BREAK" | "OFFLINE";
  lunch_start_time: string | null;
  lunch_expected_end: string | null;
  break_start_time: string | null;
  avatar?: string;
}

export default function BreakTracking() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter states (Default to past 7 days)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LUNCH" | "BREAK" | "LATE">("ALL");
  
  const [sessions, setSessions] = useState<BreakSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<LiveStatus[]>([]);
  
  // Ticking time for live stopwatches
  const [tick, setTick] = useState(0);

  // Fetch data
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      // Fetch combined historical sessions and stats
      const historyUrl = `/api/user/status-history?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`;
      const historyRes = await apiFetch<{ sessions: BreakSession[]; weeklyStats: WeeklyStat[] }>(historyUrl);
      
      // Fetch current statuses of all employees
      const liveRes = await apiFetch<{ items: LiveStatus[] }>("/api/team/statuses");
      
      setSessions(historyRes.sessions || []);
      setWeeklyStats(historyRes.weeklyStats || []);
      setLiveStatuses(liveRes.items || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load tracking data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Trigger fetch on date filter change
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Clock tick timer for live durations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live socket.io status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      // Toast notification for break transitions
      const statusLabel = data.current_status === "LUNCH" ? "Lunch" 
                        : data.current_status === "BREAK" ? "Break" 
                        : "Available";
      
      if (data.current_status === "LUNCH" || data.current_status === "BREAK") {
        toast.info(`${data.name} went on ${statusLabel}`, {
          description: `Started at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      } else if (data.current_status === "AVAILABLE") {
        toast.success(`${data.name} returned and is now Available`);
      }

      // Dynamically sync status in our local state to avoid refetching the entire database
      setLiveStatuses(prev => {
        const index = prev.findIndex(item => item._id === data.userId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            current_status: data.current_status,
            lunch_start_time: data.lunch_start_time,
            lunch_expected_end: data.lunch_expected_end,
            break_start_time: data.break_start_time
          };
          return updated;
        } else {
          return [...prev, {
            _id: data.userId,
            name: data.name,
            current_status: data.current_status,
            lunch_start_time: data.lunch_start_time,
            lunch_expected_end: data.lunch_expected_end,
            break_start_time: data.break_start_time
          }];
        }
      });

      // Refetch history in the background to include newly completed break logs
      fetchData(false);
    };

    socket.on("status-update", handleStatusUpdate);
    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket]);

  // Helpers for time formatting
  const formatDuration = (totalMinutes: number) => {
    const m = Math.max(0, Math.floor(totalMinutes));
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0) return `${h}h ${min}m`;
    return `${min}m`;
  };

  const getInitials = (name: string) => {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  };

  // Re-calculate live stopwatches for employees currently out
  const getLiveDurationSeconds = (startTimeStr: string | null) => {
    if (!startTimeStr) return 0;
    const start = new Date(startTimeStr).getTime();
    const diff = Date.now() - start;
    return Math.max(0, Math.floor(diff / 1000));
  };

  const formatStopwatch = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const padding = (num: number) => String(num).padStart(2, "0");
    if (h > 0) return `${h}:${padding(m)}:${padding(s)}`;
    return `${m}:${padding(s)}`;
  };

  // Filtered session records
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchQuery = s.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;

      if (typeFilter === "LUNCH") return s.type === "LUNCH";
      if (typeFilter === "BREAK") return s.type === "BREAK";
      if (typeFilter === "LATE") return s.isLate;
      return true;
    });
  }, [sessions, searchQuery, typeFilter]);

  // Filtered stats list
  const filteredStats = useMemo(() => {
    return weeklyStats.filter(s => 
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [weeklyStats, searchQuery]);

  // Derived live states
  const activeLunches = useMemo(() => {
    return liveStatuses.filter(emp => emp.current_status === "LUNCH");
  }, [liveStatuses]);

  const activeBreaks = useMemo(() => {
    return liveStatuses.filter(emp => emp.current_status === "BREAK");
  }, [liveStatuses]);

  const todayCompletedCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter(s => 
      s.endTime && s.endTime.startsWith(today)
    ).length;
  }, [sessions]);

  const todayLateCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter(s => 
      s.isLate && s.startTime.startsWith(today)
    ).length;
  }, [sessions]);

  // Export Stats and Sessions to CSV
  const exportToCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // 1. Weekly Summaries Header & Data
      csvContent += "EMPLOYEE BREAK & LUNCH WEEKLY REPORT\n";
      csvContent += `Period: ${startDate} to ${endDate}\n\n`;
      csvContent += "Employee Name,Total Lunch Time (mins),Total Break Time (mins),Lunch Sessions,Break Sessions,Late Returns,Total Overtime Minutes\n";
      
      weeklyStats.forEach(stat => {
        csvContent += `"${stat.employeeName}",${stat.totalLunchMinutes},${stat.totalBreakMinutes},${stat.lunchSessionsCount},${stat.breakSessionsCount},${stat.lateReturnsCount},${stat.totalExceededMinutes}\n`;
      });
      
      csvContent += "\n\nDETAILED BREAK LOGS HISTORY\n";
      csvContent += "Employee Name,Type,Start Time,End Time,Duration (mins),Status,Overstay Time (mins)\n";
      
      sessions.forEach(s => {
        const start = new Date(s.startTime).toLocaleString();
        const end = s.endTime ? new Date(s.endTime).toLocaleString() : "Active";
        const status = s.isLate ? "LATE" : "ON-TIME";
        csvContent += `"${s.employeeName}",${s.type},"${start}","${end}",${s.durationMinutes},${status},${s.exceededMinutes}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Employee_Break_History_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully!");
    } catch (e) {
      toast.error("Failed to export CSV report");
    }
  };

  return (
    <div className="pl-0 sm:pl-6 space-y-5 md:space-y-6 px-2 sm:px-0">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
            Lunch & Break History
          </h1>
          <p className="text-xs sm:text-sm text-white/60 max-w-3xl">
            Track daily and weekly accumulated break periods, monitor late returns, and export compliance reports.
          </p>
        </div>

        {/* Date Filters & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-white/40 font-medium">From:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-white font-semibold focus:outline-none [color-scheme:dark]"
            />
            <span className="text-xs text-white/40 font-medium ml-1">To:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-white font-semibold focus:outline-none [color-scheme:dark]"
            />
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => void fetchData(true)}
            className="bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button 
            size="sm"
            onClick={exportToCSV}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:brightness-110 text-white font-medium shadow-lg shadow-blue-500/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI: Active Lunches */}
        <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-orange-500/10 text-orange-400">
              <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">On Lunch Now</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold">{activeLunches.length}</span>
                {activeLunches.length > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI: Active Breaks */}
        <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Coffee className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">On Break Now</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold">{activeBreaks.length}</span>
                {activeBreaks.length > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI: Completed Today */}
        <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-500" />
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-green-500/10 text-green-400">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Completed Today</p>
              <span className="text-xl sm:text-2xl font-bold">{todayCompletedCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI: Late Today */}
        <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500" />
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-xl ${todayLateCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.04] text-white/40'}`}>
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Late Returns Today</p>
              <span className={`text-xl sm:text-2xl font-bold ${todayLateCount > 0 ? 'text-red-400' : ''}`}>{todayLateCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Ticking Stopwatches for Active Breaks */}
      {(activeLunches.length > 0 || activeBreaks.length > 0) && (
        <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
          <CardHeader className="py-3.5 px-4 sm:px-6 bg-white/[0.02] border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Active Break Stopwatches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...activeLunches, ...activeBreaks].map((emp) => {
                const isLunch = emp.current_status === "LUNCH";
                const startTime = isLunch ? emp.lunch_start_time : emp.break_start_time;
                const elapsedSeconds = getLiveDurationSeconds(startTime);
                
                return (
                  <div 
                    key={emp._id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border border-white/10">
                        {emp.avatar && <AvatarImage src={toProxiedUrl(emp.avatar) || emp.avatar} alt={emp.name} className="object-cover" />}
                        <AvatarFallback className="bg-[#0b1323] text-white text-xs font-semibold">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                        <Badge 
                          variant="secondary"
                          className={`text-[10px] py-0 px-1.5 capitalize font-semibold ${
                            isLunch 
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {isLunch ? 'Lunch' : 'Break'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-right font-mono text-sm font-bold text-white bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
                      <Clock className={`h-3.5 w-3.5 ${isLunch ? 'text-orange-400' : 'text-purple-400'} animate-spin`} style={{ animationDuration: '3s' }} />
                      {formatStopwatch(elapsedSeconds)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Weekly Summary and History Log */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
        
        {/* LEFT/MAIN: Detailed Logs & Filter */}
        <div className="xl:col-span-2 space-y-5 md:space-y-6">
          <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
            <CardHeader className="py-4 px-4 sm:px-6 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00C6FF]" />
                Break Logs History ({filteredSessions.length})
              </CardTitle>

              {/* Filters Panel */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
                  <Input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employee..."
                    className="pl-8 h-8 text-xs bg-white/[0.03] border-white/10 hover:border-white/20 focus:border-white/30 text-white rounded-lg"
                  />
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 h-8 font-semibold focus:outline-none"
                >
                  <option value="ALL" className="bg-[#0b1323]">All History</option>
                  <option value="LUNCH" className="bg-[#0b1323]">Lunches Only</option>
                  <option value="BREAK" className="bg-[#0b1323]">Breaks Only</option>
                  <option value="LATE" className="bg-[#0b1323]">Late Returns</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-white/40 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-[#00C6FF] border-t-transparent rounded-full animate-spin" />
                  Loading session data...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/40">
                  No break sessions recorded for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] text-white/40 font-bold uppercase tracking-wider bg-white/[0.01]">
                        <th className="py-3 px-4 sm:px-6">Employee</th>
                        <th className="py-3 px-4">Session Type</th>
                        <th className="py-3 px-4">Start Time</th>
                        <th className="py-3 px-4">End Time</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((s) => {
                        const start = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateStr = new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                        const end = s.endTime 
                          ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : null;
                        
                        return (
                          <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-white/10">
                                  {s.avatar && <AvatarImage src={toProxiedUrl(s.avatar) || s.avatar} alt={s.employeeName} className="object-cover" />}
                                  <AvatarFallback className="bg-[#0b1323] text-white text-xs font-bold">
                                    {getInitials(s.employeeName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-semibold text-white">{s.employeeName}</p>
                                  <p className="text-[10px] text-white/40">{dateStr}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge 
                                variant="secondary"
                                className={`text-[10px] font-semibold py-0.5 px-1.5 ${
                                  s.type === "LUNCH" 
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                }`}
                              >
                                {s.type}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-white/80">{start}</td>
                            <td className="py-3.5 px-4 text-xs font-medium text-white/80">
                              {end ? end : (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.2">
                                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-white">
                              {s.endTime ? formatDuration(s.durationMinutes) : "—"}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              {s.isLate ? (
                                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] py-0.5">
                                  Late return ({s.exceededMinutes}m)
                                </Badge>
                              ) : s.endTime ? (
                                <Badge className="bg-green-500/10 text-green-400 border border-green-500/25 text-[10px] py-0.5">
                                  On time
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-white/30 font-medium">In progress</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Weekly Accumulated Times Summary */}
        <div className="space-y-5 md:space-y-6">
          <Card className="bg-white/[0.02] border-white/5 shadow-2xl backdrop-blur-md overflow-hidden h-full flex flex-col">
            <CardHeader className="py-4 px-4 sm:px-6 bg-white/[0.02] border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00C6FF]" />
                Weekly Accumulated Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-sm text-white/40 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-[#00C6FF] border-t-transparent rounded-full animate-spin" />
                  Calculating stats...
                </div>
              ) : filteredStats.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/40">
                  No aggregated records found.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredStats.map((stat) => (
                    <div key={stat.employeeId} className="p-4 hover:bg-white/[0.01] transition-all duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-white/10">
                            {stat.avatar && <AvatarImage src={toProxiedUrl(stat.avatar) || stat.avatar} alt={stat.employeeName} className="object-cover" />}
                            <AvatarFallback className="bg-[#0b1323] text-white text-[10px] font-bold">
                              {getInitials(stat.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-white">{stat.employeeName}</span>
                        </div>

                        {stat.lateReturnsCount > 0 && (
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] py-0 px-1 font-semibold">
                            {stat.lateReturnsCount} Late returns
                          </Badge>
                        )}
                      </div>

                      {/* Summary Data */}
                      <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] text-white/50 bg-white/[0.01] border border-white/5 rounded-lg p-2">
                        <div>
                          <p className="text-[9px] text-white/30 font-medium">TOTAL LUNCH TIME</p>
                          <p className="text-white font-bold text-xs mt-0.5">
                            {formatDuration(stat.totalLunchMinutes)}
                            <span className="text-[10px] font-normal text-white/40 ml-1">
                              ({stat.lunchSessionsCount} shifts)
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/30 font-medium">TOTAL BREAK TIME</p>
                          <p className="text-white font-bold text-xs mt-0.5">
                            {formatDuration(stat.totalBreakMinutes)}
                            <span className="text-[10px] font-normal text-white/40 ml-1">
                              ({stat.breakSessionsCount} shifts)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
