import { Clock, ShieldAlert, Pause, CheckCircle2, MapPin, Building, Briefcase } from "lucide-react";
import { formatDuration } from "./WorkTimer";
import type { EmployeeInfo } from "@/lib/employeeLiveApi";

interface AdditionalDetailsPanelProps {
  employee: EmployeeInfo;
  metricsToday?: {
    totalActiveSeconds: number;
    totalBlockedSeconds: number;
    totalPausedSeconds: number;
    completedAssignmentsCount: number;
  };
  queuedCount?: number;
}

export function AdditionalDetailsPanel({
  employee,
  metricsToday = {
    totalActiveSeconds: 0,
    totalBlockedSeconds: 0,
    totalPausedSeconds: 0,
    completedAssignmentsCount: 0,
  },
  queuedCount = 0,
}: AdditionalDetailsPanelProps) {
  return (
    <div className="bg-card/70 border rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-4">
      <div className="border-b pb-3.5">
        <h3 className="text-base font-bold text-foreground">Operational Intelligence</h3>
        <p className="text-xs text-muted-foreground">Workforce time accounting and daily metrics</p>
      </div>

      {/* Today's Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-emerald-500" />
            Active Today
          </span>
          <p className="text-lg font-bold font-mono text-foreground">
            {formatDuration(metricsToday.totalActiveSeconds)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-rose-500" />
            Blocked Today
          </span>
          <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatDuration(metricsToday.totalBlockedSeconds)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Pause className="h-3 w-3 text-amber-500" />
            Paused Today
          </span>
          <p className="text-lg font-bold font-mono text-foreground">
            {formatDuration(metricsToday.totalPausedSeconds)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            Tasks Done Today
          </span>
          <p className="text-lg font-bold font-mono text-foreground">
            {metricsToday.completedAssignmentsCount}
          </p>
        </div>
      </div>

      {/* Assignment Queue & Location Information */}
      <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Current Workload
          </span>
          <span className="font-semibold text-foreground">
            {queuedCount > 0 ? `${queuedCount} tasks in queue` : "1 active task"}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            Department / Team
          </span>
          <span className="font-semibold text-foreground">
            {employee.department || "Operations"}
          </span>
        </div>

        {employee.location && (
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Work Location
            </span>
            <span className="font-semibold text-foreground">{employee.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
