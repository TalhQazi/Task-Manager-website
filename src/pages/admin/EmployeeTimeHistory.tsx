import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch } from "@/lib/admin/apiClient";

type TimeEntry = {
  id: string;
  employee: string;
  location: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  totalHours: number | null;
  status: string;
};

type TimeEntryApi = {
  id?: string;
  _id?: string;
  employee?: string;
  location?: string;
  date?: string;
  clockIn?: string;
  clockOut?: string | null;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  totalHours?: number | null;
  status?: string;
};

function formatEntryDate(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  const dateStr = m ? `${m[0]}T00:00:00` : raw;
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatClockTime(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  // Try parsing as ISO timestamp first
  const d = new Date(raw);
  if (Number.isFinite(d.getTime())) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  // Try HH:MM format
  const hhmm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (hhmm) {
    const hour = Number(hhmm[1]);
    const minute = hhmm[2];
    if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(h12).padStart(2, "0")}:${minute} ${ampm}`;
    }
  }
  return raw;
}

function calcDurationMinutes(entry: TimeEntry): number | null {
  // Prefer ISO timestamps for accuracy
  if (entry.clockInAt && entry.clockOutAt) {
    const inAt = new Date(entry.clockInAt);
    const outAt = new Date(entry.clockOutAt);
    if (Number.isFinite(inAt.getTime()) && Number.isFinite(outAt.getTime())) {
      const diff = Math.floor((outAt.getTime() - inAt.getTime()) / 60000);
      return diff > 0 ? diff : 0;
    }
  }
  // Fallback to totalHours decimal field
  if (entry.totalHours != null && entry.totalHours > 0) {
    return Math.round(entry.totalHours * 60);
  }
  return null;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${String(min).padStart(2, "0")}m`;
}

const statusColors: Record<string, string> = {
  complete: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  "clocked-out": "bg-green-100 text-green-700",
  incomplete: "bg-blue-100 text-blue-700",
  "clocked-in": "bg-blue-100 text-blue-700",
  overtime: "bg-amber-100 text-amber-700",
  "on-break": "bg-amber-100 text-amber-700",
};

const statusLabels: Record<string, string> = {
  complete: "Complete",
  completed: "Complete",
  "clocked-out": "Clocked Out",
  incomplete: "In Progress",
  "clocked-in": "Clocked In",
  overtime: "Overtime",
  "on-break": "On Break",
};

function normalizeTimeEntry(e: TimeEntryApi): TimeEntry {
  return {
    id: String((e as any).id || e._id || ""),
    employee: String(e.employee || "").trim(),
    location: String(e.location || ""),
    date: String(e.date || ""),
    clockIn: String(e.clockIn || ""),
    clockOut: e.clockOut === null ? null : String(e.clockOut || "") || null,
    clockInAt: e.clockInAt ? String(e.clockInAt) : null,
    clockOutAt: e.clockOutAt ? String(e.clockOutAt) : null,
    totalHours: e.totalHours ?? null,
    status: String(e.status || ""),
  };
}

export default function EmployeeTimeHistory() {
  const { employee } = useParams();
  const employeeName = String(employee || "").trim();

  const historyQuery = useQuery({
    queryKey: ["time-entries", "history", employeeName],
    enabled: Boolean(employeeName),
    queryFn: async () => {
      const res = await apiFetch<{ items: TimeEntryApi[] }>(
        `/api/time-entries?employee=${encodeURIComponent(employeeName)}`,
      );
      return (res.items || []).map(normalizeTimeEntry);
    },
  });

  const rows = historyQuery.data ?? [];

  const totalMinutes = useMemo(() => {
    return rows.reduce((acc, r) => {
      const mins = calcDurationMinutes(r);
      return acc + (mins ?? 0);
    }, 0);
  }, [rows]);

  const title = useMemo(() => {
    return employeeName ? `${employeeName} - History` : "History";
  }, [employeeName]);

  return (
    <>
      <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Check-in / check-out history
          </p>
        </div>

        {rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="shadow-soft border-0 sm:border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Shifts</p>
                <p className="text-2xl font-bold">{rows.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-0 sm:border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-0 sm:border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Completed Shifts</p>
                <p className="text-2xl font-bold">
                  {rows.filter((r) => r.status === "complete" || r.status === "completed" || r.status === "clocked-out").length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
              Entries ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
            {historyQuery.isLoading ? (
              <p className="text-xs sm:text-sm text-muted-foreground">Loading history...</p>
            ) : historyQuery.isError ? (
              <p className="text-xs sm:text-sm text-destructive">
                {historyQuery.error instanceof Error
                  ? historyQuery.error.message
                  : "Failed to load history"}
              </p>
            ) : rows.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">No history found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Clock In</th>
                      <th className="py-2 pr-4 font-medium">Clock Out</th>
                      <th className="py-2 pr-4 font-medium">Total Time</th>
                      <th className="py-2 pr-4 font-medium">Location</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const dur = calcDurationMinutes(r);
                      return (
                        <tr key={r.id} className="border-t hover:bg-muted/30">
                          <td className="py-3 pr-4 text-sm font-medium">{formatEntryDate(r.date)}</td>
                          <td className="py-3 pr-4 text-sm text-success font-medium">
                            {formatClockTime(r.clockInAt || r.clockIn)}
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted-foreground">
                            {r.clockOutAt || r.clockOut
                              ? formatClockTime(r.clockOutAt || r.clockOut)
                              : <span className="text-warning text-xs">In progress</span>}
                          </td>
                          <td className="py-3 pr-4 text-sm font-semibold">
                            {dur !== null ? (
                              <span className="bg-accent/10 border border-accent/20 rounded px-2 py-0.5 text-xs">
                                {formatDuration(dur)}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted-foreground">{r.location || "—"}</td>
                          <td className="py-3 text-sm">
                            <Badge
                              variant="secondary"
                              className={`text-xs capitalize ${statusColors[r.status] ?? "bg-gray-100 text-gray-700"}`}
                            >
                              {statusLabels[r.status] ?? r.status || "—"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-3 pr-4 text-sm">Total ({rows.length} shifts)</td>
                      <td colSpan={2} />
                      <td className="py-3 pr-4 text-sm">
                        <span className="bg-primary/10 border border-primary/20 rounded px-2 py-0.5 text-xs text-primary font-bold">
                          {formatDuration(totalMinutes)}
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
