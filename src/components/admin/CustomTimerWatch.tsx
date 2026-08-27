import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import { Clock, Timer, Bell, Search, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface PatentItem {
  _id: string;
  patentName: string;
  category?: string;
  filingType?: string;
  filingDate?: string;
  applicationNumber?: string;
  provisionalExpiration?: string;
  status: string;
  notes?: string;
  customReminderDays?: number[];
  daysUntilExpiration?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

const statusColors: Record<string, string> = {
  Filed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Issued: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Abandoned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function CustomTimerWatch({ globalReminderDays }: { globalReminderDays?: number[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "active">("all");

  const filedPatentsQuery = useQuery<PatentItem[]>({
    queryKey: ["filed-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: PatentItem[] }>("/api/patents/filed");
      return res.items || [];
    },
  });

  const patents = filedPatentsQuery.data || [];

  // Helper to compute days left reliably
  const computeDaysLeft = (patent: PatentItem): number => {
    if (typeof patent.daysUntilExpiration === "number" && !isNaN(patent.daysUntilExpiration)) {
      return patent.daysUntilExpiration;
    }
    if (!patent.provisionalExpiration) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(patent.provisionalExpiration);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // STRICT FILTER: Only show items where user explicitly configured custom Reminder Schedule by days
  // Exclude Expired patents and items with empty/invalid days (Do NOT fall back to global reminder days)
  const customScheduledItems = useMemo(() => {
    return patents
      .filter((p) => {
        if (p.status === "Expired") return false;
        const validDays = (p.customReminderDays || []).filter(
          (d) => typeof d === "number" && Number.isFinite(d) && d > 0
        );
        return validDays.length > 0;
      })
      .map((p) => {
        const validDays = (p.customReminderDays || []).filter(
          (d) => typeof d === "number" && Number.isFinite(d) && d > 0
        );
        const daysLeft = computeDaysLeft(p);
        const sortedDays = [...validDays].sort((a, b) => a - b);
        const maxReminderDay = Math.max(...sortedDays);
        const isWithinSchedule = daysLeft <= maxReminderDay && daysLeft >= 0;
        
        // Find current or next triggering threshold
        const nextThreshold = sortedDays.find((d) => daysLeft <= d) ?? null;

        return {
          ...p,
          customReminderDays: validDays,
          computedDaysLeft: daysLeft,
          sortedCustomDays: sortedDays,
          maxReminderDay,
          isWithinSchedule,
          nextThreshold,
        };
      })
      .sort((a, b) => a.computedDaysLeft - b.computedDaysLeft);
  }, [patents]);

  const filteredItems = useMemo(() => {
    return customScheduledItems.filter((item) => {
      if (filterMode === "active" && !item.isWithinSchedule) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const nameMatch = item.patentName?.toLowerCase().includes(query);
        const appMatch = item.applicationNumber?.toLowerCase().includes(query);
        const catMatch = item.category?.toLowerCase().includes(query);
        if (!nameMatch && !appMatch && !catMatch) return false;
      }
      return true;
    });
  }, [customScheduledItems, filterMode, searchTerm]);

  const activeCount = customScheduledItems.filter((item) => item.isWithinSchedule).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Custom Timer View
          </h2>
          <p className="text-sm text-muted-foreground">
            Displaying only items with custom Reminder Schedules configured by days. Global days are excluded.
          </p>
        </div>

        {/* Controls / Filter toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterMode === "all"
                ? "bg-indigo-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Custom Timers ({customScheduledItems.length})
          </button>
          <button
            onClick={() => setFilterMode("active")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterMode === "active"
                ? "bg-indigo-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Inside Reminder Window ({activeCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      {customScheduledItems.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patent name, application #, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      )}

      {filedPatentsQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading custom timer data...
          </CardContent>
        </Card>
      ) : customScheduledItems.length === 0 ? (
        <Card className="border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/10">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full w-fit mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                <Timer className="h-10 w-10" />
              </div>
              <p className="text-lg font-semibold text-foreground">No Items with Custom Reminder Schedule</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Only items where a custom <strong>Reminder Schedule</strong> has been explicitly set appear here. Items using Global days are not shown in this view.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-muted-foreground text-sm">
            No custom timer items match your filter criteria.
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((patent) => {
              const expirationDate = patent.provisionalExpiration
                ? new Date(patent.provisionalExpiration)
                : null;
              const daysLeft = patent.computedDaysLeft;

              return (
                <motion.div key={patent._id} variants={itemVariants}>
                  <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border ${
                    patent.isWithinSchedule
                      ? "border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/20 dark:from-indigo-950/40 dark:via-gray-900 dark:to-indigo-950/20"
                      : "border-border bg-card"
                  }`}>
                    <CardHeader className="p-4 pb-3 border-b border-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {patent.patentName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {patent.category && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 bg-background text-foreground">
                                {patent.category}
                              </Badge>
                            )}
                            {patent.applicationNumber && (
                              <span className="text-[11px] font-mono text-muted-foreground">
                                #{patent.applicationNumber}
                              </span>
                            )}
                            {patent.filingType && (
                              <span className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground rounded">
                                {patent.filingType}
                              </span>
                            )}
                            {patent.status && (
                              <Badge className={`${statusColors[patent.status] || "bg-gray-100 text-gray-800"} border-0 text-[10px] uppercase font-bold px-1.5 py-0`}>
                                {patent.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {patent.isWithinSchedule ? (
                            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                              Active in Window
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
                              Scheduled Ahead
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-3 space-y-3">
                      {/* Reminder Schedule Days */}
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                          <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Reminder Schedule:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {patent.sortedCustomDays.map((d) => {
                            const isCurrentThreshold = daysLeft <= d;
                            return (
                              <Badge
                                key={d}
                                className={`text-[10px] font-bold px-2 py-0.5 transition-colors ${
                                  isCurrentThreshold
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                                }`}
                              >
                                {d}d
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expiration & Days Remaining */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Expiration:</span>
                          <strong className="text-foreground">
                            {expirationDate ? expirationDate.toLocaleDateString() : "—"}
                          </strong>
                        </div>

                        <div className={`flex items-center gap-1 font-bold ${
                          daysLeft <= 30
                            ? "text-red-600 dark:text-red-400"
                            : daysLeft <= 60
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-indigo-600 dark:text-indigo-400"
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{daysLeft} days remaining</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
