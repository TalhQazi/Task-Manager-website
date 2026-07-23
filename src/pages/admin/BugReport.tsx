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
import { Bug, Plus } from "lucide-react";

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

export default function Bugs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BugItem[]>([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [collabOpen, setCollabOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await apiFetch<{ items?: any[] }>("/api/bugs");
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
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId) return;

    setSelectedBugId(viewId);
    setCollabOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") {
      if (statusFilter === "open") list = list.filter((b) => ["OPEN", "TRIAGED", "IN_PROGRESS", "NEEDS_INFO", "REOPENED", "open"].includes(b.status || ""));
      else if (statusFilter === "closed") list = list.filter((b) => ["CLOSED_VERIFIED", "CLOSED_ADMIN_OVERRIDE", "closed"].includes(b.status || ""));
      else list = list.filter((b) => (b.status || "").toUpperCase() === statusFilter.toUpperCase());
    }

    if (severityFilter !== "all") {
      list = list.filter((b) => (b.severity || "").toLowerCase() === severityFilter.toLowerCase());
    }

    if (priorityFilter !== "all") {
      list = list.filter((b) => (b.priority || "").toLowerCase() === priorityFilter.toLowerCase());
    }

    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((b) => {
      const where = `${b.title} ${b.description} ${b.taskTitle || ""} ${b.createdByUsername || ""} ${b.assignedDeveloperName || ""} ${b.module || ""} ${b.source?.path || ""}`.toLowerCase();
      return where.includes(query);
    });
  }, [items, q, statusFilter, severityFilter, priorityFilter]);

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
            Complete Bug Collaboration Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            System bug reports, conversation threads, resolution workflows, and analytics.
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

      {/* Filters Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search bugs by title, module, developer, reporter..."
              className="h-9 text-xs sm:text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open (Active)</SelectItem>
                <SelectItem value="AWAITING_REPORTER_CONFIRMATION">Awaiting Verify</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bug Table */}
      <Card className="shadow-sm border">
        <CardHeader className="px-4 sm:px-6 py-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            Bugs ({filtered.length})
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
                    <TableHead className="text-xs">Title & Module</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Severity / Priority</TableHead>
                    <TableHead className="text-xs">Assigned Dev</TableHead>
                    <TableHead className="text-xs">Reported By</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openBug(b)}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm line-clamp-1">{b.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {b.module && <span>Module: {b.module}</span>}
                            {b.taskTitle && <span>Task: {b.taskTitle}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase font-medium">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        <div className="space-y-0.5">
                          <span className="block">Sev: {b.severity}</span>
                          <span className="block text-muted-foreground">Pri: {b.priority}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {b.assignedDeveloperName || <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.createdByUsername || "-"} {b.createdByRole ? `(${b.createdByRole})` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs italic">
                        No bugs found matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Modal */}
      <BugCollaborationModal
        bugId={selectedBugId}
        open={collabOpen}
        onOpenChange={setCollabOpen}
        onBugUpdated={() => void load()}
      />

      {/* Report Bug Modal */}
      <ReportBugModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSuccess={() => void load()}
        defaultSourcePanel="admin"
      />
    </div>
  );
}
