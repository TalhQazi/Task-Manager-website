import { useTaskView } from "../TaskViewContext";
import { useTaskDataset } from "../useTaskDataset";
import { PRIORITY_META, STATUS_COLUMNS } from "@/lib/taskViews";
import { ViewLoading, ViewEmpty, dueLabel, initials } from "./shared";

export default function CardView() {
  const { filters, setSelected } = useTaskView();
  const { tasks, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTaskDataset(filters);

  if (isLoading) return <ViewLoading />;
  if (!tasks.length) return <ViewEmpty />;

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tasks.map((t) => {
          const pri = PRIORITY_META[t.priority] || PRIORITY_META.low;
          const statusColor = STATUS_COLUMNS.find((s) => s.key === t.status)?.color || "#64748b";
          const due = dueLabel(t.dueDate);
          return (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col gap-2"
              style={{ borderTopColor: statusColor, borderTopWidth: 3 }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm line-clamp-2">{t.title || "Untitled"}</h3>
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${pri.className}`}>{pri.label}</span>
              </div>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className={`text-xs ${due.className}`}>{due.text}</span>
                <div className="flex -space-x-1.5">
                  {t.assignees.slice(0, 3).map((a, i) => (
                    <span key={i} title={a} className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center border border-background">
                      {initials(a)}
                    </span>
                  ))}
                  {t.assignees.length > 3 && <span className="h-6 w-6 rounded-full bg-muted text-[10px] flex items-center justify-center border border-background">+{t.assignees.length - 3}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
