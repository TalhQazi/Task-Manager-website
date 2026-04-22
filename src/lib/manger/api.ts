type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

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
  | "companies"
  | "notes";

type ListResponse<T> = { items?: T[] } | T[];

type StoredAuth = {
  token?: string | null;
};

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resourcePath(resource: CrudResource) {
  if (resource === "time-entries") return "/api/time-entries";
  if (resource === "do-not-hire") return "/api/do-not-hire";
  if (resource === "companies") return "/api/companies";
  return `/api/${resource}`;
}

export async function listResource<T>(resource: CrudResource, params?: { q?: string }) {
  const qs = params?.q ? `?q=${encodeURIComponent(params.q)}` : "";
  const res = await apiFetch<ListResponse<T>>(`${resourcePath(resource)}${qs}`);
  if (Array.isArray(res)) return res;
  return res.items ?? [];
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

function getApiBaseUrl(): string {
  const raw = String(import.meta.env.VITE_API_URL || "").trim();
  if (raw) return raw;
   return "https://task.se7eninc.com";
  //return "http://localhost:5000";
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
  const token = getStoredToken();
  return `${baseUrl}/api/s3-proxy/${s3Key}${token ? `?token=${token}` : ""}`;
}

function getStoredToken(): string | null {
  try {
    // Admin/manager token is stored under "taskflow_auth"
    const adminRaw = localStorage.getItem("taskflow_auth");
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw) as StoredAuth;
      if (typeof parsed.token === "string" && parsed.token) return parsed.token;
    }
    // Employee token fallback
    const empRaw = localStorage.getItem("employee_auth");
    if (!empRaw) return null;
    const parsed = JSON.parse(empRaw) as StoredAuth;
    return typeof parsed.token === "string" && parsed.token ? parsed.token : null;
  } catch {
    return null;
  }
}




export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${String(baseUrl).replace(/\/$/, "")}${path}`;

  const token = getStoredToken();

  const isFormData =
    typeof FormData !== "undefined" &&
    !!options.body &&
    options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await parseJsonSafe(res)) as ApiErrorPayload | string | null;
      if (typeof data === "string") {
        message = data || message;
      } else {
        message = data?.error?.message || message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await parseJsonSafe(res)) as T;
}

// Contributor API functions
export async function getTopContributors(limit = 5) {
  return apiFetch<{ contributors: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    stats: {
      totalTasksCreated: number;
      totalTasksUpdated: number;
      totalTasksCompleted: number;
    };
    projects: Array<{
      projectId: string;
      projectName: string;
      contributionCount: number;
    }>;
  }> }>(`/api/contributors/top?limit=${limit}`);
}

export async function getTaskContributors(taskId: string) {
  return apiFetch<{ items: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    contributionType: string;
    actions: string[];
    addedAt: string;
    avatar?: string;
    stats?: any;
  }> }>(`/api/contributors/task/${encodeURIComponent(taskId)}/contributors`);
}

// Download task attachment with authentication
export async function downloadTaskAttachment(
  taskId: string,
  attachmentIndex: number,
  fileName: string
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${String(baseUrl).replace(/\/$/, "")}/api/tasks/${encodeURIComponent(taskId)}/attachments/${attachmentIndex}/download`;
  
  const token = getStoredToken();
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

// Download any URL with authentication for Manager/Admin
export async function downloadViaUrl(url: string, fileName: string): Promise<void> {
  const token = getStoredToken();
  
  // Use fetch to get the blob with headers
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

// Comment edit and delete APIs
export async function updateComment(
  taskId: string,
  commentId: string,
  payload: { message: string }
): Promise<{ item: { id: string; message: string; updatedAt: string } }> {
  return apiFetch<{ item: { id: string; message: string; updatedAt: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(
  taskId: string,
  commentId: string
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
}

// EOD Report API functions for Manager
export async function getEODReports(params?: { date?: string; employeeId?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.employeeId) qs.set("employeeId", params.employeeId);
  if (params?.status) qs.set("status", params.status);
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
  }>(`/api/manager/eod-reports${queryString ? `?${queryString}` : ""}`);
}

export async function getEODStatus(date?: string) {
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
  }>(`/api/manager/eod-status${qs}`);
}
