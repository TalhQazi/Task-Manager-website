import { apiFetch } from "@/lib/api";

/* Typed client for the Knowledge Vault v2 API (/api/knowledge/v2).
 * Backed by the same apiFetch (auth token handling) as the rest of the app. */

const BASE = "/api/knowledge/v2";

export interface KvNote {
  id: string;
  _id?: string;
  title: string;
  content?: string;
  body?: { plain?: string; markdown?: string; html?: string; format?: string };
  tags?: string[];
  color?: string;
  folder?: string;
  folderId?: string | null;
  categoryId?: string | null;
  status?: "draft" | "active" | "archived" | "published";
  priority?: "low" | "normal" | "high" | "critical";
  visibility?: "private" | "org" | "shared" | "public";
  isPinned?: boolean;
  isFavorite?: boolean;
  isImportant?: boolean;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
  ai?: { summary?: string; keywords?: string[]; classification?: string };
}

export interface KvFolder {
  _id: string;
  name: string;
  parentId?: string | null;
  path?: string;
  color?: string;
  noteCount?: number;
}

export interface KvSuggestion {
  _id: string;
  noteId: string;
  type: "tag" | "summary" | "keywords" | "category" | "folder" | "merge" | "link";
  payload: any;
  confidence: number;
  status: string;
}

export interface KvVersion {
  _id: string;
  version: number;
  reason?: string;
  editorId?: string;
  createdAt?: string;
  snapshot?: any;
}

export interface KvListResult {
  items: KvNote[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function qs(params: Record<string, any> = {}): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const post = (path: string, body?: any) =>
  apiFetch(path, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) });

export const kvApi = {
  health: () => apiFetch<{ ok: boolean; module: string; version: string }>(`${BASE}/health`),

  // Notes
  listNotes: (params: Record<string, any> = {}) => apiFetch<KvListResult>(`${BASE}/notes${qs(params)}`),
  getNote: (id: string) => apiFetch<{ item: KvNote }>(`${BASE}/notes/${encodeURIComponent(id)}`),
  createNote: (body: Partial<KvNote>) => apiFetch<{ item: KvNote }>(`${BASE}/notes`, { method: "POST", body: JSON.stringify(body) }),
  updateNote: (id: string, body: Partial<KvNote> & { expectedVersion?: number }) =>
    apiFetch<{ item: KvNote }>(`${BASE}/notes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNote: (id: string) => apiFetch<{ ok: true }>(`${BASE}/notes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  restoreNote: (id: string) => post(`${BASE}/notes/${encodeURIComponent(id)}/restore`),
  toggle: (id: string, flag: "pin" | "favorite" | "important", value = true) =>
    apiFetch<{ item: KvNote }>(`${BASE}/notes/${encodeURIComponent(id)}/${flag}`, { method: "POST", body: JSON.stringify({ value }) }),
  versions: (id: string) => apiFetch<{ items: KvVersion[] }>(`${BASE}/notes/${encodeURIComponent(id)}/versions`),
  restoreVersion: (id: string, version: number) => post(`${BASE}/notes/${encodeURIComponent(id)}/versions/${version}/restore`),
  analyze: (id: string) => apiFetch<{ items: KvSuggestion[] }>(`${BASE}/notes/${encodeURIComponent(id)}/analyze`, { method: "POST" }),

  // Taxonomy
  listFolders: () => apiFetch<{ items: KvFolder[] }>(`${BASE}/folders`),
  createFolder: (body: { name: string; parentId?: string | null; color?: string }) =>
    apiFetch<{ item: KvFolder }>(`${BASE}/folders`, { method: "POST", body: JSON.stringify(body) }),
  deleteFolder: (id: string) => apiFetch(`${BASE}/folders/${encodeURIComponent(id)}`, { method: "DELETE" }),
  listTags: () => apiFetch<{ items: Array<{ _id: string; name: string; usageCount: number }> }>(`${BASE}/tags`),

  // Search
  search: (q: string, mode: "text" | "semantic" | "hybrid" = "text") =>
    apiFetch<{ items: KvNote[]; mode: string }>(`${BASE}/search${qs({ q, mode })}`),

  // AI suggestions
  suggestions: (status = "pending") => apiFetch<{ items: KvSuggestion[] }>(`${BASE}/ai/suggestions${qs({ status })}`),
  acceptSuggestion: (id: string) => post(`${BASE}/ai/suggestions/${encodeURIComponent(id)}/accept`),
  rejectSuggestion: (id: string) => post(`${BASE}/ai/suggestions/${encodeURIComponent(id)}/reject`),
};
