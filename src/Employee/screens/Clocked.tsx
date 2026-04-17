import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, LogIn, LogOut, Timer, Calendar, History, ClipboardList } from "lucide-react";
import { getTodayTimeEntry, clockIn, submitScrumAndClockOut, getEmployeeTimeEntryHistory, getEmployeeProfile } from "../lib/api";
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
}

interface HistoryEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  status: string;
  scrum?: string | null;
}

export default function EmployeeClocked() {
  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showScrumModal, setShowScrumModal] = useState(false);
  const [scrumText, setScrumText] = useState("");
  const [scrumSubmitting, setScrumSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entryRes, profileRes] = await Promise.all([
          getTodayTimeEntry(),
          getEmployeeProfile(),
        ]);
        setTimeEntry(entryRes.item);
        setEmployeeName(profileRes.item.name);
      } catch (err) {
        console.error("Failed to load time entry:", err);
        toast.error("Failed to load time entry data");
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
        const res = await getEmployeeTimeEntryHistory();
        setHistory(res.items || []);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await clockIn();
      setTimeEntry(res.item as TimeEntry);
      toast.success("Clocked in successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to clock in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOutClick = () => {
    // Show scrum modal before clocking out
    setShowScrumModal(true);
  };

  const handleScrumSubmit = async () => {
    if (!scrumText.trim()) {
      toast.error("Please enter scrum details before checking out");
      return;
    }
    
    setScrumSubmitting(true);
    try {
      const res = await submitScrumAndClockOut(scrumText.trim());
      setTimeEntry(res.item as TimeEntry);
      toast.success("Clocked out successfully with scrum");
      setShowScrumModal(false);
      setScrumText("");
      // Refresh history
      const historyRes = await getEmployeeTimeEntryHistory();
      setHistory(historyRes.items || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to clock out");
    } finally {
      setScrumSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const isClockedIn = timeEntry?.clockIn && !timeEntry?.clockOut;
  const isClockedOut = timeEntry?.clockIn && timeEntry?.clockOut;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Attendance</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#133767]">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-[#133767]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isClockedIn 
                  ? "bg-green-100" 
                  : isClockedOut 
                    ? "bg-blue-100" 
                    : "bg-gray-100"
              }`}>
                <Clock className={`h-8 w-8 ${
                  isClockedIn 
                    ? "text-green-600" 
                    : isClockedOut 
                      ? "text-blue-600" 
                      : "text-gray-600"
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="text-2xl font-bold">
                  {isClockedIn ? "Clocked In" : isClockedOut ? "Shift Complete" : "Not Clocked In"}
                </p>
                {employeeName && (
                  <p className="text-sm text-muted-foreground">Welcome, {employeeName}</p>
                )}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={isClockedIn 
                ? "border-green-500 text-green-700 bg-green-50" 
                : isClockedOut 
                  ? "border-blue-500 text-blue-700 bg-blue-50" 
                  : "border-gray-500 text-gray-700 bg-gray-50"
              }
            >
              {isClockedIn ? "Active" : isClockedOut ? "Complete" : "Ready"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Time Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clock In</p>
                <p className="text-xl font-bold">{timeEntry?.clockIn || "--:--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clock Out</p>
                <p className="text-xl font-bold">{timeEntry?.clockOut || "--:--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{isClockedIn || isClockedOut ? getDuration() : "--:--:--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Record your attendance for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleClockIn}
              disabled={!!(isClockedIn || isClockedOut || actionLoading)}
            >
              <LogIn className="h-5 w-5 mr-2" />
              {actionLoading && !isClockedIn ? "Processing..." : "Clock In"}
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleClockOutClick}
              disabled={!!(!isClockedIn || actionLoading)}
            >
              <LogOut className="h-5 w-5 mr-2" />
              {actionLoading && isClockedIn ? "Processing..." : "Clock Out"}
            </Button>
          </div>
          {isClockedOut && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              You have completed your shift for today. Total hours: {timeEntry?.totalHours?.toFixed(2) || "--"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your check-in and check-out records</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{entry.clockIn || "--:--"}</TableCell>
                      <TableCell>{entry.clockOut || "--:--"}</TableCell>
                      <TableCell>{entry.totalHours?.toFixed(2) || "--"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.status === "completed"
                              ? "border-green-500 text-green-700 bg-green-50"
                              : entry.status === "active"
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-gray-500 text-gray-700 bg-gray-50"
                          }
                        >
                          {entry.status === "completed" ? "Complete" : entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scrum Modal */}
      <Dialog open={showScrumModal} onOpenChange={setShowScrumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Daily Scrum
            </DialogTitle>
            <DialogDescription>
              Please enter your daily scrum details before checking out.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              What did you work on today?
            </label>
            <Input
              placeholder="Enter your scrum details..."
              value={scrumText}
              onChange={(e) => setScrumText(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowScrumModal(false)}
              disabled={scrumSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScrumSubmit}
              disabled={scrumSubmitting || !scrumText.trim()}
              className="bg-[#133767] hover:bg-[#0d2654]"
            >
              {scrumSubmitting ? "Submitting..." : "Submit & Clock Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
