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

  const res = await fetch(url, {
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

// Admin Scrum Records API
export async function getAdminScrumRecords(params?: { from?: string; to?: string; employee?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.employee) query.append("employee", params.employee);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return apiFetch<{ items: Array<{ employeeName: string; employeeId: string | null; email: string; company: string; location: string; status: string; totalScrumRecords: number; latestRecord: string; records: Array<{ id: string; date: string; clockIn: string; clockOut: string; totalHours: number; scrum: string; createdAt: string }> }>; total: number }>(`/api/time-entries/scrum-records?${query.toString()}`);
}

export async function getAdminEmployeeScrumRecords(employeeName: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return apiFetch<{ items: Array<{ id: string; date: string; clockIn: string; clockOut: string; totalHours: number; scrum: string; createdAt: string }>; total: number; page: number; limit: number }>(`/api/time-entries/scrum-records/${encodeURIComponent(employeeName)}?${query.toString()}`);
}
