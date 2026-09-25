import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApiFetch } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, CheckCircle2, Clock, Loader2, MessageSquare, Vote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PollType = "yes_no" | "multiple_choice" | "rating_1_10" | "star_rating" | "open_feedback";

interface PollItem {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: string;
  closesAt?: string | null;
  hasVoted?: boolean;
  myVote?: any;
  options?: Array<{ id: string; label: string }>;
  allowComments?: boolean;
  allowMultipleOptions?: boolean;
  results?: any;
  comments?: Array<{ id: string; userName: string; body: string; createdAt: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  closed: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  implemented: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  scheduled: "bg-sky-500/15 text-sky-600 border-sky-500/30",
};

export default function EmployeePolls() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"active" | "pending" | "closed">("active");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [voteDraft, setVoteDraft] = useState<any>({});
  const [commentText, setCommentText] = useState("");

  const listQuery = useQuery({
    queryKey: ["employee-polls"],
    queryFn: async () => {
      const res = await employeeApiFetch<{ items: PollItem[] }>("/api/polls");
      return res.items || [];
    },
  });

  const detailQuery = useQuery({
    queryKey: ["employee-poll", detailId],
    enabled: Boolean(detailId),
    queryFn: async () => {
      const res = await employeeApiFetch<{ item: PollItem }>(`/api/polls/${detailId}`);
      return res.item;
    },
  });

  const polls = listQuery.data || [];
  const filtered = useMemo(() => {
    if (tab === "active") return polls.filter((p) => p.status === "active");
    if (tab === "pending") return polls.filter((p) => p.status === "active" && !p.hasVoted);
    return polls.filter((p) => ["closed", "implemented", "rejected"].includes(p.status));
  }, [polls, tab]);

  const dash = useMemo(() => {
    const active = polls.filter((p) => p.status === "active").length;
    const pending = polls.filter((p) => p.status === "active" && !p.hasVoted).length;
    const closed = polls.filter((p) => ["closed", "implemented", "rejected"].includes(p.status)).length;
    return { active, pending, closed };
  }, [polls]);

  const submitVote = async () => {
    if (!detailId || !detailQuery.data) return;
    const poll = detailQuery.data;
    try {
      let payload: any = {};
      if (poll.type === "yes_no" || poll.type === "multiple_choice") payload.optionIds = voteDraft.optionIds || [];
      else if (poll.type === "rating_1_10" || poll.type === "star_rating") payload.rating = Number(voteDraft.rating);
      else payload.textAnswer = voteDraft.textAnswer || "";
      await employeeApiFetch(`/api/polls/${detailId}/vote`, { method: "POST", body: JSON.stringify(payload) });
      toast.success("Vote submitted");
      qc.invalidateQueries({ queryKey: ["employee-poll", detailId] });
      qc.invalidateQueries({ queryKey: ["employee-polls"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to vote");
    }
  };

  const submitComment = async () => {
    if (!detailId || !commentText.trim()) return;
    try {
      await employeeApiFetch(`/api/polls/${detailId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });
      setCommentText("");
      toast.success("Comment added");
      qc.invalidateQueries({ queryKey: ["employee-poll", detailId] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to comment");
    }
  };

  const detail = detailQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ideas & Polls</h1>
        <p className="text-sm text-muted-foreground mt-1">Vote on company polls and share your feedback</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: dash.active, icon: Vote },
          { label: "Pending Votes", value: dash.pending, icon: Clock },
          { label: "Closed", value: dash.closed, icon: CheckCircle2 },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <c.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(["active", "pending", "closed"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">
            {t === "pending" ? "Pending Votes" : t}
          </Button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No polls in this tab.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((poll) => (
            <Card key={poll.id} className="cursor-pointer hover:border-primary/40" onClick={() => { setDetailId(poll.id); setVoteDraft({}); }}>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2 mb-1">
                  <Badge className={cn("capitalize border", STATUS_STYLES[poll.status] || "")}>{poll.status}</Badge>
                  {poll.hasVoted && <Badge variant="secondary">Voted</Badge>}
                </div>
                <h3 className="font-semibold">{poll.title}</h3>
                {poll.closesAt && (
                  <p className="text-xs text-muted-foreground mt-1">Closes {new Date(poll.closesAt).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.title || "Poll"}</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading || !detail ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {detail.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.description}</p>}

              {detail.status === "active" && (
                <div className="space-y-3 border rounded-lg p-3">
                  <h4 className="text-sm font-semibold">Your vote</h4>
                  {(detail.type === "yes_no" || detail.type === "multiple_choice") &&
                    (detail.options || []).map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <input
                          type={detail.allowMultipleOptions ? "checkbox" : "radio"}
                          name="emp-poll-opt"
                          checked={(voteDraft.optionIds || detail.myVote?.optionIds || []).map(String).includes(String(opt.id))}
                          onChange={(e) => {
                            if (detail.allowMultipleOptions) {
                              const cur = new Set((voteDraft.optionIds || []).map(String));
                              if (e.target.checked) cur.add(String(opt.id));
                              else cur.delete(String(opt.id));
                              setVoteDraft({ ...voteDraft, optionIds: Array.from(cur) });
                            } else setVoteDraft({ ...voteDraft, optionIds: [opt.id] });
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  {(detail.type === "rating_1_10" || detail.type === "star_rating") && (
                    <Input
                      type="number"
                      min={1}
                      max={detail.type === "star_rating" ? 5 : 10}
                      value={voteDraft.rating ?? detail.myVote?.rating ?? ""}
                      onChange={(e) => setVoteDraft({ ...voteDraft, rating: e.target.value })}
                    />
                  )}
                  {detail.type === "open_feedback" && (
                    <Textarea
                      rows={3}
                      value={voteDraft.textAnswer ?? detail.myVote?.textAnswer ?? ""}
                      onChange={(e) => setVoteDraft({ ...voteDraft, textAnswer: e.target.value })}
                    />
                  )}
                  <Button size="sm" onClick={submitVote}>{detail.myVote ? "Update Vote" : "Submit Vote"}</Button>
                </div>
              )}

              {detail.results && (
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Results</h4>
                  {detail.results.options?.map((o: any) => {
                    const pct = detail.results.voteCount ? Math.round((o.count / detail.results.voteCount) * 100) : 0;
                    return (
                      <div key={o.optionId}>
                        <div className="flex justify-between text-xs mb-1"><span>{o.label}</span><span>{pct}%</span></div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                  {detail.results.average != null && <p className="text-sm">Average: <strong>{detail.results.average}</strong></p>}
                </div>
              )}

              {detail.allowComments !== false && (
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</h4>
                  {(detail.comments || []).map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium">{c.userName}</span>
                      <p className="text-muted-foreground">{c.body}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." />
                    <Button size="sm" onClick={submitComment}>Post</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
