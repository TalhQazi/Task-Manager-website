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
  const raw = t as Record<string, unknown>;
  const assignee = Array.isArray(raw.assignees) && (raw.assignees as string[]).length > 0
    ? (raw.assignees as string[])[0]
    : (typeof raw.assignee === "string" ? raw.assignee : "");
  return {
    id: t._id,
    title: t.title || "",
    assignee,
    status: t.status,
    priority: t.priority,
    dueDate: typeof t.dueDate === "string" ? t.dueDate : (typeof t.dueDate === "object" && t.dueDate && "toISOString" in t.dueDate) ? (t.dueDate as Date).toISOString().split("T")[0] : "",
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
        (t.title || "").toLowerCase().includes(q) ||
        (t.assignee || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q) ||
        (t.priority || "").toLowerCase().includes(q)
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
    <div className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title text-xl sm:text-2xl md:text-3xl">Reports & Analytics</h1>
          <p className="page-subtitle text-sm sm:text-base">Review task, attendance, and performance insights</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="tasks" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Task Analytics</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Time Clock Reports</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Employee Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Tasks by Status</h3>
              </div>
              <ChartContainer
                config={{
                  value: { label: "Tasks", color: "hsl(var(--primary))" },
                }}
                className="h-[220px] sm:h-[260px]"
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

            <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Tasks by Priority</h3>
              </div>
              <ChartContainer
                config={{
                  value: { label: "Tasks", color: "hsl(var(--info))" },
                }}
                className="h-[220px] sm:h-[260px]"
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

          <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                  value={taskQuery}
                  onChange={(e) => setTaskQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm sm:text-base" onClick={exportTasksCsv}>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[500px] sm:min-w-full">
                <table className="data-table w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Task</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Assignee</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Priority</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t, index) => (
                    <tr key={t.id} className="animate-fade-in border-b border-border/50 hover:bg-muted/30 transition-colors" style={{ animationDelay: `${index * 20}ms` }}>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="font-medium text-foreground text-sm sm:text-base">{t.title}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{t.assignee}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-foreground text-base sm:text-lg">Weekly Summary</h3>
            </div>
            <ChartContainer
              config={{
                tasksCompleted: { label: "Tasks Completed", color: "hsl(var(--primary))" },
                hoursLogged: { label: "Hours Logged", color: "hsl(var(--success))" },
              }}
              className="h-[240px] sm:h-[280px]"
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

          <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendance..."
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                  value={attendanceQuery}
                  onChange={(e) => setAttendanceQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm sm:text-base" onClick={exportAttendanceCsv}>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[650px] sm:min-w-full">
                <table className="data-table w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Employee</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Clock In</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Clock Out</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Total Hours</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((a, index) => (
                    <tr key={a.id} className="animate-fade-in border-b border-border/50 hover:bg-muted/30 transition-colors" style={{ animationDelay: `${index * 20}ms` }}>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="font-medium text-foreground text-sm sm:text-base">{a.employee}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{new Date(a.date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{a.clockIn}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{a.clockOut}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{a.totalHours}h</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs">
                          {a.status}
                        </Badge>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="text-muted-foreground text-sm sm:text-base">{a.location}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-foreground text-base sm:text-lg">Hours by Employee</h3>
            </div>
            <ChartContainer
              config={{
                hours: { label: "Hours", color: "hsl(var(--primary))" },
              }}
              className="h-[260px] sm:h-[320px]"
            >
              <BarChart data={hoursByEmployee} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="employee" tickLine={false} axisLine={false} hide />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="var(--color-hours)" radius={8} />
              </BarChart>
            </ChartContainer>

            <div className="mt-4 sm:mt-6 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[300px] sm:min-w-full">
                <table className="data-table w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Employee</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursByEmployee.map((row, index) => (
                      <tr key={row.employee} className="animate-fade-in border-b border-border/50 hover:bg-muted/30 transition-colors" style={{ animationDelay: `${index * 20}ms` }}>
                        <td className="py-2 sm:py-3 px-2 sm:px-3">
                          <span className="font-medium text-foreground text-sm sm:text-base">{row.employee}</span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3">
                          <span className="text-muted-foreground text-sm sm:text-base">{row.hours}h</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
