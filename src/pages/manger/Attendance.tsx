import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/manger/ui/card";
import { Button } from "@/components/manger/ui/button";
import { Badge } from "@/components/manger/ui/badge";
import { Input } from "@/components/manger/ui/input";
import { Textarea } from "@/components/manger/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/manger/ui/table";
import { listAttendanceEvents, reviewAttendanceEvent, toProxiedUrl } from "@/lib/manger/api";
import { toast } from "sonner";
import { Clock, Calendar, AlertCircle } from "lucide-react";

type AttendanceStatus = "open" | "reviewed" | "archived";

type AttendanceEventItem = {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  type: string;
  level?: number;
  date: string;
  status: AttendanceStatus;
  minutesLate?: number;
  reasonCode?: string;
  reasonText?: string;
  deviceInfo?: string;
  ipAddress?: string;
  explanation?: {
    reason?: string;
    comments?: string;
    submittedAt?: string;
  };
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  managerNotes?: string;
  createdAt?: string;
  reviewedAt?: string;
};

function statusBadgeVariant(status: AttendanceStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "open") return "destructive";
  if (status === "reviewed") return "secondary";
  return "outline";
}

function typeLabel(type: string) {
  if (type === "late_arrival") return "Late Arrival";
  if (type === "call_out") return "Call Out";
  if (type === "missed_clock_in") return "Missed Clock-In";
  if (type === "late_call_out") return "Late Call-Out";
  return type;
}

export default function Attendance() {
  const [items, setItems] = useState<AttendanceEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterStatus, setFilterStatus] = useState<"" | AttendanceStatus>("");
  const [filterType, setFilterType] = useState("");
  const [filterEmployeeName, setFilterEmployeeName] = useState("");

  const [selected, setSelected] = useState<AttendanceEventItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<AttendanceStatus>("reviewed");
  const [managerNotes, setManagerNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const totals = useMemo(() => {
    const open = items.filter((x) => x.status === "open").length;
    const reviewed = items.filter((x) => x.status === "reviewed").length;
    const archived = items.filter((x) => x.status === "archived").length;
    return { open, reviewed, archived, total: items.length };
  }, [items]);

  const load = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await listAttendanceEvents({
        status: (filterStatus || undefined) as string | undefined,
        type: filterType || undefined,
        employeeName: filterEmployeeName || undefined,
      });
      setItems((res.items || []) as AttendanceEventItem[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load attendance events");
    } finally {
      if (opts?.silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType, filterEmployeeName]);

  const openReview = (ev: AttendanceEventItem) => {
    setSelected(ev);
    setReviewStatus(ev.status || "reviewed");
    setManagerNotes(ev.managerNotes || "");
  };

  const saveReview = async () => {
    if (!selected) return;
    setSavingReview(true);
    try {
      await reviewAttendanceEvent(selected.id, {
        status: reviewStatus,
        managerNotes,
      });
      toast.success("Saved");
      setSelected(null);
      await load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save review");
    } finally {
      setSavingReview(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "employeeName",
      "type",
      "level",
      "date",
      "status",
      "minutesLate",
      "reasonCode",
      "reasonText",
      "explanationReason",
      "explanationComments",
      "managerNotes",
      "deviceInfo",
      "ipAddress",
      "createdAt",
      "reviewedAt",
    ];

    const esc = (v: unknown) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = items.map((x) => [
      x.id,
      x.employeeName,
      x.type,
      x.level ?? "",
      x.date,
      x.status,
      x.minutesLate ?? "",
      x.reasonCode ?? "",
      x.reasonText ?? "",
      x.explanation?.reason ?? "",
      x.explanation?.comments ?? "",
      x.managerNotes ?? "",
      x.deviceInfo ?? "web",
      x.ipAddress ?? "",
      x.createdAt ?? "",
      x.reviewedAt ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-events-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Dashboard</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Dashboard</CardTitle>
          <CardDescription>Review call-outs, late arrivals, and system flags.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "" | AttendanceStatus)}
                  aria-label="Filter status"
                >
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Type</div>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  aria-label="Filter type"
                >
                  <option value="">All</option>
                  <option value="late_arrival">Late Arrival</option>
                  <option value="call_out">Call Out</option>
                  <option value="missed_clock_in">Missed Clock-In</option>
                  <option value="late_call_out">Late Call-Out</option>
                </select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Employee</div>
                <Input
                  value={filterEmployeeName}
                  onChange={(e) => setFilterEmployeeName(e.target.value)}
                  placeholder="Search name..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void load({ silent: true })} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button onClick={exportCsv} disabled={items.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Badge variant="destructive">Open: {totals.open}</Badge>
            <Badge variant="secondary">Reviewed: {totals.reviewed}</Badge>
            <Badge variant="outline">Archived: {totals.archived}</Badge>
            <Badge variant="default">Total: {totals.total}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions</CardTitle>
          <CardDescription>Most recent 500 events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Device/IP</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium">{ev.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{typeLabel(ev.type)}</span>
                        {typeof ev.level === "number" ? <Badge variant="outline">L{ev.level}</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(ev.status)}>{ev.status}</Badge>
                    </TableCell>
                    <TableCell>{String(ev.date || "").slice(0, 10)}</TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {ev.deviceInfo || "web"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ev.ipAddress || "--"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ev.type === "late_arrival" ? (
                        <div className="text-sm text-muted-foreground">{ev.minutesLate ?? ""} min late</div>
                      ) : null}
                      {ev.reasonText ? (
                        <div className="text-sm text-muted-foreground truncate max-w-[380px]">{ev.reasonText}</div>
                      ) : null}
                      {ev.explanation?.reason ? <div className="text-sm">Explanation: {ev.explanation.reason}</div> : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openReview(ev)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Attendance Event</DialogTitle>
            <DialogDescription>Update status and add manager notes.</DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Employee</div>
                  <div className="font-medium">{selected.employeeName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div className="font-medium">{typeLabel(selected.type)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as AttendanceStatus)}
                    aria-label="Review status"
                  >
                    <option value="open">Open</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="font-medium">{String(selected.date || "").slice(0, 10)}</div>
                </div>
              </div>

              {Array.isArray(selected.attachments) && selected.attachments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selected.attachments.map((a, idx) => (
                      <div key={`${a.url}-${idx}`} className="flex items-center justify-between gap-2">
                        <div className="text-sm truncate">{a.fileName}</div>
                        <a
                          className="text-sm underline"
                          href={toProxiedUrl(a.url) || a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <div>
                <div className="text-sm font-medium mb-2">Manager Notes</div>
                <Textarea value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} placeholder="Add notes..." />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={savingReview}>
              Cancel
            </Button>
            <Button onClick={() => void saveReview()} disabled={savingReview || !selected}>
              {savingReview ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
