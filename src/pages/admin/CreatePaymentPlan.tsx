import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Label } from "@/components/admin/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { apiFetch } from "@/lib/admin/apiClient";
import { PlusCircle, Trash2, Save } from "lucide-react";

type Tenant = { _id: string; name: string };
type Property = { _id: string; name: string };

type DraftInstallment = {
  paymentNumber: number;
  dueDate: string;
  dueTime: string;
  amount: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreatePaymentPlan() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [tenantId, setTenantId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [agreementNotes, setAgreementNotes] = useState<string>("");

  const [schedule, setSchedule] = useState<DraftInstallment[]>([
    { paymentNumber: 1, dueDate: "", dueTime: "", amount: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingMeta(true);
        const [tRes, pRes] = await Promise.all([
          apiFetch<{ items: Tenant[] }>("/api/tenants"),
          apiFetch<{ items: Property[] }>("/api/properties"),
        ]);
        if (!mounted) return;
        setTenants(Array.isArray(tRes.items) ? tRes.items : []);
        setProperties(Array.isArray(pRes.items) ? pRes.items : []);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load tenants/properties");
      } finally {
        if (!mounted) return;
        setLoadingMeta(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const parsedTotal = useMemo(() => {
    const n = Number(totalBalance);
    return Number.isFinite(n) ? n : 0;
  }, [totalBalance]);

  const splitTotal = useMemo(() => {
    return schedule.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [schedule]);

  const canSave = useMemo(() => {
    if (!tenantId || !propertyId) return false;
    if (parsedTotal <= 0) return false;
    if (schedule.length === 0) return false;
    if (Number(splitTotal.toFixed(2)) !== Number(parsedTotal.toFixed(2))) return false;
    for (const s of schedule) {
      if (!s.dueDate) return false;
      if (s.dueDate < todayIso()) return false;
      const amt = Number(s.amount);
      if (!Number.isFinite(amt) || amt <= 0) return false;
    }
    return true;
  }, [tenantId, propertyId, parsedTotal, schedule, splitTotal]);

  const addPayment = () => {
    setSchedule((prev) => {
      const nextNum = prev.length + 1;
      return [...prev, { paymentNumber: nextNum, dueDate: "", dueTime: "", amount: "" }];
    });
  };

  const removePayment = (idx: number) => {
    setSchedule((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((p, i) => ({ ...p, paymentNumber: i + 1 }));
    });
  };

  const updatePayment = (idx: number, patch: Partial<DraftInstallment>) => {
    setSchedule((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setApiError(null);

      const payload = {
        tenantId,
        propertyId,
        totalBalance: parsedTotal,
        agreementNotes,
        schedule: schedule.map((s) => ({
          paymentNumber: s.paymentNumber,
          dueDate: s.dueDate,
          dueTime: s.dueTime,
          amount: Number(s.amount),
        })),
      };

      const res = await apiFetch<{ item: { _id: string } }>("/api/payment-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const id = res?.item?._id;
      if (id) {
        navigate(`/admin/payment-plans/${encodeURIComponent(id)}`);
      } else {
        navigate("/admin/payment-plans");
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to create payment plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Payment Plan</h1>
          <p className="text-sm text-muted-foreground">Build an installment schedule. Split total must match exactly.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/payment-plans")} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave || saving} className="gap-2">
            <Save className="h-4 w-4" />
            Save Plan
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select value={tenantId} onValueChange={setTenantId} disabled={loadingMeta}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMeta ? "Loading..." : "Select tenant"} />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId} disabled={loadingMeta}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMeta ? "Loading..." : "Select property"} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Total Balance</Label>
            <Input value={totalBalance} onChange={(e) => setTotalBalance(e.target.value)} placeholder="$1200" inputMode="decimal" />
            <p className="text-xs text-muted-foreground">Split total: ${Number(splitTotal || 0).toFixed(2)}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Agreement Notes (Optional)</Label>
            <Textarea value={agreementNotes} onChange={(e) => setAgreementNotes(e.target.value)} placeholder="Notes..." rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Payment Breakdown</CardTitle>
          <Button variant="outline" onClick={addPayment} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Payment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Due Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((p, idx) => (
                  <TableRow key={p.paymentNumber}>
                    <TableCell className="font-medium">{p.paymentNumber}</TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={p.dueDate}
                        min={todayIso()}
                        onChange={(e) => updatePayment(idx, { dueDate: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.dueTime}
                        onChange={(e) => updatePayment(idx, { dueTime: e.target.value })}
                        placeholder="5PM"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.amount}
                        onChange={(e) => updatePayment(idx, { amount: e.target.value })}
                        placeholder="$400"
                        inputMode="decimal"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePayment(idx)}
                        disabled={schedule.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Total balance must equal installments total.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
