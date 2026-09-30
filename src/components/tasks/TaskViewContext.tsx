import React, { createContext, useContext, useMemo, useState } from "react";
import { TaskFilters, TaskView } from "@/lib/taskViews";

export type ViewId =
  | "card" | "list" | "compact" | "kanban" | "workload" | "calendar" | "timeline" | "wip" | "executive";

interface TaskViewCtx {
  filters: TaskFilters;
  setFilters: (patch: Partial<TaskFilters>) => void;
  view: ViewId;
  setView: (v: ViewId) => void;
  selected: TaskView | null;
  setSelected: (t: TaskView | null) => void;
}

const Ctx = createContext<TaskViewCtx | null>(null);

export function TaskViewProvider({ children, initialView = "card" }: { children: React.ReactNode; initialView?: ViewId }) {
  const [filters, setFiltersState] = useState<TaskFilters>({ status: "all", priority: "all", assignment: "all" });
  const [view, setView] = useState<ViewId>(initialView);
  const [selected, setSelected] = useState<TaskView | null>(null);

  const value = useMemo<TaskViewCtx>(
    () => ({
      filters,
      setFilters: (patch) => setFiltersState((f) => ({ ...f, ...patch })),
      view,
      setView,
      selected,
      setSelected,
    }),
    [filters, view, selected]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTaskView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTaskView must be used within TaskViewProvider");
  return ctx;
}
