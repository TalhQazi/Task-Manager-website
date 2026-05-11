import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange" | "teal" | "amber" | "gold" | "red" | "blue" | "green" | "yellow";
  onClick?: () => void;
}

export function EmployeeStatCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
  onClick,
}: StatCardProps) {

  const glowColors = {
    primary: "rgba(59, 130, 246, 0.5)",
    success: "rgba(16, 185, 129, 0.6)",
    warning: "rgba(245, 158, 11, 0.6)",
    danger: "rgba(239, 68, 68, 0.6)",
    info: "rgba(14, 165, 233, 0.6)",
    purple: "rgba(168, 85, 247, 0.6)",
    orange: "rgba(249, 115, 22, 0.6)",
    teal: "rgba(20, 184, 166, 0.6)",
    amber: "rgba(251, 191, 36, 0.6)",
    gold: "rgba(250, 204, 21, 0.7)",
    red: "rgba(239, 68, 68, 0.6)",
    blue: "rgba(59, 130, 246, 0.6)",
    green: "rgba(16, 185, 129, 0.6)",
    yellow: "rgba(234, 179, 8, 0.6)",
  };

  const glowColor = glowColors[variant] || glowColors.primary;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16162a]",
        "border border-white/10 shadow-lg",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer",
        "overflow-hidden"
      )}
    >
      {/* Subtle Glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 120%, ${glowColor} 0%, transparent 70%)`
        }}
      />

      <div className="relative p-4 sm:p-5 flex items-center justify-between gap-4 z-10">
        {/* Left Section - Text Content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs font-medium tracking-wide mb-1 truncate">
            {title}
          </p>
          <p className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        {/* Right Section - Icon */}
        <div className={cn(
          "relative flex items-center justify-center",
          "h-12 w-12 flex-shrink-0 rounded-lg",
          "bg-black/30 border border-white/5"
        )}>
          <Icon
            className="h-6 w-6"
            style={{ color: glowColor.replace(/,\s*[\d.]+\)$/, ', 1)') }}
          />
        </div>
      </div>
    </div>
  );
}
