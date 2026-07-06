import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Calendar, 
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
  ImageIcon,
  Play,
  Upload,
  CheckSquare,
  ListPlus
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
  "Legal",
  "Employees",
  "SOPs & Procedures",
  "Projects",
  "Research",
  "Ideas",
  "Personal",
  "Finance",
  "Marketing",
  "Vehicles",
  "Properties"
];

const COLORS = [
  { name: "Default", value: "rgba(30, 41, 59, 0.5)" },
  { name: "Blue", value: "rgba(59, 130, 246, 0.15)" },
  { name: "Green", value: "rgba(34, 197, 94, 0.15)" },
  { name: "Yellow", value: "rgba(234, 179, 8, 0.15)" },
  { name: "Red", value: "rgba(239, 68, 68, 0.15)" },
  { name: "Purple", value: "rgba(168, 85, 247, 0.15)" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
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
      const initialFolder = activeFolder !== "All" && activeFolder !== "Favorites" && activeFolder !== "Pinned" ? activeFolder : "";
      const initialTags = activeTag !== "All" ? [activeTag] : [];
      
      const { item } = await createNote({ 
        title: "New Note Document", 
        content: "Provide a quick overview or introduction for this knowledge note.", 
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
      toast.success("Knowledge note created");
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
    setIsEditing(false);
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
      toast.success("Knowledge Vault saved successfully");
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
      toast.success("Note deleted");
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
    toast.success("Folder category created");
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
      toast.success(`${file.name} uploaded`);

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
        toast.success("Attachment deleted");
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

  // Filter logic
  const filteredNotes = notes.filter(n => {
    // Search query match
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag match
    const matchesTag = activeTag === "All" || n.tags.includes(activeTag);

    // Folder match
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

  // Group notes chronologically
  const getGroupedNotes = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const groups: { [key: string]: Note[] } = {
      "TODAY": [],
      "YESTERDAY": [],
      "OLDER": []
    };

    filteredNotes.forEach(n => {
      const noteDate = new Date(n.updatedAt);
      if (noteDate.toDateString() === today.toDateString()) {
        groups["TODAY"].push(n);
      } else if (noteDate.toDateString() === yesterday.toDateString()) {
        groups["YESTERDAY"].push(n);
      } else {
        groups["OLDER"].push(n);
      }
    });

    return groups;
  };

  const groupedNotes = getGroupedNotes();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <TagIcon className="w-8 h-8 text-green-500" />;
    if (mimeType.startsWith("video/")) return <Play className="w-8 h-8 text-blue-500 fill-current" />;
    return <FileText className="w-8 h-8 text-red-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        actionItems: selectedNote.actionItems,
        notesList: selectedNote.notesList,
        attachments: selectedNote.attachments
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
      toast.success("Note duplicated");
    } catch {
      toast.error("Failed to duplicate note");
    }
  };

  const exportNoteAsTxt = () => {
    if (!selectedNote) return;
    let exportText = `TITLE: ${selectedNote.title}\n`;
    exportText += `COLLECTION: ${selectedNote.folder || "Unclassified"}\n`;
    exportText += `TAGS: ${selectedNote.tags.join(", ") || "None"}\n`;
    exportText += `LAST UPDATED: ${new Date(selectedNote.updatedAt).toLocaleString()}\n\n`;
    exportText += `OVERVIEW:\n${selectedNote.content}\n\n`;
    
    if (selectedNote.actionItems.length > 0) {
      exportText += `ACTION ITEMS:\n`;
      selectedNote.actionItems.forEach(item => {
        exportText += ` [${item.completed ? "x" : " "}] ${item.text}\n`;
      });
      exportText += `\n`;
    }

    if (selectedNote.notesList.length > 0) {
      exportText += `NOTES & HIGHLIGHTS:\n`;
      selectedNote.notesList.forEach(item => {
        exportText += ` - ${item}\n`;
      });
    }

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedNote.title.replace(/\s+/g, "_")}_Knowledge_Vault.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Note exported as text file");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] xl:h-[calc(100vh-140px)] bg-[#0B0F17] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl relative text-slate-100">
      
      {/* Top Header Bar matching the screenshot */}
      <div className="px-6 py-4 bg-[#0a0e16] border-b border-gray-850 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>Knowledge Vault</span>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse mt-1" />
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">Your centralized knowledge. Anytime. Anywhere.</p>
        </div>

        {/* Global Search */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search notes, documents, tags, and more..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full rounded-xl bg-gray-900 border-gray-800 focus-visible:ring-blue-500/20 text-xs text-slate-200 placeholder:text-gray-650"
          />
        </div>

        {/* User profile / Actions */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleCreateNote}
            className="rounded-xl h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-lg shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" /> Quick Add
          </Button>

          <div className="relative p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white cursor-pointer transition-colors">
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
              NR
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200">Nathan Reardon</p>
              <p className="text-[8px] text-gray-500 uppercase font-mono tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN CONTAINER */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        
        {/* COLUMN 1: Navigation & Collections Sidebar */}
        <AnimatePresence initial={false}>
          {(sidebarOpen || !isMobile) && (
            <motion.div 
              initial={isMobile ? { x: -300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1, width: 280 }}
              exit={{ x: -300, opacity: 0 }}
              className={cn(
                "h-full border-r border-gray-800 bg-[#0e1420] flex flex-shrink-0 flex-col z-30",
                isMobile ? "absolute inset-y-0 left-0" : "relative"
              )}
            >
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-6">
                  
                  {/* Favorites & System views */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2.5 mb-1.5">NAVIGATION</p>
                    <button 
                      onClick={() => setActiveFolder("All")} 
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                        activeFolder === "All" ? "bg-blue-600/10 text-blue-400 font-bold" : "text-gray-400 hover:bg-gray-800/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>All Documents</span>
                      </div>
                      <Badge variant="outline" className="h-4 text-[9px] border-gray-700 bg-gray-800 text-gray-400 font-mono">{notes.length}</Badge>
                    </button>

                    <button 
                      onClick={() => setActiveFolder("Favorites")} 
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                        activeFolder === "Favorites" ? "bg-amber-600/10 text-amber-400 font-bold" : "text-gray-400 hover:bg-gray-800/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-500/20 text-amber-500" />
                        <span>Favorites</span>
                      </div>
                      <Badge variant="outline" className="h-4 text-[9px] border-gray-700 bg-gray-800 text-gray-400 font-mono">
                        {notes.filter(n => n.isFavorite).length}
                      </Badge>
                    </button>

                    <button 
                      onClick={() => setActiveFolder("Pinned")} 
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                        activeFolder === "Pinned" ? "bg-purple-600/10 text-purple-400 font-bold" : "text-gray-400 hover:bg-gray-800/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Pin className="w-4 h-4 text-purple-400" />
                        <span>Pinned Notes</span>
                      </div>
                      <Badge variant="outline" className="h-4 text-[9px] border-gray-700 bg-gray-800 text-gray-400 font-mono">
                        {notes.filter(n => n.isPinned).length}
                      </Badge>
                    </button>
                  </div>

                  {/* Collections / Folders */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2.5 mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">COLLECTIONS</p>
                    </div>
                    
                    {customFolders.map(folder => (
                      <button 
                        key={folder}
                        onClick={() => setActiveFolder(folder)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl transition-all",
                          activeFolder === folder ? "bg-blue-600/15 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5" : "text-gray-400 hover:bg-gray-800/30"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderIcon className={cn("w-3.5 h-3.5 flex-shrink-0", activeFolder === folder ? "text-blue-400 fill-blue-400/20" : "text-gray-500")} />
                          <span className="truncate">{folder}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-600">
                          {notes.filter(n => n.folder === folder).length || ""}
                        </span>
                      </button>
                    ))}

                    {/* Add Folder Form */}
                    <form onSubmit={handleAddFolder} className="flex gap-1.5 p-1 mt-2">
                      <Input 
                        placeholder="Add Category..." 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="h-8 text-xs bg-gray-900 border-gray-800 rounded-lg placeholder:text-gray-650"
                      />
                      <Button size="icon" className="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-slate-300">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>

                  {/* Tag Filters */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2.5">TAGS</p>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      <button 
                        onClick={() => setActiveTag("All")}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border transition-all",
                          activeTag === "All" 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800"
                        )}
                      >
                        All Tags
                      </button>
                      {customTags.map(tag => {
                        const noteCount = notes.filter(n => n.tags?.includes(tag)).length;
                        if (noteCount === 0 && !["AI", "Important", "Meeting", "Ideas"].includes(tag)) return null;
                        return (
                          <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border transition-all flex items-center gap-1",
                              activeTag === tag
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800"
                            )}
                          >
                            <span>#{tag}</span>
                            <span className="opacity-40 font-mono text-[8px]">{noteCount}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Tag Form */}
                    <form onSubmit={handleAddTag} className="flex gap-1.5 p-1 mt-2">
                      <Input 
                        placeholder="#Add Tag..." 
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="h-8 text-xs bg-gray-900 border-gray-800 rounded-lg placeholder:text-gray-650"
                      />
                      <Button size="icon" className="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-slate-300">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>

                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COLUMN 2: All Notes List with Date Groups */}
        <div className="w-full lg:w-80 h-full border-r border-gray-800 bg-[#090D14] flex flex-shrink-0 flex-col z-20">
          <div className="p-4 border-b border-gray-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
                <span>{activeFolder === "All" ? "All Notes" : activeFolder === "Favorites" ? "Favorites" : activeFolder === "Pinned" ? "Pinned" : activeFolder}</span>
                {activeTag !== "All" && <span className="text-[9px] uppercase font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">#{activeTag}</span>}
              </h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-505" />
              <Input 
                placeholder="Search note contents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full rounded-xl bg-gray-900 border-gray-800 focus-visible:ring-blue-500/20 text-xs text-slate-200 placeholder:text-gray-650"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-2 bg-gradient-to-b from-[#090D14] to-[#0A0E16]">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500/40" />
                <p className="text-xs">Loading Knowledge Vault...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 text-gray-600 italic text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-25" />
                No notes found in filter
              </div>
            ) : (
              <div className="space-y-4 pb-6 px-1">
                {["TODAY", "YESTERDAY", "OLDER"].map(dateGroup => {
                  const notesInGroup = groupedNotes[dateGroup];
                  if (notesInGroup.length === 0) return null;
                  return (
                    <div key={dateGroup} className="space-y-1.5">
                      <p className="text-[9px] font-bold text-gray-600 tracking-widest px-2">{dateGroup}</p>
                      {notesInGroup.map(n => (
                        <NoteCard 
                          key={n.id} 
                          note={n} 
                          isSelected={selectedNote?.id === n.id}
                          onClick={() => selectNote(n)}
                          onPin={(e) => togglePin(n.id, e)}
                          onFavorite={(e) => toggleFavorite(n.id, e)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* COLUMN 3: Rich-Text Editor & Attachments Canvas */}
        <div className="flex-1 flex flex-col bg-[#070A0F] overflow-hidden relative">
          
          <div className="absolute left-2 top-4 z-10 flex gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-7 h-10 rounded-lg border border-gray-800 bg-[#0e1420]/80 backdrop-blur-md shadow-lg hover:bg-gray-800 hover:text-white"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {selectedNote ? (
            <ScrollArea className="flex-1 p-4 sm:p-8 md:p-10">
              <div className="max-w-3xl mx-auto w-full space-y-8 pb-12">
                
                {/* Note Header / Meta Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <FolderIcon className="w-4 h-4 text-blue-400" />
                    <span className="hover:underline cursor-pointer text-gray-300">{selectedNote.folder || "Unclassified"}</span>
                    <span>/</span>
                    <span className="text-slate-100 truncate max-w-[150px]">{selectedNote.title || "Untitled Note"}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end">
                    <div className="flex items-center mr-2 border border-gray-800 bg-gray-900/40 rounded-xl p-1">
                      {COLORS.map(c => (
                        <button 
                          key={c.name}
                          onClick={() => updateColor(selectedNote.id, c.value)}
                          className={cn(
                            "w-3.5 h-3.5 rounded-full border border-gray-800 mr-1 transition-transform hover:scale-125",
                            selectedNote.color === c.value && "ring-1 ring-blue-500 ring-offset-1 ring-offset-[#0B0F17] scale-110"
                          )}
                          style={{ backgroundColor: c.value === "transparent" ? "#fff" : c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={(e) => toggleFavorite(selectedNote.id, e)}
                      className={cn("h-8 w-8 rounded-lg hover:bg-gray-800/80 border border-gray-800", selectedNote.isFavorite && "text-amber-500 fill-amber-500/10")}
                    >
                      <Star className="w-4 h-4" />
                    </Button>

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={(e) => togglePin(selectedNote.id, e)}
                      className={cn("h-8 w-8 rounded-lg hover:bg-gray-800/80 border border-gray-800", selectedNote.isPinned && "text-purple-400")}
                    >
                      <Pin className="w-4 h-4" />
                    </Button>

                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => selectNote(selectedNote)} className="h-8 rounded-xl text-xs gap-1 border border-gray-800">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveNote} className="h-8 rounded-xl text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3">
                          <Check className="w-3.5 h-3.5" /> Save Note
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 rounded-xl text-xs gap-1 border border-gray-850 bg-gray-900/30 text-blue-400 hover:bg-blue-600/10">
                        <FileText className="w-3.5 h-3.5" /> Edit Canvas
                      </Button>
                    )}
                  </div>
                </div>

                {/* Title & Document Details */}
                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-3xl sm:text-4xl font-extrabold bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:text-gray-700 text-slate-100"
                        placeholder="Enter Vault Document Title..."
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0e1420]/40 p-4 border border-gray-800/60 rounded-2xl">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Collection Folder</label>
                          <select 
                            value={editFolder}
                            onChange={(e) => setEditFolder(e.target.value)}
                            className="w-full h-8 rounded-lg bg-gray-900 border border-gray-800 px-2 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Unclassified</option>
                            {customFolders.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Document Tags</label>
                          <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1 border border-gray-800 rounded-lg bg-gray-900/30">
                            {customTags.map(t => {
                              const selected = editTags.includes(t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleTagSelection(t)}
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[9px] uppercase tracking-wide border font-bold",
                                    selected ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                                  )}
                                >
                                  #{t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {selectedNote.folder && (
                          <Badge variant="outline" className="bg-blue-600/10 border-blue-500/20 text-blue-400 capitalize text-[10px] font-bold py-0.5">
                            Folder: {selectedNote.folder}
                          </Badge>
                        )}
                        {selectedNote.tags.map(t => (
                          <Badge key={t} variant="outline" className="bg-gray-800/40 border-gray-700 text-slate-300 text-[10px] py-0.5">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                      
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">{selectedNote.title || "Untitled Vault Document"}</h1>
                    </div>
                  )}
                </div>

                {/* SECTION A: Overview */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Overview
                  </h3>
                  {isEditing ? (
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-base leading-relaxed bg-[#0b0f17]/40 border border-gray-800 rounded-xl p-3 resize-none focus-visible:ring-blue-500/20 placeholder:text-gray-700 scrollbar-hide text-slate-200"
                      placeholder="Enter document overview..."
                      rows={4}
                    />
                  ) : (
                    <div className="bg-[#0b0f17]/50 border border-gray-800/50 p-4 rounded-2xl">
                      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                        {selectedNote.content || <span className="opacity-30 italic">Add overview text here...</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* SECTION B: Checklist / Action Items */}
                <div className="space-y-3 bg-[#0d1420]/20 border border-gray-850 p-5 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-green-400" />
                      Action Items
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {actionItems.filter(i => i.completed).length} / {actionItems.length} Completed
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-[#090e16]/60 p-2.5 rounded-xl border border-gray-800/40">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input 
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleActionItem(idx)}
                            className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                          />
                          <span className={cn(
                            "text-sm font-medium truncate",
                            item.completed ? "line-through text-gray-500" : "text-slate-200"
                          )}>
                            {item.text}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveActionItem(idx)} className="h-6 w-6 text-gray-500 hover:text-red-400 rounded-md">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}

                    {actionItems.length === 0 && (
                      <p className="text-xs text-gray-600 italic p-2">No action items defined for this vault note.</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Input 
                        placeholder="Add new task checklist item..."
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
                      <Button onClick={handleAddActionItem} className="h-9 text-xs rounded-xl bg-green-600/10 hover:bg-green-600/25 text-green-400 border border-green-500/20 font-bold px-3">
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>

                {/* SECTION C: Notes & Highlights */}
                <div className="space-y-3 bg-[#0d1420]/20 border border-gray-855 p-5 rounded-2xl">
                  <div className="border-b border-gray-800 pb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-purple-400" />
                      Key Notes & Highlights
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {notesList.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 bg-[#090e16]/60 p-2.5 rounded-xl border border-gray-800/40">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="text-purple-400 font-bold mt-0.5">•</span>
                          <p className="text-sm text-slate-300 leading-relaxed break-words flex-1">
                            {item}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveNoteListItem(idx)} className="h-6 w-6 text-gray-500 hover:text-red-400 rounded-md flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}

                    {notesList.length === 0 && (
                      <p className="text-xs text-gray-600 italic p-2">No highlight bullets defined yet.</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Input 
                        placeholder="Add key note bullet..."
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

                {/* SECTION D: Attachments Panel */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-blue-400" />
                      Vault Attachments ({attachments.length})
                    </h3>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 hover:bg-blue-600/10 text-blue-400 border border-blue-500/10 rounded-lg px-2.5 font-bold"
                    >
                      <Upload className="w-3 h-3" /> Upload File
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
                      <Card key={idx} className="bg-[#0e1420]/80 border-gray-800 hover:border-gray-700/60 shadow-md flex flex-col justify-between p-3.5 rounded-xl group/att relative overflow-hidden transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-900 rounded-lg border border-gray-850">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-100 truncate" title={file.fileName}>{file.fileName}</p>
                            <p className="text-[9px] text-gray-500 font-mono mt-0.5">{formatBytes(file.size)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 justify-end mt-4 border-t border-gray-800/60 pt-2">
                          <a 
                            href={file.url} 
                            download={file.fileName}
                            className="p-1 text-gray-400 hover:text-blue-400 bg-gray-900 rounded border border-gray-800 hover:border-blue-500/20"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <Button 
                            onClick={() => handleRemoveAttachment(idx)}
                            variant="ghost" 
                            size="icon" 
                            className="h-6.5 w-6.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                            title="Delete Attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {attachments.length === 0 && (
                      <div className="col-span-full text-center py-8 border border-dashed border-gray-800/80 rounded-2xl text-gray-600 text-xs">
                        No document attachments. Drop images, videos, or PDFs here.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-24 h-24 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center relative">
                 <FileText className="w-10 h-10 text-blue-400 opacity-40" />
                 <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-20" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Knowledge Chamber</h3>
                <p className="text-muted-foreground max-w-[280px] mx-auto text-sm leading-relaxed text-slate-400">
                  Organize projects, SOPs, legal records, and design specs inside your secure local Knowledge Vault.
                </p>
              </div>
              <Button onClick={handleCreateNote} className="rounded-2xl h-11 px-8 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                <Plus className="w-5 h-5" /> Initialize First Note
              </Button>
            </div>
          )}
        </div>

        {/* COLUMN 4: Note Details & Actions Column */}
        <AnimatePresence>
          {(detailsOpen && selectedNote) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden xl:flex h-full border-l border-gray-800 bg-[#0e1420] flex-shrink-0 flex-col z-20"
            >
              <div className="p-4 border-b border-gray-800/80">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Document Settings</h3>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  
                  {/* Details Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Document Info</p>
                    <div className="space-y-3 bg-[#070a0f]/50 p-3.5 border border-gray-800 rounded-xl font-mono text-[10px] text-gray-400">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-slate-300 font-bold">{format(new Date(selectedNote.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="text-slate-300 font-bold">{format(new Date(selectedNote.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Access:</span>
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note Tools Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Chamber Actions</p>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleFavorite(selectedNote.id)}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800 hover:text-white rounded-xl gap-2.5 text-gray-400"
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                      <span>{selectedNote.isFavorite ? "Remove Favorite" : "Add to Favorites"}</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={handleDuplicateNote}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800 hover:text-white rounded-xl gap-2.5 text-gray-400"
                    >
                      <Copy className="w-4 h-4 text-blue-400" />
                      <span>Duplicate Document</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={exportNoteAsTxt}
                      className="w-full justify-start text-xs font-semibold hover:bg-gray-800 hover:text-white rounded-xl gap-2.5 text-gray-400"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                      <span>Export Text File</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="w-full justify-start text-xs font-semibold hover:bg-red-955/20 hover:text-red-400 rounded-xl gap-2.5 text-red-500/80"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Vault Note</span>
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-[#070a0f]/40 p-4 border border-gray-850 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-400">Vault Security</p>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      This document is encrypted and stored in your private local chamber. Documents are not shared unless explicitly requested.
                    </p>
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
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onFavorite: (e: React.MouseEvent) => void;
}

function NoteCard({ note, isSelected, onClick, onPin, onFavorite }: NoteCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "group relative p-3 rounded-2xl cursor-pointer transition-all border mb-1 flex flex-col justify-between min-h-[90px]",
        isSelected 
          ? "bg-blue-600/10 border-blue-500/35 shadow-md shadow-blue-900/10" 
          : "bg-gray-900/20 border-gray-900 hover:bg-gray-950/30 hover:border-gray-850"
      )}
      style={{
        borderLeftColor: note.isPinned ? "rgba(168, 85, 247, 0.4)" : undefined,
        borderLeftWidth: note.isPinned ? "3px" : undefined
      }}
    >
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("font-bold text-xs truncate flex-1", isSelected ? "text-blue-400" : "text-slate-100")}>
            {note.title || "Untitled Document"}
          </h4>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onFavorite}
              className={cn("p-0.5 rounded text-gray-500 hover:text-amber-500", note.isFavorite && "opacity-100 text-amber-500")}
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
        </div>
        
        <p className="text-[10px] text-gray-450 line-clamp-2 leading-relaxed font-medium">
          {note.content || "Empty document..."}
        </p>
      </div>

      <div className="flex justify-between items-center mt-3 pt-1.5 border-t border-gray-800/40">
        <span className="text-[8px] font-bold font-mono text-gray-500 uppercase">
          {format(new Date(note.updatedAt), "MMM d")}
        </span>
        {note.folder && (
          <span className="text-[8px] px-1.5 py-0.2 uppercase bg-blue-500/10 text-blue-400 rounded-md font-bold tracking-wide font-mono">
            {note.folder}
          </span>
        )}
      </div>
    </motion.div>
  );
}
