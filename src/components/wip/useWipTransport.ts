import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

/**
 * Real-time transport seam for the WIP dashboard.
 *
 * Components never learn whether updates arrived by socket or by poll. When a
 * socket is connected we invalidate on server events; otherwise we fall back to
 * a 20s poll. Swapping the transport (SSE, Ably, change streams) means editing
 * only this file.
 *
 * Timers are NOT driven from here — ElapsedTimer ticks locally from startedAt.
 */

/** Server → client event names. Mirrors WIP_SOCKET_EVENTS on the backend. */
export const WIP_EVENTS = {
  SUMMARY_UPDATED: "wip.summary.updated",
  SESSION_STARTED: "wip.session.started",
  SESSION_PAUSED: "wip.session.paused",
  SESSION_RESUMED: "wip.session.resumed",
  SESSION_COMPLETED: "wip.session.completed",
  SESSION_PROGRESS_UPDATED: "wip.session.progressUpdated",
  SESSION_STATUS_CHANGED: "wip.session.statusChanged",
  SESSION_IDLE_WARNING: "wip.session.idleWarning",
  ACTIVITY_CREATED: "wip.activity.created",
  BLOCKER_CREATED: "wip.blocker.created",
  BLOCKER_RESOLVED: "wip.blocker.resolved",
} as const;

/** Every event that should invalidate the grid + summary. */
const MUTATION_EVENTS: string[] = [
  WIP_EVENTS.SUMMARY_UPDATED,
  WIP_EVENTS.SESSION_STARTED,
  WIP_EVENTS.SESSION_PAUSED,
  WIP_EVENTS.SESSION_RESUMED,
  WIP_EVENTS.SESSION_COMPLETED,
  WIP_EVENTS.SESSION_PROGRESS_UPDATED,
  WIP_EVENTS.SESSION_STATUS_CHANGED,
  WIP_EVENTS.BLOCKER_CREATED,
  WIP_EVENTS.BLOCKER_RESOLVED,
];

const POLL_INTERVAL_MS = 20_000;
/** Coalesce bursts of socket events into one refetch. */
const DEBOUNCE_MS = 400;

export interface WipTransportState {
  /** True when a live socket is delivering updates. */
  live: boolean;
  /** Timestamp of the last successful data refresh. Drives the stale indicator. */
  lastUpdateAt: Date | null;
  /** Seconds since the last refresh — TV mode marks stale data with this. */
  stale: boolean;
}

/**
 * Subscribe to WIP changes and invoke `onInvalidate` when data may have changed.
 * @param onInvalidate stable callback (wrap in useCallback)
 * @param staleAfterSeconds mark data stale after this long with no refresh
 */
export function useWipTransport(
  onInvalidate: () => void,
  { enabled = true, staleAfterSeconds = 60 }: { enabled?: boolean; staleAfterSeconds?: number } = {}
): WipTransportState {
  const { socket, isConnected } = useSocket();
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [stale, setStale] = useState(false);

  const cbRef = useRef(onInvalidate);
  cbRef.current = onInvalidate;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cbRef.current();
      setLastUpdateAt(new Date());
      setStale(false);
    }, DEBOUNCE_MS);
  };

  // Socket path.
  useEffect(() => {
    if (!enabled || !socket || !isConnected) return;
    const handler = () => fire();
    MUTATION_EVENTS.forEach((e) => socket.on(e, handler));
    return () => {
      MUTATION_EVENTS.forEach((e) => socket.off(e, handler));
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket, isConnected, enabled]);

  // Polling fallback — only when no live socket.
  useEffect(() => {
    if (!enabled || isConnected) return;
    const id = setInterval(() => {
      cbRef.current();
      setLastUpdateAt(new Date());
      setStale(false);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isConnected, enabled]);

  // Stale watchdog: if nothing refreshed within the window, say so out loud
  // rather than silently displaying frozen numbers.
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (!lastUpdateAt) return;
      setStale((Date.now() - lastUpdateAt.getTime()) / 1000 > staleAfterSeconds);
    }, 5000);
    return () => clearInterval(id);
  }, [lastUpdateAt, staleAfterSeconds, enabled]);

  // Seed the initial timestamp.
  useEffect(() => {
    if (enabled && !lastUpdateAt) setLastUpdateAt(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { live: isConnected, lastUpdateAt, stale };
}

/** Subscribe to idle prompts addressed to the current employee. */
export function useIdleWarning(onWarn: (payload: { workSessionId: string; tier: string; thresholdMinutes: number }) => void) {
  const { socket } = useSocket();
  const cbRef = useRef(onWarn);
  cbRef.current = onWarn;

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { workSessionId: string; tier: string; thresholdMinutes: number }) => cbRef.current(payload);
    socket.on(WIP_EVENTS.SESSION_IDLE_WARNING, handler);
    return () => {
      socket.off(WIP_EVENTS.SESSION_IDLE_WARNING, handler);
    };
  }, [socket]);
}
