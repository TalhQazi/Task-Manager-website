import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { apiFetch } from "@/lib/manger/api";
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
  none: { color: "text-slate-400", bg: "bg-slate-50", bar: "bg-slate-200", label: "—", pct: 0 },
  low: {
    color: "text-green-600",
    bg: "bg-green-50",
    bar: "bg-green-500",
    label: "Low",
    pct: 33,
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    bar: "bg-amber-500",
    label: "Med",
    pct: 66,
  },
  high: { color: "text-red-600", bg: "bg-red-50", bar: "bg-red-500", label: "High", pct: 100 },
};

const priorityConfig = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-0",
  },
  medium: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-0",
  },
  low: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700 border-0",
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

  const toggleDay = (date: string) => setExpandedDay((prev) => (prev === date ? null : date));

  return (
    <Card className="shadow-sm border h-full flex flex-col">
      <CardHeader className="px-4 sm:px-6 py-4 border-b border-slate-200/70 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#0b5ed7]" />
          <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
            Week Ahead
          </CardTitle>
          <span className="text-xs text-slate-400 hidden sm:inline">— 7-Day Outlook</span>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-4 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-5 w-5 rounded-full border-2 border-[#0b5ed7] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 py-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Desktop 7-column grid */}
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
                        ? "border-[#0b5ed7]/40 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    } ${isExpanded ? "ring-2 ring-[#0b5ed7]/20" : ""}`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        day.isToday ? "text-[#0b5ed7]" : "text-slate-400"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span
                      className={`text-xl font-bold leading-none ${
                        day.isToday ? "text-[#0b5ed7]" : "text-slate-800"
                      }`}
                    >
                      {new Date(day.date + "T12:00:00").getDate()}
                    </span>
                    {/* Load mini-bar */}
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${lc.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${lc.pct}%` }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${lc.color}`}>
                      {day.totalCount > 0 ? day.totalCount : "—"}
                    </span>
                    {day.highPriorityCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
                        <Flame className="h-2.5 w-2.5" />
                        {day.highPriorityCount}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile horizontal swipe tabs */}
            <div className="flex sm:hidden overflow-x-auto gap-2 pb-2 mb-3 -mx-1 px-1">
              {data.days.map((day) => {
                const lc = loadConfig[day.load];
                const isExpanded = expandedDay === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => toggleDay(day.date)}
                    className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border min-w-[56px] transition-all ${
                      day.isToday
                        ? "border-[#0b5ed7]/40 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    } ${isExpanded ? "ring-2 ring-[#0b5ed7]/20" : ""}`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        day.isToday ? "text-[#0b5ed7]" : "text-slate-400"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span
                      className={`text-lg font-bold ${day.isToday ? "text-[#0b5ed7]" : "text-slate-800"}`}
                    >
                      {new Date(day.date + "T12:00:00").getDate()}
                    </span>
                    <span className={`text-xs font-semibold ${lc.color}`}>{day.totalCount}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded day detail */}
            <AnimatePresence mode="wait">
              {expandedDay &&
                (() => {
                  const day = data.days.find((d) => d.date === expandedDay);
                  if (!day) return null;
                  const lc = loadConfig[day.load];
                  const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <motion.div
                      key={expandedDay}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                    >
                      {/* Day header bar */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {day.dayName}, {dateLabel}
                          </span>
                          {day.isToday && (
                            <Badge
                              className="text-xs bg-[#0b5ed7]/10 text-[#0b5ed7] border-0"
                              variant="secondary"
                            >
                              Today
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {day.highPriorityCount > 0 && (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <Flame className="h-3.5 w-3.5" />
                              {day.highPriorityCount} urgent
                            </span>
                          )}
                          <span className={`font-semibold ${lc.color}`}>{lc.label} load</span>
                          <span>{day.totalCount} tasks</span>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                        {day.tasks.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-5">
                            No tasks scheduled
                          </p>
                        ) : (
                          day.tasks.map((task) => {
                            const pc = priorityConfig[task.priority] ?? priorityConfig.medium;
                            return (
                              <div
                                key={task._id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                              >
                                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${pc.dot}`} />
                                <span className="flex-1 text-sm truncate text-slate-800">
                                  {task.title}
                                </span>
                                {task.dueTime && (
                                  <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
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
