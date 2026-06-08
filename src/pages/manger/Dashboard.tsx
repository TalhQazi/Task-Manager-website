import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { RecentTasksList } from "@/components/admin/dashboard/RecentTasksList";
import { ActiveEmployees } from "@/components/admin/dashboard/ActiveEmployees";
import { TaskCharts } from "@/components/manger/dashboard/TaskCharts";
import { DayAheadCard } from "@/components/admin/dashboard/DayAheadCard";
import { WeekAheadCard } from "@/components/admin/dashboard/WeekAheadCard";

import { Users, CheckSquare, FolderRoot, Car, MapPin, AlertTriangle, Clock, Sparkles, TrendingUp, ClipboardList, UserCog, ChevronDown, ChevronUp, Bug, Utensils, Coffee, Timer, CheckCircle } from "lucide-react";
import { apiFetch, getEODStatus } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { useSocket } from "@/contexts/SocketContext";
import { Badge } from "@/components/manger/ui/badge";
import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";

interface TeamLeadMapping {
  teamLead: string;
  user: string;
  allowOverrideAdminAssignments: boolean;
}

type DashboardSummary = {
  activeTasks: number;
  dueToday: number;
  overdueTasks: number;
  employeesWorking: number;
  employeeTotal: number;
  hoursLoggedToday: number;
  avgHoursPerEmployee: number;
  projectTotal: number;
  vehicleTotal: number;
  locationTotal: number;
};

// Enhanced animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [onboardingStatus, setOnboardingStatus] = useState<string>("not_started");
  const [eodStats, setEodStats] = useState({ submitted: 0, late: 0, missing: 0, total: 0 });
  const [pendingBugs, setPendingBugs] = useState(0);
  
  // Team visibility state
  const [teamMappings, setTeamMappings] = useState<TeamLeadMapping[]>([]);
  const [teamViewLoading, setTeamViewLoading] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const auth = getAuthState();
  const isTeamLead = auth.role === "team-lead";
  const currentUserName = auth.name || auth.username || "";
    

  // Fetch team mappings for visibility
  useEffect(() => {
    const fetchTeamMappings = async () => {
      try {
        setTeamViewLoading(true);
        // Fetch all team mappings (for manager view) or just own mappings (for team lead)
        const endpoint = isTeamLead 
          ? "/api/team-lead-mappings/me" 
          : "/api/team-lead-mappings";
        const res = await apiFetch<{ items: TeamLeadMapping[] }>(endpoint);
        setTeamMappings(res.items || []);
      } catch (e) {
        // Silently fail - team view is optional
        console.error("Failed to load team mappings:", e);
      } finally {
        setTeamViewLoading(false);
      }
    };
    fetchTeamMappings();
  }, [isTeamLead, currentUserName]);

  // Group mappings by team lead
  const teamsByLead = useMemo(() => {
    const grouped: Record<string, TeamLeadMapping[]> = {};
    teamMappings.forEach(mapping => {
      if (!grouped[mapping.teamLead]) {
        grouped[mapping.teamLead] = [];
      }
      grouped[mapping.teamLead].push(mapping);
    });
    return grouped;
  }, [teamMappings]);

  const toggleTeamExpand = (teamLead: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamLead]: !prev[teamLead] }));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);


        const normalizeProfile = (emp: any) => {
          if (!emp) return null;
          return {
            ...emp,
            id: emp.id || String(emp._id || ""),
            current_status: emp.current_status || "AVAILABLE",
            lunch_start_time: emp.lunch_start_time || null,
            lunch_expected_end: emp.lunch_expected_end || null,
            break_start_time: emp.break_start_time || null,
          };
        };

        const [data, onboardingRes, eodRes, bugsRes, profileRes] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary").catch(() => null),
          apiFetch<{ item: { overallStatus: string } }>("/api/onboarding/me").catch(() => ({ item: { overallStatus: "not_started" } })),
          getEODStatus().catch(() => ({ items: [] })),
          apiFetch<{ items?: any[] }>("/api/bugs").catch(() => ({ items: [] })),
          apiFetch<{ item: any }>("/api/employees/me").catch(() => null),
        ]);
        if (!mounted) return;
        if (data) setSummary(data);
        setOnboardingStatus(onboardingRes.item.overallStatus);
        if (profileRes?.item) setProfile(normalizeProfile(profileRes.item));

        // Calculate EOD stats
        const eodItems = eodRes.items || [];
        const submitted = eodItems.filter((i: any) => i.status === "submitted").length;
        const late = eodItems.filter((i: any) => i.status === "late").length;
        const missing = eodItems.filter((i: any) => i.status === "missing").length;
        setEodStats({
          submitted,
          late,
          missing,
          total: eodItems.length,
        });

        // Count open bugs
        const bugItems = Array.isArray(bugsRes?.items) ? bugsRes.items : [];
        setPendingBugs(bugItems.filter((b: any) => b.status !== "closed").length);

      } catch (e) {
        if (mounted) setApiError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // Time remaining tick effect for lunch/break countdown
  useEffect(() => {
    if (!profile) {
      setTimeLeft(null);
      return;
    }

    const currentStatus = profile.current_status || "AVAILABLE";
    if (currentStatus === "AVAILABLE") {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      let targetTime = 0;

      if (currentStatus === "LUNCH") {
        targetTime = profile.lunch_expected_end ? new Date(profile.lunch_expected_end).getTime() : 0;
      } else if (currentStatus === "BREAK") {
        const startTime = profile.break_start_time ? new Date(profile.break_start_time).getTime() : 0;
        targetTime = startTime + 15 * 60 * 1000; // 15 mins for break
      }

      if (!targetTime) {
        setTimeLeft(null);
        return;
      }

      const diff = Math.max(0, Math.round((targetTime - now) / 1000));
      setTimeLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  // Socket listener for real-time status updates matching current user
  useEffect(() => {
    if (!socket || !profile?.id) return;

    const handleStatusUpdate = (payload: {
      userId: string;
      current_status: "AVAILABLE" | "LUNCH" | "BREAK";
      lunch_start_time: string | null;
      lunch_expected_end: string | null;
      break_start_time: string | null;
      name: string;
    }) => {
      if (payload.userId === profile.id) {
        setProfile((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_status: payload.current_status,
            lunch_start_time: payload.lunch_start_time,
            lunch_expected_end: payload.lunch_expected_end,
            break_start_time: payload.break_start_time,
          };
        });
      }
    };

    socket.on("status-update", handleStatusUpdate);
    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket, profile?.id]);

  const normalizeProfile = (emp: any) => {
    if (!emp) return null;
    return {
      ...emp,
      id: emp.id || String(emp._id || ""),
      current_status: emp.current_status || "AVAILABLE",
      lunch_start_time: emp.lunch_start_time || null,
      lunch_expected_end: emp.lunch_expected_end || null,
      break_start_time: emp.break_start_time || null,
    };
  };

  const handleStartLunch = async () => {
    try {
      setStatusActionLoading(true);
      setApiError(null);
      const res = await apiFetch<{ ok: boolean; employee: any }>("/api/user/status/start-lunch", { method: "POST" });
      if (res.ok) {
        setProfile(normalizeProfile(res.employee));
      }
    } catch (e) {
      console.error("Failed to start lunch:", e);
      setApiError(e instanceof Error ? e.message : "Failed to start lunch");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleEndLunch = async () => {
    try {
      setStatusActionLoading(true);
      setApiError(null);
      const res = await apiFetch<{ ok: boolean; employee: any }>("/api/user/status/end-lunch", { method: "POST" });
      if (res.ok) {
        setProfile(normalizeProfile(res.employee));
      }
    } catch (e) {
      console.error("Failed to end lunch:", e);
      setApiError(e instanceof Error ? e.message : "Failed to end lunch");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    try {
      setStatusActionLoading(true);
      setApiError(null);
      const res = await apiFetch<{ ok: boolean; employee: any }>("/api/user/status/start-break", { method: "POST" });
      if (res.ok) {
        setProfile(normalizeProfile(res.employee));
      }
    } catch (e) {
      console.error("Failed to start break:", e);
      setApiError(e instanceof Error ? e.message : "Failed to start break");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setStatusActionLoading(true);
      setApiError(null);
      const res = await apiFetch<{ ok: boolean; employee: any }>("/api/user/status/end-break", { method: "POST" });
      if (res.ok) {
        setProfile(normalizeProfile(res.employee));
      }
    } catch (e) {
      console.error("Failed to end break:", e);
      setApiError(e instanceof Error ? e.message : "Failed to end break");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const formatTimeLeft = (sec: number | null) => {
    if (sec === null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const metrics = useMemo(() => {
    if (!summary) return null;
    return {
      totalEmployees: summary.employeeTotal,
      activeTasks: summary.activeTasks,
      overdueTasks: summary.overdueTasks,
      dueToday: summary.dueToday,
      clockedInEmployees: summary.employeesWorking,
      hoursLoggedToday: summary.hoursLoggedToday,
      totalProjects: summary.projectTotal || 0,
      totalVehicles: summary.vehicleTotal || 0,
      totalLocations: summary.locationTotal || 0,
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="pl-2 pr-2 sm:pl-6 space-y-4 sm:space-y-5 md:space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {onboardingStatus !== "approved" && (
          <motion.div variants={itemVariants}>
            <div className="border-l-4 border-l-orange-500 bg-orange-50/10 backdrop-blur-md rounded-xl p-4 border border-orange-500/20 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Complete Your Onboarding</p>
                    <p className="text-sm text-gray-300">
                      {onboardingStatus === "not_started" || onboardingStatus === "in_progress"
                        ? "Please complete your onboarding to access all features."
                        : onboardingStatus === "submitted"
                        ? "Your onboarding is submitted and pending approval."
                        : "Please complete your onboarding to access all features."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/manager/profile")}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all w-full sm:w-auto flex-shrink-0"
                >
                  Complete Onboarding
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6"
          variants={containerVariants}
        >
          {metrics && [
            {
              title: "Active Projects",
              value: metrics.totalProjects,
              icon: FolderRoot,
              variant: "purple" as const,
              changeType: "positive" as const,
              onClick: () => navigate("/manager/tasks"),
              description: "Ongoing initiatives"
            },
            {
              title: "Active Tasks",
              value: metrics.activeTasks,
              icon: CheckSquare,
              variant: "success" as const,
              changeType: "neutral" as const,
              onClick: () => navigate("/manager/tasks"),
              description: "In progress"
            },
            {
              title: "EOD Late",
              value: eodStats.late,
              icon: ClipboardList,
              variant: "warning" as const,
              changeType: "neutral" as const,
              onClick: () => navigate("/manager/eod-reports"),
              description: "Needs attention"
            },
            {
              title: "EOD Missing",
              value: eodStats.missing,
              icon: ClipboardList,
              variant: "danger" as const,
              changeType: "negative" as const,
              onClick: () => navigate("/manager/eod-reports"),
              description: "Action required"
            },
            {
              title: "EOD Submitted",
              value: eodStats.submitted,
              icon: ClipboardList,
              variant: "success" as const,
              changeType: "positive" as const,
              onClick: () => navigate("/manager/eod-reports"),
              description: `${eodStats.total > 0 ? Math.round((eodStats.submitted / eodStats.total) * 100) : 0}% compliance`
            },
            {
              title: "Total Employees",
              value: metrics.totalEmployees,
              icon: Users,
              variant: "cyan" as const,
              changeType: "positive" as const,
              onClick: () => navigate("/manager/employees"),
              description: "Active workforce"
            },
            {
              title: "Total Locations",
              value: metrics.totalLocations,
              icon: MapPin,
              variant: "teal" as const,
              changeType: "positive" as const,
              onClick: () => navigate("/manager/locations"),
              description: "Service areas"
            },
            {
              title: "Total Vehicles",
              value: metrics.totalVehicles,
              icon: Car,
              variant: "orange" as const,
              changeType: "positive" as const,
              onClick: () => navigate("/manager/vehicles"),
              description: "Fleet size"
            },
            {
              title: "Pending Bugs",
              value: pendingBugs,
              icon: Bug,
              variant: "danger" as const,
              changeType: pendingBugs > 0 ? "negative" as const : "neutral" as const,
              onClick: () => navigate("/manager/bugs"),
              description: "Open bug reports"
            },
          ].map((stat) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="manager-stat-card-wrapper">
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  changeType={stat.changeType}
                  icon={stat.icon}
                  variant={stat.variant}
                  onClick={stat.onClick}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Availability Status Control Panel */}
        {profile && (
          <motion.div variants={itemVariants}>
            {(() => {
              const currentStatus = profile.current_status || "AVAILABLE";

              let bgStyle = "bg-[#1e293b]/60 border-[#475569]/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]";
              let glowColor = "rgba(71, 85, 105, 0.3)";
              let accentColor = "text-[#94a3b8]";
              let statusLabel = "Available";
              let statusDesc = "Ready for tasks and coordination";
              let IconComponent = CheckCircle;
              let iconClass = "text-green-400";

              if (currentStatus === "LUNCH") {
                bgStyle = "bg-[#7c2d12]/40 border-[#b45309]/30 shadow-[0_8px_32px_0_rgba(251,146,60,0.15)]";
                glowColor = "rgba(251, 146, 60, 0.25)";
                accentColor = "text-[#fdba74]";
                statusLabel = "On Lunch Break";
                statusDesc = "Dining or away from station";
                IconComponent = Utensils;
                iconClass = "text-[#f97316] animate-pulse duration-1000";
              } else if (currentStatus === "BREAK") {
                bgStyle = "bg-[#4c1d95]/40 border-[#7c3aed]/30 shadow-[0_8px_32px_0_rgba(167,139,250,0.15)]";
                glowColor = "rgba(167, 139, 250, 0.25)";
                accentColor = "text-[#ddd6fe]";
                statusLabel = "On Short Break";
                statusDesc = "Stepped away for a moment";
                IconComponent = Coffee;
                iconClass = "text-[#8b5cf6] animate-bounce duration-1000";
              }

              return (
                <div
                  className={cn(
                    "relative rounded-xl border-[2px] backdrop-blur-md p-6 overflow-hidden transition-all duration-500",
                    bgStyle
                  )}
                  style={{
                    boxShadow: `inset 0 0 20px rgba(0,0,0,0.4), 0 0 30px ${glowColor}`,
                  }}
                >
                  <div className="absolute inset-[2px] rounded-lg border border-white/5 pointer-events-none" />

                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center", currentStatus !== "AVAILABLE" && "animate-pulse")}>
                        <IconComponent className={cn("h-8 w-8", iconClass)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white tracking-wide">{statusLabel}</h3>
                          {currentStatus !== "AVAILABLE" && (
                            <Badge variant="outline" className={cn("border-white/20 text-xs px-2 py-0.5", accentColor)}>
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-0.5">{statusDesc}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      {currentStatus !== "AVAILABLE" && timeLeft !== null && (
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-xl">
                          <Timer className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-400">Time Remaining:</span>
                          <span className={cn("text-lg font-bold tracking-wider tabular-nums font-mono", accentColor)}>
                            {formatTimeLeft(timeLeft)}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {currentStatus === "AVAILABLE" ? (
                          <>
                            <button
                              onClick={handleStartLunch}
                              disabled={statusActionLoading}
                              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                            >
                              <Utensils className="h-4 w-4" /> Go to Lunch
                            </button>
                            <button
                              onClick={handleStartBreak}
                              disabled={statusActionLoading}
                              className="bg-[#8b5cf6] hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                            >
                              <Coffee className="h-4 w-4" /> Go on Break
                            </button>
                          </>
                        ) : currentStatus === "LUNCH" ? (
                          <button
                            onClick={handleEndLunch}
                            disabled={statusActionLoading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                          >
                            <CheckCircle className="h-4 w-4" /> End Lunch
                          </button>
                        ) : (
                          <button
                            onClick={handleEndBreak}
                            disabled={statusActionLoading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                          >
                            <CheckCircle className="h-4 w-4" /> End Break
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        <motion.div className="w-full overflow-x-auto pb-1" variants={itemVariants}>
          <div className="min-w-[300px] sm:min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <TaskCharts />
            </motion.div>
          </div>
        </motion.div>

        {/* Team View Section - Visible to Manager and Team Leads */}
        {(auth.role === "manager" || isTeamLead) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {isTeamLead ? "My Team" : "Team Structure"}
              </h2>
            </div>
            
            {teamViewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : Object.keys(teamsByLead).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {isTeamLead 
                  ? "No team members assigned to you yet."
                  : "No team leads configured yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(teamsByLead).map(([teamLead, mappings]) => (
                  <div key={teamLead} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTeamExpand(teamLead)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">{teamLead}</p>
                          <p className="text-xs text-muted-foreground">
                            {mappings.length} team member{mappings.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedTeams[teamLead] ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    {expandedTeams[teamLead] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                      >
                        <div className="p-3 space-y-2">
                          {mappings.map((mapping, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-emerald-600">
                                    {mapping.user.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm">{mapping.user}</span>
                              </div>
                              {mapping.allowOverrideAdminAssignments && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  Can Override
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-3">
              {isTeamLead 
                ? "You can reassign tasks to your team members from the Tasks page."
                : "Team leads can reassign tasks within their mapped teams."}
            </p>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <RecentTasksList basePath="/manager/tasks" />
            </div>
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <ActiveEmployees basePath="/manager/employees" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <DayAheadCard basePath="/manager/tasks" />
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <WeekAheadCard />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="rounded-md bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
            >
              <p className="text-xs sm:text-sm text-destructive break-words flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {apiError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default Dashboard;