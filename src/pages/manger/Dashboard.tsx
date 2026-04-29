import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { RecentTasksList } from "@/components/admin/dashboard/RecentTasksList";
import { ActiveEmployees } from "@/components/admin/dashboard/ActiveEmployees";
import { TaskCharts } from "@/components/manger/dashboard/TaskCharts";
import { DayAheadCard } from "@/components/admin/dashboard/DayAheadCard";
import { WeekAheadCard } from "@/components/admin/dashboard/WeekAheadCard";

import { Users, CheckSquare, FolderRoot, Car, MapPin, AlertTriangle, Clock } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

import { Users, CheckSquare, FolderRoot, Car, MapPin, Sparkles, TrendingUp, AlertTriangle, ClipboardList } from "lucide-react";
import { apiFetch, getEODStatus } from "@/lib/manger/api";

import { useNavigate } from "react-router-dom";

type DashboardSummary = {
  activeTasks: number;
  dueToday: number;
  overdueTasks: number;
  employeesWorking: number;
  employeeTotal: number;
  hoursLoggedToday: number;
  avgHoursPerEmployee: number;
  projectTotal: number;
  vehicleTotal: number;
  locationTotal: number;
};

// Enhanced animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [onboardingStatus, setOnboardingStatus] = useState<string>("not_started");
  const [eodStats, setEodStats] = useState({ submitted: 0, late: 0, missing: 0, total: 0 });
    

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);

        const data = await apiFetch<DashboardSummary>("/api/dashboard/summary");
        if (!mounted) return;
        setSummary(data);

        const [data, onboardingRes, eodRes] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary").catch(() => null),
          apiFetch<{ item: { overallStatus: string } }>("/api/onboarding/me").catch(() => ({ item: { overallStatus: "not_started" } })),
          getEODStatus().catch(() => ({ items: [] })),
        ]);
        if (!mounted) return;
        if (data) setSummary(data);
        setOnboardingStatus(onboardingRes.item.overallStatus);
        
        // Calculate EOD stats
        const eodItems = eodRes.items || [];
        const submitted = eodItems.filter((i: any) => i.status === "submitted").length;
        const late = eodItems.filter((i: any) => i.status === "late").length;
        const missing = eodItems.filter((i: any) => i.status === "missing").length;
        setEodStats({
          submitted,
          late,
          missing,
          total: eodItems.length,
        });

      } catch (e) {
        if (mounted) setApiError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!summary) return null;
    return {
      totalEmployees: summary.employeeTotal,
      activeTasks: summary.activeTasks,
      overdueTasks: summary.overdueTasks,
      dueToday: summary.dueToday,
      clockedInEmployees: summary.employeesWorking,
      hoursLoggedToday: summary.hoursLoggedToday,
      totalProjects: summary.projectTotal || 0,
      totalVehicles: summary.vehicleTotal || 0,
      totalLocations: summary.locationTotal || 0,
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="pl-2 pr-2 sm:pl-6 space-y-4 sm:space-y-5 md:space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6"
          variants={containerVariants}
        >
          {metrics && [

            { title: "Active Employee", value: metrics.totalEmployees, icon: Users, variant: "dark-grey" as const, changeType: "positive" as const, onClick: () => navigate("/manager/employees") },
            { title: "Active Tasks", value: metrics.activeTasks, icon: CheckSquare, variant: "green" as const, changeType: "neutral" as const, onClick: () => navigate("/manager/tasks") },
            { title: "Active Projects", value: metrics.totalProjects, icon: FolderRoot, variant: "purple" as const, changeType: "positive" as const, onClick: () => navigate("/manager/tasks") },
            { title: "Total Vehicles", value: metrics.totalVehicles, icon: Car, variant: "orange" as const, changeType: "positive" as const, onClick: () => navigate("/manager/vehicles") },
            { title: "Total Locations", value: metrics.totalLocations, icon: MapPin, variant: "teal" as const, changeType: "positive" as const, onClick: () => navigate("/manager/locations") },
            { title: "Due Today", value: metrics.dueToday, icon: Clock, variant: "amber" as const, changeType: "neutral" as const, onClick: () => navigate("/manager/tasks") },
            { title: "Overdue Tasks", value: metrics.overdueTasks, icon: AlertTriangle, variant: "red" as const, changeType: "positive" as const, onClick: () => navigate("/manager/tasks") },
            { title: "Clocked In", value: metrics.clockedInEmployees, icon: Clock, variant: "gold" as const, changeType: "neutral" as const, onClick: () => navigate("/manager/time-tracking") },
            { title: "Hours Logged", value: metrics.hoursLoggedToday, icon: Clock, variant: "info" as const, changeType: "neutral" as const, onClick: () => navigate("/manager/time-tracking") },

            { 
              title: "Total Employees", 
              value: metrics.totalEmployees, 
              icon: Users, 
              variant: "cyan" as const, 
              changeType: "positive" as const, 
              onClick: () => navigate("/manager/employees"),
              description: "Active workforce"
            },
            { 
              title: "Active Tasks", 
              value: metrics.activeTasks, 
              icon: CheckSquare, 
              variant: "success" as const, 
              changeType: "neutral" as const, 
              onClick: () => navigate("/manager/tasks"),
              description: "In progress"
            },
            { 
              title: "Active Projects", 
              value: metrics.totalProjects, 
              icon: FolderRoot, 
              variant: "purple" as const, 
              changeType: "positive" as const, 
              onClick: () => navigate("/manager/tasks"),
              description: "Ongoing initiatives"
            },
            { 
              title: "Total Vehicles", 
              value: metrics.totalVehicles, 
              icon: Car, 
              variant: "orange" as const, 
              changeType: "positive" as const, 
              onClick: () => navigate("/manager/vehicles"),
              description: "Fleet size"
            },
            { 
              title: "Total Locations", 
              value: metrics.totalLocations, 
              icon: MapPin, 
              variant: "teal" as const, 
              changeType: "positive" as const, 
              onClick: () => navigate("/manager/locations"),
              description: "Service areas"
            },
            { 
              title: "EOD Submitted", 
              value: eodStats.submitted, 
              icon: ClipboardList, 
              variant: "success" as const, 
              changeType: "positive" as const, 
              onClick: () => navigate("/manager/eod-reports"),
              description: `${eodStats.total > 0 ? Math.round((eodStats.submitted / eodStats.total) * 100) : 0}% compliance`
            },
            { 
              title: "EOD Late", 
              value: eodStats.late, 
              icon: ClipboardList, 
              variant: "warning" as const, 
              changeType: "neutral" as const, 
              onClick: () => navigate("/manager/eod-reports"),
              description: "Needs attention"
            },
            { 
              title: "EOD Missing", 
              value: eodStats.missing, 
              icon: ClipboardList, 
              variant: "danger" as const, 
              changeType: "negative" as const, 
              onClick: () => navigate("/manager/eod-reports"),
              description: "Action required"
            },
          ].map((stat) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="manager-stat-card-wrapper">
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  changeType={stat.changeType}
                  icon={stat.icon}
                  variant={stat.variant}
                  onClick={stat.onClick}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="w-full overflow-x-auto pb-1" variants={itemVariants}>
          <div className="min-w-[300px] sm:min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <TaskCharts />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <RecentTasksList />
            </div>
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <ActiveEmployees />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <DayAheadCard />
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="transition-all duration-300">
            <WeekAheadCard />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="rounded-md bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
            >
              <p className="text-xs sm:text-sm text-destructive break-words flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {apiError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default Dashboard;