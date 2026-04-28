import  React,{ useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmployeeDashboard, getEmployeeProfile, getOnboardingStatus } from "../lib/api";
import { CheckCircle, Clock, AlertCircle, MessageSquare, Calendar, Timer, ListTodo, AlertTriangle, DollarSign, CheckSquare2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { EmployeeStatCard } from "../components/StatCard";


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
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
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

        <div className="relative p-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
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

      {/* Onboarding Warning Banner */}
      {!isOnboardingApproved && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
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
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {task.dueDate || "No due date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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

