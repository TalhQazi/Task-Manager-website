import React, { useEffect, useState } from "react";
import { LucideIcon, TrendingUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number; 
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading = false
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timeout = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(timeout);
  }, [value]);

  const formatNumber = (val: string | number) => {
    if (typeof val === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(val);
    }
    return val;
  };

  // Determine value color based on title (Monthly Income -> green, Monthly Expenses -> red)
  const getValueColor = () => {
    const t = title.toLowerCase();
    if (t.includes("income") || t.includes("profit") || t.includes("positive")) {
      return "text-[#10b981]"; // Green
    }
    if (t.includes("expense") || t.includes("payable") || t.includes("declines") || t.includes("wasted")) {
      return "text-[#b91c1c]"; // Red/Burgundy
    }
    return "text-[#1e293b]"; // Dark Blue-Grey
  };

  return (
    <div className="relative overflow-hidden bg-white border border-[#c9d4e2] rounded-xl p-5 transition-all duration-300 shadow-[0_4px_6px_rgba(200,210,225,0.3)] hover:shadow-[0_8px_16px_rgba(180,195,215,0.4)] group flex flex-col justify-between h-32">
      
      {/* Top light highlight accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#4f81bd]/20 to-transparent group-hover:via-[#4f81bd] transition-all duration-700" />
      
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
            <Icon className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col justify-end flex-grow">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl md:text-3xl font-black tracking-tight font-sans transition-all duration-300 ${getValueColor()} ${pulse ? "scale-[1.02]" : ""}`}>
            {isLoading ? (
              <span className="inline-block w-24 h-7 bg-zinc-100 rounded animate-pulse" />
            ) : (
              formatNumber(value)
            )}
          </span>
          
          {/* Trend arrow or mini bar chart display inside Occupancy card */}
          {title.toLowerCase().includes("occupancy") ? (
            <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {trend && <span className="text-[10px] font-bold font-mono">{trend.value}</span>}
            </div>
          ) : (
            trend && !isLoading && (
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                trend.isPositive 
                  ? "text-emerald-600 bg-emerald-50" 
                  : "text-rose-600 bg-rose-50"
              }`}>
                {trend.isPositive ? "+" : ""}{trend.value}
              </span>
            )
          )}
        </div>

        {subtitle && (
          <span className="text-[9px] text-zinc-400 mt-1 font-mono">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
