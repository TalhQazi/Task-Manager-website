import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Flag } from "lucide-react";
import { analytics } from "@/lib/taskViews";
import { ViewLoading, ViewEmpty, initials } from "./shared";

/* Per-assignee workload: reuses /task-analytics/workload (assignee-stats +
 * EmployeeCapacity). Utilization bar green→amber→red. */
export default function WorkloadView() {
  const q = useQuery({ queryKey: ["task-analytics", "workload"], queryFn: () => analytics.workload() });
  if (q.isLoading) return <ViewLoading />;
  const rows = q.data?.items || [];
  if (!rows.length) return <ViewEmpty label="No active assignments." />;

  const maxActive = Math.max(...rows.map((r) => r.active), 1);

  return (
    <div className="h-full overflow-y-auto space-y-2 pb-4">
      {rows.map((r) => {
        const util = r.utilizationPct;
        const barPct = util != null ? Math.min(util, 100) : Math.round((r.active / maxActive) * 100);
        const barColor = util == null ? "#3b82f6" : util > 100 ? "#ef4444" : util > 80 ? "#f59e0b" : "#22c55e";
        return (
          <div key={r.assignee} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{initials(r.assignee)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm truncate">{r.assignee}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.active} active
                  {util != null && <span className={util > 100 ? "text-red-500 font-semibold ml-1.5" : "ml-1.5"}>· {util}%</span>}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: barColor }} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                {r.highPriority > 0 && <span className="flex items-center gap-0.5"><Flag className="h-3 w-3 text-amber-500" /> {r.highPriority} high</span>}
                {r.overdue > 0 && <span className="flex items-center gap-0.5 text-red-500"><AlertTriangle className="h-3 w-3" /> {r.overdue} overdue</span>}
                <span>~{r.estimatedHours}h{r.weeklyHours ? ` / ${r.weeklyHours}h` : ""}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
