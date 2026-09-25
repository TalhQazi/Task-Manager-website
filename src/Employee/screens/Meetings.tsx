import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { employeeApiFetch } from "@/Employee/lib/api";
import { toProxiedUrl } from "@/lib/admin/apiClient";
import {
  Video,
  Radio,
  Clock,
  Users,
  Copy,
  Check,
  Shield,
  ArrowRight,
  Search,
  Film,
  Play,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  invitedParticipants: { userId?: string; name?: string; email?: string; role?: string }[];
  status: "scheduled" | "active" | "ended";
  createdAt: string;
  recordingUrl?: string;
  recordings?: {
    url: string;
    fileName?: string;
    durationSeconds?: number;
    recordedByName?: string;
    createdAt?: string;
  }[];
}

function formatMeetingLocalTime(iso: string, scheduledTz?: string) {
  const d = new Date(iso);
  let localTz = "local";
  try {
    localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  } catch {
    /* ignore */
  }
  const datePart = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return {
    primary: `${datePart} at ${timePart} (${localTz})`,
    scheduledNote: scheduledTz ? `Scheduled in ${scheduledTz}` : null,
  };
}

export default function EmployeeMeetings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [recordingsMeeting, setRecordingsMeeting] = useState<MeetingItem | null>(null);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApiFetch<{ items: MeetingItem[] }>("/api/meetings?type=upcoming");
      setMeetings(res.items || []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleStartInstant = async () => {
    try {
      const res = await employeeApiFetch<{ item: MeetingItem }>("/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          title: `Team Call - ${new Date().toLocaleDateString()}`,
          meetingType: "instant",
        }),
      });

      if (res?.item?.roomCode) {
        navigate(`/employee/meetings/room/${res.item.roomCode}`);
      }
    } catch (err: any) {
      toast({
        title: "Error starting meeting",
        description: err.message || "Could not generate room",
        variant: "destructive",
      });
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim();
    if (!clean) return;
    navigate(`/employee/meetings/room/${clean}`);
  };

  const copyMeetingLink = (roomCode: string) => {
    const url = `${window.location.origin}/join/meeting/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(roomCode);
    toast({ title: "Link Copied", description: "Meeting URL copied to clipboard" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-indigo-500" /> Team Video Meetings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Join your scheduled discussions or start an instant video call with teammates.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleStartInstant}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2 shrink-0"
        >
          <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
          Start Instant Call
        </Button>
      </div>

      {/* Join with Code Card */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm max-w-md">
        <label className="text-xs font-semibold text-foreground mb-1.5 block">Have a Room Code?</label>
        <form onSubmit={handleJoinByCode} className="flex gap-2">
          <Input
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="e.g. 123-456-789"
            className="h-10 text-xs font-mono"
          />
          <Button type="submit" className="h-10 px-4 bg-neutral-900 text-white hover:bg-neutral-800 shrink-0">
            Join Room
          </Button>
        </form>
      </div>

      {/* Upcoming Meetings Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" /> My Upcoming Meetings
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center flex flex-col items-center justify-center gap-2">
            <Video className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No upcoming meetings right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const isLive = m.status === "active";
              const scheduledDate = m.scheduledStartTime ? new Date(m.scheduledStartTime) : null;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition ${
                    isLive ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-card"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {isLive ? (
                        <Badge className="bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                          ● LIVE NOW
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-500/30">
                          Scheduled
                        </Badge>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">#{m.roomCode}</span>
                    </div>

                    <h3 className="font-semibold text-base truncate">{m.title}</h3>
                    {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}

                    <div className="text-xs text-muted-foreground space-y-1 pt-2">
                      <div>Host: <strong className="text-foreground">{m.hostName}</strong></div>
                      {scheduledDate && (() => {
                        const fmt = formatMeetingLocalTime(m.scheduledStartTime!, m.timezone);
                        return (
                          <div>
                            <div>{fmt.primary}</div>
                            {fmt.scheduledNote && (
                              <div className="text-[10px] text-muted-foreground/80">{fmt.scheduledNote}</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyMeetingLink(m.roomCode)}
                        className="h-8 text-xs gap-1.5"
                      >
                        {copiedCode === m.roomCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copy Link
                      </Button>
                      {(m.recordings?.length || m.recordingUrl) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordingsMeeting(m)}
                          className="h-8 text-xs gap-1.5 text-rose-500 border-rose-500/30"
                        >
                          <Film className="w-3.5 h-3.5" />
                          Rec
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate(`/employee/meetings/room/${m.roomCode}`)}
                      className={`h-8 px-4 text-xs font-semibold gap-1.5 ${
                        isLive ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
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
      </div>

      <Dialog open={Boolean(recordingsMeeting)} onOpenChange={(open) => !open && setRecordingsMeeting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              Recordings — {recordingsMeeting?.title}
            </DialogTitle>
            <DialogDescription>Play or download saved meeting recordings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {(recordingsMeeting?.recordings?.length
              ? recordingsMeeting.recordings
              : recordingsMeeting?.recordingUrl
              ? [{ url: recordingsMeeting.recordingUrl, fileName: "meeting-recording.webm" }]
              : []
            ).map((rec, idx) => {
              const playUrl = toProxiedUrl(rec.url) || rec.url;
              return (
                <div key={`${rec.url}-${idx}`} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{rec.fileName || `Recording ${idx + 1}`}</span>
                    <a
                      href={playUrl}
                      download={rec.fileName || `recording-${idx + 1}.webm`}
                      className="inline-flex items-center gap-1 text-rose-500"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                  <video controls src={playUrl} className="w-full rounded-lg bg-black max-h-72" />
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
