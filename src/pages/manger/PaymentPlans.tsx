import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/manger/ui/table";
import { apiFetch } from "@/lib/manger/api";
import { cn } from "@/lib/manger/utils";
import { Eye, CreditCard, ArrowLeft, Calendar, DollarSign, User, Building } from "lucide-react";
import { Button } from "@/components/manger/ui/button";

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

type ScheduleItem = {
  _id: string;
  paymentNumber: number;
  dueDate: string;
  dueTime?: string;
  amount: number;
  status: "pending" | "paid" | "missed";
  paidAt?: string;
};

type PlanDetail = {
  _id: string;
  tenantId: string;
  propertyId: string;
  totalBalance: number;
  remainingBalance: number;
  status: PlanStatus;
  agreementNotes?: string;
  createdBy?: string;
  createdAt: string;
  tenant?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    amount?: number;
  };
  property?: { name: string; status?: string };
  schedule?: ScheduleItem[];
};

function statusBadge(status: PlanStatus) {
  const base = "text-xs font-semibold";
  if (status === "completed")
    return <Badge className={cn(base, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20")}>Completed</Badge>;
  if (status === "defaulted")
    return <Badge className={cn(base, "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20")}>Defaulted</Badge>;
  if (status === "active")
    return <Badge className={cn(base, "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20")}>Active</Badge>;
  return <Badge className={cn(base, "bg-muted text-muted-foreground border border-border")}>Draft</Badge>;
}

function scheduleStatusBadge(status: ScheduleItem["status"]) {
  const base = "text-[10px] font-semibold px-2 py-0.5 rounded-full";
  if (status === "paid") return <span className={cn(base, "bg-emerald-500/15 text-emerald-700")}>Paid</span>;
  if (status === "missed") return <span className={cn(base, "bg-red-500/15 text-red-700")}>Missed</span>;
  return <span className={cn(base, "bg-amber-500/15 text-amber-700")}>Pending</span>;
}

// Mobile card view for list items
function MobilePlanCard({ plan, onView }: { plan: any; onView: () => void }) {
  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{plan.tenantName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{plan.propertyName}</span>
            </div>
          </div>
          {statusBadge(plan.status)}
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
            <p className="text-sm font-semibold">${Number(plan.totalBalance || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-sm font-semibold">${Number(plan.remainingBalance || 0).toFixed(2)}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

// Mobile schedule card view
function MobileScheduleCard({ item }: { item: ScheduleItem }) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-semibold">Payment #{item.paymentNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Due: {item.dueDate || "-"} {item.dueTime ? `at ${item.dueTime}` : ""}
            </p>
          </div>
          {scheduleStatusBadge(item.status)}
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Amount</span>
          <span className="text-base font-bold text-primary">${Number(item.amount || 0).toFixed(2)}</span>
        </div>
        {item.paidAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Paid: {new Date(item.paidAt).toLocaleDateString("en-US")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PaymentPlans() {
  const navigate = useNavigate();
  const params = useParams();
  const planId = params.id;

  const [items, setItems] = useState<PaymentPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await apiFetch<{ items: PaymentPlanListItem[] }>("/api/payment-plans?status=all");
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
  }, []);

  useEffect(() => {
    if (!planId) {
      setDetail(null);
      return;
    }
    let mounted = true;
    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const res = await apiFetch<{ item: PlanDetail }>(`/api/payment-plans/${encodeURIComponent(planId)}`);
        if (!mounted) return;
        setDetail(res.item || null);
      } catch (e) {
        if (!mounted) return;
        setDetailError(e instanceof Error ? e.message : "Failed to load plan details");
      } finally {
        if (!mounted) return;
        setDetailLoading(false);
      }
    };

    void loadDetail();
    return () => {
      mounted = false;
    };
  }, [planId]);

  const rows = useMemo(() => {
    return items.map((p) => {
      const tenantName = p.tenant?.name || (p.tenantId && typeof p.tenantId === "object" ? p.tenantId.name : "-");
      const propertyName = p.property?.name || (p.propertyId && typeof p.propertyId === "object" ? p.propertyId.name : "-");
      return { ...p, tenantName, propertyName };
    });
  }, [items]);

  // Detail view
  if (planId) {
    if (detailLoading) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (detailError) {
      return (
        <div className="space-y-4 p-4 sm:p-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/manager/payment-plans")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {detailError}
          </div>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="space-y-4 p-4 sm:p-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/manager/payment-plans")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
          <div className="text-sm text-muted-foreground">Plan not found.</div>
        </div>
      );
    }

    const schedule = detail.schedule || [];
    const paidTotal = schedule.filter((s) => s.status === "paid").reduce((a, s) => a + (Number(s.amount) || 0), 0);

    return (
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/manager/payment-plans")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </div>

        {/* Responsive grid - stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Tenant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium break-words">{detail.tenant?.name || "-"}</p>
              {detail.tenant?.email && <p className="text-xs text-muted-foreground break-words">{detail.tenant.email}</p>}
              {detail.tenant?.phone && <p className="text-xs text-muted-foreground">{detail.tenant.phone}</p>}
              {detail.tenant?.address && <p className="text-xs text-muted-foreground break-words">{detail.tenant.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium break-words">{detail.property?.name || "-"}</p>
              <p className="text-xs text-muted-foreground">Status: {detail.property?.status || "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Balance</span>
                <span className="font-medium">${Number(detail.totalBalance || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">${Number(detail.remainingBalance || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid so far</span>
                <span className="font-medium text-emerald-600">${paidTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span>{statusBadge(detail.status)}</span>
              </div>
              {detail.agreementNotes && (
                <div className="pt-2 border-t text-xs text-muted-foreground break-words">
                  {detail.agreementNotes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Payment Schedule ({schedule.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="text-sm text-muted-foreground">No schedule items.</div>
            ) : (
              <>
                {/* Desktop Table View - hidden on mobile */}
                <div className="hidden sm:block w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Due Date</TableHead>
                        <TableHead className="text-xs">Due Time</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Paid At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((s) => (
                        <TableRow key={s._id || s.paymentNumber}>
                          <TableCell className="text-sm font-medium">{s.paymentNumber}</TableCell>
                          <TableCell className="text-sm">{s.dueDate || "-"}</TableCell>
                          <TableCell className="text-sm">{s.dueTime || "-"}</TableCell>
                          <TableCell className="text-sm">${Number(s.amount || 0).toFixed(2)}</TableCell>
                          <TableCell>{scheduleStatusBadge(s.status)}</TableCell>
                          <TableCell className="text-sm">{s.paidAt ? new Date(s.paidAt).toLocaleDateString("en-US") : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View - visible only on mobile */}
                <div className="sm:hidden">
                  {schedule.map((s) => (
                    <MobileScheduleCard key={s._id || s.paymentNumber} item={s} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Payment Plans</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View all payment plans and schedules.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg font-semibold">All Plans ({rows.length})</CardTitle>
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
            <>
              {/* Desktop Table View - hidden on mobile */}
              <div className="hidden sm:block w-full overflow-x-auto">
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
                        <TableCell className="font-medium text-sm">{p.tenantName}</TableCell>
                        <TableCell className="text-sm">{p.propertyName}</TableCell>
                        <TableCell className="text-sm">${Number(p.totalBalance || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">${Number(p.remainingBalance || 0).toFixed(2)}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/manager/payment-plans/${encodeURIComponent(p._id)}`)}
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

              {/* Mobile Card View - visible only on mobile */}
              <div className="sm:hidden">
                {rows.map((p) => (
                  <MobilePlanCard 
                    key={p._id} 
                    plan={p} 
                    onView={() => navigate(`/manager/payment-plans/${encodeURIComponent(p._id)}`)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}