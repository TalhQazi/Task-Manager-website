import { useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useWipTransport } from "./useWipTransport";
import * as api from "./wipApi";
import type { WipFilterState } from "./types";

/**
 * React Query hooks for the WIP dashboard.
 *
 * List/summary endpoints stay light and are invalidated by the transport layer.
 * Session detail (history, notes, evidence) is drawer-lazy: it is only fetched
 * when `sessionId` is non-null.
 */

const KEYS = {
  summary: (f: WipFilterState) => ["wip", "summary", f] as const,
  list: (f: WipFilterState) => ["wip", "list", f] as const,
  session: (id: string) => ["wip", "session", id] as const,
  feed: (f: Record<string, unknown>) => ["wip", "feed", f] as const,
  settings: () => ["wip", "settings"] as const,
};

/** Invalidate every WIP list/summary query. Used by the transport. */
function useWipInvalidator() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: ["wip", "summary"] });
    qc.invalidateQueries({ queryKey: ["wip", "list"] });
    qc.invalidateQueries({ queryKey: ["wip", "feed"] });
  }, [qc]);
}

export function useWipSummary(filters: WipFilterState = {}, opts: { enabled?: boolean; staleAfterSeconds?: number } = {}) {
  const invalidate = useWipInvalidator();
  const transport = useWipTransport(invalidate, opts);

  const query = useQuery({
    queryKey: KEYS.summary(filters),
    queryFn: () => api.getWipSummary(filters),
    staleTime: 10_000,
    enabled: opts.enabled !== false,
  });

  return { ...query, transport };
}

export function useWipSessions(filters: WipFilterState = {}, opts: { enabled?: boolean; staleAfterSeconds?: number } = {}) {
  const invalidate = useWipInvalidator();
  const transport = useWipTransport(invalidate, opts);

  const query = useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.getWipSessions(filters),
    staleTime: 10_000,
    placeholderData: (prev) => prev, // keep rows on screen while refetching
    enabled: opts.enabled !== false,
  });

  return { ...query, transport };
}

/** Drawer-lazy. Passing null keeps this query idle. */
export function useWipSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: KEYS.session(sessionId || ""),
    queryFn: () => api.getWipSession(sessionId as string),
    enabled: !!sessionId,
    staleTime: 5_000,
  });
}

export function useWipActivityFeed(params: { department?: string; project?: string; limit?: number } = {}) {
  const invalidate = useWipInvalidator();
  useWipTransport(invalidate);

  return useQuery({
    queryKey: KEYS.feed(params),
    queryFn: () => api.getWipActivityFeed(params),
    staleTime: 10_000,
  });
}

export function useWipSettings() {
  return useQuery({
    queryKey: KEYS.settings(),
    queryFn: () => api.getWipSettings(),
    staleTime: 60_000,
  });
}

/** Session mutations. Each invalidates the affected queries on success. */
export function useWipActions(sessionId?: string) {
  const qc = useQueryClient();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wip", "summary"] });
    qc.invalidateQueries({ queryKey: ["wip", "list"] });
    qc.invalidateQueries({ queryKey: ["wip", "feed"] });
    if (sessionId) qc.invalidateQueries({ queryKey: KEYS.session(sessionId) });
  };

  return {
    pause: useMutation({ mutationFn: (v: { id: string; note?: string }) => api.pauseSession(v.id, v.note), onSuccess: refresh }),
    resume: useMutation({ mutationFn: (v: { id: string; note?: string }) => api.resumeSession(v.id, v.note), onSuccess: refresh }),
    complete: useMutation({ mutationFn: (v: { id: string; note?: string }) => api.completeSession(v.id, v.note), onSuccess: refresh }),
    changeStatus: useMutation({
      mutationFn: (v: { id: string; status: Parameters<typeof api.changeSessionStatus>[1]; note?: string }) =>
        api.changeSessionStatus(v.id, v.status, v.note),
      onSuccess: refresh,
    }),
    updateProgress: useMutation({
      mutationFn: (v: { id: string; progressPercent: number; note?: string }) =>
        api.updateSessionProgress(v.id, v.progressPercent, v.note),
      onSuccess: refresh,
    }),
    forceStop: useMutation({ mutationFn: (v: { id: string; reason: string }) => api.forceStopSession(v.id, v.reason), onSuccess: refresh }),
    requestUpdate: useMutation({ mutationFn: (v: { id: string; message?: string }) => api.requestUpdate(v.id, v.message), onSuccess: refresh }),
    reassign: useMutation({
      mutationFn: (v: { id: string; newEmployeeId: string; reason: string; mode?: "transfer" | "end" }) =>
        api.reassignSession(v.id, v.newEmployeeId, v.reason, v.mode),
      onSuccess: refresh,
    }),
    addNote: useMutation({
      mutationFn: (v: { id: string; body: string; managerOnly?: boolean }) => api.addSessionNote(v.id, v.body, v.managerOnly),
      onSuccess: refresh,
    }),
    addBlocker: useMutation({
      mutationFn: (v: { taskId: string; reason: string; category: Parameters<typeof api.addBlocker>[1]["category"]; severity?: Parameters<typeof api.addBlocker>[1]["severity"]; workSessionId?: string }) =>
        api.addBlocker(v.taskId, v),
      onSuccess: refresh,
    }),
    resolveBlocker: useMutation({
      mutationFn: (v: { blockerId: string; note?: string }) => api.resolveBlocker(v.blockerId, v.note),
      onSuccess: refresh,
    }),
    startTask: useMutation({
      mutationFn: (v: { taskId: string; onConflict?: "reject" | "pause" | "complete" | "switch" }) =>
        api.startTask(v.taskId, { onConflict: v.onConflict }),
      onSuccess: refresh,
    }),
  };
}
