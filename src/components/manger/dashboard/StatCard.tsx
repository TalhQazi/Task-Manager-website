import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/manger/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "stat-card",
  primary: "stat-card-gradient gradient-primary",
  success: "stat-card-gradient gradient-success",
  warning: "stat-card-gradient gradient-warning",
  danger: "stat-card-gradient gradient-danger",
};

const iconBgStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-white/20 text-white",
  success: "bg-white/20 text-white",
  warning: "bg-white/20 text-white",
  danger: "bg-white/20 text-white",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  trend,
  variant = "default",
}: StatCardProps) {
  const isGradient = variant !== "default";

  return (
    <div className={cn(variantStyles[variant], "animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              isGradient ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-3xl font-bold mt-2",
              isGradient ? "text-white" : "text-foreground"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                "text-sm mt-1",
                isGradient ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive
                    ? isGradient
                      ? "text-white"
                      : "text-success"
                    : isGradient
                    ? "text-white"
                    : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span
                className={cn(
                  "text-xs",
                  isGradient ? "text-white/60" : "text-muted-foreground"
                )}
              >
                vs last week
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBgStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
