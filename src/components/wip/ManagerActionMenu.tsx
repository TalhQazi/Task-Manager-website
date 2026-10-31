import { useState } from "react";
import {
  MoreVertical, MessageSquareWarning, Pause, Play, CheckCircle2,
  OctagonX, ShieldAlert, UserCog, StickyNote,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useWipActions } from "./useWipData";
import { ReasonDialog } from "./ReasonDialog";
import type { WipSession, BlockerCategory } from "./types";

interface ManagerActionMenuProps {
  session: WipSession;
  /** Manager-only items are hidden AND rejected server-side; this is cosmetic. */
  canManage: boolean;
}

type DialogKind = "forceStop" | "blocker" | "requestUpdate" | "managerNote" | null;

export function ManagerActionMenu({ session, canManage }: ManagerActionMenuProps) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const actions = useWipActions(session._id);

  const run = async (p: Promise<unknown>, ok: string) => {
    try {
      await p;
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const isPaused = !!session.pausedAt;
  const isBlocked = session.status === "blocked";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${session.employeeName}`}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#121A2F] text-white">
          {isPaused ? (
            <DropdownMenuItem onClick={() => run(actions.resume.mutateAsync({ id: session._id }), "Session resumed")}>
              <Play className="mr-2 h-4 w-4 text-emerald-400" /> Resume
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(actions.pause.mutateAsync({ id: session._id }), "Session paused")}>
              <Pause className="mr-2 h-4 w-4 text-yellow-400" /> Pause
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => run(actions.complete.mutateAsync({ id: session._id }), "Session completed")}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" /> Complete
          </DropdownMenuItem>

          {!isBlocked && (
            <DropdownMenuItem onClick={() => setDialog("blocker")}>
              <ShieldAlert className="mr-2 h-4 w-4 text-red-400" /> Mark Blocked
            </DropdownMenuItem>
          )}
          {isBlocked && session.blocker && (
            <DropdownMenuItem
              onClick={() => run(actions.resolveBlocker.mutateAsync({ blockerId: session.blocker!._id }), "Blocker resolved")}
            >
              <ShieldAlert className="mr-2 h-4 w-4 text-emerald-400" /> Resolve Blocker
            </DropdownMenuItem>
          )}

          {canManage && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setDialog("requestUpdate")}>
                <MessageSquareWarning className="mr-2 h-4 w-4 text-blue-400" /> Request Update
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog("managerNote")}>
                <StickyNote className="mr-2 h-4 w-4 text-purple-400" /> Add Manager Note
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserCog className="mr-2 h-4 w-4 text-white/40" /> Reassign (open drawer)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-rose-300 focus:text-rose-200" onClick={() => setDialog("forceStop")}>
                <OctagonX className="mr-2 h-4 w-4" /> Force Stop
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={dialog === "forceStop"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Force stop this timer"
        description="The original timeline is preserved. A force-stop event is recorded with your name and reason."
        confirmLabel="Force Stop"
        destructive
        requireReason
        onConfirm={async (reason) => {
          await run(actions.forceStop.mutateAsync({ id: session._id, reason }), "Timer force stopped");
          setDialog(null);
        }}
      />

      <ReasonDialog
        open={dialog === "requestUpdate"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Request a status update"
        description={`${session.employeeName} will be notified and asked to respond with progress and any blockers.`}
        confirmLabel="Send Request"
        placeholder="Optional message…"
        onConfirm={async (message) => {
          await run(actions.requestUpdate.mutateAsync({ id: session._id, message }), "Update requested");
          setDialog(null);
        }}
      />

      <ReasonDialog
        open={dialog === "managerNote"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Add a manager note"
        description="Private to managers and owners. Never visible to the employee."
        confirmLabel="Save Note"
        requireReason
        placeholder="Note…"
        onConfirm={async (body) => {
          await run(actions.addNote.mutateAsync({ id: session._id, body, managerOnly: true }), "Manager note added");
          setDialog(null);
        }}
      />

      <ReasonDialog
        open={dialog === "blocker"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Mark work as blocked"
        description="A reason and category are required. The row will turn red and high-severity blockers notify the department manager."
        confirmLabel="Mark Blocked"
        destructive
        requireReason
        placeholder="What is blocking this work?"
        withBlockerFields
        onConfirm={async (reason, extra) => {
          await run(
            actions.addBlocker.mutateAsync({
              taskId: session.taskId,
              workSessionId: session._id,
              reason,
              category: (extra?.category || "other") as BlockerCategory,
              severity: (extra?.severity || "medium") as "low" | "medium" | "high" | "critical",
            }),
            "Blocker recorded"
          );
          setDialog(null);
        }}
      />
    </>
  );
}
