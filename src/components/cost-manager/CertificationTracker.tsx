import React, { useState } from "react";
import {
  CERT_STATUS_META,
  CERT_TYPE_LABELS,
  CertificationRequirement,
  CertificationStatus,
  CertificationType,
  CostSheetPayload,
  centsToDollarInput,
  createCertification,
  deleteCertification,
  dollarsToCents,
  formatMoney,
  updateCertification,
} from "@/lib/costManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, CalendarClock, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

// Testing, lab work, UL listing, certifications, and permits. Costs sync into
// the "Certifications & Permits" cost section so they roll into prototype totals.
export default function CertificationTracker({
  projectId,
  certifications,
  currency,
  readOnly,
  onSaved,
  onError,
}: {
  projectId: string;
  certifications: CertificationRequirement[];
  currency: string;
  readOnly: boolean;
  onSaved: (payload: CostSheetPayload) => void;
  onError: (err: unknown) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogCert, setDialogCert] = useState<CertificationRequirement | null | "new">(null);

  const totalEstimated = certifications.reduce((s, c) => s + c.estimatedCostCents, 0);
  const totalPaid = certifications.reduce((s, c) => s + c.paidCents, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <Award className="w-4 h-4 text-primary" /> Certifications, Testing &amp; Permits
          <span className="text-xs text-muted-foreground font-normal">({certifications.length})</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Paid <span className="font-semibold text-green-600">{formatMoney(totalPaid, currency)}</span>
          {" / "}
          <span className="font-semibold text-foreground">{formatMoney(totalEstimated, currency)}</span>
        </span>
      </div>

      {!collapsed && (
        <div>
          {certifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No testing, UL listing, permit, or certification requirements yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/60 text-left">
                    <th className="px-3 py-1.5">Requirement</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Authority / Lab</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Due</th>
                    <th className="px-2 py-1.5 text-right">Est. Cost</th>
                    <th className="px-2 py-1.5 text-right">Paid</th>
                    <th className="px-2 py-1.5 w-14"></th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((cert) => {
                    const meta = CERT_STATUS_META[cert.status];
                    const overdue =
                      cert.dueDate &&
                      new Date(cert.dueDate) < new Date() &&
                      !["passed", "approved"].includes(cert.status);
                    return (
                      <tr key={cert.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-1.5">
                          <button
                            className="font-medium text-left hover:underline"
                            disabled={readOnly}
                            onClick={() => setDialogCert(cert)}
                          >
                            {cert.name}
                          </button>
                          {cert.requiredForPrototype && (
                            <span className="ml-1.5 text-[10px] text-red-600 font-semibold">REQ</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">{CERT_TYPE_LABELS[cert.requirementType]}</td>
                        <td className="px-2 py-1.5">{cert.authorityOrLab || "—"}</td>
                        <td className="px-2 py-1.5">
                          <Badge variant="outline" className={`text-[10px] ${meta.className}`}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className={`px-2 py-1.5 whitespace-nowrap ${overdue ? "text-red-600 font-semibold" : ""}`}>
                          {cert.dueDate ? (
                            <span className="flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              {new Date(cert.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                          {formatMoney(cert.estimatedCostCents, currency)}
                        </td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap text-green-600">
                          {formatMoney(cert.paidCents, currency)}
                        </td>
                        <td className="px-2 py-1.5">
                          {!readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={async () => {
                                if (!window.confirm(`Delete "${cert.name}" and its cost row?`)) return;
                                try {
                                  onSaved(await deleteCertification(cert.id));
                                } catch (err) {
                                  onError(err);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!readOnly && (
            <div className="px-3 py-2 border-t border-border/40">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-primary"
                onClick={() => setDialogCert("new")}
              >
                <Plus className="w-3.5 h-3.5" /> Add Requirement
              </Button>
            </div>
          )}
        </div>
      )}

      {dialogCert && (
        <CertDialog
          projectId={projectId}
          cert={dialogCert === "new" ? null : dialogCert}
          onClose={() => setDialogCert(null)}
          onSaved={(payload) => {
            onSaved(payload);
            setDialogCert(null);
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function CertDialog({
  projectId,
  cert,
  onClose,
  onSaved,
  onError,
}: {
  projectId: string;
  cert: CertificationRequirement | null;
  onClose: () => void;
  onSaved: (payload: CostSheetPayload) => void;
  onError: (err: unknown) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    requirementType: cert?.requirementType || ("lab_testing" as CertificationType),
    name: cert?.name || "",
    authorityOrLab: cert?.authorityOrLab || "",
    standard: cert?.standard || "",
    status: cert?.status || ("planned" as CertificationStatus),
    requiredForPrototype: cert?.requiredForPrototype ?? true,
    estimatedCost: cert ? centsToDollarInput(cert.estimatedCostCents) : "",
    paid: cert ? centsToDollarInput(cert.paidCents) : "",
    dueDate: toDateInput(cert?.dueDate ?? null),
    expirationDate: toDateInput(cert?.expirationDate ?? null),
    result: cert?.result || "",
    notes: cert?.notes || "",
  });

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        requirementType: form.requirementType,
        name: form.name.trim(),
        authorityOrLab: form.authorityOrLab,
        standard: form.standard,
        status: form.status,
        requiredForPrototype: form.requiredForPrototype,
        estimatedCostCents: dollarsToCents(form.estimatedCost),
        paidCents: dollarsToCents(form.paid),
        dueDate: form.dueDate || null,
        expirationDate: form.expirationDate || null,
        result: form.result,
        notes: form.notes,
      };
      const result = cert
        ? await updateCertification(cert.id, payload)
        : await createCertification(projectId, payload);
      onSaved(result);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cert ? "Edit Requirement" : "Add Certification / Testing / Permit"}</DialogTitle>
          <DialogDescription>
            The cost rolls into the project's "Certifications &amp; Permits" section and prototype totals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label className="text-xs">Requirement Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. UL listing review, NIJ impact test"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.requirementType} onValueChange={(v) => set("requirementType", v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CERT_TYPE_LABELS) as CertificationType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {CERT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CERT_STATUS_META) as CertificationStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {CERT_STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Authority / Lab</Label>
            <Input
              value={form.authorityOrLab}
              onChange={(e) => set("authorityOrLab", e.target.value)}
              placeholder="e.g. UL, NIJ lab, city permit office"
            />
          </div>
          <div>
            <Label className="text-xs">Standard / Category</Label>
            <Input
              value={form.standard}
              onChange={(e) => set("standard", e.target.value)}
              placeholder="e.g. UL 752, ASTM, ISO 9001"
            />
          </div>
          <div>
            <Label className="text-xs">Estimated Cost ($)</Label>
            <Input value={form.estimatedCost} onChange={(e) => set("estimatedCost", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label className="text-xs">Paid So Far ($)</Label>
            <Input value={form.paid} onChange={(e) => set("paid", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label className="text-xs">Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Expiration / Renewal Date</Label>
            <Input type="date" value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="cert-required"
              checked={form.requiredForPrototype}
              onCheckedChange={(c) => set("requiredForPrototype", c === true)}
            />
            <Label htmlFor="cert-required" className="text-xs cursor-pointer">
              Required for workable prototype
            </Label>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Result</Label>
            <Input value={form.result} onChange={(e) => set("result", e.target.value)} placeholder="e.g. Passed at Level 3" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[50px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {cert ? "Save Changes" : "Add Requirement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
