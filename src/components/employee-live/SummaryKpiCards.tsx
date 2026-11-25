import { Users, PlayCircle, AlertOctagon, Clock, UserCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveOverviewSummary } from "@/lib/employeeLiveApi";

interface SummaryKpiCardsProps {
  summary?: LiveOverviewSummary;
  activeFilter?: string;
  onFilterChange?: (filterKey: string) => void;
  isLoading?: boolean;
}

export function SummaryKpiCards({
  summary = {
    activeEmployees: 0,
    blockedEmployees: 0,
    overdueAssignments: 0,
    availableEmployees: 0,
    employeesInReview: 0,
    totalEmployees: 0,
  },
  activeFilter = "all",
  onFilterChange,
  isLoading = false,
}: SummaryKpiCardsProps) {
  const cards = [
    {
      key: "ACTIVE",
      label: "Active Employees",
      value: summary.activeEmployees,
      icon: PlayCircle,
      accent: "text-emerald-500",
      bg: "from-emerald-500/10 to-transparent",
      borderColor: "border-emerald-500/30 hover:border-emerald-500/50",
      pulse: true,
      description: "Currently working on tasks",
    },
    {
      key: "BLOCKED",
      label: "Blocked Employees",
      value: summary.blockedEmployees,
      icon: AlertOctagon,
      accent: "text-rose-500",
      bg: "from-rose-500/10 to-transparent",
      borderColor: "border-rose-500/30 hover:border-rose-500/50",
      pulse: summary.blockedEmployees > 0,
      description: "Action required to unblock",
    },
    {
      key: "overdue",
      label: "Overdue Work",
      value: summary.overdueAssignments,
      icon: Clock,
      accent: "text-amber-500",
      bg: "from-amber-500/10 to-transparent",
      borderColor: "border-amber-500/30 hover:border-amber-500/50",
      pulse: summary.overdueAssignments > 0,
      description: "Exceeded active estimates",
    },
    {
      key: "AVAILABLE",
      label: "Available Employees",
      value: summary.availableEmployees,
      icon: UserCheck,
      accent: "text-teal-500",
      bg: "from-teal-500/10 to-transparent",
      borderColor: "border-teal-500/30 hover:border-teal-500/50",
      pulse: false,
      description: "Ready for new assignments",
    },
    {
      key: "REVIEW",
      label: "In Review",
      value: summary.employeesInReview,
      icon: Eye,
      accent: "text-indigo-500",
      bg: "from-indigo-500/10 to-transparent",
      borderColor: "border-indigo-500/30 hover:border-indigo-500/50",
      pulse: false,
      description: "Awaiting manager signoff",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.key;

        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onFilterChange?.(isSelected ? "all" : c.key)}
            className={cn(
              "text-left relative overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200",
              "bg-gradient-to-br bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md",
              c.bg,
              isSelected
                ? "ring-2 ring-primary border-primary shadow-lg"
                : c.borderColor,
              isLoading && "animate-pulse"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground line-clamp-1">
                {c.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", c.accent)} />
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", c.accent)} />
                  </span>
                )}
                <Icon className={cn("h-4 w-4", c.accent)} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                {c.value}
              </span>
              {summary.totalEmployees > 0 && (
                <span className="text-[11px] text-muted-foreground/80 font-mono">
                  / {summary.totalEmployees}
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
              {c.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
