import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { apiFetch } from "@/lib/admin/apiClient";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle, Pencil } from "lucide-react";

type PlanStatus = "draft" | "active" | "completed" | "defaulted";

type ScheduleStatus = "pending" | "paid" | "missed";

type Tenant = { _id: string; name: string };
type Property = { _id: string; name?: string };

type PaymentScheduleItem = {
  _id: string;
  planId: string;
  paymentNumber: number;
  dueDate: string;
  dueTime?: string;
  amount: number;
  status: ScheduleStatus;
  paidAt?: string | null;
};

type PaymentPlan = {
  _id: string;
  tenantId: string;
  propertyId: string;
  totalBalance: number;
  remainingBalance: number;
  status: PlanStatus;
  agreementNotes?: string;
  createdAt: string;
  tenant?: Tenant;
  property?: Property;
  schedule?: PaymentScheduleItem[];
};

function planStatusBadge(status: PlanStatus) {
  const base = "text-xs font-semibold";
  if (status === "completed") return <Badge className={cn(base, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20")}>Completed</Badge>;
  if (status === "defaulted") return <Badge className={cn(base, "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20")}>Defaulted</Badge>;
  if (status === "active") return <Badge className={cn(base, "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20")}>Active</Badge>;
  return <Badge className={cn(base, "bg-muted text-muted-foreground border border-border")}>Draft</Badge>;
}

function paymentStatusBadge(status: ScheduleStatus) {
  if (status === "paid") return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Paid</Badge>;
  if (status === "missed") return <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20">Missed</Badge>;
  return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20">Pending</Badge>;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PaymentPlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editDueTime, setEditDueTime] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setApiError(null);
      const res = await apiFetch<{ item: PaymentPlan }>(`/api/payment-plans/${encodeURIComponent(id)}`);
      setPlan(res.item);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load payment plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const schedule = useMemo(() => {
    const s = plan?.schedule;
    if (!Array.isArray(s)) return [];
    return [...s].sort((a, b) => a.paymentNumber - b.paymentNumber);
  }, [plan]);

  const onMarkPaid = async (scheduleId: string) => {
    if (!scheduleId) return;
    try {
      setActionLoadingId(scheduleId);
      await apiFetch(`/api/payment-schedule/${encodeURIComponent(scheduleId)}/paid`, { method: "POST" });
      await load();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to mark paid");
    } finally {
      setActionLoadingId(null);
    }
  };

  const onMarkMissed = async (scheduleId: string) => {
    if (!scheduleId) return;
    try {
      setActionLoadingId(scheduleId);
      await apiFetch(`/api/payment-schedule/${encodeURIComponent(scheduleId)}/missed`, { method: "POST" });
      await load();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to mark missed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEdit = (s: PaymentScheduleItem) => {
    setEditItemId(s._id);
    setEditDueDate(s.dueDate);
    setEditDueTime(s.dueTime || "");
    setEditAmount(String(s.amount));
    setEditOpen(true);
  };

  const canSaveEdit = useMemo(() => {
    if (!plan) return false;
    if (!editItemId) return false;
    if (!editDueDate) return false;
    if (editDueDate < todayIso()) return false;
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) return false;

    const nextSchedule = schedule.map((s) => {
      if (s._id !== editItemId) return s;
      return { ...s, dueDate: editDueDate, dueTime: editDueTime, amount: amt };
    });

    const sum = nextSchedule.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    return Number(sum.toFixed(2)) === Number(Number(plan.totalBalance || 0).toFixed(2));
  }, [plan, editItemId, editDueDate, editDueTime, editAmount, schedule]);

  const onSaveEdit = async () => {
    if (!plan || !id || !editItemId) return;

    const amt = Number(editAmount);
    const nextSchedule = schedule.map((s) => {
      if (s._id !== editItemId) return s;
      return { ...s, dueDate: editDueDate, dueTime: editDueTime, amount: amt };
    });

    try {
      setActionLoadingId(editItemId);
      await apiFetch(`/api/payment-plans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          schedule: nextSchedule.map((s) => ({
            paymentNumber: s.paymentNumber,
            dueDate: s.dueDate,
            dueTime: s.dueTime || "",
            amount: Number(s.amount),
          })),
        }),
      });
      setEditOpen(false);
      setEditItemId(null);
      await load();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to edit payment");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/admin/payment-plans")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded-lg border px-3 py-2 text-sm">{apiError || "Payment plan not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/payment-plans")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Payment Plan Details</h1>
            <div className="flex items-center gap-2">
              {planStatusBadge(plan.status)}
              <span className="text-sm text-muted-foreground">Total: ${Number(plan.totalBalance || 0).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">Remaining: ${Number(plan.remainingBalance || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agreement</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Tenant</div>
            <div className="font-medium">{plan.tenant?.name || "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Property</div>
            <div className="font-medium">{plan.property?.name || "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Balance</div>
            <div className="font-medium">${Number(plan.totalBalance || 0).toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Remaining Balance</div>
            <div className="font-medium">${Number(plan.remainingBalance || 0).toFixed(2)}</div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Agreement Notes</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.agreementNotes || "-"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Installments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Due Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.paymentNumber}</TableCell>
                    <TableCell>{s.dueDate}</TableCell>
                    <TableCell>{s.dueTime || "-"}</TableCell>
                    <TableCell>${Number(s.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{paymentStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionLoadingId === s._id || s.status === "paid"}
                          onClick={() => onMarkPaid(s._id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Paid
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionLoadingId === s._id || s.status === "missed"}
                          onClick={() => onMarkMissed(s._id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Mark Missed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionLoadingId === s._id}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={editDueDate} min={todayIso()} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Time</Label>
              <Input value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} placeholder="5PM" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} inputMode="decimal" />
              <div className="text-xs text-muted-foreground">Total split must remain equal to total balance.</div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={!!actionLoadingId}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} disabled={!canSaveEdit || !!actionLoadingId} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
