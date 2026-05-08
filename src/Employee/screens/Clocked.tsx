import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Clock, LogIn, LogOut, Timer, Calendar, History, ClipboardList, AlertCircle, AlertTriangle, Mic, MicOff, Type } from "lucide-react";
import { getTodayTimeEntry, clockIn, submitScrumAndClockOut, getEmployeeTimeEntryHistory, getEmployeeProfile, submitEODReport, getOnboardingStatus } from "../lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  const [scrumSubmitting, setScrumSubmitting] = useState(false);
  const [eodData, setEodData] = useState({
    tasksCompleted: "",
    issuesBlockers: "",
    notes: "",
  });
  const [validationError, setValidationError] = useState("");
  const [onboardingStatus, setOnboardingStatus] = useState<string>("not_started");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entryRes, profileRes, onboardingRes] = await Promise.all([
          getTodayTimeEntry(),
          getEmployeeProfile(),
          getOnboardingStatus().catch(() => ({ item: { overallStatus: "not_started" } })),
        ]);
        setTimeEntry(entryRes.item);
        setEmployeeName(profileRes.item.name);
        setOnboardingStatus(onboardingRes.item.overallStatus);
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
    // Reset voice state
    setInputType("text");
    setTranscription("");
    setIsRecording(false);
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
      // Submit EOD report first with inputType and transcription
      await submitEODReport({
        inputType,
        tasksCompleted: eodData.tasksCompleted.trim(),
        issuesBlockers: eodData.issuesBlockers.trim(),
        notes: eodData.notes.trim(),
        transcription: inputType === "voice" ? transcription.trim() : undefined,
      });

      // Then clock out with scrum (for backward compatibility)
      const eodReport = JSON.stringify({
        tasksCompleted: eodData.tasksCompleted.trim(),
        issuesBlockers: eodData.issuesBlockers.trim(),
        notes: eodData.notes.trim(),
      });

      const res = await submitScrumAndClockOut(eodReport);
      toast.success("Clocked out successfully with EOD report");
      setShowScrumModal(false);
      setEodData({
        tasksCompleted: "",
        issuesBlockers: "",
        notes: "",
      });
      // Reload time entry to get fresh state
      const entryRes = await getTodayTimeEntry();
      setTimeEntry(entryRes.item);
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

  const toUSATime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "--:--";
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      let usaHours = hours - 10;
      let dayOffset = "";
      if (usaHours < 0) {
        usaHours += 24;
        dayOffset = " (prev day)";
      }
      return `${usaHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}${dayOffset}`;
    } catch {
      return timeStr;
    }
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
  const isOnboardingApproved = onboardingStatus === "approved";

  // Voice recognition functions
  const startVoiceRecording = () => {
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      toast.error("Voice recognition is not supported in your browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscription(finalTranscript || interimTranscript);
      if (finalTranscript) {
        setEodData({ ...eodData, tasksCompleted: finalTranscript });
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Voice recognition error: " + event.error);
      setIsRecording(false);
    };

    recognitionInstance.onend = () => {
      if (isRecording) {
        setIsRecording(false);
      }
    };

    setRecognition(recognitionInstance);
    recognitionInstance.start();
    setIsRecording(true);
    toast.success("Voice recording started");
  };

  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
      toast.success("Voice recording stopped");
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

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

      {/* Onboarding Warning Banner */}
      {!isOnboardingApproved && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Onboarding Required</p>
                  <p className="text-sm text-orange-700">
                    {onboardingStatus === "not_started" || onboardingStatus === "in_progress"
                      ? "Please complete your onboarding before clocking in."
                      : onboardingStatus === "submitted"
                      ? "Your onboarding is submitted and pending approval."
                      : "Please complete your onboarding before clocking in."}
                  </p>
                </div>
              </div>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link to="/employee/profile">Complete Onboarding</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-sm text-muted-foreground">Clock In (USA)</p>
                <p className="text-xl font-bold">{toUSATime(timeEntry?.clockIn) || "--:--"}</p>
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
                <p className="text-sm text-muted-foreground">Clock Out (USA)</p>
                <p className="text-xl font-bold">{toUSATime(timeEntry?.clockOut) || "--:--"}</p>
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
              disabled={!!(isClockedIn || isClockedOut || actionLoading || !isOnboardingApproved)}
              title={!isOnboardingApproved ? "Complete onboarding first" : ""}
            >
              <LogIn className="h-5 w-5 mr-2" />
              {actionLoading && !isClockedIn ? "Processing..." : !isOnboardingApproved ? "Onboarding Required" : "Clock In"}
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
                      <TableCell>{toUSATime(entry.clockIn) || "--:--"}</TableCell>
                      <TableCell>{toUSATime(entry.clockOut) || "--:--"}</TableCell>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              End-of-Day Report
            </DialogTitle>
            <DialogDescription>
              Please complete your EOD report before checking out. Tasks completed is mandatory.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Input Type Toggle */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Button
                type="button"
                variant={inputType === "text" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInputType("text")}
                disabled={scrumSubmitting || isRecording}
                className="flex-1"
              >
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                type="button"
                variant={inputType === "voice" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInputType("voice")}
                disabled={scrumSubmitting || isRecording}
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
            </div>

            {/* Tasks Completed - Mandatory */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Tasks Completed <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Textarea
                  placeholder={
                    inputType === "voice"
                      ? "Click the microphone button to start speaking..."
                      : "Describe the tasks you completed today..."
                  }
                  value={eodData.tasksCompleted}
                  onChange={(e) => setEodData({ ...eodData, tasksCompleted: e.target.value })}
                  className="w-full min-h-[100px]"
                  disabled={scrumSubmitting || isRecording}
                />
                {inputType === "voice" && (
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "default"}
                    size="icon"
                    onClick={toggleVoiceRecording}
                    disabled={scrumSubmitting}
                    className="self-start"
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce" />
                  Recording in progress...
                </div>
              )}
              {inputType === "voice" && transcription && !isRecording && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700 font-medium mb-1">Transcription:</p>
                  <p className="text-sm text-blue-900">{transcription}</p>
                </div>
              )}
            </div>

            {/* Issues/Blockers - Optional */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Issues / Blockers <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Any issues or blockers you faced today..."
                value={eodData.issuesBlockers}
                onChange={(e) => setEodData({ ...eodData, issuesBlockers: e.target.value })}
                className="w-full min-h-[80px]"
                disabled={scrumSubmitting}
              />
            </div>

            {/* Notes - Optional */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notes <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Any additional notes or comments..."
                value={eodData.notes}
                onChange={(e) => setEodData({ ...eodData, notes: e.target.value })}
                className="w-full min-h-[60px]"
                disabled={scrumSubmitting}
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{validationError}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
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
