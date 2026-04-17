import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Calendar, 
  Clock, 
  Tag, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Check,
  X,
  Palette
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

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
}

interface PersonalNotesProps {
  getNotes: () => Promise<{ items: Note[] }>;
  createNote: (payload: { title: string; content: string; color?: string; isPinned?: boolean }) => Promise<{ item: Note }>;
  updateNote: (id: string, payload: Partial<Note>) => Promise<{ item: Note }>;
  deleteNote: (id: string) => Promise<any>;
}

const COLORS = [
  { name: "Default", value: "transparent" },
  { name: "Blue", value: "rgba(59, 130, 246, 0.1)" },
  { name: "Green", value: "rgba(34, 197, 94, 0.1)" },
  { name: "Yellow", value: "rgba(234, 179, 8, 0.1)" },
  { name: "Red", value: "rgba(239, 68, 68, 0.1)" },
  { name: "Purple", value: "rgba(168, 85, 247, 0.1)" },
];

export default function PersonalNotes({ getNotes, createNote, updateNote, deleteNote }: PersonalNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await getNotes();
      setNotes(res.items || []);
    } catch (err: any) {
      toast.error("Failed to load notes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const { item } = await createNote({ 
        title: "New Note", 
        content: "", 
        color: "transparent" 
      });
      setNotes([item, ...notes]);
      setSelectedNote(item);
      setEditTitle(item.title);
      setEditContent(item.content);
      setIsEditing(true);
      toast.success("Note created");
    } catch (err) {
      toast.error("Failed to create note");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      const { item } = await updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent
      });
      setNotes(notes.map(n => n.id === item.id ? item : n));
      setSelectedNote(item);
      setIsEditing(false);
      toast.success("Saved");
    } catch (err) {
      toast.error("Failed to save note");
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;
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
      setNotes(notes.map(n => n.id === id ? item : n));
      if (selectedNote?.id === id) setSelectedNote(item);
    } catch (err) {
      toast.error("Failed to update pin");
    }
  };

  const updateColor = async (id: string, color: string) => {
    try {
      const { item } = await updateNote(id, { color });
      setNotes(notes.map(n => n.id === id ? item : n));
      if (selectedNote?.id === id) setSelectedNote(item);
    } catch (err) {
      toast.error("Failed to update color");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-background/50 backdrop-blur-sm rounded-3xl border border-border/40 overflow-hidden shadow-2xl relative">
      {/* Sidebar - Note List */}
      <motion.div 
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="h-full border-r border-border/40 bg-muted/5 flex flex-col"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">My Notes</h2>
            <Button size="icon" variant="ghost" onClick={handleCreateNote} className="rounded-xl hover:bg-primary/10">
              <Plus className="w-5 h-5 text-primary" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/10 border-border/40 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6 pb-6 mt-2">
            {pinnedNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2">Pinned</p>
                {pinnedNotes.map(n => (
                  <NoteItem 
                    key={n.id} 
                    note={n} 
                    isSelected={selectedNote?.id === n.id}
                    onClick={() => {
                      setSelectedNote(n);
                      setEditTitle(n.title);
                      setEditContent(n.content);
                      setIsEditing(false);
                    }}
                    onDelete={handleDeleteNote}
                    onPin={togglePin}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              {pinnedNotes.length > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2">Recent</p>
              )}
              {otherNotes.length > 0 ? (
                otherNotes.map(n => (
                  <NoteItem 
                    key={n.id} 
                    note={n} 
                    isSelected={selectedNote?.id === n.id}
                    onClick={() => {
                      setSelectedNote(n);
                      setEditTitle(n.title);
                      setEditContent(n.content);
                      setIsEditing(false);
                    }}
                    onDelete={handleDeleteNote}
                    onPin={togglePin}
                  />
                ))
              ) : !loading && pinnedNotes.length === 0 && (
                <div className="text-center p-8 text-muted-foreground/40 italic">
                  No notes found
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </motion.div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col bg-background/30 overflow-hidden relative">
        {/* Sidebar Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -left-1 top-4 z-10 w-6 h-12 rounded-r-xl border border-l-0 border-border/40 bg-background/50 backdrop-blur-md shadow-lg"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>

        {selectedNote ? (
          <div className="flex-1 flex flex-col p-8 md:p-12 max-w-4xl mx-auto w-full">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                <Clock className="w-3 h-3" />
                Last modified {format(new Date(selectedNote.updatedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center self-center mr-2">
                  {COLORS.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => updateColor(selectedNote.id, c.value)}
                      className={cn(
                        "w-4 h-4 rounded-full border border-border/40 mr-1.5 transition-transform hover:scale-125",
                        selectedNote.color === c.value && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      )}
                      style={{ backgroundColor: c.value === "transparent" ? "#fff" : c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-8 text-[11px] gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveNote} className="rounded-xl h-8 text-[11px] gap-1 shadow-lg shadow-primary/20">
                      <Check className="w-3 h-3" /> Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl h-8 text-[11px] gap-1 hover:bg-primary/10 hover:text-primary">
                    <FileText className="w-3 h-3" /> Edit Note
                  </Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-4xl font-extrabold bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:opacity-20"
                  placeholder="Note Title"
                />
                <Textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 text-lg leading-relaxed bg-transparent border-none shadow-none p-0 resize-none focus-visible:ring-0 placeholder:opacity-20 scrollbar-hide"
                  placeholder="Start writing..."
                />
              </div>
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground/90">{selectedNote.title || "Untitled"}</h1>
                <div className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {selectedNote.content || <span className="opacity-30 italic">No content...</span>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center relative">
               <FileText className="w-10 h-10 text-primary opacity-40" />
               <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-20" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Personal Workspace</h3>
              <p className="text-muted-foreground max-w-[280px] mx-auto text-sm leading-relaxed">
                Catch your thoughts, draft ideas, or keep private reminders. Only you can see these notes.
              </p>
            </div>
            <Button onClick={handleCreateNote} className="rounded-2xl h-11 px-8 shadow-xl shadow-primary/20 gap-2 font-semibold">
              <Plus className="w-5 h-5" /> Create Your First Note
            </Button>
          </div>
        )}
      </div>

      {/* Background decoration */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}

function NoteItem({ note, isSelected, onClick, onDelete, onPin }: { 
  note: Note; 
  isSelected: boolean; 
  onClick: () => void; 
  onDelete: (id: string, e: React.MouseEvent) => void;
  onPin: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-2xl cursor-pointer transition-all border border-transparent mb-1",
        isSelected 
          ? "bg-primary/10 border-primary/20 shadow-sm" 
          : "hover:bg-muted/10 hover:border-border/40"
      )}
      style={{ 
        backgroundColor: note.color !== "transparent" ? note.color : undefined,
        borderColor: !isSelected && note.color !== "transparent" ? "rgba(255,255,255,0.05)" : undefined
      }}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <h3 className={cn("font-semibold text-sm truncate", isSelected ? "text-primary" : "text-foreground/80")}>
          {note.title || "Untitled"}
        </h3>
        <button 
          onClick={(e) => onPin(note.id, e)}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-background/50",
            note.isPinned && "opacity-100 text-primary"
          )}
        >
          <Pin className={cn("w-3.5 h-3.5", note.isPinned && "fill-current")} />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-snug mb-3">
        {note.content || "Empty note..."}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[9px] font-medium text-muted-foreground/40 uppercase">
          {format(new Date(note.updatedAt), "MMM d")}
        </span>
        <button 
          onClick={(e) => onDelete(note.id, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
