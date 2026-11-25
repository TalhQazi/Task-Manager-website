import { CheckCircle, AlertTriangle, AlertCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOverrun } from "./WorkTimer";
import type { HealthType } from "@/lib/employeeLiveApi";

interface HealthIndicatorProps {
  health?: HealthType;
  overrunSeconds?: number;
  isOverdue?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function HealthIndicator({
  health = "on-track",
  overrunSeconds = 0,
  isOverdue = false,
  className = "",
  size = "md",
}: HealthIndicatorProps) {
  const effectiveHealth = isOverdue ? "overdue" : health;

  if (effectiveHealth === "overdue") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5",
          size === "sm" ? "text-[11px]" : "text-xs",
          className
        )}
        title="Assignment active duration has exceeded expected estimate"
      >
        <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>{overrunSeconds > 0 ? formatOverrun(overrunSeconds) : "Overdue"}</span>
      </span>
    );
  }

  if (effectiveHealth === "blocked") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold rounded-md bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5",
          size === "sm" ? "text-[11px]" : "text-xs",
          className
        )}
        title="Work is currently blocked by an impediment"
      >
        <AlertCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Blocked</span>
      </span>
    );
  }

  if (effectiveHealth === "paused") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5",
          size === "sm" ? "text-[11px]" : "text-xs",
          className
        )}
      >
        <PauseCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Paused</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5",
        size === "sm" ? "text-[11px]" : "text-xs",
        className
      )}
      title="Work is proceeding on schedule"
    >
      <CheckCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>On Track</span>
    </span>
  );
}
