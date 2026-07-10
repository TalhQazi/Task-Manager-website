import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/admin/utils";
import { X, WifiOff, AlertTriangle } from "lucide-react";
import { useWipSessions, useWipSummary } from "./useWipData";
import { ElapsedTimer, formatDuration } from "./ElapsedTimer";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import type { WipSession } from "./types";

/**
 * Command-centre display for shop/office monitors.
 *
 * Read-only by construction: this component renders no edit controls at all —
 * they are absent, not hidden. The API also rejects writes for read-only roles,
 * so hiding buttons is never the security boundary.
 *
 * If the live connection drops, a stale-data banner appears rather than
 * silently showing frozen timers.
 */

const ROWS_PER_PAGE = 10;
const ROTATION_MS = 20_000;
const STALE_AFTER_SECONDS = 60;

export function TvMode({ onExit }: { onExit: () => void }) {
  const { data: summary } = useWipSummary({}, { staleAfterSeconds: STALE_AFTER_SECONDS });
  const { data, transport } = useWipSessions({ limit: 200 }, { staleAfterSeconds: STALE_AFTER_SECONDS });

  const sessions = useMemo(() => data?.items || [], [data]);
  const pageCount = Math.max(1, Math.ceil(sessions.length / ROWS_PER_PAGE));
  const [page, setPage] = useState(0);

  // Auto-rotate when more rows exist than fit on screen.
  useEffect(() => {
    if (pageCount <= 1) {
      setPage(0);
      return;
    }
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), ROTATION_MS);
    return () => clearInterval(id);
  }, [pageCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const rows: WipSession[] = sessions.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  const isStale = transport.stale || !transport.live;

  const stats = [
    { label: "Working", value: summary?.currentlyWorking ?? 0, tone: "text-emerald-400" },
    { label: "Paused", value: summary?.pausedTasks ?? 0, tone: "text-yellow-400" },
    { label: "Blocked", value: summary?.blockedTasks ?? 0, tone: "text-red-400" },
    { label: "Overdue", value: summary?.overdueTasks ?? 0, tone: "text-orange-400" },
    { label: "Projects", value: summary?.activeProjects ?? 0, tone: "text-purple-400" },
    { label: "Avg Time", value: formatDuration(summary?.averageActiveSeconds ?? 0), tone: "text-blue-400" },
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#070B14] text-white">
      {/* Stale banner — visible, never silent */}
      {isStale && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 py-2 text-sm font-semibold text-amber-200">
          {transport.live ? <AlertTriangle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {transport.live
            ? "Data may be out of date — no updates received recently"
            : "Live connection lost — timers below may be frozen"}
        </div>
      )}

      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work In Progress</h1>
          <p className="text-sm text-white/40">
            {sessions.length} active {sessions.length === 1 ? "session" : "sessions"}
            {pageCount > 1 && ` · page ${page + 1} of ${pageCount}`}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-3xl font-bold tabular-nums text-white/80">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button type="button" onClick={onExit} aria-label="Exit TV mode" className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Large, high-contrast stats */}
      <div className="grid grid-cols-3 gap-4 px-8 pb-6 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <div className={cn("text-4xl font-bold tabular-nums", s.tone)}>{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-white/35">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rows — large type, legible from across a room */}
      <div className="px-8">
        {rows.length === 0 ? (
          <div className="py-24 text-center text-2xl text-white/25">No active work</div>
        ) : (
          <div className="space-y-2">
            {rows.map((s) => (
              <div
                key={s._id}
                className={cn(
                  "grid grid-cols-12 items-center gap-4 rounded-xl border px-5 py-4",
                  s.status === "blocked" ? "border-red-400/30 bg-red-500/[0.07]" : "border-white/10 bg-white/[0.02]"
                )}
              >
                <div className="col-span-3 truncate text-xl font-semibold">{s.employeeName}</div>
                <div className="col-span-3 truncate text-lg text-white/70">{s.taskTitle}</div>
                <div className="col-span-2 truncate text-base text-white/45">{s.projectName || "—"}</div>
                <div className="col-span-2">
                  <ElapsedTimer
                    startedAt={s.startedAt} endedAt={s.endedAt}
                    pausedAt={s.pausedAt} pausedTotalSeconds={s.pausedTotalSeconds}
                    size="lg" className={cn("font-bold", isStale && "opacity-50")}
                  />
                </div>
                <div className="col-span-1"><StatusBadge status={s.status} /></div>
                <div className="col-span-1"><ProgressBar value={s.progressPercent} showLabel={false} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
