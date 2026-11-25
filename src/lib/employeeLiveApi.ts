import { apiFetch } from "@/lib/admin/apiClient";

export interface EmployeeInfo {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  company: string;
  status: string;
  shift: string;
  location?: string;
  avatarUrl?: string;
}

export type LiveStatusType =
  | "ACTIVE"
  | "ASSIGNED"
  | "PAUSED"
  | "BREAK"
  | "BLOCKED"
  | "REVIEW"
  | "AVAILABLE"
  | "OFFLINE"
  | "COMPLETED";

export type HealthType = "on-track" | "overdue" | "paused" | "blocked" | "review" | "completed";

export type ProgressSourceType = "MANUAL" | "TASK_WEIGHTED" | "MILESTONE" | "TIME_RATIO" | "EXTERNAL";

export interface CurrentAssignmentMetrics {
  id: string;
  employeeId: string;
  projectId: string | null;
  projectName: string;
  taskId: string | null;
  taskTitle: string;
  subtaskTitle?: string;
  status: LiveStatusType;
  priority: "low" | "medium" | "high" | "critical";
  progressPercent: number;
  progressSource: ProgressSourceType;
  startedAt: string | Date;
  activeElapsedSeconds: number;
  expectedActiveSeconds: number;
  expectedCompletionAt: string | Date | null;
  remainingActiveSeconds: number;
  overrunSeconds: number;
  isOverdue: boolean;
  health: HealthType;
  blockedReason?: string;
  pausedReason?: string;
  queuePosition: number;
  isOpenActive?: boolean;
}

export interface NextAssignmentInfo {
  id: string;
  projectId: string | null;
  projectName: string;
  taskId: string | null;
  taskTitle: string;
  priority: "low" | "medium" | "high" | "critical";
  queuePosition: number;
  estimatedNextStartAt: string | Date | null;
  status: string;
}

export interface EmployeeLiveCardData {
  employee: EmployeeInfo;
  liveStatus: LiveStatusType;
  currentAssignment: CurrentAssignmentMetrics | null;
  nextAssignment: NextAssignmentInfo | null;
  todayActiveSeconds: number;
  todayBlockedSeconds: number;
  serverTime: string;
}

export interface LiveOverviewSummary {
  activeEmployees: number;
  blockedEmployees: number;
  overdueAssignments: number;
  availableEmployees: number;
  employeesInReview: number;
  totalEmployees: number;
}

export interface LiveOverviewResponse {
  summary: LiveOverviewSummary;
  items: EmployeeLiveCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  serverTime: string;
}

export interface ActivityTimelineEvent {
  id: string;
  eventType: string;
  actorName: string;
  actorRole: string;
  previousState?: string | null;
  newState?: string | null;
  previousEstimate?: any;
  newEstimate?: any;
  reason?: string;
  note?: string;
  timestamp: string | Date;
  metadata?: any;
}

export interface SingleEmployeeLiveSnapshot {
  employee: EmployeeInfo;
  liveStatus: LiveStatusType;
  currentAssignment: CurrentAssignmentMetrics | null;
  nextAssignment: NextAssignmentInfo | null;
  queuedAssignments: Array<{
    id: string;
    taskTitle: string;
    projectName: string;
    priority: string;
    status: string;
    queuePosition: number;
    expectedActiveSeconds: number;
    expectedCompletionAt: string | Date | null;
    progressPercent: number;
  }>;
  recentActivity: ActivityTimelineEvent[];
  metricsToday: {
    totalActiveSeconds: number;
    totalBlockedSeconds: number;
    totalPausedSeconds: number;
    completedAssignmentsCount: number;
  };
  serverTime: string;
}

export interface EmployeeOverviewFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  project?: string;
  health?: string;
  sortBy?: "name" | "activeDuration" | "eta" | "overdue" | "priority" | "availability";
  sortDir?: "asc" | "desc";
}

export async function fetchEmployeeLiveOverview(
  params: EmployeeOverviewFilterParams = {}
): Promise<LiveOverviewResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.department && params.department !== "all") query.set("department", params.department);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.project && params.project !== "all") query.set("project", params.project);
  if (params.health && params.health !== "all") query.set("health", params.health);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  const qs = query.toString();
  return apiFetch<LiveOverviewResponse>(`/api/employees/live${qs ? `?${qs}` : ""}`);
}

export async function fetchSingleEmployeeLive(employeeId: string): Promise<SingleEmployeeLiveSnapshot> {
  return apiFetch<SingleEmployeeLiveSnapshot>(`/api/employees/${encodeURIComponent(employeeId)}/live`);
}

export async function fetchEmployeeActivity(
  employeeId: string,
  page = 1,
  limit = 20
): Promise<{
  items: ActivityTimelineEvent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  return apiFetch(
    `/api/employees/${encodeURIComponent(employeeId)}/activity?page=${page}&limit=${limit}`
  );
}

export async function createAssignment(payload: {
  employeeId: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  subtaskTitle?: string;
  priority?: "low" | "medium" | "high" | "critical";
  expectedActiveSeconds?: number;
  expectedCompletionAt?: string | Date;
  notes?: string;
}) {
  return apiFetch<{ success: boolean; item: any }>("/api/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function startAssignment(assignmentId: string) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/start`, {
    method: "POST",
  });
}

export async function pauseAssignment(assignmentId: string, reason = "Work paused") {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/pause`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function resumeAssignment(assignmentId: string) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/resume`, {
    method: "POST",
  });
}

export async function blockAssignment(assignmentId: string, reason: string) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function unblockAssignment(assignmentId: string, payload: { resumeWork?: boolean; resolution?: string } = {}) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/unblock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function switchAssignment(assignmentId: string, toAssignmentId: string) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/switch`, {
    method: "POST",
    body: JSON.stringify({ toAssignmentId }),
  });
}

export async function updateAssignmentEstimate(
  assignmentId: string,
  payload: { expectedActiveSeconds?: number; expectedCompletionAt?: string | Date; reason?: string }
) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/estimate`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAssignmentProgress(
  assignmentId: string,
  payload: { progressPercent: number; progressSource?: ProgressSourceType; note?: string }
) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function completeAssignment(assignmentId: string) {
  return apiFetch<{ success: boolean; item: any }>(`/api/assignments/${assignmentId}/complete`, {
    method: "POST",
  });
}
