import { useEffect, useMemo } from "react";
import { Button } from "@/components/manger/ui/button";
import { Badge } from "@/components/manger/ui/badge";
import { Download, Clock, Calendar } from "lucide-react";
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
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title text-xl sm:text-2xl md:text-3xl lg:text-4xl">Time Tracking</h1>
          <p className="page-subtitle text-xs sm:text-sm md:text-base mt-1">Monitor employee work hours and attendance</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Report</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card border-0 sm:border shadow-none sm:shadow">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Hours Today</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {totalHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card border-0 sm:border shadow-none sm:shadow">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-success/10 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Average Hours</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{avgHours}h</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-0 sm:border shadow-none sm:shadow">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-warning/10 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Incomplete</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {timeEntries.filter((e) => e.status === "incomplete").length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card border-0 sm:border shadow-none sm:shadow">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-info/10 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Overtime</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {timeEntries.filter((e) => e.status === "overtime").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden border-0 sm:border shadow-none sm:shadow">
        {entriesQuery.isLoading ? (
          <div className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-muted-foreground">Loading time entries...</div>
        ) : entriesQuery.isError ? (
          <div className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-destructive">
            {entriesQuery.error instanceof Error
              ? entriesQuery.error.message
              : "Failed to load time entries"}
          </div>
        ) : null}
        <div className="px-3 sm:px-0">
          <div className="rounded-lg border overflow-x-auto w-full">
            <table className="data-table w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Employee</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Date</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Clock In</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Clock Out</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium hidden sm:table-cell">Break</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Hours</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium">Status</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium hidden md:table-cell">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="animate-fade-in border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
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
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                          {entry.avatar}
                        </div>
                        <span className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                          {entry.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <span className="font-medium text-foreground whitespace-nowrap text-xs sm:text-sm">
                        {formatClockTime(entry.clockIn)}
                      </span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <span className="font-medium text-foreground whitespace-nowrap text-xs sm:text-sm">
                        {formatClockTime(entry.clockOut)}
                      </span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">
                      <span className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm">{entry.breakTime}</span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <span
                        className={cn(
                          "font-semibold whitespace-nowrap text-xs sm:text-sm",
                          entry.totalHours >= 8 ? "text-success" : "text-warning"
                        )}
                      >
                        {entry.totalHours}h
                      </span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] sm:text-xs capitalize whitespace-nowrap", statusStyles[entry.status])}
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 hidden md:table-cell">
                      <span className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm">{entry.location}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
