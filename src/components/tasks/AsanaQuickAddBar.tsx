import React, { useState } from "react";
import { Plus, Sparkles, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { toast } from "@/components/admin/ui/use-toast";
import { apiFetch } from "@/lib/admin/apiClient";

interface AsanaQuickAddBarProps {
  projectId?: string | null;
  projectName?: string;
  onTaskCreated?: () => void;
  onOpenFullModal?: () => void;
}

export function AsanaQuickAddBar({
  projectId,
  projectName,
  onTaskCreated,
  onOpenFullModal,
}: AsanaQuickAddBarProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskTitle = title.trim();
    if (!taskTitle || loading) return;

    setLoading(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          description: `Task created via Quick-Add in ${projectName || "General"}`,
          priority: "medium",
          status: "pending",
          projectId: projectId || null,
        }),
      });

      toast({
        title: "Task Created",
        description: `"${taskTitle}" added to ${projectName || "tasks"}.`,
      });

      setTitle("");
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      toast({
        title: "Failed to create task",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-2.5 shadow-sm transition-all hover:border-primary/40">
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3 flex items-center justify-center text-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </div>
          <Input
            type="text"
            placeholder={
              projectName
                ? `+ Add task in "${projectName}"... (Press Enter to save & add next)`
                : `+ Add task... (Press Enter to save & add next)`
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="pl-9 pr-4 h-10 text-xs sm:text-sm bg-background/80 border-muted/60 focus-visible:ring-1 focus-visible:ring-primary font-medium"
          />
        </div>

        <Button
          type="submit"
          disabled={!title.trim() || loading}
          size="sm"
          className="h-10 px-4 font-semibold text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </Button>

        {onOpenFullModal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFullModal}
            title="Open full options modal with attachments, video, and assignment"
            className="h-10 px-3 text-xs gap-1.5 shrink-0 border-muted hover:bg-muted/50 hidden sm:flex"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Advanced Details</span>
          </Button>
        )}
      </form>
    </div>
  );
}
