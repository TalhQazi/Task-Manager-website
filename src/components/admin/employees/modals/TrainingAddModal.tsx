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
import { Switch } from "@/components/admin/ui/switch";
import { Award, Loader2, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TrainingAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
}

export function TrainingAddModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSuccess,
}: TrainingAddModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("certification");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState("");
  const [doesNotExpire, setDoesNotExpire] = useState(false);
  const [score, setScore] = useState("");
  const [evidenceFileUrl, setEvidenceFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Training / Certification name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/api/employees/${employeeId}/training`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          type,
          issuingAuthority: issuingAuthority.trim(),
          credentialId: credentialId.trim(),
          issueDate: issueDate || null,
          expirationDate: doesNotExpire ? null : expirationDate || null,
          doesNotExpire,
          score: score.trim(),
          evidenceFileUrl: evidenceFileUrl.trim(),
          notes: notes.trim(),
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save certification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Add Training or Certification
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Record credentials, safety training, and license renewal dates for {employeeName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Credential Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="certification">Professional Certification</SelectItem>
                  <SelectItem value="license">State / Trade License</SelectItem>
                  <SelectItem value="training">Internal Training Course</SelectItem>
                  <SelectItem value="safety">OSHA / Safety Compliance</SelectItem>
                  <SelectItem value="workshop">Technical Workshop</SelectItem>
                  <SelectItem value="other">Other Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Issuing Organization</label>
              <Input
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g. AWS, OSHA, State Board"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Certification / Course Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect, CPR & First Aid"
              className="bg-slate-950 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Credential ID / Number</label>
              <Input
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="e.g. AWS-PSA-10829"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Issue Date
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-medium text-white">Lifetime Credential (Does Not Expire)</div>
              <div className="text-[11px] text-slate-400">Toggle if this certification has no expiration date</div>
            </div>
            <Switch
              checked={doesNotExpire}
              onCheckedChange={setDoesNotExpire}
            />
          </div>

          {!doesNotExpire && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-400" />
                Expiration Date (System sends renewal alerts)
              </label>
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                required={!doesNotExpire}
              />
            </div>
          )}

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
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium gap-2 shadow-lg shadow-amber-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Credential
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
