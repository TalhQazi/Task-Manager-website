import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { apiFetch } from "@/lib/manger/api";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  TrendingUp,
  Users,
} from "lucide-react";

type Task = {
  _id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueTime?: string;
};

type TodayResponse = {
  todayTasks: Task[];
  overdueTasks: Task[];
  stats: {
    totalToday: number;
    overdueCount: number;
    completedToday: number;
    completionPercent: number;
  };
};

const priorityConfig = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0",
    label: "High",
    accent: "border-l-red-500",
  },
  medium: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
    label: "Med",
    accent: "border-l-yellow-500",
  },
  low: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0",
    label: "Low",
    accent: "border-l-green-500",
  },
};

export function DayAheadCard() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showMine, setShowMine] = useState(false);

  const load = async (mine: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const qs = mine ? "?mine=true" : "";
      const res = await apiFetch<TodayResponse>(`/api/dashboard/today${qs}`);
      setData(res);
      setCompletedIds(
        new Set(
          [...(res.todayTasks ?? []), ...(res.overdueTasks ?? [])]
            .filter((t) => t.status === "completed")
            .map((t) => t._id),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(showMine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMine]);

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalToday = data?.stats.totalToday ?? 0;
  const localCompleted = data
    ? [...(data.todayTasks ?? []), ...(data.overdueTasks ?? [])].filter((t) =>
        completedIds.has(t._id),
      ).length
    : 0;
  const completionPct = totalToday > 0 ? Math.round((localCompleted / totalToday) * 100) : 0;

  return (
    <Card className="shadow-sm border h-full flex flex-col">
      <CardHeader className="px-4 sm:px-6 py-4 border-b border-slate-200/70 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#0b5ed7]" />
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
              Today
            </CardTitle>
            <span className="text-xs text-slate-400 hidden md:inline">— {today}</span>
          </div>
          {/* My tasks / Team tasks toggle */}
          <button
            onClick={() => setShowMine((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 hover:border-[#0b5ed7] hover:text-[#0b5ed7] transition-colors"
          >
            <Users className="h-3 w-3" />
            {showMine ? "My Tasks" : "Team Tasks"}
          </button>
        </div>

        {/* Progress bar */}
        {data && totalToday > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {localCompleted} of {totalToday} completed
              </span>
              <span className="font-semibold text-slate-700">{completionPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#0b5ed7] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-4 space-y-4 flex-1 overflow-y-auto max-h-[480px]">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-5 w-5 rounded-full border-2 border-[#0b5ed7] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 py-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : (
          <>
            {/* Overdue Tasks */}
            {data && data.overdueTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overdue ({data.overdueTasks.length})
                </h3>
                <AnimatePresence initial={false}>
                  {data.overdueTasks.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      isCompleted={completedIds.has(task._id)}
                      onToggle={() => toggleComplete(task._id)}
                      isOverdue
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Today's Tasks */}
            {data && data.todayTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Due Today ({data.todayTasks.length})
                </h3>
                <AnimatePresence initial={false}>
                  {data.todayTasks.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      isCompleted={completedIds.has(task._id)}
                      onToggle={() => toggleComplete(task._id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {data && data.todayTasks.length === 0 && data.overdueTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">All clear for today!</p>
                <p className="text-xs text-slate-400 mt-1">No tasks due today</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  isCompleted,
  onToggle,
  isOverdue = false,
}: {
  task: Task;
  isCompleted: boolean;
  onToggle: () => void;
  isOverdue?: boolean;
}) {
  const pc = priorityConfig[task.priority] ?? priorityConfig.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg border-l-2 transition-colors ${
        isOverdue
          ? "bg-red-50 border-l-red-500 hover:bg-red-100/60"
          : `${pc.accent} bg-slate-50 hover:bg-slate-100/80`
      } ${isCompleted ? "opacity-50" : ""}`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 text-slate-400 hover:text-[#0b5ed7] transition-colors"
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>

      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${pc.dot}`} />

      <span
        className={`flex-1 text-sm truncate text-slate-800 ${
          isCompleted ? "line-through text-slate-400" : ""
        }`}
      >
        {task.title}
      </span>

      {task.dueTime && (
        <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
          <Clock className="h-3 w-3" />
          {task.dueTime}
        </span>
      )}

      <Badge className={`text-xs flex-shrink-0 ${pc.badge}`} variant="secondary">
        {pc.label}
      </Badge>
    </motion.div>
  );
}
