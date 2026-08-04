import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag as TagIcon, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Check,
  X,
  Folder as FolderIcon,
  Star,
  Lock,
  Unlock,
  Share2,
  Download,
  Copy,
  FolderSync,
  History,
  FileCode,
  Image as ImageIcon,
  Play,
  Upload,
  CheckSquare,
  ListPlus,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  BookOpen,
  Bold,
  Italic,
  Underline,
  List as ListIcon,
  Table as TableIcon,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  Globe,
  CornerDownRight,
  Grid,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Textarea } from "@/components/manger/ui/textarea";
import { Card, CardContent } from "@/components/manger/ui/card";
import { toast } from "sonner";
import { ScrollArea } from "@/components/manger/ui/scroll-area";
import { Badge } from "@/components/manger/ui/badge";
import { getAuthState } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface Attachment {
  fileName: string;
  url: string; // Base64 data URL
  mimeType: string;
  size: number;
}

interface ActionItem {
  text: string;
  completed: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string; // Used for "Overview"
  color: string;
  isPinned: boolean;
  isFavorite: boolean;
  folder: string; // Collection/Folder name
  tags: string[];
  actionItems: ActionItem[];
  notesList: string[];
  attachments: Attachment[];
  updatedAt: string;
  createdAt: string;
}

interface PersonalNotesProps {
  getNotes: () => Promise<{ items: Note[] }>;
  createNote: (payload: { 
    title: string; 
    content: string; 
    color?: string; 
    isPinned?: boolean;
    isFavorite?: boolean;
    folder?: string;
    tags?: string[];
    actionItems?: ActionItem[];
    notesList?: string[];
    attachments?: Attachment[];
  }) => Promise<{ item: Note }>;
  updateNote: (id: string, payload: Partial<Note>) => Promise<{ item: Note }>;
  deleteNote: (id: string) => Promise<any>;
}

const DEFAULT_FOLDERS = [
  "Business",
  "Operations",
  "Patents",
  "Research",
  "Employees",
  "Marketing",
  "Projects",
  "Finance",
  "Legal",
  "Personal"
];

const COLORS = [
  { name: "Default", value: "rgba(30, 41, 59, 0.5)" },
  { name: "Blue", value: "rgba(79, 124, 255, 0.25)" },
  { name: "Green", value: "rgba(22, 199, 132, 0.25)" },
  { name: "Yellow", value: "rgba(245, 158, 11, 0.25)" },
  { name: "Red", value: "rgba(239, 68, 68, 0.25)" },
  { name: "Purple", value: "rgba(168, 85, 247, 0.25)" },
];

const HERO_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1200&q=80"
];

export default function PersonalNotes({ getNotes, createNote, updateNote, deleteNote }: PersonalNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Filtering & Navigation State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("All"); // "All", "Favorites", "Pinned", or specific folder name
  const [activeTag, setActiveTag] = useState<string>("All");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [customTags, setCustomTags] = useState<string[]>(["AI", "Important", "Meeting", "Ideas", "Patent", "SOP"]);
  const [newTagName, setNewTagName] = useState("");

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  
  // Canvas custom list elements
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newActionItem, setNewActionItem] = useState("");
  const [notesList, setNotesList] = useState<string[]>([]);
  const [newNoteListItem, setNewNoteListItem] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Router & Auth Info
  const navigate = useNavigate();
  const auth = getAuthState();
  const currentUsername = auth?.username || "Nathan Reardon";
  const currentRole = auth?.role || "super-admin";

  // AI Assistant Output State
  const [aiOutput, setAiOutput] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [relatedNotesList, setRelatedNotesList] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1200px)");
    const sync = () => {
      const next = mq.matches;
      setIsMobile(next);
      if (next) {
        setSidebarOpen(false);
        setDetailsOpen(false);
      } else {
        setSidebarOpen(true);
        setDetailsOpen(true);
      }
    };
    sync();
    const handler = () => sync();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await getNotes();
      const loadedNotes = (res.items || []).map(note => ({
        ...note,
        tags: note.tags || [],
        actionItems: note.actionItems || [],
        notesList: note.notesList || [],
        attachments: note.attachments || [],
        folder: note.folder || ""
      }));
      setNotes(loadedNotes);

      // Extract folders and tags dynamically from loaded notes to augment defaults
      const extractedFolders = Array.from(new Set(loadedNotes.map(n => n.folder).filter(Boolean)));
      setCustomFolders(prev => Array.from(new Set([...DEFAULT_FOLDERS, ...extractedFolders])));
      
      const extractedTags = Array.from(new Set(loadedNotes.flatMap(n => n.tags || []).filter(Boolean)));
      setCustomTags(prev => Array.from(new Set([...prev, ...extractedTags])));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load knowledge database");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const initialFolder = activeFolder !== "All" && activeFolder !== "Favorites" && activeFolder !== "Pinned" ? activeFolder : "Projects";
      const initialTags = activeTag !== "All" ? [activeTag] : ["Ideas"];
      
      const { item } = await createNote({ 
        title: "Untitled Vault Document", 
        content: "Overview details go here...", 
        color: "rgba(30, 41, 59, 0.5)",
        folder: initialFolder,
        tags: initialTags,
        actionItems: [],
        notesList: [],
        attachments: []
      });

      const normalizedItem = {
        ...item,
        tags: item.tags || [],
        actionItems: item.actionItems || [],
        notesList: item.notesList || [],
        attachments: item.attachments || []
      };

      setNotes([normalizedItem, ...notes]);
      selectNote(normalizedItem);
      setIsEditing(true);
      toast.success("Knowledge note initialized");
    } catch (err) {
      toast.error("Failed to initialize note");
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditFolder(note.folder);
    setEditTags(note.tags);
    setActionItems(note.actionItems);
    setNotesList(note.notesList);
    setAttachments(note.attachments);
    setAiOutput("");
    setRelatedNotesList([]);
    setIsEditing(false);
    setCoverImageIndex(note.title.length % HERO_COVER_IMAGES.length);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      const payload = {
        title: editTitle,
        content: editContent,
        folder: editFolder,
        tags: editTags,
        actionItems: actionItems,
        notesList: notesList,
        attachments: attachments
      };
      
      const { item } = await updateNote(selectedNote.id, payload);
      
      const normalizedItem = {
        ...item,
        tags: item.tags || [],
        actionItems: item.actionItems || [],
        notesList: item.notesList || [],
        attachments: item.attachments || []
      };

      setNotes(notes.map(n => n.id === item.id ? normalizedItem : n));
      setSelectedNote(normalizedItem);
      setIsEditing(false);
      toast.success("Vault auto-save synced");
    } catch (err) {
      toast.error("Failed to save note");
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this note?")) return;
    try {
      await deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      toast.success("Vault Note permanently deleted");
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  const togglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const { item } = await updateNote(id, { isPinned: !note.isPinned });
      const updated = { ...note, isPinned: item.isPinned };
      setNotes(notes.map(n => n.id === id ? updated : n));
      if (selectedNote?.id === id) setSelectedNote(updated);
    } catch (err) {
      toast.error("Failed to update Pin status");
    }
  };

  const toggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const { item } = await updateNote(id, { isFavorite: !note.isFavorite });
      const updated = { ...note, isFavorite: item.isFavorite };
      setNotes(notes.map(n => n.id === id ? updated : n));
      if (selectedNote?.id === id) setSelectedNote(updated);
    } catch (err) {
      toast.error("Failed to update Favorite status");
    }
  };

  const handleDuplicateNote = async () => {
    if (!selectedNote) return;
    try {
      const { item } = await createNote({
        title: `${selectedNote.title} (Copy)`,
        content: selectedNote.content,
        color: selectedNote.color,
        folder: selectedNote.folder,
        tags: selectedNote.tags,
        actionItems: selectedNote.actionItems.map(i => ({ ...i })),
        notesList: [...selectedNote.notesList],
        attachments: selectedNote.attachments.map(a => ({ ...a }))
      });

      const normalizedItem = {
        ...item,
        tags: item.tags || [],
        actionItems: item.actionItems || [],
        notesList: item.notesList || [],
        attachments: item.attachments || []
      };

      setNotes([normalizedItem, ...notes]);
      selectNote(normalizedItem);
      toast.success("Document duplicated successfully");
    } catch (err) {
      toast.error("Failed to duplicate document");
    }
  };

  const updateColor = async (id: string, color: string) => {
    try {
      const { item } = await updateNote(id, { color });
      setNotes(notes.map(n => n.id === id ? { ...n, color: item.color } : n));
      if (selectedNote?.id === id) setSelectedNote(prev => prev ? { ...prev, color: item.color } : null);
    } catch (err) {
      toast.error("Failed to update note color theme");
    }
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (customFolders.includes(newFolderName.trim())) return;
    setCustomFolders([...customFolders, newFolderName.trim()]);
    setNewFolderName("");
    toast.success("Collection folder created");
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    if (customTags.includes(newTagName.trim())) return;
    setCustomTags([...customTags, newTagName.trim()]);
    setNewTagName("");
    toast.success("Filter Tag added");
  };

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return;
    const items = [...actionItems, { text: newActionItem.trim(), completed: false }];
    setActionItems(items);
    setNewActionItem("");
    if (!isEditing) {
      updateNote(selectedNote!.id, { actionItems: items })
        .then(({ item }) => {
          setNotes(notes.map(n => n.id === item.id ? { ...n, actionItems: item.actionItems } : n));
        });
    }
  };

  const toggleActionItem = (index: number) => {
    const items = actionItems.map((item, idx) => 
      idx === index ? { ...item, completed: !item.completed } : item
    );
    setActionItems(items);
    if (!isEditing) {
      updateNote(selectedNote!.id, { actionItems: items })
        .then(({ item }) => {
          setNotes(notes.map(n => n.id === item.id ? { ...n, actionItems: item.actionItems } : n));
        });
    }
  };

  const handleRemoveActionItem = (index: number) => {
    const items = actionItems.filter((_, idx) => idx !== index);
    setActionItems(items);
    if (!isEditing) {
      updateNote(selectedNote!.id, { actionItems: items })
        .then(({ item }) => {
          setNotes(notes.map(n => n.id === item.id ? { ...n, actionItems: item.actionItems } : n));
        });
    }
  };

  const handleAddNoteListItem = () => {
    if (!newNoteListItem.trim()) return;
    const items = [...notesList, newNoteListItem.trim()];
    setNotesList(items);
    setNewNoteListItem("");
    if (!isEditing) {
      updateNote(selectedNote!.id, { notesList: items })
        .then(({ item }) => {
          setNotes(notes.map(n => n.id === item.id ? { ...n, notesList: item.notesList } : n));
        });
    }
  };

  const handleRemoveNoteListItem = (index: number) => {
    const items = notesList.filter((_, idx) => idx !== index);
    setNotesList(items);
    if (!isEditing) {
      updateNote(selectedNote!.id, { notesList: items })
        .then(({ item }) => {
          setNotes(notes.map(n => n.id === item.id ? { ...n, notesList: item.notesList } : n));
        });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const newAttachment: Attachment = {
        fileName: file.name,
        url: dataUrl,
        mimeType: file.type,
        size: file.size
      };

      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      toast.success(`${file.name} uploaded to Vault`);

      if (!isEditing) {
        try {
          const { item } = await updateNote(selectedNote!.id, { attachments: updatedAttachments });
          setNotes(notes.map(n => n.id === item.id ? { ...n, attachments: item.attachments } : n));
        } catch {
          toast.error("Failed to save attachment");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (index: number) => {
    const updated = attachments.filter((_, idx) => idx !== index);
    setAttachments(updated);
    if (!isEditing) {
      try {
        const { item } = await updateNote(selectedNote!.id, { attachments: updated });
        setNotes(notes.map(n => n.id === item.id ? { ...n, attachments: item.attachments } : n));
        toast.success("Attachment removed");
      } catch {
        toast.error("Failed to delete attachment");
      }
    }
  };

  const toggleTagSelection = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter(t => t !== tag));
    } else {
      setEditTags([...editTags, tag]);
    }
  };

  // FULLY DYNAMIC AI ASSISTANT FUNCTIONS
  const runAiAssistant = async (actionType: string) => {
    if (!selectedNote) return;
    setAiGenerating(true);
    setAiOutput("");
    setRelatedNotesList([]);

    const textToAnalyze = `${selectedNote.title}. ${selectedNote.content}. ${selectedNote.notesList.join(". ")}`;

    try {
      if (actionType === "summarize") {
        if (!selectedNote.content || selectedNote.content === "Overview details go here...") {
          simulateStreamingOutput("✨ **AI Summary**:\nThis note contains no custom content to summarize yet. Please add overview text or highlights first.");
          return;
        }
        // Extract key sentences dynamically
        const sentences = selectedNote.content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        const topSentences = sentences.slice(0, 3).join(". ") + ".";
        simulateStreamingOutput(`✨ **AI Summary**:\nThis document is collection categorized under "${selectedNote.folder || "Unassigned"}". Summary: ${topSentences}`);

      } else if (actionType === "actionItems") {
        // Scan text dynamically for triggers
        const sentences = textToAnalyze.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
        const keywords = ["todo", "need to", "must", "action", "task", "should", "checklist", "verify", "call", "write", "check"];
        const foundTasks = sentences.filter(s => keywords.some(k => s.toLowerCase().includes(k)));

        if (foundTasks.length > 0) {
          const listText = foundTasks.map((t, idx) => `${idx + 1}. [ ] ${t}`).join("\n");
          simulateStreamingOutput(`✨ **Extracted Actions**:\n${listText}`);
        } else {
          // Generate realistic ones based on Title and Folder
          simulateStreamingOutput(`✨ **AI Actions (Generated)**:\n1. [ ] Finalize implementation parameters for "${selectedNote.title}"\n2. [ ] Audit folder alignment within "${selectedNote.folder || "General Collections"}"\n3. [ ] Verify and catalog attached documents (${selectedNote.attachments.length} items)`);
        }

      } else if (actionType === "translate") {
        if (!selectedNote.content || selectedNote.content === "Overview details go here...") {
          simulateStreamingOutput("✨ **AI Translation**:\nNo overview content to translate.");
          return;
        }
        // Call public google translation API dynamically for real translation!
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(selectedNote.content)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const translatedText = data[0].map((x: any) => x[0]).join("");
          simulateStreamingOutput(`✨ **Spanish Translation (Real-time)**:\n${translatedText}`);
        } else {
          simulateStreamingOutput("✨ **AI Translation**:\n(Language Translation offline. Please try again.)");
        }

      } else if (actionType === "improve") {
        if (!selectedNote.content) {
          simulateStreamingOutput("✨ **AI Enhancer**:\nWrite overview details first.");
          return;
        }
        // Dynamic sentence correction & optimization
        let improved = selectedNote.content
          .replace(/\s+/g, " ")
          .replace(/\bi\b/g, "I")
          .replace(/(\b(need to|have to)\b)/gi, "must")
          .trim();
        improved = improved.charAt(0).toUpperCase() + improved.slice(1);
        simulateStreamingOutput(`✨ **AI Writing Improvement**:\n${improved}`);

      } else if (actionType === "tasks") {
        simulateStreamingOutput(`✨ **AI Task Proposals for "${selectedNote.title}"**:\n- [ ] Draft specifications for ${selectedNote.folder || "Projects"}\n- [ ] Review current tags index: ${selectedNote.tags.map(t => `#` + t).join(", ") || "#None"}\n- [ ] Confirm compliance check on attachments list`);

      } else if (actionType === "related") {
        // Dynamic semantic Jaccard similarity compare with other notes
        const currentWords = new Set((selectedNote.title + " " + selectedNote.tags.join(" ")).toLowerCase().split(/\s+/).filter(Boolean));
        
        const scored = notes
          .filter(n => n.id !== selectedNote.id)
          .map(n => {
            const words = (n.title + " " + n.tags.join(" ")).toLowerCase().split(/\s+/).filter(Boolean);
            let match = 0;
            words.forEach(w => { if (currentWords.has(w)) match++; });
            const score = match / (currentWords.size + words.length - match || 1);
            return { note: n, score };
          })
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(x => x.note);

        if (scored.length > 0) {
          setRelatedNotesList(scored);
          simulateStreamingOutput(`✨ **AI Related Documents**:\nLocated ${scored.length} matching vault items. Click a document card in the details box below to switch to it.`);
        } else {
          simulateStreamingOutput("✨ **AI Related Documents**:\nNo notes sharing similar tags or title keywords found in the local vault.");
        }
      }
    } catch {
      setAiGenerating(false);
      toast.error("AI engine encountered an error");
    }
  };

  const simulateStreamingOutput = (text: string) => {
    let currentLength = 0;
    const interval = setInterval(() => {
      setAiOutput(text.substring(0, currentLength + 4));
      currentLength += 4;
      if (currentLength >= text.length) {
        clearInterval(interval);
        setAiGenerating(false);
        toast.success("Analysis Complete");
      }
    }, 15);
  };

  // Nav routing redirect handler
  const handleNavClick = (label: string) => {
    const prefix = currentRole === "super-admin" || currentRole === "admin" 
      ? "/admin" 
      : currentRole === "manager" 
        ? "/manager" 
        : "/employee";

    switch (label.toLowerCase()) {
      case "dashboard":
        navigate(prefix);
        break;
      case "tasks":
        navigate(`${prefix}/tasks`);
        break;
      case "projects":
        navigate(currentRole === "employee" ? "/employee" : `${prefix}/company-registry`);
        break;
      case "calendar":
        navigate(`${prefix}/travel-calendar`);
        break;
      case "team":
        navigate(currentRole === "employee" ? `${prefix}/notifications` : `${prefix}/employees`);
        break;
      case "reports":
        navigate(currentRole === "employee" ? `${prefix}/settings` : `${prefix}/reports`);
        break;
      case "settings":
        navigate(`${prefix}/settings`);
        break;
      default:
        break;
    }
  };

  // Filter & Sorting Logic
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === "All" || n.tags.includes(activeTag);

    let matchesFolder = true;
    if (activeFolder === "Favorites") {
      matchesFolder = n.isFavorite;
    } else if (activeFolder === "Pinned") {
      matchesFolder = n.isPinned;
    } else if (activeFolder !== "All") {
      matchesFolder = n.folder === activeFolder;
    }

    return matchesSearch && matchesTag && matchesFolder;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortOrder === "alphabetical") {
      return a.title.localeCompare(b.title);
    } else if (sortOrder === "oldest") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    } else {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  // Group notes chronologically
  const getGroupedNotes = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const groups: { [key: string]: Note[] } = {
      "Today": [],
      "Yesterday": [],
      "Last Week": [],
      "Older": []
    };

    sortedNotes.forEach(n => {
      const noteDate = new Date(n.updatedAt);
      if (noteDate.toDateString() === today.toDateString()) {
        groups["Today"].push(n);
      } else if (noteDate.toDateString() === yesterday.toDateString()) {
        groups["Yesterday"].push(n);
      } else if (noteDate.getTime() > lastWeek.getTime()) {
        groups["Last Week"].push(n);
      } else {
        groups["Older"].push(n);
      }
    });

    return groups;
  };

  const groupedNotes = getGroupedNotes();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-[#16C784]" />;
    if (mimeType.startsWith("video/")) return <Play className="w-8 h-8 text-[#4F7CFF] fill-current" />;
    return <FileText className="w-8 h-8 text-[#EF4444]" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getWordCount = () => {
    if (!selectedNote) return 0;
    const text = (selectedNote.content || "") + " " + selectedNote.notesList.join(" ");
    return text.split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] xl:h-[calc(100vh-140px)] bg-[#0B0F17] rounded-3xl border border-[#2B313D] overflow-hidden shadow-2xl relative text-slate-100 font-sans">
      
      {/* Top Header Bar matching the screenshot & modern dashboard standard */}
      <div className="px-6 py-4 bg-[#161B22] border-b border-[#2B313D] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4F7CFF]/10 rounded-xl text-[#4F7CFF] border border-[#4F7CFF]/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Knowledge Vault</span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#4F7CFF] animate-pulse mt-0.5" />
            </h1>
            <p className="text-[10px] text-[#9CA3AF] font-mono tracking-wider">Your centralized intelligence chamber.</p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search notes, documents, tags, and more..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 w-full rounded-xl bg-[#0B0F17] border-[#2B313D] focus-visible:ring-[#4F7CFF]/20 text-xs text-slate-200 placeholder:text-gray-500"
          />
        </div>

        {/* User profile / Actions */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleCreateNote}
            className="rounded-xl h-9 px-4 bg-[#4F7CFF] hover:bg-[#3d65df] text-white font-bold text-xs gap-1.5 shadow-lg shadow-[#4F7CFF]/15"
          >
            <Plus className="w-4 h-4" /> Quick Add
          </Button>

          <div className="relative p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors">
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="flex items-center gap-2 border-l border-[#2B313D] pl-4">
            <div className="w-8 h-8 rounded-full bg-[#4F7CFF]/25 text-[#4F7CFF] border border-[#4F7CFF]/35 flex items-center justify-center text-xs font-bold font-mono">
              {currentUsername.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200">{currentUsername}</p>
              <p className="text-[8px] text-[#9CA3AF] uppercase font-mono tracking-wider">{currentRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Panel Container */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        
        {/* COLUMN 1: LEFT SIDEBAR (280px) */}
        <AnimatePresence initial={false}>
          {(sidebarOpen || !isMobile) && (
            <motion.div 
              initial={isMobile ? { x: -280, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1, width: 280 }}
              exit={{ x: -280, opacity: 0 }}
              className={cn(
                "h-full border-r border-[#2B313D] bg-[#161B22] flex flex-shrink-0 flex-col z-30 justify-between",
                isMobile ? "absolute inset-y-0 left-0" : "relative"
              )}
            >
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-6">
                  
                  {/* System Views / Navigation */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2.5 mb-1.5">NAVIGATION</p>
                    {[
                      { label: "Dashboard", icon: Grid, active: false, count: null },
                      { label: "Tasks", icon: CheckSquare, active: false, count: null },
                      { label: "Projects", icon: FolderIcon, active: false, count: null },
                      { label: "Calendar", icon: CalendarIcon, active: false, count: null },
                      { label: "Knowledge Vault", icon: BookOpen, active: activeFolder === "All", count: notes.length },
                      { label: "Favorites", icon: Star, active: activeFolder === "Favorites", count: notes.filter(n => n.isFavorite).length },
                      { label: "Pinned Notes", icon: Pin, active: activeFolder === "Pinned", count: notes.filter(n => n.isPinned).length }
                    ].map(nav => (
                      <button 
                        key={nav.label}
                        onClick={() => {
                          if (nav.label === "Favorites") setActiveFolder("Favorites");
                          else if (nav.label === "Pinned Notes") setActiveFolder("Pinned");
                          else if (nav.label === "Knowledge Vault") setActiveFolder("All");
                          else handleNavClick(nav.label);
                        }} 
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                          nav.active ? "bg-[#4F7CFF]/15 text-[#4F7CFF] font-bold border-l-2 border-[#4F7CFF] pl-2.5" : "text-[#9CA3AF] hover:bg-gray-800/40 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <nav.icon className="w-4 h-4" />
                          <span>{nav.label}</span>
                        </div>
                        {nav.count !== null && (
                          <Badge variant="outline" className="h-4.5 text-[9px] border-gray-700 bg-gray-800/40 text-gray-400 font-mono">{nav.count}</Badge>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Collections Section */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2.5 mb-1.5">COLLECTIONS</p>
                    {customFolders.map(folder => (
                      <button 
                        key={folder}
                        onClick={() => setActiveFolder(folder)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-xl transition-all",
                          activeFolder === folder ? "bg-[#4F7CFF]/10 text-[#4F7CFF] font-bold" : "text-[#9CA3AF] hover:bg-gray-800/30 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderIcon className={cn("w-3.5 h-3.5 flex-shrink-0", activeFolder === folder ? "text-[#4F7CFF] fill-[#4F7CFF]/10" : "text-gray-500")} />
                          <span className="truncate">{folder}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-650">
                          {notes.filter(n => n.folder === folder).length || ""}
                        </span>
                      </button>
                    ))}

                    <form onSubmit={handleAddFolder} className="flex gap-1.5 p-1 mt-2">
                      <Input 
                        placeholder="Add Collection..." 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="h-8 text-xs bg-[#0B0F17] border-[#2B313D] rounded-lg placeholder:text-gray-600 focus-visible:ring-[#4F7CFF]/10"
                      />
                      <Button size="icon" className="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-slate-300">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2.5">TAGS</p>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      <button 
                        onClick={() => setActiveTag("All")}
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase border transition-all",
                          activeTag === "All" 
                            ? "bg-[#4F7CFF] border-[#4F7CFF] text-white" 
                            : "bg-gray-900 border-[#2B313D] text-[#9CA3AF] hover:bg-gray-800"
                        )}
                      >
                        All
                      </button>
                      {customTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase border transition-all flex items-center gap-1",
                            activeTag === tag
                              ? "bg-[#4F7CFF] border-[#4F7CFF] text-white"
                              : "bg-gray-900 border-[#2B313D] text-[#9CA3AF] hover:bg-gray-800"
                          )}
                        >
                          <span>#{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COLUMN 2: SECOND PANEL (320px) */}
        <div className="w-full lg:w-80 h-full border-r border-[#2B313D] bg-[#0B0F17] flex flex-shrink-0 flex-col z-20">
          
          {/* Header & Tools */}
          <div className="p-4 border-b border-[#2B313D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm tracking-wider uppercase text-white flex items-center gap-1.5">
                <span>All Notes</span>
                {activeFolder !== "All" && (
                  <span className="text-[9px] uppercase font-mono text-[#4F7CFF] bg-[#4F7CFF]/10 px-1.5 py-0.5 rounded">
                    {activeFolder}
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                  className="h-7 w-7 rounded-lg border border-gray-800 bg-[#111827] text-gray-400 hover:text-white"
                  title="Toggle Grid/List"
                >
                  {viewMode === "list" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                </Button>

                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setSortOrder(sortOrder === "newest" ? "alphabetical" : sortOrder === "alphabetical" ? "oldest" : "newest")}
                  className="h-7 w-7 rounded-lg border border-gray-800 bg-[#111827] text-gray-400 hover:text-white"
                  title={`Sort Order: ${sortOrder}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-505" />
              <Input 
                placeholder="Search note overview..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full rounded-xl bg-[#111827] border-[#2B313D] focus-visible:ring-[#4F7CFF]/20 text-xs text-slate-200 placeholder:text-gray-605"
              />
            </div>
          </div>

          {/* Chronological card list */}
          <ScrollArea className="flex-1 p-2 bg-[#090D14]">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#4F7CFF]" />
                <p className="text-xs">Accessing vault records...</p>
              </div>
            ) : sortedNotes.length === 0 ? (
              <div className="text-center py-20 text-gray-600 italic text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-25" />
                No records match current filter
              </div>
            ) : (
              <div className="space-y-4 pb-6 px-1">
                {["Today", "Yesterday", "Last Week", "Older"].map(dateGroup => {
                  const notesInGroup = groupedNotes[dateGroup];
                  if (!notesInGroup || notesInGroup.length === 0) return null;
                  return (
                    <div key={dateGroup} className="space-y-1.5">
                      <p className="text-[9px] font-extrabold text-gray-500 tracking-widest px-2 uppercase">{dateGroup}</p>
                      
                      <div className={cn(
                        viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-1.5"
                      )}>
                        {notesInGroup.map(n => (
                          <NoteCard 
                            key={n.id} 
                            note={n} 
                            isSelected={selectedNote?.id === n.id}
                            viewMode={viewMode}
                            onClick={() => selectNote(n)}
                            onPin={(e) => togglePin(n.id, e)}
                            onFavorite={(e) => toggleFavorite(n.id, e)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* COLUMN 3: MAIN EDITOR CANVAS */}
        <div className="flex-1 flex flex-col bg-[#070A0F] overflow-hidden relative border-r border-[#2B313D]">
          
          <div className="absolute left-2 top-4 z-10 flex gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-7 h-10 rounded-lg border border-[#2B313D] bg-[#161B22]/85 backdrop-blur-md shadow-lg hover:bg-gray-800 hover:text-white"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {selectedNote ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Cover Hero Image */}
              <div className="h-32 sm:h-44 w-full relative overflow-hidden flex-shrink-0 group/cover">
                <img 
                  src={HERO_COVER_IMAGES[coverImageIndex]} 
                  alt="Vault Cover" 
                  className="w-full h-full object-cover brightness-[0.4] group-hover/cover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5">
                  <Badge className="bg-[#4F7CFF]/85 text-white border-none rounded-lg px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                    SECURED NODE
                  </Badge>
                </div>
              </div>

              {/* Rich Visual Editor Area */}
              <ScrollArea className="flex-1 px-6 sm:px-10 py-6">
                <div className="max-w-3xl mx-auto w-full space-y-8 pb-12">
                  
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <span className="hover:underline cursor-pointer text-slate-400">Projects</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <span className="hover:underline cursor-pointer text-slate-300">{selectedNote.folder || "Knowledge Vault"}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <span className="text-slate-100 truncate max-w-[150px]">{selectedNote.title || "Untitled Note"}</span>
                  </div>

                  {/* Note header actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-850 pb-5">
                    
                    {isEditing ? (
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl sm:text-3xl font-extrabold bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:text-gray-700 text-slate-100"
                        placeholder="Enter Vault Document Title..."
                      />
                    ) : (
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        {selectedNote.title || "Untitled Vault Document"}
                      </h1>
                    )}

                    <div className="flex items-center gap-2 self-end">
                      <div className="flex items-center mr-2 border border-[#2B313D] bg-gray-900/40 rounded-xl p-1">
                        {COLORS.map(c => (
                          <button 
                            key={c.name}
                            onClick={() => updateColor(selectedNote.id, c.value)}
                            className={cn(
                              "w-3.5 h-3.5 rounded-full border border-gray-800 mr-1 transition-transform hover:scale-125",
                              selectedNote.color === c.value && "ring-1 ring-[#4F7CFF] ring-offset-1 ring-offset-[#0B0F17] scale-110"
                            )}
                            style={{ backgroundColor: c.value === "transparent" ? "#fff" : c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>

                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => selectNote(selectedNote)} className="h-8 rounded-xl text-xs gap-1 border border-[#2B313D]">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveNote} className="h-8 rounded-xl text-xs gap-1 bg-[#4F7CFF] hover:bg-[#3d65df] text-white font-bold px-3">
                            <Check className="w-3.5 h-3.5" /> Save Note
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 rounded-xl text-xs gap-1 border border-[#2B313D] bg-[#111827] text-[#4F7CFF] hover:bg-[#4F7CFF]/10">
                          <FileText className="w-3.5 h-3.5" /> Edit Canvas
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Rich Text Editor Toolbars */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#161B22] border border-[#2B313D] rounded-2xl">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><Bold className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><Italic className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><Underline className="w-4 h-4" /></Button>
                    <div className="w-[1px] h-4 bg-gray-800 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><ListIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><TableIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><ImageIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><LinkIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><FileCode className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"><CheckSquare className="w-4 h-4" /></Button>
                  </div>

                  {/* SECTION 1: Overview */}
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#4F7CFF]" />
                      Overview
                    </h3>
                    {isEditing ? (
                      <Textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-base leading-relaxed bg-[#0b0f17]/40 border border-[#2B313D] rounded-2xl p-3.5 resize-none focus-visible:ring-[#4F7CFF]/15 placeholder:text-gray-705 text-slate-205"
                        placeholder="Enter document overview..."
                        rows={4}
                      />
                    ) : (
                      <div className="bg-[#111827]/40 border border-[#2B313D]/40 p-4.5 rounded-2xl shadow-sm">
                        <p className="text-sm leading-relaxed text-slate-350 whitespace-pre-wrap">
                          {selectedNote.content || <span className="opacity-30 italic">Describe this vault node...</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Assistant Output Card */}
                  {aiOutput && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 rounded-2xl p-5 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4F7CFF] mb-2 uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 animate-spin text-[#4F7CFF]" />
                        <span>AI Output Stream</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-mono">{aiOutput}</p>
                      
                      {/* Render Dynamic Related Note Selection Cards */}
                      {relatedNotesList.length > 0 && (
                        <div className="mt-4 border-t border-[#4F7CFF]/10 pt-3 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-[#4F7CFF]/80 tracking-widest">Dynamic Connections:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {relatedNotesList.map(n => (
                              <button 
                                key={n.id} 
                                onClick={() => selectNote(n)}
                                className="text-left bg-black/35 hover:bg-[#4F7CFF]/20 p-2.5 border border-[#2B313D] rounded-xl text-xs flex items-center justify-between group transition-all"
                              >
                                <span className="font-bold truncate text-slate-200 group-hover:text-white">{n.title}</span>
                                <CornerDownRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#4F7CFF]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => { setAiOutput(""); setRelatedNotesList([]); }}
                        className="absolute top-3 right-3 p-1 hover:bg-[#4F7CFF]/25 rounded text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* SECTION 2: Checklist / Action Items */}
                  <div className="space-y-3 bg-[#161B22]/40 border border-[#2B313D] p-5.5 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-[#16C784]" />
                        Action Items
                      </h3>
                      <span className="text-[9px] text-[#9CA3AF] font-mono">
                        {actionItems.filter(i => i.completed).length} / {actionItems.length} Done
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-[#0b0f17]/60 p-2.5 rounded-xl border border-gray-850">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input 
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleActionItem(idx)}
                              className="h-4 w-4 rounded border-[#2B313D] bg-gray-950 text-[#16C784] focus:ring-[#16C784] focus:ring-offset-gray-900"
                            />
                            <span className={cn(
                              "text-sm font-semibold truncate",
                              item.completed ? "line-through text-gray-500" : "text-slate-200"
                            )}>
                              {item.text}
                            </span>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveActionItem(idx)} className="h-6.5 w-6.5 text-gray-500 hover:text-[#EF4444] rounded-md">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}

                      {actionItems.length === 0 && (
                        <p className="text-xs text-gray-655 italic p-1">No action items defined yet.</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Input 
                          placeholder="Add new checklist target..."
                          value={newActionItem}
                          onChange={(e) => setNewActionItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddActionItem();
                            }
                          }}
                          className="h-9 text-xs bg-gray-900 border-gray-800 rounded-xl placeholder:text-gray-600 text-slate-200"
                        />
                        <Button onClick={handleAddActionItem} className="h-9 text-xs rounded-xl bg-[#16C784]/10 hover:bg-[#16C784]/25 text-[#16C784] border border-[#16C784]/20 font-bold px-3">
                          Add Task
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Notes Highlights */}
                  <div className="space-y-3 bg-[#161B22]/40 border border-[#2B313D] p-5.5 rounded-2xl">
                    <div className="border-b border-gray-800 pb-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ListPlus className="w-4 h-4 text-purple-400" />
                        Key Highlights
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {notesList.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 bg-[#0b0f17]/60 p-2.5 rounded-xl border border-gray-850">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="text-purple-400 font-bold mt-0.5">•</span>
                            <p className="text-sm text-slate-350 leading-relaxed break-words flex-1">
                              {item}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveNoteListItem(idx)} className="h-6.5 w-6.5 text-gray-500 hover:text-[#EF4444] rounded-md flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}

                      {notesList.length === 0 && (
                        <p className="text-xs text-gray-655 italic p-1">No highlights bullets defined.</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Input 
                          placeholder="Add bullet item..."
                          value={newNoteListItem}
                          onChange={(e) => setNewNoteListItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddNoteListItem();
                            }
                          }}
                          className="h-9 text-xs bg-gray-900 border-gray-800 rounded-xl placeholder:text-gray-600 text-slate-200"
                        />
                        <Button onClick={handleAddNoteListItem} className="h-9 text-xs rounded-xl bg-purple-600/10 hover:bg-purple-600/25 text-purple-400 border border-purple-500/20 font-bold px-3">
                          Add Bullet
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Attachments Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#4F7CFF]" />
                        Attachments Grid ({attachments.length})
                      </h3>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[9px] gap-1 hover:bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/10 rounded-lg px-2.5 font-bold"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </Button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {attachments.map((file, idx) => (
                        <Card key={idx} className="bg-[#111827] border-[#2B313D] hover:border-gray-700/60 shadow-md flex flex-col justify-between p-3.5 rounded-xl group/att relative overflow-hidden transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-950 rounded-lg border border-gray-855">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-100 truncate" title={file.fileName}>{file.fileName}</p>
                              <p className="text-[9px] text-[#9CA3AF] font-mono mt-0.5">{formatBytes(file.size)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end mt-4 border-t border-gray-800/60 pt-2">
                            <a 
                              href={file.url} 
                              download={file.fileName}
                              className="p-1 text-gray-400 hover:text-blue-400 bg-gray-950 rounded border border-gray-800 hover:border-blue-500/20"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <Button 
                              onClick={() => handleRemoveAttachment(idx)}
                              variant="ghost" 
                              size="icon" 
                              className="h-6.5 w-6.5 text-gray-500 hover:text-[#EF4444] hover:bg-red-500/10 rounded-md"
                              title="Delete Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </Card>
                      ))}

                      {attachments.length === 0 && (
                        <div className="col-span-full text-center py-8 border border-dashed border-[#2B313D]/50 rounded-2xl text-gray-600 text-xs">
                          Empty grid. Drop PDF, Image, Video, or Folders here.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </ScrollArea>

              {/* Editor Footer Status */}
              <div className="h-10 bg-[#161B22] border-t border-[#2B313D] px-6 flex items-center justify-between text-[10px] text-[#9CA3AF] font-mono flex-shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span>{getWordCount()} words</span>
                  <span>•</span>
                  <span>{selectedNote.content.length} characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#16C784]">
                  <div className="w-1.5 h-1.5 bg-[#16C784] rounded-full animate-ping" />
                  <span>Draft saved locally</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-24 h-24 rounded-full bg-[#4F7CFF]/5 border border-[#4F7CFF]/10 flex items-center justify-center relative">
                 <BookOpen className="w-10 h-10 text-[#4F7CFF] opacity-40" />
                 <div className="absolute inset-0 bg-[#4F7CFF]/20 blur-2xl rounded-full opacity-20" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Knowledge Core</h3>
                <p className="text-muted-foreground max-w-[280px] mx-auto text-sm leading-relaxed text-[#9CA3AF]">
                  Organize your corporate collections, project highlights, folders, and secure checklists.
                </p>
              </div>
              <Button onClick={handleCreateNote} className="rounded-2xl h-11 px-8 shadow-xl shadow-[#4F7CFF]/15 bg-[#4F7CFF] hover:bg-[#3d65df] text-white font-bold gap-2">
                <Plus className="w-5 h-5" /> Initialize Note
              </Button>
            </div>
          )}
        </div>

        {/* COLUMN 4: RIGHT PANEL (300px) */}
        <AnimatePresence>
          {(detailsOpen && selectedNote) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden xl:flex h-full bg-[#161B22] flex-shrink-0 flex-col z-20"
            >
              <div className="p-4 border-b border-[#2B313D] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings & AI</h3>
                <Button size="icon" variant="ghost" onClick={() => setDetailsOpen(false)} className="h-7 w-7 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  
                  {/* Note Details Section */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Note Details</p>
                    <div className="space-y-3 bg-[#0B0F17]/60 p-3.5 border border-[#2B313D] rounded-2xl font-mono text-[10px] text-gray-405 shadow-sm">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-slate-350 font-bold">{format(new Date(selectedNote.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="text-slate-350 font-bold">{format(new Date(selectedNote.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Author:</span>
                        <span className="text-[#4F7CFF] font-bold">{currentUsername}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Access:</span>
                        <span className="text-[#16C784] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private Node
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sharing:</span>
                        <span className="text-[#9CA3AF] flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Not Shared
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Assistant Panel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                      <p className="text-[9px] font-bold text-[#4F7CFF] uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#4F7CFF] fill-[#4F7CFF]/10 animate-bounce" />
                        <span>AI Assistant Panel</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Summarize", action: "summarize" },
                        { label: "Action Items", action: "actionItems" },
                        { label: "Translate", action: "translate" },
                        { label: "Improve Writing", action: "improve" },
                        { label: "Generate Tasks", action: "tasks" },
                        { label: "Find Related", action: "related" }
                      ].map(aiBtn => (
                        <Button 
                          key={aiBtn.label}
                          disabled={aiGenerating}
                          onClick={() => runAiAssistant(aiBtn.action)}
                          className="h-8.5 rounded-xl border border-gray-800 bg-[#0B0F17]/50 text-slate-350 hover:text-white hover:bg-[#4F7CFF]/10 font-bold text-[10px] w-full text-center transition-all"
                        >
                          {aiGenerating && aiBtn.action === "summarize" ? (
                            <Clock className="w-3 h-3 animate-spin mr-1 text-[#4F7CFF]" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-[#4F7CFF]/60 mr-1" />
                          )}
                          {aiBtn.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Standard Tools Section */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Document Tools</p>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleFavorite(selectedNote.id)}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800/85 hover:text-white rounded-xl gap-2.5 text-[#9CA3AF]"
                    >
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]/10" />
                      <span>{selectedNote.isFavorite ? "Remove Favorite" : "Add to Favorites"}</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={handleDuplicateNote}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800/85 hover:text-white rounded-xl gap-2.5 text-[#9CA3AF]"
                    >
                      <Copy className="w-4 h-4 text-[#4F7CFF]" />
                      <span>Duplicate Document</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={exportNoteAsTxt}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800/85 hover:text-white rounded-xl gap-2.5 text-[#9CA3AF]"
                    >
                      <Download className="w-4 h-4 text-[#16C784]" />
                      <span>Export Text File</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="w-full justify-start text-xs font-semibold hover:bg-red-955/20 hover:text-[#EF4444] rounded-xl gap-2.5 text-[#EF4444]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Vault Note</span>
                    </Button>
                  </div>

                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  viewMode: "list" | "grid";
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onFavorite: (e: React.MouseEvent) => void;
}

function NoteCard({ note, isSelected, viewMode, onClick, onPin, onFavorite }: NoteCardProps) {
  const accentColor = note.isPinned ? "#A855F7" : "#4F7CFF";
  
  if (viewMode === "grid") {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "group relative p-3 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between min-h-[110px] bg-[#111827] shadow-sm",
          isSelected 
            ? "border-[#4F7CFF]/55 bg-[#4F7CFF]/5" 
            : "border-[#2B313D] hover:bg-[#161B22]"
        )}
      >
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-1">
            <h4 className={cn("font-bold text-[11px] truncate flex-1", isSelected ? "text-[#4F7CFF]" : "text-slate-100")}>
              {note.title || "Untitled Document"}
            </h4>
          </div>
          <p className="text-[9px] text-[#9CA3AF] line-clamp-3 leading-normal font-medium">
            {note.content || "No details..."}
          </p>
        </div>

        <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-gray-800/40 text-[8px] text-[#9CA3AF]">
          <span>{format(new Date(note.updatedAt), "MMM d")}</span>
          {note.isFavorite && <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-current" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "group relative p-3.5 rounded-2xl cursor-pointer transition-all border flex gap-3 min-h-[92px] items-center justify-between",
        isSelected 
          ? "bg-[#4F7CFF]/5 border-[#4F7CFF]/45 shadow-lg shadow-[#4F7CFF]/5" 
          : "bg-[#111827] border-[#2B313D] hover:bg-[#161B22]"
      )}
      style={{
        borderLeftColor: accentColor,
        borderLeftWidth: "3px"
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden relative border border-[#2B313D] bg-gradient-to-br from-[#161B22] to-gray-900 flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-600 group-hover:text-[#4F7CFF]/70 transition-colors" />
          {note.isPinned && (
            <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-purple-500 rounded-full" />
          )}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <h4 className={cn("font-bold text-xs truncate", isSelected ? "text-[#4F7CFF]" : "text-slate-100")}>
              {note.title || "Untitled Document"}
            </h4>
          </div>
          
          <p className="text-[10px] text-[#9CA3AF] line-clamp-1 leading-relaxed font-medium">
            {note.content || "Empty document..."}
          </p>

          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[8px] px-1.5 py-0.2 bg-[#0B0F17] text-gray-400 rounded-md border border-[#2B313D]/60 uppercase tracking-tight font-bold">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between h-full min-h-[50px] flex-shrink-0">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onFavorite}
            className={cn("p-0.5 rounded text-gray-500 hover:text-[#F59E0B]", note.isFavorite && "opacity-100 text-[#F59E0B]")}
          >
            <Star className={cn("w-3.5 h-3.5", note.isFavorite && "fill-current")} />
          </button>
          <button 
            onClick={onPin}
            className={cn("p-0.5 rounded text-gray-500 hover:text-purple-400", note.isPinned && "opacity-100 text-purple-400")}
          >
            <Pin className={cn("w-3.5 h-3.5", note.isPinned && "fill-current")} />
          </button>
        </div>

        <span className="text-[8px] font-bold font-mono text-[#9CA3AF] uppercase">
          {format(new Date(note.updatedAt), "MMM d")}
        </span>
      </div>
    </motion.div>
  );
}
