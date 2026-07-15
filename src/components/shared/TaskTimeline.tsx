import { CalendarPlus, PlayCircle, CheckCircle2, Loader2 } from "lucide-react";

export interface TaskTimelineData {
  createdAt?: string;
  firstStartedAt?: string | null;
  startedByName?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByName?: string;
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
 * Human readable elapsed duration between two instants, e.g. "2d 4h 15m".
 * `to` defaults to now, so it doubles as "time since start" for running tasks.
 */
function formatDuration(from?: string | null, to?: string | null): string | null {
  if (!from) return null;
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return null;
  let diff = Math.max(0, Math.floor((end - start) / 1000)); // seconds

  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  // Always show minutes so short-running tasks aren't blank.
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

interface Row {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}

/**
 * Compact vertical timeline showing when a task was created, started and closed.
 * Theme-token based so it works in the admin, manager and employee panels.
 */
export function TaskTimeline({ task }: { task: TaskTimelineData }) {
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

  const started = formatDateTime(task.firstStartedAt);
  if (started) {
    rows.push({
      icon: <PlayCircle className="w-4 h-4" />,
      label: "Started",
      value: started,
      sub: task.startedByName ? `by ${task.startedByName}` : undefined,
      tone: "text-blue-500",
    });
  }

  // Measure duration strictly from when the task actually started (the moment it
  // was moved to in-progress) — never from createdAt, which would wildly inflate
  // the running time for tasks that sat in "pending" for a while.
  const startRef = task.firstStartedAt || task.startedAt;

  const completed = formatDateTime(task.completedAt);
  if (completed) {
    const took = formatDuration(startRef, task.completedAt);
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
    // The current running session starts at `startedAt` (the backend resets it
    // each time the task is moved to in-progress); fall back to the permanent
    // first-start only for older records that never recorded a session.
    const sessionStart = task.startedAt || task.firstStartedAt;
    const runningSince = formatDateTime(sessionStart);
    const elapsed = formatDuration(sessionStart);
    rows.push({
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: "In progress",
      // Lead with the elapsed duration (days/hours/minutes) since it was started;
      // keep the exact start time as a subline when known.
      value: elapsed ? `Running for ${elapsed}` : runningSince ? `since ${runningSince}` : "Currently running",
      sub: elapsed && runningSince ? `since ${runningSince}` : undefined,
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
