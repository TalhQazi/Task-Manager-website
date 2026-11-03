import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  Info,
  PauseCircle
} from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Progress } from "@/components/admin/ui/progress";
import { WorkTimer, formatDuration, formatOverrun } from "./WorkTimer";
import { HealthIndicator } from "./HealthIndicator";
import { cn } from "@/lib/utils";
import type { CurrentAssignmentMetrics } from "@/lib/employeeLiveApi";

interface CurrentAssignmentPanelProps {
  assignment: CurrentAssignmentMetrics | null;
  serverTime?: string | Date;
}

export function CurrentAssignmentPanel({ assignment, serverTime }: CurrentAssignmentPanelProps) {
  if (!assignment) {
    return (
      <div className="bg-card/70 border rounded-2xl p-6 backdrop-blur-md shadow-sm text-center py-12 space-y-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Current Assignment</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          This employee currently has no active, paused, or blocked project assignments. They are available for work.
        </p>
      </div>
    );
  }

  const priorityColors = {
    critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
  };

  const formattedStartedAt = assignment.startedAt
    ? new Date(assignment.startedAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not started";

  const formattedEta = assignment.expectedCompletionAt
    ? new Date(assignment.expectedCompletionAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="bg-card/70 border rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-5">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Current Assignment</h2>
            <p className="text-xs text-muted-foreground">Active work session & timer intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs font-semibold uppercase px-2.5 py-0.5", priorityColors[assignment.priority] || priorityColors.medium)}
          >
            {assignment.priority} Priority
          </Badge>
          <HealthIndicator
            health={assignment.health}
            overrunSeconds={assignment.overrunSeconds}
            isOverdue={assignment.isOverdue}
            size="md"
          />
        </div>
      </div>

      {/* Task & Project Identification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/40">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Current Task
          </span>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{assignment.taskTitle}</span>
          </h3>
          {assignment.subtaskTitle && (
            <p className="text-xs text-muted-foreground">
              Subtask: <strong className="text-foreground">{assignment.subtaskTitle}</strong>
            </p>
          )}
        </div>

        <div className="space-y-1 md:border-l md:pl-4 border-border/40">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5 text-primary" />
            Project Name
          </span>
          <p className="text-base font-semibold text-foreground">{assignment.projectName}</p>
          <p className="text-xs text-muted-foreground">
            Started: {formattedStartedAt}
          </p>
        </div>
      </div>

      {/* Primary Metrics: Big Live Timer + ETA Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Timer Box */}
        <div className="rounded-xl border p-4 bg-gradient-to-br from-emerald-500/10 via-background to-card/50 space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            Active Elapsed Time
          </span>
          <div className="pt-1">
            <WorkTimer
              initialSeconds={assignment.activeElapsedSeconds}
              isActive={assignment.isOpenActive}
              serverTime={serverTime}
              size="lg"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {assignment.isOpenActive ? "Clock is actively running" : "Clock paused / stopped"}
          </p>
        </div>

        {/* Expected Duration Box */}
        <div className="rounded-xl border p-4 bg-background/50 space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            Expected Duration
          </span>
          <div className="pt-1">
            <span className="text-2xl font-mono font-bold text-foreground">
              {assignment.expectedActiveSeconds > 0
                ? formatDuration(assignment.expectedActiveSeconds)
                : "No estimate"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {assignment.expectedActiveSeconds > 0
              ? `${Math.round(assignment.expectedActiveSeconds / 60)} minutes planned`
              : "No active target set"}
          </p>
        </div>

        {/* Remaining / Overrun Box */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-1",
            assignment.isOverdue
              ? "bg-rose-500/10 border-rose-500/30"
              : "bg-background/50"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            {assignment.isOverdue ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            )}
            {assignment.isOverdue ? "Overdue Overrun" : "Remaining Active Time"}
          </span>
          <div className="pt-1">
            <span
              className={cn(
                "text-2xl font-mono font-bold",
                assignment.isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              )}
            >
              {assignment.isOverdue
                ? formatOverrun(assignment.overrunSeconds)
                : assignment.expectedActiveSeconds > 0
                ? formatDuration(assignment.remainingActiveSeconds)
                : "None"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {assignment.isOverdue
              ? "Exceeded initial target"
              : assignment.expectedActiveSeconds > 0
              ? `${Math.ceil(assignment.remainingActiveSeconds / 60)}m left at current pace`
              : "Target undefined"}
          </p>
        </div>

        {/* Expected Completion Target Box */}
        <div className="rounded-xl border p-4 bg-background/50 space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-purple-500" />
            Expected Completion
          </span>
          <div className="pt-1">
            <span className="text-lg font-bold text-foreground truncate block">
              {formattedEta || "No estimate"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {formattedEta ? "Calculated local target" : "Awaiting estimate"}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            Work Completion Progress ({assignment.progressSource})
          </span>
          <span className="font-mono text-sm font-bold text-primary">
            {assignment.progressPercent}%
          </span>
        </div>
        <Progress value={assignment.progressPercent} className="h-2.5" />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Source: {assignment.progressSource}</span>
          <span>100% requires manager review or completion</span>
        </div>
      </div>

      {/* Reasons / Blockers Note Banner */}
      {assignment.blockedReason && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Work is currently blocked:</strong>
            <p className="mt-0.5">{assignment.blockedReason}</p>
          </div>
        </div>
      )}

      {assignment.pausedReason && !assignment.blockedReason && assignment.status === "PAUSED" && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          <PauseCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Work is paused:</strong>
            <p className="mt-0.5">{assignment.pausedReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
