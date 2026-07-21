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

export function TaskViewSwitcher() {
  const { view, setView, filters, setFilters, selected, setSelected } = useTaskView();

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

      {/* Shared filter bar (hidden for aggregate views that don't page rows) */}
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
          <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            {["all", "pending", "in-progress", "completed", "overdue"].map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ priority: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            {["all", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p === "all" ? "All priorities" : p}</option>)}
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
