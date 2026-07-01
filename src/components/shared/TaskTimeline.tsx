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

  const completed = formatDateTime(task.completedAt);
  if (completed) {
    rows.push({
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Completed",
      value: completed,
      sub: task.completedByName ? `by ${task.completedByName}` : undefined,
      tone: "text-emerald-500",
    });
  } else if (task.status === "in-progress") {
    const runningSince = formatDateTime(task.startedAt) || started;
    rows.push({
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: "In progress",
      value: runningSince ? `since ${runningSince}` : "Currently running",
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
