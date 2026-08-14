import { apiFetch } from "./api";

// API client wrapper that provides axios-like interface
export const apiClient = {
  get: async <T>(url: string): Promise<{ data: T }> => {
    try {
      const data = await apiFetch<T>(url);
      return { data };
    } catch (error) {
      throw error;
    }
  },
  
  post: async <T>(url: string, payload?: any): Promise<{ data: T }> => {
    try {
      const data = await apiFetch<T>(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { data };
    } catch (error) {
      throw error;
    }
  },
  
  put: async <T>(url: string, payload?: any): Promise<{ data: T }> => {
    try {
      const data = await apiFetch<T>(url, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return { data };
    } catch (error) {
      throw error;
    }
  },
  
  delete: async <T>(url: string): Promise<{ data: T }> => {
    try {
      const data = await apiFetch<T>(url, {
        method: "DELETE",
      });
      return { data };
    } catch (error) {
      throw error;
    }
  },
};

export type LoginResult =
  | { status: "needs-password-setup"; identifier: string }
  | { status: "role-not-defined" }
  | { status: "success"; role: string; username: string; name: string; token: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await apiFetch<any>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: username.trim(),
      email: username.trim(),
      password,
    }),
  });

  if (res.needsPasswordSetup) {
    return { status: "needs-password-setup", identifier: res.identifier };
  }

  if (res.roleNotDefined) {
    return { status: "role-not-defined" };
  }

  return {
    status: "success",
    role: res.item.role,
    username: res.item.username,
    name: res.item.name || res.item.username,
    token: res.item.token,
  };
}

export async function setupPassword(identifier: string, newPassword: string): Promise<void> {
  await apiFetch<any>("/api/auth/setup-password", {
    method: "POST",
    body: JSON.stringify({ identifier, newPassword }),
  });
}

export async function requestForgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  return await apiFetch<{ ok: boolean; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  return await apiFetch<{ ok: boolean; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
  });
}

export async function listResource<T>(resource: string): Promise<T[]> {
  const res = await apiFetch<{ items?: T[] } | T[]>(`/api/${resource}`);
  if (Array.isArray(res)) return res;
  return res.items ?? [];
}

export async function createResource<T, Payload extends Record<string, unknown> | unknown>(
  resource: string,
  payload: Payload,
): Promise<T> {
  const res = await apiFetch<{ item?: T } | T>(`/api/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (typeof res === "object" && res !== null && "item" in res) {
    return (res as { item?: T }).item as T;
  }
  return res as T;
}

export async function updateResource<T, Payload extends Record<string, unknown> | unknown>(
  resource: string,
  id: string,
  payload: Payload,
): Promise<T> {
  const res = await apiFetch<{ item?: T } | T>(`/api/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (typeof res === "object" && res !== null && "item" in res) {
    return (res as { item?: T }).item as T;
  }
  return res as T;
}

export async function deleteResource(resource: string, id: string): Promise<void> {
  await apiFetch<void>(`/api/${resource}/${id}`, {
    method: "DELETE",
  });
}
