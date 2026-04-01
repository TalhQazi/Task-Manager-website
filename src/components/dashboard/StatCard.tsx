import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UnifiedStatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
} & (
  | {
      subtitle?: string;
      trend?: {
        value: number;
        isPositive: boolean;
      };
      change?: never;
      changeType?: never;
    }
  | {
      change?: string;
      changeType?: "positive" | "negative" | "neutral";
      subtitle?: never;
      trend?: never;
    }
);

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

export function StatCard(props: UnifiedStatCardProps) {
  const { title, value, icon: Icon, variant = "default" } = props;
  const isGradient = variant !== "default";

  return (
    <div className={cn(variantStyles[variant], "animate-fade-in relative")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              isGradient ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {title}
          </p>

          <p
            className={cn(
              "text-3xl font-bold mt-2",
              isGradient ? "text-white" : "text-foreground",
            )}
          >
            {value}
          </p>

          {"subtitle" in props && props.subtitle && (
            <p
              className={cn(
                "text-sm mt-1",
                isGradient ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {props.subtitle}
            </p>
          )}

          {"trend" in props && props.trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  props.trend.isPositive
                    ? isGradient
                      ? "text-white"
                      : "text-success"
                    : isGradient
                    ? "text-white"
                    : "text-destructive",
                )}
              >
                {props.trend.isPositive ? "+" : "-"}
                {Math.abs(props.trend.value)}%
              </span>
              <span
                className={cn(
                  "text-xs",
                  isGradient ? "text-white/60" : "text-muted-foreground",
                )}
              >
                vs last week
              </span>
            </div>
          )}

          {"change" in props && props.change && (
            <p
              className={cn(
                "text-xs sm:text-sm mt-2 sm:mt-3 flex items-center gap-1 truncate",
                props.changeType === "neutral" ? "opacity-80" : "opacity-100",
              )}
            >
              <span className="truncate">{props.change}</span>
            </p>
          )}
        </div>

        <div className={cn("p-3 rounded-xl flex-shrink-0", iconBgStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
