import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PURCHASE_STATUS_META,
  WARNING_LABELS,
  formatMoney,
  getTaskCostItems,
} from "@/lib/costManager";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, MapPin } from "lucide-react";

// Compact read-only panel of Cost Manager expenses linked to one task.
// Items are managed in the project Cost Manager; totals roll up automatically.
export default function TaskExpensesPanel({ taskId }: { taskId: string }) {
  const itemsQuery = useQuery({
    queryKey: ["task-cost-items", taskId],
    queryFn: () => getTaskCostItems(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });

  const items = itemsQuery.data?.items || [];
  if (!taskId || itemsQuery.isLoading || items.length === 0) return null;

  const estimated = items.reduce((s, i) => s + i.estimatedTotalCents, 0);
  const paid = items.reduce((s, i) => s + i.paidCents, 0);
  const warningCount = items.reduce((s, i) => s + (i.warnings?.length || 0), 0);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-primary" /> Expenses ({items.length})
          {warningCount > 0 && (
            <span className="text-amber-500 flex items-center gap-0.5 font-semibold" title="Items need attention">
              <AlertTriangle className="w-3 h-3" /> {warningCount}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Paid <span className="font-semibold text-green-600">{formatMoney(paid)}</span>
          {" / "}
          <span className="font-semibold text-foreground">{formatMoney(estimated)}</span>
        </p>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const meta = PURCHASE_STATUS_META[item.purchaseStatus];
          const location = [item.storage?.locationName, item.storage?.shelf, item.storage?.bin]
            .filter(Boolean)
            .join(" / ");
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="truncate font-medium">{item.itemName}</span>
                {(item.warnings || []).length > 0 && (
                  <span
                    className="text-amber-500 flex-shrink-0"
                    title={(item.warnings || []).map((w) => WARNING_LABELS[w]).join("\n")}
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
                {location && (
                  <span className="text-green-700 dark:text-green-400 flex items-center gap-0.5 flex-shrink-0" title={location}>
                    <MapPin className="w-3 h-3" />
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className={`text-[9px] ${meta.className}`}>
                  {meta.label}
                </Badge>
                <span className="font-semibold whitespace-nowrap">{formatMoney(item.estimatedTotalCents)}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Managed in the project's Cost Manager — these expenses roll into project totals.
      </p>
    </div>
  );
}
