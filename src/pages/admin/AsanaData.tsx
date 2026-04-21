import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { AlertCircle, Loader2, User, Calendar, Paperclip, Image, Link as LinkIcon, FileText, ExternalLink, Database, CheckSquare } from "lucide-react";
import { apiFetch, getApiBaseUrl } from "@/lib/admin/apiClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";

type AsanaWorkspace = {
  _id: string;
  asanaId: string;
  name: string;
};

type AsanaProject = {
  _id: string;
  asanaId: string;
  workspaceAsanaId: string;
  name: string;
  createdAtAsana?: string;
  tasksCount?: number;
};

type AsanaTask = {
  _id: string;
  asanaId: string;
  projectAsanaId: string;
  parentAsanaId: string;
  title: string;
  description: string;
  dueDate?: string;
  completed: boolean;
};

type AsanaComment = {
  _id: string;
  asanaId: string;
  taskAsanaId: string;
  authorAsanaId: string;
  authorName?: string;
  authorEmail?: string;
  message: string;
  createdAtAsana?: string;
};

type AsanaAttachment = {
  _id: string;
  asanaId: string;
  taskAsanaId: string;
  fileName: string;
  filePath: string;
  mimeType?: string;
  size?: number;
};

type AsanaUser = {
  _id: string;
  asanaId: string;
  name: string;
  email: string;
};

function isImageMime(mime: string) {
  return !!mime && mime.startsWith("image/");
}

function isLinkAttachment(att: AsanaAttachment) {
  const path = att.filePath || "";
  return path.startsWith("http://") || path.startsWith("https://");
}

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function linkify(text: string) {
  if (!text) return "—";
  
  // URL matching
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // Email matching
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;

  // Split by URL first, then process leftovers for emails
  return text.split(urlRegex).flatMap((part, i) => {
    if (part.match(urlRegex)) {
      return [
        <a 
          key={`url-${i}`} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
        >
          {part} <ExternalLink className="h-3 w-3" />
        </a>
      ];
    }
    
    // Split the remaining text by email regex
    return part.split(emailRegex).map((subpart, j) => {
      if (subpart.match(emailRegex)) {
        return (
          <a 
            key={`email-${i}-${j}`} 
            href={`mailto:${subpart}`} 
            className="text-indigo-600 hover:underline font-medium"
          >
            {subpart}
          </a>
        );
      }
      return subpart;
    });
  });
}

function getFullUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export default function AsanaData() {
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [workspaceAsanaId, setWorkspaceAsanaId] = useState<string>("");

  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [projectAsanaId, setProjectAsanaId] = useState<string>("");

  const [tasks, setTasks] = useState<AsanaTask[]>([]);
  const [selectedTaskAsanaId, setSelectedTaskAsanaId] = useState<string>("");

  const [taskDetails, setTaskDetails] = useState<{ task: AsanaTask; subtasks: AsanaTask[] } | null>(null);
  const [comments, setComments] = useState<AsanaComment[]>([]);
  const [attachments, setAttachments] = useState<AsanaAttachment[]>([]);
  const [users, setUsers] = useState<AsanaUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.asanaId === workspaceAsanaId) || null,
    [workspaces, workspaceAsanaId]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.asanaId === projectAsanaId) || null,
    [projects, projectAsanaId]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.asanaId === selectedTaskAsanaId) || null,
    [tasks, selectedTaskAsanaId]
  );

  // Build user lookup map
  const userMap = useMemo(() => {
    const map = new Map<string, AsanaUser>();
    users.forEach((u) => map.set(u.asanaId, u));
    return map;
  }, [users]);

  const resetBelowWorkspace = () => {
    setProjects([]);
    setProjectAsanaId("");
    resetBelowProject();
  };

  const resetBelowProject = () => {
    setTasks([]);
    setSelectedTaskAsanaId("");
    resetBelowTask();
  };

  const resetBelowTask = () => {
    setTaskDetails(null);
    setComments([]);
    setAttachments([]);
  };

  // Load workspaces and users on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const [wsRes, usersRes] = await Promise.all([
          apiFetch<{ ok: true; items: AsanaWorkspace[] }>("/api/asana-import/workspaces"),
          apiFetch<{ ok: true; items: AsanaUser[] }>("/api/asana-import/users"),
        ]);
        if (!mounted) return;
        setWorkspaces(wsRes.items || []);
        setUsers(usersRes.items || []);

        const first = (wsRes.items || [])[0];
        if (first?.asanaId) {
          setWorkspaceAsanaId(first.asanaId);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load workspaces");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!workspaceAsanaId) return;
    let mounted = true;
    (async () => {
      resetBelowWorkspace();
      setError(null);
      setLoading(true);
      try {
        const res = await apiFetch<{ ok: true; items: AsanaProject[] }>(
          `/api/asana-import/projects?workspaceAsanaId=${encodeURIComponent(workspaceAsanaId)}`
        );
        if (!mounted) return;
        setProjects(res.items || []);
        const first = (res.items || [])[0];
        if (first?.asanaId) {
          setProjectAsanaId(first.asanaId);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load projects");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceAsanaId]);

  useEffect(() => {
    if (!projectAsanaId) return;
    let mounted = true;
    (async () => {
      resetBelowProject();
      setError(null);
      setLoading(true);
      try {
        const res = await apiFetch<{ ok: true; items: AsanaTask[] }>(
          `/api/asana-import/tasks?projectAsanaId=${encodeURIComponent(projectAsanaId)}`
        );
        if (!mounted) return;
        setTasks(res.items || []);
        const first = (res.items || [])[0];
        if (first?.asanaId) {
          setSelectedTaskAsanaId(first.asanaId);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load tasks");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectAsanaId]);

  useEffect(() => {
    if (!selectedTaskAsanaId) return;
    let mounted = true;
    (async () => {
      resetBelowTask();
      setError(null);
      setLoading(true);
      try {
        const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
          apiFetch<{ ok: true; task: AsanaTask; subtasks: AsanaTask[] }>(
            `/api/asana-import/task/${encodeURIComponent(selectedTaskAsanaId)}`
          ),
          apiFetch<{ ok: true; items: AsanaComment[] }>(
            `/api/asana-import/task/${encodeURIComponent(selectedTaskAsanaId)}/comments`
          ),
          apiFetch<{ ok: true; items: AsanaAttachment[] }>(
            `/api/asana-import/task/${encodeURIComponent(selectedTaskAsanaId)}/attachments`
          ),
        ]);

        if (!mounted) return;
        setTaskDetails({ task: taskRes.task, subtasks: taskRes.subtasks || [] });
        setComments(commentsRes.items || []);
        setAttachments(attachmentsRes.items || []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load task details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskAsanaId]);
  const handleTransfer = async () => {
    if (!projectAsanaId) return;
    setError(null);
    setTransferSuccess(null);
    setTransferring(true);
    try {
      const res = await apiFetch<{ ok: true; message: string; stats: { tasks: number; comments: number } }>("/api/asana-import/transfer-project", {
        method: "POST",
        body: JSON.stringify({ projectAsanaId }),
      });
      setTransferSuccess(`${res.message} (${res.stats.tasks} tasks, ${res.stats.comments} comments)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <>
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Imported Asana Data</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            View the imported Asana workspaces, projects, tasks, subtasks, comments and attachments.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-destructive break-words">{error}</p>
          </div>
        )}

        {transferSuccess && (
          <div className="rounded-md bg-green-100 p-3 flex items-start gap-2 border border-green-200">
            <CheckSquare className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-green-800 break-words">{transferSuccess}</p>
          </div>
        )}

        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium">Workspace</label>
                <Select
                  value={workspaceAsanaId}
                  onValueChange={(v) => {
                    setWorkspaceAsanaId(v);
                  }}
                  disabled={loading || workspaces.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.asanaId} value={w.asanaId}>
                        {w.name || w.asanaId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWorkspace && (
                  <p className="text-[11px] text-muted-foreground break-words">Workspace ID: {selectedWorkspace.asanaId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium">Project</label>
                <Select
                  value={projectAsanaId}
                  onValueChange={(v) => setProjectAsanaId(v)}
                  disabled={loading || projects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.asanaId} value={p.asanaId}>
                        {p.name || p.asanaId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProject && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground break-words">
                      Tasks: {selectedProject.tasksCount ?? "—"}
                    </p>
                    {selectedProject.createdAtAsana && (
                      <p className="text-[11px] text-muted-foreground break-words flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created: {formatDate(selectedProject.createdAtAsana)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium">Task</label>
                <Select
                  value={selectedTaskAsanaId}
                  onValueChange={(v) => setSelectedTaskAsanaId(v)}
                  disabled={loading || tasks.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t.asanaId} value={t.asanaId}>
                        {t.title || t.asanaId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTask && (
                  <p className="text-[11px] text-muted-foreground break-words">Completed: {selectedTask.completed ? "Yes" : "No"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (workspaces[0]?.asanaId) setWorkspaceAsanaId(workspaces[0].asanaId);
                  setTransferSuccess(null);
                }}
                disabled={loading || workspaces.length === 0 || transferring}
              >
                Reset
              </Button>

              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                onClick={handleTransfer}
                disabled={loading || !projectAsanaId || transferring}
              >
                {transferring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inserting...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Insert to Task Manager
                  </>
                )}
              </Button>

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-soft border-0 sm:border">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              {!taskDetails ? (
                <p className="text-xs sm:text-sm text-muted-foreground">Select a task to view details.</p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold break-words">{taskDetails.task.title}</p>
                    <p className="text-xs text-muted-foreground break-words">Asana ID: {taskDetails.task.asanaId}</p>
                    <p className="text-xs text-muted-foreground break-words">Due: {taskDetails.task.dueDate || "—"}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      Status: {taskDetails.task.completed ? "Completed" : "Open"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Description</p>
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {linkify(taskDetails.task.description)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Subtasks ({taskDetails.subtasks.length})</p>
                    {taskDetails.subtasks.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                    ) : (
                      <div className="space-y-2">
                        {taskDetails.subtasks.map((st) => (
                          <div key={st.asanaId} className="rounded-md border p-2">
                            <p className="text-xs font-medium break-words">{st.title}</p>
                            <p className="text-[11px] text-muted-foreground break-words">Completed: {st.completed ? "Yes" : "No"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Comments with author info */}
            <Card className="shadow-soft border-0 sm:border">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
                {comments.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const authorUser = c.authorName || userMap.get(c.authorAsanaId)?.name || "";
                      const authorEmailStr = c.authorEmail || userMap.get(c.authorAsanaId)?.email || "";
                      
                      return (
                        <div key={c.asanaId} className="rounded-lg border p-3 space-y-1.5 bg-white/50">
                          {/* Author & Time */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {authorUser && (
                              <div className="flex items-center gap-1.5">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-blue-700">{authorUser}</span>
                                {authorEmailStr && (
                                  <span className="text-[10px] text-muted-foreground">({authorEmailStr})</span>
                                )}
                              </div>
                            )}
                            {c.createdAtAsana && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                                <Calendar className="h-3 w-3" />
                                {formatDate(c.createdAtAsana)}
                              </span>
                            )}
                          </div>
                          {/* Message */}
                          <p className="text-xs sm:text-sm break-words whitespace-pre-wrap">{linkify(c.message)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments with previews */}
            <Card className="shadow-soft border-0 sm:border">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
                  Attachments ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
                {attachments.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((a) => {
                      const isImage = isImageMime(a.mimeType || "");
                      const isLink = isLinkAttachment(a);
                      const hasDownload = !!a.filePath;

                      return (
                        <div key={a.asanaId} className="rounded-lg border overflow-hidden bg-white/50">
                          {/* Image preview */}
                          {isImage && hasDownload && (
                            <div className="bg-gray-50 border-b p-2 flex justify-center">
                              <a href={getFullUrl(a.filePath)} target="_blank" rel="noreferrer">
                                <img
                                  src={getFullUrl(a.filePath)}
                                  alt={a.fileName || "attachment"}
                                  className="max-h-48 max-w-full rounded object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          
                          <div className="p-3 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {/* Icon based on type */}
                              <div className={`rounded-full p-1.5 flex-shrink-0 ${
                                isImage ? "bg-green-100" : isLink ? "bg-blue-100" : "bg-indigo-100"
                              }`}>
                                {isImage ? (
                                  <Image className="h-3.5 w-3.5 text-green-600" />
                                ) : isLink ? (
                                  <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                                ) : a.mimeType?.includes("pdf") ? (
                                  <FileText className="h-3.5 w-3.5 text-red-600" />
                                ) : a.mimeType?.startsWith("video/") ? (
                                  <ExternalLink className="h-3.5 w-3.5 text-orange-600" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium break-words">{a.fileName || "file"}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {a.mimeType && (
                                    <span className="text-[10px] text-muted-foreground">{a.mimeType}</span>
                                  )}
                                  {(a.size || 0) > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {((a.size || 0) / 1024).toFixed(1)} KB
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isLink && (
                                <a
                                  href={getFullUrl(a.filePath)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" /> Open
                                </a>
                              )}
                              {hasDownload && !isLink && (
                                <a
                                  href={getFullUrl(a.filePath)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" /> Download
                                </a>
                              )}
                              {!hasDownload && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
