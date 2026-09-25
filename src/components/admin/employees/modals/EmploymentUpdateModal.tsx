import { useMemo, useState } from "react";
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
import { Briefcase, Loader2, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DEPARTMENTS, DEPARTMENTS_AND_POSITIONS } from "@/constants/jobPositions";

interface EmploymentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    role: string;
    department: string;
    location: string;
    payType: string;
    payRate: string;
    shift: string;
    status: string;
  };
  onSuccess: () => void;
}

export function EmploymentUpdateModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EmploymentUpdateModalProps) {
  const [changeType, setChangeType] = useState("title_change");
  const [department, setDepartment] = useState(employee.department || "");
  const [role, setRole] = useState(employee.role || "");
  const [location, setLocation] = useState(employee.location || "");
  const [payType, setPayType] = useState(employee.payType || "hourly");
  const [payRate, setPayRate] = useState(employee.payRate || "");
  const [shift, setShift] = useState(employee.shift || "");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [changeReason, setChangeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const positionsForDept = useMemo(() => {
    if (!department) return [];
    const found = DEPARTMENTS_AND_POSITIONS.find(
      (d) => d.department.toLowerCase() === department.toLowerCase()
    );
    return found ? found.positions : [];
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please specify a job title / position");
      return;
    }
    if (!changeReason) {
      setError("Please provide a reason for this employment change");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/api/employees/${employee.id}/employment`, {
        method: "PUT",
        body: JSON.stringify({
          role,
          department,
          location,
          payType,
          payRate,
          shift,
          effectiveDate,
          changeReason,
          changeType,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update employment details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Record Career & Position Update
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Creates an effective-dated employment history record for {employee.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Action Type</label>
              <Select value={changeType} onValueChange={setChangeType}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="transfer">Department / Site Transfer</SelectItem>
                  <SelectItem value="title_change">Title Adjustment</SelectItem>
                  <SelectItem value="compensation_change">Wage / Salary Adjustment</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
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
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Department</label>
              <Select
                value={department}
                onValueChange={(val) => {
                  setDepartment(val);
                  setRole("");
                }}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-56">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Job Title / Role</label>
              {positionsForDept.length > 0 ? (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue placeholder="Select Position" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-56">
                    {positionsForDept.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Enter Job Title"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Location / Site</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Office"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Pay Type</label>
              <Select value={payType} onValueChange={setPayType}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="monthly">Monthly Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Pay Rate ($)</label>
              <Input
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                placeholder="e.g. 35.00"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Reason for Change / Justification <span className="text-rose-400">*</span>
            </label>
            <Input
              value={changeReason}
              onChange={(e) => {
                setChangeReason(e.target.value);
                setError("");
              }}
              placeholder="e.g. Annual performance promotion, department reorganization"
              className="bg-slate-950 border-slate-700 text-white"
              required
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
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Career Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
