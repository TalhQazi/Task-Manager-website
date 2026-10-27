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
import { Bug, Plus, Search, Globe } from "lucide-react";

import BugDashboardAnalytics from "@/components/bugs/BugDashboardAnalytics";
import ReportBugModal from "@/components/bugs/ReportBugModal";
import BugCollaborationModal from "@/components/bugs/BugCollaborationModal";
import ExternalWebsiteIntegrationModal from "@/components/bugs/ExternalWebsiteIntegrationModal";

type BugItem = {
  id: string;
  title: string;
  description: string;
  status?: string;
  severity?: string;
  priority?: string;
  module?: string;
  taskTitle?: string;
  websiteName?: string;
  websiteUrl?: string;
  pageUrl?: string;
  reporterName?: string;
  reporterEmail?: string;
  originType?: string;
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

export default function DeveloperBugs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BugItem[]>([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");

  const [collabOpen, setCollabOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);

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
          websiteName: toText(x.websiteName || (x.originType === "EXTERNAL" ? "External Website" : "Task Manager")),
          websiteUrl: toText(x.websiteUrl),
          pageUrl: toText(x.pageUrl),
          reporterName: toText(x.reporterName),
          reporterEmail: toText(x.reporterEmail),
          originType: toText(x.originType || "INTERNAL"),
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

  const availableWebsites = useMemo(() => {
    const set = new Set<string>();
    items.forEach((b) => {
      if (b.websiteName) set.add(b.websiteName);
    });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") {
      if (statusFilter === "open") list = list.filter((b) => ["OPEN", "TRIAGED", "IN_PROGRESS", "NEEDS_INFO", "REOPENED", "open"].includes(b.status || ""));
      else if (statusFilter === "closed") list = list.filter((b) => ["CLOSED_VERIFIED", "CLOSED_ADMIN_OVERRIDE", "closed"].includes(b.status || ""));
      else list = list.filter((b) => (b.status || "").toUpperCase() === statusFilter.toUpperCase());
    }

    if (siteFilter !== "all") {
      list = list.filter((b) => (b.websiteName || "Task Manager").toLowerCase() === siteFilter.toLowerCase());
    }

    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((b) => {
      const where = `${b.title} ${b.description} ${b.taskTitle || ""} ${b.createdByUsername || ""} ${b.assignedDeveloperName || ""} ${b.module || ""} ${b.websiteName || ""} ${b.reporterName || ""} ${b.source?.path || ""}`.toLowerCase();
      return where.includes(query);
    });
  }, [items, q, statusFilter, siteFilter]);

  const openBug = (b: BugItem) => {
    setSelectedBugId(b.id);
    setCollabOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            Developer Bug Resolution Platform
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Investigate reported bugs, collaborate in threads, and submit resolutions for reporter verification.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading} size="sm">
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIntegrationOpen(true)}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-medium"
          >
            <Globe className="h-4 w-4" /> External Integration
          </Button>
          <Button onClick={() => setReportOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Report Bug
          </Button>
        </div>
      </div>

      <BugDashboardAnalytics />

      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm text-destructive">
          {apiError}
        </div>
      )}

      <Card className="shadow-sm border">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Input
                placeholder="Search bugs by title, desc, website, reporter..."
                className="h-9 text-xs sm:text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Website Filter Dropdown */}
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-44 bg-background">
                <SelectValue placeholder="All Websites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  🌐 All Websites
                </SelectItem>
                <SelectItem value="Task Manager" className="text-xs">
                  Task Manager (Internal)
                </SelectItem>
                {availableWebsites
                  .filter((w) => w !== "Task Manager")
                  .map((w, idx) => (
                    <SelectItem key={idx} value={w} className="text-xs">
                      {w}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Filter Chips (Replaces Mobile-Buggy Dropdown) */}
          <div className="overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "open" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "open" ? "all" : "open")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "all" : "IN_PROGRESS")}
              className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
            >
              In Progress
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
              Closed
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border">
        <CardHeader className="px-4 sm:px-6 py-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            Assigned Bugs ({filtered.length})
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
                    <TableHead className="text-xs">Website</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Reporter</TableHead>
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
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold gap-1 py-0.5 whitespace-nowrap ${
                            b.originType === "EXTERNAL"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                          }`}
                        >
                          <Globe className="h-3 w-3" /> {b.websiteName || "Task Manager"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase font-medium">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize font-medium">
                        {b.severity || "medium"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.reporterName || b.createdByUsername || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs italic">
                        No bugs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
        defaultSourcePanel="developer"
      />

      <ExternalWebsiteIntegrationModal
        open={integrationOpen}
        onOpenChange={setIntegrationOpen}
        onBugSubmitted={() => void load()}
      />
    </div>
  );
}
