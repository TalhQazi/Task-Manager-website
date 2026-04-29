import { setAuthState, type UserRole } from "./auth";
import { apiFetch } from "./api";

export type LoginResult = {
  role: UserRole;
  username: string;
};

type LoginApiResponse = {
  item: {
    token: string;
    role: UserRole;
    username: string;
  };
};

type MfaRequiredError = {
  error: {
    message: string;
    code: string;
  };
};

export async function login(username: string, password: string, mfaCode?: string): Promise<LoginResult> {
  const res = await apiFetch<LoginApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: username.trim(),
      email: username.trim(),
      password,
      ...(mfaCode ? { mfaCode } : {}),
    }),
  });

  setAuthState({
    isAuthenticated: true,
    role: res.item.role,
    username: res.item.username,
    token: res.item.token,
  });

  return { role: res.item.role, username: res.item.username };
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
