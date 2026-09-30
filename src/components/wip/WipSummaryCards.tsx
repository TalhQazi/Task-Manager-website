import { cn } from "@/lib/admin/utils";
import {
  Users, Play, Pause, ShieldAlert, AlertTriangle, FolderKanban, Timer, DollarSign,
} from "lucide-react";
import { formatDuration } from "./ElapsedTimer";
import type { WipSummary } from "./types";

interface WipSummaryCardsProps {
  summary?: WipSummary;
  loading?: boolean;
  /** Sticky within the full-screen page's scroll container. */
  sticky?: boolean;
  compact?: boolean;
  className?: string;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

interface Card {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
  tone: string;
}

function buildCards(s: WipSummary): Card[] {
  return [
    { key: "clockedIn", label: "Clocked In", value: String(s.employeesClockedIn), icon: Users, tone: "text-sky-300" },
    { key: "working", label: "Currently Working", value: String(s.currentlyWorking), icon: Play, tone: "text-emerald-300" },
    { key: "paused", label: "Paused", value: String(s.pausedTasks), icon: Pause, tone: "text-yellow-300" },
    { key: "blocked", label: "Blocked", value: String(s.blockedTasks), icon: ShieldAlert, tone: "text-red-300" },
    { key: "overdue", label: "Overdue", value: String(s.overdueTasks), icon: AlertTriangle, tone: "text-orange-300" },
    { key: "projects", label: "Active Projects", value: String(s.activeProjects), icon: FolderKanban, tone: "text-purple-300" },
    { key: "avg", label: "Avg Active Time", value: formatDuration(s.averageActiveSeconds), icon: Timer, tone: "text-blue-300" },
    { key: "cost", label: "Running Labor Cost", value: formatCents(s.runningLaborCostCents), icon: DollarSign, tone: "text-amber-300" },
  ];
}

function SkeletonCard({ compact }: { compact?: boolean }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/[0.03]", compact ? "h-16" : "h-[84px]")} />;
}

export function WipSummaryCards({ summary, loading, sticky, compact, className }: WipSummaryCardsProps) {
  const cards = summary ? buildCards(summary) : [];

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-8",
        sticky && "sticky top-0 z-20 -mx-1 bg-[#0B1120]/85 px-1 py-2 backdrop-blur-md",
        className
      )}
    >
      {loading && !summary
        ? Array.from({ length: compact ? 4 : 8 }).map((_, i) => <SkeletonCard key={i} compact={compact} />)
        : cards.map(({ key, label, value, icon: Icon, tone }) => (
            <div
              key={key}
              className={cn(
                "rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.04]",
                compact ? "p-3" : "p-4"
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className={cn("h-4 w-4 shrink-0", tone)} />
                <span className="truncate text-[11px] font-medium text-white/45">{label}</span>
              </div>
              <div className={cn("font-bold tabular-nums text-white", compact ? "text-lg" : "text-2xl")}>{value}</div>
            </div>
          ))}
    </div>
  );
}
