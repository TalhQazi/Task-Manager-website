import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/admin/ui/sheet";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Textarea } from "@/components/admin/ui/textarea";
import { Input } from "@/components/admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import { toast } from "@/components/admin/ui/use-toast";
import { apiFetch } from "@/lib/admin/apiClient";
import {
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Flag,
  FileText,
  MessageSquare,
  Paperclip,
  Trash2,
  X,
  Send,
  Loader2,
  Sparkles,
  Check,
  Building,
} from "lucide-react";

interface AsanaTaskDrawerProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  employees?: any[];
}

export function AsanaTaskDrawer({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
  employees = [],
}: AsanaTaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "pending");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? String(task.dueDate).split("T")[0] : "");
      setAssignees(Array.isArray(task.assignees) ? task.assignees : []);
      void fetchComments(task.id || task._id);
    }
  }, [task?.id, task?._id]);

  const fetchComments = async (taskId: string) => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const res = await apiFetch<{ items?: any[] }>(`/api/tasks/${taskId}/comments`);
      setComments(res.items || []);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdate = async (fields: Record<string, any>) => {
    if (!task) return;
    const taskId = task.id || task._id;
    setSaving(true);
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(fields),
      });
      toast({ title: "Task Saved", description: "Property updated successfully." });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast({
        title: "Failed to update task",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    const nextStatus = status === "completed" ? "pending" : "completed";
    setStatus(nextStatus);
    await handleUpdate({ status: nextStatus });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDraft.trim() || !task) return;
    const taskId = task.id || task._id;
    try {
      const res = await apiFetch<{ item: any }>(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: commentDraft.trim() }),
      });
      setCommentDraft("");
      setComments((prev) => [...prev, res.item]);
    } catch (err) {
      toast({ title: "Failed to send comment", variant: "destructive" });
    }
  };

  if (!task) return null;

  const isCompleted = status === "completed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-card border-l border-border shadow-2xl">
        <SheetHeader className="p-4 sm:p-6 border-b border-border bg-muted/20">
          {/* Top Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handleToggleComplete}
              disabled={saving}
              variant={isCompleted ? "default" : "outline"}
              className={`h-9 px-4 text-xs font-bold gap-2 transition-all ${
                isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md"
                  : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${isCompleted ? "text-white" : "text-emerald-500"}`} />
              <span>{isCompleted ? "✓ Completed" : "Mark Complete"}</span>
            </Button>

            <div className="flex items-center gap-2">
              {onTaskDeleted && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onTaskDeleted}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Editable Title */}
          <div className="mt-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) handleUpdate({ title: title.trim() });
              }}
              className="text-base sm:text-lg font-bold border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary px-1 h-auto py-1"
            />
            <SheetDescription className="text-xs text-muted-foreground px-1 mt-0.5">
              Task #{task.taskNumber || task.id?.substring(0, 6)} · Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ""}
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Asana Property Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-muted/60 text-xs">
            {/* Assignees */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Assignees
              </span>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {assignees.length > 0 ? (
                  assignees.map((a, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px] font-medium gap-1 py-0.5 px-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[9px] font-bold uppercase">{a.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{a}</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Status
              </span>
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  void handleUpdate({ status: val });
                }}
              >
                <SelectTrigger className="h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-red-500" /> Priority
              </span>
              <Select
                value={priority}
                onValueChange={(val) => {
                  setPriority(val);
                  void handleUpdate({ priority: val });
                }}
              >
                <SelectTrigger className="h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-500" /> Due Date
              </span>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  void handleUpdate({ dueDate: e.target.value });
                }}
                className="h-8 text-xs font-medium"
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== task.description) handleUpdate({ description });
              }}
              placeholder="Add details, instructions, or notes about this task..."
              rows={4}
              className="text-xs sm:text-sm resize-y leading-relaxed bg-background"
            />
          </div>

          {/* Discussion & Activity Timeline */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Activity & Discussion ({comments.length})
            </label>

            {/* Comment List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {loadingComments ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No comments yet. Start the conversation below.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id || c.id} className="p-3 rounded-lg bg-muted/20 border border-muted/50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-primary">{c.authorFullName || c.authorUsername || "User"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className="text-foreground leading-normal">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Ask a question or leave a update..."
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                className="h-9 text-xs flex-1 bg-background"
              />
              <Button type="submit" disabled={!commentDraft.trim()} size="sm" className="h-9 px-3 gap-1 text-xs">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
