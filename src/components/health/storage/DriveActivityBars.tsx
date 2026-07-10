import { cn } from "@/lib/admin/utils";

interface DriveActivityBarsProps {
  readMBps: number;
  writeMBps: number;
  /** Peak used to normalise bar heights (defaults to 300 MB/s). */
  ceiling?: number;
  className?: string;
}

/**
 * Tiny animated read/write throughput indicator shown on every installed drive.
 * Two thin bars (read = blue, write = amber) whose heights track live MB/s.
 * Purely CSS-driven so it stays cheap even with 16 instances on screen.
 */
export function DriveActivityBars({
  readMBps,
  writeMBps,
  ceiling = 300,
  className,
}: DriveActivityBarsProps) {
  const readPct = Math.max(8, Math.min(100, (readMBps / ceiling) * 100));
  const writePct = Math.max(8, Math.min(100, (writeMBps / ceiling) * 100));

  return (
    <div className={cn("flex items-end gap-[3px] h-4", className)} aria-hidden="true">
      <span
        className="w-[3px] rounded-full bg-blue-400/80 transition-[height] duration-700 ease-out"
        style={{ height: `${readPct}%` }}
      />
      <span
        className="w-[3px] rounded-full bg-amber-400/80 transition-[height] duration-700 ease-out"
        style={{ height: `${writePct}%` }}
      />
    </div>
  );
}
