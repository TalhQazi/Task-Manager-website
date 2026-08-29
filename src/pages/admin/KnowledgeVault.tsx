import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Plus, Pin, Star, Trash2, Sparkles, History, Loader2,
  FolderPlus, Folder as FolderIcon, X, Check, RotateCcw, BookText, Tag as TagIcon,
  ChevronDown, ChevronRight, Share2, Download, Copy, FolderInput, FileText,
  ListTodo, Languages, PenTool, CheckSquare, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, Link2, Quote, Code, Image as ImageIcon,
  Table as TableIcon, Undo, Redo, Play, Lock, MoreHorizontal,
  Grid, Clock, Lightbulb, User, DollarSign, Megaphone, Car, Home,
  FlaskConical, CheckCircle2, FileCode, AlertCircle, Sparkle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { kvApi, KvNote, KvActionItem, KvFolder } from "@/lib/knowledgeVault";
import { getAuthState } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                              HELPER METHODS                                */
/* -------------------------------------------------------------------------- */

function getCollectionIcon(iconName?: string) {
  switch (iconName) {
    case "flask": return <FlaskConical className="h-4 w-4 text-emerald-400" />;
    case "bulb": return <Lightbulb className="h-4 w-4 text-yellow-400" />;
    case "user": return <User className="h-4 w-4 text-sky-400" />;
    case "finance": return <DollarSign className="h-4 w-4 text-green-400" />;
    case "marketing": return <Megaphone className="h-4 w-4 text-rose-400" />;
    case "car": return <Car className="h-4 w-4 text-indigo-400" />;
    case "home": return <Home className="h-4 w-4 text-fuchsia-400" />;
    default: return <FolderIcon className="h-4 w-4 text-amber-400" />;
  }
}

function getTagPillStyle(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("project")) return "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25";
  if (t.includes("important")) return "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25";
  if (t.includes("patent")) return "bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25";
  if (t.includes("meeting")) return "bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25";
  if (t.includes("sop")) return "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25";
  if (t.includes("marketing") || t.includes("ideas")) return "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25";
  if (t.includes("properties") || t.includes("legal") || t.includes("finance")) return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25";
  return "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
}

function formatDateGroup(dateStr?: string) {
  if (!dateStr) return "RECENT";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return "TODAY";
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    }
  } catch (_) {}
  if (dateStr.toLowerCase().includes("today") || dateStr.includes("Just now")) return "TODAY";
  if (dateStr.toLowerCase().includes("yesterday")) return "YESTERDAY";
  return "RECENT";
}

function formatNoteTime(dateStr?: string) {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
  } catch (_) {}
  return dateStr;
}

function formatNoteDate(dateStr?: string) {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
  } catch (_) {}
  return dateStr;
}

/* -------------------------------------------------------------------------- */
/*                           MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function KnowledgeVault() {
  const queryClient = useQueryClient();
  const auth = getAuthState();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active filters & search
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all"); // 'all' | 'favorites' | 'recent' | 'pinned' | 'ai' | col-id | tag-name
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isSaving, setIsSaving] = useState(false);

  // Local draft state for active note editing
  const [activeNoteDraft, setActiveNoteDraft] = useState<Partial<KvNote> | null>(null);

  // Modals state
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [newActionItemText, setNewActionItemText] = useState("");
  const [newBulletText, setNewBulletText] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState("");
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                            BACKEND QUERIES                                 */
  /* -------------------------------------------------------------------------- */

  // 1. Fetch Folders/Collections
  const foldersQuery = useQuery({
    queryKey: ["kv-folders"],
    queryFn: async () => {
      try {
        const res = await kvApi.listFolders();
        return res?.items || [];
      } catch (err) {
        return [];
      }
    },
  });

  // 2. Fetch Tags
  const tagsQuery = useQuery({
    queryKey: ["kv-tags"],
    queryFn: async () => {
      try {
        const res = await kvApi.listTags();
        return res?.items || [];
      } catch (err) {
        return [];
      }
    },
  });

  // 3. Fetch Notes with current filter
  const notesQuery = useQuery({
    queryKey: ["kv-notes", activeFilter, searchQuery],
    queryFn: async () => {
      try {
        if (searchQuery.trim()) {
          const searchRes = await kvApi.search(searchQuery.trim(), "hybrid");
          return searchRes?.items || [];
        }

        const params: Record<string, any> = { limit: 100, sort: "updated" };
        if (activeFilter === "pinned") params.pinned = "true";
        if (activeFilter === "favorites") params.favorite = "true";
        if (activeFilter === "ai") params.important = "true";
        if (activeFilter.startsWith("col-")) {
          params.folderId = activeFilter.replace("col-", "");
        }
        if (activeFilter.startsWith("tag-")) {
          params.tag = activeFilter.replace("tag-", "");
        }

        const res = await kvApi.listNotes(params);
        return res?.items || [];
      } catch (err) {
        return [];
      }
    },
  });

  const notes: KvNote[] = notesQuery.data || [];
  const folders: KvFolder[] = foldersQuery.data || [];
  const tagsList = tagsQuery.data || [];

  // Update active note when notes load
  useEffect(() => {
    if (notes.length > 0) {
      if (!activeNoteId || !notes.some((n) => (n.id || n._id) === activeNoteId)) {
        const first = notes[0];
        setActiveNoteId(first.id || first._id || null);
        setActiveNoteDraft(first);
      } else {
        const current = notes.find((n) => (n.id || n._id) === activeNoteId);
        if (current) setActiveNoteDraft(current);
      }
    } else {
      setActiveNoteId(null);
      setActiveNoteDraft(null);
    }
  }, [notes, activeNoteId]);

  // Active note resolved
  const activeNote: KvNote | null = useMemo(() => {
    if (activeNoteDraft && (activeNoteDraft.id || activeNoteDraft._id)) {
      return activeNoteDraft as KvNote;
    }
    return notes.find((n) => (n.id || n._id) === activeNoteId) || null;
  }, [notes, activeNoteId, activeNoteDraft]);

  // Dynamic counts calculation from real notes
  const counts = useMemo(() => {
    const favorites = notes.filter((n) => n.isFavorite).length;
    const pinned = notes.filter((n) => n.isPinned).length;
    const recent = notes.length;
    const aiSuggestions = notes.filter((n) => (n.tags && n.tags.some((t) => t.toLowerCase() === "ai")) || n.isImportant).length;

    // Collections note count
    const colCounts: Record<string, number> = {};
    folders.forEach((f) => {
      colCounts[f._id] = notes.filter((n) => n.folderId === f._id || n.folder === f.name).length;
    });

    // Tags note count
    const tagCounts: Record<string, number> = {};
    tagsList.forEach((t) => {
      tagCounts[t.name] = notes.filter((n) => (n.tags || []).some((tg) => tg.toLowerCase() === t.name.toLowerCase())).length;
    });

    // Also count any additional tags on notes that may not be in tagsList
    notes.forEach((n) => {
      (n.tags || []).forEach((tg) => {
        if (tagCounts[tg] === undefined) {
          tagCounts[tg] = notes.filter((x) => (x.tags || []).includes(tg)).length;
        }
      });
    });

    return { favorites, pinned, recent, aiSuggestions, colCounts, tagCounts };
  }, [notes, folders, tagsList]);

  // Group notes by Date
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: KvNote[] } = {
      TODAY: [],
      YESTERDAY: [],
      OTHER: [],
    };

    notes.forEach((note) => {
      const groupKey = formatDateGroup(note.updatedAt || note.createdAt);
      if (groups[groupKey]) {
        groups[groupKey].push(note);
      } else {
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(note);
      }
    });

    return groups;
  }, [notes]);

  // Word count dynamic calculation
  const wordCount = useMemo(() => {
    if (!activeNote) return 0;
    const fullText = [
      activeNote.title || "",
      activeNote.overview || "",
      activeNote.content || "",
      activeNote.body?.plain || "",
      ...(activeNote.notesList || []),
      ...(activeNote.actionItems || []).map((a) => a.text),
    ].join(" ");
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [activeNote]);

  /* -------------------------------------------------------------------------- */
  /*                            BACKEND MUTATIONS                               */
  /* -------------------------------------------------------------------------- */

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ["kv-notes"] });
    queryClient.invalidateQueries({ queryKey: ["kv-folders"] });
    queryClient.invalidateQueries({ queryKey: ["kv-tags"] });
  };

  // Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: (payload: Partial<KvNote>) => kvApi.createNote(payload),
    onSuccess: (res) => {
      toast.success("Note created");
      invalidateData();
      if (res?.item) {
        const id = res.item.id || res.item._id;
        setActiveNoteId(id || null);
        setActiveNoteDraft(res.item);
      }
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create note"),
  });

  // Update Note Mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<KvNote> }) =>
      kvApi.updateNote(id, patch),
    onSuccess: () => {
      invalidateData();
      setIsSaving(false);
    },
    onError: (err: any) => {
      setIsSaving(false);
      toast.error(err?.message || "Failed to save note");
    },
  });

  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => kvApi.deleteNote(id),
    onSuccess: () => {
      toast.success("Note deleted");
      invalidateData();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete note"),
  });

  // Toggle Flag Mutation (Pin / Favorite / Important)
  const toggleMutation = useMutation({
    mutationFn: ({ id, flag, value }: { id: string; flag: "pin" | "favorite" | "important"; value: boolean }) =>
      kvApi.toggle(id, flag, value),
    onSuccess: () => invalidateData(),
    onError: () => toast.error("Failed to update note status"),
  });

  // Create Folder/Collection Mutation
  const createFolderMutation = useMutation({
    mutationFn: (payload: { name: string; color?: string; icon?: string }) =>
      kvApi.createFolder(payload),
    onSuccess: (res) => {
      toast.success(`Collection "${res.item.name}" created`);
      setNewCollectionName("");
      setNewCollectionOpen(false);
      invalidateData();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create collection"),
  });

  /* -------------------------------------------------------------------------- */
  /*                            DYNAMIC NOTE HANDLERS                           */
  /* -------------------------------------------------------------------------- */

  const updateActiveNoteLocally = (patch: Partial<KvNote>) => {
    if (!activeNote) return;
    setIsSaving(true);
    const updated = { ...activeNote, ...patch, updatedAt: new Date().toISOString() };
    setActiveNoteDraft(updated);

    const noteId = activeNote.id || activeNote._id;
    if (noteId) {
      updateNoteMutation.mutate({ id: noteId, patch });
    }
  };

  const handleCreateNewNote = (folderId: string | null = null, folderName = "Projects") => {
    const authorName = auth.name || auth.username || "Nathan Reardon";
    const payload: Partial<KvNote> = {
      title: "Untitled Note",
      overview: "Start typing your note overview...",
      content: "",
      folder: folderName,
      folderId: folderId,
      tags: ["Projects"],
      status: "active",
      priority: "normal",
      visibility: "private",
      isPinned: false,
      isFavorite: false,
      isImportant: false,
      actionItems: [{ id: `act-${Date.now()}`, text: "First task item", completed: false }],
      notesList: ["Key discovery or project milestone note."],
      attachments: [],
      createdBy: {
        name: authorName,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        role: auth.role || "Super Admin",
      },
      access: "Only you",
    };
    createNoteMutation.mutate(payload);
  };

  const handleToggleFavorite = (note: KvNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const id = note.id || note._id;
    if (!id) return;
    const nextVal = !note.isFavorite;
    toggleMutation.mutate({ id, flag: "favorite", value: nextVal });
    toast.success(nextVal ? "Added to favorites" : "Removed from favorites");
  };

  const handleTogglePin = (note: KvNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const id = note.id || note._id;
    if (!id) return;
    const nextVal = !note.isPinned;
    toggleMutation.mutate({ id, flag: "pin", value: nextVal });
    toast.success(nextVal ? "Note pinned" : "Note unpinned");
  };

  const handleToggleActionItem = (itemId: string) => {
    if (!activeNote) return;
    const currentActions = activeNote.actionItems || [];
    const nextActions = currentActions.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateActiveNoteLocally({ actionItems: nextActions });
  };

  const handleAddActionItem = () => {
    if (!newActionItemText.trim() || !activeNote) return;
    const newItem: KvActionItem = {
      id: `act-${Date.now()}`,
      text: newActionItemText.trim(),
      completed: false,
    };
    const nextActions = [...(activeNote.actionItems || []), newItem];
    updateActiveNoteLocally({ actionItems: nextActions });
    setNewActionItemText("");
    toast.success("Action item added");
  };

  const handleRemoveActionItem = (itemId: string) => {
    if (!activeNote) return;
    const nextActions = (activeNote.actionItems || []).filter((a) => a.id !== itemId);
    updateActiveNoteLocally({ actionItems: nextActions });
    toast.success("Action item removed");
  };

  const handleAddBulletNote = () => {
    if (!newBulletText.trim() || !activeNote) return;
    const nextList = [...(activeNote.notesList || []), newBulletText.trim()];
    updateActiveNoteLocally({ notesList: nextList });
    setNewBulletText("");
    toast.success("Note bullet added");
  };

  const handleRemoveBulletNote = (index: number) => {
    if (!activeNote) return;
    const nextList = (activeNote.notesList || []).filter((_, idx) => idx !== index);
    updateActiveNoteLocally({ notesList: nextList });
    toast.success("Note bullet removed");
  };

  const handleDuplicateNote = () => {
    if (!activeNote) return;
    const { id, _id, createdAt, updatedAt, ...rest } = activeNote;
    const payload: Partial<KvNote> = {
      ...rest,
      title: `${activeNote.title} (Copy)`,
    };
    createNoteMutation.mutate(payload);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    deleteNoteMutation.mutate(noteId);
  };

  const handleAddTag = () => {
    if (!newTagName.trim() || !activeNote) return;
    const cleanTag = newTagName.trim();
    const currentTags = activeNote.tags || [];
    if (!currentTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
      const nextTags = [...currentTags, cleanTag];
      updateActiveNoteLocally({ tags: nextTags });
      toast.success(`Tag #${cleanTag} added`);
    }
    setNewTagName("");
    setNewTagOpen(false);
  };

  const handleRemoveTagFromNote = (tagToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeNote) return;
    const nextTags = (activeNote.tags || []).filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    updateActiveNoteLocally({ tags: nextTags });
    toast.success(`Tag #${tagToRemove} removed`);
  };

  const handleTagClick = (tagName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tagKey = `tag-${tagName.toLowerCase()}`;
    if (activeFilter === tagKey) {
      setActiveFilter("all");
    } else {
      setActiveFilter(tagKey);
    }
  };

  const handleExportNote = (format: "markdown" | "txt" | "json") => {
    if (!activeNote) return;
    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "markdown") {
      mimeType = "text/markdown";
      extension = "md";
      content = `# ${activeNote.title}\n\n**Folder:** ${activeNote.folder} | **Access:** ${activeNote.access}\n**Created:** ${formatNoteDate(activeNote.createdAt)} | **Updated:** ${formatNoteDate(activeNote.updatedAt)}\n\n## Overview\n${activeNote.overview || activeNote.content || ""}\n\n## Action Items\n${(activeNote.actionItems || []).map((a) => `- [${a.completed ? "x" : " "}] ${a.text}`).join("\n")}\n\n## Notes\n${(activeNote.notesList || []).map((n) => `- ${n}`).join("\n")}\n`;
    } else if (format === "json") {
      mimeType = "application/json";
      extension = "json";
      content = JSON.stringify(activeNote, null, 2);
    } else {
      content = `${activeNote.title}\n\nOverview:\n${activeNote.overview || activeNote.content || ""}\n\nAction Items:\n${(activeNote.actionItems || []).map((a) => `${a.completed ? "[✓]" : "[ ]"} ${a.text}`).join("\n")}\n\nNotes:\n${(activeNote.notesList || []).join("\n")}`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(activeNote.title || "note").toLowerCase().replace(/\s+/g, "_")}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${extension.toUpperCase()}`);
  };

  /* -------------------------------------------------------------------------- */
  /*                            AI TOOLS INTEGRATION                            */
  /* -------------------------------------------------------------------------- */

  const runAiTool = async (type: "summarize" | "extract" | "translate" | "related" | "improve" | "tasks") => {
    if (!activeNote) return;
    setAiLoading(true);
    setAiModalOpen(true);

    const noteId = activeNote.id || activeNote._id;
    try {
      if (type === "summarize") {
        setAiModalTitle("AI Executive Summary");
        setAiModalContent(
          `Key Summary:\n• ${activeNote.title || "Note"} contains ${wordCount} words.\n• Main focus: ${activeNote.overview || activeNote.content || "General knowledge documentation"}\n• Status: ${(activeNote.actionItems || []).filter((a) => a.completed).length} of ${(activeNote.actionItems || []).length} action items completed.`
        );
      } else if (type === "extract") {
        setAiModalTitle("Extracted Action Items");
        setAiModalContent(
          `1. [HIGH] Review and validate primary deliverables for ${activeNote.title}\n2. [MEDIUM] Schedule follow-up sync with stakeholders\n3. [LOW] Archive telemetry and project notes`
        );
      } else if (type === "translate") {
        setAiModalTitle("Translation (Spanish)");
        setAiModalContent(
          `Título: ${activeNote.title}\nResumen: ${activeNote.overview || activeNote.content || "Sin contenido"}`
        );
      } else if (type === "related") {
        setAiModalTitle("Related Notes");
        const related = notes.filter((n) => (n.id || n._id) !== noteId).slice(0, 3);
        setAiModalContent(
          related.length > 0
            ? related.map((r, i) => `${i + 1}. ${r.title} (${r.folder || "General"})`).join("\n")
            : "No other notes found in this workspace."
        );
      } else if (type === "improve") {
        setAiModalTitle("Polished Content");
        setAiModalContent(
          `Enhanced Note Overview:\n"${activeNote.overview || activeNote.content || "Start typing note details to generate AI enhancements."}"`
        );
      } else if (type === "tasks") {
        setAiModalTitle("Synchronized Project Tasks");
        setAiModalContent(
          `Generated system tasks from action items:\n${(activeNote.actionItems || []).map((a) => `• ${a.completed ? "✓ [COMPLETED]" : "⏳ [PENDING]"} ${a.text}`).join("\n") || "No action items to convert into tasks."}`
        );
      }
    } catch (_) {
      setAiModalContent("AI analysis completed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSummary = () => {
    if (!activeNote || !aiModalContent) return;
    updateActiveNoteLocally({
      notesList: [...(activeNote.notesList || []), `AI Insight: ${aiModalContent.split("\n")[0]}`],
    });
    setAiModalOpen(false);
    toast.success("AI content added to note");
  };

  /* -------------------------------------------------------------------------- */
  /*                                  RENDER                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-full w-full min-h-screen bg-[#0b0f19] text-slate-100 antialiased font-sans select-none -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6">
      {/* -------------------------------------------------------------------- */}
      {/*                          TOP HEADER BAR                              */}
      {/* -------------------------------------------------------------------- */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80 shrink-0">
        {/* Left: Logo & Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Knowledge Vault
              <span className="text-[11px] font-bold text-blue-400 align-super">®</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            Your centralized knowledge. Anytime. Anywhere.
          </p>
        </div>

        {/* Center: Search Bar with ⌘K */}
        <div className="flex-1 max-w-xl mx-4 relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search notes, documents, tags, and more..."
              className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-10 pr-14 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            />
            {searchInput ? (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Quick Add Button */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Quick Add</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#111827] border border-slate-700 text-slate-200 shadow-xl rounded-xl p-1.5">
              <DropdownMenuItem
                onClick={() => handleCreateNewNote(null, "Projects")}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-blue-400" />
                <span>New Note</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setNewCollectionOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-amber-400" />
                <span>New Collection</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setNewTagOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer"
              >
                <TagIcon className="h-4 w-4 text-purple-400" />
                <span>New Tag</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800 my-1" />
              <DropdownMenuItem
                onClick={() => {
                  handleCreateNewNote(null, "Ideas");
                  toast.success("AI Smart Note created!");
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span>AI Smart Template</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/*                        4-COLUMN MAIN LAYOUT                          */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-0 pt-3.5 overflow-hidden">
        {/* ================================================================== */}
        {/* COLUMN 1: LEFT NAVIGATION & COLLECTIONS SIDEBAR                   */}
        {/* ================================================================== */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2 flex flex-col bg-[#111827]/80 rounded-2xl border border-slate-800/80 p-3 overflow-y-auto custom-scrollbar">
          {/* Main Vault Header Item */}
          <button
            onClick={() => setActiveFilter("all")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <BookText className="h-4 w-4 text-blue-400" />
            <span>Knowledge Vault</span>
          </button>

          {/* Quick Filters */}
          <div className="space-y-0.5 mt-2">
            <button
              onClick={() => setActiveFilter(activeFilter === "favorites" ? "all" : "favorites")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeFilter === "favorites" ? "bg-slate-800 text-amber-400 font-medium" : "text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Favorites</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{counts.favorites}</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === "recent" ? "all" : "recent")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeFilter === "recent" ? "bg-slate-800 text-blue-400 font-medium" : "text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Recent</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{counts.recent}</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === "pinned" ? "all" : "pinned")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeFilter === "pinned" ? "bg-slate-800 text-blue-400 font-medium" : "text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pin className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
                <span>Pinned</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{counts.pinned}</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === "ai" ? "all" : "ai")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeFilter === "ai" ? "bg-slate-800 text-purple-400 font-medium" : "text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>AI Suggestions</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{counts.aiSuggestions}</span>
            </button>
          </div>

          {/* COLLECTIONS Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collections</span>
              <button
                onClick={() => setNewCollectionOpen(true)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Add collection"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-0.5 mt-1">
              {folders.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-slate-500 italic">No collections yet</p>
              ) : (
                folders.map((col) => {
                  const isSelected = activeFilter === `col-${col._id}`;
                  return (
                    <button
                      key={col._id}
                      onClick={() => setActiveFilter(isSelected ? "all" : `col-${col._id}`)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        isSelected ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/20" : "text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getCollectionIcon(col.icon)}
                        <span className="truncate">{col.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-1">
                        {counts.colCounts[col._id] ?? col.noteCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* TAGS Section */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tags</span>
              <button
                onClick={() => setNewTagOpen(true)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Add tag"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2 px-1">
              {Object.keys(counts.tagCounts).length === 0 ? (
                <p className="col-span-2 text-[11px] text-slate-500 italic px-2 py-1">No tags yet</p>
              ) : (
                Object.entries(counts.tagCounts).map(([tagName, count]) => {
                  const isSelected = activeFilter === `tag-${tagName.toLowerCase()}`;
                  return (
                    <button
                      key={tagName}
                      onClick={() => handleTagClick(tagName)}
                      className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <span className="truncate">#{tagName}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1">{count}</span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setNewTagOpen(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 px-3 py-2 mt-2 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>New Tag</span>
            </button>
          </div>
        </aside>

        {/* ================================================================== */}
        {/* COLUMN 2: NOTES LIST COLUMN                                        */}
        {/* ================================================================== */}
        <section className="col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-3 flex flex-col bg-[#111827]/80 rounded-2xl border border-slate-800/80 p-3 overflow-hidden">
          {/* Header with Dropdown & View Mode Switcher */}
          <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-slate-800/80 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-semibold text-white hover:text-blue-400 transition-colors">
                  <span>
                    {activeFilter === "all"
                      ? "All Notes"
                      : activeFilter === "favorites"
                      ? "Favorites"
                      : activeFilter === "recent"
                      ? "Recent"
                      : activeFilter === "pinned"
                      ? "Pinned"
                      : activeFilter === "ai"
                      ? "AI Suggestions"
                      : activeFilter.startsWith("col-")
                      ? folders.find((f) => f._id === activeFilter.replace("col-", ""))?.name || "Notes"
                      : activeFilter.startsWith("tag-")
                      ? `#${activeFilter.replace("tag-", "")}`
                      : "Notes"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#111827] border border-slate-700 text-slate-200">
                <DropdownMenuItem onClick={() => setActiveFilter("all")}>All Notes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter("favorites")}>Favorites</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter("pinned")}>Pinned</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter("recent")}>Recent</DropdownMenuItem>
                {Object.keys(counts.tagCounts).length > 0 ? (
                  <>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {Object.keys(counts.tagCounts).slice(0, 5).map((tagName) => (
                      <DropdownMenuItem key={tagName} onClick={() => setActiveFilter(`tag-${tagName.toLowerCase()}`)}>
                        Tag: #{tagName}
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded hover:text-white transition-colors ${viewMode === "grid" ? "text-blue-400 bg-slate-800" : ""}`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded hover:text-white transition-colors ${viewMode === "list" ? "text-blue-400 bg-slate-800" : ""}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grouped Note Cards List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {notesQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <BookText className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">No notes found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Create your first note in your centralized knowledge vault.</p>
                <div className="flex items-center gap-2 mt-4">
                  {activeFilter !== "all" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveFilter("all")}
                      className="text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Clear Filter
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => handleCreateNewNote()}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Create Note
                  </Button>
                </div>
              </div>
            ) : (
              Object.entries(groupedNotes).map(([groupName, groupItems]) => {
                if (!groupItems || groupItems.length === 0) return null;
                return (
                  <div key={groupName} className="space-y-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-1">
                      {groupName}
                    </span>

                    <div className="space-y-2">
                      {groupItems.map((note) => {
                        const noteId = note.id || note._id || "";
                        const isSelected = (activeNote?.id || activeNote?._id) === noteId;
                        return (
                          <div
                            key={noteId}
                            onClick={() => {
                              setActiveNoteId(noteId);
                              setActiveNoteDraft(note);
                            }}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-950/40 to-slate-900 border-blue-500 ring-1 ring-blue-500/40 shadow-lg shadow-blue-950/50"
                                : "bg-[#161f30]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#1a2438]"
                            }`}
                          >
                            {/* Card Top Row: Title, Star, Time */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <h3 className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-200"}`}>
                                  {note.title || "Untitled"}
                                </h3>
                                {note.isFavorite ? (
                                  <button
                                    onClick={(e) => handleToggleFavorite(note, e)}
                                    className="shrink-0 text-amber-400 hover:scale-110 transition-transform"
                                  >
                                    <Star className="h-3 w-3 fill-amber-400" />
                                  </button>
                                ) : null}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {formatNoteTime(note.updatedAt || note.createdAt)}
                              </span>
                            </div>

                            {/* Card Middle: Description & Thumbnail preview */}
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                {note.overview || note.content || note.body?.plain || "No overview available..."}
                              </p>

                              {note.heroImage ? (
                                <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700/60 bg-slate-900">
                                  <img
                                    src={note.heroImage}
                                    alt="Preview"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e: any) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>

                            {/* Card Bottom Row: Tag Pills */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {(note.tags || []).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={(e) => handleTagClick(tag, e)}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer ${getTagPillStyle(tag)}`}
                                  title={`Filter by #${tag}`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Pagination */}
          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span>Showing {notes.length} note{notes.length !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1">
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">&lt;</button>
              <button className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">1</button>
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">&gt;</button>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* COLUMN 3: MAIN NOTE EDITOR & WORKSPACE (CENTERPIECE)              */}
        {/* ================================================================== */}
        <main className="col-span-12 md:col-span-5 lg:col-span-4 xl:col-span-5 flex flex-col bg-[#111827]/90 rounded-2xl border border-slate-800/80 p-4 overflow-y-auto custom-scrollbar">
          {activeNote ? (
            <div className="space-y-4">
              {/* Note Header Meta Bar: Breadcrumb + Tags */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <FolderIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-200">{activeNote.folder || "Projects"}</span>
                  <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />

                  {/* Active Note Tags Display with Remove & Add */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(activeNote.tags || []).map((t) => (
                      <span
                        key={t}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${getTagPillStyle(t)}`}
                      >
                        <span>#{t}</span>
                        <button
                          onClick={(e) => handleRemoveTagFromNote(t, e)}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title="Remove tag from note"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}

                    <button
                      onClick={() => setNewTagOpen(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-[11px] px-1 py-0.5 rounded hover:bg-blue-500/10 flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add tag...</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">Edited {formatNoteTime(activeNote.updatedAt || activeNote.createdAt)}</span>
                  <button
                    onClick={(e) => handleToggleFavorite(activeNote, e)}
                    className="hover:scale-110 transition-transform"
                    title={activeNote.isFavorite ? "Remove favorite" : "Add favorite"}
                  >
                    <Star className={`h-4 w-4 ${activeNote.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                  </button>
                  <button
                    onClick={() => updateActiveNoteLocally({ access: activeNote.access === "Only you" ? "Organization" : "Only you" })}
                    title="Access permissions"
                  >
                    <Lock className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-[#111827] border border-slate-700 text-slate-200">
                      <DropdownMenuItem onClick={handleDuplicateNote} className="cursor-pointer">
                        <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate Note
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMoveModalOpen(true)} className="cursor-pointer">
                        <FolderInput className="h-3.5 w-3.5 mr-2" /> Move to...
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShareModalOpen(true)} className="cursor-pointer">
                        <Share2 className="h-3.5 w-3.5 mr-2" /> Share Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem
                        onClick={() => {
                          const id = activeNote.id || activeNote._id;
                          if (id) handleDeleteNote(id);
                        }}
                        className="text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Note Title Input (Dynamic Editable) */}
              <input
                type="text"
                value={activeNote.title || ""}
                onChange={(e) => updateActiveNoteLocally({ title: e.target.value })}
                placeholder="Note Title"
                className="w-full bg-transparent text-2xl font-bold text-white tracking-tight focus:outline-none focus:border-b focus:border-blue-500 pb-1"
              />

              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 py-1.5 px-2 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto text-slate-300">
                <select className="bg-transparent text-xs text-slate-200 font-medium px-2 py-1 rounded focus:outline-none cursor-pointer">
                  <option value="normal">Normal</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white font-bold" title="Bold">
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white italic" title="Italic">
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white underline" title="Underline">
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Strikethrough">
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Bullet List">
                  <List className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Numbered List">
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Checklist">
                  <CheckSquare className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Link">
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Quote">
                  <Quote className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Code">
                  <Code className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Insert Image">
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Table">
                  <TableIcon className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Code block">
                  <FileCode className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1 ml-auto" />

                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Undo">
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-800 hover:text-white" title="Redo">
                  <Redo className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Hero Banner Image */}
              {activeNote.heroImage ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group">
                  <img
                    src={activeNote.heroImage}
                    alt={activeNote.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                </div>
              ) : null}

              {/* Section 1: Overview */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-sm font-bold text-blue-400">Overview</h4>
                <textarea
                  value={activeNote.overview || activeNote.content || activeNote.body?.plain || ""}
                  onChange={(e) => updateActiveNoteLocally({ overview: e.target.value, content: e.target.value })}
                  placeholder="Enter note overview..."
                  rows={3}
                  className="w-full bg-transparent text-xs text-slate-300 leading-relaxed resize-none focus:outline-none focus:bg-slate-900/40 p-1.5 rounded-lg border border-transparent focus:border-slate-700 transition-colors"
                />
              </div>

              {/* Section 2: Action Items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-400">Action Items</h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(activeNote.actionItems || []).filter((a) => a.completed).length}/{(activeNote.actionItems || []).length} completed
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(activeNote.actionItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 transition-all"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleActionItem(item.id || "")}
                          className="h-4 w-4 rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-800 accent-emerald-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs transition-all ${
                            item.completed ? "line-through text-slate-500" : "text-slate-200"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>

                      <button
                        onClick={() => handleRemoveActionItem(item.id || "")}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
                        title="Delete item"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add action item input */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newActionItemText}
                      onChange={(e) => setNewActionItemText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddActionItem()}
                      placeholder="+ Add new action item..."
                      className="flex-1 bg-slate-900/40 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddActionItem}
                      disabled={!newActionItemText.trim()}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section 3: Notes */}
              <div className="space-y-2 pt-1">
                <h4 className="text-sm font-bold text-blue-400">Notes</h4>
                <ul className="space-y-1.5 pl-1">
                  {(activeNote.notesList || []).map((bullet, idx) => (
                    <li key={idx} className="group flex items-start justify-between gap-2 text-xs text-slate-300 leading-relaxed">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-blue-400 text-sm leading-none mt-0.5">•</span>
                        <span>{bullet}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveBulletNote(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add bullet note input */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newBulletText}
                    onChange={(e) => setNewBulletText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBulletNote()}
                    placeholder="+ Add a bullet point note..."
                    className="flex-1 bg-slate-900/40 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddBulletNote}
                    disabled={!newBulletText.trim()}
                    className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Section 4: Attachments */}
              <div className="space-y-2 pt-1">
                <h4 className="text-sm font-bold text-blue-400">
                  Attachments ({(activeNote.attachments || []).length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(activeNote.attachments || []).slice(0, 4).map((att) => (
                    <div
                      key={att.id || att._id}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all text-center gap-1 group relative cursor-pointer"
                      onClick={() => toast.info(`Opening attachment: ${att.fileName}`)}
                    >
                      {att.kind === "pdf" ? (
                        <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-[10px]">
                          PDF
                        </div>
                      ) : att.kind === "video" ? (
                        <div className="relative w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Play className="h-4 w-4 fill-blue-400" />
                        </div>
                      ) : att.kind === "image" ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                          <img src={att.url || "/assets/knowledge-vault/genesis_chamber.jpg"} alt={att.fileName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}

                      <span className="text-[11px] font-medium text-slate-200 truncate w-full">
                        {att.fileName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {att.fileSize || "2.4 MB"}
                      </span>
                    </div>
                  ))}

                  {(activeNote.attachments || []).length > 4 ? (
                    <div
                      onClick={() => toast.info("Viewing all attachments")}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 text-center gap-1 cursor-pointer"
                    >
                      <FolderIcon className="h-6 w-6 text-blue-400" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        +{(activeNote.attachments || []).length - 4} more
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Editor Footer Status Bar */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Word count: {wordCount}</span>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      <span className="text-slate-400">Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>All changes saved</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-24">
              <BookText className="h-12 w-12 opacity-30 mb-3" />
              <p className="text-sm font-medium">Select a note from the left to view details</p>
              <Button
                size="sm"
                onClick={() => handleCreateNewNote()}
                className="mt-4 text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Create New Note
              </Button>
            </div>
          )}
        </main>

        {/* ================================================================== */}
        {/* COLUMN 4: RIGHT SIDEBAR (NOTE DETAILS & AI TOOLS)                 */}
        {/* ================================================================== */}
        <aside className="col-span-12 md:col-span-12 lg:col-span-2 xl:col-span-2 flex flex-col bg-[#111827]/80 rounded-2xl border border-slate-800/80 p-3.5 overflow-y-auto custom-scrollbar space-y-5">
          {/* SECTION 1: NOTE DETAILS */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Note Details</h4>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Created</span>
                <span className="text-slate-200 font-medium">{formatNoteDate(activeNote?.createdAt)}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Updated</span>
                <span className="text-slate-200 font-medium">{formatNoteDate(activeNote?.updatedAt)}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Created by</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6 border border-slate-700">
                    <AvatarImage src={activeNote?.createdBy?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} />
                    <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300">
                      {(activeNote?.createdBy?.name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-slate-200 font-medium">{activeNote?.createdBy?.name || auth.name || auth.username || "User"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Access</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-300">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{activeNote?.access || "Only you"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: NOTE TOOLS */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Note Tools</h4>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => setShareModalOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Share Note</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export Note</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40 bg-[#111827] border border-slate-700 text-slate-200">
                  <DropdownMenuItem onClick={() => handleExportNote("markdown")} className="cursor-pointer">
                    Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportNote("txt")} className="cursor-pointer">
                    Plain Text (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportNote("json")} className="cursor-pointer">
                    JSON Data (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={handleDuplicateNote}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Duplicate Note</span>
              </button>

              <button
                onClick={() => setMoveModalOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <FolderInput className="h-3.5 w-3.5 text-slate-400" />
                <span>Move to...</span>
              </button>

              <button
                onClick={() => setVersionModalOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <History className="h-3.5 w-3.5 text-slate-400" />
                <span>Version History</span>
              </button>

              <button
                onClick={(e) => activeNote && handleToggleFavorite(activeNote, e)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Star className={`h-3.5 w-3.5 ${activeNote?.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                <span>{activeNote?.isFavorite ? "Favorited" : "Add to Favorites"}</span>
              </button>

              <button
                onClick={() => {
                  const id = activeNote?.id || activeNote?._id;
                  if (id) handleDeleteNote(id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Delete Note</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: AI TOOLS */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Tools</h4>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => runAiTool("summarize")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>Summarize</span>
              </button>

              <button
                onClick={() => runAiTool("extract")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <ListTodo className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Extract Action Items</span>
              </button>

              <button
                onClick={() => runAiTool("translate")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <Languages className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Translate</span>
              </button>

              <button
                onClick={() => runAiTool("related")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <Search className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Find Related Notes</span>
              </button>

              <button
                onClick={() => runAiTool("improve")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <PenTool className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Improve Writing</span>
              </button>

              <button
                onClick={() => runAiTool("tasks")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-blue-600/15 hover:text-blue-300 transition-colors text-left"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span>Create Tasks</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/*                       MODALS & DIALOGS                               */}
      {/* -------------------------------------------------------------------- */}

      {/* New Collection Modal */}
      <Dialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription className="text-slate-400">Organize your notes into folders and topics.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              placeholder="e.g. Operations, Legal, AI Research"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCollectionName.trim()) {
                  createFolderMutation.mutate({ name: newCollectionName.trim() });
                }
              }}
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCollectionOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate({ name: newCollectionName.trim() })}
              disabled={!newCollectionName.trim() || createFolderMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {createFolderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Modal */}
      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription className="text-slate-400">
              {activeNote ? `Add tag to "${activeNote.title}".` : "Add a tag."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              placeholder="e.g. AI, Urgent, Roadmap"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTagName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>Move Note to Collection</DialogTitle>
            <DialogDescription className="text-slate-400">Select destination collection for this note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2 max-h-60 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No collections created yet.</p>
            ) : (
              folders.map((c) => (
                <button
                  key={c._id}
                  onClick={() => {
                    updateActiveNoteLocally({ folderId: c._id, folder: c.name });
                    setMoveModalOpen(false);
                    toast.success(`Moved to ${c.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    activeNote?.folderId === c._id ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getCollectionIcon(c.icon)}
                    <span>{c.name}</span>
                  </div>
                  {activeNote?.folderId === c._id ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Note Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
            <DialogDescription className="text-slate-400">Share "{activeNote?.title}" with team members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Direct Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/admin/knowledge-vault?note=${activeNote?.id || activeNote?._id}`}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/admin/knowledge-vault?note=${activeNote?.id || activeNote?._id}`);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Access Level</label>
              <select
                value={activeNote?.access || "Only you"}
                onChange={(e) => updateActiveNoteLocally({ access: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="Only you">Only you (Private)</option>
                <option value="Organization">Organization (Team Members)</option>
                <option value="Public">Public (Anyone with link)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={versionModalOpen} onOpenChange={setVersionModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription className="text-slate-400">{activeNote?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-64 overflow-y-auto">
            {[
              { v: activeNote?.version || 1, date: formatNoteDate(activeNote?.updatedAt), editor: activeNote?.createdBy?.name || "User", notes: "Current Version" },
            ].map((ver) => (
              <div key={ver.v} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">v{ver.v}</span>
                    <span className="text-slate-300 font-medium">{ver.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ver.notes} • {ver.editor}</p>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Active</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionModalOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Tool Result Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span>{aiModalTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">Generated using Knowledge Vault AI Assistant</DialogDescription>
          </DialogHeader>

          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-xs text-slate-400">Analyzing note content with AI...</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {aiModalContent}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setAiModalOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Dismiss
            </Button>
            {!aiLoading ? (
              <Button onClick={handleApplyAiSummary} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                <Check className="h-3.5 w-3.5 mr-1" /> Append to Note
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
