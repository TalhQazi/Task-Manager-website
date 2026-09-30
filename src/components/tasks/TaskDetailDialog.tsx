import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Calendar, User, Flag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { TaskView, STATUS_COLUMNS, PRIORITY_META, updateTaskStatus } from "@/lib/taskViews";

/* Lightweight shared preview. Reuses the existing status API for quick changes
 * and deep-links to the full editor on the existing Tasks page — no duplication. */
export function TaskDetailDialog({ task, onClose }: { task: TaskView | null; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateTaskStatus(task!.id, status),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["task-dataset"] }); qc.invalidateQueries({ queryKey: ["task-analytics"] }); onClose(); },
    onError: () => toast.error("Failed to update status"),
  });

  if (!task) return null;
  const pri = PRIORITY_META[task.priority] || PRIORITY_META.low;

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.taskNumber ? <span className="text-muted-foreground">#{task.taskNumber}</span> : null}
            {task.title || "Untitled"}
          </DialogTitle>
          <DialogDescription>Quick preview — open the full editor for comments, attachments & history.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {task.description && <p className="text-muted-foreground whitespace-pre-wrap line-clamp-6">{task.description}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={pri.className}><Flag className="h-3 w-3 mr-1" />{pri.label}</Badge>
            <Badge variant="outline">{task.status}</Badge>
            {task.dueDate && (
              <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{new Date(task.dueDate).toLocaleDateString()}</Badge>
            )}
          </div>

          {task.assignees.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-4 w-4" /> {task.assignees.join(", ")}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Move to</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_COLUMNS.map((s) => (
                <button
                  key={s.key}
                  disabled={statusMutation.isPending || task.status === s.key}
                  onClick={() => statusMutation.mutate(s.key)}
                  className="px-2.5 py-1 rounded-md border text-xs disabled:opacity-40 hover:bg-muted transition-colors"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {task.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 font-semibold gap-1.5 text-xs"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate("in-progress")}
              >
                Mark Incomplete (Reopen)
              </Button>
            )}
          </div>
          <Button className="ml-auto gap-1.5" onClick={() => navigate(`/admin/tasks?view=${task.id}`)}>
            <ExternalLink className="h-4 w-4" /> Open full editor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
