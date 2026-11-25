import { ListOrdered, FolderKanban, Clock, Sparkles, Plus } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { cn } from "@/lib/utils";
import type { NextAssignmentInfo } from "@/lib/employeeLiveApi";

interface NextAssignmentPanelProps {
  nextAssignment: NextAssignmentInfo | null;
  queuedAssignments?: Array<{
    id: string;
    taskTitle: string;
    projectName: string;
    priority: string;
    status: string;
    queuePosition: number;
    expectedActiveSeconds: number;
    progressPercent: number;
  }>;
  onNewAssignment?: () => void;
}

export function NextAssignmentPanel({
  nextAssignment,
  queuedAssignments = [],
  onNewAssignment,
}: NextAssignmentPanelProps) {
  const formattedNextStart = nextAssignment?.estimatedNextStartAt
    ? new Date(nextAssignment.estimatedNextStartAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="bg-card/70 border rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Next Queued Assignment</h3>
            <p className="text-xs text-muted-foreground">Up next in workforce sequence</p>
          </div>
        </div>

        {onNewAssignment && (
          <Button variant="outline" size="sm" onClick={onNewAssignment} className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            Queue Task
          </Button>
        )}
      </div>

      {nextAssignment ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px] font-mono px-2 py-0">
                    Queue #{nextAssignment.queuePosition}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] uppercase font-semibold">
                    {nextAssignment.priority} Priority
                  </Badge>
                </div>
                <h4 className="text-base font-semibold text-foreground pt-1">
                  {nextAssignment.taskTitle}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                  <span>{nextAssignment.projectName}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  Est. Next Start:{" "}
                  <strong className="text-foreground">
                    {formattedNextStart || "When current task finishes"}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] font-mono uppercase bg-background px-2 py-0.5 rounded border">
                Status: {nextAssignment.status}
              </span>
            </div>
          </div>

          {/* Additional queue items if any */}
          {queuedAssignments.length > 1 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Additional Queued Work ({queuedAssignments.length - 1})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {queuedAssignments
                  .filter((a) => a.id !== nextAssignment.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="truncate max-w-[240px]">
                        <span className="font-medium text-foreground">{item.taskTitle}</span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {item.projectName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-1.5 bg-muted/20 rounded-xl border border-dashed border-border/60">
          <Sparkles className="h-6 w-6 text-muted-foreground/60 mx-auto" />
          <p className="text-xs font-semibold text-foreground">No Queued Work</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            There are currently no additional assignments queued for this employee.
          </p>
        </div>
      )}
    </div>
  );
}
