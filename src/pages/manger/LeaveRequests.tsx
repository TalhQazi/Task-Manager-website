import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/manger/ui/table";
import { apiFetch } from "@/lib/manger/api";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

type LeaveStatus = "pending" | "approved" | "rejected";

type LeaveItem = {
  id: string;
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

type LeaveApiItem = {
  id?: string;
  _id?: string;
  employeeName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  reason?: string;
  exemptFromEOD?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
};

function normalizeLeave(i: LeaveApiItem): LeaveItem {
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

export default function ManagerLeaveRequests() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: LeaveApiItem[] }>("/api/leave-requests/all");
      setItems((res.items || []).map(normalizeLeave));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-sm text-muted-foreground">View employee PTO/leave status (approved/rejected/pending).</p>
        </div>
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Managers can view statuses; approvals are handled by admin.</CardDescription>
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
                    <TableHead>Reason</TableHead>
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
                        <TableCell className="max-w-[360px] truncate">{r.reason || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
