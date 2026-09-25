import { cn } from "@/lib/admin/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown, MapPin, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ElapsedTimer } from "./ElapsedTimer";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { EmployeeAvatar } from "./WipEmployeeCard";
import type { WipSession, WipFilterState } from "./types";

interface WipEmployeeGridProps {
  sessions: WipSession[];
  loading?: boolean;
  filters: WipFilterState;
  onFiltersChange: (f: WipFilterState) => void;
  onSelect: (s: WipSession) => void;
  renderActions?: (s: WipSession) => React.ReactNode;
  className?: string;
}

const COLUMNS: Array<{ key: string; label: string; sortable?: boolean; className?: string }> = [
  { key: "employee", label: "Employee", className: "min-w-[190px]" },
  { key: "task", label: "Task", className: "min-w-[200px]" },
  { key: "project", label: "Project / Customer", className: "min-w-[150px]" },
  { key: "startedAt", label: "Started", sortable: true, className: "min-w-[90px]" },
  { key: "elapsedSeconds", label: "Elapsed", sortable: true, className: "min-w-[110px]" },
  { key: "estimatedFinishAt", label: "Est. Finish", className: "min-w-[100px]" },
  { key: "priority", label: "Priority", className: "min-w-[90px]" },
  { key: "status", label: "Status", sortable: true, className: "min-w-[120px]" },
  { key: "progressPercent", label: "Progress", sortable: true, className: "min-w-[130px]" },
  { key: "location", label: "Location", className: "min-w-[120px]" },
  { key: "lastActivityAt", label: "Last Activity", sortable: true, className: "min-w-[120px]" },
  { key: "actions", label: "", className: "w-[52px]" },
];

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function RowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      {COLUMNS.map((c) => (
        <td key={c.key} className="px-3 py-3">
          <div className="h-4 animate-pulse rounded bg-white/[0.05]" />
        </td>
      ))}
    </tr>
  );
}

export function WipEmployeeGrid({
  sessions, loading, filters, onFiltersChange, onSelect, renderActions, className,
}: WipEmployeeGridProps) {
  const toggleSort = (key: string) => {
    const isActive = filters.sortBy === key;
    onFiltersChange({
      ...filters,
      sortBy: key,
      sortDir: isActive && filters.sortDir === "desc" ? "asc" : "desc",
    });
  };

  if (!loading && sessions.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center", className)}>
        <Inbox className="mb-3 h-10 w-10 text-white/20" />
        <p className="font-medium text-white">No active work right now</p>
        <p className="mt-1 max-w-sm text-sm text-white/40">
          When someone starts a task, they'll appear here with a live timer.
        </p>
      </div>
    );
  }

  return (
    // Horizontal scroll is contained here — the page body never scrolls sideways.
    // A bounded height makes this the vertical scroll container too, which is
    // what `sticky top-0` on <thead> anchors to.
    <div className={cn("max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-white/[0.02]", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[#111a2e]/95 backdrop-blur-sm">
          <tr className="border-b border-white/10">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn("px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40", col.className)}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 transition-colors hover:text-white/80"
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <SortIcon active={filters.sortBy === col.key} dir={filters.sortDir} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && sessions.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
            : sessions.map((s) => {
                const blocked = s.status === "blocked";
                return (
                  <tr
                    key={s._id}
                    onClick={() => onSelect(s)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s); } }}
                    className={cn(
                      "cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:bg-white/[0.06]",
                      blocked && "bg-red-500/[0.05] hover:bg-red-500/[0.08]"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <EmployeeAvatar name={s.employeeName} src={s.employeeAvatar} size={32} />
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#121A2F]",
                              s.status === "offline" ? "bg-slate-500" : "bg-emerald-400"
                            )}
                            title={s.status === "offline" ? "Offline" : "Online"}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">{s.employeeName}</div>
                          <div className="truncate text-[11px] text-white/35">{s.department || "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="truncate font-medium text-white/90">{s.taskTitle}</div>
                      <div className="truncate font-mono text-[10px] text-white/30">#{s.taskId.slice(-6)}</div>
                      {blocked && s.blocker && (
                        <div className="mt-1 truncate text-[10px] text-red-300">{s.blocker.category}: {s.blocker.reason}</div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-white/60">
                      <span className="truncate">{s.projectName || <span className="text-white/25">—</span>}</span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-white/60">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="px-3 py-2.5">
                      <ElapsedTimer
                        startedAt={s.startedAt}
                        endedAt={s.endedAt}
                        pausedAt={s.pausedAt}
                        pausedTotalSeconds={s.pausedTotalSeconds}
                        className="font-semibold text-white"
                      />
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-white/50">
                      {s.estimatedFinishAt
                        ? new Date(s.estimatedFinishAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : <span className="text-white/25">—</span>}
                    </td>

                    <td className="px-3 py-2.5"><PriorityBadge priority={s.taskPriority} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={s.status} size="sm" /></td>

                    <td className="px-3 py-2.5">
                      <ProgressBar value={s.progressPercent} size="sm" tone={blocked ? "danger" : "auto"} />
                    </td>

                    <td className="px-3 py-2.5 text-white/50">
                      {s.locationName ? (
                        <span className="flex items-center gap-1 truncate text-xs">
                          <MapPin className="h-3 w-3 shrink-0 text-white/30" />
                          {s.locationName}
                        </span>
                      ) : <span className="text-white/25">—</span>}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-white/40">
                      {formatDistanceToNow(new Date(s.lastActivityAt), { addSuffix: true })}
                    </td>

                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {renderActions?.(s)}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
