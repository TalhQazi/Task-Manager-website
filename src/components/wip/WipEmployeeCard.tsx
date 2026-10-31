import { cn } from "@/lib/admin/utils";
import { MapPin, FolderKanban, Clock } from "lucide-react";
import { ElapsedTimer } from "./ElapsedTimer";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import type { WipSession } from "./types";

/** Initials fallback — Employee has no avatar field in the existing schema. */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?";
}

export function EmployeeAvatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-[11px] font-semibold text-white/70"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

interface WipEmployeeCardProps {
  session: WipSession;
  onClick: (session: WipSession) => void;
  className?: string;
}

/** Responsive fallback for tablet/mobile, where the grid can't breathe. */
export function WipEmployeeCard({ session, onClick, className }: WipEmployeeCardProps) {
  const blocked = session.status === "blocked";

  return (
    <button
      type="button"
      onClick={() => onClick(session)}
      className={cn(
        "w-full rounded-xl border bg-white/[0.02] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        blocked ? "border-red-400/30 bg-red-500/[0.04]" : "border-white/10",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <EmployeeAvatar name={session.employeeName} src={session.employeeAvatar} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{session.employeeName}</div>
            <div className="truncate text-[11px] text-white/40">{session.department || "—"}</div>
          </div>
        </div>
        <StatusBadge status={session.status} size="sm" />
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white/90">{session.taskTitle}</span>
          <PriorityBadge priority={session.taskPriority} />
        </div>
        {session.projectName && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            <FolderKanban className="h-3 w-3" />
            <span className="truncate">{session.projectName}</span>
          </div>
        )}
        {session.locationName && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{session.locationName}</span>
          </div>
        )}
      </div>

      {blocked && session.blocker && (
        <div className="mb-3 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-200">
          <span className="font-semibold uppercase tracking-wide">{session.blocker.category}</span> · {session.blocker.reason}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <Clock className="h-3 w-3" />
          Started {new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <ElapsedTimer
          startedAt={session.startedAt}
          endedAt={session.endedAt}
          pausedAt={session.pausedAt}
          pausedTotalSeconds={session.pausedTotalSeconds}
          size="lg"
          className="font-bold text-white"
        />
      </div>

      <ProgressBar value={session.progressPercent} tone={blocked ? "danger" : "auto"} size="sm" />
    </button>
  );
}
