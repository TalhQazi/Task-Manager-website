import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "away" | "offline";
  location: string;
  clockedIn: string;
}

type EmployeeApi = {
  _id?: string;
  id?: string;
  name?: string;
  role?: string;
  status?: string;
  location?: string;
};

type TimeEntryApi = {
  _id?: string;
  id?: string;
  employee?: string;
  clockIn?: string;
  clockOut?: string;
  status?: string;
  location?: string;
  date?: string | Date;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "?" : "";
  return (first + last).toUpperCase();
}

function isToday(d: Date) {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const statusColors = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted-foreground",
};

export function EmployeeActivity() {
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiFetch<{ items: EmployeeApi[] }>("/api/employees");
      return Array.isArray(res?.items) ? res.items : [];
    },
  });

  const entriesQuery = useQuery({
    queryKey: ["time-entries"],
    queryFn: async () => {
      const res = await apiFetch<{ items: TimeEntryApi[] }>("/api/time-entries");
      return Array.isArray(res?.items) ? res.items : [];
    },
  });

  const employeesApi = employeesQuery.data || [];
  const entriesApi = entriesQuery.data || [];

  const clockedInToday = entriesApi
    .filter((e) => {
      const d = e.date ? new Date(e.date as any) : null;
      const okDate = d instanceof Date && !Number.isNaN(d.getTime()) ? isToday(d) : true;
      const status = String(e.status || "").toLowerCase();
      const clockOut = String(e.clockOut || "").trim();
      return okDate && (status === "incomplete" || clockOut === "");
    })
    .slice(0, 4);

  const employees: Employee[] = clockedInToday.map((entry, idx) => {
    const name = String(entry.employee || "Unknown");
    const emp = employeesApi.find((x) => String(x.name || "") === name);
    const empStatus = String(emp?.status || "").toLowerCase();
    const status: Employee["status"] = empStatus === "on-leave" ? "away" : empStatus === "inactive" ? "offline" : "online";

    return {
      id: String(entry.id || entry._id || emp?.id || emp?._id || idx),
      name,
      role: String(emp?.role || ""),
      avatar: initialsFromName(name),
      status,
      location: String(entry.location || emp?.location || ""),
      clockedIn: String(entry.clockIn || ""),
    };
  });

  const onlineCount = employees.filter((e) => e.status === "online").length;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground text-base sm:text-lg">Active Employees</h3>
        <Badge variant="secondary" className="bg-success/10 text-success">
          {onlineCount} Online
        </Badge>
      </div>
      <div className="divide-y divide-border">
        {employees.map((employee, index) => (
          <div
            key={employee.id}
            className="px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                  {employee.avatar}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                    statusColors[employee.status]
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {employee.name}
                </p>
                <p className="text-sm text-muted-foreground">{employee.role}</p>
              </div>
              <div className="w-full sm:w-auto sm:text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground sm:justify-end">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate sm:whitespace-nowrap">{employee.location}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                  Clocked in at {employee.clockedIn}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
