import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  PhoneCall,
  Search,
  Trash2,
  ExternalLink,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  Radio,
  ArrowRight,
  Film,
  Download,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface MeetingRecording {
  url: string;
  fileName?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  recordedBy?: string;
  recordedByName?: string;
  createdAt?: string;
}

interface MeetingItem {
  id: string;
  roomCode: string;
  title: string;
  description?: string;
  meetingType: "instant" | "scheduled";
  scheduledStartTime?: string;
  timezone?: string;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  hostRole?: string;
  invitedParticipants: { userId?: string; name?: string; email?: string; role?: string }[];
  joinedParticipants?: {
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    joinedAt?: string;
    leftAt?: string | null;
  }[];
  taskId?: string;
  status: "scheduled" | "active" | "ended";
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  recordingUrl?: string;
  recordings?: MeetingRecording[];
}

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { value: "Asia/Karachi", label: "Pakistan Standard Time (Karachi)" },
  { value: "Asia/Kolkata", label: "India Standard Time (Kolkata)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "Asia/Shanghai", label: "China Standard Time (Beijing)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Australia/Sydney", label: "Eastern Australia Time (Sydney)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

function detectBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") values[p.type] = parseInt(p.value, 10);
  }
  const asUTC = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour === 24 ? 0 : values.hour,
    values.minute,
    values.second
  );
  return asUTC - date.getTime();
}

/** Convert wall-clock date+time in a given IANA timezone to UTC ISO. */
function zonedLocalToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  let utcMs = Date.UTC(y, mo - 1, d, h, mi, 0);
  const offset = getTimezoneOffsetMs(timeZone, new Date(utcMs));
  utcMs -= offset;
  const offset2 = getTimezoneOffsetMs(timeZone, new Date(utcMs));
  if (offset2 !== offset) utcMs = Date.UTC(y, mo - 1, d, h, mi, 0) - offset2;
  return new Date(utcMs).toISOString();
}

function formatMeetingLocalTime(iso: string) {
  const d = new Date(iso);
  const localTz = detectBrowserTimezone();
  const datePart = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${datePart} at ${timePart} (${localTz})`;
}

function formatDurationBetween(start?: string | null, end?: string | null, fallbackMinutes?: number) {
  if (start && end) {
    const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
    const totalMins = Math.round(ms / 60000);
    if (totalMins < 60) return `${totalMins}m`;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (fallbackMinutes) return `${fallbackMinutes}m scheduled`;
  return "—";
}

function uniquePeople(
  people: { name?: string; email?: string; role?: string }[] | undefined
): { name: string; role?: string }[] {
  if (!people?.length) return [];
  const seen = new Set<string>();
  const out: { name: string; role?: string }[] = [];
  for (const p of people) {
    const name = String(p.name || p.email || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, role: p.role });
  }
  return out;
}

export default function AdminMeetings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTimezone, setScheduleTimezone] = useState(detectBrowserTimezone);
  const [duration, setDuration] = useState(30);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [recordingsMeeting, setRecordingsMeeting] = useState<MeetingItem | null>(null);

  const pathPrefix = location.pathname.startsWith("/manager") || location.pathname.startsWith("/manger")
    ? "/manager/meetings"
    : "/admin/meetings";

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const queryType = activeTab === "upcoming" ? "upcoming" : "past";
      const res = await apiFetch<{ items: MeetingItem[] }>(`/api/meetings?type=${queryType}`);
      setMeetings(res.items || []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [activeTab]);

  // Fetch employees for attendee picker
  useEffect(() => {
    if (isScheduleModalOpen && employees.length === 0) {
      apiFetch<{ items: any[] }>("/api/employees")
        .then((res) => setEmployees(res.items || []))
        .catch((err) => console.warn("Could not load employees list:", err));
    }
  }, [isScheduleModalOpen]);

  // Start Instant Meeting
  const handleStartInstant = async () => {
    try {
      const res = await apiFetch<{ item: MeetingItem }>("/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          title: `Instant Team Meeting - ${new Date().toLocaleDateString()}`,
          meetingType: "instant",
        }),
      });

      if (res?.item?.roomCode) {
        navigate(`${pathPrefix}/room/${res.item.roomCode}`);
      }
    } catch (err: any) {
      toast({
        title: "Error starting meeting",
        description: err.message || "Could not generate meeting room",
        variant: "destructive",
      });
    }
  };

  // Join by code
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim();
    if (!clean) return;
    navigate(`${pathPrefix}/room/${clean}`);
  };

  // Submit Scheduled Meeting
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please provide a meeting title", variant: "destructive" });
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast({ title: "Time required", description: "Please choose date and time", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const tz = scheduleTimezone || detectBrowserTimezone();
      const startTime = zonedLocalToUtcIso(scheduleDate, scheduleTime, tz);

      const invited = selectedAttendees.map((id) => {
        const emp = employees.find((e) => String(e.id || e._id) === id);
        return {
          userId: id,
          name: emp?.name || "Team Member",
          email: emp?.email || "",
          role: emp?.role || "employee",
        };
      });

      const res = await apiFetch<{ item: MeetingItem; emailResult?: { sent: number; failed: number } }>("/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          title: topic.trim(),
          description: agenda.trim(),
          meetingType: "scheduled",
          scheduledStartTime: startTime,
          timezone: tz,
          durationMinutes: Number(duration),
          invitedParticipants: invited,
        }),
      });

      const emailed = res.emailResult?.sent ?? 0;
      const emailFailed = res.emailResult?.failed ?? 0;
      toast({
        title: "Meeting Scheduled!",
        description:
          invited.length > 0
            ? `Room code: ${res.item?.roomCode}. Invite emails sent: ${emailed}${emailFailed ? `, failed: ${emailFailed}` : ""}.`
            : `Room code: ${res.item?.roomCode}. No attendees selected for email invites.`,
      });

      setIsScheduleModalOpen(false);
      setTopic("");
      setAgenda("");
      setScheduleDate("");
      setScheduleTime("");
      setScheduleTimezone(detectBrowserTimezone());
      setSelectedAttendees([]);
      setAttendeeSearch("");
      fetchMeetings();
    } catch (err: any) {
      toast({
        title: "Could not schedule meeting",
        description: err.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel and delete this meeting?")) return;
    try {
      await apiFetch(`/api/meetings/${id}`, { method: "DELETE" });
      toast({ title: "Meeting Cancelled", description: "The meeting has been removed." });
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  // Copy meeting link
  const copyMeetingLink = (roomCode: string) => {
    const url = `${window.location.origin}/join/meeting/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(roomCode);
    toast({ title: "Link Copied", description: "Meeting URL copied to clipboard" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const q = searchQuery.toLowerCase();
    return meetings.filter((m) => {
      const inviteeHit = (m.invitedParticipants || []).some(
        (p) =>
          String(p.name || "").toLowerCase().includes(q) ||
          String(p.email || "").toLowerCase().includes(q)
      );
      const joinerHit = (m.joinedParticipants || []).some(
        (p) =>
          String(p.name || "").toLowerCase().includes(q) ||
          String(p.email || "").toLowerCase().includes(q)
      );
      return (
        m.title.toLowerCase().includes(q) ||
        m.roomCode.toLowerCase().includes(q) ||
        m.hostName.toLowerCase().includes(q) ||
        String(m.description || "").toLowerCase().includes(q) ||
        inviteeHit ||
        joinerHit
      );
    });
  }, [meetings, searchQuery]);

  const liveMeetingsCount = meetings.filter((m) => m.status === "active").length;

  const filteredEmployees = useMemo(() => {
    const q = attendeeSearch.trim().toLowerCase();
    const list = employees.filter((emp) => {
      const name = String(emp?.name || emp?.username || "").trim();
      const email = String(emp?.email || "").trim();
      const role = String(emp?.role || "").trim();
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q)
      );
    });
    // Stable sort: named first, then by name
    return [...list].sort((a, b) => {
      const an = String(a?.name || a?.username || a?.email || "").toLowerCase();
      const bn = String(b?.name || b?.username || b?.email || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [employees, attendeeSearch]);

  const timezoneSelectValue = TIMEZONE_OPTIONS.some((t) => t.value === scheduleTimezone)
    ? scheduleTimezone
    : TIMEZONE_OPTIONS.some((t) => t.value === detectBrowserTimezone())
      ? detectBrowserTimezone()
      : "UTC";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Video Meetings</h1>
              <p className="text-sm text-muted-foreground">
                Internal real-time video conferencing, screen sharing, and scheduled team syncs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={handleStartInstant}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2 shadow-sm"
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            Start Instant Meeting
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsScheduleModalOpen(true)}
            className="gap-2 border-border/80 hover:bg-accent"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Stats & Quick Join Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Rooms</div>
            <div className="text-2xl font-bold mt-1 text-emerald-500 flex items-center gap-2">
              {liveMeetingsCount}
              {liveMeetingsCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Upcoming Scheduled</div>
            <div className="text-2xl font-bold mt-1 text-indigo-500">
              {meetings.filter((m) => m.status === "scheduled").length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Join With Code Form */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Join by Code</div>
          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <Input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="e.g. 123-456-789"
              className="h-9 text-xs font-mono"
            />
            <Button type="submit" size="sm" className="h-9 px-3 shrink-0 bg-neutral-900 text-white hover:bg-neutral-800">
              Join
            </Button>
          </form>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "upcoming"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live & Upcoming
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "past"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Past History
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings or codes..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading meetings...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-base">No meetings found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {activeTab === "upcoming"
              ? "You don't have any live or scheduled meetings right now. Start an instant sync or schedule one."
              : "No completed meeting records in history."}
          </p>
          {activeTab === "upcoming" && (
            <Button onClick={handleStartInstant} size="sm" className="mt-2 bg-indigo-600 hover:bg-indigo-500 gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Start Instant Meeting
            </Button>
          )}
        </div>
      ) : activeTab === "past" ? (
        <div className="space-y-3">
          {filteredMeetings.map((m) => {
            const invitees = uniquePeople(m.invitedParticipants);
            const joiners = uniquePeople(m.joinedParticipants);
            const recordingCount = m.recordings?.length || (m.recordingUrl ? 1 : 0);
            const when =
              m.endedAt || m.startedAt || m.scheduledStartTime || m.createdAt;

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-neutral-500/30 text-muted-foreground">
                        Completed
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {m.meetingType || "meeting"}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">#{m.roomCode}</span>
                      {recordingCount > 0 && (
                        <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/20 text-[10px]">
                          {recordingCount} recording{recordingCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                        Topic
                      </div>
                      <h3 className="font-semibold text-base leading-snug" title={m.title}>
                        {m.title}
                      </h3>
                      {m.description ? (
                        <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Shield className="w-3.5 h-3.5" />
                          <span className="font-semibold text-foreground">Host</span>
                        </div>
                        <div className="text-foreground font-medium">{m.hostName || "—"}</div>
                        {(m.hostEmail || m.hostRole) && (
                          <div className="text-[10px] text-muted-foreground">
                            {[m.hostRole, m.hostEmail].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-semibold text-foreground">When</span>
                        </div>
                        <div className="text-foreground">
                          {when ? formatMeetingLocalTime(when) : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Duration: {formatDurationBetween(m.startedAt, m.endedAt, m.durationMinutes)}
                          {m.timezone ? ` · TZ ${m.timezone}` : ""}
                        </div>
                        {m.startedAt && (
                          <div className="text-[10px] text-muted-foreground">
                            Started: {formatMeetingLocalTime(m.startedAt)}
                          </div>
                        )}
                        {m.endedAt && (
                          <div className="text-[10px] text-muted-foreground">
                            Ended: {formatMeetingLocalTime(m.endedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-semibold text-foreground">
                            Invitees ({invitees.length})
                          </span>
                        </div>
                        {invitees.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">No invitees listed.</p>
                        ) : (
                          <ul className="space-y-1 max-h-28 overflow-y-auto">
                            {invitees.map((p) => (
                              <li key={p.name} className="flex items-center justify-between gap-2">
                                <span className="text-foreground truncate">{p.name}</span>
                                {p.role && (
                                  <span className="text-[10px] text-muted-foreground capitalize shrink-0">
                                    {p.role}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-foreground">
                            Joiners ({joiners.length})
                          </span>
                        </div>
                        {joiners.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            No join history saved for this meeting.
                          </p>
                        ) : (
                          <ul className="space-y-1 max-h-28 overflow-y-auto">
                            {joiners.map((p) => (
                              <li key={p.name} className="flex items-center justify-between gap-2">
                                <span className="text-foreground truncate">{p.name}</span>
                                {p.role && (
                                  <span className="text-[10px] text-muted-foreground capitalize shrink-0">
                                    {p.role}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {recordingCount > 0 && (
                      <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-3 text-xs">
                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                          <Film className="w-3.5 h-3.5" />
                          <span className="font-semibold">
                            Recordings ({recordingCount})
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {(m.recordings?.length
                            ? m.recordings
                            : [{ fileName: "meeting-recording.webm", recordedByName: m.hostName, url: m.recordingUrl! }]
                          ).map((rec, idx) => (
                            <li key={`${rec.url}-${idx}`} className="flex items-center justify-between gap-2 text-muted-foreground">
                              <span className="truncate text-foreground">
                                {rec.fileName || `Recording ${idx + 1}`}
                                {rec.recordedByName ? ` · ${rec.recordedByName}` : ""}
                              </span>
                              {typeof rec.durationSeconds === "number" && rec.durationSeconds > 0 && (
                                <span className="text-[10px] shrink-0">
                                  {Math.floor(rec.durationSeconds / 60)}:
                                  {(rec.durationSeconds % 60).toString().padStart(2, "0")}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 shrink-0">
                    {recordingCount > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setRecordingsMeeting(m)}
                        className="h-9 text-xs gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Play Recordings
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyMeetingLink(m.roomCode)}
                      className="h-9 text-xs gap-1.5"
                    >
                      {copiedCode === m.roomCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy Link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMeeting(m.id)}
                      className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((m) => {
            const isLive = m.status === "active";
            const scheduledDate = m.scheduledStartTime ? new Date(m.scheduledStartTime) : null;

            return (
              <div
                key={m.id}
                className={`rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden ${
                  isLive ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/70"
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse">
                          ● LIVE NOW
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600 bg-indigo-500/10">
                          Scheduled
                        </Badge>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">#{m.roomCode}</span>
                    </div>
                    <h3 className="font-semibold text-base leading-snug truncate pr-2" title={m.title}>
                      {m.title}
                    </h3>
                  </div>

                  {/* Actions dropdown / delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMeeting(m.id)}
                    title="Cancel meeting"
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Description */}
                {m.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{m.description}</p>
                )}

                {/* Metadata details */}
                <div className="space-y-2 py-3 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Host: <strong className="text-foreground">{m.hostName}</strong></span>
                  </div>

                  {scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {formatMeetingLocalTime(m.scheduledStartTime!)} · {m.durationMinutes}m
                        {m.timezone ? (
                          <span className="block text-[10px] text-muted-foreground/80 mt-0.5">
                            Scheduled in {m.timezone}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  )}

                  {m.invitedParticipants?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{m.invitedParticipants.length} attendee(s) invited</span>
                    </div>
                  )}

                  {(m.recordings?.length || m.recordingUrl) && (
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {m.recordings?.length || 1} recording{(m.recordings?.length || 1) === 1 ? "" : "s"} available
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyMeetingLink(m.roomCode)}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {copiedCode === m.roomCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Link</span>
                    </Button>
                    {(m.recordings?.length || m.recordingUrl) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRecordingsMeeting(m)}
                        className="h-8 text-xs gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Recordings
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`${pathPrefix}/room/${m.roomCode}`)}
                    className={`h-8 px-4 text-xs font-semibold gap-1.5 ${
                      isLive
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    <span>{isLive ? "Join Call" : "Open Room"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Dialog */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Schedule Team Meeting
            </DialogTitle>
            <DialogDescription>
              Set up a scheduled video sync with your team members. A room code will be assigned.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Meeting Topic *</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Weekly Sprint Sync"
                required
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Agenda / Notes (Optional)</label>
              <Input
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Brief discussion outline"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Date *</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Time *</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Timezone *</label>
              <Select value={timezoneSelectValue} onValueChange={setScheduleTimezone}>
                <SelectTrigger className="h-9 text-xs bg-background text-foreground border-input">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border max-h-64 z-[100]">
                  {!TIMEZONE_OPTIONS.some((t) => t.value === scheduleTimezone) && scheduleTimezone && (
                    <SelectItem value={scheduleTimezone} className="text-xs focus:bg-accent focus:text-accent-foreground">
                      {scheduleTimezone} (detected)
                    </SelectItem>
                  )}
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem
                      key={tz.value}
                      value={tz.value}
                      className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer"
                    >
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter the meeting time in this timezone. Invitees always see it converted to their local time.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Duration</label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="h-9 text-xs bg-background text-foreground border-input">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border z-[100]">
                  <SelectItem value="15" className="text-xs">15 Minutes</SelectItem>
                  <SelectItem value="30" className="text-xs">30 Minutes</SelectItem>
                  <SelectItem value="45" className="text-xs">45 Minutes</SelectItem>
                  <SelectItem value="60" className="text-xs">1 Hour</SelectItem>
                  <SelectItem value="90" className="text-xs">1.5 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attendees selector */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-foreground">Invite Team Members</label>
                <span className="text-[10px] text-muted-foreground">
                  {selectedAttendees.length} selected
                </span>
              </div>
              <Input
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="h-8 text-xs mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-1.5 space-y-0.5 bg-card">
                {employees.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground p-2">Loading team members...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground p-2">No team members match your search.</div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const empId = String(emp.id || emp._id);
                    const isChecked = selectedAttendees.includes(empId);
                    const displayName =
                      String(emp.name || emp.username || emp.email || "Team Member").trim() || "Team Member";
                    const displayRole = String(emp.role || "employee").trim() || "employee";
                    return (
                      <label
                        key={empId}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? "bg-indigo-500/15 text-foreground ring-1 ring-indigo-500/30"
                            : "text-foreground hover:bg-muted/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttendees((prev) => [...prev, empId]);
                            } else {
                              setSelectedAttendees((prev) => prev.filter((id) => id !== empId));
                            }
                          }}
                          className="h-3.5 w-3.5 shrink-0 rounded border-border bg-background accent-indigo-500"
                        />
                        <span className="font-medium text-foreground truncate min-w-0 flex-1">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize shrink-0">
                          ({displayRole})
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recordings playback dialog */}
      <Dialog open={Boolean(recordingsMeeting)} onOpenChange={(open) => !open && setRecordingsMeeting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              Recordings — {recordingsMeeting?.title}
            </DialogTitle>
            <DialogDescription>
              Play or download recordings saved from this meeting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {(recordingsMeeting?.recordings?.length
              ? recordingsMeeting.recordings
              : recordingsMeeting?.recordingUrl
              ? [
                  {
                    url: recordingsMeeting.recordingUrl,
                    fileName: "meeting-recording.webm",
                    recordedByName: recordingsMeeting.hostName,
                  } as MeetingRecording,
                ]
              : []
            ).map((rec, idx) => {
              const playUrl = toProxiedUrl(rec.url) || rec.url;
              const mins = Math.floor((rec.durationSeconds || 0) / 60);
              const secs = (rec.durationSeconds || 0) % 60;
              return (
                <div
                  key={`${rec.url}-${idx}`}
                  className="rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {rec.fileName || `Recording ${idx + 1}`}
                      </div>
                      <div className="text-muted-foreground">
                        {rec.recordedByName || "Host"}
                        {rec.durationSeconds
                          ? ` · ${mins}:${secs.toString().padStart(2, "0")}`
                          : ""}
                        {rec.createdAt
                          ? ` · ${new Date(rec.createdAt).toLocaleString()}`
                          : ""}
                      </div>
                    </div>
                    <a
                      href={playUrl}
                      download={rec.fileName || `meeting-recording-${idx + 1}.webm`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs hover:bg-accent"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                  <video
                    controls
                    src={playUrl}
                    className="w-full rounded-lg bg-black max-h-72"
                  />
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
