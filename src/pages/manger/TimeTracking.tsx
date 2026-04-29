import { useEffect, useMemo } from "react";
import { Button } from "@/components/manger/ui/button";
import { Badge } from "@/components/manger/ui/badge";
import { Download, Clock, Calendar } from "lucide-react";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { cn } from "@/lib/manger/utils";
import { apiFetch } from "@/lib/manger/api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

const LAST_TIME_TRACKING_EMPLOYEE_KEY = "tm:lastTimeTrackingEmployee";

interface TimeEntry {
  id: string;
  employee: string;
  avatar: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakTime: string;
  totalHours: number;
  status: "complete" | "incomplete" | "overtime";
  location: string;
}

type TimeEntryApi = Omit<TimeEntry, "id"> & {
  _id: string;
};

function normalizeEntry(e: TimeEntryApi): TimeEntry {
  return {
    id: e._id,
    employee: e.employee,
    avatar: e.avatar,
    date: e.date,
    clockIn: e.clockIn,
    clockOut: e.clockOut,
    breakTime: e.breakTime,
    totalHours: e.totalHours,
    status: e.status,
    location: e.location,
  };
}

function formatClockTime(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "—";

  const hhmm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (hhmm) {
    const hour = Number(hhmm[1]);
    const minute = hhmm[2];
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(h12).padStart(2, "0")}:${minute} ${ampm}`;
  }

  const d = new Date(raw);
  if (Number.isFinite(d.getTime())) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return raw;
}

const statusStyles = {
  complete: "bg-success/10 text-success",
  incomplete: "bg-warning/10 text-warning",
  overtime: "bg-info/10 text-info",
};

export default function TimeTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const entriesQuery = useQuery({
    queryKey: ["time-entries"],
    queryFn: async () => {
      const res = await apiFetch<{ items: TimeEntryApi[] }>("/api/time-entries");
      return res.items.map(normalizeEntry);
    },
  });

  const timeEntries = entriesQuery.data ?? [];

  useEffect(() => {
    if (entriesQuery.isLoading || entriesQuery.isError) return;
    const lastEmployee = sessionStorage.getItem(LAST_TIME_TRACKING_EMPLOYEE_KEY);
    if (!lastEmployee) return;
    sessionStorage.removeItem(LAST_TIME_TRACKING_EMPLOYEE_KEY);

    const el = document.querySelector<HTMLTableRowElement>(
      `tr[data-employee="${CSS.escape(lastEmployee)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [entriesQuery.isLoading, entriesQuery.isError, timeEntries.length]);

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;

    const match = timeEntries.find((e) => String(e.id) === viewId);
    if (!match) return;

    const employee = String(match.employee || "").trim();
    if (!employee) return;

    navigate(`history/${encodeURIComponent(employee)}`);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [timeEntries, searchParams, setSearchParams, navigate]);

  const filteredEntries = useMemo(() => {
    return timeEntries.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      if (a.clockIn !== b.clockIn) return a.clockIn < b.clockIn ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });
  }, [timeEntries]);

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.totalHours, 0);
  const avgHours = (totalHours / filteredEntries.length || 0).toFixed(1);

  return (
    <div className="ml-12 pl-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Time Tracking</h1>
          <p className="page-subtitle">Monitor employee work hours and attendance</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hours Today"
          value={`${totalHours.toFixed(1)}h`}
          icon={Clock}
          variant="blue"
        />
        <StatCard
          title="Average Hours"
          value={`${avgHours}h`}
          icon={Clock}
          variant="green"
        />
        <StatCard
          title="Incomplete"
          value={timeEntries.filter((e) => e.status === "incomplete").length}
          icon={Clock}
          variant="orange"
        />
        <StatCard
          title="Overtime"
          value={timeEntries.filter((e) => e.status === "overtime").length}
          icon={Clock}
          variant="gold"
        />
      </div>

      {/* Time Entries Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {entriesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading time entries...</div>
        ) : entriesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">
            {entriesQuery.error instanceof Error
              ? entriesQuery.error.message
              : "Failed to load time entries"}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[900px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock In</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock Out</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Break</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className="animate-fade-in hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                  role="button"
                  tabIndex={0}
                  data-employee={entry.employee}
                  onClick={() => {
                    sessionStorage.setItem(LAST_TIME_TRACKING_EMPLOYEE_KEY, entry.employee);
                    navigate(`history/${encodeURIComponent(entry.employee)}`);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      sessionStorage.setItem(LAST_TIME_TRACKING_EMPLOYEE_KEY, entry.employee);
                      navigate(`history/${encodeURIComponent(entry.employee)}`);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium border border-primary/20">
                        {entry.avatar}
                      </div>
                      <span className="font-medium text-foreground">
                        {entry.employee}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {formatClockTime(entry.clockIn)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {formatClockTime(entry.clockOut)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground whitespace-nowrap">{entry.breakTime}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-semibold whitespace-nowrap",
                        entry.totalHours >= 8 ? "text-success" : "text-warning"
                      )}
                    >
                      {entry.totalHours}h
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-1.5 py-0 h-5 leading-none capitalize whitespace-nowrap", statusStyles[entry.status])}
                    >
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground whitespace-nowrap">{entry.location}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
