import { useState } from "react";
import { 
  History, 
  Play, 
  Pause, 
  Coffee, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRightLeft, 
  FileText, 
  UserPlus, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { useEmployeeActivityTimeline } from "@/hooks/useEmployeeLive";
import { cn } from "@/lib/utils";
import type { ActivityTimelineEvent } from "@/lib/employeeLiveApi";

interface ActivityTimelineProps {
  employeeId: string;
  initialEvents?: ActivityTimelineEvent[];
}

export function ActivityTimeline({ employeeId, initialEvents = [] }: ActivityTimelineProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useEmployeeActivityTimeline(employeeId, page, 15);

  const events = data?.items || initialEvents;
  const pagination = data?.pagination;

  const getEventConfig = (type: string) => {
    switch (type) {
      case "work_started":
        return {
          icon: Play,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          title: "Work Started",
        };
      case "work_paused":
        return {
          icon: Pause,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          title: "Work Paused",
        };
      case "work_resumed":
        return {
          icon: Play,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          title: "Work Resumed",
        };
      case "work_blocked":
        return {
          icon: AlertOctagon,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          title: "Work Blocked",
        };
      case "work_unblocked":
        return {
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          title: "Blocker Cleared",
        };
      case "employee_break":
        return {
          icon: Coffee,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          title: "Break Started",
        };
      case "project_switched":
        return {
          icon: ArrowRightLeft,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          title: "Assignment Switched",
        };
      case "progress_updated":
        return {
          icon: TrendingUp,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          title: "Progress Updated",
        };
      case "eta_changed":
        return {
          icon: Clock,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          title: "Estimate / ETA Changed",
        };
      case "assignment_completed":
        return {
          icon: CheckCircle2,
          color: "text-green-600 bg-green-500/10 border-green-500/20",
          title: "Assignment Completed",
        };
      case "assignment_created":
        return {
          icon: PlusCircle,
          color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
          title: "Assignment Created",
        };
      default:
        return {
          icon: FileText,
          color: "text-muted-foreground bg-muted border-border",
          title: type.replace(/_/g, " "),
        };
    }
  };

  return (
    <div className="bg-card/70 border rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Activity Timeline</h3>
            <p className="text-xs text-muted-foreground">Immutable operational audit trail</p>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4 pt-1">
        {events.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
            {events.map((ev) => {
              const cfg = getEventConfig(ev.eventType);
              const Icon = cfg.icon;

              const formattedTime = ev.timestamp
                ? new Date(ev.timestamp).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "";

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline bullet icon */}
                  <div
                    className={cn(
                      "absolute -left-6 top-1 h-5 w-5 rounded-full border flex items-center justify-center shadow-xs",
                      cfg.color
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                  </div>

                  <div className="bg-muted/20 border border-border/40 rounded-xl p-3 space-y-1 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {cfg.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formattedTime}
                      </span>
                    </div>

                    {ev.note && (
                      <p className="text-xs text-muted-foreground">{ev.note}</p>
                    )}

                    {ev.reason && ev.reason !== ev.note && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Reason: {ev.reason}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground/80">
                      <span>Actor: <strong className="text-foreground">{ev.actorName || "User"}</strong> ({ev.actorRole || "employee"})</span>
                      {ev.newState && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-mono">
                          {ev.previousState ? `${ev.previousState} → ${ev.newState}` : ev.newState}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No activity events recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
