import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, Wifi, WifiOff, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { SummaryKpiCards } from "@/components/employee-live/SummaryKpiCards";
import { EmployeeFilters } from "@/components/employee-live/EmployeeFilters";
import { EmployeeLiveCard } from "@/components/employee-live/EmployeeLiveCard";
import { EmployeeLiveRow } from "@/components/employee-live/EmployeeLiveRow";
import { ManagerActionModal, type ManagerActionType } from "@/components/employee-live/ManagerActionModal";
import { useEmployeeLiveOverview } from "@/hooks/useEmployeeLive";
import { cn } from "@/lib/utils";
import type { EmployeeLiveCardData } from "@/lib/employeeLiveApi";

interface EmployeeLiveOverviewPageProps {
  baseRoutePrefix?: string;
  onNavigateToDirectory?: () => void;
}

export default function EmployeeLiveOverviewPage({
  baseRoutePrefix = "/admin/employees",
  onNavigateToDirectory,
}: EmployeeLiveOverviewPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter state from URL params or localStorage
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [department, setDepartment] = useState(() => searchParams.get("dept") || "all");
  const [status, setStatus] = useState(() => searchParams.get("status") || "all");
  const [health, setHealth] = useState(() => searchParams.get("health") || "all");
  const [sortBy, setSortBy] = useState<any>(() => searchParams.get("sortBy") || "name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => (searchParams.get("sortDir") as any) || "asc");
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1", 10) || 1);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("employee_live_view_mode") as "grid" | "list") || "grid";
  });

  // Modal action state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ManagerActionType | null>(null);
  const [selectedCard, setSelectedCard] = useState<EmployeeLiveCardData | null>(null);

  // Sync filters to searchParams
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (search) next.set("search", search);
    else next.delete("search");

    if (department !== "all") next.set("dept", department);
    else next.delete("dept");

    if (status !== "all") next.set("status", status);
    else next.delete("status");

    if (health !== "all") next.set("health", health);
    else next.delete("health");

    if (sortBy !== "name") next.set("sortBy", sortBy);
    else next.delete("sortBy");

    if (sortDir !== "asc") next.set("sortDir", sortDir);
    else next.delete("sortDir");

    if (page > 1) next.set("page", String(page));
    else next.delete("page");

    setSearchParams(next, { replace: true });
  }, [search, department, status, health, sortBy, sortDir, page, setSearchParams]);

  // Persist viewMode
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("employee_live_view_mode", mode);
  };

  const filters = useMemo(
    () => ({
      page,
      limit: 24,
      search,
      department,
      status,
      health,
      sortBy,
      sortDir,
    }),
    [page, search, department, status, health, sortBy, sortDir]
  );

  const { data, isLoading, refetch, isFetching, transportStatus, isConnected } =
    useEmployeeLiveOverview(filters);

  const summary = data?.summary;
  const items = data?.items || [];
  const pagination = data?.pagination;

  // Extract department list
  const departments = useMemo(() => {
    const depts = new Set<string>();
    items.forEach((it) => {
      if (it.employee.department) depts.add(it.employee.department);
    });
    return Array.from(depts).sort();
  }, [items]);

  const handleOpenActionModal = (action: ManagerActionType, card: EmployeeLiveCardData) => {
    setSelectedAction(action);
    setSelectedCard(card);
    setModalOpen(true);
  };

  const handleKpiFilterClick = (filterKey: string) => {
    setPage(1);
    if (filterKey === "overdue") {
      setHealth(health === "overdue" ? "all" : "overdue");
      setStatus("all");
    } else {
      setStatus(status === filterKey ? "all" : filterKey);
      setHealth("all");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setDepartment("all");
    setStatus("all");
    setHealth("all");
    setSortBy("name");
    setSortDir("asc");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Workforce Live View</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Real-time workforce tracking, project durations, ETAs, and activity state
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Connection badge */}
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-1 text-xs font-semibold gap-1.5 shadow-xs border",
              transportStatus === "live"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            )}
            title={transportStatus === "live" ? "Real-time updates active via WebSocket" : "Polling fallback active (30s interval)"}
          >
            {transportStatus === "live" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{transportStatus === "live" ? "Live Stream" : "Polling Sync"}</span>
          </Badge>

          {/* Directory Button if passed */}
          {onNavigateToDirectory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToDirectory}
              className="h-8 text-xs gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Directory View
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 p-0"
            title="Refresh now"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <SummaryKpiCards
        summary={summary}
        activeFilter={health === "overdue" ? "overdue" : status}
        onFilterChange={handleKpiFilterClick}
        isLoading={isLoading}
      />

      {/* Filter and View Controls */}
      <EmployeeFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        department={department}
        onDepartmentChange={(v) => { setDepartment(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        health={health}
        onHealthChange={(v) => { setHealth(v); setPage(1); }}
        sortBy={sortBy}
        onSortByChange={(v) => setSortBy(v)}
        sortDir={sortDir}
        onSortDirToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        departments={departments}
        totalCount={pagination?.total || items.length}
        onResetFilters={handleResetFilters}
      />

      {/* Workforce Display: Cards Grid vs Compact List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-border/40 bg-card/40 animate-pulse p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-24 bg-muted/40 rounded-lg" />
              <div className="h-6 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((card) => (
              <EmployeeLiveCard
                key={card.employee.id}
                card={card}
                onActionClick={handleOpenActionModal}
                baseRoutePrefix={baseRoutePrefix}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card/70 border rounded-xl overflow-hidden backdrop-blur-sm shadow-sm divide-y">
            {items.map((card) => (
              <EmployeeLiveRow
                key={card.employee.id}
                card={card}
                onActionClick={handleOpenActionModal}
                baseRoutePrefix={baseRoutePrefix}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-card/40 border border-dashed rounded-2xl space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No matching employees found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No employees match the current filters or search query. Try adjusting your search or clearing active filters.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
            Clear all filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            employees
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <span className="font-mono px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      <ManagerActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        actionType={selectedAction}
        employeeId={selectedCard?.employee.id}
        employeeName={selectedCard?.employee.name}
        assignmentId={selectedCard?.currentAssignment?.id}
        assignmentTitle={selectedCard?.currentAssignment?.taskTitle}
        currentProgress={selectedCard?.currentAssignment?.progressPercent}
        currentExpectedSeconds={selectedCard?.currentAssignment?.expectedActiveSeconds}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
