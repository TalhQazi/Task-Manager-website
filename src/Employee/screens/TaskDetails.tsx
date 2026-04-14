import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, User } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  addTaskComment,
  getTaskById,
  getTaskComments,
  updateTaskStatus,
  employeeApiFetch,
} from "../lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  MessageSquare,
  RefreshCw,
  Save,
  Loader2,
  Calendar,
  Flag,
  FileText,
  AlertCircle,
} from "lucide-react";

type TaskStatus = "pending" | "in-progress" | "completed" | "overdue";

type TaskPriority = "low" | "medium" | "high";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  createdAt?: string;
  attachmentFileName?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number } | null;
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
}

interface TaskCommentItem {
  id: string;
  taskId: string;
  message: string;
  authorUsername: string;
  authorRole: string;
  authorFullName?: string;
  authorAvatar?: string;
  createdAt: string;
  attachments?: Array<{ fileName: string; url: string; mimeType: string }>;
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function renderMessageWithMentions(text: string) {
  if (!text) return null;
  const parts = text.split(/(@\S+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span key={i} className="text-primary font-medium bg-primary/10 px-1 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function CommentAttachmentImg({ taskId, commentId, index, mimeType, fileName, fallbackUrl }: { taskId: string; commentId: string; index: number; mimeType: string; fileName: string; fallbackUrl?: string }) {
  const [src, setSrc] = useState<string | null | undefined>(fallbackUrl || undefined);
  useEffect(() => {
    if (fallbackUrl) return; 
    let cancelled = false;
    employeeApiFetch<{ attachment: { url: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}/attachments/${index}`)
      .then(d => { if (!cancelled) setSrc(d.attachment?.url || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId, commentId, index, fallbackUrl]);
  
  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/att">
      <img src={src} alt={fileName} className="w-full h-full object-cover rounded-lg" />
      <a href={src} download={fileName} aria-label="Download" onClick={(e) => e.stopPropagation()} className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold backdrop-blur-[1px]">
        Save
      </a>
    </div>
  );
  if (src && !mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/att">
      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-white/10">
        <FileText className="w-6 h-6 text-white/60 mb-1" />
        <span className="text-[10px] text-white/40 truncate w-full px-2 font-medium">{fileName}</span>
      </div>
      <a href={src} download={fileName} aria-label="Download" onClick={(e) => e.stopPropagation()} className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold backdrop-blur-[1px]">
        Save
      </a>
    </div>
  );
  if (src === undefined) return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><Loader2 className="h-4 w-4 animate-spin opacity-20" /></div>;
  return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><AlertCircle className="w-5 h-5 text-destructive/50" /></div>;
}

export default function EmployeeTaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDraft, setStatusDraft] = useState<TaskStatus>("pending");

  const [comments, setComments] = useState<TaskCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentUsername = getAuthState().username || "";
  const { socket, joinTask, leaveTask } = useSocket();

  const priorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const canDownloadAttachment = Boolean(task?.attachment?.url);

  const downloadAttachment = () => {
    if (!task?.attachment?.url) return;
    const a = document.createElement("a");
    a.href = task.attachment.url;
    a.download = task.attachment.fileName || task.attachmentFileName || "attachment";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const loadTask = async () => {
    if (!taskId) return;
    try {
      const res = await getTaskById(taskId);
      const item = res.item as any;
      const mapped: TaskItem = {
        id: String(item.id),
        title: String(item.title || ""),
        description: String(item.description || ""),
        status: (String(item.status || "pending") as TaskStatus) || "pending",
        priority: (String(item.priority || "medium") as TaskPriority) || "medium",
        dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
        dueTime: item.dueTime ? String(item.dueTime) : "",
        createdAt: item.createdAt ? String(item.createdAt) : "",
        attachmentFileName: item.attachmentFileName ? String(item.attachmentFileName) : "",
        attachment: item.attachment || null,
        attachments: Array.isArray(item.attachments) ? item.attachments : undefined,
      };

      setTask(mapped);
      setStatusDraft(mapped.status);
    } catch (err: any) {
      console.error("Failed to load task:", err);
      toast.error(err?.message || "Failed to load task");
    }
  };

  const loadComments = async () => {
    if (!taskId) return;
    setCommentsLoading(true);
    try {
      const res = await getTaskComments(taskId);
      setComments(res.items as any);
    } catch (err: any) {
      console.error("Failed to load comments:", err);
      toast.error(err?.message || "Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadTask(), loadComments()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (!socket || !taskId) return;
    joinTask(taskId);
    
    const handleNewComment = (comment: any) => {
      setComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    };

    const handleTyping = ({ username, typing, taskId: tId }: { username: string; typing: boolean; taskId?: string }) => {
      if (username === currentUsername) return;
      if (tId !== taskId) return;
      setOthersTyping(prev => {
        if (typing) return prev.includes(username) ? prev : [...prev, username];
        return prev.filter(u => u !== username);
      });
    };

    socket.on("new-comment", handleNewComment);
    socket.on("user-typing", handleTyping);

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.off("user-typing", handleTyping);
      leaveTask(taskId);
    };
  }, [socket, taskId, currentUsername]);

  const handleTypingIndicator = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentDraft(e.target.value);
    if (!socket || !taskId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { taskId, typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { taskId, typing: false });
    }, 3000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTask(), loadComments()]);
    } finally {
      setRefreshing(false);
    }
  };

  const onUpdateStatus = async () => {
    if (!taskId) return;
    setStatusUpdating(true);
    try {
      await updateTaskStatus(taskId, statusDraft);
      toast.success("Status updated");
      await loadTask();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const onSendComment = async () => {
    if (!taskId) return;
    const msg = commentDraft.trim();
    if (!msg) return;

    setCommentSending(true);
    try {
      await addTaskComment(taskId, msg);
      setCommentDraft("");
      toast.success("Comment sent");
      await loadComments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send comment");
    } finally {
      setCommentSending(false);
    }
  };

  const headerBadges = useMemo(() => {
    if (!task) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusColor(task.status)}>{task.status.replace("-", " ")}</Badge>
        <Badge className={priorityColor(task.priority)}>{task.priority}</Badge>
      </div>
    );
  }, [task]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#133767]" />
            Loading task...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Task not found.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/employee/tasks")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {headerBadges}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due: {task.dueDate || "—"} {task.dueTime ? `(${task.dueTime})` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flag className="h-4 w-4" />
              <span>Created: {task.createdAt || "—"}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as TaskStatus)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                onClick={onUpdateStatus}
                disabled={statusUpdating}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                {statusUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={downloadAttachment}
                disabled={!canDownloadAttachment}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Attachment
              </Button>
            </div>
          </div>

          {task.attachments && task.attachments.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Attachments ({task.attachments.length})</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {task.attachments.map((att, idx) => (
                  att.mimeType?.startsWith("image/") ? (
                    <a key={idx} href={att.url} download={att.fileName} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={att.url} alt={att.fileName} className="w-full h-20 object-cover rounded-md border" />
                      <span className="text-xs text-muted-foreground truncate block mt-1">{att.fileName}</span>
                    </a>
                  ) : (
                    <a key={idx} href={att.url} download={att.fileName} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-20 border rounded-md bg-muted/30 hover:bg-muted text-xs text-center p-2 gap-1">
                      <Download className="h-5 w-5 text-muted-foreground" />
                      <span className="truncate w-full">{att.fileName}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          ) : task.attachmentFileName ? (
            <div className="text-xs text-muted-foreground">File: {task.attachmentFileName}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col flex-1 min-h-[500px] h-full bg-muted/5 rounded-2xl border border-border/40 overflow-hidden shadow-inner">
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto p-4 space-y-1.5 scroll-smooth custom-scrollbar"
            >
              {commentsLoading && comments.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No activity here yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {comments.map((c, idx) => {
                    const isMe = c.authorUsername === currentUsername;
                    const prevComment = idx > 0 ? comments[idx - 1] : null;
                    const isSameAuthor = prevComment?.authorUsername === c.authorUsername;
                    const showSenderName = !isMe && !isSameAuthor;
                    
                    return (
                      <div 
                        key={c.id} 
                        className={cn(
                          "flex flex-col group",
                          isMe ? "items-end" : "items-start",
                          !isSameAuthor && idx !== 0 ? "mt-4" : "mt-0"
                        )}
                      >
                        {showSenderName && (
                          <span className="chat-sender-name ml-10">
                            {c.authorUsername}
                          </span>
                        )}
                        
                        <div className={cn(
                          "flex items-end gap-2 max-w-[85%] w-fit",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                          {!isMe && (
                            <div className="w-8 flex-shrink-0">
                              {!isSameAuthor ? (
                                <Avatar className="w-8 h-8 border shadow-sm flex-shrink-0 mb-1">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {c.authorUsername.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null}
                            </div>
                          )}
                          
                          <div className={cn(
                            "flex flex-col group/bubble relative min-w-0",
                            isMe ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "chat-bubble",
                              isMe ? "chat-bubble-me" : "chat-bubble-others"
                            )}>
                              <div className="whitespace-pre-wrap break-words overflow-hidden leading-snug">
                                {renderMessageWithMentions(c.message)}
                              </div>
                              
                              {c.attachments && c.attachments.length > 0 && (
                                <div className={cn(
                                  "grid gap-2 mt-2",
                                  c.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                )}>
                                  {c.attachments.map((att, attIdx) => (
                                    <div key={attIdx} className="relative rounded-xl overflow-hidden border border-white/20 bg-black/10 min-w-[120px] max-w-full aspect-square sm:aspect-video">
                                      <CommentAttachmentImg 
                                        taskId={taskId || task?.id || ""} 
                                        commentId={c.id} 
                                        index={attIdx} 
                                        mimeType={att.mimeType} 
                                        fileName={att.fileName} 
                                        fallbackUrl={att.url} 
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className={cn(
                              "chat-timestamp",
                              isMe ? "text-right mr-1" : "text-left ml-1"
                            )}>
                              {formatMessageTime(c.createdAt)}
                            </div>
                          </div>
                          
                          {isMe && (
                            <div className="flex flex-col justify-end pb-5 opacity-40">
                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {othersTyping.length > 0 && (
                    <div className="flex items-center gap-2 max-w-[85%] self-start pt-2">
                      <div className="typing-indicator scale-75 origin-left">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 italic font-medium">
                        {othersTyping.join(", ")} typing...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentDraft}
              onChange={handleTypingIndicator}
              className="rounded-xl border-2 border-border/50 focus-visible:ring-primary/20 transition-all min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={onSendComment}
                disabled={commentSending || !commentDraft.trim()}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                {commentSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
