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
import { Laptop, Loader2, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
}

export function AssetAssignModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSuccess,
}: AssetAssignModalProps) {
  const [assetType, setAssetType] = useState("laptop");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [details, setDetails] = useState("");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [conditionOnAssignment, setConditionOnAssignment] = useState("new");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Asset / Access Name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/api/employees/${employeeId}/assets`, {
        method: "POST",
        body: JSON.stringify({
          assetType,
          name: name.trim(),
          identifier: identifier.trim(),
          details: details.trim(),
          assignedDate,
          conditionOnAssignment,
          notes: notes.trim(),
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to assign asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Assign Asset or System Access
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Issue hardware, tools, or software credentials to {employeeName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Asset Type</label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="laptop">Laptop / Computer</SelectItem>
                  <SelectItem value="phone">Mobile Device / Tablet</SelectItem>
                  <SelectItem value="vehicle">Company Vehicle</SelectItem>
                  <SelectItem value="key">Physical Keys / Fob</SelectItem>
                  <SelectItem value="badge">Access Badge / Card</SelectItem>
                  <SelectItem value="software_access">Software License / Account</SelectItem>
                  <SelectItem value="credit_card">Corporate Card</SelectItem>
                  <SelectItem value="tool">Equipment / Tool</SelectItem>
                  <SelectItem value="other">Other Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Assigned Date
              </label>
              <Input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Asset / Tool Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 16 M3, Slack Pro License, Key Fob #42"
              className="bg-slate-950 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Serial Number / Tag ID / Account
              </label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. C02G90XXMD6M"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Condition on Issue</label>
              <Select value={conditionOnAssignment} onValueChange={setConditionOnAssignment}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="brand_new">Brand New (Boxed)</SelectItem>
                  <SelectItem value="good">Excellent / Good</SelectItem>
                  <SelectItem value="fair">Fair (Normal Wear)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Notes / Accessories Included</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes charger, USB-C adapter, laptop sleeve"
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 shadow-lg shadow-emerald-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Assign to Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
