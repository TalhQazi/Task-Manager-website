import React from "react";
import { Check, ClipboardCheck, Copy, Hash, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { getAuthState } from "@/lib/auth";
import { toast } from "sonner";

export interface LocationComplianceItem {
  status?: string;
  option?: string;
  date?: string;
  accountNumber?: string;
  notes: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LocationComplianceChecklist {
  water: { status: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
  power: { status: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
  townPermitDemo: { status: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
  townPermitRenovations: { status: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
  sitePlanReview: { option: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
  certificateOfOccupancy: { status: string; date: string; accountNumber?: string; notes: string; updatedBy?: string; updatedAt?: string };
}

export interface LocationAccountNumberItem {
  label: string;
  accountNumber: string;
  provider?: string;
  notes?: string;
}

export const DEFAULT_COMPLIANCE_CHECKLIST: LocationComplianceChecklist = {
  water: { status: "Pending", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
  power: { status: "Pending", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
  townPermitDemo: { status: "Pending", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
  townPermitRenovations: { status: "Pending", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
  sitePlanReview: { option: "Needed", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
  certificateOfOccupancy: { status: "Pending", date: "", accountNumber: "", notes: "", updatedBy: "", updatedAt: "" },
};

export function normalizeComplianceChecklist(raw?: Partial<LocationComplianceChecklist> | null): LocationComplianceChecklist {
  const cl = raw || {};
  return {
    water: {
      status: cl.water?.status || "Pending",
      accountNumber: cl.water?.accountNumber || "",
      notes: cl.water?.notes || "",
      updatedBy: cl.water?.updatedBy || "",
      updatedAt: cl.water?.updatedAt || "",
    },
    power: {
      status: cl.power?.status || "Pending",
      accountNumber: cl.power?.accountNumber || "",
      notes: cl.power?.notes || "",
      updatedBy: cl.power?.updatedBy || "",
      updatedAt: cl.power?.updatedAt || "",
    },
    townPermitDemo: {
      status: cl.townPermitDemo?.status || "Pending",
      accountNumber: cl.townPermitDemo?.accountNumber || "",
      notes: cl.townPermitDemo?.notes || "",
      updatedBy: cl.townPermitDemo?.updatedBy || "",
      updatedAt: cl.townPermitDemo?.updatedAt || "",
    },
    townPermitRenovations: {
      status: cl.townPermitRenovations?.status || "Pending",
      accountNumber: cl.townPermitRenovations?.accountNumber || "",
      notes: cl.townPermitRenovations?.notes || "",
      updatedBy: cl.townPermitRenovations?.updatedBy || "",
      updatedAt: cl.townPermitRenovations?.updatedAt || "",
    },
    sitePlanReview: {
      option: cl.sitePlanReview?.option || "Needed",
      accountNumber: cl.sitePlanReview?.accountNumber || "",
      notes: cl.sitePlanReview?.notes || "",
      updatedBy: cl.sitePlanReview?.updatedBy || "",
      updatedAt: cl.sitePlanReview?.updatedAt || "",
    },
    certificateOfOccupancy: {
      status: cl.certificateOfOccupancy?.status || "Pending",
      date: cl.certificateOfOccupancy?.date || "",
      accountNumber: cl.certificateOfOccupancy?.accountNumber || "",
      notes: cl.certificateOfOccupancy?.notes || "",
      updatedBy: cl.certificateOfOccupancy?.updatedBy || "",
      updatedAt: cl.certificateOfOccupancy?.updatedAt || "",
    },
  };
}

export function normalizeAccountNumbers(raw?: unknown): LocationAccountNumberItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    label: String(item?.label || "").trim(),
    accountNumber: String(item?.accountNumber || "").trim(),
    provider: String(item?.provider || "").trim(),
    notes: String(item?.notes || "").trim(),
  }));
}

export function LocationComplianceFormSection({
  checklist,
  onChange,
  accountNumbers = [],
  onAccountNumbersChange,
}: {
  checklist: LocationComplianceChecklist;
  onChange: (updated: LocationComplianceChecklist) => void;
  accountNumbers?: LocationAccountNumberItem[];
  onAccountNumbersChange?: (updated: LocationAccountNumberItem[]) => void;
}) {
  const STATUS_OPTIONS = ["Pending", "In Progress", "Approved", "Completed", "Not Applicable"];
  const SITE_PLAN_OPTIONS = ["Needed", "Not Needed", "Under Review", "Approved"];
  const OCCUPANCY_OPTIONS = ["Pending", "In Progress", "Issued", "Approved", "Not Applicable"];

  const auth = getAuthState();
  const currentUserName = auth.name || auth.username || "Admin";

  const stamp = () => ({
    updatedBy: currentUserName,
    updatedAt: new Date().toISOString(),
  });

  const normalized = normalizeComplianceChecklist(checklist);

  const handleAddAccount = () => {
    if (!onAccountNumbersChange) return;
    onAccountNumbersChange([
      ...accountNumbers,
      { label: "", accountNumber: "", provider: "", notes: "" },
    ]);
  };

  const handleUpdateAccount = (index: number, patch: Partial<LocationAccountNumberItem>) => {
    if (!onAccountNumbersChange) return;
    onAccountNumbersChange(
      accountNumbers.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveAccount = (index: number) => {
    if (!onAccountNumbersChange) return;
    onAccountNumbersChange(accountNumbers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-600" />
          <Label className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Location Compliance Checklist &amp; Account Numbers
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Water */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Water</Label>
            {normalized.water.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.water.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <Select
              value={normalized.water.status}
              onValueChange={(val) =>
                onChange({ ...normalized, water: { ...normalized.water, ...stamp(), status: val } })
              }
            >
              <SelectTrigger className="h-8 text-xs border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Water Account #"
              value={normalized.water.accountNumber || ""}
              onChange={(e) =>
                onChange({ ...normalized, water: { ...normalized.water, ...stamp(), accountNumber: e.target.value } })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Water notes (optional)"
              value={normalized.water.notes}
              onChange={(e) =>
                onChange({ ...normalized, water: { ...normalized.water, ...stamp(), notes: e.target.value } })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Power */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Power</Label>
            {normalized.power.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.power.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <Select
              value={normalized.power.status}
              onValueChange={(val) =>
                onChange({ ...normalized, power: { ...normalized.power, ...stamp(), status: val } })
              }
            >
              <SelectTrigger className="h-8 text-xs border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Power Account #"
              value={normalized.power.accountNumber || ""}
              onChange={(e) =>
                onChange({ ...normalized, power: { ...normalized.power, ...stamp(), accountNumber: e.target.value } })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Power notes (optional)"
              value={normalized.power.notes}
              onChange={(e) =>
                onChange({ ...normalized, power: { ...normalized.power, ...stamp(), notes: e.target.value } })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Town permit for demo */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Town Permit for Demo</Label>
            {normalized.townPermitDemo.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.townPermitDemo.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <Select
              value={normalized.townPermitDemo.status}
              onValueChange={(val) =>
                onChange({ ...normalized, townPermitDemo: { ...normalized.townPermitDemo, ...stamp(), status: val } })
              }
            >
              <SelectTrigger className="h-8 text-xs border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Demo Permit / Account #"
              value={normalized.townPermitDemo.accountNumber || ""}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  townPermitDemo: { ...normalized.townPermitDemo, ...stamp(), accountNumber: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Demo permit notes"
              value={normalized.townPermitDemo.notes}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  townPermitDemo: { ...normalized.townPermitDemo, ...stamp(), notes: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Town permit for renovations */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Town Permit for Renovations
            </Label>
            {normalized.townPermitRenovations.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.townPermitRenovations.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <Select
              value={normalized.townPermitRenovations.status}
              onValueChange={(val) =>
                onChange({
                  ...normalized,
                  townPermitRenovations: { ...normalized.townPermitRenovations, ...stamp(), status: val },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Renovation Permit / Account #"
              value={normalized.townPermitRenovations.accountNumber || ""}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  townPermitRenovations: {
                    ...normalized.townPermitRenovations,
                    ...stamp(),
                    accountNumber: e.target.value,
                  },
                })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Renovation permit notes"
              value={normalized.townPermitRenovations.notes}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  townPermitRenovations: { ...normalized.townPermitRenovations, ...stamp(), notes: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Site plan review - needed or not needed */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Site Plan Review</Label>
            {normalized.sitePlanReview.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.sitePlanReview.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <Select
              value={normalized.sitePlanReview.option}
              onValueChange={(val) =>
                onChange({ ...normalized, sitePlanReview: { ...normalized.sitePlanReview, ...stamp(), option: val } })
              }
            >
              <SelectTrigger className="h-8 text-xs border-slate-200">
                <SelectValue placeholder="Needed or Not Needed?" />
              </SelectTrigger>
              <SelectContent>
                {SITE_PLAN_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Site Plan Ref / Account #"
              value={normalized.sitePlanReview.accountNumber || ""}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  sitePlanReview: { ...normalized.sitePlanReview, ...stamp(), accountNumber: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Site plan review notes"
              value={normalized.sitePlanReview.notes}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  sitePlanReview: { ...normalized.sitePlanReview, ...stamp(), notes: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Certificate of occupancy */}
        <div className="space-y-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Certificate of Occupancy
            </Label>
            {normalized.certificateOfOccupancy.updatedBy && (
              <span className="text-[10px] text-slate-400">by {normalized.certificateOfOccupancy.updatedBy}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="grid grid-cols-2 gap-1">
              <Select
                value={normalized.certificateOfOccupancy.status}
                onValueChange={(val) =>
                  onChange({
                    ...normalized,
                    certificateOfOccupancy: { ...normalized.certificateOfOccupancy, ...stamp(), status: val },
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPANCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={normalized.certificateOfOccupancy.date}
                onChange={(e) =>
                  onChange({
                    ...normalized,
                    certificateOfOccupancy: { ...normalized.certificateOfOccupancy, ...stamp(), date: e.target.value },
                  })
                }
                className="h-8 text-xs px-1 border-slate-200"
                placeholder="Date"
              />
            </div>
            <Input
              placeholder="Certificate / Account #"
              value={normalized.certificateOfOccupancy.accountNumber || ""}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  certificateOfOccupancy: {
                    ...normalized.certificateOfOccupancy,
                    ...stamp(),
                    accountNumber: e.target.value,
                  },
                })
              }
              className="h-7 text-xs border-slate-200 font-mono"
            />
            <Input
              placeholder="Occupancy certificate notes"
              value={normalized.certificateOfOccupancy.notes}
              onChange={(e) =>
                onChange({
                  ...normalized,
                  certificateOfOccupancy: { ...normalized.certificateOfOccupancy, ...stamp(), notes: e.target.value },
                })
              }
              className="h-7 text-xs border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Additional Utility & Location Account Numbers */}
      {onAccountNumbersChange && (
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-indigo-600" />
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Additional Account Numbers ({accountNumbers.length})
              </Label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAccount} className="h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Account #
            </Button>
          </div>
          {accountNumbers.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              Optional: add extra utility or service account numbers (e.g., Gas, Sewer, Internet, Trash).
            </p>
          ) : (
            <div className="space-y-2">
              {accountNumbers.map((acc, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 items-center"
                >
                  <Input
                    placeholder="Service (e.g. Gas)"
                    value={acc.label}
                    onChange={(e) => handleUpdateAccount(idx, { label: e.target.value })}
                    className="h-7 text-xs sm:col-span-3"
                  />
                  <Input
                    placeholder="Account #"
                    value={acc.accountNumber}
                    onChange={(e) => handleUpdateAccount(idx, { accountNumber: e.target.value })}
                    className="h-7 text-xs font-mono sm:col-span-4"
                  />
                  <Input
                    placeholder="Provider / Notes"
                    value={acc.provider || acc.notes || ""}
                    onChange={(e) => handleUpdateAccount(idx, { provider: e.target.value, notes: e.target.value })}
                    className="h-7 text-xs sm:col-span-4"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAccount(idx)}
                    className="h-7 w-7 text-rose-500 hover:text-rose-700 sm:col-span-1 justify-self-end"
                    title="Remove account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CopyableAccountBadge({ label, value }: { label?: string; value?: string }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${label || "account number"}`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md bg-slate-100 dark:bg-slate-900/60 px-2 py-1 border border-slate-200/80 dark:border-slate-700">
      <div className="flex items-center gap-1 min-w-0">
        <Hash className="h-3 w-3 text-slate-500 shrink-0" />
        <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200 truncate" title={value}>
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-500 hover:text-blue-600 p-0.5 rounded shrink-0"
        title="Copy Account #"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export function LocationComplianceViewSection({
  checklist,
  accountNumbers = [],
}: {
  checklist?: Partial<LocationComplianceChecklist> | null;
  accountNumbers?: LocationAccountNumberItem[];
}) {
  const normalized = normalizeComplianceChecklist(checklist);

  const cards = [
    {
      title: "Water",
      badge: normalized.water.status,
      badgeClass: "bg-blue-100 text-blue-700",
      item: normalized.water,
    },
    {
      title: "Power",
      badge: normalized.power.status,
      badgeClass: "bg-amber-100 text-amber-700",
      item: normalized.power,
    },
    {
      title: "Town Permit for Demo",
      badge: normalized.townPermitDemo.status,
      badgeClass: "bg-purple-100 text-purple-700",
      item: normalized.townPermitDemo,
    },
    {
      title: "Town Permit for Renovations",
      badge: normalized.townPermitRenovations.status,
      badgeClass: "bg-indigo-100 text-indigo-700",
      item: normalized.townPermitRenovations,
    },
    {
      title: "Site Plan Review",
      badge: normalized.sitePlanReview.option,
      badgeClass: "bg-emerald-100 text-emerald-700",
      item: normalized.sitePlanReview,
    },
    {
      title: "Certificate of Occupancy",
      badge: normalized.certificateOfOccupancy.status,
      badgeClass: "bg-green-100 text-green-700",
      item: normalized.certificateOfOccupancy,
      date: normalized.certificateOfOccupancy.date,
    },
  ];

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-blue-500" /> Location Compliance Checklist &amp; Account Numbers
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
        {cards.map((card) => (
          <div
            key={card.title}
            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between"
          >
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-100 block">{card.title}</span>
              <Badge className={`w-fit mt-1 text-[10px] border-0 ${card.badgeClass}`}>{card.badge}</Badge>
              <CopyableAccountBadge label={`${card.title} #`} value={card.item.accountNumber} />
              {card.date && (
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Date: {card.date}</p>
              )}
              {card.item.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 italic">"{card.item.notes}"</p>
              )}
            </div>
            {card.item.updatedBy && (
              <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                Verified by <span className="font-semibold text-slate-600 dark:text-slate-300">{card.item.updatedBy}</span>
                {card.item.updatedAt && ` on ${new Date(card.item.updatedAt).toLocaleDateString()}`}
              </p>
            )}
          </div>
        ))}
      </div>

      {accountNumbers.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" /> Additional Account Numbers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accountNumbers.map((acc, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs"
              >
                <div className="font-bold text-slate-700 dark:text-slate-100">{acc.label || "Account"}</div>
                <CopyableAccountBadge label={acc.label} value={acc.accountNumber} />
                {(acc.provider || acc.notes) && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{acc.provider || acc.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
