import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Search, Calendar, Building, Phone, Mail, FileDown, Printer, RefreshCw, Star, AlertTriangle, ShieldCheck } from "lucide-react";
import { getAdminEODStatus, getAdminEODReports, toProxiedUrl, apiFetch } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface EmployeeEODData {
  employeeId: string;
  employeeName: string;
  avatar?: string;
  status: "submitted" | "missing" | "late" | "not_clocked_in";
  clockIn?: string;
  clockOut?: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  reportSubmittedAt?: string;
}

export default function AdminEODReports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "print">("dashboard");

  // Tab 1: Dashboard States
  const [employees, setEmployees] = useState<EmployeeEODData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Tab 2: Print & Export States
  const [preset, setPreset] = useState("week");
  const [selectedDate, setSelectedDate] = useState(today);
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [quarter, setQuarter] = useState("Q2");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadEODStatus();
    }
  }, [dateFilter, activeTab]);

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [empRes, locRes] = await Promise.all([
          apiFetch<{ items: any[] }>("/api/employees"),
          apiFetch<{ items: any[] }>("/api/locations"),
        ]);
        setEmployeesList(empRes.items || []);
        setLocationsList(locRes.items || []);
      } catch (err) {
        console.error("Failed to load filter choices:", err);
      }
    };
    void loadFiltersData();
  }, []);

  const loadEODStatus = async () => {
    setLoading(true);
    try {
      const res = await getAdminEODStatus(dateFilter || today);
      setEmployees(res.items || []);
    } catch (err) {
      console.error("Failed to load EOD status:", err);
      toast.error("Failed to load EOD status");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingReports(true);
    setGenerated(true);
    try {
      let from = "";
      let to = "";

      if (preset === "day") {
        from = selectedDate;
        to = selectedDate;
      } else if (preset === "week") {
        const d = new Date(selectedDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        from = start.toISOString().split("T")[0];
        to = end.toISOString().split("T")[0];
      } else if (preset === "quarter") {
        if (quarter === "Q1") {
          from = `${year}-01-01`;
          to = `${year}-03-31`;
        } else if (quarter === "Q2") {
          from = `${year}-04-01`;
          to = `${year}-06-30`;
        } else if (quarter === "Q3") {
          from = `${year}-07-01`;
          to = `${year}-09-30`;
        } else {
          from = `${year}-10-01`;
          to = `${year}-12-31`;
        }
      } else if (preset === "year") {
        from = `${year}-01-01`;
        to = `${year}-12-31`;
      } else if (preset === "custom") {
        from = customFrom;
        to = customTo;
      }

      const params = {
        from,
        to,
        location: selectedLocation !== "all" ? selectedLocation : undefined,
        employeeId: selectedEmployee !== "all" ? selectedEmployee : undefined,
        limit: 10000,
      };

      const res = await getAdminEODReports(params);
      setReportItems(res.items || []);
      toast.success(`Successfully found ${res.items?.length || 0} reports.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleExportCSV = () => {
    if (reportItems.length === 0) return;
    const headers = ["Date", "Employee", "Location", "Clock In", "Clock Out", "Total Hours", "Status", "Productivity Score", "Tasks Completed", "Blockers", "Notes"];
    const rows = reportItems.map(item => {
      let tasks = "";
      let blockers = "";
      let notes = "";
      try {
        const parsed = JSON.parse(item.rawInput);
        tasks = parsed.tasksCompleted || parsed.text || item.rawInput;
        blockers = parsed.issuesBlockers || "";
        notes = parsed.notes || "";
      } catch {
        tasks = item.rawInput;
      }
      return [
        new Date(item.date).toLocaleDateString(),
        item.employeeName,
        item.employeeLocation || "N/A",
        item.clockIn || "",
        item.clockOut || "",
        item.totalHours || "0",
        item.status,
        item.productivityScore || "N/A",
        `"${tasks.replace(/"/g, '""')}"`,
        `"${blockers.replace(/"/g, '""')}"`,
        `"${notes.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EOD_Payroll_Report_${preset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewEmployee = (employee: EmployeeEODData) => {
    navigate(`/admin/eod-reports/${encodeURIComponent(employee.employeeName)}`, {
      state: { avatar: employee.avatar },
    });
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            Submitted
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            Missing
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            Late
          </Badge>
        );
      case "not_clocked_in":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            Not Clocked In
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLocalClock = (timeStr?: string | null, isoAt?: string | null): string => {
    if (isoAt) {
      const d = new Date(isoAt);
      if (Number.isFinite(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }
    return String(timeStr || "").trim() || "—";
  };

  const parseRawInput = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return { text: raw };
    }
  };

  const renderDetails = (raw: string) => {
    const parsed = parseRawInput(raw);
    return (
      <div className="space-y-2 text-xs text-left max-w-xl">
        {parsed.tasksCompleted && (
          <div>
            <strong className="text-zinc-650 dark:text-zinc-400 block border-b border-border/40 pb-0.5 mb-1">Tasks Completed:</strong>
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{parsed.tasksCompleted}</p>
          </div>
        )}
        {parsed.issuesBlockers && (
          <div>
            <strong className="text-amber-600 dark:text-amber-400 block border-b border-border/40 pb-0.5 mb-1">Blockers/Issues:</strong>
            <p className="whitespace-pre-wrap leading-relaxed text-amber-700 dark:text-amber-300">{parsed.issuesBlockers}</p>
          </div>
        )}
        {parsed.notes && (
          <div>
            <strong className="text-zinc-650 dark:text-zinc-400 block border-b border-border/40 pb-0.5 mb-1">Notes:</strong>
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{parsed.notes}</p>
          </div>
        )}
        {parsed.text && <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{parsed.text}</p>}
      </div>
    );
  };

  // KPI Calculations
  const totalHours = reportItems.reduce((sum, item) => sum + (item.totalHours || 0), 0);
  const totalSubmissions = reportItems.filter(item => item.status === "submitted" || item.status === "late").length;
  const avgProductivity = reportItems.filter(item => item.productivityScore !== undefined).reduce((sum, item) => sum + item.productivityScore, 0) / (reportItems.filter(item => item.productivityScore !== undefined).length || 1);

  return (
    <div className="space-y-6 min-w-0 w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, aside, footer, button, .no-print, [role="tablist"], .filters-card {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            margin-left: 0 !important;
          }
          .print-title {
            display: block !important;
          }
          .print-border {
            border: 1px solid #ddd !important;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Print Title Header */}
      <div className="hidden print-title text-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">EOD Payroll & Task Report</h1>
        <p className="text-sm text-gray-500">
          Generated: {new Date().toLocaleDateString()} | Preset: {preset.toUpperCase()}
          {selectedLocation !== "all" && ` | Location: ${selectedLocation}`}
          {selectedEmployee !== "all" && ` | Employee ID: ${selectedEmployee}`}
        </p>
      </div>

      {/* Header (Screen only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">EOD Reports Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor submission status or generate print-friendly reports for payroll separation.
          </p>
        </div>

        <div className="flex p-1 bg-muted rounded-lg w-fit border border-border/40">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "dashboard" ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Status Dashboard
          </button>
          <button
            onClick={() => setActiveTab("print")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "print" ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Print & Export Reports
          </button>
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <>
          {/* Filters */}
          <Card className="no-print border-border/40 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-border/50"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Input
                    type="date"
                    value={dateFilter || today}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-10 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFilter(today);
                    setSearchTerm("");
                  }}
                  className="h-10 border-border/50"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employees Table */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                Employee EOD Status
              </CardTitle>
              <CardDescription>
                Click on an employee to view their detailed EOD history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
                  <p className="text-muted-foreground text-sm">Loading EOD status...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-semibold">No employees found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active employees will appear here once clocked in.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-b border-border/40">
                        <TableHead className="font-semibold text-xs uppercase text-slate-500">Employee</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-slate-500">Clock In</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-slate-500">Clock Out</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-slate-500">Report Time</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-slate-500 no-print text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.employeeId} className="hover:bg-muted/30 border-b border-border/20" onClick={() => { if (emp.status !== "not_clocked_in") handleViewEmployee(emp); }}>
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 ring-1 ring-border">
                                {emp.avatar ? (
                                  <AvatarImage src={toProxiedUrl(emp.avatar)} alt={emp.employeeName} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-blue-650 text-white text-xs font-bold">
                                  {getInitials(emp.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold">{emp.employeeName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(emp.status)}</TableCell>
                          <TableCell>{formatLocalClock(emp.clockIn, emp.clockInAt)}</TableCell>
                          <TableCell>{formatLocalClock(emp.clockOut, emp.clockOutAt)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {emp.reportSubmittedAt
                              ? new Date(emp.reportSubmittedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center no-print" onClick={(e) => e.stopPropagation()}>
                            {emp.status !== "not_clocked_in" ? (
                              <Button
                                size="sm"
                                onClick={() => handleViewEmployee(emp)}
                                className="bg-[#133767] hover:bg-[#0d2654] h-8 text-xs text-white"
                              >
                                View Details
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No clock-in</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Tab 2: Print & Export Reports */}
          <Card className="no-print filters-card border-border/40 shadow-sm bg-card">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-base font-bold">Generate Payroll & Work Report</CardTitle>
              <CardDescription>Select range presets, location constraints, and download or print EOD logs.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Preset Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Time Preset</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                  >
                    <option value="day">Single Day</option>
                    <option value="week">Weekly Period</option>
                    <option value="quarter">Quarterly Period</option>
                    <option value="year">Full Year</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Preset-dependent inputs */}
                {preset === "day" || preset === "week" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      {preset === "day" ? "Select Date" : "Reference Date in Week"}
                    </label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-10 border-border/50"
                    />
                  </div>
                ) : null}

                {preset === "quarter" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Quarter</label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                        value={quarter}
                        onChange={(e) => setQuarter(e.target.value)}
                      >
                        <option value="Q1">Q1 (Jan - Mar)</option>
                        <option value="Q2">Q2 (Apr - Jun)</option>
                        <option value="Q3">Q3 (Jul - Sep)</option>
                        <option value="Q4">Q4 (Oct - Dec)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
                      <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-10 border-border/50"
                      />
                    </div>
                  </>
                ) : null}

                {preset === "year" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="h-10 border-border/50"
                    />
                  </div>
                ) : null}

                {preset === "custom" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">From Date</label>
                      <Input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="h-10 border-border/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">To Date</label>
                      <Input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="h-10 border-border/50"
                      />
                    </div>
                  </>
                ) : null}

                {/* Employee Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Employee filter</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="all">All Employees</option>
                    {employeesList.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Location Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Location filter</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="all">All Locations</option>
                    {locationsList.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                <Button onClick={handleGenerateReport} disabled={loadingReports} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {loadingReports ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
                  Generate Report
                </Button>
                {reportItems.length > 0 && (
                  <>
                    <Button variant="outline" onClick={handlePrint} className="border-border/50 gap-1.5 text-zinc-700">
                      <Printer size={16} /> Print Report
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV} className="border-border/50 gap-1.5 text-zinc-700">
                      <FileDown size={16} /> Export CSV
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {generated && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
                <Card className="border-border/40 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Total Clocked Hours</p>
                      <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-zinc-150">{totalHours.toFixed(1)} hrs</p>
                    </div>
                    <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-600"><ShieldCheck size={20} /></div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Submissions Count</p>
                      <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-zinc-150">{totalSubmissions} logs</p>
                    </div>
                    <div className="bg-green-500/10 p-2.5 rounded-lg text-green-600"><ClipboardList size={20} /></div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Avg Productivity</p>
                      <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-zinc-150">{avgProductivity.toFixed(1)} / 10</p>
                    </div>
                    <div className="bg-yellow-500/10 p-2.5 rounded-lg text-yellow-600"><Star size={20} /></div>
                  </CardContent>
                </Card>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                  EOD Submissions Details ({reportItems.length})
                </h3>

                {loadingReports ? (
                  <div className="text-center py-20 bg-card border rounded-lg border-border/40">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">Fetching payroll reports...</p>
                  </div>
                ) : reportItems.length === 0 ? (
                  <div className="text-center py-20 bg-card border rounded-lg border-border/40 text-muted-foreground">
                    No EOD report submissions found for the selected options.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reportItems.map((item) => (
                      <Card key={item.id} className="border-border/40 shadow-sm hover:shadow-md transition-shadow bg-card print-border print-break-inside-avoid">
                        <CardContent className="p-4 sm:p-5 space-y-3">
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 border-border/40">
                            <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-150">{item.employeeName}</h4>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building className="w-3.5 h-3.5 text-zinc-400" />
                                {item.employeeLocation || "No Location Listed"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-zinc-50 dark:bg-zinc-900 border-border font-medium">
                                <Calendar className="w-3 h-3 mr-1 text-zinc-400" />
                                {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Badge>
                              {item.status === "late" ? (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 text-[10px]">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" /> Late
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 text-[10px]">
                                  Submitted
                                </Badge>
                              )}
                              {item.productivityScore !== undefined && (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] gap-0.5">
                                  Score: {item.productivityScore}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Hours and Clocking */}
                          <div className="grid grid-cols-3 gap-2 py-1 bg-muted/40 rounded-lg text-center text-[11px] font-mono border border-border/20 print-border">
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Clock In</span>
                              <span className="text-zinc-800 dark:text-zinc-200">{item.clockIn || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Clock Out</span>
                              <span className="text-zinc-800 dark:text-zinc-200">{item.clockOut || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Total Hours</span>
                              <span className="text-zinc-800 dark:text-zinc-200 font-bold">{item.totalHours !== undefined ? `${item.totalHours.toFixed(1)} hrs` : "—"}</span>
                            </div>
                          </div>

                          {/* Raw/Scrum details */}
                          <div className="pt-1">
                            {renderDetails(item.rawInput)}
                          </div>

                          {/* AI summary */}
                          {item.aiSummary && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 p-3 rounded-lg text-xs space-y-1 print-border">
                              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> AI Executive Summary:
                              </span>
                              <p className="text-zinc-700 dark:text-zinc-300 italic leading-relaxed">{item.aiSummary}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
