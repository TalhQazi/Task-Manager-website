import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
} from "lucide-react";
import { getTeamTimeEntries } from "@/lib/manger/api";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  userId: string;
  employee: string;
  avatar: string;
  date: string;
  clockIn: string;
  clockOut: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  breakTime: string;
  totalHours: number;
  status: string;
  location: string;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "?" : "";
  return (first + last).toUpperCase();
}

function formatClockTime(value: string | null | undefined): string {
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

function formatDate(dateStr: string) {
  const raw = String(dateStr || "").trim();
  if (!raw) return "—";
  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  const localStr = m ? `${m[0]}T00:00:00` : raw;
  const d = new Date(localStr);
  if (!Number.isFinite(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const statusConfig = {
  complete: {
    label: "Complete",
    class: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  completed: {
    label: "Complete",
    class: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  incomplete: {
    label: "In Progress",
    class: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  active: {
    label: "In Progress",
    class: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  overtime: {
    label: "Overtime",
    class: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
  },
};

export default function TeamAttendance() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getTeamTimeEntries({ date: dateFilter });
      setEntries(res.items || []);
    } catch (err) {
      console.error("Failed to load time entries:", err);
      toast.error("Failed to load team attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) =>
    entry.employee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: entries.length,
    clockedIn: entries.filter((e) => e.status === "incomplete" || e.status === "active").length,
    complete: entries.filter((e) => e.status === "complete" || e.status === "completed").length,
    totalHours: entries.reduce((sum, e) => sum + (e.totalHours || 0), 0),
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 max-w-[2000px] mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading team attendance...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 max-w-[2000px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Team Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor shift compliance and team attendance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Employees</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currently Working</p>
                <p className="text-xl font-bold">{stats.clockedIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Shifts</p>
                <p className="text-xl font-bold">{stats.complete}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">{stats.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                type="date"
                className="h-9 sm:h-10 text-sm sm:text-base"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setDateFilter(today)}>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Log
            <Badge variant="outline" className="ml-2">
              {filteredEntries.length} entries
            </Badge>
          </CardTitle>
          <CardDescription>
            {formatDate(dateFilter)} - Shift compliance and time tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No attendance records</p>
              <p className="text-sm mt-1">No employees have clocked in for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Employee</TableHead>
                    <TableHead className="text-xs md:text-sm">Date</TableHead>
                    <TableHead className="text-xs md:text-sm">Clock In</TableHead>
                    <TableHead className="text-xs md:text-sm">Clock Out</TableHead>
                    <TableHead className="text-xs md:text-sm">Break</TableHead>
                    <TableHead className="text-xs md:text-sm">Total Hours</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                    <TableHead className="text-xs md:text-sm">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const status = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.incomplete;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm md:text-base">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                              {entry.avatar || initialsFromName(entry.employee)}
                            </div>
                            <span className="font-medium">{entry.employee}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="text-sm md:text-base">
                          {formatClockTime(entry.clockIn)}
                        </TableCell>
                        <TableCell className="text-sm md:text-base">
                          {entry.clockOut ? formatClockTime(entry.clockOut) : (
                            <span className="text-warning flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              In Progress
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {entry.breakTime || "—"}
                        </TableCell>
                        <TableCell className="text-sm md:text-base font-medium">
                          {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.class} text-xs border`} variant="secondary">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{entry.location || "—"}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
