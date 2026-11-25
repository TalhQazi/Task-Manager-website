import { useEffect, useState } from "react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { BellRing, Check, CheckCircle2, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatElapsedTime(startIso?: string | null, endIso?: string | null): { label: string; hours: number } | null {
  if (!startIso) return null;
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return null;
  const endMs = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, (Number.isNaN(endMs) ? Date.now() : endMs) - startMs);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = totalMinutes / 60;
  const days = Math.floor(totalMinutes / (60 * 24));
  const remHours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const remMins = totalMinutes % 60;

  if (days > 0) return { label: `${days}d ${remHours}h`, hours };
  if (remHours > 0) return { label: `${remHours}h ${remMins}m`, hours };
  return { label: `${Math.max(1, remMins)}m`, hours };
}

export function ProjectUpperRightCheckmark({
  status,
  onMarkComplete,
  disabled,
  className,
}: {
  status?: string;
  onMarkComplete?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}) {
  const isCompleted = String(status || "").toLowerCase() === "completed";

  if (isCompleted) {
    return (
      <span
        title="Project Completed"
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-background",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }

  if (!onMarkComplete) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onMarkComplete}
      title="Mark project as complete"
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/40 bg-background/90 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm",
        className
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  );
}

export function ProjectTimerBadge({
  status,
  startedAt,
  completedAt,
  createdAt,
}: {
  status?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
}) {
  const [, setTick] = useState(0);
  const isCompleted = String(status || "").toLowerCase() === "completed";

  useEffect(() => {
    if (isCompleted) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => window.clearInterval(id);
  }, [isCompleted]);

  const effectiveStart = startedAt || createdAt;
  const elapsed = formatElapsedTime(effectiveStart, isCompleted ? completedAt : null);
  if (!elapsed) return null;

  const isOverdueOrLong = !isCompleted && (String(status || "").toLowerCase() === "overdue" || elapsed.hours >= 24);

  return (
    <Badge
      variant="outline"
      title={startedAt ? `Timer started ${new Date(startedAt).toLocaleString()}` : "Time since created"}
      className={cn(
        "text-[10px] font-mono gap-1 px-1.5 py-0",
        isCompleted
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
          : isOverdueOrLong
            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
            : "bg-sky-500/10 text-sky-600 border-sky-500/30"
      )}
    >
      <Clock className="h-2.5 w-2.5" />
      <span>{isCompleted ? `Done in ${elapsed.label}` : elapsed.label}</span>
    </Badge>
  );
}

export function ProjectActionBar({
  status,
  hasStarted,
  busy,
  onStartTimer,
  onMarkComplete,
  onSendCheckIn,
}: {
  status?: string;
  hasStarted?: boolean;
  busy?: boolean;
  onStartTimer?: () => void;
  onMarkComplete?: () => void;
  onSendCheckIn?: () => void;
}) {
  const isCompleted = String(status || "").toLowerCase() === "completed";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isCompleted && !hasStarted && onStartTimer && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onStartTimer}
          className="h-7 text-xs gap-1 border-sky-500/40 text-sky-600 hover:bg-sky-500/10"
        >
          <Play className="h-3 w-3" />
          Start Timer
        </Button>
      )}
      {!isCompleted && onSendCheckIn && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onSendCheckIn}
          className="h-7 text-xs gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
          title="Notify assignees to ask if this project is done"
        >
          <BellRing className="h-3 w-3" />
          Ask If Done
        </Button>
      )}
      {!isCompleted && onMarkComplete && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onMarkComplete}
          className="h-7 text-xs gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-semibold"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark Complete
        </Button>
      )}
    </div>
  );
}
