import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import { Link2 } from "lucide-react";
import { useTaskView } from "../TaskViewContext";
import { useTaskDataset } from "../useTaskDataset";
import { STATUS_COLUMNS, TaskView, dependencies } from "@/lib/taskViews";
import { ViewLoading, ViewEmpty } from "./shared";

const PX_PER_DAY = 28;

function taskSpan(t: TaskView) {
  const start = t.firstStartedAt || t.startedAt || t.createdAt || t.dueDate;
  const end = t.completedAt || t.dueDate || start;
  return { start: start ? new Date(start) : null, end: end ? new Date(end) : null };
}

/* Gantt: bars from firstStartedAt/startedAt → completedAt/dueDate (all existing
 * Task fields). Dependency edges come from the additive task-dependencies API. */
export default function TimelineView() {
  const { filters, setSelected } = useTaskView();
  const { tasks, isLoading } = useTaskDataset(filters);
  const depsQuery = useQuery({
    queryKey: ["task-deps", tasks.map((t) => t.id).slice(0, 200)],
    queryFn: () => dependencies.list(tasks.map((t) => t.id).slice(0, 200)),
    enabled: tasks.length > 0,
  });

  const { rows, minDate, totalDays } = useMemo(() => {
    const spans = tasks.map((t) => ({ t, ...taskSpan(t) })).filter((s) => s.start);
    if (!spans.length) return { rows: [], minDate: new Date(), totalDays: 1 };
    const min = new Date(Math.min(...spans.map((s) => s.start!.getTime())));
    const max = new Date(Math.max(...spans.map((s) => (s.end || s.start)!.getTime())));
    const total = Math.max(1, differenceInCalendarDays(max, min) + 1);
    return { rows: spans, minDate: min, totalDays: total };
  }, [tasks]);

  const depCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of depsQuery.data?.items || []) {
      map.set(d.predecessorId, (map.get(d.predecessorId) || 0) + 1);
      map.set(d.successorId, (map.get(d.successorId) || 0) + 1);
    }
    return map;
  }, [depsQuery.data]);

  if (isLoading) return <ViewLoading />;
  if (!rows.length) return <ViewEmpty label="No tasks with dates to plot." />;

  const width = totalDays * PX_PER_DAY;

  return (
    <div className="h-full overflow-auto border border-border rounded-xl bg-card">
      <div className="flex" style={{ minWidth: 240 + width }}>
        {/* Left label column */}
        <div className="w-60 shrink-0 sticky left-0 z-10 bg-card border-r border-border">
          <div className="h-8 border-b border-border" />
          {rows.map(({ t }) => (
            <div key={t.id} onClick={() => setSelected(t)} className="h-9 flex items-center gap-1.5 px-3 border-b border-border/60 text-sm truncate cursor-pointer hover:bg-muted/50">
              {depCount.get(t.id) ? <Link2 className="h-3 w-3 text-muted-foreground shrink-0" /> : null}
              <span className="truncate">{t.title || "Untitled"}</span>
            </div>
          ))}
        </div>
        {/* Bars */}
        <div style={{ width }}>
          <div className="h-8 border-b border-border relative text-[10px] text-muted-foreground">
            {Array.from({ length: totalDays }).map((_, i) =>
              i % 7 === 0 ? (
                <span key={i} className="absolute top-1.5 border-l border-border/50 pl-1" style={{ left: i * PX_PER_DAY }}>
                  {format(new Date(minDate.getTime() + i * 86400000), "MMM d")}
                </span>
              ) : null
            )}
          </div>
          {rows.map(({ t, start, end }) => {
            const offset = differenceInCalendarDays(start!, minDate);
            const len = Math.max(1, differenceInCalendarDays(end || start!, start!) + 1);
            const color = STATUS_COLUMNS.find((s) => s.key === t.status)?.color || "#64748b";
            return (
              <div key={t.id} className="h-9 border-b border-border/60 relative">
                <div
                  onClick={() => setSelected(t)}
                  title={t.title}
                  className="absolute top-1.5 h-6 rounded-md cursor-pointer hover:opacity-90 flex items-center px-2 text-[10px] text-white font-medium truncate"
                  style={{ left: offset * PX_PER_DAY, width: len * PX_PER_DAY - 4, background: color }}
                >
                  {t.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
