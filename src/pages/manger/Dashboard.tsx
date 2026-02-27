import { motion } from "framer-motion";
import { StatCard } from "@/components/manger/dashboard/StatCard";
import { TaskList } from "@/components/manger/dashboard/TaskList";
import { EmployeeActivity } from "@/components/manger/dashboard/EmployeeActivity";
import { ScheduleOverview } from "@/components/manger/dashboard/ScheduleOverview";
import {
  ClipboardList,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";
import { useQuery } from "@tanstack/react-query";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

const statsGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const statCardVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 30 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      delay: 0.4,
    },
  },
};

const scheduleVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      delay: 0.6,
    },
  },
};

export default function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      return apiFetch<{
        activeTasks: number;
        dueToday: number;
        overdueTasks: number;
        employeesWorking: number;
        employeeTotal: number;
        hoursLoggedToday: number;
        avgHoursPerEmployee: number;
      }>("/api/dashboard/summary");
    },
  });

  const summary = summaryQuery.data;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 lg:px-6 pb-6"
    >
      {/* Header */}
      <motion.div variants={headerVariants} className="page-header">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          Dashboard
        </motion.h1>
        <motion.p 
          className="page-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Welcome back, John! Here's what's happening today.
        </motion.p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={statsGridVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
      >
        <motion.div variants={statCardVariants} whileHover="hover">
          <StatCard
            title="Active Tasks"
            value={summary ? summary.activeTasks : "—"}
            subtitle={summary ? `${summary.dueToday} due today` : "Loading..."}
            icon={ClipboardList}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
        </motion.div>

        <motion.div variants={statCardVariants} whileHover="hover">
          <StatCard
            title="Employees Working"
            value={summary ? summary.employeesWorking : "—"}
            subtitle={summary ? `Out of ${summary.employeeTotal} total` : "Loading..."}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
            variant="success"
          />
        </motion.div>

        <motion.div variants={statCardVariants} whileHover="hover">
          <StatCard
            title="Hours Logged Today"
            value={summary ? `${summary.hoursLoggedToday}h` : "—"}
            subtitle={summary ? `Average ${summary.avgHoursPerEmployee}h per employee` : "Loading..."}
            icon={Clock}
            variant="default"
          />
        </motion.div>

        <motion.div 
          variants={statCardVariants} 
          whileHover="hover"
          animate={summary?.overdueTasks && summary.overdueTasks > 0 ? {
            scale: [1, 1.02, 1],
            transition: { 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }
          } : {}}
        >
          <StatCard
            title="Overdue Tasks"
            value={summary ? summary.overdueTasks : "—"}
            subtitle={summary ? "Needs attention" : "Loading..."}
            icon={AlertCircle}
            variant="danger"
          />
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div 
        variants={contentVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            delay: 0.5 
          }}
        >
          <TaskList />
        </motion.div>
        
        <motion.div 
          className="space-y-4 sm:space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            delay: 0.6 
          }}
        >
          <EmployeeActivity />
        </motion.div>
      </motion.div>

      {/* Schedule Overview */}
      <motion.div variants={scheduleVariants}>
        <ScheduleOverview />
      </motion.div>

      {/* Floating animation for loading state */}
      {summaryQuery.isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Updating dashboard...</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}