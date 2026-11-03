import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { toast } from "sonner";
import {
  pauseAssignment,
  resumeAssignment,
  blockAssignment,
  unblockAssignment,
  updateAssignmentEstimate,
  updateAssignmentProgress,
  completeAssignment,
  createAssignment,
  type ProgressSourceType,
} from "@/lib/employeeLiveApi";

export type ManagerActionType =
  | "pause"
  | "resume"
  | "block"
  | "unblock"
  | "estimate"
  | "progress"
  | "complete"
  | "new_assignment";

interface ManagerActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ManagerActionType | null;
  employeeId?: string;
  employeeName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  currentProgress?: number;
  currentExpectedSeconds?: number;
  onSuccess?: () => void;
}

export function ManagerActionModal({
  open,
  onOpenChange,
  actionType,
  employeeId,
  employeeName = "Employee",
  assignmentId,
  assignmentTitle = "Current Assignment",
  currentProgress = 0,
  currentExpectedSeconds = 0,
  onSuccess,
}: ManagerActionModalProps) {
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [minutes, setMinutes] = useState(
    currentExpectedSeconds > 0 ? String(Math.round(currentExpectedSeconds / 60)) : "60"
  );
  const [completionDate, setCompletionDate] = useState("");
  const [progressVal, setProgressVal] = useState(String(currentProgress));
  const [progressSource, setProgressSource] = useState<ProgressSourceType>("MANUAL");

  // New assignment fields
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newExpectedMinutes, setNewExpectedMinutes] = useState("60");
  const [newNotes, setNewNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (actionType === "pause" && assignmentId) {
        await pauseAssignment(assignmentId, reason || "Paused by manager");
        toast.success(`Work paused for ${employeeName}`);
      } else if (actionType === "resume" && assignmentId) {
        await resumeAssignment(assignmentId);
        toast.success(`Work resumed for ${employeeName}`);
      } else if (actionType === "block" && assignmentId) {
        if (!reason.trim()) {
          toast.error("A blocker reason is strictly required");
          setLoading(false);
          return;
        }
        await blockAssignment(assignmentId, reason.trim());
        toast.warning(`Work marked as blocked for ${employeeName}`);
      } else if (actionType === "unblock" && assignmentId) {
        await unblockAssignment(assignmentId, { resumeWork: true, resolution });
        toast.success(`Blocker resolved and work resumed for ${employeeName}`);
      } else if (actionType === "estimate" && assignmentId) {
        const secs = Math.max(0, (parseInt(minutes, 10) || 0) * 60);
        await updateAssignmentEstimate(assignmentId, {
          expectedActiveSeconds: secs,
          expectedCompletionAt: completionDate ? new Date(completionDate) : undefined,
          reason,
        });
        toast.success("Assignment estimate updated");
      } else if (actionType === "progress" && assignmentId) {
        const p = Math.min(100, Math.max(0, parseInt(progressVal, 10) || 0));
        await updateAssignmentProgress(assignmentId, {
          progressPercent: p,
          progressSource,
          note: reason,
        });
        toast.success(`Progress set to ${p}% (${progressSource})`);
      } else if (actionType === "complete" && assignmentId) {
        await completeAssignment(assignmentId);
        toast.success(`Assignment marked complete for ${employeeName}`);
      } else if (actionType === "new_assignment" && employeeId) {
        if (!newTaskTitle.trim()) {
          toast.error("Task title is required");
          setLoading(false);
          return;
        }
        await createAssignment({
          employeeId,
          projectName: newProjectName.trim() || "General Project",
          taskTitle: newTaskTitle.trim(),
          priority: newPriority,
          expectedActiveSeconds: (parseInt(newExpectedMinutes, 10) || 60) * 60,
          notes: newNotes,
        });
        toast.success(`Assignment created for ${employeeName}`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<ManagerActionType, string> = {
    pause: `Pause Work — ${employeeName}`,
    resume: `Resume Work — ${employeeName}`,
    block: `Mark Work as Blocked — ${employeeName}`,
    unblock: `Resolve Blocker — ${employeeName}`,
    estimate: `Adjust Duration & ETA Estimate`,
    progress: `Update Assignment Progress`,
    complete: `Complete Assignment — ${assignmentTitle}`,
    new_assignment: `Assign New Task to ${employeeName}`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {actionType ? titles[actionType] : "Manager Action"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {assignmentTitle ? `Task: ${assignmentTitle}` : "Workforce management action"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {actionType === "pause" && (
            <div className="space-y-2">
              <Label htmlFor="pause-reason" className="text-xs">
                Pause Reason (Optional)
              </Label>
              <Input
                id="pause-reason"
                placeholder="e.g. Waiting for client response, lunch, meeting"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {actionType === "block" && (
            <div className="space-y-2">
              <Label htmlFor="block-reason" className="text-xs font-semibold text-destructive">
                Blocker Reason (Required) *
              </Label>
              <Input
                id="block-reason"
                placeholder="e.g. Missing API credentials, blocked on PR review"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="text-sm border-destructive/40 focus:border-destructive"
              />
              <p className="text-[11px] text-muted-foreground">
                Active project timer will freeze until this blocker is unblocked.
              </p>
            </div>
          )}

          {actionType === "unblock" && (
            <div className="space-y-2">
              <Label htmlFor="resolution" className="text-xs">
                Resolution Note (Optional)
              </Label>
              <Input
                id="resolution"
                placeholder="e.g. Credentials provided, PR merged"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="text-sm"
              />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Work timer will immediately resume into ACTIVE state.
              </p>
            </div>
          )}

          {actionType === "estimate" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="est-minutes" className="text-xs">
                  Expected Active Work Duration (Minutes)
                </Label>
                <Input
                  id="est-minutes"
                  type="number"
                  min="5"
                  step="5"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="est-datetime" className="text-xs">
                  Or Specific Completion Target (Local Time)
                </Label>
                <Input
                  id="est-datetime"
                  type="datetime-local"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="est-reason" className="text-xs">
                  Adjustment Reason (Audit log)
                </Label>
                <Input
                  id="est-reason"
                  placeholder="e.g. Scope expanded, bug was more complex"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {actionType === "progress" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <Label htmlFor="progress-val">Progress Percentage (0 - 100%)</Label>
                  <span className="font-mono font-bold text-primary">{progressVal}%</span>
                </div>
                <Input
                  id="progress-val"
                  type="number"
                  min="0"
                  max="100"
                  value={progressVal}
                  onChange={(e) => setProgressVal(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Progress Source</Label>
                <Select
                  value={progressSource}
                  onValueChange={(val: ProgressSourceType) => setProgressSource(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">MANUAL (Self or Manager Reported)</SelectItem>
                    <SelectItem value="TASK_WEIGHTED">TASK_WEIGHTED (Child Subtasks)</SelectItem>
                    <SelectItem value="MILESTONE">MILESTONE (Milestone Checkpoints)</SelectItem>
                    <SelectItem value="TIME_RATIO">TIME_RATIO (Elapsed vs Expected Ratio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prog-reason" className="text-xs">
                  Progress Note
                </Label>
                <Input
                  id="prog-reason"
                  placeholder="e.g. Finished frontend components, testing in progress"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {actionType === "complete" && (
            <div className="py-2 text-xs text-muted-foreground space-y-2">
              <p>
                Are you sure you want to mark this assignment as <strong>COMPLETED</strong>?
              </p>
              <p className="text-foreground font-medium">
                Active time will be frozen and recorded into immutable completion records.
              </p>
            </div>
          )}

          {actionType === "new_assignment" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-proj" className="text-xs">Project Name</Label>
                <Input
                  id="new-proj"
                  placeholder="e.g. Web App Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-task" className="text-xs">Task Title *</Label>
                <Input
                  id="new-task"
                  placeholder="e.g. Build live workforce dashboard"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={newPriority}
                    onValueChange={(val: any) => setNewPriority(val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-mins" className="text-xs">Est. Duration (Mins)</Label>
                  <Input
                    id="new-mins"
                    type="number"
                    min="5"
                    step="5"
                    value={newExpectedMinutes}
                    onChange={(e) => setNewExpectedMinutes(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-notes" className="text-xs">Notes / Instructions</Label>
                <Input
                  id="new-notes"
                  placeholder="Optional assignment briefing"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              variant={actionType === "block" ? "destructive" : "default"}
            >
              {loading ? "Processing..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
