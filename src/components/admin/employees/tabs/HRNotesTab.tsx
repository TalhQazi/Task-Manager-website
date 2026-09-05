import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import {
  Lock,
  Plus,
  ShieldAlert,
  Loader2,
  Calendar,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface HRNotesTabProps {
  employeeId: string;
  employeeName: string;
}

export function HRNotesTab({ employeeId, employeeName }: HRNotesTabProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isConfidential, setIsConfidential] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/hr-notes`);
      setNotes(res.items || []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [employeeId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      await apiFetch(`/api/employees/${employeeId}/hr-notes`, {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          category,
          isConfidential,
        }),
      });

      setContent("");
      fetchNotes();
    } catch (err: any) {
      setError(err?.message || "Failed to create HR note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confidentiality Warning */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Lock className="h-4 w-4 text-amber-400" />
          <span>Internal HR Commentary — Gated to System Administrators & Management only.</span>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
          HR Restricted
        </Badge>
      </div>

      {/* Add New HR Note Form */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Add Confidential Note / Review
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleCreateNote} className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record confidential manager commentary, performance observation, or disciplinary note..."
              className="bg-slate-950 border-slate-700 text-white min-h-[90px] text-xs resize-none"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px] bg-slate-950 border-slate-700 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white text-xs">
                    <SelectItem value="general">General Note</SelectItem>
                    <SelectItem value="performance">Performance Review</SelectItem>
                    <SelectItem value="commendation">Commendation / Praise</SelectItem>
                    <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                    <SelectItem value="compensation">Compensation Review</SelectItem>
                    <SelectItem value="exit">Exit Interview Note</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={isConfidential}
                    onCheckedChange={setIsConfidential}
                    id="confidential-switch"
                  />
                  <label htmlFor="confidential-switch" className="text-xs text-slate-400 cursor-pointer">
                    Confidential
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !content.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium gap-1.5 h-8"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add HR Note
              </Button>
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Notes Journal */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>Loading HR notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            No internal HR notes logged for {employeeName}.
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] uppercase">
                      {note.category}
                    </Badge>
                    {note.isConfidential && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        Confidential
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(note.createdAt).toLocaleDateString()} at{" "}
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  Recorded by: <span className="text-slate-400 font-medium">{note.authorName}</span> ({note.authorRole})
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
