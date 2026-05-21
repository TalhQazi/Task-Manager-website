import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import { Textarea } from "@/components/manger/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manger/ui/avatar";
import { Card, CardContent } from "@/components/manger/ui/card";
import {
  Plus,
  Search,
  Send,
  ArrowLeft,
  MessageCircle,
  User,
  Archive,
  Bookmark,
  Paperclip,
  Download,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch, toProxiedUrl } from "@/lib/manger/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import MilestoneBadge from "@/components/shared/MilestoneBadge";

interface Employee {
  id: string;
  _id?: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  department: string;
  status: string;
  avatarUrl?: string;
  milestoneLevel?: string;
  milestoneLabel?: string;
}

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  recipient: string;
  content: string;
  timestamp: string;
  type: "direct" | "broadcast";
  status: "sent" | "delivered" | "read";
  createdAt?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
}

type MessageApi = Omit<Message, "id"> & {
  _id: string;
};

interface ConversationFromApi {
  employee: Employee;
  lastMessage: Message | null;
  unreadCount: number;
}

interface Conversation {
  employee: Employee;
  lastMessage: Message | null;
  unreadCount: number;
}

function normalizeMessage(m: any): Message {
  return {
    id: String(m._id || m.id || ""),
    sender: m.sender || "",
    senderAvatar: m.senderAvatar || "",
    recipient: m.recipient || "",
    content: m.content || "",
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    type: m.type || "direct",
    status: m.status || "sent",
    createdAt: m.createdAt,
    attachment: m.attachment,
  };
}

function getInitials(name: string): string {
  return String(name || "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Messages() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "conversation" | "employees">("list");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "archived" | "bookmarked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Archive and Bookmark state (persisted to localStorage)
  const [archivedConversations, setArchivedConversations] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("manager-messaging-archived");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [bookmarkedConversations, setBookmarkedConversations] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("manager-messaging-bookmarked");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("manager-messaging-archived", JSON.stringify([...archivedConversations]));
  }, [archivedConversations]);

  useEffect(() => {
    localStorage.setItem("manager-messaging-bookmarked", JSON.stringify([...bookmarkedConversations]));
  }, [bookmarkedConversations]);

  // Archive/Unarchive helper
  const toggleArchive = (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    setArchivedConversations(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  // Bookmark/Unbookmark helper
  const toggleBookmark = (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    setBookmarkedConversations(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const { socket } = useSocket();
  const auth = getAuthState();
  const currentUser = auth.name?.trim() || auth.username?.trim() || "";

  // Handle navigation state - auto-open conversation from header dropdown
  useEffect(() => {
    const navState = location.state as { selectedEmployee?: Employee } | null;
    if (navState?.selectedEmployee) {
      const emp = navState.selectedEmployee;
      // Small delay to ensure conversations are loaded first
      const timer = setTimeout(() => {
        startConversation(emp);
        // Clear the state so it doesn't reopen on refresh
        window.history.replaceState({}, document.title);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Load employees
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Employee[] }>("/api/employees");
      return res.items;
    },
  });

  // Load conversations
  const conversationsQuery = useQuery({
    queryKey: ["conversations", currentUser],
    queryFn: async () => {
      const res = await apiFetch<{ items?: ConversationFromApi[] }>(
        `/api/messages/conversations/${encodeURIComponent(currentUser)}`
      );
      return (res.items ?? []).map((c) => ({
        employee: c.employee,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
      }));
    },
  });

  // Load conversation messages
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  const loadConversationMessages = async (employeeName: string) => {
    try {
      const res = await apiFetch<{ items?: MessageApi[] }>(
        `/api/messages/conversation/${encodeURIComponent(currentUser)}/${encodeURIComponent(employeeName)}`
      );
      const msgs = res.items ?? [];
      setConversationMessages(
        msgs
          .map(normalizeMessage)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      );
    } catch (e) {
      console.error("Failed to load conversation messages:", e);
      setConversationMessages([]);
    }
  };

  const uploadAttachment = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetch<{
      attachment: { fileName: string; url: string; mimeType: string; size: number };
    }>("/api/messages/upload", {
      method: "POST",
      body: fd,
    });
    return res.attachment;
  };

  const downloadAttachment = async (url: string, fileName: string) => {
    const safeUrl = toProxiedUrl(url) || url;
    const res = await fetch(safeUrl);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName || "attachment";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file || !selectedEmployee) return;

    setUploading(true);
    try {
      const attachment = await uploadAttachment(file);

      const payload: Omit<Message, "id"> = {
        sender: currentUser,
        senderAvatar: getInitials(currentUser),
        recipient: selectedEmployee.name,
        content: newMessageContent.trim(),
        timestamp: new Date().toISOString(),
        type: "direct",
        status: "sent",
        attachment,
      };

      const res = await apiFetch<{ item?: MessageApi }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.item) {
        const newMsg = normalizeMessage(res.item);
        setConversationMessages((prev) => [...prev, newMsg]);
        setNewMessageContent("");
        await queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
      }
    } catch (e) {
      console.error("Failed to send attachment:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const markMessagesAsRead = async (sender: string) => {
    try {
      await apiFetch("/api/messages/mark-read", {
        method: "POST",
        body: JSON.stringify({ sender, recipient: currentUser }),
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
    } catch (e) {
      console.error("Failed to mark messages as read:", e);
    }
  };

  // Real-time new message via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: any) => {
      const normalized = normalizeMessage(msg);
      if (!normalized.id) return;
      // Refresh conversation list (unread counts, last message)
      void queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
      // If we're currently in the conversation with this sender, append the message
      if (
        view === "conversation" &&
        selectedEmployee &&
        (normalized.sender === selectedEmployee.name || normalized.recipient === selectedEmployee.name)
      ) {
        setConversationMessages((prev) => {
          if (prev.some((m) => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
      }
    };
    socket.on("new-message", handleNewMessage);
    return () => { socket.off("new-message", handleNewMessage); };
  }, [socket, view, selectedEmployee?.name]);

  // Polling fallback: refresh messages every 3s when conversation is open
  useEffect(() => {
    if (view !== "conversation" || !selectedEmployee) return;
    const interval = setInterval(() => {
      loadConversationMessages(selectedEmployee.name);
    }, 3000);
    return () => clearInterval(interval);
  }, [view, selectedEmployee?.name]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (view === "conversation" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [view, conversationMessages]);

  const employees = employeesQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.employee.name.toLowerCase().includes(q) ||
        conv.employee.email.toLowerCase().includes(q) ||
        conv.employee.department.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Filtered employees for selection
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchQuery.trim()) return employees;
    const q = employeeSearchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
    );
  }, [employees, employeeSearchQuery]);

  const startConversation = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setView("conversation");
    setEmployeeSearchQuery("");
    await loadConversationMessages(employee.name);
    if (employee.name) {
      await markMessagesAsRead(employee.name);
    }
  };

  const sendMessage = async () => {
    if ((!newMessageContent.trim()) || !selectedEmployee) return;

    setSending(true);
    try {
      const payload: Omit<Message, "id"> = {
        sender: currentUser,
        senderAvatar: getInitials(currentUser),
        recipient: selectedEmployee.name,
        content: newMessageContent.trim(),
        timestamp: new Date().toISOString(),
        type: "direct",
        status: "sent",
      };

      const res = await apiFetch<{ item?: MessageApi }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.item) {
        const newMsg = normalizeMessage(res.item);
        setConversationMessages((prev) => [...prev, newMsg]);
        setNewMessageContent("");
        await queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessageContent((prev) => prev + emojiData.emoji);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Loading state
  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title text-xl sm:text-2xl md:text-3xl">Messages</h1>
            <p className="page-subtitle text-sm sm:text-base">Communicate with your team</p>
          </div>
        </div>
        <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Empty state
  if (!conversationsQuery.isLoading && conversations.length === 0 && (view as string) === "list") {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title text-xl sm:text-2xl md:text-3xl">Messages</h1>
            <p className="page-subtitle text-sm sm:text-base">Communicate with your team</p>
          </div>
        </div>

        <div className="h-[calc(100vh-250px)] sm:h-[calc(100vh-280px)] md:h-[calc(100vh-300px)] flex flex-col items-center justify-center px-3 sm:px-4">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">No Messages Yet</h2>
              <p className="text-muted-foreground mt-1 sm:mt-2 max-w-xs sm:max-w-md text-sm sm:text-base">
                Start a conversation with an employee to send and receive messages.
              </p>
            </div>
            <Button size="lg" onClick={() => setView("employees")} className="gap-2 text-sm sm:text-base px-4 sm:px-6">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Start Conversation
            </Button>
          </div>
        </div>

        {/* Employee Selection Dialog */}
        <Dialog open={Boolean(view === "employees")} onOpenChange={() => setView("list")}>
          <DialogContent className="w-[95vw] max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="pb-2 sm:pb-4">
              <DialogTitle className="text-lg sm:text-xl">Select Employee</DialogTitle>
            </DialogHeader>

            <div className="relative mb-3 sm:mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-9 sm:pl-10 text-sm sm:text-base"
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id || employee._id}
                  onClick={() => startConversation(employee)}
                  className="w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate text-sm sm:text-base">{employee.name}</p>
                      {employee.milestoneLevel && employee.milestoneLabel && (
                        <MilestoneBadge level={employee.milestoneLevel} label={employee.milestoneLabel} size="sm" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.email}</p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {employee.department || "No Department"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] sm:text-xs",
                          employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {employee.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}

              {filteredEmployees.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-muted-foreground">No employees found</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          {view === "conversation" && selectedEmployee ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedEmployee(null); }} className="h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                {selectedEmployee.avatarUrl ? (
                  <AvatarImage src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {getInitials(selectedEmployee.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{selectedEmployee.name}</h1>
                  {selectedEmployee.milestoneLevel && selectedEmployee.milestoneLabel && (
                    <MilestoneBadge level={selectedEmployee.milestoneLevel} label={selectedEmployee.milestoneLabel} size="sm" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">{selectedEmployee.email}</p>
              </div>
            </div>
          ) : (
            <div className="page-header mb-0">
              <h1 className="page-title text-xl sm:text-2xl md:text-3xl lg:text-4xl">Messages</h1>
              <p className="page-subtitle text-xs sm:text-sm md:text-base mt-1">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {view !== "conversation" && (
          <Button onClick={() => setView("employees")} className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            New Conversation
          </Button>
        )}
      </div>

      {/* Conversation List View */}
      {view === "list" && (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-1 sm:mx-0 px-1 sm:px-0 scrollbar-thin">
            <Button
              variant={listFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setListFilter("all")}
              className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            >
              All
            </Button>
            <Button
              variant={listFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setListFilter("archived")}
              className="whitespace-nowrap gap-1 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            >
              <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Archived</span>
              <span className="sm:hidden">({archivedConversations.size})</span>
              <span className="hidden sm:inline">({archivedConversations.size})</span>
            </Button>
            <Button
              variant={listFilter === "bookmarked" ? "default" : "outline"}
              size="sm"
              onClick={() => setListFilter("bookmarked")}
              className="whitespace-nowrap gap-1 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            >
              <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Bookmarked</span>
              <span className="sm:hidden">({bookmarkedConversations.size})</span>
              <span className="hidden sm:inline">({bookmarkedConversations.size})</span>
            </Button>
          </div>

          {/* Search */}
          <Card className="border-0 sm:border shadow-none sm:shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conversations */}
          <Card className="border-0 sm:border shadow-none sm:shadow">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {/* Archived Section Header (when showing archived) */}
                {listFilter === "archived" && archivedConversations.size > 0 && (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Archived Conversations
                  </div>
                )}
                
                {/* Bookmarked Section Header (when showing bookmarked) */}
                {listFilter === "bookmarked" && bookmarkedConversations.size > 0 && (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Bookmarked Conversations
                  </div>
                )}

                {(() => {
                  // Filter conversations based on current filter
                  let displayConversations = filteredConversations;
                  
                  if (listFilter === "archived") {
                    displayConversations = filteredConversations.filter(
                      (conv) => archivedConversations.has(conv.employee.id || conv.employee._id || "")
                    );
                  } else if (listFilter === "bookmarked") {
                    displayConversations = filteredConversations.filter(
                      (conv) => bookmarkedConversations.has(conv.employee.id || conv.employee._id || "")
                    );
                  } else {
                    // "all" filter - show non-archived first
                    displayConversations = filteredConversations.filter(
                      (conv) => !archivedConversations.has(conv.employee.id || conv.employee._id || "")
                    );
                  }

                  if (displayConversations.length === 0) {
                    return (
                      <div className="p-4 sm:p-6 md:p-8 text-center">
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                          {listFilter === "archived" 
                            ? "No archived conversations" 
                            : listFilter === "bookmarked"
                            ? "No bookmarked conversations"
                            : "No conversations found"}
                        </p>
                        {listFilter !== "all" && (
                          <Button 
                            variant="outline" 
                            className="mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => setListFilter("all")}
                          >
                            Show All Conversations
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return displayConversations.map((conv) => {
                    const empId = conv.employee.id || conv.employee._id || "";
                    const isArchived = archivedConversations.has(empId);
                    const isBookmarked = bookmarkedConversations.has(empId);
                    
                    return (
                      <div
                        key={empId}
                        className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 hover:bg-muted/50 transition-colors"
                      >
                        {/* Main conversation button */}
                        <button
                          onClick={() => startConversation(conv.employee)}
                          className="flex-1 flex items-center gap-2 sm:gap-3 text-left min-w-0"
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12">
                              {conv.employee.avatarUrl ? (
                                <AvatarImage src={conv.employee.avatarUrl} alt={conv.employee.name} className="object-cover" />
                              ) : null}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                                {getInitials(conv.employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unreadCount > 0 && !isArchived && (
                              <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-[9px] sm:text-[10px] flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                <p className="font-medium truncate text-xs sm:text-sm md:text-base">{conv.employee.name}</p>
                                {isBookmarked && (
                                  <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 flex-shrink-0" fill="currentColor" />
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-[9px] sm:text-xs text-muted-foreground flex-shrink-0">
                                  {formatMessageTime(conv.lastMessage.timestamp)}
                                </p>
                              )}
                            </div>
                            <p className={cn(
                              "text-[11px] sm:text-xs md:text-sm truncate",
                              conv.unreadCount > 0 && !isArchived ? "font-medium text-foreground" : "text-muted-foreground"
                            )}>
                              {conv.lastMessage 
                                ? `${conv.lastMessage.sender === currentUser ? "You: " : ""}${conv.lastMessage.content}`
                                : "Start a conversation..."
                              }
                            </p>
                          </div>
                        </button>
                        
                        {/* Action buttons - visible on hover */}
                        <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => toggleBookmark(e, empId)}
                            title={isBookmarked ? "Remove bookmark" : "Bookmark conversation"}
                          >
                            <Bookmark 
                              className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isBookmarked ? "text-amber-500" : "text-muted-foreground")} 
                              fill={isBookmarked ? "currentColor" : "none"}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => toggleArchive(e, empId)}
                            title={isArchived ? "Unarchive" : "Archive conversation"}
                          >
                            <Archive 
                              className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isArchived ? "text-primary" : "text-muted-foreground")} 
                            />
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Employee Selection Dialog */}
      <Dialog open={Boolean(view === "employees")} onOpenChange={() => setView("list")}>
        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col p-3 sm:p-4 md:p-6">
          <DialogHeader className="pb-2 sm:pb-3 md:pb-4">
            <DialogTitle className="text-sm sm:text-base md:text-lg">Select Employee to Message</DialogTitle>
          </DialogHeader>

          <div className="relative mb-3 sm:mb-4 md:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees by name, email, or department..."
              className="pl-9 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
              value={employeeSearchQuery}
              onChange={(e) => setEmployeeSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id || employee._id}
                onClick={() => startConversation(employee)}
                className="w-full flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-2.5 md:p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
                  {employee.avatarUrl ? (
                    <AvatarImage src={employee.avatarUrl} alt={employee.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs sm:text-sm md:text-base">{employee.name}</p>
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate">{employee.email}</p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs">
                      {employee.department || "No Department"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] sm:text-[10px] md:text-xs",
                        employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-6 sm:py-8 md:py-10">
                <User className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">No employees found</p>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation View */}
      {view === "conversation" && selectedEmployee && (
        <>
          {preview ? (
            <Dialog open={Boolean(preview)} onOpenChange={(o) => (!o ? setPreview(null) : null)}>
              <DialogContent className="w-[95vw] max-w-3xl p-3 sm:p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
                    <span className="truncate">{preview.fileName}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                      onClick={() => downloadAttachment(preview.url, preview.fileName)}
                    >
                      <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Download
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="w-full">
                  <img
                    src={toProxiedUrl(preview.url) || preview.url}
                    alt={preview.fileName}
                    className="w-full max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] object-contain rounded-md"
                  />
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

          <Card className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] md:h-[calc(100vh-280px)] min-h-[350px] sm:min-h-[400px] border-0 sm:border shadow-none sm:shadow">
          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
            {conversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 sm:px-4">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground/50 mb-2 sm:mb-3 md:mb-4" />
                <p className="text-sm sm:text-base md:text-lg font-medium">Start the conversation</p>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Send a message to {selectedEmployee.name}</p>
              </div>
            ) : (
              <>
                {conversationMessages.map((msg, index) => {
                  const isMe = msg.sender === currentUser;
                  const showAvatar = index === 0 || conversationMessages[index - 1].sender !== msg.sender;
                  const attachmentUrl = msg.attachment?.url || "";
                  const attachmentName = msg.attachment?.fileName || "attachment";
                  const attachmentMime = msg.attachment?.mimeType || "";
                  const isImage = attachmentMime.startsWith("image/");

                  return (
                    <div key={msg.id} className={cn("flex gap-1.5 sm:gap-2 md:gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                      {showAvatar ? (
                        <Avatar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 flex-shrink-0">
                          {isMe ? null : selectedEmployee?.avatarUrl ? (
                            <AvatarImage src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className={cn("text-[9px] sm:text-xs", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            {getInitials(isMe ? currentUser : msg.sender)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-5 sm:w-6 md:w-8 flex-shrink-0" />
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                        )}
                      >
                        {attachmentUrl ? (
                          isImage ? (
                            <button
                              type="button"
                              className="block"
                              onClick={() => setPreview({ url: attachmentUrl, fileName: attachmentName })}
                            >
                              <img
                                src={toProxiedUrl(attachmentUrl) || attachmentUrl}
                                alt={attachmentName}
                                className="max-w-[100px] sm:max-w-[140px] md:max-w-[160px] max-h-[100px] sm:max-h-[140px] md:max-h-[160px] rounded-md object-cover"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={cn(
                                "text-[10px] sm:text-xs md:text-sm underline",
                                isMe ? "text-primary-foreground" : "text-foreground",
                              )}
                              onClick={() => downloadAttachment(attachmentUrl, attachmentName)}
                            >
                              {attachmentName}
                            </button>
                          )
                        ) : null}

                        {msg.content?.trim() ? <p className="break-words">{msg.content}</p> : null}
                        <p className={cn("text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {formatMessageTime(msg.timestamp)}
                          {isMe && (
                            <span className="ml-1">
                              {msg.status === "sent" && "✓"}
                              {msg.status === "delivered" && "✓✓"}
                              {msg.status === "read" && "✓✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Message Input */}
          <div className="p-2 sm:p-3 md:p-4 border-t relative">
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={380} />
              </div>
            )}
            <div className="flex flex-col gap-2 sm:gap-2.5 md:gap-3">
              <div className="flex gap-1.5 sm:gap-2 md:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  aria-label="Attach file"
                  onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
                >
                  <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
                >
                  <Smile className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Button>
                <Textarea
                  placeholder={`Message ${selectedEmployee.name}...`}
                  className="min-h-[40px] sm:min-h-[48px] md:min-h-[60px] resize-none text-xs sm:text-sm md:text-base"
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessageContent.trim() || sending || uploading} 
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0 px-0"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </div>
          </Card>
        </>
      )}
    </div>
  );
}