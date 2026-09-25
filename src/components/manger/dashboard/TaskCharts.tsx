import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type TaskApi = {
  _id?: string;
  id?: string;
  status?: string;
  dueDate?: string | Date;
  createdAt?: string;
};

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function endOfWeekSunday(d: Date) {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function taskDateCandidate(t: TaskApi): Date | null {
  if (t.dueDate) {
    const d = new Date(t.dueDate as any);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (t.createdAt) {
    const d = new Date(t.createdAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function normalizeStatus(s?: string) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return "completed";
  if (v === "overdue") return "overdue";
  if (v === "in-progress" || v === "in progress") return "in-progress";
  return "pending";
}

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(142, 76%, 36%)",
  "in-progress": "hsl(217, 91%, 60%)",
  pending: "hsl(38, 92%, 50%)",
  overdue: "hsl(0, 84%, 60%)",
};

export function TaskCharts() {
  const navigate = useNavigate();
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";

  const tasksQuery = useQuery({
    queryKey: ["manager-dashboard", "tasks"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: TaskApi[] } | TaskApi[]>("/api/tasks");
      if (Array.isArray(res)) return res;
      return Array.isArray(res?.items) ? res.items : [];
    },
  });

  const tasks = tasksQuery.data || [];

  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeklyTaskData = days.map((day) => ({ day, completed: 0, pending: 0 }));

  for (const t of tasks) {
    const d = taskDateCandidate(t);
    if (!d) continue;
    if (d < weekStart || d > weekEnd) continue;

    const status = normalizeStatus(t.status);
    const dayIndexMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 } as const;
    const jsDay = d.getDay();
    const idx = jsDay === 0 ? dayIndexMap.Sun : jsDay - 1;
    if (!weeklyTaskData[idx]) continue;
    if (status === "completed") weeklyTaskData[idx].completed += 1;
    else weeklyTaskData[idx].pending += 1;
  }

  const statusCounts: Record<string, number> = {
    completed: 0,
    "in-progress": 0,
    pending: 0,
    overdue: 0,
  };
  for (const t of tasks) {
    const s = normalizeStatus(t.status);
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 0;
  const taskDistributionData = Object.keys(statusCounts)
    .filter((k) => statusCounts[k] > 0)
    .map((k) => ({
      name: k === "in-progress" ? "In Progress" : k[0].toUpperCase() + k.slice(1),
      value: total > 0 ? Math.round((statusCounts[k] / total) * 100) : 0,
      color: STATUS_COLORS[k] || "hsl(217, 91%, 60%)",
      key: k,
    }));

  const barSize = typeof window !== "undefined" && window.innerWidth < 640 ? 12 : 16;
  const innerRadius = typeof window !== "undefined" && window.innerWidth < 640 ? 35 : 45;
  const outerRadius = typeof window !== "undefined" && window.innerWidth < 640 ? 60 : 75;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
      <Card
        className={cn(
          "cursor-pointer transition-all hover:scale-[1.01]",
          isMetallic
            ? "border border-[#ffd27a]/35 bg-gradient-to-br from-[#2b2c2d] to-[#111315] hover:border-[#ffd27a]/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_10px_20px_rgba(0,0,0,0.7)] relative overflow-hidden"
            : "shadow-soft border-0 sm:border hover:shadow-lg"
        )}
        onClick={() => navigate("/manager/tasks")}
      >
        {isMetallic && (
          <>
            {/* Corner brackets */}
            <div className="metallic-corner-bracket metallic-bracket-tl" />
            <div className="metallic-corner-bracket metallic-bracket-tr" />
            <div className="metallic-corner-bracket metallic-bracket-bl" />
            <div className="metallic-corner-bracket metallic-bracket-br" />
            
            {/* Screws */}
            <div className="absolute top-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute top-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute bottom-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute bottom-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
          </>
        )}
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 relative z-10">
          <CardTitle className={cn(
            "text-base sm:text-lg md:text-xl font-semibold",
            isMetallic ? "text-white" : ""
          )}>Weekly Task Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6 relative z-10">
          <div className="h-[200px] sm:h-[220px] md:h-[250px] lg:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyTaskData}
                margin={{
                  left: 5,
                  right: 5,
                  top: 10,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="metallicGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd27a" />
                    <stop offset="50%" stopColor="#c89537" />
                    <stop offset="100%" stopColor="#8a611c" />
                  </linearGradient>
                  <linearGradient id="metallicSteelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8d8f91" />
                    <stop offset="50%" stopColor="#4b4d4e" />
                    <stop offset="100%" stopColor="#2b2c2d" />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isMetallic ? "rgba(200, 149, 55, 0.15)" : "hsl(var(--border))"} 
                  strokeOpacity={isMetallic ? 0.7 : 0.5} 
                />
                <XAxis
                  dataKey="day"
                  tick={{
                    fill: isMetallic ? "#cfd7dc" : "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    fontWeight: 400,
                  }}
                  axisLine={{ stroke: isMetallic ? "rgba(200, 149, 55, 0.3)" : "hsl(var(--border))", strokeWidth: 1 }}
                  tickLine={false}
                  interval={0}
                  height={30}
                />
                <YAxis
                  tick={{
                    fill: isMetallic ? "#cfd7dc" : "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    fontWeight: 400,
                  }}
                  axisLine={{ stroke: isMetallic ? "rgba(200, 149, 55, 0.3)" : "hsl(var(--border))", strokeWidth: 1 }}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={isMetallic ? {
                    backgroundColor: "rgba(20, 23, 25, 0.95)",
                    border: "1px solid rgba(200, 149, 55, 0.4)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    padding: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                    color: "#f7f7f7",
                  } : {
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                    padding: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: isMetallic ? "#ffd27a" : "inherit"
                  }}
                />
                <Bar 
                  dataKey="completed" 
                  name="Completed" 
                  fill={isMetallic ? "url(#metallicGoldGrad)" : "hsl(var(--chart-2))"} 
                  radius={[4, 4, 0, 0]} 
                  barSize={barSize} 
                />
                <Bar 
                  dataKey="pending" 
                  name="Pending" 
                  fill={isMetallic ? "url(#metallicSteelGrad)" : "hsl(var(--chart-3))"} 
                  radius={[4, 4, 0, 0]} 
                  barSize={barSize} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 sm:hidden">
            <div className="flex items-center gap-1.5">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ background: isMetallic ? "linear-gradient(#ffd27a, #c89537)" : "hsl(var(--chart-2))" }} 
              />
              <span className={cn("text-xs", isMetallic ? "text-[#cfd7dc]" : "text-muted-foreground")}>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ background: isMetallic ? "linear-gradient(#8d8f91, #2b2c2d)" : "hsl(var(--chart-3))" }} 
              />
              <span className={cn("text-xs", isMetallic ? "text-[#cfd7dc]" : "text-muted-foreground")}>Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "cursor-pointer transition-all hover:scale-[1.01]",
          isMetallic
            ? "border border-[#ffd27a]/35 bg-gradient-to-br from-[#2b2c2d] to-[#111315] hover:border-[#ffd27a]/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_10px_20px_rgba(0,0,0,0.7)] relative overflow-hidden"
            : "shadow-soft border-0 sm:border hover:shadow-lg"
        )}
        onClick={() => navigate("/manager/tasks")}
      >
        {isMetallic && (
          <>
            {/* Corner brackets */}
            <div className="metallic-corner-bracket metallic-bracket-tl" />
            <div className="metallic-corner-bracket metallic-bracket-tr" />
            <div className="metallic-corner-bracket metallic-bracket-bl" />
            <div className="metallic-corner-bracket metallic-bracket-br" />
            
            {/* Screws */}
            <div className="absolute top-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute top-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute bottom-1.5 left-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
            <div className="absolute bottom-1.5 right-1.5 opacity-60"><div className="metallic-screw scale-[0.75]" /></div>
          </>
        )}
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 relative z-10">
          <CardTitle className={cn(
            "text-base sm:text-lg md:text-xl font-semibold",
            isMetallic ? "text-white" : ""
          )}>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6 relative z-10">
          <div className="h-auto sm:h-[220px] md:h-[250px] lg:h-[280px] w-full">
            <div className="flex flex-col sm:flex-row items-center h-full">
              <div className="w-full sm:w-[60%] h-[180px] sm:h-full relative flex items-center justify-center">
                {isMetallic && (
                  <div className="absolute w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] rounded-full bg-gradient-to-br from-[#3a3b3c] via-[#111315] to-[#4a4b4c] border-4 border-[#ffd27a]/30 shadow-[0_0_15px_rgba(0,0,0,0.8),_inset_0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center z-0 pointer-events-none">
                    {/* Inner ring that aligns with the inner radius of the donut chart */}
                    <div className="w-[85px] h-[85px] sm:w-[105px] sm:h-[105px] rounded-full bg-[#111315] border border-[#ffd27a]/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
                  </div>
                )}
                <div className="w-full h-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="metallicPie_completed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffd27a" />
                          <stop offset="100%" stopColor="#8a611c" />
                        </linearGradient>
                        <linearGradient id="metallicPie_in-progress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6ee7b7" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="metallicPie_pending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8d8f91" />
                          <stop offset="100%" stopColor="#2b2c2d" />
                        </linearGradient>
                        <linearGradient id="metallicPie_overdue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fca5a5" />
                          <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={taskDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={false}
                      >
                        {taskDistributionData.map((entry, index) => {
                          const gradId = `metallicPie_${entry.key}`;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isMetallic ? `url(#${gradId})` : entry.color} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={isMetallic ? {
                          backgroundColor: "rgba(20, 23, 25, 0.95)",
                          border: "1px solid rgba(200, 149, 55, 0.4)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          padding: "8px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                          color: "#f7f7f7",
                        } : {
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "11px",
                          padding: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        }}
                        formatter={(value: number) => [`${value}%`, "Percentage"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="w-full sm:w-[40%] mt-3 sm:mt-0 sm:pl-2">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                  {taskDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.color,
                          backgroundImage: isMetallic 
                            ? item.key === "completed" 
                              ? "linear-gradient(#ffd27a, #8a611c)" 
                              : item.key === "in-progress"
                              ? "linear-gradient(#6ee7b7, #047857)"
                              : item.key === "overdue"
                              ? "linear-gradient(#fca5a5, #b91c1c)"
                              : "linear-gradient(#8d8f91, #2b2c2d)"
                            : undefined
                        }}
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className={cn("text-xs sm:text-sm truncate", isMetallic ? "text-[#cfd7dc]" : "text-muted-foreground")}>{item.name}</span>
                        <span className={cn("text-xs sm:text-sm font-medium ml-1 sm:ml-auto", isMetallic ? "text-white" : "")}>{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t sm:hidden">
            <p className={cn("text-xs text-center", isMetallic ? "text-[#cfd7dc]/60" : "text-muted-foreground")}>
              Total tasks: 100% • {taskDistributionData.length} categories
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
