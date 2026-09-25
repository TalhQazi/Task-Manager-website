import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTaskView } from "../TaskViewContext";
import { useTaskDataset } from "../useTaskDataset";
import { PRIORITY_META, STATUS_COLUMNS, TaskView, updateTaskStatus } from "@/lib/taskViews";
import { ViewLoading, dueLabel, initials } from "./shared";

/* Columns = existing status enum. Drag between columns → existing status API.
 * Native HTML5 DnD (no dependency). Records are never duplicated — the same
 * task simply changes status. */
export default function KanbanView() {
  const { filters, setSelected } = useTaskView();
  const { tasks, isLoading, fetchNextPage, hasNextPage } = useTaskDataset(filters);
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<string, TaskView[]> = {};
    for (const s of STATUS_COLUMNS) map[s.key] = [];
    for (const t of tasks) (map[t.status] ||= []).push(t);
    return map;
  }, [tasks]);

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task-dataset"] }); qc.invalidateQueries({ queryKey: ["task-analytics"] }); },
    onError: () => toast.error("Failed to move task"),
  });

  const onDrop = (status: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const task = tasks.find((t) => t.id === id);
    if (id && task && task.status !== status) moveMutation.mutate({ id, status });
  };

  if (isLoading) return <ViewLoading />;

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-3 h-full min-w-max pb-2">
        {STATUS_COLUMNS.map((col) => {
          const items = columns[col.key] || [];
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
              onDrop={(e) => onDrop(col.key, e)}
              className={`w-72 shrink-0 flex flex-col rounded-xl border bg-muted/20 ${dragOver === col.key ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} /> {col.label}
                </span>
                <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.map((t) => {
                  const pri = PRIORITY_META[t.priority] || PRIORITY_META.low;
                  const due = dueLabel(t.dueDate);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/task-id", t.id)}
                      onClick={() => setSelected(t)}
                      className="rounded-lg border border-border bg-card p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-sm font-medium line-clamp-2">{t.title || "Untitled"}</p>
                        <span className={`shrink-0 text-[9px] px-1 py-0.5 rounded border ${pri.className}`}>{pri.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] ${due.className}`}>{due.text}</span>
                        <div className="flex -space-x-1.5">
                          {t.assignees.slice(0, 2).map((a, i) => (
                            <span key={i} title={a} className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center border border-background">{initials(a)}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Drop tasks here</p>}
              </div>
            </div>
          );
        })}
      </div>
      {hasNextPage && (
        <div className="flex justify-center py-2">
          <button onClick={() => fetchNextPage()} className="text-xs text-primary hover:underline">Load more tasks…</button>
        </div>
      )}
    </div>
  );
}
