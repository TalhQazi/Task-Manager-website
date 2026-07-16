import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Plus, Pin, Star, AlertCircle, Trash2, Sparkles, History, Loader2,
  FolderPlus, Folder as FolderIcon, X, Check, RotateCcw, BookText, Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/admin/ui/dialog";
import { kvApi, KvNote, KvSuggestion } from "@/lib/knowledgeVault";

type QuickFilter = "all" | "pinned" | "favorite" | "important";
type SearchMode = "text" | "semantic" | "hybrid";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const emptyForm: Partial<KvNote> = {
  title: "", content: "", tags: [], priority: "normal", visibility: "private",
  status: "active", color: "#ffffff", folderId: null,
};

export default function KnowledgeVault() {
  const qc = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [mode, setMode] = useState<SearchMode>("text");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<KvNote | null>(null);
  const [form, setForm] = useState<Partial<KvNote>>(emptyForm);
  const [tagsText, setTagsText] = useState("");

  const [versionsFor, setVersionsFor] = useState<KvNote | null>(null);
  const [suggestions, setSuggestions] = useState<KvSuggestion[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const set = (patch: Partial<KvNote>) => setForm((f) => ({ ...f, ...patch }));

  /* -------------------------------- queries ------------------------------- */
  const foldersQuery = useQuery({
    queryKey: ["kv-folders"],
    queryFn: () => kvApi.listFolders(),
  });

  const notesQuery = useQuery({
    queryKey: ["kv-notes", folderId, quick, search, mode],
    queryFn: async () => {
      if (search.trim()) {
        const res = await kvApi.search(search.trim(), mode);
        return { items: res.items || [], total: (res.items || []).length };
      }
      const params: Record<string, any> = { limit: 100, sort: "updated" };
      if (folderId) params.folderId = folderId;
      if (quick === "pinned") params.pinned = "true";
      if (quick === "favorite") params.favorite = "true";
      if (quick === "important") params.important = "true";
      const res = await kvApi.listNotes(params);
      return { items: res.items || [], total: res.total };
    },
    retry: false,
  });

  const notes = notesQuery.data?.items || [];
  const folders = foldersQuery.data?.items || [];
  const backendOff = notesQuery.isError; // v2 not enabled on the server → 404

  /* ------------------------------- mutations ------------------------------ */
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["kv-notes"] });
    qc.invalidateQueries({ queryKey: ["kv-folders"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<KvNote> = {
        ...form,
        tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editing) return kvApi.updateNote(editing.id, { ...payload, expectedVersion: editing.version });
      return kvApi.createNote(payload);
    },
    onSuccess: () => { toast.success(editing ? "Note updated" : "Note created"); setEditorOpen(false); invalidate(); },
    onError: (e: any) => toast.error(e?.message || "Failed to save note"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => kvApi.deleteNote(id),
    onSuccess: () => { toast.success("Note deleted"); setEditorOpen(false); invalidate(); },
    onError: () => toast.error("Failed to delete note"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, flag, value }: { id: string; flag: "pin" | "favorite" | "important"; value: boolean }) =>
      kvApi.toggle(id, flag, value),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update"),
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => kvApi.analyze(id),
    onSuccess: (res) => { setSuggestions(res.items || []); toast.success(`${res.items?.length || 0} AI suggestions`); },
    onError: () => toast.error("AI analyze failed"),
  });

  const suggestionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      action === "accept" ? kvApi.acceptSuggestion(id) : kvApi.rejectSuggestion(id),
    onSuccess: (_r, v) => {
      setSuggestions((s) => s.filter((x) => x._id !== v.id));
      if (v.action === "accept") { toast.success("Suggestion applied"); invalidate(); }
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: () => kvApi.createFolder({ name: newFolderName.trim() }),
    onSuccess: () => { toast.success("Folder created"); setNewFolderOpen(false); setNewFolderName(""); qc.invalidateQueries({ queryKey: ["kv-folders"] }); },
    onError: () => toast.error("Failed to create folder"),
  });

  const versionsQuery = useQuery({
    queryKey: ["kv-versions", versionsFor?.id],
    queryFn: () => kvApi.versions(versionsFor!.id),
    enabled: !!versionsFor,
  });

  const restoreVersionMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => kvApi.restoreVersion(id, version),
    onSuccess: () => { toast.success("Version restored"); setVersionsFor(null); invalidate(); },
  });

  /* -------------------------------- helpers ------------------------------- */
  const openNew = () => { setEditing(null); setForm(emptyForm); setTagsText(""); setSuggestions([]); setEditorOpen(true); };
  const openEdit = (n: KvNote) => {
    setEditing(n);
    setForm({
      title: n.title, content: n.content || n.body?.plain || "", color: n.color || "#ffffff",
      priority: n.priority || "normal", visibility: n.visibility || "private", status: n.status || "active",
      folderId: n.folderId || null, isPinned: n.isPinned, isFavorite: n.isFavorite, isImportant: n.isImportant,
    });
    setTagsText((n.tags || []).join(", "));
    setSuggestions([]);
    setEditorOpen(true);
  };
  const runSearch = () => setSearch(searchInput);

  const filterButtons: Array<{ key: QuickFilter; label: string; icon: any }> = [
    { key: "all", label: "All Notes", icon: BookText },
    { key: "pinned", label: "Pinned", icon: Pin },
    { key: "favorite", label: "Favorites", icon: Star },
    { key: "important", label: "Important", icon: AlertCircle },
  ];

  /* --------------------------------- view --------------------------------- */
  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="h-7 w-7 text-primary" /> Knowledge Vault
          </h1>
          <p className="text-muted-foreground">AI-ready knowledge — notes, folders, semantic search & suggestions.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New Note</Button>
      </div>

      {backendOff && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Knowledge Vault API is not enabled
          </p>
          <p className="text-amber-700 dark:text-amber-400 mt-1">
            Set <code className="font-mono">KV_V2_ENABLED=true</code> on the backend and run the migrations
            (<code className="font-mono">001_indexes</code>, <code className="font-mono">002_backfill</code>), then reload.
          </p>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar: filters + folders */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto">
          <div className="space-y-1">
            {filterButtons.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setQuick(key); setFolderId(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  quick === key && !folderId ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground/80"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Folders</span>
              <button onClick={() => setNewFolderOpen(true)} className="text-muted-foreground hover:text-primary" title="New folder">
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-0.5">
              {folders.length === 0 && <p className="px-3 text-xs text-muted-foreground">No folders yet</p>}
              {folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => { setFolderId(f._id); setQuick("all"); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    folderId === f._id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground/80"
                  }`}
                >
                  <FolderIcon className="h-4 w-4" /> <span className="truncate">{f.name}</span>
                  {typeof f.noteCount === "number" && <span className="ml-auto text-xs text-muted-foreground">{f.noteCount}</span>}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main: search + note grid */}
        <main className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search knowledge…"
                className="pl-9"
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchInput(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select value={mode} onChange={(e) => setMode(e.target.value as SearchMode)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
              <option value="text">Text</option>
              <option value="semantic">Semantic</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <Button variant="outline" onClick={runSearch}>Search</Button>
          </div>

          {notesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookText className="h-10 w-10 mb-2 opacity-40" />
              <p>{search ? `No results for "${search}"` : "No notes yet — create your first one."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pb-4">
              {notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openEdit(n)}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col gap-2"
                  style={n.color && n.color !== "#ffffff" ? { borderTopColor: n.color, borderTopWidth: 3 } : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{n.title || "Untitled"}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button title="Pin" onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: n.id, flag: "pin", value: !n.isPinned }); }}>
                        <Pin className={`h-3.5 w-3.5 ${n.isPinned ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      </button>
                      <button title="Favorite" onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: n.id, flag: "favorite", value: !n.isFavorite }); }}>
                        <Star className={`h-3.5 w-3.5 ${n.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 min-h-[2.5rem]">
                    {n.ai?.summary || n.content || n.body?.plain || "No content"}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                    {n.priority && n.priority !== "normal" && (
                      <Badge variant="outline" className={PRIORITY_COLORS[n.priority]}>{n.priority}</Badge>
                    )}
                    {(n.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
                    ))}
                    {n.isImportant && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* -------------------------- Editor dialog -------------------------- */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Note" : "New Note"}</DialogTitle>
            <DialogDescription>{editing ? `Version ${editing.version || 1}` : "Add a note to your Knowledge Vault."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Title" value={form.title || ""} onChange={(e) => set({ title: e.target.value })} />
            <textarea
              placeholder="Write your note…"
              value={form.content || ""}
              onChange={(e) => set({ content: e.target.value })}
              className="w-full min-h-[160px] rounded-md border border-border bg-background p-3 text-sm resize-y"
            />
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="tags, comma, separated" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={form.priority} onChange={(e) => set({ priority: e.target.value as KvNote["priority"] })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                {["low", "normal", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={form.visibility} onChange={(e) => set({ visibility: e.target.value as KvNote["visibility"] })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                {["private", "org", "shared", "public"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={form.status} onChange={(e) => set({ status: e.target.value as KvNote["status"] })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                {["draft", "active", "archived", "published"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.folderId || ""} onChange={(e) => set({ folderId: e.target.value || null })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                <option value="">No folder</option>
                {folders.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => set({ isPinned: !form.isPinned })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${form.isPinned ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                <Pin className="h-3.5 w-3.5" /> Pin
              </button>
              <button onClick={() => set({ isFavorite: !form.isFavorite })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${form.isFavorite ? "border-amber-400 text-amber-500 bg-amber-400/10" : "border-border text-muted-foreground"}`}>
                <Star className="h-3.5 w-3.5" /> Favorite
              </button>
              <button onClick={() => set({ isImportant: !form.isImportant })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${form.isImportant ? "border-red-400 text-red-500 bg-red-400/10" : "border-border text-muted-foreground"}`}>
                <AlertCircle className="h-3.5 w-3.5" /> Important
              </button>
              <input type="color" value={form.color || "#ffffff"} onChange={(e) => set({ color: e.target.value })} className="h-8 w-8 rounded border border-border cursor-pointer" title="Card color" />
            </div>

            {/* AI suggestions (only when editing an existing note) */}
            {editing && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</span>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={analyzeMutation.isPending} onClick={() => analyzeMutation.mutate(editing.id)}>
                    {analyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Analyze
                  </Button>
                </div>
                {suggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Run Analyze to get AI tags, summary, keywords & category (you approve each).</p>
                ) : (
                  <div className="space-y-1.5">
                    {suggestions.map((s) => (
                      <div key={s._id} className="flex items-center justify-between gap-2 text-xs bg-background rounded-md px-2 py-1.5 border border-border">
                        <span className="min-w-0">
                          <span className="font-semibold capitalize">{s.type}</span>{" "}
                          <span className="text-muted-foreground">
                            {s.type === "summary" ? s.payload.summary : s.type === "category" ? s.payload.label : (s.payload.tags || s.payload.keywords || []).join(", ")}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <button title="Accept" onClick={() => suggestionMutation.mutate({ id: s._id, action: "accept" })} className="text-emerald-600 hover:bg-emerald-500/10 rounded p-1"><Check className="h-3.5 w-3.5" /></button>
                          <button title="Reject" onClick={() => suggestionMutation.mutate({ id: s._id, action: "reject" })} className="text-red-500 hover:bg-red-500/10 rounded p-1"><X className="h-3.5 w-3.5" /></button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="flex gap-2">
              {editing && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setVersionsFor(editing)}><History className="h-4 w-4" /> Versions</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-red-500 hover:text-red-600" onClick={() => { if (confirm("Delete this note?")) deleteMutation.mutate(editing.id); }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button className="gap-1.5" disabled={saveMutation.isPending || !form.title?.trim()} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------- Versions dialog -------------------------- */}
      <Dialog open={!!versionsFor} onOpenChange={(o) => !o && setVersionsFor(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>{versionsFor?.title}</DialogDescription>
          </DialogHeader>
          {versionsQuery.isLoading ? (
            <div className="py-6 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : (versionsQuery.data?.items || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No versions recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {(versionsQuery.data?.items || []).map((v) => (
                <div key={v._id} className="flex items-center justify-between gap-2 text-sm border border-border rounded-md px-3 py-2">
                  <span>
                    <span className="font-semibold">v{v.version}</span>
                    <span className="text-muted-foreground ml-2">{v.reason || "updated"}</span>
                  </span>
                  <Button size="sm" variant="ghost" className="gap-1 h-7" onClick={() => restoreVersionMutation.mutate({ id: versionsFor!.id, version: v.version })}>
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------- New folder dialog -------------------------- */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <Input autoFocus placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && newFolderName.trim() && createFolderMutation.mutate()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button disabled={!newFolderName.trim() || createFolderMutation.isPending} onClick={() => createFolderMutation.mutate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
