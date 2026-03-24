import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await apiFetch<{ ok: true; items: AsanaWorkspace[] }>("/api/asana-import/workspaces");
        if (!mounted) return;
        setWorkspaces(res.items || []);

        const first = (res.items || [])[0];
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

  return (
    <>
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
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
                  <p className="text-[11px] text-muted-foreground break-words">
                    Tasks: {selectedProject.tasksCount ?? "—"}
                  </p>
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
                }}
                disabled={loading || workspaces.length === 0}
              >
                Reset
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
                      {taskDetails.task.description || "—"}
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
            <Card className="shadow-soft border-0 sm:border">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
                {comments.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div key={c.asanaId} className="rounded-md border p-2">
                        <p className="text-[11px] text-muted-foreground break-words">{c.createdAtAsana || ""}</p>
                        <p className="text-xs sm:text-sm break-words whitespace-pre-wrap">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-0 sm:border">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
                {attachments.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((a) => (
                      <div key={a.asanaId} className="rounded-md border p-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium break-words">{a.fileName || "file"}</p>
                          <p className="text-[11px] text-muted-foreground break-words">{a.mimeType || ""}</p>
                        </div>
                        {a.filePath ? (
                          <a
                            href={a.filePath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline text-accent whitespace-nowrap"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    ))}
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
