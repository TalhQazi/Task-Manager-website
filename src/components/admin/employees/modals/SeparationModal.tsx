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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { UserMinus, AlertTriangle, Loader2, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SeparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    role: string;
    department: string;
  };
  onSuccess: () => void;
}

export function SeparationModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: SeparationModalProps) {
  const [separationType, setSeparationType] = useState("resignation");
  const [separationDate, setSeparationDate] = useState(new Date().toISOString().slice(0, 10));
  const [separationReason, setSeparationReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!separationReason.trim()) {
      setError("Please provide a reason or notes for the separation");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/api/employees/${employee.id}/separation`, {
        method: "POST",
        body: JSON.stringify({
          separationType,
          separationDate,
          separationReason: separationReason.trim(),
          notes: notes.trim(),
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to process separation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Process Employee Separation
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Deactivates account and records official exit for {employee.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Deactivation Warning:</span> This will mark the employee as inactive, revoke platform login, and prompt an asset return audit.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Separation Type</label>
              <Select value={separationType} onValueChange={setSeparationType}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="resignation">Voluntary Resignation</SelectItem>
                  <SelectItem value="termination">Involuntary Termination</SelectItem>
                  <SelectItem value="layoff">Company Layoff / Reduction</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="other">Other Offboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Effective Date
              </label>
              <Input
                type="date"
                value={separationDate}
                onChange={(e) => setSeparationDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Primary Reason / Justification <span className="text-rose-400">*</span>
            </label>
            <Input
              value={separationReason}
              onChange={(e) => {
                setSeparationReason(e.target.value);
                setError("");
              }}
              placeholder="e.g. Relocating out of state, Accepted external offer, Performance review"
              className="bg-slate-950 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Exit Notes / Equipment Return Instructions</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Return company laptop and keys to HR office by Friday"
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

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
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-medium gap-2 shadow-lg shadow-rose-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Separation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
