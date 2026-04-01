import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer, Calendar } from "lucide-react";
import { getTodayTimeEntry, clockIn, clockOut, getEmployeeProfile } from "../lib/api";
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
}

export default function EmployeeClocked() {
  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await clockOut();
      setTimeEntry(res.item as TimeEntry);
      toast.success("Clocked out successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to clock out");
    } finally {
      setActionLoading(false);
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
          <h1 className="text-2xl font-bold">Time Clock</h1>
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
        <h1 className="text-2xl font-bold">Time Clock</h1>
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
              onClick={handleClockOut}
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

      {/* History Note */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Time Entry History</p>
              <p className="text-sm text-muted-foreground">
                View your complete time entry history in the admin panel or contact your manager for past records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
