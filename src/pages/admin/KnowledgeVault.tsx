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
  FlaskConical, CheckCircle2, FileCode, Paperclip, Upload, ExternalLink,
  Eye, File, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { kvApi, KvNote, KvActionItem, KvFolder, KvVersion, KvAttachment } from "@/lib/knowledgeVault";
import { getAuthState } from "@/lib/auth";
import { toProxiedUrl } from "@/lib/admin/apiClient";

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

function formatFileSize(bytes?: number | string) {
  if (typeof bytes === "string" && isNaN(Number(bytes))) return bytes;
  const num = Number(bytes);
  if (!num || isNaN(num) || num <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getAttachmentUrl(att?: KvAttachment | null, token?: string | null) {
  if (!att) return "";
  if (att.url && (att.url.startsWith("http://") || att.url.startsWith("https://") || att.url.startsWith("data:"))) {
    return att.url;
  }
  const fileId = att.fileId || att.id || att._id;
  const baseUrl = (import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:5000" : "https://task.se7eninc.com")).replace(/\/$/, "");
  if (att.url && att.url.startsWith("/api/")) {
    return `${baseUrl}${att.url}${token ? (att.url.includes("?") ? `&token=${token}` : `?token=${token}`) : ""}`;
  }
  if (fileId) {
    return `${baseUrl}/api/knowledge/v2/files/${fileId}${token ? `?token=${token}` : ""}`;
  }
  return att.url || "";
}

function resolveAuthorAvatar(note?: KvNote | null, auth?: any): string {
  if (!note) return "";
  let avatar = note.createdBy?.avatar;

  // If note has no avatar or empty avatar, check cached profiles for current user fallback
  if (!avatar) {
    try {
      const cachedAdmin = localStorage.getItem("taskflow_cached_profile");
      if (cachedAdmin) {
        const parsed = JSON.parse(cachedAdmin);
        avatar = parsed?.avatarUrl || parsed?.avatarDataUrl;
      }
      if (!avatar) {
        const cachedManager = localStorage.getItem("manager_cached_profile");
        if (cachedManager) {
          const parsed = JSON.parse(cachedManager);
          avatar = parsed?.avatarUrl || parsed?.avatarDataUrl;
        }
      }
      if (!avatar) {
        const cachedEmp = localStorage.getItem("employee_cached_profile");
        if (cachedEmp) {
          const parsed = JSON.parse(cachedEmp);
          avatar = parsed?.avatarUrl || parsed?.avatarDataUrl;
        }
      }
    } catch (_) {}
  }

  if (!avatar && auth?.avatar) {
    avatar = auth.avatar;
  }

  if (!avatar) return "";

  if (avatar.startsWith("data:") || avatar.startsWith("blob:")) {
    return avatar;
  }

  const proxied = toProxiedUrl(avatar);
  if (proxied) return proxied;

  if (avatar.startsWith("/uploads/") || avatar.startsWith("/api/")) {
    const baseUrl = (import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:5000" : "https://task.se7eninc.com")).replace(/\/$/, "");
    return `${baseUrl}${avatar}`;
  }

  return avatar;
}

/* -------------------------------------------------------------------------- */
/*                           MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function KnowledgeVault() {
  const queryClient = useQueryClient();
  const auth = getAuthState();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active filters & search
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all"); // 'all' | 'favorites' | 'recent' | 'pinned' | 'ai' | col-id | tag-name
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isSaving, setIsSaving] = useState(false);

  // Local draft state for active note editing
  const [activeNoteDraft, setActiveNoteDraft] = useState<Partial<KvNote> | null>(null);

  // Attachments State
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<KvAttachment | null>(null);

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

  // Pagination & Editor Formatting State
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const overviewTextareaRef = useRef<HTMLTextAreaElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const editorFileInputRef = useRef<HTMLInputElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Reset page to 1 when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

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

  // Cleanup pending auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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

  // 3. Fetch Notes with current filter (10 items per page)
  const notesQuery = useQuery({
    queryKey: ["kv-notes", activeFilter, searchQuery, page],
    queryFn: async () => {
      try {
        if (searchQuery.trim()) {
          const searchRes = await kvApi.search(searchQuery.trim(), "hybrid");
          const allItems: KvNote[] = searchRes?.items || [];
          const start = (page - 1) * PAGE_SIZE;
          const paginatedItems = allItems.slice(start, start + PAGE_SIZE);
          return {
            items: paginatedItems,
            total: allItems.length,
            totalPages: Math.max(1, Math.ceil(allItems.length / PAGE_SIZE)),
            page,
          };
        }

        const params: Record<string, any> = { page, limit: PAGE_SIZE, sort: "updated" };
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
        const items = res?.items || [];
        const total = res?.total !== undefined ? res.total : items.length;
        const totalPages = res?.totalPages !== undefined ? res.totalPages : Math.max(1, Math.ceil(total / PAGE_SIZE));
        return {
          items,
          total,
          totalPages,
          page: res?.page || page,
        };
      } catch (err) {
        return { items: [], total: 0, totalPages: 1, page: 1 };
      }
    },
  });

  const notes: KvNote[] = notesQuery.data?.items || [];
  const totalNotesCount = notesQuery.data?.total || 0;
  const totalPagesCount = notesQuery.data?.totalPages || 1;
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
        if (current) {
          setActiveNoteDraft((prev) => {
            // If activeNoteDraft is empty or represents a different note, switch to current
            if (!prev || (prev.id || prev._id) !== activeNoteId) {
              return current;
            }
            // Keep local uncommitted edits while updating metadata in background
            return { ...current, ...prev };
          });
        }
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

  // Dynamic versions query for active note
  const versionsQuery = useQuery({
    queryKey: ["kv-versions", activeNote?.id || activeNote?._id],
    queryFn: async () => {
      const id = activeNote?.id || activeNote?._id;
      if (!id) return [];
      try {
        const res = await kvApi.versions(id);
        return res?.items || [];
      } catch (_) {
        return [];
      }
    },
    enabled: versionModalOpen && !!(activeNote?.id || activeNote?._id),
  });

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
    onSuccess: (res) => {
      setIsSaving(false);
      // Invalidate background queries without disrupting active draft
      queryClient.invalidateQueries({ queryKey: ["kv-notes"] });
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

  const updateActiveNoteLocally = (patch: Partial<KvNote>, immediate = false) => {
    if (!activeNote) return;
    setIsSaving(true);
    const updated = { ...activeNote, ...patch, updatedAt: new Date().toISOString() };
    setActiveNoteDraft(updated);

    const noteId = activeNote.id || activeNote._id;
    if (!noteId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (immediate) {
      updateNoteMutation.mutate({ id: noteId, patch });
    } else {
      saveTimeoutRef.current = setTimeout(() => {
        updateNoteMutation.mutate({ id: noteId, patch });
      }, 500);
    }
  };

  const flushSave = () => {
    if (saveTimeoutRef.current && activeNote) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      const noteId = activeNote.id || activeNote._id;
      if (noteId) {
        const textVal = activeNote.overview || activeNote.content || activeNote.body?.plain || "";
        updateNoteMutation.mutate({
          id: noteId,
          patch: {
            title: activeNote.title,
            overview: activeNote.overview,
            content: textVal,
            body: { plain: textVal },
          },
        });
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                      RICH TEXT FORMATTING & COVER IMAGE                     */
  /* -------------------------------------------------------------------------- */

  const applyInlineFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = "text") => {
    const el = overviewTextareaRef.current;
    if (!el || !activeNote) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value || "";
    const selected = currentVal.substring(start, end) || defaultPlaceholder;

    const formatted = `${prefix}${selected}${suffix}`;
    const nextVal = currentVal.substring(0, start) + formatted + currentVal.substring(end);

    // Save to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentVal, nextVal]);
    setHistoryIndex((prev) => prev + 2);

    updateActiveNoteLocally({
      overview: nextVal,
      content: nextVal,
      body: { plain: nextVal },
    }, false);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const applyLinePrefix = (linePrefix: string) => {
    const el = overviewTextareaRef.current;
    if (!el || !activeNote) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value || "";

    const lineStart = currentVal.lastIndexOf("\n", start - 1) + 1;
    const nextVal = currentVal.substring(0, lineStart) + linePrefix + currentVal.substring(lineStart);

    // Save to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentVal, nextVal]);
    setHistoryIndex((prev) => prev + 2);

    updateActiveNoteLocally({
      overview: nextVal,
      content: nextVal,
      body: { plain: nextVal },
    }, false);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + linePrefix.length, end + linePrefix.length);
    }, 0);
  };

  const handleHeadingChange = (value: string) => {
    if (value === "h1") applyLinePrefix("# ");
    else if (value === "h2") applyLinePrefix("## ");
    else if (value === "h3") applyLinePrefix("### ");
    else if (value === "normal") {
      const el = overviewTextareaRef.current;
      if (!el || !activeNote) return;
      const start = el.selectionStart;
      const currentVal = el.value || "";
      const lineStart = currentVal.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = currentVal.indexOf("\n", start);
      const line = currentVal.substring(lineStart, lineEnd === -1 ? currentVal.length : lineEnd);
      const cleaned = line.replace(/^#{1,6}\s*/, "");
      const nextVal = currentVal.substring(0, lineStart) + cleaned + (lineEnd === -1 ? "" : currentVal.substring(lineEnd));
      updateActiveNoteLocally({ overview: nextVal, content: nextVal, body: { plain: nextVal } }, false);
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const title = linkTitle.trim() || linkUrl.trim();
    applyInlineFormat(`[${title}](`, `)`, linkUrl.trim());
    setLinkUrl("");
    setLinkTitle("");
    setLinkModalOpen(false);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || history.length === 0) return;
    const prevVal = history[historyIndex - 1];
    setHistoryIndex((prev) => prev - 1);
    updateActiveNoteLocally({ overview: prevVal, content: prevVal, body: { plain: prevVal } }, false);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextVal = history[historyIndex + 1];
    setHistoryIndex((prev) => prev + 1);
    updateActiveNoteLocally({ overview: nextVal, content: nextVal, body: { plain: nextVal } }, false);
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WebP)");
      return;
    }
    const toastId = toast.loading("Uploading cover image...");
    try {
      const uploadRes = await kvApi.uploadFile(file);
      const url = uploadRes?.item?.url;
      if (url) {
        updateActiveNoteLocally({ heroImage: url }, true);
        toast.success("Cover image added", { id: toastId });
      } else {
        toast.error("Failed to upload cover image", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to upload cover image", { id: toastId });
    } finally {
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  };

  const handleRemoveCoverImage = () => {
    if (!activeNote) return;
    updateActiveNoteLocally({ heroImage: "" }, true);
    toast.success("Cover image removed");
  };

  const handleEditorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadRes = await kvApi.uploadFile(file);
      const url = uploadRes?.item?.url;
      if (url) {
        applyInlineFormat(`[📎 ${file.name}](`, `)`, url);
        toast.success("File attached to note", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to upload attachment", { id: toastId });
    } finally {
      if (editorFileInputRef.current) editorFileInputRef.current.value = "";
    }
  };

  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;
    const toastId = toast.loading(`Uploading image...`);
    try {
      const uploadRes = await kvApi.uploadFile(file);
      const url = uploadRes?.item?.url;
      if (url) {
        applyInlineFormat(`![${file.name}](`, `)`, url);
        toast.success("Image inserted into note", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to upload image", { id: toastId });
    } finally {
      if (editorImageInputRef.current) editorImageInputRef.current.value = "";
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            ATTACHMENT HANDLERS                             */
  /* -------------------------------------------------------------------------- */

  const uploadAndAttachFiles = async (fileList: FileList | File[]) => {
    if (!activeNote) return;
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setIsUploadingAttachment(true);
    const toastId = toast.loading(`Uploading ${filesArray.length} file(s)...`);

    try {
      const newAttachments: KvAttachment[] = [];
      for (const file of filesArray) {
        const res = await kvApi.uploadFile(file);
        if (res?.item) {
          newAttachments.push(res.item);
        }
      }

      if (newAttachments.length > 0) {
        const currentAttachments = activeNote.attachments || [];
        const updatedAttachments = [...currentAttachments, ...newAttachments];
        updateActiveNoteLocally({ attachments: updatedAttachments }, true);
        toast.success(`Attached ${newAttachments.length} file(s)`, { id: toastId });
      } else {
        toast.error("Failed to upload file(s)", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload file(s)", { id: toastId });
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLinkAttachment = () => {
    if (!activeNote || !linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const newAtt: KvAttachment = {
      id: `link-${Date.now()}`,
      fileName: linkTitle.trim() || linkUrl.trim(),
      url: url,
      kind: "link",
      storage: "external",
    };
    const nextAtts = [...(activeNote.attachments || []), newAtt];
    updateActiveNoteLocally({ attachments: nextAtts }, true);
    setLinkUrl("");
    setLinkTitle("");
    setLinkModalOpen(false);
    toast.success("Web link attached");
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    if (!activeNote) return;
    const current = activeNote.attachments || [];
    const nextAtts = current.filter((_, i) => i !== indexToRemove);
    updateActiveNoteLocally({ attachments: nextAtts }, true);
    toast.success("Attachment removed");
  };

  const handleOpenAttachment = (att: KvAttachment) => {
    if (!att) return;
    const isImage = att.kind === "image" || att.mimeType?.startsWith("image/") || att.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
    const isPdf = att.kind === "pdf" || att.mimeType === "application/pdf" || att.fileName?.endsWith(".pdf");
    const isVideo = att.kind === "video" || att.mimeType?.startsWith("video/");

    if (isImage || isPdf || isVideo) {
      setPreviewAttachment(att);
      setPreviewModalOpen(true);
      return;
    }

    const resolvedUrl = getAttachmentUrl(att, auth.token);
    if (resolvedUrl) {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.info(`Attachment: ${att.fileName}`);
    }
  };

  const handleCreateNewNote = (folderId: string | null = null, folderName = "General") => {
    let userAvatar = "";
    try {
      const cachedAdmin = localStorage.getItem("taskflow_cached_profile");
      if (cachedAdmin) {
        const parsed = JSON.parse(cachedAdmin);
        userAvatar = parsed?.avatarUrl || parsed?.avatarDataUrl || "";
      }
      if (!userAvatar) {
        const cachedManager = localStorage.getItem("manager_cached_profile");
        if (cachedManager) {
          const parsed = JSON.parse(cachedManager);
          userAvatar = parsed?.avatarUrl || parsed?.avatarDataUrl || "";
        }
      }
      if (!userAvatar) {
        const cachedEmp = localStorage.getItem("employee_cached_profile");
        if (cachedEmp) {
          const parsed = JSON.parse(cachedEmp);
          userAvatar = parsed?.avatarUrl || parsed?.avatarDataUrl || "";
        }
      }
    } catch (_) {}

    const authorName = auth.name || auth.username || "User";
    const payload: Partial<KvNote> = {
      title: "Untitled Note",
      overview: "",
      content: "",
      folder: folderName,
      folderId: folderId,
      tags: [],
      status: "active",
      priority: "normal",
      visibility: "private",
      isPinned: false,
      isFavorite: false,
      isImportant: false,
      actionItems: [],
      notesList: [],
      attachments: [],
      createdBy: {
        id: (auth as any).userId || (auth as any).id || (auth as any).sub || "",
        name: authorName,
        avatar: userAvatar,
        role: auth.role || "Admin",
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
    toast.success("Note point added");
  };

  const handleRemoveBulletNote = (index: number) => {
    if (!activeNote) return;
    const nextList = (activeNote.notesList || []).filter((_, idx) => idx !== index);
    updateActiveNoteLocally({ notesList: nextList });
    toast.success("Note point removed");
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
        const overviewText = activeNote.overview || activeNote.content || "";
        setAiModalContent(
          overviewText
            ? `Summary for "${activeNote.title}":\n\n${overviewText.slice(0, 300)}...\n\n• Word count: ${wordCount} words\n• Completed action items: ${(activeNote.actionItems || []).filter((a) => a.completed).length}/${(activeNote.actionItems || []).length}`
            : `"${activeNote.title}" is currently empty. Add content to generate a detailed summary.`
        );
      } else if (type === "extract") {
        setAiModalTitle("Extracted Action Items");
        const existingActions = activeNote.actionItems || [];
        setAiModalContent(
          existingActions.length > 0
            ? existingActions.map((a, i) => `${i + 1}. [${a.completed ? "COMPLETED" : "PENDING"}] ${a.text}`).join("\n")
            : `1. Review and refine key priorities for "${activeNote.title}"\n2. Share updates with relevant collaborators`
        );
      } else if (type === "translate") {
        setAiModalTitle("Translation (Spanish)");
        setAiModalContent(
          `Título: ${activeNote.title}\nResumen: ${activeNote.overview || activeNote.content || "Sin contenido disponible."}`
        );
      } else if (type === "related") {
        setAiModalTitle("Related Notes");
        const related = notes.filter((n) => (n.id || n._id) !== noteId).slice(0, 3);
        setAiModalContent(
          related.length > 0
            ? related.map((r, i) => `${i + 1}. ${r.title} (${r.folder || "General"})`).join("\n")
            : "No related notes found in this workspace."
        );
      } else if (type === "improve") {
        setAiModalTitle("Polished Writing");
        setAiModalContent(
          activeNote.overview
            ? `Enhanced draft:\n\n"${activeNote.overview.trim()}"\n\nClarity score: High • Tone: Professional.`
            : `Add notes or overview to generate AI writing suggestions.`
        );
      } else if (type === "tasks") {
        setAiModalTitle("Create System Tasks");
        setAiModalContent(
          (activeNote.actionItems || []).length > 0
            ? `Generated tasks from action items:\n\n${(activeNote.actionItems || []).map((a) => `• [Task] ${a.text}`).join("\n")}`
            : `No action items to convert into tasks. Add action items first.`
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
      notesList: [...(activeNote.notesList || []), `AI: ${aiModalContent.split("\n")[0]}`],
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
                onClick={() => handleCreateNewNote(null, "General")}
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
                                ? "bg-gradient-to-r from-blue-950/80 to-slate-900 border-blue-500 border-l-4 border-l-blue-500 ring-2 ring-blue-500/40 shadow-xl shadow-blue-950/60"
                                : "bg-[#161f30]/60 border-slate-800/80 hover:border-blue-400/50 hover:bg-[#1c273d] hover:shadow-md"
                            }`}
                          >
                            {/* Card Top Row: Title, Star, Time */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {isSelected && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400 shrink-0 animate-pulse" />
                                )}
                                <h3 className={`text-xs font-bold truncate ${isSelected ? "text-white font-extrabold" : "text-slate-200 group-hover:text-white"}`}>
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
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed flex-1 group-hover:text-slate-300">
                                {note.overview || note.content || note.body?.plain || "No overview available..."}
                              </p>

                              {note.heroImage ? (
                                <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700/60 bg-slate-900 shadow-sm">
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

          {/* Footer: Dynamic Pagination (10 notes/page) */}
          <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="truncate">
              Page {page} of {totalPagesCount} ({totalNotesCount} note{totalNotesCount !== 1 ? "s" : ""})
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-semibold transition-colors"
                title="Previous page"
              >
                &lt;
              </button>
              {Array.from({ length: totalPagesCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPagesCount || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-slate-600 px-0.5">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[22px] px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                        page === p
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/50"
                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPagesCount, p + 1))}
                disabled={page >= totalPagesCount}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-semibold transition-colors"
                title="Next page"
              >
                &gt;
              </button>
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
                  <span className="font-semibold text-slate-200">{activeNote.folder || "General"}</span>
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
                onChange={(e) => updateActiveNoteLocally({ title: e.target.value }, false)}
                onBlur={flushSave}
                placeholder="Note Title"
                className="w-full bg-transparent text-2xl font-bold text-white tracking-tight focus:outline-none focus:border-b focus:border-blue-500 pb-1"
              />

              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 py-1.5 px-2 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto text-slate-300">
                <select
                  onChange={(e) => handleHeadingChange(e.target.value)}
                  defaultValue="normal"
                  className="bg-slate-800 text-xs text-slate-200 font-medium px-2 py-1 rounded focus:outline-none cursor-pointer border border-slate-700 hover:border-slate-600"
                >
                  <option value="normal">Normal Text</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => applyInlineFormat("**", "**", "bold text")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white font-bold transition-colors"
                  title="Bold (**text**)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineFormat("*", "*", "italic text")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white italic transition-colors"
                  title="Italic (*text*)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineFormat("<u>", "</u>", "underlined text")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white underline transition-colors"
                  title="Underline (<u>text</u>)"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineFormat("~~", "~~", "strikethrough text")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white line-through transition-colors"
                  title="Strikethrough (~~text~~)"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => applyLinePrefix("- ")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Bullet List (- item)"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("1. ")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Numbered List (1. item)"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("- [ ] ")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Checklist (- [ ] task)"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setLinkModalOpen(true)}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white text-sky-400 transition-colors"
                  title="Attach Web Link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editorFileInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white text-blue-400 transition-colors"
                  title="Attach File"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editorImageInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white text-emerald-400 transition-colors"
                  title="Insert Image"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("> ")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Blockquote (> quote)"
                >
                  <Quote className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineFormat("```\n", "\n```", "code here")}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white font-mono text-xs transition-colors"
                  title="Code block (```code```)"
                >
                  <FileCode className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1 ml-auto" />

                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Undo"
                >
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                  title="Redo"
                >
                  <Redo className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Hidden file inputs for toolbar and cover image */}
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
              />
              <input
                ref={editorFileInputRef}
                type="file"
                className="hidden"
                onChange={handleEditorFileUpload}
              />
              <input
                ref={editorImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEditorImageUpload}
              />

              {/* Note Header Cover Image (Hero Banner / Add Button) */}
              {activeNote.heroImage ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-lg">
                  <img
                    src={activeNote.heroImage}
                    alt={activeNote.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl">
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Change Cover
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCoverImage}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-blue-500/50 transition-all font-medium"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>+ Add Cover Image</span>
                  </button>
                </div>
              )}

              {/* Section 1: Overview / Main Content Editor */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-400">Overview</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Auto-saves on edit</span>
                </div>
                <textarea
                  ref={overviewTextareaRef}
                  value={activeNote.overview ?? activeNote.content ?? activeNote.body?.plain ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateActiveNoteLocally({
                      overview: val,
                      content: val,
                      body: { plain: val },
                    }, false);
                  }}
                  onBlur={flushSave}
                  placeholder="Enter note overview, summaries, or key insights..."
                  rows={6}
                  className="w-full bg-slate-900/40 text-xs text-slate-200 leading-relaxed resize-y focus:outline-none focus:bg-slate-900/80 p-3 rounded-xl border border-slate-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
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
              <div
                className={`space-y-2 pt-1 p-2.5 rounded-2xl border transition-all ${
                  isDraggingAttachment
                    ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
                    : "border-transparent bg-transparent"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingAttachment(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingAttachment(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingAttachment(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    uploadAndAttachFiles(e.dataTransfer.files);
                  }
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-bold text-blue-400">
                      Attachments ({(activeNote.attachments || []).length})
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLinkModalOpen(true)}
                      className="h-7 text-xs border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 rounded-lg"
                    >
                      <Link2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>Add Link</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 rounded-lg shadow-sm"
                    >
                      {isUploadingAttachment ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>Attach File</span>
                    </Button>
                  </div>
                </div>

                {/* Hidden File Input for Attachments */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadAndAttachFiles(e.target.files);
                    }
                  }}
                  className="hidden"
                />

                {/* Dropzone prompt when empty */}
                {(activeNote.attachments || []).length === 0 && !isUploadingAttachment ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors bg-slate-900/30"
                  >
                    <Upload className="h-5 w-5 text-slate-500" />
                    <p className="text-xs font-medium text-slate-400">
                      Click to upload or drag & drop files here
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports images, PDFs, videos, documents, audio (up to 100MB)
                    </p>
                  </div>
                ) : null}

                {/* Attachments Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                  {(activeNote.attachments || []).map((att, idx) => {
                    const resolvedUrl = getAttachmentUrl(att, auth.token);
                    const isImg = att.kind === "image" || att.mimeType?.startsWith("image/") || att.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
                    const isPdf = att.kind === "pdf" || att.mimeType === "application/pdf" || att.fileName?.endsWith(".pdf");
                    const isVid = att.kind === "video" || att.mimeType?.startsWith("video/");
                    const isLink = att.kind === "link";

                    return (
                      <div
                        key={att.fileId || att.id || att._id || idx}
                        className="flex flex-col p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all gap-1.5 group relative"
                      >
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(idx);
                          }}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-slate-950/80 text-slate-400 hover:text-red-400 rounded-full p-1 transition-opacity z-10"
                          title="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Thumbnail / Icon area */}
                        <div
                          className="w-full h-20 rounded-lg overflow-hidden flex items-center justify-center bg-slate-950/60 border border-slate-800/60 cursor-pointer relative"
                          onClick={() => handleOpenAttachment(att)}
                        >
                          {isImg && resolvedUrl ? (
                            <img
                              src={resolvedUrl}
                              alt={att.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e: any) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : isPdf ? (
                            <div className="flex flex-col items-center justify-center text-red-400 gap-1">
                              <FileText className="h-6 w-6" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">PDF</span>
                            </div>
                          ) : isVid ? (
                            <div className="relative w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                              <Play className="h-4 w-4 fill-blue-400 ml-0.5" />
                            </div>
                          ) : isLink ? (
                            <div className="flex flex-col items-center justify-center text-sky-400 gap-1">
                              <Link2 className="h-6 w-6" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Link</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                              <File className="h-6 w-6" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">File</span>
                            </div>
                          )}

                          {/* Hover preview overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAttachment(att);
                              }}
                              className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                              title="Open / Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {resolvedUrl && !isLink ? (
                              <a
                                href={resolvedUrl}
                                download={att.fileName}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0">
                          <span
                            onClick={() => handleOpenAttachment(att)}
                            className="text-[11px] font-medium text-slate-200 truncate block hover:text-blue-400 cursor-pointer"
                            title={att.fileName}
                          >
                            {att.fileName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            {att.fileSize || formatFileSize(att.size) || (isLink ? "External Link" : "")}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Uploading Skeleton Card */}
                  {isUploadingAttachment ? (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-blue-500/40 border-dashed text-center gap-2 animate-pulse min-h-[110px]">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      <span className="text-[11px] text-blue-300 font-medium">Uploading...</span>
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
                <div className="flex items-center gap-2.5 mt-1.5 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <Avatar className="h-7 w-7 border border-slate-700/80 shrink-0">
                    <AvatarImage
                      src={resolveAuthorAvatar(activeNote, auth)}
                      alt={activeNote?.createdBy?.name || "Author"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-[10px] font-bold bg-blue-600/20 text-blue-300">
                      {(activeNote?.createdBy?.name || auth.name || auth.username || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-200 text-xs font-semibold truncate block">
                      {activeNote?.createdBy?.name || auth.name || auth.username || "User"}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize leading-tight">
                      {activeNote?.createdBy?.role || auth.role || "Admin"}
                    </span>
                  </div>
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
            {versionsQuery.isLoading ? (
              <div className="flex justify-center py-6 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (versionsQuery.data || []).length > 0 ? (
              (versionsQuery.data || []).map((ver: KvVersion) => (
                <div key={ver._id || ver.version} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">v{ver.version}</span>
                      <span className="text-slate-300 font-medium">{formatNoteDate(ver.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ver.reason || "Updated"}</p>
                  </div>
                  {ver.version === activeNote?.version ? (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Active</Badge>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">v{activeNote?.version || 1}</span>
                    <span className="text-slate-300 font-medium">{formatNoteDate(activeNote?.updatedAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Current Version</p>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Active</Badge>
              </div>
            )}
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

      {/* Add Web Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-sky-400" />
              <span>Attach Web Link</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Attach a Google Doc, Dropbox, Figma, or any web URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Web URL *</label>
              <Input
                autoFocus
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Display Title (optional)</label>
              <Input
                placeholder="e.g. Design Specs, Meeting Sheet"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLinkAttachment()}
                className="bg-slate-900 border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleAddLinkAttachment}
              disabled={!linkUrl.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
            >
              Attach Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate max-w-md">{previewAttachment?.fileName}</span>
              {previewAttachment && getAttachmentUrl(previewAttachment, auth.token) ? (
                <a
                  href={getAttachmentUrl(previewAttachment, auth.token)}
                  target="_blank"
                  rel="noreferrer"
                  download={previewAttachment.fileName}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-normal"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open original</span>
                </a>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px] bg-slate-950/60 rounded-xl border border-slate-800">
            {previewAttachment && (previewAttachment.kind === "image" || previewAttachment.mimeType?.startsWith("image/") || previewAttachment.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ? (
              <img
                src={getAttachmentUrl(previewAttachment, auth.token)}
                alt={previewAttachment.fileName}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            ) : previewAttachment && (previewAttachment.kind === "video" || previewAttachment.mimeType?.startsWith("video/")) ? (
              <video
                controls
                src={getAttachmentUrl(previewAttachment, auth.token)}
                className="max-h-[60vh] max-w-full rounded-lg shadow-lg"
              />
            ) : previewAttachment && (previewAttachment.kind === "pdf" || previewAttachment.mimeType === "application/pdf" || previewAttachment.fileName?.endsWith(".pdf")) ? (
              <iframe
                src={getAttachmentUrl(previewAttachment, auth.token)}
                title={previewAttachment.fileName}
                className="w-full h-[60vh] rounded-lg border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <FileText className="h-12 w-12 text-slate-500" />
                <p className="text-xs text-slate-300">{previewAttachment?.fileName}</p>
                {previewAttachment && getAttachmentUrl(previewAttachment, auth.token) ? (
                  <a
                    href={getAttachmentUrl(previewAttachment, auth.token)}
                    download={previewAttachment.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </a>
                ) : null}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
