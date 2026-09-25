import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import {
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  Building,
  CreditCard,
  FileCheck,
  ShieldAlert,
  Loader2,
  Clock,
  CheckCircle2,
  Save,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StepUpRevealModal } from "../modals/StepUpRevealModal";

interface PayrollTaxTabProps {
  employeeId: string;
  employeeName: string;
}

export function PayrollTaxTab({ employeeId, employeeName }: PayrollTaxTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Step-up reveal state
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [activeRevealField, setActiveRevealField] = useState<"ssn" | "bank_account" | "routing_number">("ssn");
  const [activeRevealLabel, setActiveRevealLabel] = useState("");

  // Revealed values in memory with expiration timer
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<number | null>(null);

  // Edit states for compensation & banking
  const [isEditing, setIsEditing] = useState(false);
  const [payRate, setPayRate] = useState("");
  const [payType, setPayType] = useState("hourly");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [ssnInput, setSsnInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ item: any }>(`/api/employees/${employeeId}/payroll-tax`);
      setData(res.item);
      setPayRate(res.item?.payRate || "");
      setPayType(res.item?.payType || "hourly");
      setBankName(res.item?.bankInfo?.bankName || "");
      setAccountHolderName(res.item?.bankInfo?.accountHolderName || employeeName);
      setAccountType(res.item?.bankInfo?.accountType || "checking");
    } catch (err: any) {
      setError(err?.message || "Failed to load restricted payroll information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [employeeId]);

  // Countdown timer for re-masking
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        setRevealedValues({});
        setCountdown(null);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleOpenReveal = (field: "ssn" | "bank_account" | "routing_number", label: string) => {
    setActiveRevealField(field);
    setActiveRevealLabel(label);
    setRevealModalOpen(true);
  };

  const handleRevealed = (field: string, value: string) => {
    setRevealedValues((prev) => ({ ...prev, [field]: value }));
    setCountdown(60); // 60 seconds auto-remask timer
  };

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      await apiFetch(`/api/employees/${employeeId}/payroll-tax`, {
        method: "PUT",
        body: JSON.stringify({
          payType,
          payRate,
          compensation: { amount: Number(payRate) || 0, type: payType, currency: "USD" },
          ...(ssnInput && { ssn: ssnInput }),
          bankInfo: {
            bankName,
            accountHolderName,
            accountType,
            ...(accountNumber && { accountNumber }),
            ...(routingNumber && { routingNumber }),
          },
        }),
      });

      setSaveSuccess(true);
      setIsEditing(false);
      setAccountNumber("");
      setRoutingNumber("");
      setSsnInput("");
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchPayrollData();
    } catch (err: any) {
      setError(err?.message || "Failed to save payroll & tax changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        <span>Loading restricted payroll records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-300">
              Restricted HR & Payroll Information
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tax Identifiers, Social Security Numbers, and Direct Deposit Banking details are encrypted with AES-256-GCM.
              Data is masked by default and access requires step-up authentication.
            </p>
          </div>
        </div>

        {countdown !== null && countdown > 0 && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1.5 text-xs py-1 px-3">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            Auto-remasking in {countdown}s
          </Badge>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Payroll & Direct Deposit settings updated successfully.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Compensation & Direct Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compensation Card */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Compensation & Wage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Pay Basis</span>
                <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize">
                  {data?.payType || "Hourly"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Standard Rate</span>
                <span className="text-base font-bold text-emerald-400">
                  ${data?.payRate || "0.00"} {data?.payType === "monthly" ? "/ month" : "/ hr"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Currency</span>
                <span className="text-xs font-semibold text-white">USD ($)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Identity & SSN Card */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-amber-400" />
              Tax Identification (SSN / Tax ID)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Social Security Number</div>
                  <div className="text-sm font-mono font-bold text-white mt-1">
                    {revealedValues["ssn"] || data?.ssnMasked || "***-**-6789"}
                  </div>
                </div>

                {data?.hasSsn ? (
                  revealedValues["ssn"] ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      Revealed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReveal("ssn", "Social Security Number (SSN)")}
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5 h-8 text-xs font-medium"
                    >
                      <Lock className="h-3.5 w-3.5" /> Reveal SSN
                    </Button>
                  )
                ) : (
                  <Badge variant="outline" className="border-slate-800 text-slate-500 text-xs">
                    Not on file
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Deposit & Banking Information Card */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-400" />
            Direct Deposit & Banking Information
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-8"
          >
            {isEditing ? "Cancel Editing" : "Edit Direct Deposit"}
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          {isEditing ? (
            <form onSubmit={handleSavePayroll} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Bank Name</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Chase, Bank of America"
                    className="bg-slate-950 border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Account Holder Name</label>
                  <Input
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Legal Name on Account"
                    className="bg-slate-950 border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Account Type</label>
                  <Input
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    placeholder="checking / savings"
                    className="bg-slate-950 border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    New Account Number (will be encrypted)
                  </label>
                  <Input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter Account Number"
                    className="bg-slate-950 border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    New Routing Number (9 Digits)
                  </label>
                  <Input
                    type="password"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Enter Routing Number"
                    className="bg-slate-950 border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium gap-1.5"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Banking Details
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-xs text-slate-400">Financial Institution</div>
                <div className="text-sm font-semibold text-white">
                  {data?.bankInfo?.bankName || "Direct Deposit Not Configured"}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {data?.bankInfo?.accountType || "Checking"} Account
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">Account Number</div>
                  {data?.bankInfo?.accountNumberMasked && !revealedValues["bank_account"] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenReveal("bank_account", "Bank Account Number")}
                      className="h-6 px-1.5 text-[11px] text-amber-400 hover:text-amber-300"
                    >
                      <Lock className="h-3 w-3 mr-1" /> Reveal
                    </Button>
                  )}
                </div>
                <div className="text-sm font-mono font-semibold text-white">
                  {revealedValues["bank_account"] || data?.bankInfo?.accountNumberMasked || "•••• 4589"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">Routing Transit Number</div>
                  {data?.bankInfo?.routingNumberMasked && !revealedValues["routing_number"] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenReveal("routing_number", "Routing Transit Number")}
                      className="h-6 px-1.5 text-[11px] text-amber-400 hover:text-amber-300"
                    >
                      <Lock className="h-3 w-3 mr-1" /> Reveal
                    </Button>
                  )}
                </div>
                <div className="text-sm font-mono font-semibold text-white">
                  {revealedValues["routing_number"] || data?.bankInfo?.routingNumberMasked || "•••• 0021"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-Up Password Reveal Modal */}
      <StepUpRevealModal
        isOpen={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        employeeId={employeeId}
        field={activeRevealField}
        fieldLabel={activeRevealLabel}
        onRevealed={handleRevealed}
      />
    </div>
  );
}
