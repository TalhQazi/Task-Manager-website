import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Badge } from "@/components/admin/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import {
  Bug,
  MessageSquare,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Layers,
  Send,
  Paperclip,
  Video,
  FileText,
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ShieldAlert,
} from "lucide-react";
import { apiFetch, toProxiedUrl } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";

type BugItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  severity?: string;
  priority?: string;
  company?: string;
  module?: string;
  taskTitle?: string;
  assignedDeveloperId?: string;
  assignedDeveloperName?: string;
  createdByUserId?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdAt?: string;
  lastActivity?: string;
  source?: { panel?: string; path?: string };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number; duration?: number }[];
  resolution?: {
    summary?: string;
    verificationPerformed?: string;
    releaseVersion?: string;
    deploymentEnvironment?: string;
    commitUrl?: string;
    pullRequestUrl?: string;
    disposition?: string;
    submittedBy?: string;
    submittedAt?: string;
    attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
  };
  verification?: {
    reporterConfirmed?: boolean;
    confirmedAt?: string;
    feedback?: string;
    rejectionReason?: string;
  };
};

type CommentItem = {
  id: string;
  userId: string;
  username: string;
  userRole?: string;
  userAvatarUrl?: string;
  content: string;
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number; duration?: number }[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
};

type EventItem = {
  id: string;
  actorName: string;
  actorRole?: string;
  eventType: string;
  details: string;
  createdAt: string;
};

type BugCollaborationModalProps = {
  bugId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBugUpdated?: () => void;
};

const isVideo = (att?: { url?: string; mimeType?: string; fileName?: string } | string | null) => {
  if (!att) return false;
  const url = typeof att === "string" ? att : att.url || "";
  const mimeType = typeof att === "string" ? "" : att.mimeType || "";
  const fileName = typeof att === "string" ? "" : att.fileName || "";
  if (mimeType.startsWith("video/")) return true;
  if (url.startsWith("data:video/")) return true;
  return /\.(mp4|webm|mov|ogg|mkv)(\?.*)?$/i.test((url || fileName).toLowerCase());
};

const getStatusBadge = (status: string) => {
  const s = (status || "OPEN").toUpperCase();
  switch (s) {
    case "OPEN":
      return <Badge variant="outline" className="bg-[#00C6FF]/10 text-[#00C6FF] border-[#00C6FF]/30 font-semibold">OPEN</Badge>;
    case "TRIAGED":
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 font-semibold">TRIAGED</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold">IN PROGRESS</Badge>;
    case "NEEDS_INFO":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold">NEEDS INFO</Badge>;
    case "RESOLUTION_SUBMITTED":
    case "AWAITING_REPORTER_CONFIRMATION":
      return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 font-semibold animate-pulse">AWAITING VERIFICATION</Badge>;
    case "CLOSED_VERIFIED":
    case "CLOSED":
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold">CLOSED (VERIFIED)</Badge>;
    case "REOPENED":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 font-semibold">REOPENED</Badge>;
    case "CLOSED_ADMIN_OVERRIDE":
      return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30 font-semibold">CLOSED (ADMIN OVERRIDE)</Badge>;
    default:
      return <Badge variant="outline">{s}</Badge>;
  }
};

export default function BugCollaborationModal({ bugId, open, onOpenChange, onBugUpdated }: BugCollaborationModalProps) {
  const auth = getAuthState();
  const currentUsername = String(auth.username || auth.name || "User").trim();
  const currentRole = String(auth.role || "").toLowerCase();
  const isAdmin = ["admin", "super-admin"].includes(currentRole);

  const [bug, setBug] = useState<BugItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState("report");

  // Comment State
  const [newComment, setNewComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentPreviews, setCommentPreviews] = useState<string[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // Resolution Modal State
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [resSummary, setResSummary] = useState("");
  const [resVerification, setResVerification] = useState("");
  const [resVersion, setResVersion] = useState("");
  const [resEnv, setResEnv] = useState("");
  const [resCommit, setResCommit] = useState("");
  const [resPR, setResPR] = useState("");
  const [resDisposition, setResDisposition] = useState("Fixed");
  const [submittingRes, setSubmittingRes] = useState(false);

  // Reporter Verification Dialog State
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState<"YES" | "NO">("YES");
  const [verifyFeedback, setVerifyFeedback] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Edit Developer Assignment State
  const [assignDevName, setAssignDevName] = useState("");

  // Lightbox
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const loadData = async () => {
    if (!bugId) return;
    try {
      setLoading(true);
      setApiError(null);

      const [bugRes, commentsRes, eventsRes] = await Promise.all([
        apiFetch<{ item: BugItem }>(`/api/bugs/${encodeURIComponent(bugId)}`),
        apiFetch<{ items: CommentItem[] }>(`/api/bugs/${encodeURIComponent(bugId)}/comments`),
        apiFetch<{ items: EventItem[] }>(`/api/bugs/${encodeURIComponent(bugId)}/events`),
      ]);

      if (bugRes?.item) {
        setBug(bugRes.item);
        setAssignDevName(bugRes.item.assignedDeveloperName || "");
      }
      setComments(Array.isArray(commentsRes?.items) ? commentsRes.items : []);
      setEvents(Array.isArray(eventsRes?.items) ? eventsRes.items : []);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load bug details");
    } fontFinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && bugId) {
      void loadData();
    }
  }, [open, bugId]);

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!bug) return;
    try {
      setLoading(true);
      const res = await apiFetch<{ item: BugItem }>(`/api/bugs/${encodeURIComponent(bug.id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res?.item) setBug(res.item);
      await loadData();
      if (onBugUpdated) onBugUpdated();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDeveloper = async () => {
    if (!bug || !assignDevName.trim()) return;
    try {
      setLoading(true);
      const res = await apiFetch<{ item: BugItem }>(`/api/bugs/${encodeURIComponent(bug.id)}`, {
        method: "PUT",
        body: JSON.stringify({ assignedDeveloperName: assignDevName.trim() }),
      });
      if (res?.item) setBug(res.item);
      await loadData();
      if (onBugUpdated) onBugUpdated();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to assign developer");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!bug || (!newComment.trim() && !commentFiles.length)) return;
    try {
      setSubmittingComment(true);

      let uploadedAtts: any[] = [];
      if (commentFiles.length > 0) {
        const formData = new FormData();
        commentFiles.forEach((f) => formData.append("files", f));
        const upRes = await apiFetch<{ items?: any[] }>("/api/bugs/upload", {
          method: "POST",
          body: formData,
        });
        uploadedAtts = Array.isArray(upRes?.items) ? upRes.items : [];
      }

      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment.trim(),
          attachments: uploadedAtts,
        }),
      });

      setNewComment("");
      commentPreviews.forEach((u) => URL.revokeObjectURL(u));
      setCommentFiles([]);
      setCommentPreviews([]);

      await loadData();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!bug || !editCommentText.trim()) return;
    try {
      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/comments/${encodeURIComponent(commentId)}`, {
        method: "PUT",
        body: JSON.stringify({ content: editCommentText.trim() }),
      });
      setEditingCommentId(null);
      setEditCommentText("");
      await loadData();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to edit comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!bug) return;
    try {
      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/comments/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to delete comment");
    }
  };

  const handleSubmitResolution = async () => {
    if (!bug || !resSummary.trim() || !resVerification.trim()) return;
    try {
      setSubmittingRes(true);
      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/resolution`, {
        method: "POST",
        body: JSON.stringify({
          summary: resSummary.trim(),
          verificationPerformed: resVerification.trim(),
          releaseVersion: resVersion.trim(),
          deploymentEnvironment: resEnv.trim(),
          commitUrl: resCommit.trim(),
          pullRequestUrl: resPR.trim(),
          disposition: resDisposition,
        }),
      });
      setResolutionOpen(false);
      await loadData();
      if (onBugUpdated) onBugUpdated();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to submit resolution");
    } finally {
      setSubmittingRes(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!bug) return;
    try {
      setSubmittingVerify(true);
      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/confirm-resolution`, {
        method: "POST",
        body: JSON.stringify({
          confirmed: verifyDecision === "YES",
          feedback: verifyFeedback.trim(),
          rejectionReason: verifyFeedback.trim(),
        }),
      });
      setVerifyOpen(false);
      setVerifyFeedback("");
      await loadData();
      if (onBugUpdated) onBugUpdated();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to submit verification");
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleAdminOverride = async () => {
    if (!bug) return;
    try {
      setLoading(true);
      await apiFetch(`/api/bugs/${encodeURIComponent(bug.id)}/admin-override`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin force closed bug report." }),
      });
      await loadData();
      if (onBugUpdated) onBugUpdated();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Admin override failed");
    } finally {
      setLoading(false);
    }
  };

  const isReporter = bug?.createdByUserId === auth.userId || bug?.createdByUsername === currentUsername;
  const isAwaitingVerification = bug?.status === "AWAITING_REPORTER_CONFIRMATION" || bug?.status === "RESOLUTION_SUBMITTED";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[98vw] max-w-5xl mx-auto p-0 max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col bg-background">
          {/* Top Header Banner */}
          <div className="p-4 sm:p-6 bg-card border-b flex flex-col gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  #BUG-{bug?.id.substring(0, 8)}
                </span>
                {bug && getStatusBadge(bug.status)}
                {bug?.severity && (
                  <Badge variant="outline" className="capitalize text-xs font-medium">
                    Severity: {bug.severity}
                  </Badge>
                )}
                {bug?.priority && (
                  <Badge variant="outline" className="capitalize text-xs font-medium">
                    Priority: {bug.priority}
                  </Badge>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {bug?.status === "OPEN" && (
                  <Button size="sm" variant="outline" onClick={() => void handleUpdateStatus("TRIAGED")}>
                    Mark Triaged
                  </Button>
                )}
                {["OPEN", "TRIAGED", "NEEDS_INFO", "REOPENED"].includes(bug?.status || "") && (
                  <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus("IN_PROGRESS")}>
                    Mark In Progress
                  </Button>
                )}
                {bug?.status === "IN_PROGRESS" && (
                  <Button size="sm" variant="default" onClick={() => setResolutionOpen(true)}>
                    Submit Resolution
                  </Button>
                )}
                {isAdmin && bug?.status !== "CLOSED_ADMIN_OVERRIDE" && bug?.status !== "CLOSED_VERIFIED" && (
                  <Button size="sm" variant="destructive" onClick={() => void handleAdminOverride()}>
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                    Admin Override Close
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{bug?.title || "Bug Details"}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Reporter: <strong className="text-foreground">{bug?.createdByUsername || "System"}</strong>
                </span>
                {bug?.assignedDeveloperName ? (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Dev: <strong className="text-foreground">{bug.assignedDeveloperName}</strong>
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Assign developer..."
                      value={assignDevName}
                      onChange={(e) => setAssignDevName(e.target.value)}
                      className="h-6 text-[11px] w-36 px-2"
                    />
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => void handleAssignDeveloper()}>
                      Assign
                    </Button>
                  </div>
                )}
                {bug?.module && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Module: {bug.module}
                  </span>
                )}
                {bug?.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> {bug.company}
                  </span>
                )}
                {bug?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Reported: {new Date(bug.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Reporter Verification Action Banner */}
            {isAwaitingVerification && (isReporter || isAdmin) && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in mt-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Fix Submitted by Developer!</p>
                    <p className="text-[11px] text-muted-foreground">Did this resolution solve your reported issue?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                    onClick={() => {
                      setVerifyDecision("YES");
                      setVerifyOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> YES (Verify & Close)
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1 text-xs"
                    onClick={() => {
                      setVerifyDecision("NO");
                      setVerifyOpen(true);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> NO (Reopen)
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
            {apiError && (
              <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                {apiError}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 max-w-md mb-3">
                <TabsTrigger value="report" className="text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Report & Evidence
                </TabsTrigger>
                <TabsTrigger value="conversation" className="text-xs gap-1.5 relative">
                  <MessageSquare className="h-3.5 w-3.5" /> Conversation ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" /> Activity Log ({events.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: ORIGINAL REPORT & RESOLUTION SUMMARY */}
              <TabsContent value="report" className="flex-1 overflow-y-auto pr-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Problem Description</h3>
                  <div className="p-4 rounded-xl border bg-muted/20 text-sm whitespace-pre-wrap leading-relaxed">
                    {bug?.description}
                  </div>
                </div>

                {/* Evidence Attachments */}
                {bug?.attachments && bug.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Original Evidence & Media ({bug.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {bug.attachments.map((att, idx) => {
                        const src = toProxiedUrl(String(att.url)) ?? "";
                        const allUrls = bug.attachments!.map((a) => toProxiedUrl(String(a.url)) ?? "");
                        const isVid = isVideo(att);

                        if (isVid) {
                          return (
                            <div key={idx} className="rounded-lg border bg-black overflow-hidden flex flex-col">
                              <video src={src} controls className="w-full h-36 object-contain" />
                              <div className="p-1.5 bg-card text-[10px] text-muted-foreground flex items-center justify-between">
                                <span className="truncate flex items-center gap-1 font-medium">
                                  <Video className="h-3 w-3 text-primary shrink-0" /> {att.fileName || `Video ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="relative group overflow-hidden rounded-lg border bg-muted/20 cursor-pointer h-36"
                            onClick={() => setLightbox({ urls: allUrls, index: idx })}
                          >
                            <img src={src} alt={att.fileName || `Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Developer Resolution Details Card (if submitted) */}
                {bug?.resolution?.summary && (
                  <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3 mt-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Submitted Resolution Details
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        By {bug.resolution.submittedBy} on {bug.resolution.submittedAt ? new Date(bug.resolution.submittedAt).toLocaleDateString() : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-muted-foreground">Disposition:</span> {bug.resolution.disposition}
                      </div>
                      {bug.resolution.releaseVersion && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Release Version:</span> {bug.resolution.releaseVersion}
                        </div>
                      )}
                      {bug.resolution.deploymentEnvironment && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Environment:</span> {bug.resolution.deploymentEnvironment}
                        </div>
                      )}
                      {bug.resolution.commitUrl && (
                        <div>
                          <a href={bug.resolution.commitUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                            Commit URL <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground">Resolution Summary:</span>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{bug.resolution.summary}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground">Verification Performed:</span>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{bug.resolution.verificationPerformed}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: SLACK / GITHUB STYLE CONVERSATION THREAD */}
              <TabsContent value="conversation" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs italic">
                      No comments yet. Start the conversation below.
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isAuthor = c.userId === auth.userId || c.username === currentUsername;
                      const elapsedMs = Date.now() - new Date(c.createdAt).getTime();
                      const canEdit = isAuthor && elapsedMs <= 5 * 60 * 1000 && !c.isDeleted;

                      if (c.isDeleted) {
                        return (
                          <div key={c.id} className="p-2.5 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground italic">
                            Comment Removed
                          </div>
                        );
                      }

                      return (
                        <div key={c.id} className="flex gap-3 group">
                          <Avatar className="h-8 w-8 mt-0.5 border">
                            {c.userAvatarUrl ? <AvatarImage src={toProxiedUrl(c.userAvatarUrl)} /> : <AvatarFallback className="text-[10px] font-bold">{c.username.charAt(0).toUpperCase()}</AvatarFallback>}
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">{c.username}</span>
                                {c.userRole && <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0">{c.userRole}</Badge>}
                                <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {c.isEdited && <span className="text-[9px] text-muted-foreground italic">(edited)</span>}
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.content);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground text-[10px]"
                                    title="Edit (within 5 min)"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                )}
                                {(isAuthor || isAdmin) && (
                                  <button
                                    onClick={() => void handleDeleteComment(c.id)}
                                    className="p-1 text-muted-foreground hover:text-destructive text-[10px]"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {editingCommentId === c.id ? (
                              <div className="space-y-2 mt-1">
                                <Textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="text-xs"
                                  rows={2}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingCommentId(null)}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" className="h-7 text-xs" onClick={() => void handleSaveEditComment(c.id)}>
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-card border text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                                {c.content}
                              </div>
                            )}

                            {/* Comment Attachments */}
                            {c.attachments && c.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {c.attachments.map((att, i) => {
                                  const src = toProxiedUrl(String(att.url)) ?? "";
                                  if (isVideo(att)) {
                                    return (
                                      <div key={i} className="w-36 h-24 rounded-lg bg-black overflow-hidden border">
                                        <video src={src} controls className="w-full h-full object-cover" />
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      key={i}
                                      className="w-24 h-24 rounded-lg border overflow-hidden cursor-pointer"
                                      onClick={() => setLightbox({ urls: [src], index: 0 })}
                                    >
                                      <img src={src} alt="att" className="w-full h-full object-cover" />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Input Box */}
                <div className="pt-2 border-t space-y-2 shrink-0">
                  {commentPreviews.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {commentPreviews.map((url, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded border bg-black shrink-0 overflow-hidden">
                          <img src={url} alt="preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              URL.revokeObjectURL(url);
                              setCommentFiles((prev) => prev.filter((_, i) => i !== idx));
                              setCommentPreviews((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/80 text-white flex items-center justify-center"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Write a message, reply, or @mention someone..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="text-xs resize-none flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => commentFileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => void handleAddComment()}
                        disabled={submittingComment || (!newComment.trim() && !commentFiles.length)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={commentFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setCommentFiles((prev) => [...prev, ...files]);
                      setCommentPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </TabsContent>

              {/* TAB 3: CHRONOLOGICAL ACTIVITY AUDIT TRAIL */}
              <TabsContent value="activity" className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs italic">No activity logged yet.</div>
                  ) : (
                    events.map((ev) => (
                      <div key={ev.id} className="flex gap-3 text-xs items-start border-l-2 border-primary/30 pl-3 py-1">
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-foreground">{ev.details}</p>
                          <p className="text-[10px] text-muted-foreground">
                            By {ev.actorName} ({ev.actorRole || "User"}) • {new Date(ev.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESOLUTION SUBMISSION MODAL FORM */}
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Submit Bug Resolution
            </DialogTitle>
            <DialogDescription className="text-xs">
              Describe how the bug was fixed and tests performed. The original reporter will be requested to verify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs my-2">
            <div className="space-y-1">
              <label className="font-semibold">Resolution Summary <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Explain the root cause and fix applied..."
                value={resSummary}
                onChange={(e) => setResSummary(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Verification Performed <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Unit tests passed, manual test steps..."
                value={resVerification}
                onChange={(e) => setResVerification(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold">Disposition</label>
                <Select value={resDisposition} onValueChange={setResDisposition}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Configuration Changed">Configuration Changed</SelectItem>
                    <SelectItem value="User Guidance">User Guidance</SelectItem>
                    <SelectItem value="Duplicate">Duplicate</SelectItem>
                    <SelectItem value="Cannot Reproduce">Cannot Reproduce</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Release Version</label>
                <Input placeholder="e.g. v1.4.2" value={resVersion} onChange={(e) => setResVersion(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold">Commit URL</label>
                <Input placeholder="GitHub commit link" value={resCommit} onChange={(e) => setResCommit(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Pull Request URL</label>
                <Input placeholder="GitHub PR link" value={resPR} onChange={(e) => setResPR(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResolutionOpen(false)} disabled={submittingRes}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void handleSubmitResolution()} disabled={submittingRes || !resSummary.trim() || !resVerification.trim()}>
              Submit Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPORTER VERIFICATION PROMPT DIALOG */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {verifyDecision === "YES" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
              {verifyDecision === "YES" ? "Confirm Fix & Close Bug" : "Reject Fix & Reopen Bug"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {verifyDecision === "YES"
                ? "Provide optional feedback for the developer."
                : "Please explain why the issue is not resolved so the developer can re-investigate."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs my-2">
            <div className="space-y-1">
              <label className="font-semibold">
                {verifyDecision === "YES" ? "Feedback (Optional)" : "Explanation / Reason *"}
              </label>
              <Textarea
                placeholder={verifyDecision === "YES" ? "Works great, thank you!" : "When I click submit, the error still occurs..."}
                value={verifyFeedback}
                onChange={(e) => setVerifyFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setVerifyOpen(false)} disabled={submittingVerify}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={verifyDecision === "YES" ? "default" : "destructive"}
              onClick={() => void handleConfirmResolution()}
              disabled={submittingVerify || (verifyDecision === "NO" && !verifyFeedback.trim())}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox.urls[lightbox.index]} alt="lightbox" className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}
    </>
  );
}
