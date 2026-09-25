import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTaskView } from "../TaskViewContext";
import { useTaskDataset } from "../useTaskDataset";
import { STATUS_COLUMNS, TaskView } from "@/lib/taskViews";
import { ViewLoading } from "./shared";

/* Tasks placed by dueDate. Reuses the shared dataset; buckets client-side. */
export default function CalendarView() {
  const { filters, setSelected } = useTaskView();
  const [cursor, setCursor] = useState(new Date());
  const { tasks, isLoading, hasNextPage, fetchNextPage } = useTaskDataset(filters);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, TaskView[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = format(new Date(t.dueDate), "yyyy-MM-dd");
      (map.get(key) || map.set(key, []).get(key)!).push(t);
    }
    return map;
  }, [tasks]);

  if (isLoading) return <ViewLoading />;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-1.5 rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setCursor(new Date())} className="px-2 py-1 text-xs rounded hover:bg-muted">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-1.5 rounded hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          {hasNextPage && <button onClick={() => fetchNextPage()} className="ml-2 text-xs text-primary hover:underline">Load more</button>}
        </div>
      </div>
      <div className="grid grid-cols-7 text-[11px] font-semibold text-muted-foreground uppercase mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto auto-rows-fr">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = byDay.get(key) || [];
          const muted = !isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          return (
            <div key={key} className={`min-h-[92px] rounded-lg border p-1 ${muted ? "bg-muted/20 border-transparent" : "border-border"} ${today ? "ring-1 ring-primary" : ""}`}>
              <div className={`text-[11px] font-semibold mb-0.5 ${muted ? "text-muted-foreground" : ""} ${today ? "text-primary" : ""}`}>{format(day, "d")}</div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((t) => {
                  const color = STATUS_COLUMNS.find((s) => s.key === t.status)?.color || "#64748b";
                  return (
                    <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left text-[10px] truncate px-1 py-0.5 rounded hover:opacity-80" style={{ background: `${color}22`, color }}>
                      {t.title || "Untitled"}
                    </button>
                  );
                })}
                {items.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{items.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
