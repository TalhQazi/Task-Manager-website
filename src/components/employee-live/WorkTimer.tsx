import { useEffect, useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkTimerProps {
  initialSeconds?: number;
  isActive?: boolean;
  serverTime?: string | Date;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Format total seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format overrun string ("Over by 00:42")
 */
export function formatOverrun(overrunSeconds: number): string {
  return `Over by ${formatDuration(overrunSeconds)}`;
}

/**
 * Server-authoritative live ticking timer.
 * Reconciles against server UTC timestamps and initialSeconds baselines.
 * Does not drift during background tab throttling.
 */
export function WorkTimer({
  initialSeconds = 0,
  isActive = false,
  serverTime,
  className = "",
  showIcon = true,
  size = "md",
}: WorkTimerProps) {
  // Capture local baseline time when server props change
  const baseline = useMemo(() => {
    return {
      initialSeconds: Math.max(0, initialSeconds),
      receivedAt: Date.now(),
    };
  }, [initialSeconds, serverTime]);

  const [elapsed, setElapsed] = useState(baseline.initialSeconds);

  useEffect(() => {
    setElapsed(baseline.initialSeconds);

    if (!isActive) return;

    const interval = setInterval(() => {
      const deltaSec = Math.floor((Date.now() - baseline.receivedAt) / 1000);
      setElapsed(baseline.initialSeconds + deltaSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [baseline, isActive]);

  const sizeClasses = {
    sm: "text-xs font-mono font-medium",
    md: "text-sm font-mono font-semibold tracking-wider",
    lg: "text-2xl font-mono font-bold tracking-wider",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors",
        isActive ? "text-emerald-500 dark:text-emerald-400 font-semibold" : "text-muted-foreground",
        className
      )}
    >
      {showIcon && (
        <Clock
          className={cn(
            size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5",
            isActive && "animate-spin text-emerald-500",
            isActive && "style-[animation-duration:8s]"
          )}
        />
      )}
      <span className={sizeClasses[size]}>{formatDuration(elapsed)}</span>
    </div>
  );
}
