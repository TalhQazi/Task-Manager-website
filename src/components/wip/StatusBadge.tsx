import { cn } from "@/lib/admin/utils";
import { WIP_STATUS_TOKENS, PRIORITY_TOKENS, type WipStatus } from "./types";

interface StatusBadgeProps {
  status: WipStatus;
  /** Pulse the dot for live states (working / blocked). */
  animated?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const LIVE_STATUSES: WipStatus[] = ["working", "blocked"];

export function StatusBadge({ status, animated = true, size = "md", className }: StatusBadgeProps) {
  const token = WIP_STATUS_TOKENS[status] ?? WIP_STATUS_TOKENS.offline;
  const pulse = animated && LIVE_STATUSES.includes(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        token.bg,
        token.text,
        token.border,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
            style={{ backgroundColor: token.dot }}
          />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: token.dot }} />
      </span>
      {token.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority?: string; className?: string }) {
  if (!priority) return <span className="text-white/25">—</span>;
  const token = PRIORITY_TOKENS[priority] ?? PRIORITY_TOKENS.low;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold", token.className, className)}>
      {token.label}
    </span>
  );
}
