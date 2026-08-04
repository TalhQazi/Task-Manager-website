import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/manger/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { Bug, Plus, Search } from "lucide-react";

import BugDashboardAnalytics from "@/components/bugs/BugDashboardAnalytics";
import ReportBugModal from "@/components/bugs/ReportBugModal";
import BugCollaborationModal from "@/components/bugs/BugCollaborationModal";

type BugItem = {
  id: string;
  title: string;
  description: string;
  status?: string;
  severity?: string;
  priority?: string;
  module?: string;
  taskTitle?: string;
  createdByUsername?: string;
  createdByRole?: string;
  assignedDeveloperName?: string;
  createdAt?: string;
  source?: { panel?: string; path?: string };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
};

function toText(v: unknown) {
  return typeof v === "string" ? v : "";
}

export default function ManagerBugs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BugItem[]>([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 25;

  const [collabOpen, setCollabOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);

  const load = async (targetPage = page) => {
    try {
      setLoading(true);
      setApiError(null);

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(limit));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());

      const res = await apiFetch<{ items?: any[]; pagination?: { totalItems: number; totalPages: number; currentPage: number } }>(
        `/api/bugs?${params.toString()}`
      );

      const list = Array.isArray(res?.items) ? res.items : [];
      const mapped: BugItem[] = list
        .map((x: any) => ({
          id: String(x.id || x._id || ""),
          title: toText(x.title),
          description: toText(x.description),
          status: toText(x.status || "OPEN"),
          severity: toText(x.severity || "medium"),
          priority: toText(x.priority || "medium"),
          module: toText(x.module),
          taskTitle: toText(x.taskTitle),
          createdByUsername: toText(x.createdByUsername),
          createdByRole: toText(x.createdByRole),
          assignedDeveloperName: toText(x.assignedDeveloperName),
          createdAt: toText(x.createdAt),
          source: x.source && typeof x.source === "object" ? x.source : undefined,
          attachments: Array.isArray(x.attachments) ? x.attachments : [],
        }))
        .filter((x) => Boolean(x.id));

      setItems(mapped);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalItems(res.pagination.totalItems || list.length);
        setPage(res.pagination.currentPage || targetPage);
      } else {
        setTotalItems(list.length);
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, [statusFilter, q]);

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;

    setSelectedBugId(viewId);
    setCollabOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtered = items;

  const openBug = (b: BugItem) => {
    setSelectedBugId(b.id);
    setCollabOpen(true);
  };

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            Manager Bug Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review bug reports, track verification status, and collaborate with developers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading} size="sm">
            Refresh
          </Button>
          <Button onClick={() => setReportOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Report Bug
          </Button>
        </div>
      </div>

      {/* Analytics Widget */}
      <BugDashboardAnalytics />

      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm text-destructive">
          {apiError}
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm border">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search bugs..."
              className="h-9 text-xs sm:text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Quick Filter Chips (Replaces Mobile-Buggy Dropdown) */}
          <div className="overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              All Bugs
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "open" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "open" ? "all" : "open")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              Open Bugs
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "AWAITING_REPORTER_CONFIRMATION" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "AWAITING_REPORTER_CONFIRMATION" ? "all" : "AWAITING_REPORTER_CONFIRMATION")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              Awaiting Verify
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "closed" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "closed" ? "all" : "closed")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              Closed Bugs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border">
        <CardHeader className="px-4 sm:px-6 py-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            Bug Reports ({totalItems || filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Assigned Dev</TableHead>
                    <TableHead className="text-xs">Posted By</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openBug(b)}>
                      <TableCell>
                        <p className="font-semibold text-sm line-clamp-1">{b.title}</p>
                        {b.taskTitle && <p className="text-xs text-muted-foreground">Task: {b.taskTitle}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase font-medium">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {b.assignedDeveloperName || <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.createdByUsername || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs italic">
                        No bugs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <div>
                Showing <span className="font-semibold text-foreground">{Math.min((page - 1) * limit + 1, totalItems)}</span> to{" "}
                <span className="font-semibold text-foreground">{Math.min(page * limit, totalItems)}</span> of{" "}
                <span className="font-semibold text-foreground">{totalItems}</span> bugs
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void load(page - 1)}
                  disabled={page <= 1 || loading}
                  className="h-8 px-2.5 text-xs"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1 px-2 font-medium">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void load(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BugCollaborationModal
        bugId={selectedBugId}
        open={collabOpen}
        onOpenChange={setCollabOpen}
        onBugUpdated={() => void load()}
      />

      <ReportBugModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSuccess={() => void load()}
        defaultSourcePanel="manager"
      />
    </div>
  );
}
