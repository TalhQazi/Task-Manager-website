import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange" | "indigo" | "teal";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "primary",
  onClick,
}: StatCardProps) {
  const variantClasses = {
    primary: "stat-card-gradient gradient-primary",
    success: "stat-card-gradient gradient-success",
    warning: "stat-card-gradient gradient-warning",
    danger: "stat-card-gradient gradient-danger",
    info: "stat-card-gradient gradient-info",
    purple: "stat-card-gradient gradient-purple",
    orange: "stat-card-gradient gradient-orange",
    indigo: "stat-card-gradient gradient-indigo",
    teal: "stat-card-gradient gradient-teal",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 text-white shadow-soft animate-fade-in relative",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
        variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary
      )}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Left Section - Text Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-medium opacity-90 truncate",
            "mb-1"
          )}>
            {title}
          </p>
          
          <p className={cn(
            "text-xl font-bold animate-count-up",
            "leading-tight",
            "break-words"
          )}>
            {value}
          </p>
          
          {change && (
            <p
              className={cn(
                "text-xs mt-2 flex items-center gap-1",
                "truncate",
                changeType === "positive" && "opacity-100",
                changeType === "negative" && "opacity-100",
                changeType === "neutral" && "opacity-80"
              )}
            >
              <span className="truncate">{change}</span>
            </p>
          )}
        </div>

        {/* Right Section - Icon */}
        <div className={cn(
          "rounded-lg bg-white/20 flex items-center justify-center",
          "h-8 w-8",
          "flex-shrink-0",
          "backdrop-blur-sm"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            "text-white"
          )} />
        </div>
      </div>

      {/* Mobile Touch Feedback - Only visible on active tap */}
      <div className="absolute inset-0 rounded-xl bg-white opacity-0 active:opacity-10 transition-opacity pointer-events-none" />
    </div>
  );
}