/**
 * ClearHire® Review Modal
 * ────────────────────────
 * Admin modal to review a user's ClearHire risk profile.
 * Shows risk score, flags, override history, and allows YELLOW → GREEN override.
 */

import { useState, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import ClearHireStatusBadge from "./ClearHireStatusBadge";
import {
  overrideClearHire,
  recheckClearHire,
  type ClearHireProfile,
} from "@/lib/admin/clearhireApi";

interface ClearHireReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ClearHireProfile | null;
  onUpdated?: () => void; // callback after override or recheck
}

const ClearHireReviewModal = memo(({
  open,
  onOpenChange,
  profile,
  onUpdated,
}: ClearHireReviewModalProps) => {
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!profile) return null;

  const handleOverride = async () => {
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setError("Override reason must be at least 5 characters.");
      return;
    }

    setOverrideLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await overrideClearHire(profile.userId, overrideReason.trim());
      setSuccess("Status overridden to GREEN successfully.");
      setOverrideReason("");
      onUpdated?.();
    } catch (e: any) {
      setError(e.message || "Failed to override status.");
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleRecheck = async () => {
    setRecheckLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await recheckClearHire(profile.userId);
      setSuccess("Background check re-run successfully.");
      onUpdated?.();
    } catch (e: any) {
      setError(e.message || "Failed to re-run background check.");
    } finally {
      setRecheckLoading(false);
    }
  };

  const scoreColor =
    profile.score === 0
      ? "text-emerald-600"
      : profile.score <= 20
        ? "text-emerald-600"
        : profile.score <= 60
          ? "text-amber-600"
          : "text-red-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            ClearHire® Risk Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Applicant Header ── */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="text-base sm:text-lg font-semibold">
                {profile.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                User ID: {profile.userId}
              </p>
            </div>
            <ClearHireStatusBadge status={profile.status} size="md" />
          </div>

          {/* ── Risk Score ── */}
          <div className="p-4 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Risk Score
              </span>
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {profile.score}
              </span>
            </div>

            {/* Score scale */}
            <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-gray-800 rounded"
                style={{
                  left: `${Math.min((profile.score / 120) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 — GREEN</span>
              <span>21 — YELLOW</span>
              <span>61+ — RED</span>
            </div>
          </div>

          {/* ── Flags ── */}
          {profile.flags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Flagged Offenses
              </h4>
              <div className="space-y-1.5">
                {profile.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-md bg-red-50 border border-red-100"
                  >
                    <ShieldX className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.flags.length === 0 && profile.status === "GREEN" && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">
                No offenses found. Record is clean.
              </span>
            </div>
          )}

          {/* ── Metadata ── */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Last Checked</span>
              <p className="font-medium">
                {profile.lastChecked
                  ? new Date(profile.lastChecked).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">FCRA Consent</span>
              <p className="font-medium">
                {profile.fcraConsentGiven ? "✅ Given" : "❌ Not given"}
              </p>
            </div>
          </div>

          {/* ── Previous Override ── */}
          {profile.adminOverride && (
            <div className="p-3 rounded-md bg-blue-50 border border-blue-100 space-y-1">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Previous Admin Override
              </h4>
              <p className="text-xs text-blue-700">
                Changed from{" "}
                <Badge variant="outline" className="text-xs">
                  {profile.adminOverride.previousStatus}
                </Badge>{" "}
                → <Badge variant="outline" className="text-xs bg-emerald-50">GREEN</Badge>
              </p>
              <p className="text-xs text-blue-600">
                Reason: {profile.adminOverride.reason}
              </p>
              <p className="text-xs text-blue-500">
                {new Date(profile.adminOverride.overriddenAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* ── Override Form (YELLOW only) ── */}
          {profile.status === "YELLOW" && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-3">
              <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Admin Override
              </h4>
              <p className="text-xs text-amber-700">
                This applicant has a YELLOW status. You can override to GREEN
                with a mandatory reason. This action is audit-logged.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="override-reason" className="text-xs">
                  Override Reason (required)
                </Label>
                <Input
                  id="override-reason"
                  placeholder="e.g. Minor offense over 10 years ago, reviewed by HR..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleOverride}
                disabled={overrideLoading || !overrideReason.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                size="sm"
              >
                {overrideLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Override to GREEN
              </Button>
            </div>
          )}

          {/* RED status warning */}
          {profile.status === "RED" && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium flex items-center gap-1.5">
                <ShieldX className="h-4 w-4" />
                This applicant has been automatically denied. RED status cannot
                be overridden.
              </p>
            </div>
          )}

          {/* ── Error/Success Messages ── */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 p-3 border border-emerald-100">
              <p className="text-xs text-emerald-700">{success}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecheck}
            disabled={recheckLoading}
            className="gap-2"
          >
            {recheckLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-run Check
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ClearHireReviewModal;
