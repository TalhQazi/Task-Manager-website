import { apiFetch } from "@/lib/api";

/* Shared types + API client for the multi-view Task Workspace.
 * Reuses the EXISTING /api/tasks endpoint plus the new additive routes. */

export interface TaskView {
  id: string;
  _id?: string;
  taskNumber?: number;
  title: string;
  description?: string;
  assignees: string[];
  teamLead?: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  category?: string;
  dueDate?: string | null;
  projectId?: string | null;
  executionPriority?: number | null;
  startedAt?: string | null;
  firstStartedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assignment?: string;
  projectId?: string;
  dueFrom?: string;
  dueTo?: string;
  sort?: string;
}

export interface TasksPage {
  items: TaskView[];
  page: number;
  totalPages: number;
  total: number;
}

function normalize(t: any): TaskView {
  return {
    ...t,
    id: t.id || t._id,
    assignees: Array.isArray(t.assignees) ? t.assignees : t.assignee ? [t.assignee] : [],
  };
}

export async function fetchTasksPage(filters: TaskFilters, page: number, limit = 100): Promise<TasksPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.assignment && filters.assignment !== "all") params.set("assignment", filters.assignment);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.dueFrom) params.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) params.set("dueTo", filters.dueTo);
  if (filters.sort) params.set("sort", filters.sort);

  const res = await apiFetch<{ items: any[]; totalPages: number; total: number }>(`/api/tasks?${params.toString()}`);
  return {
    items: (res.items || []).map(normalize),
    page,
    totalPages: res.totalPages || 1,
    total: res.total ?? (res.items || []).length,
  };
}

/* Reuse existing mutation endpoints — no new task-mutation APIs. */
export const updateTaskStatus = (id: string, status: string) =>
  apiFetch<{ item: any }>(`/api/tasks/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const updateTask = (id: string, payload: any) =>
  apiFetch<{ item: any }>(`/api/tasks/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });

/* New additive endpoints */
export interface WorkloadRow {
  assignee: string;
  active: number;
  highPriority: number;
  overdue: number;
  estimatedHours: number;
  weeklyHours: number | null;
  utilizationPct: number | null;
}
export interface TaskSummary {
  total: number;
  overdue: number;
  completedThisWeek: number;
  onTimePct: number;
  completionPct: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  throughput: Array<{ date: string; count: number }>;
}
export interface TaskDependency {
  _id: string;
  predecessorId: string;
  successorId: string;
  type: string;
  lagDays: number;
}

export const analytics = {
  summary: () => apiFetch<TaskSummary>("/api/task-analytics/summary"),
  kanban: () => apiFetch<{ counts: Record<string, number> }>("/api/task-analytics/kanban"),
  workload: () => apiFetch<{ items: WorkloadRow[] }>("/api/task-analytics/workload"),
};

export const dependencies = {
  list: (taskIds?: string[]) =>
    apiFetch<{ items: TaskDependency[] }>(`/api/task-dependencies${taskIds?.length ? `?taskIds=${taskIds.join(",")}` : ""}`),
  create: (body: { predecessorId: string; successorId: string; type?: string; lagDays?: number }) =>
    apiFetch<{ item: TaskDependency }>("/api/task-dependencies", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch(`/api/task-dependencies/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export interface SavedView {
  _id: string;
  name: string;
  viewType: string;
  filters: TaskFilters;
  sort?: string;
  isShared?: boolean;
  isDefault?: boolean;
}
export const savedViews = {
  list: () => apiFetch<{ items: SavedView[] }>("/api/task-saved-views"),
  save: (body: Partial<SavedView>) => apiFetch<{ item: SavedView }>("/api/task-saved-views", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch(`/api/task-saved-views/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const STATUS_COLUMNS: Array<{ key: TaskView["status"]; label: string; color: string }> = [
  { key: "pending", label: "Pending", color: "#64748b" },
  { key: "in-progress", label: "In Progress", color: "#3b82f6" },
  { key: "overdue", label: "Overdue", color: "#ef4444" },
  { key: "completed", label: "Completed", color: "#22c55e" },
];

export const PRIORITY_META: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  low: { label: "Low", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};
