import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch } from "@/lib/admin/apiClient";
import { Calendar, Flame, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type Task = {
  _id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueTime?: string;
};

type DayData = {
  date: string;
  label: string;
  dayName: string;
  isToday: boolean;
  tasks: Task[];
  totalCount: number;
  highPriorityCount: number;
  load: "none" | "low" | "medium" | "high";
};

type WeekResponse = {
  days: DayData[];
};

const loadConfig = {
  none: {
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    bar: "bg-muted",
    label: "—",
    barWidth: "w-0",
  },
  low: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/10",
    bar: "bg-green-500",
    label: "Low",
    barWidth: "w-1/3",
  },
  medium: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    bar: "bg-yellow-500",
    label: "Med",
    barWidth: "w-2/3",
  },
  high: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/10",
    bar: "bg-red-500",
    label: "High",
    barWidth: "w-full",
  },
};

const priorityConfig = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0",
  },
  medium: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
  },
  low: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0",
  },
};

export function WeekAheadCard() {
  const [data, setData] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiFetch<WeekResponse>("/api/dashboard/week");
        if (!mounted) return;
        setData(res);
        const today = res.days.find((d) => d.isToday);
        if (today) setExpandedDay(today.date);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load week data");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleDay = (date: string) =>
    setExpandedDay((prev) => (prev === date ? null : date));

  return (
    <Card className="shadow-soft border-0 sm:border h-full flex flex-col">
      <CardHeader className="px-4 sm:px-6 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg font-semibold">Week Ahead</CardTitle>
          <span className="text-xs text-muted-foreground hidden sm:inline">— 7-Day Outlook</span>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-4 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive py-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Desktop grid summary */}
            <div className="hidden sm:grid sm:grid-cols-7 gap-1.5 mb-4">
              {data.days.map((day) => {
                const lc = loadConfig[day.load];
                const isExpanded = expandedDay === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => toggleDay(day.date)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      day.isToday
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-transparent hover:border-border hover:bg-muted/30"
                    } ${isExpanded ? "ring-2 ring-primary/20" : ""}`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        day.isToday ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span
                      className={`text-xl font-bold leading-none ${day.isToday ? "text-primary" : ""}`}
                    >
                      {new Date(day.date + "T12:00:00").getDate()}
                    </span>
                    {/* Load bar */}
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${lc.bar} ${lc.barWidth}`} />
                    </div>
                    <span className={`text-xs font-medium ${lc.color}`}>
                      {day.totalCount > 0 ? day.totalCount : "—"}
                    </span>
                    {day.highPriorityCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                        <Flame className="h-2.5 w-2.5" />
                        {day.highPriorityCount}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile horizontal scroll tabs */}
            <div className="flex sm:hidden overflow-x-auto gap-2 pb-2 mb-4 -mx-1 px-1">
              {data.days.map((day) => {
                const lc = loadConfig[day.load];
                const isExpanded = expandedDay === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => toggleDay(day.date)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border min-w-[56px] transition-all ${
                      day.isToday
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/20"
                    } ${isExpanded ? "ring-2 ring-primary/20" : ""}`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        day.isToday ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className={`text-lg font-bold ${day.isToday ? "text-primary" : ""}`}>
                      {new Date(day.date + "T12:00:00").getDate()}
                    </span>
                    <span className={`text-xs font-medium ${lc.color}`}>{day.totalCount}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded day task list */}
            <AnimatePresence mode="wait">
              {expandedDay &&
                (() => {
                  const day = data.days.find((d) => d.date === expandedDay);
                  if (!day) return null;
                  const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const lc = loadConfig[day.load];
                  return (
                    <motion.div
                      key={expandedDay}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="rounded-xl border border-border/60 bg-card overflow-hidden"
                    >
                      {/* Day header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {day.dayName}, {dateLabel}
                          </span>
                          {day.isToday && (
                            <Badge
                              className="text-xs bg-primary/10 text-primary border-0"
                              variant="secondary"
                            >
                              Today
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {day.highPriorityCount > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <Flame className="h-3.5 w-3.5" />
                              {day.highPriorityCount} urgent
                            </span>
                          )}
                          <span className={`font-medium ${lc.color}`}>{lc.label} load</span>
                          <span>{day.totalCount} tasks</span>
                        </div>
                      </div>

                      {/* Task list */}
                      <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                        {day.tasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-5">
                            No tasks scheduled
                          </p>
                        ) : (
                          day.tasks.map((task) => {
                            const pc = priorityConfig[task.priority] ?? priorityConfig.medium;
                            return (
                              <div
                                key={task._id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                              >
                                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${pc.dot}`} />
                                <span className="flex-1 text-sm truncate">{task.title}</span>
                                {task.dueTime && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                    <Clock className="h-3 w-3" />
                                    {task.dueTime}
                                  </span>
                                )}
                                <Badge
                                  className={`text-xs flex-shrink-0 ${pc.badge}`}
                                  variant="secondary"
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
