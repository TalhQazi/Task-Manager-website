import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/admin/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Textarea } from "@/components/admin/ui/textarea";
import { Input } from "@/components/admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import { toast } from "@/components/admin/ui/use-toast";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import {
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Flag,
  FileText,
  MessageSquare,
  Paperclip,
  Trash2,
  X,
  Send,
  Loader2,
  Sparkles,
  Check,
  Building,
  Maximize2,
  Download,
  Plus,
  ImageIcon,
} from "lucide-react";

interface AsanaTaskDrawerProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  onOpenFullModal?: () => void;
  employees?: any[];
}

export function AsanaTaskDrawer({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
  onOpenFullModal,
  employees = [],
}: AsanaTaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Attached pictures & files state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "pending");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? String(task.dueDate).split("T")[0] : "");
      setAssignees(Array.isArray(task.assignees) ? task.assignees : []);

      // Extract initial attachments from task prop
      const initialAtts: any[] = [];
      if (Array.isArray(task.attachments) && task.attachments.length > 0) {
        initialAtts.push(...task.attachments);
      } else if (task.attachment && (task.attachment.url || task.attachment.fileName)) {
        initialAtts.push(task.attachment);
      } else if (task.attachmentFileName) {
        initialAtts.push({ fileName: task.attachmentFileName, url: task.attachmentUrl || "", mimeType: "" });
      }
      setAttachments(initialAtts);

      const taskId = task.id || task._id;
      void fetchComments(taskId);
      void fetchAttachments(taskId);
    }
  }, [task?.id, task?._id]);

  const fetchComments = async (taskId: string) => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const res = await apiFetch<{ items?: any[] }>(`/api/tasks/${taskId}/comments`);
      setComments(res.items || []);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchAttachments = async (taskId: string) => {
    if (!taskId) return;
    setLoadingAttachments(true);
    try {
      const res = await apiFetch<{ item?: any }>(`/api/tasks/${taskId}`);
      const item = res.item || {};
      const list: any[] = [];
      if (Array.isArray(item.attachments) && item.attachments.length > 0) {
        list.push(...item.attachments);
      } else if (item.attachment && (item.attachment.url || item.attachment.fileName)) {
        list.push(item.attachment);
      }
      if (list.length > 0) {
        setAttachments(list);
      } else {
        // Try dedicated lazy attachment route if empty
        const attRes = await apiFetch<{ attachment?: any }>(`/api/tasks/${taskId}/attachment`);
        if (attRes.attachment && (attRes.attachment.url || attRes.attachment.fileName)) {
          setAttachments([attRes.attachment]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch task attachments:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUpdate = async (fields: Record<string, any>) => {
    if (!task) return;
    const taskId = task.id || task._id;
    setSaving(true);
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(fields),
      });
      toast({ title: "Task Saved", description: "Property updated successfully." });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast({
        title: "Failed to update task",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !task) return;
    setUploadingAttachment(true);
    try {
      const newAtts = await Promise.all(
        files.map(async (file) => {
          const reader = new FileReader();
          const url = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(String(reader.result || ""));
            reader.readAsDataURL(file);
          });
          return {
            fileName: file.name,
            url,
            mimeType: file.type || "image/png",
            size: file.size,
            uploadedAt: new Date(),
          };
        })
      );
      const updatedAttachments = [...attachments, ...newAtts];
      setAttachments(updatedAttachments);
      await handleUpdate({
        attachments: updatedAttachments,
        attachment: updatedAttachments[0],
        attachmentFileName: updatedAttachments[0]?.fileName || "",
      });
      toast({ title: "Attached", description: `${files.length} picture/file(s) attached to task.` });
    } catch (err) {
      toast({ title: "Attachment upload failed", variant: "destructive" });
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (index: number) => {
    if (!task) return;
    const updated = attachments.filter((_, idx) => idx !== index);
    setAttachments(updated);
    await handleUpdate({
      attachments: updated,
      attachment: updated[0] || null,
      attachmentFileName: updated[0]?.fileName || "",
    });
    toast({ title: "Attachment removed", description: "Attachment has been removed from task." });
  };

  const handleDownloadAttachment = (att: any) => {
    const url = toProxiedUrl(att.url) || att.url;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = att.fileName || "attached-picture";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleToggleComplete = async () => {
    const nextStatus = status === "completed" ? "pending" : "completed";
    setStatus(nextStatus);
    await handleUpdate({ status: nextStatus });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDraft.trim() || !task) return;
    const taskId = task.id || task._id;
    try {
      const res = await apiFetch<{ item: any }>(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: commentDraft.trim() }),
      });
      setCommentDraft("");
      setComments((prev) => [...prev, res.item]);
    } catch (err) {
      toast({ title: "Failed to send comment", variant: "destructive" });
    }
  };

  if (!task) return null;

  const isCompleted = status === "completed";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-card border-l border-border shadow-2xl">
          <SheetHeader className="p-4 sm:p-6 border-b border-border bg-muted/20">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleToggleComplete}
                  disabled={saving}
                  variant={isCompleted ? "default" : "outline"}
                  className={`h-9 px-4 text-xs font-bold gap-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md"
                      : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  <CheckCircle2 className={`h-4 w-4 ${isCompleted ? "text-white" : "text-emerald-500"}`} />
                  <span>{isCompleted ? "✓ Completed" : "Mark Complete"}</span>
                </Button>

                {onOpenFullModal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenFullModal}
                    className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 border-dashed"
                    title="Open full dialog view"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Full View</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Editable Title */}
            <div className="mt-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title !== task.title) handleUpdate({ title: title.trim() });
                }}
                className="text-base sm:text-lg font-bold border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary px-1 h-auto py-1"
              />
              <SheetDescription className="text-xs text-muted-foreground px-1 mt-0.5">
                Task #{task.taskNumber || task.id?.substring(0, 6)} · Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ""}
              </SheetDescription>
            </div>
          </SheetHeader>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Asana Property Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-muted/60 text-xs">
              {/* Assignees */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Assignees
                </span>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {assignees.length > 0 ? (
                    assignees.map((a, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] font-medium gap-1 py-0.5 px-2">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[9px] font-bold uppercase">{a.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{a}</span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> Status
                </span>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    setStatus(val);
                    void handleUpdate({ status: val });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-red-500" /> Priority
                </span>
                <Select
                  value={priority}
                  onValueChange={(val) => {
                    setPriority(val);
                    void handleUpdate({ priority: val });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" /> Due Date
                </span>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    void handleUpdate({ dueDate: e.target.value });
                  }}
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== task.description) handleUpdate({ description });
                }}
                placeholder="Add details, instructions, or notes about this task..."
                rows={4}
                className="text-xs sm:text-sm resize-y leading-relaxed bg-background"
              />
            </div>

            {/* Discussion & Activity Timeline */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" /> Activity & Discussion ({comments.length})
              </label>

              {/* Comment List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {loadingComments ? (
                  <div className="flex items-center justify-center p-4 text-muted-foreground text-xs gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No comments yet. Start the conversation below.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c._id || c.id} className="p-3 rounded-lg bg-muted/20 border border-muted/50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-primary">{c.authorFullName || c.authorUsername || "User"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <p className="text-foreground leading-normal">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Ask a question or leave a update..."
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  className="h-9 text-xs flex-1 bg-background"
                />
                <Button type="submit" disabled={!commentDraft.trim()} size="sm" className="h-9 px-3 gap-1 text-xs">
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </form>
            </div>

            {/* Attached Pictures & Files Section - where the user created the red circle */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" /> Attached Pictures & Files ({attachments.length})
                </label>

                {/* Attach Picture Button */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>{uploadingAttachment ? "Uploading..." : "Attach Picture"}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadingAttachment}
                    className="hidden"
                  />
                </label>
              </div>

              {loadingAttachments ? (
                <div className="flex items-center justify-center p-6 rounded-xl bg-muted/20 border border-muted/50 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading attached pictures...
                </div>
              ) : attachments.length === 0 ? (
                /* Sleek empty state when no picture attached yet */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-muted/15 hover:bg-muted/25 transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">No pictures attached to this task</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Click here to upload or attach a photo / document</p>
                  </div>
                </div>
              ) : (
                /* Attached Pictures & Files Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => {
                    const isImage =
                      att.mimeType?.startsWith("image/") ||
                      att.url?.startsWith("data:image/") ||
                      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.fileName || att.url || "");
                    const proxied = toProxiedUrl(att.url) || att.url;

                    return (
                      <div
                        key={idx}
                        className="group relative rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                      >
                        {/* Thumbnail / Image preview */}
                        {isImage && proxied ? (
                          <div
                            className="h-36 w-full bg-black/40 relative cursor-pointer overflow-hidden flex items-center justify-center"
                            onClick={() => setPreviewImage({ url: proxied, fileName: att.fileName || "Attached Picture" })}
                          >
                            <img
                              src={proxied}
                              alt={att.fileName || "Task Attachment"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                              <span className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white" title="Enlarge Preview">
                                <Maximize2 className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                            <FileText className="h-8 w-8 text-primary/70" />
                            <span className="text-[10px] font-bold uppercase">{att.fileName?.split(".").pop() || "FILE"}</span>
                          </div>
                        )}

                        {/* File Metadata & Actions */}
                        <div className="p-2.5 flex items-center justify-between gap-2 bg-card border-t border-border/60">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate" title={att.fileName}>
                              {att.fileName || "Attachment"}
                            </p>
                            {att.size && (
                              <p className="text-[10px] text-muted-foreground">
                                {(att.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isImage && proxied && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewImage({ url: proxied, fileName: att.fileName || "Attached Picture" })}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="View full picture"
                              >
                                <Maximize2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadAttachment(att)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Download file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAttachment(idx)}
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              title="Delete attachment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Bottom Actions Bar */}
          {onTaskDeleted && (
            <div className="p-3 px-6 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground">Task options</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 transition-colors font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Task</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently remove &quot;{task?.title || "this task"}&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onTaskDeleted}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Full Size Picture Preview Dialog Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-zinc-800 text-white">
          <DialogHeader className="p-3 px-4 border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold truncate text-white">
              {previewImage?.fileName || "Attached Picture"}
            </DialogTitle>
            {previewImage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewImage.url;
                  a.download = previewImage.fileName || "download";
                  a.target = "_blank";
                  a.click();
                }}
                className="h-7 px-2.5 text-xs border-white/20 text-white hover:bg-white/10 gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            )}
          </DialogHeader>
          <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
