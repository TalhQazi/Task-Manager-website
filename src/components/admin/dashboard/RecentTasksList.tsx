import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin, AlertCircle, User } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  assignee?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  dueTime?: string;
  location?: string;
  createdAt: string;
}

const priorityClasses = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const statusClasses = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

export function RecentTasksList() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await apiFetch<{ items: Task[] }>("/api/tasks?limit=6&page=1");
        if (!mounted) return;
        setTasks(res.items ?? []);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load tasks");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const recentTasks = useMemo(() => {
    return tasks.map((t) => ({
      ...t,
      displayDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : "—",
      assigneeDisplay: t.assignees && t.assignees.length > 0 ? `${t.assignees.length} assigned` : "Unassigned",
      assigneeInitials: t.assignees && t.assignees.length > 0 
        ? t.assignees[0].split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : "—",
    }));
  }, [tasks]);

  return (
    <Card className="shadow-soft border-0 sm:border h-full">
      {/* Card Header - Responsive */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-4 sm:py-5">
        <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
          Recent Tasks
        </CardTitle>
        <a 
          href="/tasks" 
          className="text-xs sm:text-sm text-accent hover:underline inline-flex items-center"
        >
          View all
          <span className="ml-1 hidden sm:inline">→</span>
        </a>
      </CardHeader>

      {/* Card Content - Responsive */}
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-6 sm:py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-accent/30 animate-pulse" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Loading tasks...
              </p>
            </div>
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive/50 mb-2" />
            <p className="text-xs sm:text-sm text-destructive">{apiError}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please try again later
            </p>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base font-medium text-muted-foreground">
              No tasks found
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Create your first task to get started
            </p>
            <a 
              href="/tasks" 
              className="mt-3 text-xs sm:text-sm text-accent hover:underline"
            >
              Create a task →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg 
                         bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent sm:border-0"
              >
                {/* Avatar - Hidden on mobile? No, keep visible but smaller */}
                <div className="flex items-start gap-3 sm:items-center flex-1 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-accent/10 text-accent text-xs sm:text-sm">
                      {task.assigneeInitials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-1">
                    {/* Title and Priority - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                      <h4 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                        {task.title}
                      </h4>
                      <Badge 
                        className={`${priorityClasses[task.priority]} text-xs w-fit`} 
                        variant="secondary"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Assignee and Due Date - Stack on mobile, row on tablet+ */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{task.displayDate}</span>
                      </span>
                      <span className="hidden sm:block text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="font-medium">{task.assigneeDisplay}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge - Aligned right on desktop, full width on mobile? No, inline */}
                <div className="flex justify-start sm:justify-end mt-1 sm:mt-0">
                  <Badge 
                    className={`${statusClasses[task.status]} text-xs sm:text-sm w-fit`} 
                    variant="secondary"
                  >
                    {task.status === "in-progress" ? "In Progress" : 
                     task.status === "pending" ? "Pending" :
                     task.status === "completed" ? "Completed" : "Overdue"}
                  </Badge>
                </div>
              </div>
            ))}

            {/* Mobile View All Link - Only visible on mobile */}
            <div className="block sm:hidden pt-2">
              <a 
                href="/tasks" 
                className="text-xs text-accent hover:underline inline-flex items-center w-full justify-center py-2"
              >
                View all tasks
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}