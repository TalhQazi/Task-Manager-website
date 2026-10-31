import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Coffee, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useWipActions } from "./useWipData";
import { useIdleWarning } from "./useWipTransport";
import { heartbeatSession } from "./wipApi";

/**
 * Idle check-in prompt.
 *
 * DESIGN MANDATE: idle is a signal, never a verdict. Nothing in this component
 * implies wrongdoing. It asks a question and offers four equally-valid answers.
 * There is no "you appear to be slacking" copy, no countdown pressure, and no
 * default destructive action. Quiet work is normal work.
 *
 * Only tier 3 ("prompt") surfaces this modal. Tiers 1-2 are silent indicators
 * and tier 4 informs a manager that someone may need help.
 */
export function IdleWarningModal() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(15);
  const actions = useWipActions(sessionId || undefined);

  useIdleWarning(({ workSessionId, tier, thresholdMinutes }) => {
    if (tier !== "prompt") return; // soft/reminder tiers stay silent
    setSessionId(workSessionId);
    setMinutes(thresholdMinutes);
    setOpen(true);
  });

  const close = () => setOpen(false);

  const run = async (p: Promise<unknown>, message: string) => {
    try {
      await p;
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      close();
    }
  };

  if (!sessionId) return null;

  const options = [
    {
      key: "continue",
      label: "Yes, still working",
      hint: "Keep the timer running",
      icon: Play,
      className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
      // A heartbeat is the whole action: it refreshes lastActivityAt and resets
      // the idle tier. It must NOT touch progress or status.
      onClick: () => run(heartbeatSession(sessionId), "Timer still running"),
    },
    {
      key: "pause",
      label: "Pause",
      hint: "Stop the clock for now",
      icon: Pause,
      className: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20",
      onClick: () => run(actions.pause.mutateAsync({ id: sessionId, note: "Paused from idle check-in" }), "Timer paused"),
    },
    {
      key: "break",
      label: "On break",
      hint: "Not production time",
      icon: Coffee,
      className: "border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
      onClick: () => run(actions.changeStatus.mutateAsync({ id: sessionId, status: "break", note: "Break from idle check-in" }), "Enjoy your break"),
    },
    {
      key: "complete",
      label: "Complete",
      hint: "This task is finished",
      icon: CheckCircle2,
      className: "border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20",
      onClick: () => run(actions.complete.mutateAsync({ id: sessionId, note: "Completed from idle check-in" }), "Task completed"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-white/10 bg-[#121A2F] text-white sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Still working?</DialogTitle>
          <DialogDescription className="text-white/55">
            We haven't recorded any activity for about {minutes} minutes. That's completely normal for
            hands-on work, calls, or time away from a screen — we just want your timer to be accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {options.map(({ key, label, hint, icon: Icon, className, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${className}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-[11px] opacity-70">{hint}</span>
            </button>
          ))}
        </div>

        <p className="pt-1 text-center text-[11px] text-white/30">
          Whatever you pick, your recorded history stays exactly as it was.
        </p>
      </DialogContent>
    </Dialog>
  );
}
