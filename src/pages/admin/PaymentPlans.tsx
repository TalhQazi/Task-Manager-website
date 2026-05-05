import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Label } from "@/components/admin/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { apiFetch } from "@/lib/admin/apiClient";
import { cn } from "@/lib/utils";
import { Plus, Eye, PlusCircle, Trash2, Save } from "lucide-react";

type PlanStatus = "draft" | "active" | "completed" | "defaulted";

type PaymentPlanListItem = {
  _id: string;
  tenantId: any;
  propertyId: any;
  tenant?: { _id: string; name: string };
  property?: { _id: string; name: string };
  totalBalance: number;
  remainingBalance: number;
  status: PlanStatus;
  createdAt: string;
};

type Tenant = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  amount?: number;
  status?: "active" | "inactive";
};

type Company = {
  _id: string;
  name: string;
  status?: string;
};

type DraftInstallment = {
  paymentNumber: number;
  dueDate: string;
  dueTime: string;
  amount: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusBadge(status: PlanStatus) {
  const base = "text-xs font-semibold";
  if (status === "completed") return <Badge className={cn(base, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20")}>Completed</Badge>;
  if (status === "defaulted") return <Badge className={cn(base, "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20")}>Defaulted</Badge>;
  if (status === "active") return <Badge className={cn(base, "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20")}>Active</Badge>;
  return <Badge className={cn(base, "bg-muted text-muted-foreground border border-border")}>Draft</Badge>;
}

export default function PaymentPlans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<PaymentPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const createOpen = String(searchParams.get("create") || "") === "1";

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [tenantId, setTenantId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [agreementNotes, setAgreementNotes] = useState<string>("");

  const [schedule, setSchedule] = useState<DraftInstallment[]>([
    { paymentNumber: 1, dueDate: "", dueTime: "", amount: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const status = String(searchParams.get("status") || "all");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await apiFetch<{ items: PaymentPlanListItem[] }>(`/api/payment-plans?status=${encodeURIComponent(status)}`);
        if (!mounted) return;
        setItems(Array.isArray(res.items) ? res.items : []);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load payment plans");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [status]);

  useEffect(() => {
    if (!createOpen) return;
    let mounted = true;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        setCreateError(null);
        const [tRes, cRes] = await Promise.all([
          apiFetch<{ items: Tenant[] }>("/api/tenants"),
          apiFetch<{ items: Company[] }>("/api/companies"),
        ]);
        if (!mounted) return;
        setTenants(Array.isArray(tRes.items) ? tRes.items : []);
        setCompanies(Array.isArray(cRes.items) ? cRes.items : []);
      } catch (e) {
        if (!mounted) return;
        setCreateError(e instanceof Error ? e.message : "Failed to load tenants/companies");
      } finally {
        if (!mounted) return;
        setLoadingMeta(false);
      }
    };

    void loadMeta();
    return () => {
      mounted = false;
    };
  }, [createOpen]);

  const rows = useMemo(() => {
    return items.map((p) => {
      const tenantName = p.tenant?.name || (p.tenantId && typeof p.tenantId === "object" ? p.tenantId.name : "") || "-";
      const propertyName = p.property?.name || (p.propertyId && typeof p.propertyId === "object" ? p.propertyId.name : "") || "-";
      return {
        ...p,
        tenantName,
        propertyName,
      };
    });
  }, [items]);

  const parsedTotal = useMemo(() => {
    const n = Number(totalBalance);
    return Number.isFinite(n) ? n : 0;
  }, [totalBalance]);

  const splitTotal = useMemo(() => {
    return schedule.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [schedule]);

  const splitTotalFixed = Number(splitTotal.toFixed(2));
  const parsedTotalFixed = Number(parsedTotal.toFixed(2));
  const isTotalMatch = splitTotalFixed === parsedTotalFixed;

  // Auto-fill total balance from selected tenant amount
  useEffect(() => {
    if (!createOpen) return;
    if (!tenantId) return;
    const tenant = tenants.find((t) => String(t._id) === String(tenantId));
    if (tenant && typeof tenant.amount === "number" && tenant.amount > 0) {
      setTotalBalance(String(tenant.amount));
    }
  }, [createOpen, tenantId, tenants]);

  useEffect(() => {
    if (!createOpen) return;
    if (!totalBalance) return;
    const total = Number(totalBalance);
    if (!Number.isFinite(total) || total <= 0) return;

    // Auto-fill all empty installment amounts to match total (evenly split if multiple)
    if (schedule.length > 0) {
      const amountPerInstallment = total / schedule.length;
      setSchedule((prev) =>
        prev.map((s) => ({
          ...s,
          amount: s.amount || String(amountPerInstallment.toFixed(2)),
        }))
      );
    }
  }, [createOpen, totalBalance]);

  const canSave = useMemo(() => {
    if (!tenantId) return false;
    if (!companyId) return false;
    if (parsedTotal <= 0) return false;
    if (schedule.length === 0) return false;
    if (!isTotalMatch) return false;
    for (const s of schedule) {
      if (!s.dueDate) return false;
      if (s.dueDate < todayIso()) return false;
      const amt = Number(s.amount);
      if (!Number.isFinite(amt) || amt <= 0) return false;
    }
    return true;
  }, [tenantId, companyId, parsedTotal, schedule, isTotalMatch]);

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

  const closeCreate = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
    setCreateError(null);
  };

  const resetCreateForm = () => {
    setTenantId("");
    setCompanyId("");
    setTotalBalance("");
    setAgreementNotes("");
    setSchedule([{ paymentNumber: 1, dueDate: "", dueTime: "", amount: "" }]);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setCreateError(null);

      const payload = {
        tenantId,
        propertyId: companyId,
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
      resetCreateForm();
      closeCreate();
      if (id) {
        navigate(`/admin/payment-plans/${encodeURIComponent(id)}`);
      } else {
        navigate("/admin/payment-plans");
      }
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create payment plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment Plans</h1>
          <p className="text-sm text-muted-foreground">Create, track, and manage installment-based payment agreements.</p>
        </div>
        <Button
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.set("create", "1");
            setSearchParams(next);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">All Plans</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                const next = new URLSearchParams(searchParams);
                if (v === "all") next.delete("status");
                else next.set("status", v);
                setSearchParams(next, { replace: true });
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {apiError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {apiError}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No payment plans found.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.tenantName}</TableCell>
                      <TableCell>{p.propertyName}</TableCell>
                      <TableCell>${Number(p.totalBalance || 0).toFixed(2)}</TableCell>
                      <TableCell>${Number(p.remainingBalance || 0).toFixed(2)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/admin/payment-plans/${encodeURIComponent(p._id)}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => (o ? null : closeCreate())}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Payment Plan</DialogTitle>
          </DialogHeader>

          {createError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select
                  value={tenantId}
                  onValueChange={(val) => setTenantId(val)}
                  disabled={loadingMeta || saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMeta ? "Loading..." : "Select tenant"} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {tenants.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Plan Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property (Company)</Label>
                    <Select
                      value={companyId}
                      onValueChange={(val) => setCompanyId(val)}
                      disabled={loadingMeta || saving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMeta ? "Loading..." : "Select property"} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {companies.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Balance</Label>
                    <Input value={totalBalance} onChange={(e) => setTotalBalance(e.target.value)} placeholder="$1200" inputMode="decimal" disabled={saving} />
                    <p className="text-xs text-muted-foreground">
                      Split total: ${splitTotalFixed}
                      {parsedTotal > 0 && !isTotalMatch ? ` (need $${parsedTotalFixed})` : ""}
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Agreement Notes (Optional)</Label>
                    <Textarea value={agreementNotes} onChange={(e) => setAgreementNotes(e.target.value)} placeholder="Notes..." rows={4} disabled={saving} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-sm">Payment Breakdown</CardTitle>
                  <Button variant="outline" onClick={addPayment} className="gap-2" disabled={saving}>
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
                                disabled={saving}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={p.dueTime}
                                onChange={(e) => updatePayment(idx, { dueTime: e.target.value })}
                                placeholder="5PM"
                                disabled={saving}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={p.amount}
                                onChange={(e) => updatePayment(idx, { amount: e.target.value })}
                                placeholder="$400"
                                inputMode="decimal"
                                disabled={saving}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePayment(idx)}
                                disabled={saving || schedule.length <= 1}
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
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeCreate} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={!canSave || saving || loadingMeta} className="gap-2">
              <Save className="h-4 w-4" />
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
