import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmployeeDashboard, getEmployeeProfile, getOnboardingStatus, startLunch, endLunch, startBreak, endBreak } from "../lib/api";
import { employeeApiFetch } from "../lib/api";
import { getEmployeeAuth } from "../lib/auth";
import { CheckCircle, Clock, AlertCircle, MessageSquare, Calendar, Timer, ListTodo, AlertTriangle, DollarSign, CheckSquare2, Users, UserCog, ChevronDown, ChevronUp, Briefcase, Bug, Utensils, Coffee } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { EmployeeStatCard } from "../components/StatCard";
import { useSocket } from "@/contexts/SocketContext";

interface TeamLeadMapping {
  teamLead: string;
  user: string;
  allowOverrideAdminAssignments: boolean;
}


interface DashboardData {
  earnings: number;
  hoursWorked: number;
  alerts: string[];
  actions: Array<{
    type: string;
    label: string;
  }>;

  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  clock: {
    clockIn: string;
    clockOut: string;
    status: string;
  };
  scheduleCount: number;
  unreadMessages: number;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
  }>;
}

// Circular Progress Component
function CircularProgress({ 
  value, 
  total, 
  color, 
  icon: Icon,
  label 
}: { 
  value: number; 
  total: number; 
  color: string; 
  icon: React.ElementType;
  label: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            className={`h-6 w-6 ${color.replace('stroke-', 'text-')}`}
            style={{ color: "var(--tb-dashboard-icon-color)" }}
          />
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {total > 0 && (
          <p className="text-xs font-medium text-gray-500">{Math.round(percentage)}%</p>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: async () => {
      const res = await getEmployeeDashboard();
      return res.item;
    },
    refetchOnWindowFocus: false,
  });


  const profileQuery = useQuery({
    queryKey: ["employee-profile"],
    queryFn: async () => {
      const res = await getEmployeeProfile();
      return res.item;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const onboardingQuery = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const res = await getOnboardingStatus();
      return res.item;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Time remaining tick effect for lunch/break countdown
  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      setTimeLeft(null);
      return;
    }

    const currentStatus = (profile as any).current_status || "AVAILABLE";
    if (currentStatus === "AVAILABLE") {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      let targetTime = 0;

      if (currentStatus === "LUNCH") {
        targetTime = (profile as any).lunch_expected_end ? new Date((profile as any).lunch_expected_end).getTime() : 0;
      } else if (currentStatus === "BREAK") {
        const startTime = (profile as any).break_start_time ? new Date((profile as any).break_start_time).getTime() : 0;
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
  }, [profileQuery.data]);

  // Socket listener for real-time status updates matching current user
  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (payload: {
      userId: string;
      current_status: "AVAILABLE" | "LUNCH" | "BREAK";
      lunch_start_time: string | null;
      lunch_expected_end: string | null;
      break_start_time: string | null;
      name: string;
    }) => {
      const profile = profileQuery.data;
      if (profile && (profile as any).id === payload.userId) {
        queryClient.setQueryData(["employee-profile"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            current_status: payload.current_status,
            lunch_start_time: payload.lunch_start_time,
            lunch_expected_end: payload.lunch_expected_end,
            break_start_time: payload.break_start_time,
          };
        });
        // Also invalidate dashboard query to sync clocked status if needed
        queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
      }
    };

    socket.on("status-update", handleStatusUpdate);
    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket, profileQuery.data, queryClient]);

  const handleStartLunch = async () => {
    try {
      setStatusActionLoading(true);
      const res = await startLunch();
      if (res.ok) {
        queryClient.setQueryData(["employee-profile"], (old: any) => {
          if (!old) return old;
          return { ...old, ...res.employee };
        });
      }
    } catch (e) {
      console.error("Failed to start lunch:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleEndLunch = async () => {
    try {
      setStatusActionLoading(true);
      const res = await endLunch();
      if (res.ok) {
        queryClient.setQueryData(["employee-profile"], (old: any) => {
          if (!old) return old;
          return { ...old, ...res.employee };
        });
      }
    } catch (e) {
      console.error("Failed to end lunch:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    try {
      setStatusActionLoading(true);
      const res = await startBreak();
      if (res.ok) {
        queryClient.setQueryData(["employee-profile"], (old: any) => {
          if (!old) return old;
          return { ...old, ...res.employee };
        });
      }
    } catch (e) {
      console.error("Failed to start break:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setStatusActionLoading(true);
      const res = await endBreak();
      if (res.ok) {
        queryClient.setQueryData(["employee-profile"], (old: any) => {
          if (!old) return old;
          return { ...old, ...res.employee };
        });
      }
    } catch (e) {
      console.error("Failed to end break:", e);
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

  const renderStatusWidget = () => {
    const profile = profileQuery.data;
    if (!profile) return null;

    const currentStatus = (profile as any).current_status || "AVAILABLE";

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
                  <Button
                    onClick={handleStartLunch}
                    disabled={statusActionLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Utensils className="h-4 w-4" /> Go to Lunch
                  </Button>
                  <Button
                    onClick={handleStartBreak}
                    disabled={statusActionLoading}
                    className="bg-[#8b5cf6] hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Coffee className="h-4 w-4" /> Go on Break
                  </Button>
                </>
              ) : currentStatus === "LUNCH" ? (
                <Button
                  onClick={handleEndLunch}
                  disabled={statusActionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <CheckCircle className="h-4 w-4" /> End Lunch
                </Button>
              ) : (
                <Button
                  onClick={handleEndBreak}
                  disabled={statusActionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <CheckCircle className="h-4 w-4" /> End Break
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bug count state
  const [myBugCount, setMyBugCount] = useState(0);

  useEffect(() => {
    const fetchBugCount = async () => {
      try {
        const res = await employeeApiFetch<{ items?: any[] }>("/api/bugs");
        const items = Array.isArray(res?.items) ? res.items : [];
        const open = items.filter((b: any) => b.status !== "closed");
        setMyBugCount(open.length);
      } catch {
        // silently ignore
      }
    };
    fetchBugCount();
  }, []);

  // Team info state
  const [teamMappings, setTeamMappings] = useState<TeamLeadMapping[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        setTeamLoading(true);
        // Fetch team lead mappings for current user (to find their team lead)
        const res = await employeeApiFetch<{ items: TeamLeadMapping[] }>("/api/team-lead-mappings/me");
        setTeamMappings(res.items || []);
      } catch (e) {
        console.error("Failed to load team info:", e);
      } finally {
        setTeamLoading(false);
      }
    };
    fetchTeamInfo();
  }, []);

  // Find team lead for current employee
  const myTeamLead = useMemo(() => {
    if (teamMappings.length === 0) return null;
    return teamMappings[0]?.teamLead || null;
  }, [teamMappings]);

  // Find teammates (other users with same team lead)
  const teammates = useMemo(() => {
    if (!myTeamLead) return [];
    return teamMappings.filter(m => m.teamLead === myTeamLead).map(m => m.user);
  }, [teamMappings, myTeamLead]);

  const data = dashboardQuery.data || null;
  const onboardingStatus = onboardingQuery.data?.overallStatus || "not_started";
  const isOnboardingApproved = onboardingStatus === "approved";
  const employeeName = useMemo(() => {
    const n = String(profileQuery.data?.name || "").trim();
    return n;
  }, [profileQuery.data?.name]);

  const loading = dashboardQuery.isLoading || profileQuery.isLoading;

  /*useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardRes, profileRes] = await Promise.all([
          getEmployeeDashboard(),
          getEmployeeProfile(),
        ]);
        setData(dashboardRes.item as DashboardData);
        setEmployeeName(profileRes.item.name);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);*/


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#133767] to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome to Employee Portal</h1>
          <p className="text-blue-100">Loading your dashboard...</p>
        </div>

       

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-6 w-10 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.tasks || { total: 0, completed: 0, pending: 0, inProgress: 0 };
  const isClockedIn = data?.clock?.clockIn && !data?.clock?.clockOut;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row - Top of Page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Link to="/employee/payroll">
          <EmployeeStatCard
            title="CURRENT PAY PERIOD"
            value={`$${(dashboardQuery.data?.earnings || 0).toFixed(2)}`}
            icon={DollarSign}
            variant="green"
          />
        </Link>
        <Link to="/employee/timeLogs">
          <EmployeeStatCard
            title="HOURS WORKED"
            value={`${dashboardQuery.data?.hoursWorked || 0} hrs`}
            icon={Clock}
            variant="blue"
          />
        </Link>
        <Link to="/employee/tasks">
          <EmployeeStatCard
            title="PENDING TASKS"
            value={dashboardQuery.data?.tasks?.pending || 0}
            icon={Briefcase}
            variant="orange"
          />
        </Link>
        <Link to="/employee/bugs">
          <EmployeeStatCard
            title="OPEN BUGS"
            value={myBugCount}
            icon={Bug}
            variant={myBugCount > 0 ? "red" : "primary"}
          />
        </Link>
        <Link to="/employee/profile">
          <EmployeeStatCard
            title="ALERTS"
            value={dashboardQuery.data?.alerts?.length || 0}
            icon={AlertCircle}
            variant={(dashboardQuery.data?.alerts?.length || 0) > 0 ? "red" : "primary"}
          />
        </Link>
      </div>

      {/* Alerts List */}
      {(dashboardQuery.data?.alerts?.length || 0) > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardQuery.data?.alerts?.map((alert: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Banner - Admin Style */}
      <div
        className="relative rounded-xl border-[2px] border-[#5a5a5a] bg-[#111] overflow-hidden group cursor-default shadow-[inset_0_0_20px_rgba(0,0,0,0.8),_0_4px_10px_rgba(0,0,0,0.5)]"
      >
        {/* Dynamic Background Glow - Blue */}
        <div
          className="absolute inset-0 opacity-50 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 70% 120%, rgba(59, 130, 246, 0.5) 0%, transparent 70%)`
          }}
        />
        {/* Horizontal Light Streak */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)`,
            height: '1px',
            top: '50%'
          }}
        />
        {/* Inner Bevel */}
        <div className="absolute inset-[2px] rounded-lg border border-white/10 pointer-events-none" />

        <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Welcome{employeeName ? `, ${employeeName}` : " to Employee Portal"}
            </h1>
            <p className="text-[#d0d0d0] text-sm drop-shadow-md">View your tasks and manage your work efficiently.</p>
          </div>
          {isClockedIn ? (
            <div className={cn(
              "relative flex items-center justify-center",
              "h-10 px-4 rounded-lg border-2 border-[#666] bg-gradient-to-br from-[#444] to-[#111]",
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.8)]"
            )}>
              <div className="absolute inset-[2px] rounded-md border border-black/80" />
              <Clock className="h-4 w-4 mr-2 text-green-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' }} />
              <span className="text-green-400 text-sm font-semibold">Clocked In</span>
            </div>
          ) : data?.clock?.clockOut ? (
            <div className={cn(
              "relative flex items-center justify-center",
              "h-10 px-4 rounded-lg border-2 border-[#666] bg-gradient-to-br from-[#444] to-[#111]",
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.8)]"
            )}>
              <div className="absolute inset-[2px] rounded-md border border-black/80" />
              <CheckCircle className="h-4 w-4 mr-2 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))' }} />
              <span className="text-amber-400 text-sm font-semibold">Shift Complete</span>
            </div>
          ) : null}
        </div>
      </div>

      {renderStatusWidget()}

      {/* Onboarding Warning Banner */}
      {!isOnboardingApproved && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Complete Your Onboarding</p>
                  <p className="text-sm text-orange-700">
                    {onboardingStatus === "not_started" || onboardingStatus === "in_progress"
                      ? "Please complete your onboarding to access all features."
                      : onboardingStatus === "submitted"
                      ? "Your onboarding is submitted and pending approval."
                      : "Please complete your onboarding to access all features."}
                  </p>
                </div>
              </div>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto flex-shrink-0">
                <Link to="/employee/profile">Complete Onboarding</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EmployeeStatCard
          title="Current Earnings"
          value={`$${data?.earnings || 0}`}
          icon={DollarSign}
          variant="green"
        />
        <EmployeeStatCard
          title="Hours Worked"
          value={`${data?.hoursWorked || 0} hrs`}
          icon={Clock}
          variant="blue"
        />
        <EmployeeStatCard
          title="Pending Tasks"
          value={data?.tasks?.pending || 0}
          icon={CheckSquare2}
          variant="orange"
        />
      </div>

      {/* My Team Section */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-5 w-5 text-primary" />
            My Team
          </CardTitle>
          {myTeamLead && (
            <button
              onClick={() => setTeamExpanded(!teamExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {teamExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          )}
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !myTeamLead ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              You are not assigned to any team yet.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Team Lead */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team Lead</p>
                  <p className="font-medium">{myTeamLead}</p>
                </div>
              </div>

              {/* Team Members */}
              {teamExpanded && teammates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teammates.map((member, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
                      >
                        <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-emerald-600">
                            {member.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!teamExpanded && teammates.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {teammates.length} team member{teammates.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

<div className="space-y-2">
  {(data?.alerts?.length ?? 0) === 0 ? (
    <div className="p-3 border rounded-lg bg-green-50 text-green-700">
      All documents are up to date 🎉
    </div>
  ) : (
    data.alerts.map((alert, i) => {
      const text = alert.toLowerCase();

      const isMissing = text.includes("missing");
      const isCompleted = text.includes("completed");
      const isPending = text.includes("pending");

      return (
        <Link key={i} to="/employee/documents">
          <div
            className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition
              ${
                isMissing
                  ? "bg-red-50 hover:bg-red-100 border-red-200"
                  : isCompleted
                  ? "bg-green-50 hover:bg-green-100 border-green-200"
                  : isPending
                  ? "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                  : "bg-gray-50"
              }
            `}
          >
            <span className="text-sm font-medium">{alert}</span>

            <span className="text-xs px-2 py-1 rounded-full">
              {isMissing && "❌ Missing"}
              {isPending && "⏳ Pending"}
              {isCompleted && "✅ Done"}
              {!isMissing && !isPending && !isCompleted && "ℹ️ Info"}
            </span>
          </div>
        </Link>
      );
    })
  )}
</div>

{/*data?.actions?.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-3">
        {data.actions.map((action, i) => (
          <Button
            key={i}
            onClick={() => {
             if (action.type === "add_payroll") {
            window.location.href = "/employee/payroll";
          }
          if (action.type === "add_time") {
            window.location.href = "/employee/TimeLogs";
          }
          if (action.type === "upload_docs") {
            window.location.href = "/employee/TaxDocs";
          }
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
)*/}

      {/* Task Progress Circular Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" style={{ color: "var(--tb-dashboard-icon-color)" }} />
            Task Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CircularProgress
              value={stats.total}
              total={Math.max(stats.total, 1)}
              color="stroke-blue-500"
              icon={ListTodo}
              label="Total Tasks"
            />
            <CircularProgress
              value={stats.completed}
              total={Math.max(stats.total, 1)}
              color="stroke-green-500"
              icon={CheckCircle}
              label="Completed"
            />
            <CircularProgress
              value={stats.inProgress}
              total={Math.max(stats.total, 1)}
              color="stroke-yellow-500"
              icon={Clock}
              label="In Progress"
            />
            <CircularProgress
              value={stats.pending}
              total={Math.max(stats.total, 1)}
              color="stroke-orange-500"
              icon={AlertCircle}
              label="Pending"
            />
          </div>
          
          {/* Progress Bar Summary */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{stats.completed} completed</span>
              <span>{stats.total - stats.completed} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Events</p>
                  <p className="text-xl font-bold">{data?.scheduleCount || 0}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/employee/schedule">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                  <p className="text-xl font-bold">{data?.unreadMessages || 0}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/employee/messages">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Hours</p>
                  <p className="text-xl font-bold">
                    {data?.clock?.clockIn
                      ? data?.clock?.clockOut
                        ? "Complete"
                        : "In Progress"
                      : "Not Started"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/employee/clocked">Clock</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tasks</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/employee/tasks">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data?.recentTasks?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentTasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-slate-50 transition-colors gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {task.dueDate || "No due date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "default"
                          : task.status === "in-progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {task.status}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

