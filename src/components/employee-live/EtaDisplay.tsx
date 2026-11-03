import { Calendar, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "./WorkTimer";

interface EtaDisplayProps {
  expectedCompletionAt?: string | Date | null;
  expectedActiveSeconds?: number;
  remainingActiveSeconds?: number;
  isOverdue?: boolean;
  className?: string;
  compact?: boolean;
}

export function EtaDisplay({
  expectedCompletionAt,
  expectedActiveSeconds = 0,
  remainingActiveSeconds = 0,
  isOverdue = false,
  className = "",
  compact = false,
}: EtaDisplayProps) {
  if (!expectedCompletionAt && expectedActiveSeconds <= 0) {
    return (
      <span className={cn("text-xs text-muted-foreground italic flex items-center gap-1", className)}>
        <AlertCircle className="h-3 w-3 text-muted-foreground/60" />
        No estimate
      </span>
    );
  }

  let formattedEta = "";
  if (expectedCompletionAt) {
    try {
      const d = new Date(expectedCompletionAt);
      if (!isNaN(d.getTime())) {
        formattedEta = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    } catch {
      formattedEta = "";
    }
  }

  const remainingStr = remainingActiveSeconds > 0
    ? `${Math.ceil(remainingActiveSeconds / 60)}m left`
    : isOverdue
    ? "Exceeded"
    : "Finishing";

  if (compact) {
    return (
      <span
        className={cn(
          "text-xs font-mono font-medium flex items-center gap-1",
          isOverdue ? "text-rose-500" : "text-muted-foreground",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        {formattedEta ? `ETA: ${formattedEta}` : remainingStr}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col text-xs", className)}>
      <div className="flex items-center gap-1 font-medium text-foreground">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span>{formattedEta ? `Est. ${formattedEta}` : "Estimate Set"}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
        <span>{remainingStr}</span>
        {expectedActiveSeconds > 0 && (
          <>
            <span>•</span>
            <span>Total: {formatDuration(expectedActiveSeconds)}</span>
          </>
        )}
      </div>
    </div>
  );
}
