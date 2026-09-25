import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Label } from "@/components/admin/ui/label";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Plus,
  Search,
  BarChart3,
  CheckCircle2,
  Clock,
  Vote,
  Archive,
  Copy,
  XCircle,
  Send,
  Loader2,
  MessageSquare,
  Gavel,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PollType = "yes_no" | "multiple_choice" | "rating_1_10" | "star_rating" | "open_feedback";
export type PollStatus = "draft" | "scheduled" | "active" | "closed" | "implemented" | "rejected" | "archived";

export interface PollItem {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  targetSummary?: string;
  voteCount?: number;
  audienceCount?: number;
  commentCount?: number;
  closesAt?: string | null;
  scheduledAt?: string | null;
  creatorName?: string;
  options?: Array<{ id: string; label: string; sortOrder?: number }>;
  audiences?: Array<{ id?: string; targetType: string; targetId?: string; targetLabel?: string }>;
  myVote?: any;
  hasVoted?: boolean;
  results?: any;
  comments?: Array<{ id: string; userName: string; body: string; createdAt: string }>;
  decisions?: Array<{ id: string; decision: string; notes: string; decidedByName: string; decidedAt: string }>;
  allowComments?: boolean;
  allowEditUntilDeadline?: boolean;
  allowMultipleOptions?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  implemented: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const TYPE_LABELS: Record<PollType, string> = {
  yes_no: "Yes / No",
  multiple_choice: "Multiple Choice",
  rating_1_10: "1–10 Rating",
  star_rating: "Star Rating",
  open_feedback: "Open Feedback",
};

const emptyForm = {
  title: "",
  description: "",
  type: "yes_no" as PollType,
  optionsText: "Yes\nNo",
  closesAt: "",
  scheduledAt: "",
  allowEditUntilDeadline: true,
  allowComments: true,
  allowMultipleOptions: false,
  showResultsBeforeClose: false,
  sendInApp: true,
  sendEmail: true,
  audienceType: "global",
  audienceValue: "",
  publishNow: true,
};

export default function AdminPolls() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionType, setDecisionType] = useState<"implemented" | "rejected" | "deferred">("implemented");
  const [voteDraft, setVoteDraft] = useState<any>({});

  const dashQuery = useQuery({
    queryKey: ["polls-dashboard"],
    queryFn: async () => {
      const res = await apiFetch<{ item: any }>("/api/polls/dashboard");
      return res.item;
    },
  });

  const listQuery = useQuery({
    queryKey: ["polls", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await apiFetch<{ items: PollItem[] }>(`/api/polls?${params.toString()}`);
      return res.items || [];
    },
  });

  const detailQuery = useQuery({
    queryKey: ["poll", detailId],
    enabled: Boolean(detailId),
    queryFn: async () => {
      const res = await apiFetch<{ item: PollItem }>(`/api/polls/${detailId}`);
      return res.item;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const lines = form.optionsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const options =
        form.type === "yes_no" || form.type === "multiple_choice"
          ? lines.map((label, i) => ({ label, sortOrder: i }))
          : [];
      const audiences =
        form.audienceType === "global"
          ? [{ targetType: "global", targetId: "", targetLabel: "Everyone" }]
          : [
              {
                targetType: form.audienceType,
                targetId: form.audienceValue.trim(),
                targetLabel: form.audienceValue.trim() || form.audienceType,
              },
            ];
      return apiFetch("/api/polls", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          options,
          audiences,
          closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          allowEditUntilDeadline: form.allowEditUntilDeadline,
          allowComments: form.allowComments,
          allowMultipleOptions: form.allowMultipleOptions,
          showResultsBeforeClose: form.showResultsBeforeClose,
          sendInApp: form.sendInApp,
          sendEmail: form.sendEmail,
          publishNow: form.publishNow && !form.scheduledAt,
          status: form.scheduledAt ? "scheduled" : form.publishNow ? "active" : "draft",
        }),
      });
    },
    onSuccess: () => {
      toast.success("Poll created");
      setCreateOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["polls-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create poll"),
  });

  const runAction = async (id: string, action: string, body?: any) => {
    try {
      await apiFetch(`/api/polls/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(body || {}),
      });
      toast.success(`Poll ${action} successful`);
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["polls-dashboard"] });
      if (detailId) qc.invalidateQueries({ queryKey: ["poll", detailId] });
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action}`);
    }
  };

  const submitVote = async () => {
    if (!detailId || !detailQuery.data) return;
    const poll = detailQuery.data;
    try {
      let payload: any = {};
      if (poll.type === "yes_no" || poll.type === "multiple_choice") {
        payload.optionIds = voteDraft.optionIds || [];
      } else if (poll.type === "rating_1_10" || poll.type === "star_rating") {
        payload.rating = Number(voteDraft.rating);
      } else {
        payload.textAnswer = voteDraft.textAnswer || "";
      }
      await apiFetch(`/api/polls/${detailId}/vote`, { method: "POST", body: JSON.stringify(payload) });
      toast.success("Vote submitted");
      qc.invalidateQueries({ queryKey: ["poll", detailId] });
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["polls-dashboard"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to vote");
    }
  };

  const submitComment = async () => {
    if (!detailId || !commentText.trim()) return;
    try {
      await apiFetch(`/api/polls/${detailId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });
      setCommentText("");
      toast.success("Comment added");
      qc.invalidateQueries({ queryKey: ["poll", detailId] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to comment");
    }
  };

  const submitDecision = async () => {
    if (!detailId) return;
    try {
      await apiFetch(`/api/polls/${detailId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision: decisionType, notes: decisionNotes }),
      });
      toast.success("Decision recorded");
      setDecisionNotes("");
      qc.invalidateQueries({ queryKey: ["poll", detailId] });
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["polls-dashboard"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to record decision");
    }
  };

  const polls = listQuery.data || [];
  const dash = dashQuery.data || {};
  const detail = detailQuery.data;

  const cards = useMemo(
    () => [
      { label: "Active Polls", value: dash.activePolls ?? 0, icon: Vote, color: "text-emerald-400" },
      { label: "Closed Polls", value: dash.closedPolls ?? 0, icon: CheckCircle2, color: "text-amber-400" },
      { label: "Participation", value: `${dash.participationRate ?? 0}%`, icon: BarChart3, color: "text-sky-400" },
      { label: "Pending Votes", value: dash.pendingVotes ?? 0, icon: Clock, color: "text-violet-400" },
    ],
    [dash]
  );

  return (
    <div className="pl-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ideas & Polls</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create company polls, collect votes, and track executive decisions
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/50 bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <c.icon className={cn("h-6 w-6", c.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {(dash.recentDecisions || []).length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4" /> Recent Decisions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dash.recentDecisions || []).slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-sm border-b border-border/40 py-2 last:border-0">
                <span className="font-medium truncate mr-3">{d.pollTitle || "Poll"}</span>
                <Badge className={cn("capitalize border", STATUS_STYLES[d.decision] || STATUS_STYLES.closed)}>
                  {d.decision}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search polls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.keys(STATUS_STYLES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading polls...
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No polls yet. Create one to collect feedback across the company.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <button className="text-left min-w-0 flex-1" onClick={() => setDetailId(poll.id)}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className={cn("capitalize border", STATUS_STYLES[poll.status])}>{poll.status}</Badge>
                    <Badge variant="outline">{TYPE_LABELS[poll.type]}</Badge>
                    {poll.hasVoted && <Badge variant="secondary">Voted</Badge>}
                  </div>
                  <h3 className="font-semibold text-base truncate">{poll.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {poll.targetSummary || "Everyone"} · {poll.voteCount || 0} votes
                    {poll.closesAt ? ` · closes ${new Date(poll.closesAt).toLocaleString()}` : ""}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  {poll.status === "draft" || poll.status === "scheduled" ? (
                    <Button size="sm" variant="outline" onClick={() => runAction(poll.id, "publish")}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Publish
                    </Button>
                  ) : null}
                  {poll.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => runAction(poll.id, "close")}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Close
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => runAction(poll.id, "duplicate")}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => runAction(poll.id, "archive")}>
                    <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as PollType;
                  setForm({
                    ...form,
                    type,
                    optionsText: type === "yes_no" ? "Yes\nNo" : type === "multiple_choice" ? "Option A\nOption B\nOption C" : form.optionsText,
                  });
                }}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {(form.type === "yes_no" || form.type === "multiple_choice") && (
              <div className="space-y-1.5">
                <Label>Options (one per line)</Label>
                <Textarea value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} rows={4} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Schedule (optional)</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Closes at (optional)</Label>
                <Input type="datetime-local" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.audienceType}
                onChange={(e) => setForm({ ...form, audienceType: e.target.value })}
              >
                <option value="global">Everyone</option>
                <option value="department">Department</option>
                <option value="location">Location</option>
                <option value="role">Role</option>
                <option value="company">Company</option>
                <option value="user">Individual (email/name)</option>
              </select>
              {form.audienceType !== "global" && (
                <Input
                  className="mt-2"
                  placeholder="Enter target value"
                  value={form.audienceValue}
                  onChange={(e) => setForm({ ...form, audienceValue: e.target.value })}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.publishNow} onChange={(e) => setForm({ ...form, publishNow: e.target.checked })} />
                Publish now
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} />
                Email notify
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.allowComments} onChange={(e) => setForm({ ...form, allowComments: e.target.checked })} />
                Allow comments
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.allowEditUntilDeadline} onChange={(e) => setForm({ ...form, allowEditUntilDeadline: e.target.checked })} />
                Edit vote until deadline
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.title || "Poll"}</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading || !detail ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("capitalize border", STATUS_STYLES[detail.status])}>{detail.status}</Badge>
                <Badge variant="outline">{TYPE_LABELS[detail.type]}</Badge>
                <span className="text-xs text-muted-foreground self-center">{detail.targetSummary}</span>
              </div>
              {detail.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.description}</p>}

              {/* Vote controls */}
              {detail.status === "active" && (
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Cast your vote</h4>
                  {(detail.type === "yes_no" || detail.type === "multiple_choice") && (
                    <div className="space-y-2">
                      {(detail.options || []).map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 text-sm">
                          <input
                            type={detail.allowMultipleOptions ? "checkbox" : "radio"}
                            name="poll-opt"
                            checked={(voteDraft.optionIds || detail.myVote?.optionIds || []).map(String).includes(String(opt.id))}
                            onChange={(e) => {
                              if (detail.allowMultipleOptions) {
                                const cur = new Set((voteDraft.optionIds || []).map(String));
                                if (e.target.checked) cur.add(String(opt.id));
                                else cur.delete(String(opt.id));
                                setVoteDraft({ ...voteDraft, optionIds: Array.from(cur) });
                              } else {
                                setVoteDraft({ ...voteDraft, optionIds: [opt.id] });
                              }
                            }}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                  {(detail.type === "rating_1_10" || detail.type === "star_rating") && (
                    <Input
                      type="number"
                      min={1}
                      max={detail.type === "star_rating" ? 5 : 10}
                      value={voteDraft.rating ?? detail.myVote?.rating ?? ""}
                      onChange={(e) => setVoteDraft({ ...voteDraft, rating: e.target.value })}
                      placeholder={detail.type === "star_rating" ? "1–5 stars" : "1–10"}
                    />
                  )}
                  {detail.type === "open_feedback" && (
                    <Textarea
                      rows={3}
                      value={voteDraft.textAnswer ?? detail.myVote?.textAnswer ?? ""}
                      onChange={(e) => setVoteDraft({ ...voteDraft, textAnswer: e.target.value })}
                      placeholder="Share your feedback..."
                    />
                  )}
                  <Button size="sm" onClick={submitVote}>{detail.myVote ? "Update Vote" : "Submit Vote"}</Button>
                </div>
              )}

              {/* Results */}
              {detail.results && (
                <div className="rounded-lg border border-border/60 p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Results</h4>
                  <p className="text-xs text-muted-foreground">
                    {detail.results.voteCount} votes · {detail.results.participationRate}% participation
                  </p>
                  {detail.results.options && (
                    <div className="space-y-2">
                      {detail.results.options.map((o: any) => {
                        const pct = detail.results.voteCount ? Math.round((o.count / detail.results.voteCount) * 100) : 0;
                        return (
                          <div key={o.optionId}>
                            <div className="flex justify-between text-xs mb-1"><span>{o.label}</span><span>{o.count} ({pct}%)</span></div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {detail.results.average != null && (
                    <p className="text-sm">Average: <strong>{detail.results.average}</strong></p>
                  )}
                  {detail.results.responses && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detail.results.responses.map((r: any, i: number) => (
                        <div key={i} className="text-xs border-b border-border/40 pb-2">
                          <span className="font-medium">{r.userName}: </span>{r.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              {detail.allowComments !== false && (
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(detail.comments || []).length === 0 && <p className="text-xs text-muted-foreground">No comments yet</p>}
                    {(detail.comments || []).map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-medium">{c.userName}</span>
                        <span className="text-muted-foreground text-xs ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                        <p className="text-muted-foreground">{c.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." />
                    <Button size="sm" onClick={submitComment}>Post</Button>
                  </div>
                </div>
              )}

              {/* Decision */}
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2"><Gavel className="h-4 w-4" /> Executive Decision</h4>
                {(detail.decisions || []).map((d) => (
                  <div key={d.id} className="text-sm">
                    <Badge className={cn("capitalize border mr-2", STATUS_STYLES[d.decision] || "")}>{d.decision}</Badge>
                    by {d.decidedByName} — {d.notes || "No notes"}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value as any)}
                  >
                    <option value="implemented">Implemented</option>
                    <option value="rejected">Rejected</option>
                    <option value="deferred">Deferred</option>
                  </select>
                  <Input value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} placeholder="Decision notes" />
                  <Button size="sm" onClick={submitDecision}>Record</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
