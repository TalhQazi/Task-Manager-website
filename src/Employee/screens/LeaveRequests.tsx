import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { createLeaveRequest, deleteLeaveRequest, getMyLeaveRequests } from "../lib/api";

type LeaveType = "pto" | "vacation" | "sick" | "holiday" | "unpaid" | "other";

type LeaveStatus = "pending" | "approved" | "rejected";

type LeaveRequestItem = {
  id: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  exemptFromEOD?: boolean;
  createdAt?: string;
};

function toDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusBadge(status: LeaveStatus) {
  if (status === "approved") return <Badge className="bg-green-600">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

export default function EmployeeLeaveRequests() {
  const today = useMemo(() => new Date(), []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<LeaveRequestItem[]>([]);

  const [type, setType] = useState<LeaveType>("pto");
  const [startDate, setStartDate] = useState(toDateInputValue(today));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyLeaveRequests();
      setItems(res.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await createLeaveRequest({
        type,
        startDate,
        endDate,
        reason,
        exemptFromEOD: true,
      });
      toast.success("Leave request submitted");
      setReason("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteLeaveRequest(id);
      toast.success("Leave request deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete leave request");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-sm text-muted-foreground">Request PTO/leave and track approval status.</p>
        </div>
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Request
          </CardTitle>
          <CardDescription>Submit a new leave request (admin will approve/reject).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                aria-label="Leave type"
              >
                <option value="pto">PTO</option>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="holiday">Holiday</option>
                <option value="unpaid">Unpaid</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason..." />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button onClick={() => void onSubmit()} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>Pending requests can be deleted before approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{r.type}</span>
                      {statusBadge(r.status)}
                      {r.exemptFromEOD ? <Badge variant="outline">EOD Exempt</Badge> : null}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </div>
                    {r.reason ? <div className="text-sm">{r.reason}</div> : null}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {r.status === "pending" ? (
                      <Button variant="outline" size="sm" onClick={() => void onDelete(r.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
