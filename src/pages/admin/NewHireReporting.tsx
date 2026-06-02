import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  Send,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "@/components/manger/ui/use-toast";

interface NewHireReport {
  id: string;
  employeeId: string;
  onboardingId: string;
  employeeName: string;
  employeeAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  hireDate: string;
  employerName: string;
  employerFEIN: string;
  status: "pending" | "submitted" | "failed" | "overridden";
  attemptsCount: number;
  confirmationId: string;
  countdownExpiry: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  overrideReason?: string;
  overrideBy?: {
    name: string;
    email: string;
  };
  overrideAt?: string;
  createdAt: string;
}

interface SubmissionLog {
  id: string;
  attemptNumber: number;
  status: "submitted" | "failed";
  method: "sftp" | "webform";
  payloadPreview: string;
  errorMessage?: string;
  confirmationId?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  failed: number;
  overridden: number;
  complianceRate: number;
}

const statusClasses = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  submitted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  overridden: "bg-blue-500/10 text-blue-500 border-blue-500/20"
};

const statusLabels = {
  pending: "Pending",
  submitted: "Submitted",
  failed: "Failed",
  overridden: "Overridden"
};

// ── Live Countdown Clock Cell Component ─────────────────────────────────────────
function CountdownCell({ expiry, status }: { expiry: string; status: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (status === "submitted" || status === "overridden") {
      setTimeLeft("Resolved");
      setIsOverdue(false);
      return;
    }

    const updateTimer = () => {
      const difference = new Date(expiry).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("OVERDUE");
        setIsOverdue(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const dStr = String(days).padStart(2, "0");
      const hStr = String(hours).padStart(2, "0");
      const mStr = String(minutes).padStart(2, "0");
      const sStr = String(seconds).padStart(2, "0");

      setTimeLeft(`${dStr}d:${hStr}h:${mStr}m:${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiry, status]);

  if (status === "submitted" || status === "overridden") {
    return <span className="text-emerald-500 font-bold">Compliant</span>;
  }

  return (
    <span className={isOverdue ? "text-rose-500 font-black animate-pulse" : "text-amber-500 font-mono font-bold"}>
      {timeLeft}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function NewHireReporting() {
  const [reports, setReports] = useState<NewHireReport[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, submitted: 0, failed: 0, overridden: 0, complianceRate: 100 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals & drawers state
  const [selectedReport, setSelectedReport] = useState<NewHireReport | null>(null);
  const [logs, setLogs] = useState<SubmissionLog[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const reportsEndpoint = statusFilter === "all" ? "/api/new-hire-reports/all" : `/api/new-hire-reports/all?status=${statusFilter}`;
      const [reportsData, statsData] = await Promise.all([
        apiFetch<{ items: NewHireReport[] }>(reportsEndpoint),
        apiFetch<{ item: Stats }>("/api/new-hire-reports/stats")
      ]);
      setReports(reportsData.items || []);
      setStats(statsData.item);
    } catch (e) {
      toast({
        title: "Failed to load reports",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter]);

  const handleResubmit = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      toast({
        title: "Submission Triggered",
        description: `Automated filing initiated for ${name}...`
      });

      const res = await apiFetch<{ success: boolean; message: string }>(`/api/new-hire-reports/${id}/resubmit`, {
        method: "POST"
      });

      toast({
        title: "Submission Successful",
        description: res.message
      });
      void loadData();
    } catch (e) {
      toast({
        title: "Filing Attempt Failed",
        description: e instanceof Error ? e.message : "Headless browser scraping timeout.",
        variant: "destructive"
      });
      void loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenLogs = async (report: NewHireReport) => {
    setSelectedReport(report);
    setLogsOpen(true);
    try {
      setLogsLoading(true);
      const res = await apiFetch<{ items: SubmissionLog[] }>(`/api/new-hire-reports/${report.id}/logs`);
      setLogs(res.items || []);
    } catch (e) {
      toast({
        title: "Failed to load audit logs",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenOverride = (report: NewHireReport) => {
    setSelectedReport(report);
    setOverrideReason("");
    setOverrideOpen(true);
  };

  const handleConfirmOverride = async () => {
    if (!selectedReport) return;
    if (overrideReason.trim().length < 5) {
      toast({
        title: "Invalid Reason",
        description: "Please enter a detailed override reason (min 5 chars).",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(selectedReport.id);
      await apiFetch(`/api/new-hire-reports/${selectedReport.id}/override`, {
        method: "POST",
        body: JSON.stringify({ reason: overrideReason })
      });
      toast({
        title: "Manual Override Successful",
        description: `Report for ${selectedReport.employeeName} marked as manually filed.`
      });
      setOverrideOpen(false);
      void loadData();
    } catch (e) {
      toast({
        title: "Override Failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="pl-12 space-y-6 pr-2 sm:pr-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Maine New Hire Reporting
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Automated state reporting and compliance monitoring for newly onboarded staff.
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0 h-10 font-bold" onClick={loadData} disabled={loading}>
          <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          Refresh Queue
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Hires</p>
              <p className="text-lg font-black text-white mt-0.5">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-black text-white mt-0.5">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-lg font-black text-white mt-0.5">{stats.submitted}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-black text-white mt-0.5">{stats.failed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-lg col-span-2 md:col-span-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Compliance</p>
              <p className="text-lg font-black text-white mt-0.5">{stats.complianceRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reporting Queue */}
      <Card className="bg-[#0B1323]/50 border-white/5 backdrop-blur-md shadow-xl">
        <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-black text-white">Reporting Queue</CardTitle>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          >
            <option value="all">All Filing Status</option>
            <option value="pending">Pending Filing</option>
            <option value="submitted">Submitted Compliant</option>
            <option value="failed">Failed filings</option>
            <option value="overridden">Overridden Manual</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Hydrating reporting queue...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/60 font-bold uppercase tracking-wider"> Filer registry is clean</p>
              <p className="text-xs text-muted-foreground mt-1">Newly approved onboarded employees will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {reports.map((report) => {
                const getInitials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={report.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                    {/* User Details */}
                    <div className="flex items-center gap-3.5 sm:flex-1 min-w-0">
                      <Avatar className="h-11 w-11 flex-shrink-0 border-2 border-white/10 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 text-indigo-400 text-sm font-black tracking-tight">
                          {getInitials(report.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-white truncate">{report.employeeName}</h4>
                          <Badge className={`text-[10px] font-black h-5 uppercase tracking-wide rounded-full px-2 border ${statusClasses[report.status]}`} variant="outline">
                            {statusLabels[report.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Hire Date: <span className="text-white/80 font-bold">{new Date(report.hireDate).toLocaleDateString()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Employer: <span className="text-white/80 font-bold">{report.employerName}</span> (FEIN: {report.employerFEIN})
                        </p>
                      </div>
                    </div>

                    {/* Timer & Status details */}
                    <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Filing window</span>
                        <CountdownCell expiry={report.countdownExpiry} status={report.status} />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Attempts log</span>
                        <span className="text-sm font-mono font-bold text-white/90">
                          {report.attemptsCount} / 3 Attempts
                        </span>
                      </div>

                      {report.confirmationId && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Receipt ID</span>
                          <span className="text-sm font-mono font-bold text-indigo-400">
                            {report.confirmationId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 mt-2 lg:mt-0 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 font-bold text-xs uppercase"
                        onClick={() => void handleOpenLogs(report)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> logs
                      </Button>

                      {report.status !== "submitted" && report.status !== "overridden" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:text-amber-400 font-bold text-xs uppercase"
                            onClick={() => handleOpenOverride(report)}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> override
                          </Button>
                          <Button
                            size="sm"
                            className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase shadow-md gap-1.5"
                            onClick={() => void handleResubmit(report.id, report.employeeName)}
                            disabled={actionLoading === report.id}
                          >
                            {actionLoading === report.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Resubmit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission logs drawer dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="bg-[#0f172a] border border-white/5 text-white max-w-2xl w-[95vw] overflow-y-auto max-h-[85vh]">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Submission Attempt Logs
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="py-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-5 flex justify-between gap-4 flex-wrap">
                <div>
                  <h5 className="font-bold text-sm text-white">{selectedReport.employeeName}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">Maine compliance countdown report tracking.</p>
                </div>
                {selectedReport.status === "failed" && selectedReport.errorMessage && (
                  <div className="w-full mt-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-400 font-medium">
                    <span className="font-black uppercase tracking-wider block mb-1">Fatal Error message:</span>
                    {selectedReport.errorMessage}
                  </div>
                )}
              </div>

              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Hydrating audit records...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm italic">
                  No automated attempts recorded yet. Click resubmit to initiate.
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-white/5 px-2 py-0.5 rounded text-white/90">
                            Attempt #{log.attemptNumber}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground uppercase">
                            Method: {log.method}
                          </span>
                        </div>
                        <Badge className={log.status === "submitted" ? "bg-emerald-500/20 text-emerald-400 border-none" : "bg-rose-500/20 text-rose-400 border-none"}>
                          {log.status === "submitted" ? "Success" : "Failed"}
                        </Badge>
                      </div>

                      <p className="text-xs text-white/60 font-semibold">{log.payloadPreview}</p>
                      
                      {log.errorMessage ? (
                        <div className="bg-rose-500/5 p-2.5 rounded border border-rose-500/10 text-[11px] text-rose-400 font-mono">
                          {log.errorMessage}
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-400 font-mono">
                          ✓ State server accepted. Confirmation: {log.confirmationId}
                        </p>
                      )}
                      
                      <span className="text-[9px] text-muted-foreground/60 font-bold block pt-1">
                        Timestamp: {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-white/5 pt-3">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white" onClick={() => setLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual override prompt dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="bg-[#0f172a] border border-white/5 text-white max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Manual Compliance Override
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use override only if this employee has been manually reported to Maine's State Registry outside this portal.
                This will mark the compliance countdown as fulfilled.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest">
                  Detailed Reason *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter detailed override reason (e.g. Filed manually via state portal on MM/DD/YYYY by Admin)..."
                  className="w-full min-h-[100px] rounded-xl border border-white/10 bg-[#0F172A] p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase"
              onClick={handleConfirmOverride}
              disabled={overrideReason.trim().length < 5}
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
