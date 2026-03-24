import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmployeeDashboard, getEmployeeProfile } from "../lib/api";
import { CheckCircle, Clock, AlertCircle, MessageSquare, Calendar, Timer, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardData {
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
          <Icon className={`h-6 w-6 ${color.replace('stroke-', 'text-')}`} />
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardRes, profileRes] = await Promise.all([
          getEmployeeDashboard(),
          getEmployeeProfile(),
        ]);
        setData(dashboardRes.item);
        setEmployeeName(profileRes.item.name);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#133767] to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome{employeeName ? `, ${employeeName}` : " to Employee Portal"}
            </h1>
            <p className="text-blue-100">View your tasks and manage your work efficiently.</p>
          </div>
          {isClockedIn ? (
            <Badge className="bg-green-500 text-white border-0">
              <Clock className="h-3 w-3 mr-1" />
              Clocked In
            </Badge>
          ) : data?.clock?.clockOut ? (
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Shift Complete
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Task Progress Circular Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
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

