import { useEffect, useMemo, useState } from "react";
import { Activity, Monitor, Wifi, WifiOff, LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/admin/utils";
import { getAuthState } from "@/lib/auth";
import { WipSummaryCards } from "@/components/wip/WipSummaryCards";
import { WipFilters } from "@/components/wip/WipFilters";
import { WipEmployeeGrid } from "@/components/wip/WipEmployeeGrid";
import { WipEmployeeCard } from "@/components/wip/WipEmployeeCard";
import { WipDetailDrawer } from "@/components/wip/WipDetailDrawer";
import { WipActivityFeed } from "@/components/wip/WipActivityFeed";
import { ManagerActionMenu } from "@/components/wip/ManagerActionMenu";
import { IdleWarningModal } from "@/components/wip/IdleWarningModal";
import { TvMode } from "@/components/wip/TvMode";
import { useWipSummary, useWipSessions } from "@/components/wip/useWipData";
import type { WipFilterState, WipSession } from "@/components/wip/types";

const MANAGER_ROLES = ["super-admin", "admin", "manager", "team-lead"];

/**
 * Full-screen WIP dashboard. Lives inside the existing admin layout and routing
 * — it is not a separate application and adds no navigation of its own beyond
 * one sidebar entry.
 */
export default function WipDashboard() {
  const [filters, setFilters] = useState<WipFilterState>({ page: 1, limit: 50, sortBy: "startedAt", sortDir: "desc" });
  const [selected, setSelected] = useState<string | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const [view, setView] = useState<"grid" | "cards">("grid");

  const role = getAuthState().role || "";
  const canManage = MANAGER_ROLES.includes(role);

  const { data: summary, isLoading: summaryLoading, transport } = useWipSummary(filters);
  const { data, isLoading } = useWipSessions(filters);

  const sessions = useMemo(() => data?.items || [], [data]);

  // Derive filter options from the loaded rows — no extra round trips.
  const departments = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.department).filter(Boolean))).sort(),
    [sessions]
  );
  const projects = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => { if (s.projectId) map.set(s.projectId, s.projectName); });
    return Array.from(map, ([_id, name]) => ({ _id, name }));
  }, [sessions]);
  const employees = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => map.set(s.employeeId, s.employeeName));
    return Array.from(map, ([_id, name]) => ({ _id, name }));
  }, [sessions]);

  // Prefer the card layout on narrow viewports.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => setView(mq.matches ? "cards" : "grid");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (tvMode) return <TvMode onExit={() => setTvMode(false)} />;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-blue-500/10">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Work In Progress</h1>
              <p className="text-sm text-white/50">Live view of who is working, on what, right now</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                transport.live ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"
              )}
              title={transport.live ? "Live via WebSocket" : "Polling every 20 seconds"}
            >
              {transport.live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {transport.live ? "Live" : "Polling"}
            </span>

            <div className="hidden items-center rounded-lg border border-white/10 p-0.5 lg:flex">
              <button
                type="button" onClick={() => setView("grid")} aria-label="Table view"
                className={cn("rounded p-1.5 transition-colors", view === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button" onClick={() => setView("cards")} aria-label="Card view"
                className={cn("rounded p-1.5 transition-colors", view === "cards" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setTvMode(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Monitor className="h-3.5 w-3.5" /> TV Mode
              </button>
            )}
          </div>
        </div>

        {/* Sticky summary */}
        <WipSummaryCards summary={summary} loading={summaryLoading} sticky />

        {transport.stale && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
            Data may be out of date — attempting to reconnect. Timers shown may be frozen.
          </div>
        )}

        <WipFilters
          value={filters}
          onChange={setFilters}
          departments={departments}
          projects={projects}
          employees={employees}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {view === "grid" ? (
              <WipEmployeeGrid
                sessions={sessions}
                loading={isLoading}
                filters={filters}
                onFiltersChange={setFilters}
                onSelect={(s: WipSession) => setSelected(s._id)}
                renderActions={(s) => <ManagerActionMenu session={s} canManage={canManage} />}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sessions.map((s) => (
                  <WipEmployeeCard key={s._id} session={s} onClick={(sess) => setSelected(sess._id)} />
                ))}
              </div>
            )}

            {data && data.total > (filters.limit || 50) && (
              <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                <span>
                  Showing {sessions.length} of {data.total}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={(filters.page || 1) <= 1}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    className="rounded-lg border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={(filters.page || 1) * (filters.limit || 50) >= data.total}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    className="rounded-lg border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {canManage && (
            <div className="h-[600px] xl:sticky xl:top-28">
              <WipActivityFeed department={filters.department} project={filters.project} />
            </div>
          )}
        </div>
      </div>

      <WipDetailDrawer sessionId={selected} onClose={() => setSelected(null)} canManage={canManage} />
      <IdleWarningModal />
    </div>
  );
}
