import { useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/admin/utils";
import { useWipSummary } from "./useWipData";
import { WipSummaryCards } from "./WipSummaryCards";

/**
 * Compact WIP panel for the existing admin dashboard home.
 * Purely additive — drops into the current grid without altering other cards.
 * Clicking anywhere opens the full-screen dashboard.
 */
export function WipDashboardWidget({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: summary, isLoading, transport } = useWipSummary();

  const open = () => navigate("/admin/wip");

  return (
    <div
      className={cn(
        "group rounded-2xl border border-white/10 bg-[#121A2F] p-5 shadow-xl transition-colors hover:border-white/20 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-blue-500/10">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              Work In Progress
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  transport.live ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"
                )}
                title={transport.live ? "Live via WebSocket" : "Polling every 20s"}
              >
                {transport.live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {transport.live ? "Live" : "Polling"}
              </span>
            </h2>
            <p className="text-xs text-white/45">Who is working, right now</p>
          </div>
        </div>

        <button
          type="button"
          onClick={open}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <button type="button" onClick={open} className="w-full text-left" aria-label="Open the full WIP dashboard">
        <WipSummaryCards summary={summary} loading={isLoading} compact />
      </button>

      {transport.stale && (
        <p className="mt-3 text-[11px] text-amber-300/80">
          Data may be out of date — reconnecting.
        </p>
      )}
    </div>
  );
}
