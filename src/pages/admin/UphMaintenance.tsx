import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, RefreshCw, Search } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;
const BASE_PATH = "/api/external/maintenance";
const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";

const UPH_BASE_URL = String(
  import.meta.env.VITE_UPH_MAINTENANCE_API_URL ||
    import.meta.env.VITE_MAINTENANCE_API_URL ||
    import.meta.env.VITE_API_URL ||
    runtimeOrigin,
).trim();

const UPH_API_KEY = String(
  import.meta.env.VITE_UPH_MAINTENANCE_API_KEY ||
    import.meta.env.VITE_MAINTENANCE_API_KEY ||
    "",
).trim();

type RequestStatus = "new" | "in-progress" | "completed" | "closed" | string;

interface MaintenanceRequest {
  id?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  issueType?: string;
  entryPermission?: string;
  description?: string;
  status?: RequestStatus;
  adminComment?: string;
  comment?: string;
  attachmentUrl?: string;
  attachmentKey?: string;
  commentAttachmentUrl?: string;
  commentAttachmentKey?: string;
  mediaUrl?: string;
  media?: string | { url?: string };
  [key: string]: unknown;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ListResponse {
  requests?: MaintenanceRequest[];
  pagination?: Partial<PaginationState>;
}

const STATUS_FILTERS = ["all", "new", "in-progress", "completed", "closed"];
const UPDATE_STATUSES = ["in-progress", "completed", "closed", "new"];

function getRequestId(item: MaintenanceRequest) {
  return String(item._id || item.id || "").trim();
}

function textOrDash(value?: string) {
  const normalized = String(value || "").trim();
  return normalized || "—";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatusTone(status?: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
    case "closed":
      return "bg-slate-500/15 text-slate-700 border-slate-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30";
    default:
      return "bg-sky-500/15 text-sky-700 border-sky-500/30";
  }
}

function readJsonSafe<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function buildUrl(path = "", params?: URLSearchParams) {
  const base = UPH_BASE_URL.replace(/\/$/, "");
  const suffix = path ? `/${encodeURIComponent(path)}` : "";
  const query = params?.toString();
  return `${base}${BASE_PATH}${suffix}${query ? `?${query}` : ""}`;
}

function buildHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  if (UPH_API_KEY) {
    headers.set("Authorization", `Bearer ${UPH_API_KEY}`);
    headers.set("x-api-key", UPH_API_KEY);
  }
  return headers;
}

function extractTenantAttachmentUrl(item: MaintenanceRequest | null) {
  if (!item) return "";
  if (typeof item.attachmentUrl === "string") return item.attachmentUrl;
  if (typeof item.mediaUrl === "string") return item.mediaUrl;
  if (typeof item.media === "string") return item.media;
  if (item.media && typeof item.media === "object" && typeof item.media.url === "string") {
    return item.media.url;
  }
  return "";
}

function extractCommentAttachmentUrl(item: MaintenanceRequest | null) {
  if (!item) return "";
  if (typeof item.commentAttachmentUrl === "string") return item.commentAttachmentUrl;
  return "";
}

const UphMaintenance: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const [nextStatus, setNextStatus] = useState("in-progress");
  const [adminComment, setAdminComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const hasConfig = Boolean(UPH_BASE_URL);
  const hasApiKey = Boolean(UPH_API_KEY);

  const fetchList = useCallback(async () => {
    if (!hasConfig) {
      setListError("Missing UPH API base URL configuration.");
      setLoadingList(false);
      return;
    }

    setLoadingList(true);
    setListError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (appliedSearch) params.set("search", appliedSearch);

      const response = await fetch(buildUrl("", params), {
        method: "GET",
        headers: buildHeaders(),
      });

      const text = await response.text();
      const payload = readJsonSafe<ListResponse>(text);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error?: string }).error || "Failed to fetch requests.")
            : "Failed to fetch requests.";
        throw new Error(message);
      }

      const nextItems = Array.isArray(payload?.requests) ? payload?.requests : [];
      const nextPagination = payload?.pagination || {};

      setRequests(nextItems);
      setPagination({
        page: Number(nextPagination.page || page),
        pageSize: Number(nextPagination.pageSize || DEFAULT_PAGE_SIZE),
        total: Number(nextPagination.total || nextItems.length),
        totalPages: Number(nextPagination.totalPages || 1),
      });

      setSelectedRequestId((currentId) => {
        const selectedStillExists = nextItems.some((item) => getRequestId(item) === currentId);
        if (!currentId || !selectedStillExists) {
          return getRequestId(nextItems[0] || {});
        }
        return currentId;
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to fetch requests.");
      setRequests([]);
    } finally {
      setLoadingList(false);
    }
  }, [appliedSearch, hasConfig, page, statusFilter]);

  const fetchDetail = useCallback(async (requestId: string) => {
    if (!requestId || !hasConfig) {
      setSelectedRequest(null);
      return;
    }

    setLoadingDetail(true);
    setDetailError(null);

    try {
      const response = await fetch(buildUrl(requestId), {
        method: "GET",
        headers: buildHeaders(),
      });

      const text = await response.text();
      const payload = readJsonSafe<MaintenanceRequest>(text);

      if (!response.ok || !payload) {
        throw new Error("Failed to fetch request details.");
      }

      setSelectedRequest(payload);
      setNextStatus(String(payload.status || "in-progress"));
      setAdminComment(String(payload.adminComment || payload.comment || ""));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to fetch request details.");
      setSelectedRequest(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [hasConfig]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!selectedRequestId) {
      setSelectedRequest(null);
      return;
    }
    fetchDetail(selectedRequestId);
  }, [fetchDetail, selectedRequestId]);

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const onUpdateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequestId || !hasConfig) return;

    setUpdating(true);
    setActionNotice(null);
    setDetailError(null);

    try {
      let response: Response;

      if (attachment) {
        const formData = new FormData();
        formData.append("status", nextStatus);
        if (adminComment.trim()) {
          formData.append("comment", adminComment.trim());
        }
        formData.append("media", attachment);

        response = await fetch(buildUrl(selectedRequestId), {
          method: "PATCH",
          headers: buildHeaders(),
          body: formData,
        });
      } else {
        response = await fetch(buildUrl(selectedRequestId), {
          method: "PATCH",
          headers: buildHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            status: nextStatus,
            comment: adminComment.trim() || undefined,
          }),
        });
      }

      const text = await response.text();
      const payload = readJsonSafe<MaintenanceRequest>(text);

      if (!response.ok) {
        throw new Error("Failed to update maintenance request.");
      }

      if (payload) {
        setSelectedRequest(payload);
      }

      setActionNotice("Maintenance request updated successfully.");
      setAttachment(null);
      setFileInputKey((value) => value + 1);
      await fetchList();
      await fetchDetail(selectedRequestId);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to update request.");
    } finally {
      setUpdating(false);
    }
  };

  const tenantAttachmentUrl = useMemo(
    () => extractTenantAttachmentUrl(selectedRequest),
    [selectedRequest],
  );
  const commentAttachmentUrl = useMemo(
    () => extractCommentAttachmentUrl(selectedRequest),
    [selectedRequest],
  );
  const tenantAttachmentKey = String(selectedRequest?.attachmentKey || "").trim();
  const commentAttachmentKey = String(selectedRequest?.commentAttachmentKey || "").trim();
  const hasTenantAttachment = Boolean(tenantAttachmentUrl || tenantAttachmentKey);
  const hasCommentAttachment = Boolean(commentAttachmentUrl || commentAttachmentKey);

  return (
    <div className="min-h-screen bg-zinc-50/60">
      <header className="border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/uph.jpeg" alt="UPH" className="h-11 w-11 rounded-2xl object-cover" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Ultimate Property Holdings
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Maintenance Requests
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-10 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest"
            onClick={() => {
              fetchList();
              if (selectedRequestId) {
                fetchDetail(selectedRequestId);
              }
            }}
            disabled={loadingList || loadingDetail}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", (loadingList || loadingDetail) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {!hasApiKey && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Missing API Key</CardTitle>
              <CardDescription className="text-amber-700">
                Set <code>VITE_UPH_MAINTENANCE_API_KEY</code> (or <code>VITE_MAINTENANCE_API_KEY</code>) to authenticate requests.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Maintenance Queue</CardTitle>
            <CardDescription>Filter and inspect incoming maintenance tickets from UPH.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearchSubmit} className="grid gap-3 md:grid-cols-[200px_1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="uph-status-filter" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Status
                </Label>
                <select
                  id="uph-status-filter"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All statuses" : status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uph-search" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Search Name
                </Label>
                <Input
                  id="uph-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by tenant name"
                />
              </div>

              <Button type="submit" className="h-10 self-end">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="min-h-[480px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Requests</CardTitle>
              <CardDescription>
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)} • {pagination.total} total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingList ? (
                <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading maintenance requests...
                </div>
              ) : listError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{listError}</div>
              ) : requests.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-zinc-500">No maintenance requests found.</div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Name</th>
                          <th className="px-3 py-2 font-semibold">Issue</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((item) => {
                          const requestId = getRequestId(item);
                          const isActive = selectedRequestId === requestId;

                          return (
                            <tr
                              key={requestId || `${item.name}-${item.createdAt}`}
                              onClick={() => setSelectedRequestId(requestId)}
                              className={cn(
                                "cursor-pointer border-t transition-colors",
                                isActive ? "bg-sky-50" : "hover:bg-zinc-50",
                              )}
                            >
                              <td className="px-3 py-2 font-medium text-zinc-900">{textOrDash(item.name)}</td>
                              <td className="px-3 py-2 text-zinc-700">{textOrDash(item.issueType)}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", getStatusTone(String(item.status || "new")))}>
                                  {item.status || "new"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-zinc-500">{formatDate(item.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={loadingList || page <= 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-zinc-500">Page {pagination.page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(Math.max(pagination.totalPages, 1), value + 1))}
                  disabled={loadingList || page >= Math.max(pagination.totalPages, 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[480px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Request Detail</CardTitle>
              <CardDescription>Inspect and update status, comment, and optional attachment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDetail ? (
                <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading request detail...
                </div>
              ) : !selectedRequest ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-zinc-500">Select a request to inspect details.</div>
              ) : (
                <>
                  <div className="grid gap-3 rounded-lg border bg-zinc-50/70 p-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Ticket ID</p>
                      <p className="text-sm font-medium text-zinc-900">{textOrDash(getRequestId(selectedRequest))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tenant</p>
                      <p className="text-sm font-medium text-zinc-900">{textOrDash(selectedRequest.name)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Phone</p>
                      <p className="text-sm text-zinc-700">{textOrDash(selectedRequest.phone)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Email</p>
                      <p className="text-sm text-zinc-700">{textOrDash(selectedRequest.email)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Address</p>
                      <p className="text-sm text-zinc-700">{textOrDash(selectedRequest.address)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Issue Type</p>
                      <p className="text-sm text-zinc-700">{textOrDash(selectedRequest.issueType)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Entry Permission</p>
                      <p className="text-sm text-zinc-700">{textOrDash(selectedRequest.entryPermission)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Current Status</p>
                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", getStatusTone(String(selectedRequest.status || "new")))}>
                        {selectedRequest.status || "new"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Created</p>
                      <p className="text-sm text-zinc-700">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Updated</p>
                      <p className="text-sm text-zinc-700">{formatDate(selectedRequest.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status Updated</p>
                      <p className="text-sm text-zinc-700">{formatDate(selectedRequest.statusUpdatedAt)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Description</p>
                      <p className="whitespace-pre-wrap text-sm text-zinc-700">{textOrDash(selectedRequest.description)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Existing Admin Comment</p>
                      <p className="whitespace-pre-wrap text-sm text-zinc-700">{textOrDash(selectedRequest.adminComment)}</p>
                    </div>
                  </div>

                  {(hasTenantAttachment || hasCommentAttachment) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {hasTenantAttachment && (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Tenant Attachment
                          </p>
                          {tenantAttachmentKey && (
                            <p className="mb-2 text-xs text-zinc-600">Key: {tenantAttachmentKey}</p>
                          )}
                          {tenantAttachmentUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => window.open(tenantAttachmentUrl, "_blank")}
                            >
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Open
                            </Button>
                          )}
                        </div>
                      )}

                      {hasCommentAttachment && (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Comment Attachment
                          </p>
                          {commentAttachmentKey && (
                            <p className="mb-2 text-xs text-zinc-600">Key: {commentAttachmentKey}</p>
                          )}
                          {commentAttachmentUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => window.open(commentAttachmentUrl, "_blank")}
                            >
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Open
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={onUpdateRequest} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="uph-next-status" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        New Status
                      </Label>
                      <select
                        id="uph-next-status"
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        required
                      >
                        {UPDATE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="uph-comment" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Admin Comment
                      </Label>
                      <Textarea
                        id="uph-comment"
                        value={adminComment}
                        onChange={(event) => setAdminComment(event.target.value)}
                        placeholder="Optional note for tenant status email"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="uph-media" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Attachment (optional)
                      </Label>
                      <Input
                        key={fileInputKey}
                        id="uph-media"
                        type="file"
                        onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Request"
                      )}
                    </Button>
                  </form>
                </>
              )}

              {detailError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailError}</div>}
              {actionNotice && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{actionNotice}</div>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UphMaintenance;
