import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { RecentTasksList } from "@/components/admin/dashboard/RecentTasksList";
import { ActiveEmployees } from "@/components/admin/dashboard/ActiveEmployees";
import { TaskCharts } from "@/components/admin/dashboard/TaskCharts";
import { DayAheadCard } from "@/components/admin/dashboard/DayAheadCard";
import { WeekAheadCard } from "@/components/admin/dashboard/WeekAheadCard";
import { Users, CheckSquare, AlertTriangle, Clock, Car, FileSearch, Globe, FolderRoot, Bug } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useNavigate } from "react-router-dom";

type DashboardSummary = {
  activeTasks: number;
  dueToday: number;
  overdueTasks: number;
  employeesWorking: number;
  employeeTotal: number;
  hoursLoggedToday: number;
  avgHoursPerEmployee: number;
  vehicleTotal: number;
  patentTotal: number;
  websiteTotal: number;
  projectTotal: number;
  pendingBugs: number;
};

// Animation variants
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const data = await apiFetch<DashboardSummary>("/api/dashboard/summary");
        if (!mounted) return;
        setSummary(data);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load dashboard");
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

  const metrics = useMemo(() => {
    if (!summary) return null;
    return {
      totalEmployees: summary.employeeTotal,
      activeTasks: summary.activeTasks,
      overdueTasks: summary.overdueTasks,
      clockedInEmployees: summary.employeesWorking,
      totalVehicles: summary.vehicleTotal,
      totalPatents: summary.patentTotal,
      totalWebsites: summary.websiteTotal,
      totalProjects: summary.projectTotal,
      pendingBugs: summary.pendingBugs,
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

        {/* Stats Grid with animated cards */}
        <motion.div 
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-4 lg:gap-6"
          variants={containerVariants}
        >
          {metrics && [
            { title: "Active Employee", value: metrics.totalEmployees, icon: Users, variant: "cyan", changeType: "positive" as const, onClick: () => navigate("/admin/employees") },
            { title: "Active Tasks", value: metrics.activeTasks, icon: CheckSquare, variant: "success", changeType: "neutral" as const, onClick: () => navigate("/admin/tasks") },
            { title: "Active Projects", value: metrics.totalProjects, icon: FolderRoot, variant: "purple", changeType: "positive" as const, onClick: () => navigate("/admin/tasks") },
            { title: "Total Vehicles", value: metrics.totalVehicles, icon: Car, variant: "orange", changeType: "positive" as const, onClick: () => navigate("/admin/vehicles") },
            { title: "Patents", value: metrics.totalPatents, icon: FileSearch, variant: "amber", changeType: "positive" as const, onClick: () => navigate("/admin/intellectual-property") },
            { title: "Websites", value: metrics.totalWebsites, icon: Globe, variant: "teal", changeType: "positive" as const, onClick: () => navigate("/admin/websites") },
            { title: "Overdue Tasks", value: metrics.overdueTasks, icon: AlertTriangle, variant: "danger", changeType: "positive" as const, onClick: () => navigate("/admin/tasks") },
            { title: "Clocked In", value: metrics.clockedInEmployees, icon: Clock, variant: "lime", changeType: "neutral" as const, onClick: () => navigate("/admin/time-tracking") },
            { title: "Pending Bugs", value: metrics.pendingBugs, icon: Bug, variant: "pink", changeType: "neutral" as const, onClick: () => navigate("/admin/bug-reports") },
            { title: "Total Users", value: summary?.employeeTotal || 0, icon: Users, variant: "pink", changeType: "positive" as const, onClick: () => navigate("/admin/employees") },
            { title: "Network", value: metrics.totalWebsites, icon: Globe, variant: "cyan", changeType: "positive" as const, onClick: () => navigate("/admin/websites") },
            { title: "Assets", value: metrics.totalPatents, icon: FileSearch, variant: "majesty", changeType: "positive" as const, onClick: () => navigate("/admin/intellectual-property") },
            { title: "System Health", value: "Optimal", icon: Bug, variant: "lime", changeType: "neutral" as const, onClick: () => navigate("/admin/bug-reports") },
          ].slice(0, 9).map((stat, idx) => {
            // Further ensure unique colors by rotating if more stats are added
            const variants: any[] = ["primary", "success", "purple", "orange", "rose", "teal", "danger", "amber", "indigo", "pink", "cyan", "majesty", "lime"];
            return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                changeType={stat.changeType}
                icon={stat.icon}
                variant={variants[idx % variants.length]}
                onClick={stat.onClick}
              />
            </motion.div>
          )})}
        </motion.div>

        {/* Charts Section with fade-in animation */}
        <motion.div 
          className="w-full overflow-x-auto pb-1"
          variants={itemVariants}
        >
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

        {/* Bottom Section with animated cards */}
        <motion.div 
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="transition-all duration-300"
          >
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <RecentTasksList />
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="transition-all duration-300"
          >
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl">
              <ActiveEmployees />
            </div>
          </motion.div>
        </motion.div>

        {/* Day & Week Ahead Planning Views */}
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

        {/* API Error Message with animation */}
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

      {/* Add global styles for grid pattern */}
      <style>{`
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
      </motion.div>
    </>
  );
};

export default Dashboard;