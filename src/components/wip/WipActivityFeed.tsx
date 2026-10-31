import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/admin/utils";
import { Radio, Inbox } from "lucide-react";
import { useWipActivityFeed } from "./useWipData";
import type { WipActivityItem } from "./types";

const EVENT_LABEL: Record<string, string> = {
  start: "started", pause: "paused", resume: "resumed",
  statusChange: "changed status on", progressUpdate: "updated progress on",
  note: "noted on", upload: "uploaded a file to", blockerAdded: "blocked",
  blockerRemoved: "unblocked", requestUpdate: "requested an update on",
  responseUpdate: "responded on", complete: "completed",
  forceStop: "force stopped", reassigned: "reassigned",
};

const EVENT_TONE: Record<string, string> = {
  forceStop: "bg-rose-400", blockerAdded: "bg-red-400", blockerRemoved: "bg-emerald-400",
  complete: "bg-emerald-400", start: "bg-blue-400", pause: "bg-yellow-400",
  resume: "bg-emerald-400", reassigned: "bg-purple-400", requestUpdate: "bg-blue-400",
};

interface WipActivityFeedProps {
  department?: string;
  project?: string;
  limit?: number;
  className?: string;
}

/** Chronological, filterable stream of every audited event across the tenant. */
export function WipActivityFeed({ department, project, limit = 40, className }: WipActivityFeedProps) {
  const { data, isLoading } = useWipActivityFeed({ department, project, limit });
  const items: WipActivityItem[] = data?.items || [];

  return (
    <div className={cn("flex h-full flex-col rounded-2xl border border-white/10 bg-[#121A2F] shadow-xl", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 p-4">
        <Radio className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-bold text-white">Activity Feed</h2>
        <span className="ml-auto text-[10px] text-white/30">{items.length} events</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.03]" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Inbox className="mb-2 h-8 w-8 text-white/15" />
            <p className="text-sm text-white/40">No activity yet</p>
          </div>
        ) : (
          <ol className="relative ml-2 space-y-4 border-l border-white/10">
            {items.map((e) => (
              <li key={e._id} className="relative pl-5">
                <span className={cn("absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#121A2F]", EVENT_TONE[e.eventType] || "bg-white/30")} />
                <p className="text-xs leading-relaxed text-white/80">
                  <span className="font-semibold text-white">{e.createdByName || "System"}</span>{" "}
                  <span className="text-white/50">{EVENT_LABEL[e.eventType] || e.eventType}</span>{" "}
                  <span className="font-medium text-white/90">{e.session?.taskTitle}</span>
                  {e.session?.projectName && <span className="text-white/40"> · {e.session.projectName}</span>}
                </p>
                {e.note && <p className="mt-0.5 truncate text-[11px] text-white/45">"{e.note}"</p>}
                <p className="mt-0.5 text-[10px] text-white/25">
                  {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                  {e.session?.department ? ` · ${e.session.department}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
