import { useMemo, useState } from "react";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/manger/ui/tabs";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/manger/ui/chart";
import { toast } from "@/components/manger/ui/use-toast";
import { Badge } from "@/components/manger/ui/badge";
import { Download, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/manger/api";
import { useQuery } from "@tanstack/react-query";

type TaskStatus = "active" | "pending" | "completed";

type TaskPriority = "high" | "medium" | "low";

interface TaskRow {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

interface AttendanceRow {
  id: string;
  employee: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  status: "complete" | "incomplete" | "overtime";
  location: string;
}

type TaskRowApi = Omit<TaskRow, "id"> & { _id: string };
type AttendanceRowApi = Omit<AttendanceRow, "id"> & { _id: string };

function normalizeTask(t: TaskRowApi): TaskRow {
  return {
    id: t._id,
    title: t.title,
    assignee: t.assignee,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
  };
}

function normalizeAttendance(a: AttendanceRowApi): AttendanceRow {
  return {
    id: a._id,
    employee: a.employee,
    date: a.date,
    clockIn: a.clockIn,
    clockOut: a.clockOut,
    totalHours: a.totalHours,
    status: a.status,
    location: a.location,
  };
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    const needsQuotes = /[\n\r",]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

export default function Reports() {
  const [taskQuery, setTaskQuery] = useState("");
  const [attendanceQuery, setAttendanceQuery] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["reports", "tasks"],
    queryFn: async () => {
      const res = await apiFetch<{ items: TaskRowApi[] }>("/api/reports/tasks");
      return res.items.map(normalizeTask);
    },
  });

  const attendanceApiQuery = useQuery({
    queryKey: ["reports", "attendance"],
    queryFn: async () => {
      const res = await apiFetch<{ items: AttendanceRowApi[] }>("/api/reports/attendance");
      return res.items.map(normalizeAttendance);
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ["reports", "analytics"],
    queryFn: async () => {
      return apiFetch<{
        statusAnalytics: Array<{ status: TaskStatus; value: number }>;
        priorityAnalytics: Array<{ priority: TaskPriority; value: number }>;
        hoursByEmployee: Array<{ employee: string; hours: number }>;
        weeklyTrend: Array<{ week: string; tasksCompleted: number; hoursLogged: number }>;
      }>("/api/reports/analytics");
    },
  });

  const tasks = tasksQuery.data ?? [];
  const attendance = attendanceApiQuery.data ?? [];

  const filteredTasks = useMemo(() => {
    const q = taskQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
      );
    });
  }, [tasks, taskQuery]);

  const filteredAttendance = useMemo(() => {
    const q = attendanceQuery.trim().toLowerCase();
    if (!q) return attendance;
    return attendance.filter((a) => {
      return (
        a.employee.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      );
    });
  }, [attendance, attendanceQuery]);

  const statusAnalytics = useMemo(() => {
    return analyticsQuery.data?.statusAnalytics ?? [];
  }, [analyticsQuery.data]);

  const priorityAnalytics = useMemo(() => {
    return analyticsQuery.data?.priorityAnalytics ?? [];
  }, [analyticsQuery.data]);

  const hoursByEmployee = useMemo(() => {
    return analyticsQuery.data?.hoursByEmployee ?? [];
  }, [analyticsQuery.data]);

  const weeklyTrend = useMemo(() => {
    return analyticsQuery.data?.weeklyTrend ?? [];
  }, [analyticsQuery.data]);

  const exportTasksCsv = () => {
    const csv = toCsv(
      filteredTasks.map((t) => ({
        id: t.id,
        title: t.title,
        assignee: t.assignee,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    );
    downloadTextFile("tasks-report.csv", csv, "text/csv");
    toast({ title: "Exported", description: "Tasks report downloaded." });
  };

  const exportAttendanceCsv = () => {
    const csv = toCsv(
      filteredAttendance.map((a) => ({
        id: a.id,
        employee: a.employee,
        date: a.date,
        clockIn: a.clockIn,
        clockOut: a.clockOut,
        totalHours: a.totalHours,
        status: a.status,
        location: a.location,
      })),
    );
    downloadTextFile("attendance-report.csv", csv, "text/csv");
    toast({ title: "Exported", description: "Attendance report downloaded." });
  };

  return (
    <div className="pl-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Review task, attendance, and performance insights</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
          <TabsTrigger value="attendance">Time Clock Reports</TabsTrigger>
          <TabsTrigger value="performance">Employee Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Tasks by Status</h3>
              </div>
              <ChartContainer
                config={{
                  value: { label: "Tasks", color: "hsl(var(--primary))" },
                }}
                className="h-[260px]"
              >
                <BarChart data={statusAnalytics} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Tasks by Priority</h3>
              </div>
              <ChartContainer
                config={{
                  value: { label: "Tasks", color: "hsl(var(--info))" },
                }}
                className="h-[260px]"
              >
                <BarChart data={priorityAnalytics} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="priority" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-10"
                  value={taskQuery}
                  onChange={(e) => setTaskQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2" onClick={exportTasksCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t, index) => (
                    <tr key={t.id} className="animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                      <td>
                        <span className="font-medium text-foreground">{t.title}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{t.assignee}</span>
                      </td>
                      <td>
                        <Badge variant="outline" className="capitalize">
                          {t.priority}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="secondary" className="capitalize">
                          {t.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-muted-foreground">
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Weekly Summary</h3>
            </div>
            <ChartContainer
              config={{
                tasksCompleted: { label: "Tasks Completed", color: "hsl(var(--primary))" },
                hoursLogged: { label: "Hours Logged", color: "hsl(var(--success))" },
              }}
              className="h-[280px]"
            >
              <LineChart data={weeklyTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="tasksCompleted" stroke="var(--color-tasksCompleted)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="hoursLogged" stroke="var(--color-hoursLogged)" strokeWidth={2} dot={false} />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendance..."
                  className="pl-10"
                  value={attendanceQuery}
                  onChange={(e) => setAttendanceQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2" onClick={exportAttendanceCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((a, index) => (
                    <tr key={a.id} className="animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                      <td>
                        <span className="font-medium text-foreground">{a.employee}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{a.clockIn}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{a.clockOut}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{a.totalHours}h</span>
                      </td>
                      <td>
                        <Badge variant="secondary" className="capitalize">
                          {a.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{a.location}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Hours by Employee</h3>
            </div>
            <ChartContainer
              config={{
                hours: { label: "Hours", color: "hsl(var(--primary))" },
              }}
              className="h-[320px]"
            >
              <BarChart data={hoursByEmployee} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="employee" tickLine={false} axisLine={false} hide />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="var(--color-hours)" radius={8} />
              </BarChart>
            </ChartContainer>

            <div className="mt-6 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {hoursByEmployee.map((row, index) => (
                    <tr key={row.employee} className="animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                      <td>
                        <span className="font-medium text-foreground">{row.employee}</span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">{row.hours}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
