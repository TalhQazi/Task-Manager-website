import { clearAuthState, getAuthState, setAuthState } from "@/lib/auth";

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

export function _getApiBaseUrl() {
  const raw = String(import.meta.env.VITE_API_URL || "https://task.se7eninc.com").trim();
  if (raw) return raw;
  // Always use Vercel backend URL
   return "https://task.se7eninc.com";
  
}

export function getApiBaseUrl() {
  const apiBase = String(import.meta.env.VITE_API_URL || "https://task.se7eninc.com").trim();

  if (!apiBase) {
    throw new Error("VITE_API_URL is not set");
  }

  return apiBase;
}

/**
 * Convert an S3 URL to a backend-proxied URL to avoid CORS/OpaqueResponseBlocking issues.
 * If the URL is not an S3 URL (e.g. data: or already proxied), returns it unchanged.
 */
export function toProxiedUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  // Don't proxy data: URLs, already-proxied URLs, or non-S3 URLs
  if (url.startsWith("data:") || url.includes("/api/s3-proxy/")) return url;
  
  // Match S3 URLs pattern: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const s3Match = url.match(/https:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/);
  if (!s3Match) return url;
  
  const s3Key = s3Match[1];
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const token = getAuthState().token;
  return `${baseUrl}/api/s3-proxy/${s3Key}${token ? `?token=${token}` : ""}`;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // const baseUrl = "https://task.se7eninc.com";
  const baseUrl = getApiBaseUrl();
  const url = `${String(baseUrl).replace(/\/$/, "")}${path}`;

  const auth = getAuthState();
  const headers = new Headers(init?.headers);

  // Cache busting for GET requests
  let finalUrl = url;
  if (init?.method === "GET" || !init?.method) {
    const connector = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${connector}_cb=${Date.now()}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && 
    !!init?.body &&
    init.body instanceof FormData;

  if (!headers.has("Content-Type") && init?.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (auth.isAuthenticated && auth.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const res = await fetch(finalUrl, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    clearAuthState();
  }

  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as ApiErrorBody | string | null;
    const msg = typeof body === "string" ? body : body?.error?.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }

  return (await parseJsonSafe(res)) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, {
    method: "GET",
  });
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export type LoginResponse = {
  item: {
    token: string;
    username: string;
    role: "super-admin" | "admin" | "manager";
  };
};

export async function login(username: string, password: string) {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, email: username, password }),
  });

  setAuthState({
    isAuthenticated: true,
    token: data.item.token,
    username: data.item.username,
    role: data.item.role,
  });

  return data;
}

export type CrudResource =
  | "tasks"
  | "users"
  | "employees"
  | "vehicles"
  | "locations"
  | "schedules"
  | "notifications"
  | "time-entries"
  | "onboarding"
  | "do-not-hire"
  | "companies";

type ListResponse<T> = { items?: T[] } | T[];

function resourcePath(resource: CrudResource) {
  if (resource === "time-entries") return "/api/time-entries";
  if (resource === "do-not-hire") return "/api/do-not-hire";
  if (resource === "companies") return "/api/companies";
  return `/api/${resource}`;
}

export async function listResource<T>(resource: CrudResource, params?: Record<string, string | number | undefined>) {
  const urlParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.append(key, String(value));
      }
    });
  }
  const qs = urlParams.toString() ? `?${urlParams.toString()}` : "";
  const res = await apiFetch<ListResponse<T> & { pagination?: any }>(`${resourcePath(resource)}${qs}`);
  
  if (Array.isArray(res)) return res;
  
  // Return as an object if pagination is present, otherwise just the items
  if (res.pagination) {
    return {
      items: res.items ?? [],
      pagination: res.pagination
    } as any;
  }
  
  return (res.items ?? []) as any;
}

export async function createResource<T>(resource: CrudResource, payload: unknown) {
  return apiFetch<T>(resourcePath(resource), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateResource<T>(resource: CrudResource, id: string, payload: unknown) {
  return apiFetch<T>(`${resourcePath(resource)}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteResource(resource: CrudResource, id: string) {
  return apiFetch<{ ok: true }>(`${resourcePath(resource)}/${encodeURIComponent(id)}`, { 
    method: "DELETE",
  });
}

// Download task attachment with authentication
export async function downloadTaskAttachment(
  taskId: string,
  attachmentIndex: number,
  fileName: string
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${String(baseUrl).replace(/\/$/, "")}/api/tasks/${encodeURIComponent(taskId)}/attachments/${attachmentIndex}/download`;
  
  const auth = getAuthState();
  
  const res = await fetch(url, {
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
  });
  
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(objectUrl);
}

// Download any URL with authentication
export async function downloadViaUrl(url: string, fileName: string): Promise<void> {
  const auth = getAuthState();
  
  // Use fetch to get the blob with headers
  const res = await fetch(url, {
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
  });
  
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(objectUrl);
}

// Admin Scrum Records API
export async function getAdminScrumRecords(params?: { from?: string; to?: string; employee?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.employee) query.append("employee", params.employee);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return apiFetch<{ items: Array<{ employeeName: string; employeeId: string | null; email: string; company: string; phone: string; status: string; totalScrumRecords: number; latestRecord: string; records: Array<{ id: string; date: string; clockIn: string; clockOut: string; totalHours: number; scrum: string; createdAt: string }> }>; total: number }>(`/api/time-entries/scrum-records?${query.toString()}`);
}

export async function getAdminEmployeeScrumRecords(employeeName: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return apiFetch<{ items: Array<{ id: string; date: string; clockIn: string; clockOut: string; totalHours: number; scrum: string; createdAt: string }>; total: number; page: number; limit: number }>(`/api/time-entries/scrum-records/${encodeURIComponent(employeeName)}?${query.toString()}`);
}

// Contributor API
export interface Contributor {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  stats: {
    totalTasksCreated: number;
    totalTasksUpdated: number;
    totalTasksCompleted: number;
    totalProjectsContributed: number;
    totalTimeSpent: number;
    lastContributionAt?: string;
  };
  projects: Array<{
    projectId: string;
    projectName: string;
    firstContributionAt: string;
    lastContributionAt: string;
    contributionCount: number;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  _id: string;
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  contributorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  projectId?: string;
  projectName?: string;
  description: string;
  changes?: Array<{ field: string; oldValue: any; newValue: any }>;
  timeSpent?: number;
  impact: string;
  createdAt: string;
}

export async function getContributors(params?: { search?: string; role?: string; projectId?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.role) query.append("role", params.role);
  if (params?.projectId) query.append("projectId", params.projectId);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  return apiFetch<{ items: Contributor[]; total: number; page: number; limit: number; totalPages: number }>(`/api/contributors?${query.toString()}`);
}

export async function getTopContributors(params?: { limit?: number; projectId?: string; role?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.projectId) query.append("projectId", params.projectId);
  if (params?.role) query.append("role", params.role);
  return apiFetch<{ items: Contributor[]; total: number }>(`/api/contributors/top?${query.toString()}`);
}

export async function getContributor(userId: string) {
  return apiFetch<{ contributor: Contributor; recentContributions: Contribution[]; tasksWorkedOn: any[] }>(`/api/contributors/${userId}`);
}

export async function getContributorContributions(userId: string, params?: { resourceType?: string; action?: string; from?: string; to?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.resourceType) query.append("resourceType", params.resourceType);
  if (params?.action) query.append("action", params.action);
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  return apiFetch<{ items: Contribution[]; total: number; page: number; limit: number; totalPages: number }>(`/api/contributors/${userId}/contributions?${query.toString()}`);
}

export async function getTaskContributors(taskId: string) {
  return apiFetch<{ items: Array<{ userId: string; name: string; email: string; role: string; addedAt: string; contributionType: string; actions: string[]; avatar?: string; department?: string; stats?: any }>; total: number }>(`/api/contributors/task/${taskId}/contributors`);
}

export async function getTaskContributionHistory(taskId: string, limit?: number) {
  const query = new URLSearchParams();
  if (limit) query.append("limit", String(limit));
  return apiFetch<{ items: Contribution[]; total: number }>(`/api/contributors/task/${taskId}?${query.toString()}`);
}

export async function getProjectContributors(projectId: string) {
  return apiFetch<{ items: Array<{ userId: string; name: string; email: string; role: string; contributions: Contribution[]; stats: { tasksCreated: number; tasksUpdated: number; tasksCompleted: number; totalContributions: number } }>; total: number }>(`/api/contributors/project/${projectId}`);
}

export async function searchContributors(term: string, params?: { role?: string; projectId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.role) query.append("role", params.role);
  if (params?.projectId) query.append("projectId", params.projectId);
  if (params?.limit) query.append("limit", String(params.limit));
  return apiFetch<{ items: Contributor[]; total: number }>(`/api/contributors/search/${encodeURIComponent(term)}?${query.toString()}`);
}

// Comment edit and delete APIs
export async function updateComment(taskId: string, commentId: string, payload: { message?: string; attachments?: any[] }) {
  return apiFetch<{ item: { id: string; taskId: string; message: string; authorUserId: string; authorUsername: string; authorRole: string; attachments: any[]; createdAt: string; updatedAt: string } }>(
    `/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteComment(taskId: string, commentId: string) {
  return apiFetch<{ ok: boolean; message: string }>(
    `/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
    }
  );
}

// EOD Reports API for Admin
export async function getAdminEODReports(params?: { date?: string; employeeId?: string; status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.employeeId) qs.set("employeeId", params.employeeId);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const queryString = qs.toString();
  return apiFetch<{
    items: Array<{
      id: string;
      userId: string;
      employeeName: string;
      date: string;
      rawInput: string;
      inputType: string;
      status: "submitted" | "missing" | "late";
      createdAt: string;
      clockIn?: string;
      clockOut?: string;
      totalHours?: number;
    }>;
    total: number;
    page: number;
    limit: number;
  }>(`/api/admin/eod-reports${queryString ? `?${queryString}` : ""}`);
}

export async function getAdminEODStatus(date?: string) {
  const qs = date ? `?date=${date}` : "";
  return apiFetch<{
    items: Array<{
      employeeId: string;
      employeeName: string;
      status: "submitted" | "missing" | "late" | "not_clocked_in";
      clockIn?: string;
      clockOut?: string;
      reportSubmittedAt?: string;
    }>;
  }>(`/api/admin/eod-status${qs}`);
}

export async function getAdminEmployeeEODReports(employeeName: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const queryString = qs.toString();
  return apiFetch<{
    items: Array<{
      id: string;
      userId: string;
      employeeName: string;
      date: string;
      rawInput: string;
      inputType: string;
      status: string;
      createdAt: string;
      clockIn?: string;
      clockOut?: string;
      totalHours?: number;
    }>;
    total: number;
    page: number;
    limit: number;
  }>(`/api/admin/eod-reports?employee=${encodeURIComponent(employeeName)}${queryString ? `&${queryString}` : ""}`);
}

// Onboarding API functions
export async function getAdminOnboardingList(status?: string) {
  const queryString = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<{
    items: Array<{
      id: string;
      userId: string;
      employeeId: string;
      employeeName: string;
      basicInfo: {
        completed: boolean;
        email: string;
        phone: string;
        location: string;
      };
      identityVerification: {
        primaryId: {
          idType: string;
          frontImage: string;
          backImage: string;
          status: string;
        };
        secondaryId: {
          idType: string;
          image: string;
          status: string;
        };
      };
      w4Form: {
        file: string;
        status: string;
      };
      employeeHandbook: {
        acknowledged: boolean;
        signature: string;
        signedAt: string;
        status: string;
      };
      digitalSignature: {
        signature: string;
        status: string;
      };
      overallStatus: string;
      progress: number;
      adminReview?: {
        reviewedBy: string;
        reviewedAt: string;
        comments: string;
        rejectionReason: string;
      };
      createdAt: string;
      updatedAt: string;
    }>;
  }>(`/api/onboarding/admin/all${queryString}`);
}

export async function getAdminOnboardingDetails(id: string) {
  return apiGet<{
    item: {
      id: string;
      userId: string;
      employeeId: string;
      employeeName: string;
      basicInfo: any;
      identityVerification: any;
      w4Form: any;
      employeeHandbook: any;
      digitalSignature: any;
      overallStatus: string;
      progress: number;
      adminReview?: any;
      createdAt: string;
      updatedAt: string;
    };
  }>(`/api/onboarding/admin/${id}`);
}

export async function approveOnboarding(id: string, comments?: string) {
  return apiPut(`/api/onboarding/admin/${id}/approve`, { comments: comments || "" });
}

export async function rejectOnboarding(id: string, reason: string) {
  return apiPut(`/api/onboarding/admin/${id}/reject`, { reason });
}
