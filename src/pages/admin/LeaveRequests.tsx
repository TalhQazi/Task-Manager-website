import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";

type LeaveStatus = "pending" | "approved" | "rejected";

type LeaveItem = {
  id: string;
  _id?: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  exemptFromEOD?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
};

function normalizeLeave(i: any): LeaveItem {
  return {
    id: String(i.id || i._id || ""),
    employeeName: String(i.employeeName || ""),
    type: String(i.type || "other"),
    startDate: String(i.startDate),
    endDate: String(i.endDate),
    status: i.status as LeaveStatus,
    reason: i.reason,
    exemptFromEOD: Boolean(i.exemptFromEOD),
    approvedAt: i.approvedAt,
    approvedBy: i.approvedBy,
    createdAt: i.createdAt,
  };
}

function statusBadge(status: LeaveStatus) {
  if (status === "approved") return <Badge className="bg-green-600">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

export default function AdminLeaveRequests() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<LeaveItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: any[] }>("/api/leave-requests/all");
      const normalized = (res.items || []).map(normalizeLeave);
      setItems(normalized);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.employeeName.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q)
    );
  }, [items, search]);

  const approve = async (id: string) => {
    try {
      setActionLoading(true);
      await apiFetch(`/api/leave-requests/${encodeURIComponent(id)}/approve`, { method: "PUT" });
      toast.success("Approved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const openReject = (item: LeaveItem) => {
    setSelected(item);
    setRejectReason("");
    setRejectOpen(true);
  };

  const reject = async () => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await apiFetch(`/api/leave-requests/${encodeURIComponent(selected.id)}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason: rejectReason || "Request rejected" }),
      });
      toast.success("Rejected");
      setRejectOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-sm text-muted-foreground">Approve or reject employee PTO/leave requests.</p>
        </div>
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Search and manage leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee, type, status..." />
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>EOD</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell className="capitalize">{r.type}</TableCell>
                        <TableCell>
                          {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell>{r.exemptFromEOD ? <Badge variant="outline">Exempt</Badge> : <Badge variant="outline">Required</Badge>}</TableCell>
                        <TableCell className="text-right">
                          {r.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => void approve(r.id)} disabled={actionLoading}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openReject(r)} disabled={actionLoading}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              {r.status === "approved" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                              {r.status}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reject Request
            </DialogTitle>
            <DialogDescription>Optionally provide a reason. Employee will see it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={() => void reject()} disabled={actionLoading}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
