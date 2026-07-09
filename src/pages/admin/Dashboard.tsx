import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { RecentTasksList } from "@/components/admin/dashboard/RecentTasksList";
import { ActiveEmployees } from "@/components/admin/dashboard/ActiveEmployees";
import { TaskCharts } from "@/components/admin/dashboard/TaskCharts";
import { DayAheadCard } from "@/components/admin/dashboard/DayAheadCard";
import { WeekAheadCard } from "@/components/admin/dashboard/WeekAheadCard";
import { WipDashboardWidget } from "@/components/wip/WipDashboardWidget";
import { Users, CheckSquare, AlertTriangle, Clock, Car, FileSearch, Globe, FolderRoot, Bug, CalendarCheck, Building2, Activity } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
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
  patentFiled: number;
  patentPending: number;
  websiteActive: number;
  websiteFuture: number;
  projectTotal: number;
  pendingBugs: number;
  companyTotal: number;
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
  const auth = getAuthState();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string>("approved");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const [data, onboardingRes] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary"),
          auth.role === "admin"
            ? apiFetch<{ item: { overallStatus: string } }>("/api/onboarding/me").catch(() => ({ item: { overallStatus: "not_started" } }))
            : Promise.resolve({ item: { overallStatus: "approved" } }),
        ]);
        if (!mounted) return;
        setSummary(data);
        setOnboardingStatus(onboardingRes.item.overallStatus);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [auth.role]);

  const metrics = useMemo(() => {
    if (!summary) return null;
    return {
      totalEmployees: summary.employeeTotal,
      activeTasks: summary.activeTasks,
      dueToday: summary.dueToday,
      overdueTasks: summary.overdueTasks,
      clockedInEmployees: summary.employeesWorking,
      totalVehicles: summary.vehicleTotal,
      patentFiled: summary.patentFiled,
      patentPending: summary.patentPending,
      websiteActive: summary.websiteActive,
      websiteFuture: summary.websiteFuture,
      totalProjects: summary.projectTotal,
      pendingBugs: summary.pendingBugs,
      totalCompanies: summary.companyTotal,
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
        className="dashboard-page pl-2 pr-2 sm:pl-6 space-y-4 sm:space-y-5 md:space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {auth.role === "admin" && onboardingStatus !== "approved" && (
          <motion.div variants={itemVariants}>
            <div className="border-l-4 border-l-orange-500 bg-orange-50/10 backdrop-blur-md rounded-xl p-4 border border-orange-500/20 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Complete Your Onboarding</p>
                    <p className="text-sm text-gray-300">
                      {onboardingStatus === "not_started" || onboardingStatus === "in_progress"
                        ? "Please complete your onboarding to access all features."
                        : onboardingStatus === "submitted"
                        ? "Your onboarding is submitted and pending approval."
                        : "Please complete your onboarding to access all features."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/profile?tab=onboarding")}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all w-full sm:w-auto flex-shrink-0"
                >
                  Complete Onboarding
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4 lg:gap-6"
          variants={containerVariants}
        >
          {metrics && [
            { title: "Active Employee", value: metrics.totalEmployees, icon: Users, variant: "dark-grey", changeType: "positive" as const, onClick: () => navigate("/admin/employees") },
            { title: "Active Projects", value: metrics.totalProjects, icon: FolderRoot, variant: "purple", changeType: "positive" as const, onClick: () => navigate("/admin/tasks?tab=projects") },
            { title: "Active Tasks", value: metrics.activeTasks, icon: CheckSquare, variant: "green", changeType: "neutral" as const, onClick: () => navigate("/admin/tasks") },
            { title: "Clocked In", value: metrics.clockedInEmployees, icon: Clock, variant: "gold", changeType: "neutral" as const, onClick: () => navigate("/admin/time-tracking") },
            { title: "Companies", value: metrics.totalCompanies, icon: Building2, variant: "dark-grey", changeType: "positive" as const, onClick: () => navigate("/admin/companies") },
            { title: "Due Today", value: metrics.dueToday, icon: CalendarCheck, variant: "teal", changeType: "neutral" as const, onClick: () => navigate("/admin/tasks?filter=today") },
            { title: "Overdue Tasks", value: metrics.overdueTasks, icon: AlertTriangle, variant: "red", changeType: "positive" as const, onClick: () => navigate("/admin/tasks") },
            { title: "Patents", value: `${metrics.patentFiled} / ${metrics.patentPending}`, change: "filed / pending", icon: FileSearch, variant: "amber", changeType: "neutral" as const, onClick: () => navigate("/admin/intellectual-property") },
            { title: "Pending Bugs", value: metrics.pendingBugs, icon: Bug, variant: "red", changeType: "neutral" as const, onClick: () => navigate("/admin/bug-reports") },
            { title: "Total Vehicles", value: metrics.totalVehicles, icon: Car, variant: "orange", changeType: "positive" as const, onClick: () => navigate("/admin/vehicles") },
            { title: "Websites", value: `${metrics.websiteActive} / ${metrics.websiteFuture}`, change: "active / future", icon: Globe, variant: "teal", changeType: "positive" as const, onClick: () => navigate("/admin/digital-assets") },
            { title: "System Health", value: "Monitor", change: "servers · RAM · disk", icon: Activity, variant: "purple", changeType: "neutral" as const, onClick: () => navigate("/admin/health") },
          ].map((stat, idx) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                change={(stat as any).change}
                changeType={stat.changeType}
                icon={stat.icon}
                variant={stat.variant}
                onClick={stat.onClick}
              />
            </motion.div>
          ))}
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

        {/* Work In Progress — live operational panel. Additive: no existing card changed. */}
        <motion.div variants={itemVariants} className="transition-all duration-300">
          <WipDashboardWidget />
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