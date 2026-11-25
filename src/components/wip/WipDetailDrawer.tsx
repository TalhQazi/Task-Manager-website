import { useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/admin/utils";
import {
  X, Clock, FolderKanban, ListChecks, Paperclip, StickyNote, History,
  MapPin, DollarSign, ShieldAlert, Lock, FileText, Image as ImageIcon,
} from "lucide-react";
import { useWipSessionDetail } from "./useWipData";
import { ElapsedTimer, formatDuration } from "./ElapsedTimer";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { EmployeeAvatar } from "./WipEmployeeCard";
import { ManagerActionMenu } from "./ManagerActionMenu";
import type { WipEvent, WipSession } from "./types";

interface WipDetailDrawerProps {
  sessionId: string | null;
  onClose: () => void;
  canManage: boolean;
}

const money = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

function Section({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/35">
          {icon} {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="text-xs text-white/45">{label}</span>
      <span className={cn("text-sm font-medium text-white", valueClass)}>{value}</span>
    </div>
  );
}

/** Human-readable label for each immutable event type. */
const EVENT_LABEL: Record<string, string> = {
  start: "Started work", pause: "Paused", resume: "Resumed",
  statusChange: "Status changed", progressUpdate: "Progress updated",
  note: "Note added", upload: "File uploaded", blockerAdded: "Blocker raised",
  blockerRemoved: "Blocker resolved", requestUpdate: "Update requested",
  responseUpdate: "Update provided", complete: "Completed",
  forceStop: "Force stopped", reassigned: "Reassigned",
  locationUpdate: "Location updated", idlePrompt: "Idle check",
};

const EVENT_TONE: Record<string, string> = {
  forceStop: "bg-rose-400", blockerAdded: "bg-red-400", blockerRemoved: "bg-emerald-400",
  complete: "bg-emerald-400", start: "bg-blue-400", pause: "bg-yellow-400",
  resume: "bg-emerald-400", reassigned: "bg-purple-400",
};

function Timeline({ events }: { events: WipEvent[] }) {
  if (events.length === 0) {
    return <p className="py-4 text-center text-xs text-white/30">No events recorded yet.</p>;
  }
  return (
    <ol className="relative ml-2 space-y-4 border-l border-white/10 pb-2">
      {events.map((e) => {
        // Offline sync: client clock vs server receipt. Show both, never rewrite.
        const skewed =
          e.clientTimestamp && Math.abs(new Date(e.clientTimestamp).getTime() - new Date(e.createdAt).getTime()) > 60_000;
        return (
          <li key={e._id} className="relative pl-5">
            <span className={cn("absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B1120]", EVENT_TONE[e.eventType] || "bg-white/40")} />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-white/85">{EVENT_LABEL[e.eventType] || e.eventType}</span>
              <time className="text-[10px] text-white/30" dateTime={e.createdAt}>
                {format(new Date(e.createdAt), "MMM d, HH:mm:ss")}
              </time>
            </div>
            {e.note && <p className="mt-0.5 text-xs text-white/55">{e.note}</p>}
            {(e.oldValue != null || e.newValue != null) && (
              <p className="mt-0.5 text-[11px] text-white/35">
                {String(e.oldValue ?? "—")} → <span className="text-white/60">{String(e.newValue ?? "—")}</span>
              </p>
            )}
            <p className="mt-0.5 text-[10px] text-white/25">
              by {e.createdByName || "system"} · {e.source}
            </p>
            {skewed && (
              <p className="mt-1 rounded border border-amber-400/20 bg-amber-500/5 px-1.5 py-0.5 text-[10px] text-amber-300/80">
                Recorded offline at {format(new Date(e.clientTimestamp!), "HH:mm:ss")}, received {format(new Date(e.createdAt), "HH:mm:ss")}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Files attached during the session, pulled from upload events. */
function Evidence({ events }: { events: WipEvent[] }) {
  const files = events
    .filter((e) => e.eventType === "upload")
    .flatMap((e) => ((e.metadata?.files as Array<{ fileName: string; url: string; mimeType?: string }>) || []));

  if (files.length === 0) {
    return <p className="py-3 text-center text-xs text-white/30">No photos, files, or receipts uploaded.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {files.map((f, i) => {
        const isImage = (f.mimeType || "").startsWith("image/");
        return (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2 transition-colors hover:bg-white/[0.05]"
          >
            {isImage ? <ImageIcon className="h-4 w-4 shrink-0 text-blue-300" /> : <FileText className="h-4 w-4 shrink-0 text-white/40" />}
            <span className="truncate text-xs text-white/70">{f.fileName}</span>
          </a>
        );
      })}
    </div>
  );
}

export function WipDetailDrawer({ sessionId, onClose, canManage }: WipDetailDrawerProps) {
  const { data, isLoading } = useWipSessionDetail(sessionId);

  useEffect(() => {
    if (!sessionId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionId, onClose]);

  if (!sessionId) return null;

  const s = data?.session;
  const events = data?.events || [];
  // `managerNotes` key is absent entirely for employees — never an empty array.
  const managerNotes = data?.managerNotes;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Work session details">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0B1120] shadow-2xl animate-slide-in-right">
        {isLoading || !s ? (
          <div className="space-y-4 p-6">
            <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.03]" />)}
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <EmployeeAvatar name={s.employeeName} src={s.employeeAvatar} size={44} />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-white">{s.employeeName}</h2>
                  <p className="truncate text-xs text-white/45">
                    {s.department || "—"}{s.employee?.role ? ` · ${s.employee.role}` : ""}
                  </p>
                  <div className="mt-1"><StatusBadge status={s.status} size="sm" /></div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ManagerActionMenu session={s as WipSession} canManage={canManage} />
                <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Timer */}
              <Section icon={<Clock className="h-3.5 w-3.5" />} title="Timer">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <ElapsedTimer
                    startedAt={s.startedAt} endedAt={s.endedAt}
                    pausedAt={s.pausedAt} pausedTotalSeconds={s.pausedTotalSeconds}
                    size="xl" className="font-bold text-white"
                  />
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-white/35">Active time</p>
                </div>
                <div className="space-y-2">
                  <Row label="Started at" value={format(new Date(s.startedAt), "MMM d, HH:mm:ss")} />
                  <Row label="Paused total" value={formatDuration(s.pausedTotalSeconds)} />
                  <Row label="Last activity" value={formatDistanceToNow(new Date(s.lastActivityAt), { addSuffix: true })} />
                  <Row
                    label="Estimated finish"
                    value={s.estimatedFinishAt ? format(new Date(s.estimatedFinishAt), "MMM d, HH:mm") : "—"}
                    valueClass={s.estimatedFinishAt ? undefined : "text-white/30"}
                  />
                </div>
                <ProgressBar value={s.progressPercent} tone={s.status === "blocked" ? "danger" : "auto"} />
              </Section>

              {/* Blocker */}
              {s.blocker && (
                <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Blocker">
                  <div className="rounded-xl border border-red-400/25 bg-red-500/[0.07] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-200">
                        {s.blocker.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] uppercase text-red-300/70">{s.blocker.severity}</span>
                    </div>
                    <p className="text-sm text-white/85">{s.blocker.reason}</p>
                    {s.blocker.blockedOn && <p className="mt-1 text-xs text-white/45">Waiting on: {s.blocker.blockedOn}</p>}
                  </div>
                </Section>
              )}

              {/* Project */}
              <Section icon={<FolderKanban className="h-3.5 w-3.5" />} title="Project">
                {s.projectId ? (
                  <div className="space-y-2">
                    <Row label="Project" value={s.projectName || "—"} />
                    <Row label="Labor cost" value={money(s.laborCostCents)} valueClass="text-amber-300" />
                    <Row label="Location" value={s.location?.name || s.locationName || "—"} />
                  </div>
                ) : (
                  <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 text-xs text-white/35">
                    This task is not linked to a project, so it is excluded from project labor reports.
                  </p>
                )}
              </Section>

              {/* Task */}
              <Section icon={<ListChecks className="h-3.5 w-3.5" />} title="Task">
                <div className="space-y-2">
                  <Row label="Title" value={<span className="truncate">{s.taskTitle}</span>} />
                  <Row label="Priority" value={<PriorityBadge priority={s.taskPriority} />} />
                  <Row
                    label="Due date"
                    value={s.taskDueDate ? format(new Date(s.taskDueDate), "MMM d, yyyy") : "—"}
                    valueClass={s.taskDueDate && new Date(s.taskDueDate) < new Date() ? "text-red-300" : undefined}
                  />
                </div>
              </Section>

              {/* Evidence */}
              <Section icon={<Paperclip className="h-3.5 w-3.5" />} title="Evidence">
                <Evidence events={events} />
              </Section>

              {/* Manager notes — absent entirely for employees */}
              {managerNotes && (
                <Section
                  icon={<Lock className="h-3.5 w-3.5" />}
                  title="Manager Notes"
                  action={<span className="text-[10px] text-purple-300/70">Private</span>}
                >
                  {managerNotes.length === 0 ? (
                    <p className="py-3 text-center text-xs text-white/30">No manager notes.</p>
                  ) : (
                    <div className="space-y-2">
                      {managerNotes.map((n) => (
                        <div key={n._id} className="rounded-lg border border-purple-400/15 bg-purple-500/[0.05] p-3">
                          <p className="text-sm text-white/85">{n.body}</p>
                          <p className="mt-1 text-[10px] text-white/35">
                            {n.createdByName} · {format(new Date(n.createdAt), "MMM d, HH:mm")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* Immutable history */}
              <Section icon={<History className="h-3.5 w-3.5" />} title="History Timeline">
                <Timeline events={events} />
              </Section>

              {/* Location */}
              {(s.locationName || s.latitude != null) && (
                <Section icon={<MapPin className="h-3.5 w-3.5" />} title="Location">
                  <Row label="Site" value={s.location?.name || s.locationName || "Unknown"} />
                  {s.latitude != null && s.longitude != null && (
                    <Row label="GPS" value={`${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}`} />
                  )}
                </Section>
              )}

              {/* Cost footer */}
              <Section icon={<DollarSign className="h-3.5 w-3.5" />} title="Labor">
                <Row label="Accrued cost" value={money(s.laborCostCents)} valueClass="text-amber-300" />
                <p className="px-1 text-[10px] text-white/25">
                  Calculated from the rate captured when this session started — later rate changes do not reprice it.
                </p>
              </Section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
