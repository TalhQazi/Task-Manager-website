import { useEffect, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/admin/utils";
import { SELECTABLE_STATUSES, WIP_STATUS_TOKENS, type WipFilterState } from "./types";

interface WipFiltersProps {
  value: WipFilterState;
  onChange: (next: WipFilterState) => void;
  departments?: string[];
  projects?: Array<{ _id: string; name: string }>;
  employees?: Array<{ _id: string; name: string }>;
  className?: string;
}

const SELECT_CLASS =
  "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-blue-500/60 [&>option]:bg-[#121A2F]";

/** Debounced search so typing doesn't fire a request per keystroke. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function WipFilters({ value, onChange, departments = [], projects = [], employees = [], className }: WipFiltersProps) {
  const [search, setSearch] = useState(value.search || "");
  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    if ((value.search || "") !== debouncedSearch) {
      onChange({ ...value, search: debouncedSearch || undefined, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const set = (patch: Partial<WipFilterState>) => onChange({ ...value, ...patch, page: 1 });

  const activeCount = [value.employee, value.department, value.project, value.status, value.priority, value.location, value.dueBefore]
    .filter(Boolean).length;

  const clear = () => {
    setSearch("");
    onChange({ page: 1, limit: value.limit });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Search spans employee / task / project / customer / property / vehicle / location */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee, task, project, location…"
          aria-label="Search work in progress"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-8 text-xs text-white placeholder:text-white/30 outline-none transition-colors focus:border-blue-500/60"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <select className={SELECT_CLASS} value={value.status || ""} onChange={(e) => set({ status: e.target.value || undefined })} aria-label="Filter by status">
        <option value="">All statuses</option>
        {SELECTABLE_STATUSES.map((s) => (
          <option key={s} value={s}>{WIP_STATUS_TOKENS[s].label}</option>
        ))}
      </select>

      <select className={SELECT_CLASS} value={value.priority || ""} onChange={(e) => set({ priority: e.target.value || undefined })} aria-label="Filter by priority">
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {departments.length > 0 && (
        <select className={SELECT_CLASS} value={value.department || ""} onChange={(e) => set({ department: e.target.value || undefined })} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      )}

      {employees.length > 0 && (
        <select className={SELECT_CLASS} value={value.employee || ""} onChange={(e) => set({ employee: e.target.value || undefined })} aria-label="Filter by employee">
          <option value="">All employees</option>
          {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      )}

      {projects.length > 0 && (
        <select className={SELECT_CLASS} value={value.project || ""} onChange={(e) => set({ project: e.target.value || undefined })} aria-label="Filter by project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      )}

      <input
        type="date"
        className={SELECT_CLASS}
        value={value.dueBefore || ""}
        onChange={(e) => set({ dueBefore: e.target.value || undefined })}
        aria-label="Filter by due date"
      />

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
