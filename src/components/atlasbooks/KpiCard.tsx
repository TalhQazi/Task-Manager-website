import React, { useEffect, useState } from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
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

  // Set up a pulse animation trigger on value updates
  useEffect(() => {
    setPulse(true);
    const timeout = setTimeout(() => setPulse(false), 800);
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

  return (
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/30 rounded-xl p-5 transition-all duration-300 shadow-lg hover:shadow-amber-500/5 group flex flex-col justify-between h-36">
      {/* Top shimmer border line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent group-hover:via-amber-500 transition-all duration-700" />
      
      {/* Background radial glow */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest font-mono group-hover:text-zinc-400 transition-colors">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 group-hover:border-amber-500/30 transition-colors">
          <Icon className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      <div className="mt-2 flex flex-col justify-end flex-grow">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans transition-all duration-300 ${pulse ? "text-amber-400 scale-[1.02]" : ""}`}>
            {isLoading ? (
              <span className="inline-block w-24 h-7 bg-zinc-800 rounded animate-pulse" />
            ) : (
              formatNumber(value)
            )}
          </span>
          {trend && !isLoading && (
            <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
              trend.isPositive 
                ? "text-emerald-400 bg-emerald-500/10" 
                : "text-rose-400 bg-rose-500/10"
            }`}>
              {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && (
          <span className="text-[10px] text-zinc-500 mt-1 font-mono">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
