import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addTaskComment,
  getTaskById,
  getTaskComments,
  updateTaskStatus,
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
  attachments?: Array<{ fileName?: string; url?: string; mimeType?: string; size?: number }>;
}

interface TaskCommentItem {
  id: string;
  taskId: string;
  message: string;
  authorUsername: string;
  authorRole: string;
  createdAt: string;
}

function formatDateTime(v?: string) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  } catch {
    return v;
  }
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

  const downloadFromUrl = (url: string, fileName?: string) => {
    const cleanUrl = String(url || "").trim();
    if (!cleanUrl) return;
    const a = document.createElement("a");
    a.href = cleanUrl;
    if (fileName) a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const canDownloadAttachment = Boolean(task?.attachment?.url);

  const downloadAttachment = () => {
    if (!task?.attachment?.url) return;
    downloadFromUrl(task.attachment.url, task.attachment.fileName || task.attachmentFileName || "attachment");
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

  const normalizedAttachments = useMemo(() => {
    if (!task) return [] as Array<{ fileName?: string; url?: string; mimeType?: string; size?: number }>;
    if (Array.isArray(task.attachments) && task.attachments.length > 0) return task.attachments;
    if (task.attachment?.url) return [task.attachment];
    return [];
  }, [task]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading task...
        </div>
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
          <CardTitle className="text-base">Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Attachments</p>
                {canDownloadAttachment ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAttachment}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                ) : null}
              </div>

              {normalizedAttachments.length > 0 ? (
                <div className="space-y-2">
                  {normalizedAttachments.map((att, idx) => {
                    const fileName = att.fileName || `attachment-${idx + 1}`;
                    const url = String(att.url || "").trim();
                    const canDownload = Boolean(url);
                    return (
                      <div
                        key={`${fileName}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-md border p-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium break-words">{fileName}</p>
                          {att.size ? (
                            <p className="text-xs text-muted-foreground">{Math.round(att.size / 1024)} KB</p>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 flex-shrink-0"
                          disabled={!canDownload}
                          onClick={() => {
                            if (!url) return;
                            downloadFromUrl(url, fileName);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : task.attachmentFileName ? (
                <p className="text-xs text-muted-foreground break-words">{task.attachmentFileName}</p>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
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
          <div className="space-y-3">
            {commentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{c.authorUsername || "User"}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.message}</div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
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
