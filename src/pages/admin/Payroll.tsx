import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Search,
  ArrowRight,
  Wallet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Activity,
} from "lucide-react";
import { listResource } from "@/lib/admin/apiClient";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts";

// Types and interfaces
interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  category?: string;
  role: string;
  company?: string;
  status: "active" | "inactive" | "on-leave";
  payType: "hourly" | "monthly";
  payRate: string;
  hireDate: string;
  shift?: string;
}

interface TimeEntry {
  id: string;
  employee: string;
  employeeId?: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: "clocked-in" | "clocked-out" | "on-break";
}

interface PayrollData {
  employee: Employee;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  hourlyRate: number;
  isMonthly: boolean;
  monthlySalary: number;
}

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
      stiffness: 100,
      damping: 12,
    },
  },
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
};

// Chart colors
const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

// Helper functions
function parsePayRate(rate: string): number {
  const match = String(rate).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseMinutes(hhmm: string) {
  const [h, m] = String(hhmm || "").split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function calcHoursWorked(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  const inMin = parseMinutes(clockIn);
  const outMin = parseMinutes(clockOut);
  if (inMin === null || outMin === null) return 0;
  const diff = outMin - inMin;
  return diff > 0 ? diff / 60 : 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm py-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.name === "Pay" || entry.name === "Total Pay"
                ? formatCurrency(entry.value)
                : entry.name.includes("Hours")
                ? formatHours(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Payroll = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chartView, setChartView] = useState<"bar" | "line" | "area">("bar");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [empList, timeList] = await Promise.all([
          listResource<Employee>("employees"),
          listResource<TimeEntry>("time-entries"),
        ]);
        setEmployees(empList);
        setTimeEntries(timeList);
      } catch (e) {
        console.error("Failed to load payroll data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate payroll data for current month
  const payrollData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const monthlyEntries = timeEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfMonth && entryDate <= endOfMonth && entry.clockOut;
    });

    const data: PayrollData[] = employees.map((emp) => {
      const empEntries = monthlyEntries.filter(
        (e) => e.employee === emp.name || e.employeeId === emp.id
      );

      const totalHours = empEntries.reduce((sum, entry) => {
        return sum + calcHoursWorked(entry.clockIn, entry.clockOut);
      }, 0);

      const isMonthly = emp.payType === "monthly";
      const monthlySalary = parsePayRate(emp.payRate);
      const hourlyRate = isMonthly ? monthlySalary / 160 : parsePayRate(emp.payRate);
      
      let regularHours = 0;
      let overtimeHours = 0;
      let regularPay = 0;
      let overtimePay = 0;
      let totalPay = 0;

      if (isMonthly) {
        regularHours = totalHours;
        regularPay = monthlySalary;
        overtimeHours = 0;
        overtimePay = 0;
        totalPay = monthlySalary;
      } else {
        regularHours = Math.min(totalHours, 160);
        overtimeHours = Math.max(0, totalHours - 160);
        const overtimeRate = hourlyRate * 1.5;
        regularPay = regularHours * hourlyRate;
        overtimePay = overtimeHours * overtimeRate;
        totalPay = regularPay + overtimePay;
      }

      return {
        employee: emp,
        totalHours,
        regularHours,
        overtimeHours,
        regularPay,
        overtimePay,
        totalPay,
        hourlyRate,
        isMonthly,
        monthlySalary,
      };
    });

    return data;
  }, [employees, timeEntries, currentMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === "active").length;
    const totalMonthlyPayroll = payrollData.reduce((sum, p) => sum + p.totalPay, 0);
    const totalHoursWorked = payrollData.reduce((sum, p) => sum + p.totalHours, 0);

    return {
      totalEmployees,
      activeEmployees,
      totalMonthlyPayroll,
      totalHoursWorked,
    };
  }, [employees, payrollData]);

  // Generate daily payroll trend data
  const dailyPayrollData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const dailyData: { [key: string]: { pay: number; hours: number; count: number } } = {};
    
    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { pay: 0, hours: 0, count: 0 };
    }
    
    // Aggregate daily data
    timeEntries.forEach(entry => {
      if (!entry.clockOut) return;
      
      const entryDate = new Date(entry.date);
      if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
        const employee = employees.find(e => e.name === entry.employee || e.id === entry.employeeId);
        if (!employee) return;
        
        const hours = calcHoursWorked(entry.clockIn, entry.clockOut);
        const hourlyRate = employee.payType === "monthly" 
          ? parsePayRate(employee.payRate) / 160 
          : parsePayRate(employee.payRate);
        const pay = employee.payType === "monthly" ? 0 : hours * hourlyRate;
        
        if (dailyData[entry.date]) {
          dailyData[entry.date].pay += pay;
          dailyData[entry.date].hours += hours;
          dailyData[entry.date].count += 1;
        }
      }
    });
    
    // Convert to array and format for chart
    return Object.entries(dailyData).map(([date, data], index) => ({
      day: index + 1,
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pay: Math.round(data.pay * 100) / 100,
      hours: Math.round(data.hours * 10) / 10,
      employees: data.count,
    }));
  }, [timeEntries, employees, currentMonth]);

  // Generate per-employee payroll data for chart
  const employeePayrollChartData = useMemo(() => {
    return payrollData
      .filter((p) => p.totalPay > 0)
      .sort((a, b) => b.totalPay - a.totalPay)
      .slice(0, 10)
      .map((p) => ({
        name: p.employee.name.split(" ")[0],
        fullName: p.employee.name,
        amount: Math.round(p.totalPay * 100) / 100,
        hours: Math.round(p.totalHours * 100) / 100,
      }));
  }, [payrollData]);

  // Filter employees for display
  const filteredPayroll = useMemo(() => {
    return payrollData.filter((p) => {
      const matchesSearch =
        p.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employee.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || p.employee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payrollData, searchQuery, statusFilter]);

  // Generate employee daily breakdown for detail view
  const employeeDailyData = useMemo(() => {
    if (!selectedEmployee) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];

      const dayEntries = timeEntries.filter(
        (e) =>
          (e.employee === selectedEmployee.employee.name ||
            e.employeeId === selectedEmployee.employee.id) &&
          e.date === dateStr &&
          e.clockOut
      );

      const hours = dayEntries.reduce((sum, entry) => {
        return sum + calcHoursWorked(entry.clockIn, entry.clockOut);
      }, 0);

      const pay = selectedEmployee.isMonthly ? 0 : hours * selectedEmployee.hourlyRate;

      data.push({
        day: day,
        date: `${month + 1}/${day}`,
        hours: Math.round(hours * 100) / 100,
        pay: Math.round(pay * 100) / 100,
      });
    }

    return data;
  }, [selectedEmployee, timeEntries, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleEmployeeClick = (payroll: PayrollData) => {
    setSelectedEmployee(payroll);
    setDetailOpen(true);
  };

  // Render chart based on selected view
  const renderMainChart = () => {
    const ChartComponent = chartView === "bar" ? BarChart : chartView === "line" ? LineChart : AreaChart;
    
    return (
      <ChartComponent data={dailyPayrollData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="payGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
          className="text-muted-foreground"
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}h`}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {chartView === "bar" ? (
          <>
            <Bar 
              yAxisId="left"
              dataKey="pay" 
              fill="url(#payGradient)"
              name="Daily Pay"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              yAxisId="right"
              dataKey="hours"
              fill="url(#hoursGradient)"
              name="Hours Worked"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </>
        ) : chartView === "line" ? (
          <>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pay"
              stroke={CHART_COLORS.primary}
              name="Daily Pay"
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hours"
              stroke={CHART_COLORS.secondary}
              name="Hours Worked"
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.secondary, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </>
        ) : (
          <>
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="pay"
              stroke={CHART_COLORS.primary}
              fill="url(#payGradient)"
              name="Daily Pay"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="hours"
              stroke={CHART_COLORS.secondary}
              fill="url(#hoursGradient)"
              name="Hours Worked"
              strokeWidth={2}
            />
          </>
        )}
      </ChartComponent>
    );
  };

  return (
    <AdminLayout>
      <motion.div
        className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0 pb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Payroll Management
                </h1>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
                Track employee hours, calculate wages, and monitor payroll costs in real-time.
              </p>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {getMonthName(currentMonth)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          variants={containerVariants}
        >
          {[
            {
              label: "Total Employees",
              value: stats.totalEmployees,
              icon: Users,
              color: "blue",
            },
            {
              label: "Active Employees",
              value: stats.activeEmployees,
              icon: Users,
              color: "green",
            },
            {
              label: "Monthly Payroll",
              value: formatCurrency(stats.totalMonthlyPayroll),
              icon: DollarSign,
              color: "yellow",
            },
            {
              label: "Total Hours",
              value: formatHours(stats.totalHoursWorked),
              icon: Clock,
              color: "purple",
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`shadow-lg border-0 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 dark:from-${item.color}-950 dark:to-${item.color}-900 overflow-hidden`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900 flex items-center justify-center flex-shrink-0`}
                      whileHover={{ rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-sm sm:text-lg font-bold truncate">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Earners Chart */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                    Top 10 Earners
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  This Month
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={employeePayrollChartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="topEarnersGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => payload[0]?.payload.fullName || label}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#topEarnersGradient)"
                      radius={[0, 4, 4, 0]}
                      name="Total Pay"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employee Payroll Cards */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Employee Payroll
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                    {filteredPayroll.length} employees
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-0">
                  <AnimatePresence>
                    {filteredPayroll.map((payroll, index) => (
                      <motion.div
                        key={payroll.employee.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleEmployeeClick(payroll)}
                        className="cursor-pointer"
                      >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-card to-card/80">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-sm">
                                    {payroll.employee.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm truncate">
                                    {payroll.employee.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {payroll.employee.role}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className={
                                  payroll.employee.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : payroll.employee.status === "on-leave"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }
                              >
                                {payroll.employee.status}
                              </Badge>
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Total Pay</span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(payroll.totalPay)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Hours Worked</span>
                                <span className="text-sm">{formatHours(payroll.totalHours)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {payroll.isMonthly ? "Monthly Salary" : "Hourly Rate"}
                                </span>
                                <span className="text-sm">
                                  {payroll.isMonthly 
                                    ? formatCurrency(payroll.monthlySalary)
                                    : `${formatCurrency(payroll.hourlyRate)}/hr`}
                                </span>
                              </div>
                              {payroll.overtimeHours > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">Overtime</span>
                                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                    {formatHours(payroll.overtimeHours)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                              <span>Click for details</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Employee Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                      {selectedEmployee.employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedEmployee.employee.name}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {selectedEmployee.employee.role}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Payroll details for {getMonthName(currentMonth)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Total Pay</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(selectedEmployee.totalPay)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Regular Hours</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatHours(selectedEmployee.regularHours)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Overtime</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {formatHours(selectedEmployee.overtimeHours)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.isMonthly ? "Monthly Salary" : "Hourly Rate"}
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {selectedEmployee.isMonthly 
                          ? formatCurrency(selectedEmployee.monthlySalary)
                          : formatCurrency(selectedEmployee.hourlyRate)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Daily Hours Chart */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Daily Hours Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={employeeDailyData}>
                          <defs>
                            <linearGradient id="dailyHoursGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10 }} 
                            interval={2}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `${value}h`}
                          />
                          {!selectedEmployee.isMonthly && (
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => formatCurrency(value)}
                            />
                          )}
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === "pay") return formatCurrency(value);
                              return formatHours(value);
                            }}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="hours"
                            fill="url(#dailyHoursGradient)"
                            name="Hours Worked"
                            radius={[4, 4, 0, 0]}
                            barSize={15}
                          />
                          {!selectedEmployee.isMonthly && (
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="pay"
                              stroke={CHART_COLORS.secondary}
                              name="Pay Earned"
                              strokeWidth={2}
                              dot={{ fill: CHART_COLORS.secondary, r: 3 }}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Daily Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Peak Day</p>
                        <p className="text-sm font-semibold">
                          {employeeDailyData.reduce((max, d) => d.hours > max.hours ? d : max, employeeDailyData[0])?.date}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {formatHours(employeeDailyData.reduce((max, d) => Math.max(max, d.hours), 0))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Avg Daily</p>
                        <p className="text-sm font-semibold">Hours</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {formatHours(
                            employeeDailyData.reduce((sum, d) => sum + d.hours, 0) / 
                            employeeDailyData.filter(d => d.hours > 0).length || 1
                          )}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Working Days</p>
                        <p className="text-sm font-semibold">
                          {employeeDailyData.filter(d => d.hours > 0).length}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pay Breakdown */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Pay Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.isMonthly ? (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Monthly Salary (Fixed)</span>
                          <span className="font-medium">
                            {formatCurrency(selectedEmployee.monthlySalary)}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm">Regular Pay</span>
                            <span className="font-medium">
                              {formatHours(selectedEmployee.regularHours)} ×{" "}
                              {formatCurrency(selectedEmployee.hourlyRate)} ={" "}
                              {formatCurrency(selectedEmployee.regularPay)}
                            </span>
                          </div>
                          {selectedEmployee.overtimeHours > 0 && (
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm">Overtime Pay (1.5x)</span>
                              <span className="font-medium">
                                {formatHours(selectedEmployee.overtimeHours)} ×{" "}
                                {formatCurrency(selectedEmployee.hourlyRate * 1.5)} ={" "}
                                {formatCurrency(selectedEmployee.overtimePay)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3">
                        <span className="font-medium">
                          {selectedEmployee.isMonthly ? "Monthly Pay" : "Total Pay"}
                        </span>
                        <span className="font-bold text-primary">
                          {formatCurrency(selectedEmployee.totalPay)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Payroll;