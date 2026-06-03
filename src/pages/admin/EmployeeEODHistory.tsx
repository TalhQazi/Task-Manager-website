import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Calendar, Clock, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch, getAdminEmployeeEODReports, toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface EODReport {
  id: string;
  userId: string;
  employeeName: string;
  date: string;
  rawInput: string;
  inputType: string;
  status: string;
  createdAt: string;
  clockIn?: string;
  clockOut?: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  totalHours?: number;
}

export default function EmployeeEODHistory() {
  const { employeeName } = useParams<{ employeeName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const avatar: string | undefined = (location.state as any)?.avatar;
  const [reports, setReports] = useState<EODReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);

  useEffect(() => {
    if (employeeName) {
      loadEmployeeEODReports();
    }
  }, [employeeName]);

  const loadEmployeeEODReports = async () => {
    setLoading(true);
    try {
      const decodedName = decodeURIComponent(employeeName || "");
      const res = await getAdminEmployeeEODReports(decodedName);
      let loadedReports = res.items || [];

      // Proactively fetch today's EOD status to see if today's report is missing/not submitted
      try {
        const todayStatusRes = await apiFetch<Array<{
          employeeId: string;
          employeeName: string;
          avatar?: string;
          status: string; // "submitted" | "missing" | "late" | "not_clocked_in"
          clockIn?: string;
          clockOut?: string;
          clockInAt?: string | null;
          clockOutAt?: string | null;
          reportSubmittedAt?: string;
        }>>("/api/admin/eod-status");

        const myTodayStatus = todayStatusRes.find(
          (emp) => emp.employeeName.toLowerCase() === decodedName.toLowerCase()
        );

        if (myTodayStatus && myTodayStatus.status !== "submitted") {
          const todayStr = new Date().toISOString().slice(0, 10);
          const hasTodayReport = loadedReports.some(
            (r) => new Date(r.date).toISOString().slice(0, 10) === todayStr
          );

          if (!hasTodayReport) {
            const virtualTodayReport: EODReport = {
              id: "virtual-today",
              userId: myTodayStatus.employeeId,
              employeeName: myTodayStatus.employeeName,
              date: new Date().toISOString(),
              rawInput: JSON.stringify({
                tasksCompleted: myTodayStatus.status === "not_clocked_in"
                  ? "Employee has not clocked in today."
                  : "End-of-day report has not been submitted yet.",
                issuesBlockers: "",
                notes: ""
              }),
              inputType: "text",
              status: myTodayStatus.status,
              createdAt: new Date().toISOString(),
              clockIn: myTodayStatus.clockIn,
              clockOut: myTodayStatus.clockOut,
              clockInAt: myTodayStatus.clockInAt,
              clockOutAt: myTodayStatus.clockOutAt,
              totalHours: undefined,
            };

            loadedReports = [virtualTodayReport, ...loadedReports];
          }
        }
      } catch (err) {
        console.error("Failed to load today's EOD status for virtual row:", err);
      }

      setReports(loadedReports);
    } catch (err) {
      console.error("Failed to load employee EOD reports:", err);
      toast.error("Failed to load employee EOD reports");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLocalClock = (timeStr?: string | null, isoAt?: string | null): string => {
    if (isoAt) {
      const d = new Date(isoAt);
      if (Number.isFinite(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }
    return String(timeStr || "").trim() || "--:--";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const parseEODData = (rawInput: string) => {
    try {
      return JSON.parse(rawInput);
    } catch {
      return { tasksCompleted: rawInput, issuesBlockers: "", notes: "" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 capitalize">
            Submitted
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 capitalize">
            Late
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50 capitalize">
            Missing
          </Badge>
        );
      case "not_clocked_in":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50 capitalize">
            Not Clocked In
          </Badge>
        );
      default:
        return <Badge variant="outline" className="capitalize">{status.replace(/_/g, " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/eod-reports")}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to All Reports
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card className="bg-gradient-to-r from-[#133767] to-[#1a4a8c] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              {avatar ? (
                <AvatarImage src={toProxiedUrl(avatar)} alt={employeeName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {getInitials(employeeName || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{employeeName}</h1>
              <div className="flex items-center gap-6 mt-2 text-sm text-white/80">
                <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                  {reports.length} reports
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EOD Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            EOD Report History
          </CardTitle>
          <CardDescription>
            Chronological view of all end-of-day reports for this employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-muted-foreground">Loading EOD reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No EOD reports found</p>
              <p className="text-sm mt-1">
                This employee has not submitted any EOD reports yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="w-2/5">Tasks Preview</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const eodData = parseEODData(report.rawInput);
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-[#133767]" />
                            <span className="font-medium">{formatDate(report.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{formatLocalClock(report.clockIn, report.clockInAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{formatLocalClock(report.clockOut, report.clockOutAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[#133767]">
                            {report.totalHours?.toFixed(2) || "--"}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-sm text-gray-700 truncate max-w-[300px]">
                              {eodData.tasksCompleted || "No tasks reported"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReport(report)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EOD Detail Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  EOD Report Details
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Employee</p>
                    <p className="text-sm font-medium">{selectedReport.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedReport.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clock In</p>
                    <p className="text-sm font-medium">{formatLocalClock(selectedReport.clockIn, selectedReport.clockInAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clock Out</p>
                    <p className="text-sm font-medium">{formatLocalClock(selectedReport.clockOut, selectedReport.clockOutAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Hours</p>
                    <p className="text-sm font-medium">
                      {selectedReport.totalHours ? `${selectedReport.totalHours.toFixed(2)}h` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>

                {/* EOD Content */}
                <div className="space-y-4">
                  {(() => {
                    const eodData = parseEODData(selectedReport.rawInput);
                    return (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Tasks Completed
                          </label>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {eodData.tasksCompleted || "No tasks reported"}
                            </p>
                          </div>
                        </div>

                        {eodData.issuesBlockers && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              Issues / Blockers
                            </label>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {eodData.issuesBlockers}
                              </p>
                            </div>
                          </div>
                        )}

                        {eodData.notes && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-blue-600" />
                              Notes
                            </label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {eodData.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedReport(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
