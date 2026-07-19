import { useEffect, useState } from "react";
import { CalendarPlus, PlayCircle, CheckCircle2, Loader2 } from "lucide-react";

export interface TaskTimelineData {
  createdAt?: string;
  firstStartedAt?: string | null;
  startedByName?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByName?: string;
  totalTimeSpent?: number;
  status?: string;
}

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Human readable elapsed duration formatted as Days, Hours, Minutes, and Seconds.
 * e.g., "2 Days, 4 Hours, 15 Mins" or "3 Hours, 25 Mins" or "45 Mins, 10 Secs".
 */
function formatDuration(from?: string | null, to?: string | null, withSeconds = false, pastSeconds = 0): string | null {
  if (!from && pastSeconds <= 0) return null;

  let diff = Math.max(0, pastSeconds);
  if (from) {
    const start = new Date(from).getTime();
    const end = to ? new Date(to).getTime() : Date.now();
    if (!isNaN(start) && !isNaN(end)) {
      diff += Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  if (diff <= 0) return "0 Mins";

  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes} ${minutes === 1 ? "Min" : "Mins"}`);
  if (withSeconds && seconds > 0) parts.push(`${seconds} ${seconds === 1 ? "Sec" : "Secs"}`);

  return parts.join(", ");
}

interface Row {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}

/**
 * Compact vertical timeline showing when a task was created, started and closed with Days, Hours, Minutes duration.
 * Theme-token based so it works seamlessly in Admin, Manager, and Employee panels.
 */
export function TaskTimeline({ task }: { task: TaskTimelineData }) {
  // Tick every second while the task is running so "Running for X Days, Y Hours, Z Mins" stays live
  const [, setTick] = useState(0);
  const running = task.status === "in-progress" && !task.completedAt;
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const rows: Row[] = [];

  const created = formatDate(task.createdAt);
  if (created) {
    rows.push({
      icon: <CalendarPlus className="w-4 h-4" />,
      label: "Created",
      value: created,
      tone: "text-muted-foreground",
    });
  }

  const started = formatDateTime(task.firstStartedAt || task.startedAt);
  if (started) {
    rows.push({
      icon: <PlayCircle className="w-4 h-4" />,
      label: "Started",
      value: started,
      sub: task.startedByName ? `by ${task.startedByName}` : undefined,
      tone: "text-blue-500",
    });
  }

  const startRef = task.startedAt || task.firstStartedAt;

  const completed = formatDateTime(task.completedAt);
  if (completed) {
    const took = formatDuration(startRef, task.completedAt, false, task.totalTimeSpent || 0);
    const byPart = task.completedByName ? `by ${task.completedByName}` : "";
    const tookPart = took ? `Took ${took}` : "";
    const sub = [byPart, tookPart].filter(Boolean).join(" · ");
    rows.push({
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Completed",
      value: completed,
      sub: sub || undefined,
      tone: "text-emerald-500",
    });
  } else if (task.status === "in-progress") {
    const sessionStart = task.startedAt || task.firstStartedAt;
    const runningSince = formatDateTime(sessionStart);
    const elapsed = formatDuration(sessionStart, null, true, task.totalTimeSpent || 0);
    rows.push({
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: "In progress",
      value: elapsed ? `Running for ${elapsed}` : runningSince ? `since ${runningSince}` : "Currently running",
      sub: elapsed && runningSince ? `started ${runningSince}` : undefined,
      tone: "text-amber-500",
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Timeline
      </h4>
      <ol className="space-y-3">
        {rows.map((row, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className={`mt-0.5 flex-shrink-0 ${row.tone}`}>{row.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-foreground">{row.label}</span>
                <span className="text-sm text-foreground/80">{row.value}</span>
              </div>
              {row.sub && <span className="text-xs text-muted-foreground">{row.sub}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
