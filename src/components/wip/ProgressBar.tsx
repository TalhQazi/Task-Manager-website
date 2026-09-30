import { cn } from "@/lib/admin/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  /** Tint by health rather than by value (e.g. red when blocked). */
  tone?: "auto" | "neutral" | "danger";
}

function toneClass(value: number, tone: ProgressBarProps["tone"]) {
  if (tone === "danger") return "bg-red-400";
  if (tone === "neutral") return "bg-white/40";
  if (value >= 100) return "bg-emerald-400";
  if (value >= 60) return "bg-blue-400";
  if (value >= 25) return "bg-amber-400";
  return "bg-white/35";
}

export function ProgressBar({ value, className, showLabel = true, size = "md", tone = "auto" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("relative w-full overflow-hidden rounded-full bg-white/10", size === "sm" ? "h-1" : "h-1.5")}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", toneClass(pct, tone))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("shrink-0 tabular-nums text-white/60", size === "sm" ? "text-[10px]" : "text-xs")}>{pct}%</span>
      )}
    </div>
  );
}
