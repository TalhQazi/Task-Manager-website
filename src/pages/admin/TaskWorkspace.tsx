import { LayoutGrid } from "lucide-react";
import { TaskViewProvider } from "@/components/tasks/TaskViewContext";
import { TaskViewSwitcher } from "@/components/tasks/TaskViewSwitcher";

/* Multi-view Task Workspace. One shared dataset (useTaskDataset) drives 9
 * presentation views; switching a view never duplicates task records. Reuses
 * the existing /api/tasks data and status API. Existing Tasks page is untouched. */
export default function TaskWorkspace() {
  return (
    <div className="p-6 h-[calc(100vh-var(--header-height,300px))] flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LayoutGrid className="h-7 w-7 text-primary" /> Task Workspace
        </h1>
        <p className="text-muted-foreground">One shared task dataset — nine ways to see it. Card, List, Compact, Kanban, Workload, Calendar, Timeline, WIP & Executive.</p>
      </div>
      <TaskViewProvider initialView="card">
        <TaskViewSwitcher />
      </TaskViewProvider>
    </div>
  );
}
