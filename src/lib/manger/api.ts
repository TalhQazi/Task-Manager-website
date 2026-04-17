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
  return "http://localhost:5000";
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
