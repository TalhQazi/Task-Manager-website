import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/manger/ui/badge";
import { Button } from "@/components/manger/ui/button";
import { apiFetch } from "@/lib/manger/api";
import { ArrowLeft } from "lucide-react";

type Location = {
  id: string;
  name: string;
};

type TimeEntry = {
  id: string;
  employee: string;
  location: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
};

type TimeEntryApi = {
  _id: string;
  employee?: string;
  location?: string;
  date?: string;
  clockIn?: string;
  clockOut?: string;
  status?: string;
};

function normalizeEntry(e: TimeEntryApi): TimeEntry {
  return {
    id: e._id,
    employee: String(e.employee || "").trim(),
    location: String(e.location === "-" ? "" : (e.location || "")),
    date: String(e.date || ""),
    clockIn: String(e.clockIn || ""),
    clockOut: String(e.clockOut || ""),
    status: String(e.status || ""),
  };
}

function formatEntryDate(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  if (m) return m[0];
  const d = new Date(raw);
  if (Number.isFinite(d.getTime())) return d.toISOString().slice(0, 10);
  return raw;
}

function formatClockTime(value: string) {
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

export default function EmployeeTimeHistory() {
  const { employee } = useParams();
  const employeeName = String(employee || "").trim();
  const navigate = useNavigate();

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: Location[] } | Location[]>("/api/locations");
      const items = Array.isArray(res) ? res : Array.isArray(res.items) ? res.items : [];
      return items.filter((l) => Boolean(l.id));
    },
  });

  const locations = locationsQuery.data ?? [];

  const resolveLocationName = (value: string) => {
    const key = String(value || "").trim();
    if (!key) return "—";
    const match = locations.find((l) => String(l.id) === key);
    return match?.name || key;
  };

  const historyQuery = useQuery({
    queryKey: ["time-entries", "history", employeeName],
    enabled: Boolean(employeeName),
    queryFn: async () => {
      const res = await apiFetch<{ items: TimeEntryApi[] }>(
        `/api/time-entries?employee=${encodeURIComponent(employeeName)}`,
      );
      return (res.items || []).map(normalizeEntry);
    },
  });

  const rows = historyQuery.data ?? [];

  const title = useMemo(() => {
    return employeeName ? `${employeeName} - History` : "History";
  }, [employeeName]);

  return (
    <div className="pl-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="page-header mb-0">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Check-in / check-out history</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        {historyQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading history...</div>
        ) : historyQuery.isError ? (
          <div className="text-sm text-destructive">
            {historyQuery.error instanceof Error
              ? historyQuery.error.message
              : "Failed to load history"}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[900px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="animate-fade-in" style={{ animationDelay: `${idx * 15}ms` }}>
                    <td>
                      <span className="text-muted-foreground whitespace-nowrap">{formatEntryDate(r.date)}</span>
                    </td>
                    <td>
                      <span className="font-medium text-foreground whitespace-nowrap">{formatClockTime(r.clockIn)}</span>
                    </td>
                    <td>
                      <span className="font-medium text-foreground whitespace-nowrap">{formatClockTime(r.clockOut)}</span>
                    </td>
                    <td>
                      <span className="text-muted-foreground whitespace-nowrap">{resolveLocationName(r.location)}</span>
                    </td>
                    <td>
                      <Badge variant="secondary" className="text-xs capitalize whitespace-nowrap">
                        {r.status || "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
