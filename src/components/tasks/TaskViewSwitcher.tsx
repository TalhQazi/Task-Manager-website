import { lazy, Suspense } from "react";
import {
  LayoutGrid, List as ListIcon, Rows3, Kanban, Users, Calendar as CalIcon,
  GanttChartSquare, Activity, LineChart, Search, Loader2,
} from "lucide-react";
import { Input } from "@/components/admin/ui/input";
import { useTaskView, ViewId } from "./TaskViewContext";
import { TaskDetailDialog } from "./TaskDetailDialog";

const CardView = lazy(() => import("./views/CardView"));
const ListView = lazy(() => import("./views/ListView"));
const CompactView = lazy(() => import("./views/CompactView"));
const KanbanView = lazy(() => import("./views/KanbanView"));
const WorkloadView = lazy(() => import("./views/WorkloadView"));
const CalendarView = lazy(() => import("./views/CalendarView"));
const TimelineView = lazy(() => import("./views/TimelineView"));
const WipView = lazy(() => import("./views/WipView"));
const ExecutiveDashboard = lazy(() => import("./views/ExecutiveDashboard"));

const VIEWS: Array<{ id: ViewId; label: string; icon: any }> = [
  { id: "card", label: "Card", icon: LayoutGrid },
  { id: "list", label: "List", icon: ListIcon },
  { id: "compact", label: "Compact", icon: Rows3 },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "workload", label: "Workload", icon: Users },
  { id: "calendar", label: "Calendar", icon: CalIcon },
  { id: "timeline", label: "Timeline", icon: GanttChartSquare },
  { id: "wip", label: "WIP", icon: Activity },
  { id: "executive", label: "Executive", icon: LineChart },
];

function ActiveView({ view }: { view: ViewId }) {
  switch (view) {
    case "card": return <CardView />;
    case "list": return <ListView />;
    case "compact": return <CompactView />;
    case "kanban": return <KanbanView />;
    case "workload": return <WorkloadView />;
    case "calendar": return <CalendarView />;
    case "timeline": return <TimelineView />;
    case "wip": return <WipView />;
    case "executive": return <ExecutiveDashboard />;
    default: return null;
  }
}

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function TaskViewSwitcher() {
  const { view, setView, filters, setFilters, selected, setSelected } = useTaskView();
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ items?: any[] }>("/api/employees")
      .then((res) => {
        if (mounted && Array.isArray(res.items)) {
          setEmployees(res.items.map((e) => ({ id: String(e.id || e._id), name: e.name })));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleDueDateFilterChange = (val: string) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (val === "today") {
      setFilters({ dueFrom: todayStr, dueTo: todayStr, status: "all" });
    } else if (val === "week") {
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFilters({ dueFrom: todayStr, dueTo: nextWeek.toISOString().slice(0, 10), status: "all" });
    } else if (val === "overdue") {
      setFilters({ dueFrom: undefined, dueTo: undefined, status: "overdue" });
    } else {
      setFilters({ dueFrom: undefined, dueTo: undefined });
    }
  };

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* View selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              view === id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground/80"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Shared filter bar */}
      {!["executive", "wip", "workload"].includes(view) && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              defaultValue={filters.search || ""}
              onKeyDown={(e) => e.key === "Enter" && setFilters({ search: (e.target as HTMLInputElement).value })}
              onBlur={(e) => setFilters({ search: e.target.value })}
              placeholder="Search tasks…"
              className="pl-9"
            />
          </div>

          {/* Assignee Filter Dropdown */}
          <select
            value={filters.assignment || "all"}
            onChange={(e) => setFilters({ assignment: e.target.value })}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm max-w-[180px]"
          >
            <option value="all">All Assignees</option>
            <option value="assigned">Assigned Tasks</option>
            <option value="unassigned">Unassigned Tasks</option>
            <option value="me">Assigned to Me</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>
                {emp.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || "all"}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {["all", "pending", "in-progress", "completed", "overdue"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s === "completed" ? "Completed (Corral)" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Quick Filter: Recently Completed Corral */}
          <button
            type="button"
            onClick={() => setFilters({ status: filters.status === "completed" ? "all" : "completed" })}
            className={`h-9 px-3 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filters.status === "completed"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            Recently Completed Corral
          </button>

          {/* Priority Filter */}
          <select
            value={filters.priority || "all"}
            onChange={(e) => setFilters({ priority: e.target.value })}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {["all", "high", "medium", "low"].map((p) => (
              <option key={p} value={p}>
                {p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* Due Date Filter */}
          <select
            onChange={(e) => handleDueDateFilterChange(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="all">All Due Dates</option>
            <option value="today">Due Today</option>
            <option value="week">Next 7 Days</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Suspense fallback={<div className="flex items-center justify-center py-16 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading view…</div>}>
          <ActiveView view={view} />
        </Suspense>
      </div>

      <TaskDetailDialog task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
