// Typed wrappers over the WIP REST API. Reuses the existing apiFetch (auth,
// base-url, cache-busting) — no parallel HTTP client.

import { apiFetch } from "@/lib/admin/apiClient";
import type {
  WipSummary,
  WipListResponse,
  WipSessionDetail,
  WipActivityItem,
  WipFilterState,
  WipSettings,
  WipStatus,
  BlockerCategory,
  BlockerSeverity,
} from "./types";

function qs(params: Record<string, unknown> = {}): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const post = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

// --- Reads -----------------------------------------------------------------
export const getWipSummary = (filters: WipFilterState = {}) =>
  apiFetch<WipSummary>(`/api/dashboard/wip/summary${qs(filters as Record<string, unknown>)}`);

export const getWipSessions = (filters: WipFilterState = {}) =>
  apiFetch<WipListResponse>(`/api/dashboard/wip${qs(filters as Record<string, unknown>)}`);

/** Drawer-lazy: only called when a drawer opens. */
export const getWipSession = (id: string) =>
  apiFetch<WipSessionDetail>(`/api/dashboard/wip/${encodeURIComponent(id)}`);

export const getWipActivityFeed = (params: { since?: string; department?: string; project?: string; limit?: number } = {}) =>
  apiFetch<{ items: WipActivityItem[] }>(`/api/dashboard/wip/activity-feed${qs(params)}`);

export const getWipSettings = () =>
  apiFetch<{ settings: WipSettings }>("/api/dashboard/wip/settings");

export const updateWipSettings = (patch: Partial<WipSettings>) =>
  apiFetch<{ settings: WipSettings }>("/api/dashboard/wip/settings", {
    method: "PUT",
    body: JSON.stringify(patch),
  });

// --- Session lifecycle -----------------------------------------------------
export const startTask = (
  taskId: string,
  opts: { onConflict?: "reject" | "pause" | "complete" | "switch"; deviceType?: string; locationId?: string } = {}
) => post<{ session: unknown }>(`/api/tasks/${encodeURIComponent(taskId)}/start`, opts);

export const pauseSession = (id: string, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/pause`, { note });

export const resumeSession = (id: string, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/resume`, { note });

export const changeSessionStatus = (id: string, status: WipStatus, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/status`, { status, note });

export const updateSessionProgress = (id: string, progressPercent: number, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/progress`, { progressPercent, note });

export const completeSession = (id: string, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/complete`, { note });

export const heartbeatSession = (id: string, body: { deviceType?: string } = {}) =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/heartbeat`, body);

// --- Collaboration ---------------------------------------------------------
export const addSessionNote = (id: string, body: string, managerOnly = false) =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/notes`, { body, managerOnly });

export const addSessionUpload = (id: string, files: Array<{ fileName: string; url: string; mimeType?: string; size?: number }>, note = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/uploads`, { files, note });

export const respondToUpdate = (
  id: string,
  payload: { note?: string; progressPercent?: number; blockerStatus?: string }
) => post(`/api/work-sessions/${encodeURIComponent(id)}/respond-update`, payload);

// --- Manager actions -------------------------------------------------------
export const requestUpdate = (id: string, message = "") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/request-update`, { message });

export const forceStopSession = (id: string, reason: string) =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/force-stop`, { reason });

export const reassignSession = (id: string, newEmployeeId: string, reason: string, mode: "transfer" | "end" = "transfer") =>
  post(`/api/work-sessions/${encodeURIComponent(id)}/reassign`, { newEmployeeId, reason, mode });

// --- Blockers --------------------------------------------------------------
export const addBlocker = (
  taskId: string,
  payload: { reason: string; category: BlockerCategory; severity?: BlockerSeverity; blockedOn?: string; workSessionId?: string }
) => post(`/api/tasks/${encodeURIComponent(taskId)}/blockers`, payload);

export const resolveBlocker = (blockerId: string, resolutionNote = "") =>
  post(`/api/blockers/${encodeURIComponent(blockerId)}/resolve`, { resolutionNote });

// --- Reports ---------------------------------------------------------------
export const getReport = <T,>(name: string, params: Record<string, unknown> = {}) =>
  apiFetch<{ items: T[] }>(`/api/dashboard/wip/reports/${name}${qs(params)}`);
