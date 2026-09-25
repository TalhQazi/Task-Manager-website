import React, { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAtlasBooks } from "../../contexts/AtlasBooksContext";

interface HighContrastChartProps {
  type?: "area" | "bar";
  metricType?: "revenue" | "expenses" | "netProfit" | "cash";
  height?: number;
}

export const HighContrastChart: React.FC<HighContrastChartProps> = ({
  type = "area",
  metricType = "revenue",
  height = 300
}) => {
  const { activeEntity, timeframe } = useAtlasBooks();

  // Generate data based on activeEntity ID and timeframe selection
  const chartData = useMemo(() => {
    // Generate simple seed based on entity ID string length and content
    const seed = activeEntity.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const length = timeframe === "Daily" ? 7 : timeframe === "Monthly" ? 12 : timeframe === "Quarterly" ? 4 : 5;

    const labels: string[] = [];
    if (timeframe === "Daily") {
      labels.push("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    } else if (timeframe === "Monthly") {
      labels.push("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    } else if (timeframe === "Quarterly") {
      labels.push("Q1", "Q2", "Q3", "Q4");
    } else {
      labels.push("2022", "2023", "2024", "2025", "2026");
    }

    // Baseline depending on level
    let base = 500000;
    if (activeEntity.level === "holding") base = 3500000;
    else if (activeEntity.level === "company") base = 1800000;
    else if (activeEntity.level === "location") base = 900000;
    else if (activeEntity.level === "department") base = 300000;
    else base = 100000;

    return Array.from({ length }).map((_, index) => {
      // Create pseudorandom fluctuation
      const step = Math.sin(index + seed) * 0.15 + 1.0;
      const noise = (Math.cos(index * 2.3 + seed) * 0.08) + 1.0;
      
      const rev = Math.round(base * step * noise * (1 + index * 0.03));
      const exp = Math.round(rev * (0.55 + Math.sin(index * 1.5) * 0.05));
      const profit = rev - exp;
      const cash = Math.round((base * 3.5) + (index * base * 0.2));

      return {
        name: labels[index] || `Period ${index + 1}`,
        Revenue: rev,
        Expenses: exp,
        NetProfit: profit,
        Cash: cash
      };
    });
  }, [activeEntity.id, activeEntity.level, timeframe]);

  const activeColor = "#D4AF37"; // Luxury Gold
  const activeColorSecondary = "#D97706"; // Amber Gold

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getActiveMetricKey = () => {
    switch (metricType) {
      case "expenses":
        return "Expenses";
      case "netProfit":
        return "NetProfit";
      case "cash":
        return "Cash";
      default:
        return "Revenue";
    }
  };

  const activeKey = getActiveMetricKey();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-lg p-3 shadow-2xl backdrop-blur-md">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold font-mono mb-1.5">{label}</div>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center space-x-4 justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">{pld.name}:</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0
                }).format(pld.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex-grow w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
              <XAxis
                dataKey="name"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={8}
                fontFamily="Courier New, monospace"
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                dx={-8}
                fontFamily="Courier New, monospace"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey={activeKey}
                name={activeKey === "NetProfit" ? "Net Profit" : activeKey}
                stroke={activeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#goldGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
              <XAxis
                dataKey="name"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={8}
                fontFamily="Courier New, monospace"
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                dx={-8}
                fontFamily="Courier New, monospace"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(212, 175, 55, 0.05)" }} />
              <Bar
                dataKey={activeKey}
                name={activeKey === "NetProfit" ? "Net Profit" : activeKey}
                fill={activeColor}
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
