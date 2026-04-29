import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { RecentTasksList } from "@/components/admin/dashboard/RecentTasksList";
import { ActiveEmployees } from "@/components/admin/dashboard/ActiveEmployees";
import { TaskCharts } from "@/components/admin/dashboard/TaskCharts";
import { DayAheadCard } from "@/components/admin/dashboard/DayAheadCard";
import { WeekAheadCard } from "@/components/admin/dashboard/WeekAheadCard";
import { Users, CheckSquare, FolderRoot, Car, MapPin, Sparkles, TrendingUp, AlertTriangle, ClipboardList } from "lucide-react";
import { apiFetch, getEODStatus } from "@/lib/manger/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/manger/ui/card";
import { Button } from "@/components/manger/ui/button";
import { Link } from "react-router-dom";

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
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      mass: 0.8,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
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
      totalProjects: summary.projectTotal || 0,
      totalVehicles: summary.vehicleTotal || 0,
      totalLocations: summary.locationTotal || 0,
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-4 border-primary/10" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 sm:space-y-7 lg:space-y-8 max-w-[2000px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.div 
          variants={fadeUpVariants}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </motion.div>

        {/* Onboarding Warning Banner */}
        {onboardingStatus !== "approved" && (
          <motion.div 
            variants={fadeUpVariants}
          >
            <Card className="border-l-4 border-l-orange-500 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-900">Onboarding Required</p>
                      <p className="text-sm text-orange-700">
                        {onboardingStatus === "not_started" || onboardingStatus === "in_progress"
                          ? "Please complete your onboarding to access all features."
                          : onboardingStatus === "submitted"
                          ? "Your onboarding is submitted and pending approval."
                          : "Please complete your onboarding to access all features."}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link to="/manager/profile">Complete Onboarding</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          variants={containerVariants}
        >
          {metrics && [
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                changeType={stat.changeType}
                icon={stat.icon}
                variant={stat.variant}
                onClick={stat.onClick}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
        <motion.div 
          className="relative"
          variants={fadeUpVariants}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <motion.div
            whileHover={{ scale: 1.002 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl border bg-gradient-to-br from-card via-card to-card/95 p-5 lg:p-6 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Analytics Overview</h2>
            </div>
            <TaskCharts />
          </motion.div>
        </motion.div>

        {/* Two Column Layout - Row 1 */}
        <motion.div 
          className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full rounded-2xl border bg-gradient-to-br from-card to-card/95 p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <RecentTasksList />
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full rounded-2xl border bg-gradient-to-br from-card to-card/95 p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <ActiveEmployees />
            </div>
          </motion.div>
        </motion.div>

        {/* Two Column Layout - Row 2 */}
        <motion.div 
          className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full rounded-2xl border bg-gradient-to-br from-card to-card/95 p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <DayAheadCard />
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full rounded-2xl border bg-gradient-to-br from-card to-card/95 p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <WeekAheadCard />
            </div>
          </motion.div>
        </motion.div>

        {/* Subtle Footer */}
        <motion.div 
          variants={fadeUpVariants}
          className="text-center text-xs text-muted-foreground/60 py-4"
        >
          <p>Real-time updates • Data refreshes automatically</p>
        </motion.div>
      </motion.div>
    </>
  );
}

export default Dashboard;