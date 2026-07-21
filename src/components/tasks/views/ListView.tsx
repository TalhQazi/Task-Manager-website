import { useTaskView } from "../TaskViewContext";
import { useTaskDataset } from "../useTaskDataset";
import { VirtualList } from "../VirtualList";
import { PRIORITY_META, STATUS_COLUMNS, TaskView } from "@/lib/taskViews";
import { ViewLoading, ViewEmpty, dueLabel } from "./shared";

/* Virtualized table — handles 100k rows (only visible rows mount). */
export default function ListView({ dense = false }: { dense?: boolean }) {
  const { filters, setSelected } = useTaskView();
  const { tasks, isLoading, fetchNextPage, hasNextPage } = useTaskDataset(filters);

  if (isLoading) return <ViewLoading />;
  if (!tasks.length) return <ViewEmpty />;

  const rowHeight = dense ? 40 : 56;

  const Row = (t: TaskView) => {
    const pri = PRIORITY_META[t.priority] || PRIORITY_META.low;
    const statusColor = STATUS_COLUMNS.find((s) => s.key === t.status)?.color || "#64748b";
    const due = dueLabel(t.dueDate);
    return (
      <div
        onClick={() => setSelected(t)}
        className="h-full flex items-center gap-3 px-3 border-b border-border/60 hover:bg-muted/50 cursor-pointer text-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
        <span className="flex-1 min-w-0 truncate font-medium">{t.taskNumber ? <span className="text-muted-foreground mr-1.5">#{t.taskNumber}</span> : null}{t.title || "Untitled"}</span>
        {!dense && <span className="w-40 truncate text-muted-foreground hidden md:block">{t.assignees.join(", ") || "—"}</span>}
        <span className={`w-24 text-xs shrink-0 ${due.className} hidden sm:block`}>{due.text}</span>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${pri.className}`}>{pri.label}</span>
        <span className="w-24 shrink-0 text-xs text-muted-foreground hidden lg:block">{t.status}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center gap-3 px-3 h-9 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <span className="w-1.5" />
        <span className="flex-1">Task</span>
        {!dense && <span className="w-40 hidden md:block">Assignees</span>}
        <span className="w-24 hidden sm:block">Due</span>
        <span className="w-14">Priority</span>
        <span className="w-24 hidden lg:block">Status</span>
      </div>
      <VirtualList
        items={tasks}
        rowHeight={rowHeight}
        className="flex-1"
        renderRow={(t) => Row(t)}
        onReachEnd={() => hasNextPage && fetchNextPage()}
      />
    </div>
  );
}
