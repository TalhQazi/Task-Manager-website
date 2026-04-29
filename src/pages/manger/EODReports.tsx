import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  ClipboardList,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MoreHorizontal,
  Eye,
  Mic,
  CheckSquare,
  Link,
} from "lucide-react";
import { getEODReports, getEODStatus } from "@/lib/manger/api";
import { toast } from "sonner";

interface EODReport {
  id: string;
  userId: string;
  employeeName: string;
  date: string;
  rawInput: string;
  inputType: string;
  status: "submitted" | "missing" | "late";
  createdAt: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  transcription?: string;
  aiSummary?: string;
  productivityScore?: number;
  flags?: { missing?: boolean; lowOutput?: boolean };
  taggedTasks?: Array<{ _id: string; title: string; taskId?: string }>;
}

interface EODStatus {
  employeeId: string;
  employeeName: string;
  status: "submitted" | "missing" | "late" | "not_clocked_in";
  clockIn?: string;
  clockOut?: string;
  reportSubmittedAt?: string;
}

export default function ManagerEODReports() {
  const [reports, setReports] = useState<EODReport[]>([]);
  const [statusList, setStatusList] = useState<EODStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
  const [viewMode, setViewMode] = useState<"status" | "reports">("status");

  useEffect(() => {
    loadData();
  }, [dateFilter, statusFilter, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, statusRes] = await Promise.all([
        getEODReports({
          date: dateFilter || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getEODStatus(dateFilter || today),
      ]);
      setReports(reportsRes.items || []);
      setStatusList(statusRes.items || []);
    } catch (err) {
      console.error("Failed to load EOD data:", err);
      toast.error("Failed to load EOD data");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) =>
    report.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(report.date).toLocaleDateString().includes(searchQuery)
  );

  const filteredStatus = statusList.filter((status) =>
    status.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            <XCircle className="h-3 w-3 mr-1" />
            Missing
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Late
          </Badge>
        );
      case "not_clocked_in":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            <Clock className="h-3 w-3 mr-1" />
            Not Clocked In
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const parseEODData = (rawInput: string) => {
    try {
      return JSON.parse(rawInput);
    } catch {
      return { tasksCompleted: rawInput, issuesBlockers: "", notes: "" };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 max-w-[2000px] mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading EOD data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-6 max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            End-of-Day Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor employee daily reports and attendance status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "status" ? "default" : "outline"}
            onClick={() => {
              setViewMode("status");
              setDateFilter(today);
            }}
          >
            Status Dashboard
          </Button>
          <Button
            variant={viewMode === "reports" ? "default" : "outline"}
            onClick={() => {
              setViewMode("reports");
              setDateFilter("");
            }}
          >
            All Reports
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                type="date"
                className="h-9 sm:h-10 text-sm sm:text-base"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <select
                className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white h-9 sm:h-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="missing">Missing</option>
                <option value="late">Late</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFilter(viewMode === "status" ? today : "");
                setStatusFilter("all");
                setSearchQuery("");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Dashboard View - Grid with Green/Yellow/Red cards */}
      {viewMode === "status" && (
        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Employee EOD Status
              <Badge variant="outline" className="ml-2">
                {filteredStatus.length} employees
              </Badge>
            </CardTitle>
            <CardDescription>
              Today's EOD submission status for all employees
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredStatus.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No employees found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStatus.map((status) => {
                  const isGreen = status.status === "submitted";
                  const isYellow = status.status === "late";
                  const isRed = status.status === "missing";
                  const isGray = status.status === "not_clocked_in";

                  return (
                    <div
                      key={status.employeeId}
                      onClick={() => {
                        const report = reports.find((r) => r.employeeName === status.employeeName);
                        if (report) {
                          setSelectedReport(report);
                        } else if (status.status !== "not_clocked_in") {
                          toast.error("No report found for this employee");
                        }
                      }}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg
                        ${isGreen ? "bg-green-50 border-green-500 hover:bg-green-100" : ""}
                        ${isYellow ? "bg-yellow-50 border-yellow-500 hover:bg-yellow-100" : ""}
                        ${isRed ? "bg-red-50 border-red-500 hover:bg-red-100" : ""}
                        ${isGray ? "bg-gray-50 border-gray-300 hover:bg-gray-100 cursor-default" : ""}
                      `}
                    >
                      {/* Status Indicator Circle */}
                      <div className={`
                        absolute top-3 right-3 h-3 w-3 rounded-full
                        ${isGreen ? "bg-green-500" : ""}
                        ${isYellow ? "bg-yellow-500" : ""}
                        ${isRed ? "bg-red-500" : ""}
                        ${isGray ? "bg-gray-400" : ""}
                      `} />

                      {/* Employee Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center
                          ${isGreen ? "bg-green-200 text-green-700" : ""}
                          ${isYellow ? "bg-yellow-200 text-yellow-700" : ""}
                          ${isRed ? "bg-red-200 text-red-700" : ""}
                          ${isGray ? "bg-gray-200 text-gray-600" : ""}
                        `}>
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{status.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {status.clockIn ? `In: ${status.clockIn}` : "Not clocked in"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-2">
                        {getStatusBadge(status.status)}
                      </div>

                      {/* Clock Out */}
                      {status.clockOut && (
                        <p className="text-xs text-muted-foreground">
                          Out: {status.clockOut}
                        </p>
                      )}

                      {/* Report Time */}
                      {status.reportSubmittedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Report: {new Date(status.reportSubmittedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}

                      {/* Drilldown Hint */}
                      {!isGray && (
                        <div className="mt-3 pt-2 border-t border-current opacity-50">
                          <p className="text-xs text-center">Click to view details</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Reports View */}
      {viewMode === "reports" && (
        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              All EOD Reports
              <Badge variant="outline" className="ml-2">
                {filteredReports.length} reports
              </Badge>
            </CardTitle>
            <CardDescription>
              Historical view of all end-of-day reports (use date filter to narrow down)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No reports found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">Employee</TableHead>
                      <TableHead className="text-xs md:text-sm">Date</TableHead>
                      <TableHead className="text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-xs md:text-sm">Hours</TableHead>
                      <TableHead className="text-xs md:text-sm">Preview</TableHead>
                      <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm md:text-base font-medium">
                          {report.employeeName}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {formatDate(report.date)}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground">
                          {report.totalHours ? `${report.totalHours.toFixed(2)}h` : "—"}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-muted-foreground max-w-[200px] truncate">
                          {parseEODData(report.rawInput).tasksCompleted?.substring(0, 50) || "—"}...
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              EOD Report Details
            </DialogTitle>
            <DialogDescription>
              Full end-of-day report for {selectedReport?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="py-4 space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="text-sm font-medium">{selectedReport.employeeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedReport.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clock In</p>
                  <p className="text-sm font-medium">{selectedReport.clockIn || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clock Out</p>
                  <p className="text-sm font-medium">{selectedReport.clockOut || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                  <p className="text-sm font-medium">
                    {selectedReport.totalHours ? `${selectedReport.totalHours.toFixed(2)}h` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Input Type</p>
                  <p className="text-sm font-medium capitalize">{selectedReport.inputType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Productivity Score</p>
                  <p className="text-sm font-medium">
                    {selectedReport.productivityScore !== undefined ? `${selectedReport.productivityScore}/10` : "—"}
                  </p>
                </div>
              </div>

              {/* AI Summary */}
              {selectedReport.aiSummary && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                    AI Summary
                  </label>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.aiSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Linked Tasks */}
              {selectedReport.taggedTasks && selectedReport.taggedTasks.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Link className="h-4 w-4 text-indigo-600" />
                    AI-Linked Tasks
                  </label>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="space-y-2">
                      {selectedReport.taggedTasks.map((task) => (
                        <div key={task._id} className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-900">
                            {task.taskId ? `[${task.taskId}] ` : ""}{task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Flags */}
              {selectedReport.flags && (selectedReport.flags.missing || selectedReport.flags.lowOutput) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Flags
                  </label>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.flags.missing && (
                        <Badge variant="destructive">Missing Report</Badge>
                      )}
                      {selectedReport.flags.lowOutput && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-100">
                          Low Output
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transcription (Voice Input) */}
              {selectedReport.transcription && selectedReport.inputType === "voice" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4 text-blue-600" />
                    Voice Transcription
                  </label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.transcription}
                    </p>
                  </div>
                </div>
              )}

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
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedReport(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
