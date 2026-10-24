import { 
  Play, 
  Pause, 
  Coffee, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Eye, 
  UserCheck, 
  PowerOff 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveStatusType } from "@/lib/employeeLiveApi";

interface LiveStatusBadgeProps {
  status: LiveStatusType | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  pulsing?: boolean;
}

export function LiveStatusBadge({
  status,
  size = "md",
  className = "",
  pulsing = true,
}: LiveStatusBadgeProps) {
  const normalized = (status || "AVAILABLE").toUpperCase() as LiveStatusType;

  const config: Record<
    LiveStatusType,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      bg: string;
      text: string;
      border: string;
      pulseColor?: string;
    }
  > = {
    ACTIVE: {
      label: "Active",
      icon: Play,
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30",
      pulseColor: "bg-emerald-500",
    },
    ASSIGNED: {
      label: "Assigned",
      icon: Clock,
      bg: "bg-sky-500/10 dark:bg-sky-500/20",
      text: "text-sky-700 dark:text-sky-300",
      border: "border-sky-500/30",
    },
    PAUSED: {
      label: "Paused",
      icon: Pause,
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/30",
    },
    BREAK: {
      label: "On Break",
      icon: Coffee,
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/30",
      pulseColor: "bg-purple-500",
    },
    BLOCKED: {
      label: "Blocked",
      icon: AlertOctagon,
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-500/30",
      pulseColor: "bg-rose-500",
    },
    REVIEW: {
      label: "In Review",
      icon: Eye,
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-500/30",
      pulseColor: "bg-indigo-500",
    },
    AVAILABLE: {
      label: "Available",
      icon: UserCheck,
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      text: "text-teal-700 dark:text-teal-300",
      border: "border-teal-500/30",
    },
    OFFLINE: {
      label: "Offline",
      icon: PowerOff,
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-500/20",
    },
    COMPLETED: {
      label: "Completed",
      icon: CheckCircle2,
      bg: "bg-green-500/10 dark:bg-green-500/20",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-500/30",
    },
  };

  const item = config[normalized] || config.AVAILABLE;
  const Icon = item.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-medium",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border transition-all select-none shadow-sm",
        item.bg,
        item.text,
        item.border,
        sizeClasses[size],
        className
      )}
      title={`Live Status: ${item.label}`}
    >
      {pulsing && item.pulseColor && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              item.pulseColor
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", item.pulseColor)}
          />
        </span>
      )}
      <Icon className={iconSizes[size]} />
      <span>{item.label}</span>
    </span>
  );
}
