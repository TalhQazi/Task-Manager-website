import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  UserCheck,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";

// Detect if running inside mobile-responsive context or manager dashboard
interface FollowUpControlCenterProps {
  taskId: string;
  isManager?: boolean;
  isAdmin?: boolean;
}

interface AISuggestions {
  suggestedInterval: number;
  riskScore: number;
  recommendedEscalation: number;
  suggestedAssignee: string;
  recommendedNextAction: string;
}

interface ItineraryStop {
  _id: string;
  title: string;
}

interface FollowUpTimer {
  id: string;
  _id: string;
  taskId: string;
  dueAt: string;
  status: "active" | "completed" | "overdue" | "snoozed";
  completedAt?: string | null;
  snoozedUntil?: string | null;
  escalationLevel: number;
  slaStatus: "On Track" | "Warning" | "Breached" | "Resolved Late" | "Resolved On Time";
  aiSuggestions?: AISuggestions;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://task.se7eninc.com";

export default function FollowUpControlCenter({ taskId, isManager = false, isAdmin = false }: FollowUpControlCenterProps) {
  const { socket } = useSocket();
  const [timer, setTimer] = useState<FollowUpTimer | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Time remaining count
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch token helper
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authRaw = localStorage.getItem("employee_auth");
    if (authRaw) {
      try {
        const auth = JSON.parse(authRaw);
        if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
      } catch {}
    }
    if (!headers["Authorization"]) {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchFollowUps = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setTimer(data.items[0]); // get the latest timer
        } else {
          setTimer(null);
        }
      }
    } catch (err) {
      console.error("Failed to load timers", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/history`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load audit history", err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchFollowUps(), fetchHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [taskId]);

  // Socket.io live listener integrations
  useEffect(() => {
    if (!socket) return;

    const handleFollowupStatus = (payload: { taskId: string; followUpId: string; status: any; dueAt?: string; snoozedUntil?: string; slaStatus?: any; completedAt?: string }) => {
      if (payload.taskId === taskId) {
        fetchFollowUps();
        fetchHistory();
      }
    };

    const handleFollowupEscalation = (payload: { taskId: string; followUpId: string; level: number; notifiedUsers: string[]; notes: string }) => {
      if (payload.taskId === taskId) {
        fetchFollowUps();
        fetchHistory();
      }
    };

    socket.on("followup-status", handleFollowupStatus);
    socket.on("followup-escalation", handleFollowupEscalation);

    return () => {
      socket.off("followup-status", handleFollowupStatus);
      socket.off("followup-escalation", handleFollowupEscalation);
    };
  }, [socket, taskId]);

  // Real-time ticking logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!timer || timer.status === "completed") {
      setRemainingSecs(null);
      return;
    }

    const targetTime = timer.status === "snoozed" && timer.snoozedUntil 
      ? new Date(timer.snoozedUntil).getTime() 
      : new Date(timer.dueAt).getTime();

    const updateClock = () => {
      const delta = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setRemainingSecs(delta);
      if (delta === 0 && timer.status === "active") {
        // trigger reload to sync status Overdue
        fetchFollowUps();
      }
    };

    updateClock();
    intervalRef.current = setInterval(updateClock, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer]);

  // SLA and Countdown Format calculations
  const countdownStr = useMemo(() => {
    if (remainingSecs === null) return "00:00:00:00";
    if (remainingSecs === 0) return "00:00:00:00";

    const days = Math.floor(remainingSecs / (24 * 3600));
    const hours = Math.floor((remainingSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((remainingSecs % 3600) / 60);
    const secs = remainingSecs % 60;

    return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [remainingSecs]);

  // Action Triggers
  const handleCreateTimer = async (mins: number) => {
    setSubmitting(true);
    try {
      const dueAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dueAt }),
      });
      if (res.ok) {
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!timer) return;
    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/${timer._id}/complete`, {
        method: "PATCH",
        headers,
      });
      if (res.ok) {
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async (mins: number) => {
    if (!timer) return;
    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/${timer._id}/snooze`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ minutes: mins }),
      });
      if (res.ok) {
        setSnoozeOpen(false);
        setCustomMinutes("");
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!timer) return;
    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/${timer._id}/reset`, {
        method: "PATCH",
        headers,
      });
      if (res.ok) {
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAI = async () => {
    if (!timer) return;
    setAiLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/${timer._id}/ai-approve`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!timer) return;
    setAiLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/followups/${timer._id}/ai-suggestions`, {
        headers,
      });
      if (res.ok) {
        await initData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Color mappings
  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500 border-red-500/20 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
    if (score >= 35) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
  };

  const getSlaBadge = (status: string) => {
    switch (status) {
      case "On Track":
      case "Resolved On Time":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
      case "Warning":
        return "border-amber-500/30 text-amber-400 bg-amber-500/5";
      case "Breached":
      case "Resolved Late":
        return "border-red-500/30 text-red-400 bg-red-500/5 animate-pulse";
      default:
        return "border-white/10 text-gray-400 bg-white/5";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-black/20 border border-white/5 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative shadow-2xl">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 90% 10%, rgba(99, 102, 241, 0.25) 0%, transparent 60%)"
        }}
      />

      <CardHeader className="pb-3 border-b border-white/5 relative z-10 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[13px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> Follow-Up Center
          </CardTitle>
          <CardDescription className="text-[11px] text-gray-400 mt-0.5">SLA COUNTDOWNS & ESCALATIONS</CardDescription>
        </div>
        {timer && (
          <Badge className={cn("px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] border", getSlaBadge(timer.slaStatus))}>
            SLA: {timer.slaStatus}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5 relative z-10">
        {!timer ? (
          // INITIAL TIMER CREATION PRESENTS
          <div className="space-y-4 text-center py-2">
            <AlertCircle className="w-8 h-8 text-indigo-400/50 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">No Follow-up Scheduled</h4>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">Set an independent follow-up timer for this task to enforce structured execution timelines.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button size="xs" onClick={() => handleCreateTimer(15)} disabled={submitting} className="text-[10px] font-bold bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-gray-300">
                15 Min
              </Button>
              <Button size="xs" onClick={() => handleCreateTimer(30)} disabled={submitting} className="text-[10px] font-bold bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-indigo-400 border-indigo-500/20">
                30 Min
              </Button>
              <Button size="xs" onClick={() => handleCreateTimer(60)} disabled={submitting} className="text-[10px] font-bold bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-gray-300">
                1 Hour
              </Button>
            </div>
          </div>
        ) : (
          // ACTIVE TIMER CONTROL CENTER
          <div className="space-y-5">
            {/* Live Count Down and Status Circle */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Remaining Timer</span>
                <span className={cn(
                  "text-2xl font-black font-mono tracking-tight transition-all",
                  timer.status === "overdue" ? "text-red-500 animate-pulse font-black" : "text-white",
                  timer.status === "snoozed" && "text-amber-400"
                )}>
                  {timer.status === "completed" ? "COMPLETED" : countdownStr}
                </span>
                {timer.completedAt && (
                  <span className="text-[10px] text-emerald-400 block font-semibold">Done: {new Date(timer.completedAt).toLocaleTimeString()}</span>
                )}
                {timer.status === "snoozed" && timer.snoozedUntil && (
                  <span className="text-[10px] text-amber-400/80 block font-medium">Snoozed until {new Date(timer.snoozedUntil).toLocaleTimeString()}</span>
                )}
              </div>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                timer.status === "completed" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" :
                timer.status === "overdue" ? "bg-red-500/10 border-red-500 text-red-500 animate-ping duration-1000" :
                timer.status === "snoozed" ? "bg-amber-500/10 border-amber-500 text-amber-500 animate-pulse" :
                "bg-indigo-500/10 border-indigo-500 text-indigo-400"
              )}>
                {timer.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> :
                 timer.status === "overdue" ? <ShieldAlert className="w-5 h-5" /> :
                 timer.status === "snoozed" ? <AlertTriangle className="w-5 h-5" /> :
                 <Clock className="w-5 h-5" />}
              </div>
            </div>

            {/* Escalation Progression Track */}
            {timer.status !== "completed" && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Escalation State</span>
                <div className="grid grid-cols-4 gap-1.5 relative">
                  {[1, 2, 3, 4].map(lvl => {
                    const isActive = timer.escalationLevel >= lvl;
                    const isOverdue = timer.status === "overdue" && timer.escalationLevel >= lvl;

                    return (
                      <div key={lvl} className="flex flex-col items-center">
                        <div className={cn(
                          "w-full h-1.5 rounded-full transition-all duration-300",
                          isOverdue ? "bg-red-500" :
                          isActive ? "bg-indigo-500" : "bg-white/5"
                        )} />
                        <span className={cn(
                          "text-[9px] font-bold mt-1",
                          isOverdue ? "text-red-400" :
                          isActive ? "text-indigo-400" : "text-gray-600"
                        )}>
                          L{lvl}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-gray-500 text-center leading-relaxed">
                  {timer.escalationLevel === 1 && "Assigned user notified"}
                  {timer.escalationLevel === 2 && "Escalated: Backup user alerted"}
                  {timer.escalationLevel === 3 && "Escalated: Manager notified"}
                  {timer.escalationLevel === 4 && "Critical: Administrators notified"}
                </p>
              </div>
            )}

            {/* Action Buttons Panel */}
            <div className="flex flex-wrap gap-2 pt-1">
              {timer.status !== "completed" && (
                <Button size="xs" onClick={handleComplete} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 text-[10px] rounded-lg shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Complete
                </Button>
              )}
              {timer.status !== "completed" && (
                <Button size="xs" onClick={() => setSnoozeOpen(!snoozeOpen)} disabled={submitting} className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/20 font-bold px-3 py-1 text-[10px] rounded-lg">
                  Snooze
                </Button>
              )}
              {(isManager || isAdmin) && (
                <Button size="xs" onClick={handleReset} disabled={submitting} className="bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 border border-white/5 font-bold px-3 py-1 text-[10px] rounded-lg flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>

            {/* Snooze Options Dialog Block */}
            {snoozeOpen && (
              <div className="p-3 bg-black/60 border border-white/5 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Snooze Duration</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 15, 30, 60].map(m => (
                    <Button key={m} size="xs" onClick={() => handleSnooze(m)} className="bg-white/5 hover:bg-white/10 text-gray-300 border-none text-[10px] font-bold">
                      {m}m
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                  <input
                    type="number"
                    placeholder="Custom mins"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <Button size="xs" onClick={() => handleSnooze(Number(customMinutes) || 15)} disabled={submitting || !customMinutes} className="bg-amber-500 text-black font-bold text-[10px]">
                    Set
                  </Button>
                </div>
              </div>
            )}

            {/* AI Recommendation Engine Card */}
            {timer.status !== "completed" && (
              <div className="border border-white/5 bg-white/[0.01] rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" /> AI Recommendations
                  </span>
                  {timer.aiSuggestions && (
                    <Badge className={cn("text-[9px] px-2 py-0.5 border font-bold uppercase", getRiskColor(timer.aiSuggestions.riskScore))}>
                      Risk Score: {timer.aiSuggestions.riskScore}%
                    </Badge>
                  )}
                </div>

                {!timer.aiSuggestions ? (
                  <div className="text-center py-2">
                    <Button size="xs" onClick={fetchSuggestions} disabled={aiLoading} className="text-[10px] font-bold bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-gray-300">
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />} Generate Recommendations
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 text-[10px] leading-relaxed text-gray-400">
                      <div>
                        Suggested Follow-Up: <strong className="text-gray-300 block font-semibold mt-0.5">{timer.aiSuggestions.suggestedInterval} mins</strong>
                      </div>
                      <div>
                        Backup Assignee: <strong className="text-gray-300 block font-semibold mt-0.5">{timer.aiSuggestions.suggestedAssignee || "None available"}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Suggested Next Action</span>
                      <p className="text-[10px] text-gray-300 leading-snug mt-1 font-medium">{timer.aiSuggestions.recommendedNextAction}</p>
                    </div>

                    {isManager && (
                      <Button size="xs" onClick={handleApproveAI} disabled={aiLoading} className="w-full text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 py-1 rounded-lg">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Apply AI Parameters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audit Log / Audit Trail logs */}
        {history.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Follow-Up Audit Log</span>
            <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {history.map((log, index) => (
                <div key={index} className="text-[10px] leading-snug text-gray-500 flex justify-between gap-2 border-b border-white/[0.02] pb-1 last:border-b-0">
                  <span className="truncate flex-1 font-medium text-gray-400">
                    {log.notes}
                  </span>
                  <span className="text-[9px] font-mono shrink-0 text-gray-600 self-start">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
