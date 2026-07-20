import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  Send,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";

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
  comments?: any[];
}

export default function EmployeeEODReports() {
  const [reports, setReports] = useState<EODReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadMyEODReports();
  }, []);

  const loadMyEODReports = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: EODReport[] }>("/api/employees/me/eod-reports");
      setReports(res.items || []);
    } catch (err) {
      console.error("Failed to load EOD reports:", err);
      toast.error("Failed to load your EOD reports");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedReport || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await apiFetch<{ success: boolean; comments: any[] }>(
        `/api/manager/eod-reports/${selectedReport.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ message: commentText }),
        }
      );
      if (res.success) {
        toast.success("Comment added successfully");
        setCommentText("");
        const updatedReport = { ...selectedReport, comments: res.comments };
        setSelectedReport(updatedReport);
        setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? updatedReport : r)));
      }
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
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
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 capitalize font-medium">
            Submitted
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30 capitalize font-medium">
            Late
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/30 capitalize font-medium">
            Missing
          </Badge>
        );
      default:
        return <Badge variant="outline" className="capitalize">{status.replace(/_/g, " ")}</Badge>;
    }
  };

  const filteredReports = reports.filter((report) => {
    const data = parseEODData(report.rawInput);
    const searchMatch =
      !searchQuery ||
      report.date.includes(searchQuery) ||
      (data.tasksCompleted || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === "all" || report.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const totalSubmitted = reports.filter((r) => r.status === "submitted").length;
  const totalLate = reports.filter((r) => r.status === "late").length;
  const totalComments = reports.reduce((sum, r) => sum + (r.comments?.length || 0), 0);
  const totalHoursWorked = reports.reduce((sum, r) => sum + (r.totalHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My EOD Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your daily end-of-day reports, work hours, and feedback from management.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMyEODReports} disabled={loading} className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Refresh History
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports Submitted</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{totalSubmitted}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late Submissions</p>
              <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{totalLate}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manager Comments</p>
              <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{totalComments}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tracked Hours</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{totalHoursWorked.toFixed(1)}h</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search report tasks or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="late">Late</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      {/* Reports Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="h-5 w-5 text-primary" />
            Day-by-Day EOD History
          </CardTitle>
          <CardDescription>
            Click any row or 'View Details' to read manager feedback and comments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Loading your EOD reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-base font-semibold text-foreground">No EOD reports found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your submitted daily reports and manager comments will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="w-[300px]">Tasks Summary</TableHead>
                    <TableHead className="text-center">Comments</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const eodData = parseEODData(report.rawInput);
                    const commentCount = report.comments?.length || 0;
                    return (
                      <TableRow
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <span>{formatDate(report.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{formatLocalClock(report.clockIn, report.clockInAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span>{formatLocalClock(report.clockOut, report.clockOutAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {report.totalHours?.toFixed(1) || "--"}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                            {eodData.tasksCompleted || "No tasks reported"}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {commentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                              <MessageSquare className="w-3 h-3" />
                              {commentCount}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            className="h-8 text-xs gap-1"
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

      {/* EOD Report & Comments Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ClipboardList className="h-5 w-5 text-primary" />
              EOD Report Details — {selectedReport && formatDate(selectedReport.date)}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="p-6 space-y-5">
              {/* Header Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-xl border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Status</span>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Clock In</span>
                  <span className="font-semibold text-foreground text-sm">{formatLocalClock(selectedReport.clockIn, selectedReport.clockInAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Clock Out</span>
                  <span className="font-semibold text-foreground text-sm">{formatLocalClock(selectedReport.clockOut, selectedReport.clockOutAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Hours Worked</span>
                  <span className="font-semibold text-foreground text-sm">{selectedReport.totalHours ? `${selectedReport.totalHours.toFixed(2)}h` : "—"}</span>
                </div>
              </div>

              {/* Report Sections */}
              {(() => {
                const eodData = parseEODData(selectedReport.rawInput);
                return (
                  <div className="space-y-4">
                    {/* Tasks Completed */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Tasks Completed
                      </label>
                      <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {eodData.tasksCompleted || "No tasks reported"}
                        </p>
                      </div>
                    </div>

                    {/* Issues / Blockers */}
                    {eodData.issuesBlockers && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Issues / Blockers
                        </label>
                        <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {eodData.issuesBlockers}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {eodData.notes && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4 text-blue-500" />
                          Additional Notes
                        </label>
                        <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {eodData.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Management Comments Section */}
              <div className="border-t border-border/50 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Manager & Admin Comments ({selectedReport.comments?.length || 0})
                  </h3>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                  {(!selectedReport.comments || selectedReport.comments.length === 0) ? (
                    <div className="p-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/20">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs font-medium text-muted-foreground">
                        No manager comments yet for this EOD report.
                      </p>
                    </div>
                  ) : (
                    selectedReport.comments.map((comment: any, idx: number) => {
                      const isManagerOrAdmin = ["manager", "admin", "super-admin"].includes((comment.authorRole || "").toLowerCase());
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            isManagerOrAdmin
                              ? "bg-blue-500/5 border-blue-500/20"
                              : "bg-muted/40 border-border/40"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{comment.authorName}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 capitalize ${
                                  isManagerOrAdmin
                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30 font-semibold"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {comment.authorRole || "Manager"}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {comment.message}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply / Comment Input */}
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    placeholder="Write a comment or reply to management..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                    className="flex-1 text-sm h-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="h-10 px-4 gap-1.5"
                  >
                    {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
