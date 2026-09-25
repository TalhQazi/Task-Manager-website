import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/admin/utils";

/**
 * Display-only elapsed timer.
 *
 * Ticks locally once per second from `startedAt` + `pausedTotalSeconds`. It
 * NEVER calls the server. The backend remains the source of truth: whenever a
 * fresh session payload arrives (socket or poll), the props change and the
 * timer re-derives from them.
 *
 * Mirrors backend src/lib/wipElapsed.js exactly — keep the two in step.
 */

export interface ElapsedTimerProps {
  startedAt: string | Date;
  endedAt?: string | Date | null;
  /** Set while the clock is stopped (paused/break). */
  pausedAt?: string | Date | null;
  pausedTotalSeconds?: number;
  className?: string;
  /** Render hours even when under 1h (00:12:34 vs 12:34). */
  alwaysShowHours?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const ms = (d: string | Date | null | undefined): number | null => {
  if (!d) return null;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};

/** Same formula as the backend. Exported for tests. */
export function computeElapsedSeconds(
  props: Pick<ElapsedTimerProps, "startedAt" | "endedAt" | "pausedAt" | "pausedTotalSeconds">,
  now: number = Date.now()
): number {
  const started = ms(props.startedAt);
  if (started == null) return 0;

  const ended = ms(props.endedAt);
  const end = ended ?? now;
  if (end <= started) return 0;

  const gross = Math.floor((end - started) / 1000);

  let paused = Math.max(0, props.pausedTotalSeconds || 0);
  const pausedAt = ms(props.pausedAt);
  if (pausedAt != null) {
    // If the session ended while paused, the pause stops at endedAt.
    const boundary = ended ?? now;
    if (boundary > pausedAt) paused += Math.floor((boundary - pausedAt) / 1000);
  }

  return Math.max(0, gross - paused);
}

export function formatDuration(totalSeconds: number, alwaysShowHours = true): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h === 0 && !alwaysShowHours) return `${pad(m)}:${pad(sec)}`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

const SIZE_CLASS: Record<NonNullable<ElapsedTimerProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-2xl",
  xl: "text-5xl sm:text-6xl",
};

export function ElapsedTimer({
  startedAt,
  endedAt,
  pausedAt,
  pausedTotalSeconds = 0,
  className,
  alwaysShowHours = true,
  size = "md",
}: ElapsedTimerProps) {
  // A frozen session (ended, or paused) has no reason to re-render every second.
  const frozen = !!endedAt || !!pausedAt;

  const [seconds, setSeconds] = useState(() =>
    computeElapsedSeconds({ startedAt, endedAt, pausedAt, pausedTotalSeconds })
  );

  useEffect(() => {
    const recompute = () =>
      setSeconds(computeElapsedSeconds({ startedAt, endedAt, pausedAt, pausedTotalSeconds }));

    recompute();
    if (frozen) return;

    const id = setInterval(recompute, 1000);
    return () => clearInterval(id);
  }, [startedAt, endedAt, pausedAt, pausedTotalSeconds, frozen]);

  const text = useMemo(() => formatDuration(seconds, alwaysShowHours), [seconds, alwaysShowHours]);

  return (
    <span
      className={cn("font-mono tabular-nums tracking-tight", SIZE_CLASS[size], frozen && "opacity-60", className)}
      // Announce the value, but don't spam screen readers every second.
      aria-label={`Elapsed time ${text}`}
      role="timer"
    >
      {text}
    </span>
  );
}
