import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { listResource } from "@/lib/admin/apiClient";

type Employee = {
  id: string;
  status: "active" | "inactive" | "on-leave";
};

type Vehicle = {
  id: string;
  status: "active" | "maintenance" | "inactive";
};

type Location = {
  id: string;
  type: "commercial" | "residential" | "industrial";
  status: "active" | "inactive";
  tasksCount: number;
};

type OnboardingEmployee = {
  id: string;
  status: "pending" | "in-progress" | "completed" | "needs-review";
  startDate: string;
};

type NotificationItem = {
  id: string;
  createdAt: string;
};

const pieColors = ["#22c55e", "#f59e0b", "#94a3b8", "#ef4444", "#3b82f6"]; 

function lastNDaysLabels(n: number) {
  const labels: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toISOString().split("T")[0]);
  }
  return labels;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingEmployee[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const [emps, vehs, locs, onb, notifs] = await Promise.all([
          listResource<Employee>("employees"),
          listResource<Vehicle>("vehicles"),
          listResource<Location>("locations"),
          listResource<OnboardingEmployee>("onboarding"),
          listResource<NotificationItem>("notifications"),
        ]);
        if (!mounted) return;
        setEmployees(emps);
        setVehicles(vehs);
        setLocations(locs);
        setOnboarding(onb);
        setNotifications(notifs);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load reports");
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
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === "active").length;
    const inactiveEmployees = employees.filter((e) => e.status === "inactive").length;

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === "active").length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;

    const totalLocations = locations.length;
    const activeLocations = locations.filter((l) => l.status === "active").length;
    const totalActiveTasksFromLocations = locations.reduce((sum, l) => sum + (l.tasksCount || 0), 0);

    const onboardingInProgress = onboarding.filter((o) => o.status === "in-progress").length;
    const onboardingNeedsReview = onboarding.filter((o) => o.status === "needs-review").length;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalLocations,
      activeLocations,
      totalActiveTasksFromLocations,
      onboardingInProgress,
      onboardingNeedsReview,
    };
  }, [employees, vehicles, locations, onboarding]);

  const vehiclesStatusData = useMemo(() => {
    const map: Record<string, number> = { active: 0, maintenance: 0, inactive: 0 };
    for (const v of vehicles) map[v.status] = (map[v.status] ?? 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const locationsTypeData = useMemo(() => {
    const map: Record<string, number> = { commercial: 0, residential: 0, industrial: 0 };
    for (const l of locations) map[l.type] = (map[l.type] ?? 0) + 1;
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [locations]);

  const onboardingStatusData = useMemo(() => {
    const map: Record<string, number> = {
      pending: 0,
      "in-progress": 0,
      "needs-review": 0,
      completed: 0,
    };
    for (const o of onboarding) map[o.status] = (map[o.status] ?? 0) + 1;
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [onboarding]);

  const notificationsTrend = useMemo(() => {
    const labels = lastNDaysLabels(7);
    const map: Map<string, number> = new Map(labels.map((d): [string, number] => [d, 0]));
    for (const n of notifications) {
      if (map.has(n.createdAt)) map.set(n.createdAt, (map.get(n.createdAt) ?? 0) + 1);
    }
    return labels.map((d) => ({ date: d.slice(5), count: map.get(d) ?? 0 }));
  }, [notifications]);

  return (
    <AdminLayout>
      {/* Mobile-first container */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        
        {/* Page Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Reports
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
              Analytics summary based on your module data.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit sm:w-auto text-xs sm:text-sm">
            Backend
          </Badge>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-destructive break-words">
              {apiError}
            </p>
          </div>
        )}

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Employees Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Employees</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{metrics.totalEmployees}</p>
                  <p className="text-xs text-muted-foreground truncate">Total</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs sm:text-sm truncate">Active: {metrics.activeEmployees}</p>
                  <p className="text-xs text-muted-foreground truncate">Inactive: {metrics.inactiveEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Locations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{metrics.totalLocations}</p>
                  <p className="text-xs text-muted-foreground truncate">Total</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs sm:text-sm truncate">Active: {metrics.activeLocations}</p>
                  <p className="text-xs text-muted-foreground truncate">Tasks: {metrics.totalActiveTasksFromLocations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicles Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{metrics.totalVehicles}</p>
                  <p className="text-xs text-muted-foreground truncate">Total</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs sm:text-sm truncate">Active: {metrics.activeVehicles}</p>
                  <p className="text-xs text-muted-foreground truncate">Maint: {metrics.maintenanceVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Card */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{onboarding.length}</p>
                  <p className="text-xs text-muted-foreground truncate">Total records</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs sm:text-sm truncate">In Progress: {metrics.onboardingInProgress}</p>
                  <p className="text-xs text-muted-foreground truncate">Review: {metrics.onboardingNeedsReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          
          {/* Vehicles Pie Chart */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg font-semibold">Vehicles by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[280px] md:h-[300px] px-2 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie 
                    data={vehiclesStatusData} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={35} 
                    outerRadius={55}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {vehiclesStatusData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '12px', 
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Locations Bar Chart */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg font-semibold">Locations by Type</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[280px] md:h-[300px] px-2 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={locationsTypeData} 
                  margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '12px', 
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={window.innerWidth < 640 ? 20 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Onboarding Bar Chart */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg font-semibold">Onboarding Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[280px] md:h-[300px] px-2 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={onboardingStatusData} 
                  margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval={0}
                    angle={window.innerWidth < 640 ? -15 : 0}
                    textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                    height={window.innerWidth < 640 ? 50 : 30}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '12px', 
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]} 
                    barSize={window.innerWidth < 640 ? 20 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Notifications Line Chart */}
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg font-semibold">Notifications (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[280px] md:h-[300px] px-2 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={notificationsTrend} 
                  margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval={window.innerWidth < 640 ? 1 : 0}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '12px', 
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Notes Card */}
        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                These charts are generated from your module data. As you add/edit employees, vehicles, locations,
                onboarding and notifications, the reports will reflect those changes.
              </p>
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent/50 animate-pulse" />
                  <p className="text-xs text-muted-foreground">Loading latest data...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}