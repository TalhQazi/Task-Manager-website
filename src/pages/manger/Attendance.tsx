import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/manger/ui/card";

import { Button } from "@/components/manger/ui/button";

import { Badge } from "@/components/manger/ui/badge";

import { Textarea } from "@/components/manger/ui/textarea";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/manger/ui/dialog";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/manger/ui/table";

import { Clock, LogIn, LogOut, Timer, Calendar, History, ClipboardList, AlertCircle, AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/manger/api";

import { getAuthState } from "@/lib/auth";

import { toast } from "sonner";



interface TimeEntry {

  id: string;

  date: string;

  clockIn: string;

  clockOut: string;

  clockInAt: string | null;

  clockOutAt: string | null;

  totalHours: number;

  status: string;

  scrum?: string | null;

  employee?: string;

}



interface HistoryEntry {

  id: string;

  date: string;

  clockIn: string;

  clockOut: string;

  clockInAt?: string | null;

  clockOutAt?: string | null;

  totalHours: number;

  status: string;

  scrum?: string | null;

}



export default function Attendance() {

  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);

  const [managerName, setManagerName] = useState<string>("");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [showScrumModal, setShowScrumModal] = useState(false);

  const [scrumSubmitting, setScrumSubmitting] = useState(false);

  const [eodData, setEodData] = useState({

    tasksCompleted: "",

    issuesBlockers: "",

    notes: "",

  });

  const [validationError, setValidationError] = useState("");



  useEffect(() => {

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => clearInterval(timer);

  }, []);



  useEffect(() => {

    const loadData = async () => {

      const auth = getAuthState();

      const currentUser = (auth.name || auth.username || "Manager").trim();

      setManagerName(currentUser);

      const today = new Date().toISOString().split("T")[0];

      const cacheKey = `attendance_entry_${today}_${currentUser}`;



      // Restore cached entry immediately so the page doesn't flash "Not Clocked In"

      try {

        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {

          setTimeEntry(JSON.parse(cached));

        }

      } catch {}



      try {

        const res = await apiFetch<{ items: TimeEntry[] }>(`/api/time-entries?employee=${encodeURIComponent(currentUser)}&limit=50`);

        // Filter to only show today's entry

        const todayEntry = res.items?.find(e => new Date(e.date).toISOString().split("T")[0] === today) || null;

        setTimeEntry(todayEntry);

        // Persist to sessionStorage so refresh restores correct state

        if (todayEntry) {

          sessionStorage.setItem(cacheKey, JSON.stringify(todayEntry));

        } else {

          sessionStorage.removeItem(cacheKey);

        }

      } catch (err) {

        console.warn("Time entry not available:", err);

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, []);



  // Load history when component mounts

  useEffect(() => {

    const loadHistory = async () => {

      setHistoryLoading(true);

      try {

        const auth = getAuthState();

        const currentUser = (auth.name || auth.username || "").trim();



        const res = await apiFetch<{ items: TimeEntry[] }>(`/api/time-entries?employee=${encodeURIComponent(currentUser)}&limit=30`);

        const userHistory = res.items || [];

        setHistory(userHistory);

      } catch (err) {

        console.warn("History not available:", err);

        setHistory([]);

      } finally {

        setHistoryLoading(false);

      }

    };

    loadHistory();

  }, []);



  const handleClockIn = async () => {

    setActionLoading(true);

    try {

      const auth = getAuthState();

      const currentUser = (auth.name || auth.username || "Manager").trim();

      const now = new Date();

      const date = now.toISOString().split("T")[0];

      const clockIn = now.toTimeString().slice(0, 5);



      const res = await apiFetch<{ item: TimeEntry }>("/api/time-entries", {

        method: "POST",

        body: JSON.stringify({

          employee: currentUser,

          date,

          clockIn,

          clockInAt: now.toISOString(),

          status: "incomplete",

        }),

      });

      setTimeEntry(res.item);

      // Persist so refresh restores clocked-in state

      const today = new Date().toISOString().split("T")[0];

      const auth2 = getAuthState();

      const name2 = (auth2.name || auth2.username || "Manager").trim();

      sessionStorage.setItem(`attendance_entry_${today}_${name2}`, JSON.stringify(res.item));

      toast.success("Clocked in successfully");

    } catch (err) {

      const message = err instanceof Error ? err.message : "Failed to clock in";

      toast.error(message);

    } finally {

      setActionLoading(false);

    }

  };



  const handleClockOutClick = () => {

    // Show scrum modal before clocking out

    setShowScrumModal(true);

  };



  const handleScrumSubmit = async () => {

    // Validation: Tasks completed is mandatory

    if (!eodData.tasksCompleted.trim()) {

      setValidationError("Please enter tasks completed before checking out");

      return;

    }



    // Validation: Check for very short input (less than 10 characters)

    if (eodData.tasksCompleted.trim().length < 10) {

      setValidationError("Please provide more details about tasks completed (at least 10 characters)");

      return;

    }



    setValidationError("");

    setScrumSubmitting(true);



    try {

      // Use existing timeEntry state instead of fetching

      if (!timeEntry) {

        throw new Error("No active time entry found for today");

      }



      const auth = getAuthState();

      const currentUser = (auth.name || auth.username || "").trim();



      const res = await apiFetch<{ item: TimeEntry }>(`/api/time-entries/${timeEntry.id}/clock-out`, {

        method: "POST",

        body: JSON.stringify({

          eodReport: {

            tasksCompleted: eodData.tasksCompleted.trim(),

            issuesBlockers: eodData.issuesBlockers.trim(),

            notes: eodData.notes.trim(),

          },

        }),

      });



      toast.success("Clocked out successfully");

      setShowScrumModal(false);

      setEodData({

        tasksCompleted: "",

        issuesBlockers: "",

        notes: "",

      });

      setTimeEntry(res.item);

      // Update session cache with clocked-out entry

      const today2 = new Date().toISOString().split("T")[0];

      const auth3 = getAuthState();

      const name3 = (auth3.name || auth3.username || "Manager").trim();

      sessionStorage.setItem(`attendance_entry_${today2}_${name3}`, JSON.stringify(res.item));



      // Refresh history

      const historyRes = await apiFetch<{ items: TimeEntry[] }>(`/api/time-entries?employee=${encodeURIComponent(currentUser)}&limit=30`);

      setHistory(historyRes.items || []);

    } catch (err) {

      const message = err instanceof Error ? err.message : "Failed to clock out";

      toast.error(message);

    } finally {

      setScrumSubmitting(false);

    }

  };



  const formatTime = (date: Date) => {

    return date.toLocaleTimeString(undefined, {

      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit",

    });

  };



  const formatDate = (date: Date) => {

    return date.toLocaleDateString(undefined, {

      weekday: "long",

      year: "numeric",

      month: "long",

      day: "numeric",

    });

  };

  const formatHistoryDate = (value: string | null | undefined): string => {
    const raw = String(value || "").trim();
    if (!raw) return "—";
    const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
    const dateStr = m ? `${m[0]}T00:00:00` : raw;
    const d = new Date(dateStr);
    if (!Number.isFinite(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, {
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



  const getDuration = () => {

    if (!timeEntry?.clockInAt) return "--:--:--";

    const start = new Date(timeEntry.clockInAt);

    const end = timeEntry.clockOutAt ? new Date(timeEntry.clockOutAt) : currentTime;

    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(diff / 3600);

    const minutes = Math.floor((diff % 3600) / 60);

    const seconds = diff % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes

      .toString()

      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  };



  const hasClockIn = Boolean(timeEntry?.clockInAt || timeEntry?.clockIn);

  const hasClockOut = Boolean(timeEntry?.clockOutAt || timeEntry?.clockOut);

  const isClockedIn = hasClockIn && !hasClockOut;

  const isClockedOut = hasClockIn && hasClockOut;



  if (loading) {

    return (

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">

        <div className="flex items-center justify-between">

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Attendance</h1>

        </div>

        <Card className="border-0 sm:border shadow-none sm:shadow">

          <CardContent className="px-3 sm:px-6 py-6 sm:py-8 text-center">

            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300 animate-pulse" />

            <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>

          </CardContent>

        </Card>

      </div>

    );

  }



  return (

    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Attendance</h1>

        <div className="text-left sm:text-right">

          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-[#133767]">{formatTime(currentTime)}</p>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{formatDate(currentTime)}</p>

        </div>

      </div>



      {/* Status Card */}

      <Card className="border-l-4 border-l-[#133767] border-0 sm:border shadow-none sm:shadow">

        <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

            <div className="flex items-center gap-3 sm:gap-4">

              <div className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center flex-shrink-0 ${

                isClockedIn 

                  ? "bg-green-100" 

                  : isClockedOut 

                    ? "bg-blue-100" 

                    : "bg-gray-100"

              }`}>

                <Clock className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${

                  isClockedIn 

                    ? "text-green-600" 

                    : isClockedOut 

                      ? "text-blue-600" 

                      : "text-gray-600"

                }`} />

              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xs sm:text-sm text-muted-foreground">Current Status</p>

                <p className="text-base sm:text-lg md:text-xl font-bold truncate">

                  {isClockedIn ? "Clocked In" : isClockedOut ? "Shift Complete" : "Not Clocked In"}

                </p>

                {managerName && (

                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Welcome, {managerName}</p>

                )}

              </div>

            </div>

            <Badge 

              variant="outline" 

              className={"w-fit text-xs sm:text-sm " + (isClockedIn 

                ? "border-green-500 text-green-700 bg-green-50" 

                : isClockedOut 

                  ? "border-blue-500 text-blue-700 bg-blue-50" 

                  : "border-gray-500 text-gray-700 bg-gray-50"

              )}

            >

              {isClockedIn ? "Active" : isClockedOut ? "Complete" : "Ready"}

            </Badge>

          </div>

        </CardContent>

      </Card>



      {/* Time Details */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        <Card className="border-0 sm:border shadow-none sm:shadow">

          <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

            <div className="flex items-center gap-3 sm:gap-4">

              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">

                <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />

              </div>

              <div className="min-w-0">

                <p className="text-xs sm:text-sm text-muted-foreground">Clock In</p>

                <p className="text-base sm:text-lg md:text-xl font-bold">{formatLocalClock(timeEntry?.clockIn, timeEntry?.clockInAt)}</p>

              </div>

            </div>

          </CardContent>

        </Card>



        <Card className="border-0 sm:border shadow-none sm:shadow">

          <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

            <div className="flex items-center gap-3 sm:gap-4">

              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">

                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />

              </div>

              <div className="min-w-0">

                <p className="text-xs sm:text-sm text-muted-foreground">Clock Out</p>

                <p className="text-base sm:text-lg md:text-xl font-bold">{formatLocalClock(timeEntry?.clockOut, timeEntry?.clockOutAt)}</p>

              </div>

            </div>

          </CardContent>

        </Card>



        <Card className="border-0 sm:border shadow-none sm:shadow sm:col-span-2 lg:col-span-1">

          <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

            <div className="flex items-center gap-3 sm:gap-4">

              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">

                <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />

              </div>

              <div className="min-w-0">

                <p className="text-xs sm:text-sm text-muted-foreground">Duration</p>

                <p className="text-base sm:text-lg md:text-xl font-bold">{isClockedIn || isClockedOut ? getDuration() : "--:--:--"}</p>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>



      {/* Action Buttons */}

      <Card className="border-0 sm:border shadow-none sm:shadow">

        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">

          <CardTitle className="text-lg sm:text-xl">Actions</CardTitle>

          <CardDescription className="text-xs sm:text-sm mt-1">Record your attendance for today</CardDescription>

        </CardHeader>

        <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

            <Button

              size="lg"

              className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base h-10 sm:h-11"

              onClick={handleClockIn}

              disabled={!!(isClockedIn || isClockedOut || actionLoading)}

            >

              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />

              {actionLoading && !isClockedIn ? "Processing..." : "Clock In"}

            </Button>

            <Button

              size="lg"

              className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-11"

              onClick={handleClockOutClick}

              disabled={!!(!isClockedIn || actionLoading)}

            >

              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />

              {actionLoading && isClockedIn ? "Processing..." : "Clock Out"}

            </Button>

          </div>

          {isClockedOut && (

            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4">

              You have completed your shift for today. Total hours: {timeEntry?.totalHours?.toFixed(2) || "--"}

            </p>

          )}

        </CardContent>

      </Card>



      {/* History Table */}

      <Card className="border-0 sm:border shadow-none sm:shadow">

        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">

          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">

            <History className="h-4 w-4 sm:h-5 sm:w-5" />

            Attendance History

          </CardTitle>

          <CardDescription className="text-xs sm:text-sm mt-1">Your check-in and check-out records</CardDescription>

        </CardHeader>

        <CardContent className="px-3 sm:px-6 py-4 sm:py-6">

          {historyLoading ? (

            <div className="text-center py-6 sm:py-8">

              <Clock className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300 animate-pulse" />

              <p className="text-xs sm:text-sm text-muted-foreground">Loading history...</p>

            </div>

          ) : history.length === 0 ? (

            <div className="text-center py-6 sm:py-8 text-gray-500">

              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />

              <p className="text-xs sm:text-sm">No attendance records yet</p>

            </div>

          ) : (

            <div className="overflow-x-auto -mx-3 sm:mx-0">

              <div className="inline-block min-w-full px-3 sm:px-0">

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead className="text-xs sm:text-sm">Date</TableHead>

                      <TableHead className="text-xs sm:text-sm">Clock In</TableHead>

                      <TableHead className="text-xs sm:text-sm">Clock Out</TableHead>

                      <TableHead className="text-xs sm:text-sm">Hours</TableHead>

                      <TableHead className="text-xs sm:text-sm">Status</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {history.map((entry) => (

                      <TableRow key={entry.id}>

                        <TableCell className="font-medium text-xs sm:text-sm">

                          {formatHistoryDate(entry.date)}
                        </TableCell>

                        <TableCell className="text-xs sm:text-sm">{formatLocalClock(entry.clockIn, entry.clockInAt)}</TableCell>

                        <TableCell className="text-xs sm:text-sm">{formatLocalClock(entry.clockOut, entry.clockOutAt)}</TableCell>

                        <TableCell className="text-xs sm:text-sm">{entry.totalHours?.toFixed(2) || "--"}</TableCell>

                        <TableCell>

                          <Badge

                            variant="outline"

                            className={

                              "text-xs sm:text-sm " + (

                                entry.status === "complete" || entry.status === "completed"

                                  ? "border-green-500 text-green-700 bg-green-50"

                                  : entry.status === "active" || entry.status === "incomplete"

                                  ? "border-blue-500 text-blue-700 bg-blue-50"

                                  : "border-gray-500 text-gray-700 bg-gray-50"

                              )

                            }

                          >

                            {entry.status === "complete" || entry.status === "completed" ? "Complete" : entry.status === "incomplete" ? "In Progress" : entry.status}

                          </Badge>

                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>

              </div>

            </div>

          )}

        </CardContent>

      </Card>



      {/* Scrum Modal */}

      <Dialog open={showScrumModal} onOpenChange={setShowScrumModal}>

        <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">

          <DialogHeader>

            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">

              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />

              End-of-Day Report

            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm mt-1">

              Please complete your EOD report before checking out. Tasks completed is mandatory.

            </DialogDescription>

          </DialogHeader>



          <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">

            {/* Tasks Completed - Mandatory */}

            <div className="space-y-1.5 sm:space-y-2">

              <label className="text-xs sm:text-sm font-medium flex items-center gap-1">

                Tasks Completed <span className="text-red-500">*</span>

              </label>

              <Textarea

                placeholder="Describe the tasks you completed today..."

                value={eodData.tasksCompleted}

                onChange={(e) => setEodData({ ...eodData, tasksCompleted: e.target.value })}

                className="w-full min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"

                disabled={scrumSubmitting}

              />

              <p className="text-xs text-muted-foreground">

                Minimum 10 characters required

              </p>

            </div>



            {/* Issues/Blockers - Optional */}

            <div className="space-y-1.5 sm:space-y-2">

              <label className="text-xs sm:text-sm font-medium">

                Issues / Blockers <span className="text-muted-foreground">(Optional)</span>

              </label>

              <Textarea

                placeholder="Any issues or blockers you faced today..."

                value={eodData.issuesBlockers}

                onChange={(e) => setEodData({ ...eodData, issuesBlockers: e.target.value })}

                className="w-full min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"

                disabled={scrumSubmitting}

              />

            </div>



            {/* Notes - Optional */}

            <div className="space-y-1.5 sm:space-y-2">

              <label className="text-xs sm:text-sm font-medium">

                Notes <span className="text-muted-foreground">(Optional)</span>

              </label>

              <Textarea

                placeholder="Any additional notes or comments..."

                value={eodData.notes}

                onChange={(e) => setEodData({ ...eodData, notes: e.target.value })}

                className="w-full min-h-[50px] sm:min-h-[60px] text-xs sm:text-sm"

                disabled={scrumSubmitting}

              />

            </div>



            {/* Validation Error */}

            {validationError && (

              <div className="flex items-start gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">

                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />

                <p className="text-xs sm:text-sm text-red-700">{validationError}</p>

              </div>

            )}

          </div>



          <DialogFooter className="flex flex-col sm:flex-row gap-2">

            <Button

              variant="outline"

              className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"

              onClick={() => {

                setShowScrumModal(false);

                setValidationError("");

              }}

              disabled={scrumSubmitting}

            >

              Cancel

            </Button>

            <Button

              onClick={handleScrumSubmit}

              disabled={scrumSubmitting}

              className="w-full sm:w-auto bg-[#133767] hover:bg-[#0d2654] text-xs sm:text-sm h-9 sm:h-10"

            >

              {scrumSubmitting ? "Submitting..." : "Submit & Clock Out"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

}

