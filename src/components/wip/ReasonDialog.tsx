import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/admin/utils";
import type { BlockerCategory, BlockerSeverity } from "./types";

const CATEGORIES: BlockerCategory[] = [
  "parts", "customer", "vendor", "approval", "payment",
  "inspection", "court", "management_decision", "other",
];
const SEVERITIES: BlockerSeverity[] = ["low", "medium", "high", "critical"];

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  placeholder?: string;
  /** Block submit until the textarea has content. */
  requireReason?: boolean;
  destructive?: boolean;
  /** Show blocker category/severity selects and pass them to onConfirm. */
  withBlockerFields?: boolean;
  onConfirm: (reason: string, extra?: { category?: string; severity?: string }) => Promise<void> | void;
}

/**
 * Shared confirmation dialog for every action that requires a written reason —
 * force stop, blocker, manager note, update request. Reason-required actions
 * cannot be submitted empty, which is what makes the audit log meaningful.
 */
export function ReasonDialog({
  open, onOpenChange, title, description, confirmLabel,
  placeholder = "Reason…", requireReason, destructive, withBlockerFields, onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<BlockerCategory>("other");
  const [severity, setSeverity] = useState<BlockerSeverity>("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setCategory("other");
      setSeverity("medium");
      setSubmitting(false);
    }
  }, [open]);

  const invalid = requireReason && !reason.trim();

  const submit = async () => {
    if (invalid || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim(), withBlockerFields ? { category, severity } : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60 [&>option]:bg-[#121A2F]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#121A2F] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="text-white/50">{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3">
          {withBlockerFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="blocker-category" className="mb-1 block text-xs text-white/50">Category</label>
                <select id="blocker-category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as BlockerCategory)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="blocker-severity" className="mb-1 block text-xs text-white/50">Severity</label>
                <select id="blocker-severity" className={selectClass} value={severity} onChange={(e) => setSeverity(e.target.value as BlockerSeverity)}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="reason-body" className="mb-1 block text-xs text-white/50">
              {requireReason ? "Reason (required)" : "Message (optional)"}
            </label>
            <textarea
              id="reason-body"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={invalid || submitting}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              destructive ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {submitting ? "Working…" : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
