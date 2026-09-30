import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Lock, ShieldAlert, KeyRound, Loader2, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface StepUpRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  field: "ssn" | "bank_account" | "routing_number";
  fieldLabel: string;
  onRevealed: (field: string, value: string, expiresAt: string) => void;
}

export function StepUpRevealModal({
  isOpen,
  onClose,
  employeeId,
  field,
  fieldLabel,
  onRevealed,
}: StepUpRevealModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your administrator password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch<{ field: string; value: string; expiresAt: string }>(
        `/api/employees/${employeeId}/sensitive/reveal`,
        {
          method: "POST",
          body: JSON.stringify({ field, password }),
        }
      );

      onRevealed(field, res.value, res.expiresAt);
      setPassword("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                Security Verification
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Step-up authentication required to reveal protected data
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
            <div className="text-xs text-slate-400">Target Field</div>
            <div className="text-sm font-semibold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="h-3.5 w-3.5" />
              {fieldLabel}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              This access will be logged with your user ID and IP address in the system audit log.
              Revealed data will automatically re-mask after 60 seconds.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              Confirm Administrator Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password to verify"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !password}
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium gap-2 shadow-lg shadow-amber-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Verify & Reveal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
