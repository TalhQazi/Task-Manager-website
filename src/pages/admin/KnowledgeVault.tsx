import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Pin, Star, Trash2, Sparkles, History, Loader2,
  FolderPlus, Folder as FolderIcon, X, Check, RotateCcw, BookText, Tag as TagIcon,
  ChevronDown, ChevronRight, Share2, Download, Copy, FolderInput, FileText,
  ListTodo, Languages, PenTool, CheckSquare, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, Link2, Quote, Code, Image as ImageIcon,
  Table as TableIcon, Undo, Redo, Play, Lock, MoreHorizontal,
  Grid, Clock, Lightbulb, User, DollarSign, Megaphone, Car, Home,
  FlaskConical, CheckCircle2, FileCode
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
import { KvNote, KvActionItem } from "@/lib/knowledgeVault";

/* -------------------------------------------------------------------------- */
/*                            INITIAL SEED DATA                               */
/* -------------------------------------------------------------------------- */

const INITIAL_COLLECTIONS = [
  { id: "col-business", name: "Business", count: 32, icon: "folder", color: "text-amber-500" },
  { id: "col-operations", name: "Operations", count: 18, icon: "folder", color: "text-orange-500" },
  { id: "col-patents", name: "Patents", count: 27, icon: "folder", color: "text-red-500" },
  { id: "col-legal", name: "Legal", count: 15, icon: "folder", color: "text-blue-500" },
  { id: "col-employees", name: "Employees", count: 21, icon: "folder", color: "text-purple-500" },
  { id: "col-sops", name: "SOPs & Procedures", count: 12, icon: "folder", color: "text-pink-500" },
  { id: "col-projects", name: "Projects", count: 17, icon: "folder", color: "text-yellow-500" },
  { id: "col-research", name: "Research", count: 14, icon: "flask", color: "text-emerald-500" },
  { id: "col-ideas", name: "Ideas", count: 29, icon: "bulb", color: "text-yellow-400" },
  { id: "col-personal", name: "Personal", count: 10, icon: "user", color: "text-sky-400" },
  { id: "col-finance", name: "Finance", count: 9, icon: "finance", color: "text-green-500" },
  { id: "col-marketing", name: "Marketing", count: 8, icon: "marketing", color: "text-rose-500" },
  { id: "col-vehicles", name: "Vehicles", count: 13, icon: "car", color: "text-indigo-400" },
  { id: "col-properties", name: "Properties", count: 11, icon: "home", color: "text-fuchsia-400" },
];

const INITIAL_TAGS = [
  { name: "AI", count: 24 },
  { name: "Important", count: 16 },
  { name: "Meeting", count: 18 },
  { name: "Ideas", count: 29 },
  { name: "Patent", count: 15 },
  { name: "SOP", count: 12 },
];

const INITIAL_NOTES: KvNote[] = [
  {
    id: "note-1",
    title: "Project Genesis – Update",
    isPinned: true,
    isFavorite: true,
    isImportant: true,
    folder: "Projects",
    folderId: "col-projects",
    tags: ["Projects", "Important", "AI"],
    createdAt: "June 30, 2025 9:02 AM",
    updatedAt: "June 30, 2025 4:16 PM",
    heroImage: "/assets/knowledge-vault/genesis_chamber.jpg",
    overview: "The Genesis Chamber prototype is now 80% complete. Next steps include thermal testing, AI optimization, and integration with the mobile control system.",
    actionItems: [
      { id: "a1", text: "Finalize hardware assembly", completed: true },
      { id: "a2", text: "Initial software integration", completed: true },
      { id: "a3", text: "Thermal testing and calibration", completed: false },
      { id: "a4", text: "AI system training", completed: false },
      { id: "a5", text: "Prepare for beta testing", completed: false },
    ],
    notesList: [
      "Thermal efficiency is performing better than expected.",
      "AI model is adapting well to user input.",
      "Mobile app control nearly complete.",
      "Targeting beta launch in August.",
    ],
    attachments: [
      { id: "att-1", fileName: "Genesis_Specs.pdf", fileSize: "2.4 MB", kind: "pdf" },
      { id: "att-2", fileName: "Chamber_Design.png", fileSize: "1.8 MB", kind: "image", url: "/assets/knowledge-vault/genesis_chamber.jpg" },
      { id: "att-3", fileName: "Thermal_Report.pdf", fileSize: "3.1 MB", kind: "pdf" },
      { id: "att-4", fileName: "Genesis_Video.mp4", fileSize: "46.7 MB", kind: "video", url: "/assets/knowledge-vault/genesis_chamber.jpg" },
      { id: "att-5", fileName: "Schematic_v2.cad", fileSize: "12.3 MB", kind: "file" },
      { id: "att-6", fileName: "Lab_Notes.docx", fileSize: "840 KB", kind: "file" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Only you",
    status: "active",
    priority: "high",
    version: 4,
  },
  {
    id: "note-2",
    title: "Patent Idea #27 – AutoDock™",
    isPinned: false,
    isFavorite: false,
    isImportant: false,
    folder: "Patents",
    folderId: "col-patents",
    tags: ["Patents", "Patent", "AI"],
    createdAt: "June 30, 2025 10:15 AM",
    updatedAt: "June 30, 2025 2:48 PM",
    heroImage: "/assets/knowledge-vault/autodock.jpg",
    overview: "Autonomous docking system for service bays that uses AI, LiDAR and computer vision to automatically align, mount, and dock incoming automated vehicles with zero human intervention.",
    actionItems: [
      { id: "ad1", text: "Draft preliminary patent claims", completed: true },
      { id: "ad2", text: "Submit schematic to legal counsel", completed: false },
      { id: "ad3", text: "Conduct prior art search across USPTO & WIPO", completed: false },
    ],
    notesList: [
      "LiDAR precision threshold is ±1.5mm.",
      "Patent filing window target is Q3.",
      "Cross-compatible with standard EV charging ports.",
    ],
    attachments: [
      { id: "att-ad1", fileName: "AutoDock_Blueprint.png", fileSize: "3.4 MB", kind: "image", url: "/assets/knowledge-vault/autodock.jpg" },
      { id: "att-ad2", fileName: "Patent_Draft_v1.pdf", fileSize: "1.2 MB", kind: "pdf" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Only you",
    status: "active",
    priority: "high",
    version: 2,
  },
  {
    id: "note-3",
    title: "Team Meeting Notes – 6/30",
    isPinned: false,
    isFavorite: true,
    isImportant: false,
    folder: "Operations",
    folderId: "col-operations",
    tags: ["Meeting", "Important"],
    createdAt: "June 30, 2025 9:00 AM",
    updatedAt: "June 30, 2025 11:23 AM",
    heroImage: "/assets/knowledge-vault/team_meeting.jpg",
    overview: "Discussed Q3 goals, new hiring pipeline, and the launch of Knowledge Vault. Key deliverables set for leadership team across engineering and product design.",
    actionItems: [
      { id: "tm1", text: "Review candidate resumes for Lead ML Engineer", completed: true },
      { id: "tm2", text: "Finalize budget allocation for Q3 infrastructure", completed: false },
      { id: "tm3", text: "Schedule all-hands demo for Knowledge Vault", completed: false },
    ],
    notesList: [
      "Team agreed on two-week sprint cycles.",
      "Knowledge Vault rollout to general employees scheduled next week.",
      "Quarterly performance reviews begin July 15.",
    ],
    attachments: [
      { id: "att-tm1", fileName: "Meeting_Minutes_630.pdf", fileSize: "540 KB", kind: "pdf" },
      { id: "att-tm2", fileName: "Q3_Goals_Deck.pptx", fileSize: "8.1 MB", kind: "file" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Organization",
    status: "active",
    priority: "normal",
    version: 1,
  },
  {
    id: "note-4",
    title: "Employee Handbook – 2025",
    isPinned: true,
    isFavorite: true,
    isImportant: false,
    folder: "SOPs & Procedures",
    folderId: "col-sops",
    tags: ["SOPs", "SOP", "Employees"],
    createdAt: "June 29, 2025 2:00 PM",
    updatedAt: "June 29, 2025 5:12 PM",
    heroImage: "/assets/knowledge-vault/team_meeting.jpg",
    overview: "Complete company policies, expectations, and procedures for all team members including code of conduct, benefits, PTO, and workplace standards.",
    actionItems: [
      { id: "eh1", text: "Distribute updated handbook to all staff", completed: true },
      { id: "eh2", text: "Collect digital signatures via portal", completed: false },
      { id: "eh3", text: "Audit compliance acknowledgements", completed: false },
    ],
    notesList: [
      "Updated remote work policy section 4.2.",
      "Revised health benefit coverage details.",
      "New whistleblower protection protocol included.",
    ],
    attachments: [
      { id: "att-eh1", fileName: "Employee_Handbook_2025.pdf", fileSize: "4.8 MB", kind: "pdf" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Organization",
    status: "published",
    priority: "normal",
    version: 3,
  },
  {
    id: "note-5",
    title: "Marketing Ideas Brainstorm",
    isPinned: false,
    isFavorite: false,
    isImportant: false,
    folder: "Marketing",
    folderId: "col-marketing",
    tags: ["Marketing", "Ideas"],
    createdAt: "June 29, 2025 1:15 PM",
    updatedAt: "June 29, 2025 3:47 PM",
    heroImage: "/assets/knowledge-vault/marketing_bulb.jpg",
    overview: "New campaign ideas for Freedom Auto and Membership Auto programs. Focus on high-converting social video teasers, digital ads, and referral incentives.",
    actionItems: [
      { id: "mk1", text: "Design ad creatives for Instagram & LinkedIn", completed: true },
      { id: "mk2", text: "Draft copy for email nurture sequence", completed: false },
      { id: "mk3", text: "A/B test landing page conversion rates", completed: false },
    ],
    notesList: [
      "Target demographic: Ages 25-50 with commercial fleet interest.",
      "Budget allocation $25k for initial phase.",
      "Influencer collaboration outreach starting next Monday.",
    ],
    attachments: [
      { id: "att-mk1", fileName: "Campaign_Strategy.pdf", fileSize: "1.9 MB", kind: "pdf" },
      { id: "att-mk2", fileName: "Ad_Creatives_Moodboard.png", fileSize: "5.6 MB", kind: "image", url: "/assets/knowledge-vault/marketing_bulb.jpg" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Public",
    status: "active",
    priority: "low",
    version: 1,
  },
  {
    id: "note-6",
    title: "Land Purchase – Howland",
    isPinned: false,
    isFavorite: false,
    isImportant: false,
    folder: "Properties",
    folderId: "col-properties",
    tags: ["Properties", "Legal", "Finance"],
    createdAt: "June 28, 2025 11:00 AM",
    updatedAt: "June 28, 2025 6:21 PM",
    heroImage: "/assets/knowledge-vault/land_purchase.jpg",
    overview: "Documents and notes related to the Howland property acquisition. 120-acre parcel zoned for commercial testing facility expansion and logistics hub.",
    actionItems: [
      { id: "lp1", text: "Complete environmental phase 1 assessment", completed: true },
      { id: "lp2", text: "Review title deed and survey boundaries", completed: true },
      { id: "lp3", text: "Finalize escrow wire transfer with bank", completed: false },
    ],
    notesList: [
      "County zoning commission approved conditional use permit.",
      "Soil testing results verified solid bedrock for heavy construction.",
      "Closing date set for end of month.",
    ],
    attachments: [
      { id: "att-lp1", fileName: "Deed_Survey_Map.pdf", fileSize: "6.2 MB", kind: "pdf" },
      { id: "att-lp2", fileName: "Aerial_Site_Survey.png", fileSize: "8.4 MB", kind: "image", url: "/assets/knowledge-vault/land_purchase.jpg" },
    ],
    createdBy: {
      name: "Nathan Reardon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Super Admin",
    },
    access: "Only you",
    status: "active",
    priority: "high",
    version: 1,
  },
];

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
  if (dateStr.includes("June 30")) return "TODAY";
  if (dateStr.includes("June 29")) return "YESTERDAY";
  if (dateStr.includes("June 28")) return "JUNE 28";
  return "RECENT";
}

/* -------------------------------------------------------------------------- */
/*                           MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function KnowledgeVault() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic state loaded from localStorage or initialized
  const [notes, setNotes] = useState<KvNote[]>(() => {
    try {
      const cached = localStorage.getItem("kv_dynamic_notes_v2");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return INITIAL_NOTES;
  });

  const [collections, setCollections] = useState(() => {
    try {
      const cached = localStorage.getItem("kv_dynamic_collections_v2");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return INITIAL_COLLECTIONS;
  });

  const [tags, setTags] = useState(() => {
    try {
      const cached = localStorage.getItem("kv_dynamic_tags_v2");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return INITIAL_TAGS;
  });

  // Active navigation & filter state
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "note-1");
  const [activeFilter, setActiveFilter] = useState<string>("all"); // 'all' | 'favorites' | 'recent' | 'pinned' | 'ai' | col-id | tag-name
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Dialogs state
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

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kv_dynamic_notes_v2", JSON.stringify(notes));
    } catch (_) {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem("kv_dynamic_collections_v2", JSON.stringify(collections));
    } catch (_) {}
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem("kv_dynamic_tags_v2", JSON.stringify(tags));
    } catch (_) {}
  }, [tags]);

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

  // Active note lookup
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Dynamic counts calculation
  const counts = useMemo(() => {
    const favorites = notes.filter((n) => n.isFavorite).length;
    const pinned = notes.filter((n) => n.isPinned).length;
    const recent = notes.length;
    const aiSuggestions = notes.filter((n) => (n.tags && n.tags.includes("AI")) || n.isImportant).length;

    // dynamic collections count
    const colCounts: Record<string, number> = {};
    collections.forEach((c) => {
      const match = notes.filter((n) => n.folderId === c.id || n.folder?.toLowerCase() === c.name.toLowerCase()).length;
      colCounts[c.id] = match + c.count;
    });

    // dynamic tags count based on actual usage across all notes
    const tagCounts: Record<string, number> = {};
    tags.forEach((t) => {
      const match = notes.filter((n) => (n.tags || []).some((tg) => tg.toLowerCase() === t.name.toLowerCase())).length;
      tagCounts[t.name] = match + t.count;
    });

    return { favorites, pinned, recent, aiSuggestions, colCounts, tagCounts };
  }, [notes, collections, tags]);

  // Filtered Notes list
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const overviewMatch = (n.overview || "").toLowerCase().includes(q);
        const contentMatch = (n.content || "").toLowerCase().includes(q);
        const tagMatch = (n.tags || []).some((t) => t.toLowerCase().includes(q));
        const folderMatch = (n.folder || "").toLowerCase().includes(q);
        return titleMatch || overviewMatch || contentMatch || tagMatch || folderMatch;
      });
    }

    // Sidebar filter
    if (activeFilter === "favorites") {
      list = list.filter((n) => n.isFavorite);
    } else if (activeFilter === "pinned") {
      list = list.filter((n) => n.isPinned);
    } else if (activeFilter === "ai") {
      list = list.filter((n) => (n.tags && n.tags.includes("AI")) || n.isImportant);
    } else if (activeFilter.startsWith("col-")) {
      list = list.filter((n) => n.folderId === activeFilter);
    } else if (activeFilter.startsWith("tag-")) {
      const tagName = activeFilter.replace("tag-", "").toLowerCase();
      list = list.filter((n) => (n.tags || []).some((t) => t.toLowerCase() === tagName));
    }

    return list;
  }, [notes, searchQuery, activeFilter]);

  // Group notes by Date
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: KvNote[] } = {
      TODAY: [],
      YESTERDAY: [],
      "JUNE 28": [],
      OTHER: [],
    };

    filteredNotes.forEach((note) => {
      const groupKey = formatDateGroup(note.updatedAt || note.createdAt);
      if (groups[groupKey]) {
        groups[groupKey].push(note);
      } else {
        groups.OTHER.push(note);
      }
    });

    return groups;
  }, [filteredNotes]);

  // Word count dynamic calculation
  const wordCount = useMemo(() => {
    if (!activeNote) return 0;
    const fullText = [
      activeNote.title || "",
      activeNote.overview || "",
      activeNote.content || "",
      ...(activeNote.notesList || []),
      ...(activeNote.actionItems || []).map((a) => a.text),
    ].join(" ");
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [activeNote]);

  /* -------------------------------------------------------------------------- */
  /*                            DYNAMIC MUTATIONS                               */
  /* -------------------------------------------------------------------------- */

  const updateActiveNote = (patch: Partial<KvNote>) => {
    if (!activeNote) return;
    setIsSaving(true);
    const updated = {
      ...activeNote,
      ...patch,
      updatedAt: "Just now",
    };
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? updated : n)));
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleToggleFavorite = (noteId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextVal = !n.isFavorite;
          toast.success(nextVal ? "Added to favorites" : "Removed from favorites");
          return { ...n, isFavorite: nextVal };
        }
        return n;
      })
    );
  };

  const handleTogglePin = (noteId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextVal = !n.isPinned;
          toast.success(nextVal ? "Note pinned" : "Note unpinned");
          return { ...n, isPinned: nextVal };
        }
        return n;
      })
    );
  };

  const handleToggleActionItem = (itemId: string) => {
    if (!activeNote) return;
    const currentActions = activeNote.actionItems || [];
    const nextActions = currentActions.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateActiveNote({ actionItems: nextActions });
  };

  const handleAddActionItem = () => {
    if (!newActionItemText.trim() || !activeNote) return;
    const newItem: KvActionItem = {
      id: `act-${Date.now()}`,
      text: newActionItemText.trim(),
      completed: false,
    };
    const nextActions = [...(activeNote.actionItems || []), newItem];
    updateActiveNote({ actionItems: nextActions });
    setNewActionItemText("");
    toast.success("Action item added");
  };

  const handleRemoveActionItem = (itemId: string) => {
    if (!activeNote) return;
    const nextActions = (activeNote.actionItems || []).filter((a) => a.id !== itemId);
    updateActiveNote({ actionItems: nextActions });
    toast.success("Action item removed");
  };

  const handleAddBulletNote = () => {
    if (!newBulletText.trim() || !activeNote) return;
    const nextList = [...(activeNote.notesList || []), newBulletText.trim()];
    updateActiveNote({ notesList: nextList });
    setNewBulletText("");
    toast.success("Note bullet added");
  };

  const handleRemoveBulletNote = (index: number) => {
    if (!activeNote) return;
    const nextList = (activeNote.notesList || []).filter((_, idx) => idx !== index);
    updateActiveNote({ notesList: nextList });
    toast.success("Note bullet removed");
  };

  const handleCreateNewNote = (folderId = "col-projects", folderName = "Projects") => {
    const newNote: KvNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      isPinned: false,
      isFavorite: false,
      isImportant: false,
      folder: folderName,
      folderId: folderId,
      tags: ["Projects"],
      createdAt: "Just now",
      updatedAt: "Just now",
      heroImage: "/assets/knowledge-vault/genesis_chamber.jpg",
      overview: "Start typing your note overview here...",
      actionItems: [
        { id: `a-${Date.now()}-1`, text: "First task item", completed: false }
      ],
      notesList: [
        "Key discovery or milestone note."
      ],
      attachments: [],
      createdBy: {
        name: "Nathan Reardon",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        role: "Super Admin",
      },
      access: "Only you",
      status: "active",
      priority: "normal",
      version: 1,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    toast.success("New note created!");
  };

  const handleDuplicateNote = () => {
    if (!activeNote) return;
    const copyNote: KvNote = {
      ...activeNote,
      id: `note-${Date.now()}`,
      title: `${activeNote.title} (Copy)`,
      createdAt: "Just now",
      updatedAt: "Just now",
      version: 1,
    };
    setNotes((prev) => [copyNote, ...prev]);
    setActiveNoteId(copyNote.id);
    toast.success("Note duplicated successfully");
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    const remaining = notes.filter((n) => n.id !== noteId);
    if (remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    }
    toast.success("Note deleted");
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    const newCol = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      count: 0,
      icon: "folder",
      color: "text-blue-500",
    };
    setCollections((prev: any) => [...prev, newCol]);
    setNewCollectionName("");
    setNewCollectionOpen(false);
    toast.success(`Collection "${newCol.name}" created`);
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const cleanTag = newTagName.trim();
    if (!tags.some((t: any) => t.name.toLowerCase() === cleanTag.toLowerCase())) {
      setTags((prev: any) => [
        ...prev,
        { name: cleanTag, count: 1 }
      ]);
    }
    if (activeNote) {
      const currentTags = activeNote.tags || [];
      if (!currentTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
        updateActiveNote({ tags: [...currentTags, cleanTag] });
      }
    }
    setNewTagName("");
    setNewTagOpen(false);
    toast.success(`Tag #${cleanTag} added`);
  };

  const handleRemoveTagFromNote = (tagToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeNote) return;
    const nextTags = (activeNote.tags || []).filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    updateActiveNote({ tags: nextTags });
    toast.success(`Tag #${tagToRemove} removed from note`);
  };

  const handleTagClick = (tagName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tagFilterKey = `tag-${tagName.toLowerCase()}`;
    if (activeFilter === tagFilterKey) {
      setActiveFilter("all");
      toast.info("Showing all notes");
    } else {
      setActiveFilter(tagFilterKey);
      toast.info(`Filtering by #${tagName}`);
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
      content = `# ${activeNote.title}\n\n**Folder:** ${activeNote.folder} | **Access:** ${activeNote.access}\n**Created:** ${activeNote.createdAt} | **Updated:** ${activeNote.updatedAt}\n\n## Overview\n${activeNote.overview}\n\n## Action Items\n${(activeNote.actionItems || []).map((a) => `- [${a.completed ? "x" : " "}] ${a.text}`).join("\n")}\n\n## Notes\n${(activeNote.notesList || []).map((n) => `- ${n}`).join("\n")}\n`;
    } else if (format === "json") {
      mimeType = "application/json";
      extension = "json";
      content = JSON.stringify(activeNote, null, 2);
    } else {
      content = `${activeNote.title}\n\nOverview:\n${activeNote.overview}\n\nAction Items:\n${(activeNote.actionItems || []).map((a) => `${a.completed ? "[✓]" : "[ ]"} ${a.text}`).join("\n")}\n\nNotes:\n${(activeNote.notesList || []).join("\n")}`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeNote.title.toLowerCase().replace(/\s+/g, "_")}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${extension.toUpperCase()}`);
  };

  /* -------------------------------------------------------------------------- */
  /*                            AI TOOL HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const runAiTool = (type: "summarize" | "extract" | "translate" | "related" | "improve" | "tasks") => {
    if (!activeNote) return;
    setAiLoading(true);
    setAiModalOpen(true);

    setTimeout(() => {
      setAiLoading(false);
      switch (type) {
        case "summarize":
          setAiModalTitle("AI Executive Summary");
          setAiModalContent(
            `Key Highlights:\n• ${activeNote.title} is tracking on schedule with 80% completion.\n• Thermal calibration & AI optimization represent the primary remaining blockers.\n• Targeted beta release is on track for August.\n• Budget and resources remain within optimal operating limits.`
          );
          break;
        case "extract":
          setAiModalTitle("Extracted Action Items");
          setAiModalContent(
            `1. [HIGH] Conduct rigorous thermal stress test at peak capacity.\n2. [MEDIUM] Benchmark mobile control latency over 5G mesh.\n3. [HIGH] Verify neural network weight convergence for auto-alignment.\n4. [LOW] Archive lab telemetry logs to secure cold storage.`
          );
          break;
        case "translate":
          setAiModalTitle("Translation (Spanish)");
          setAiModalContent(
            `Resumen del Proyecto:\nEl prototipo de la Cámara Génesis está completo al 80%. Los próximos pasos incluyen pruebas térmicas, optimización de IA e integración con el sistema de control móvil.`
          );
          break;
        case "related":
          setAiModalTitle("Related Knowledge Graph Nodes");
          setAiModalContent(
            `Related Documents Found:\n1. Patent Idea #27 – AutoDock™ (94% similarity: Autonomous AI & LiDAR telemetry)\n2. SOP-402 Hardware Testing Protocols (89% similarity: Thermal calibration)\n3. Q3 Infrastructure Budget (78% similarity: Genesis server racks)`
          );
          break;
        case "improve":
          setAiModalTitle("Writing Improvements & Tone Polish");
          setAiModalContent(
            `Enhanced Version:\n"The Genesis Chamber prototype has achieved 80% milestone completion. Critical forthcoming objectives comprise comprehensive thermal validation, precision AI parameter optimization, and seamless synchronization with the mobile command interface."`
          );
          break;
        case "tasks":
          setAiModalTitle("Tasks Created in Project Hub");
          setAiModalContent(
            `Successfully synchronized action items into project task workspace:\n✓ Finalize hardware assembly (#TASK-801)\n✓ Initial software integration (#TASK-802)\n⏳ Thermal testing and calibration (#TASK-803)\n⏳ AI system training (#TASK-804)\n⏳ Prepare for beta testing (#TASK-805)`
          );
          break;
      }
    }, 500);
  };

  const handleApplyAiSummary = () => {
    if (!activeNote || !aiModalContent) return;
    updateActiveNote({
      notesList: [...(activeNote.notesList || []), `AI Insight: ${aiModalContent.split("\n")[0]}`]
    });
    setAiModalOpen(false);
    toast.success("AI content appended to note!");
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, documents, tags, and more..."
              className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-10 pr-14 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
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
                onClick={() => handleCreateNewNote("col-projects", "Projects")}
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
                  handleCreateNewNote("col-ideas", "Ideas");
                  toast.success("AI Smart Note initialized!");
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
              {collections.map((col: any) => {
                const isSelected = activeFilter === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => setActiveFilter(isSelected ? "all" : col.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/20" : "text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getCollectionIcon(col.icon)}
                      <span className="truncate">{col.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-1">
                      {counts.colCounts[col.id] ?? col.count}
                    </span>
                  </button>
                );
              })}
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
              {tags.map((tg: any) => {
                const isSelected = activeFilter === `tag-${tg.name.toLowerCase()}`;
                return (
                  <button
                    key={tg.name}
                    onClick={() => handleTagClick(tg.name)}
                    className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="truncate">#{tg.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">{counts.tagCounts[tg.name] ?? tg.count}</span>
                  </button>
                );
              })}
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
                      ? collections.find((c: any) => c.id === activeFilter)?.name || "Notes"
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
                <DropdownMenuSeparator className="bg-slate-800" />
                {tags.slice(0, 5).map((tg: any) => (
                  <DropdownMenuItem key={tg.name} onClick={() => setActiveFilter(`tag-${tg.name.toLowerCase()}`)}>
                    Tag: #{tg.name}
                  </DropdownMenuItem>
                ))}
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
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <BookText className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No notes match this filter</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                    className="text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Clear Filter
                  </Button>
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
                        const isSelected = activeNote?.id === note.id;
                        return (
                          <div
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
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
                                    onClick={(e) => handleToggleFavorite(note.id, e)}
                                    className="shrink-0 text-amber-400 hover:scale-110 transition-transform"
                                  >
                                    <Star className="h-3 w-3 fill-amber-400" />
                                  </button>
                                ) : null}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {note.updatedAt?.includes(":") ? note.updatedAt.split(" ").slice(-2).join(" ") : "4:16 PM"}
                              </span>
                            </div>

                            {/* Card Middle: Description & Thumbnail preview */}
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                {note.overview || note.content || "No overview available..."}
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
            <span>Showing 1 – {filteredNotes.length} of {notes.length + 242} notes</span>
            <div className="flex items-center gap-1">
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">&lt;</button>
              <button className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">1</button>
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">2</button>
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">3</button>
              <span className="px-1">...</span>
              <button className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400">13</button>
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
                  <span className="text-slate-400 text-[11px]">Edited {activeNote.updatedAt || "4:16 PM"}</span>
                  <button
                    onClick={(e) => handleToggleFavorite(activeNote.id, e)}
                    className="hover:scale-110 transition-transform"
                    title={activeNote.isFavorite ? "Remove favorite" : "Add favorite"}
                  >
                    <Star className={`h-4 w-4 ${activeNote.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                  </button>
                  <button
                    onClick={() => updateActiveNote({ access: activeNote.access === "Only you" ? "Organization" : "Only you" })}
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
                      <DropdownMenuItem onClick={() => handleDeleteNote(activeNote.id)} className="text-red-400 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Note Title Input (Dynamic Editable) */}
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateActiveNote({ title: e.target.value })}
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
                  value={activeNote.overview || ""}
                  onChange={(e) => updateActiveNote({ overview: e.target.value })}
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
                      key={att.id}
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
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <BookText className="h-12 w-12 opacity-30 mb-2" />
              <p>Select a note from the left to view details</p>
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
                <span className="text-slate-200 font-medium">{activeNote?.createdAt || "June 30, 2025 9:02 AM"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Updated</span>
                <span className="text-slate-200 font-medium">{activeNote?.updatedAt || "June 30, 2025 4:16 PM"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Created by</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6 border border-slate-700">
                    <AvatarImage src={activeNote?.createdBy?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} />
                    <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300">NR</AvatarFallback>
                  </Avatar>
                  <span className="text-slate-200 font-medium">{activeNote?.createdBy?.name || "Nathan Reardon"}</span>
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
                onClick={(e) => activeNote && handleToggleFavorite(activeNote.id, e)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Star className={`h-3.5 w-3.5 ${activeNote?.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                <span>{activeNote?.isFavorite ? "Favorited" : "Add to Favorites"}</span>
              </button>

              <button
                onClick={() => activeNote && handleDeleteNote(activeNote.id)}
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
              onKeyDown={(e) => e.key === "Enter" && handleAddCollection()}
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCollectionOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleAddCollection} disabled={!newCollectionName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Modal */}
      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent className="bg-[#111827] border border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription className="text-slate-400">
              {activeNote ? `Add tag to "${activeNote.title}" or global tags.` : "Create a new tag."}
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
            {collections.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  updateActiveNote({ folderId: c.id, folder: c.name });
                  setMoveModalOpen(false);
                  toast.success(`Moved to ${c.name}`);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                  activeNote?.folderId === c.id ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {getCollectionIcon(c.icon)}
                  <span>{c.name}</span>
                </div>
                {activeNote?.folderId === c.id ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
              </button>
            ))}
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
            <DialogDescription className="text-slate-400">Share "{activeNote?.title}" with colleagues.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Public / Organization Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/knowledge-vault?note=${activeNote?.id}`}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/knowledge-vault?note=${activeNote?.id}`);
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
                onChange={(e) => updateActiveNote({ access: e.target.value })}
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
              { v: 4, date: "June 30, 2025 4:16 PM", editor: "Nathan Reardon", notes: "Added Genesis Chamber design attachments" },
              { v: 3, date: "June 30, 2025 1:20 PM", editor: "Nathan Reardon", notes: "Updated Action Items & thermal efficiency" },
              { v: 2, date: "June 30, 2025 10:14 AM", editor: "Nathan Reardon", notes: "Added hardware assembly checklist" },
              { v: 1, date: "June 30, 2025 9:02 AM", editor: "Nathan Reardon", notes: "Initial creation" },
            ].map((ver) => (
              <div key={ver.v} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">v{ver.v}</span>
                    <span className="text-slate-300 font-medium">{ver.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ver.notes} • {ver.editor}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVersionModalOpen(false);
                    toast.success(`Restored to version ${ver.v}`);
                  }}
                  className="h-7 text-xs text-slate-400 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Restore
                </Button>
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
