import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { useSocket } from "@/contexts/SocketContext";
import EmojiPicker, { EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Plus, Search, Send, ArrowLeft, MessageCircle, User, Archive, Bookmark, Paperclip, Download, Smile, Mic, Pin, Star, Users, Folder, MessageSquare, CheckCheck, Check, CornerDownRight, Sparkles, FileText, Lock, Megaphone } from "lucide-react";
import { apiFetch, listResource, toProxiedUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { renderMessageContent } from "@/lib/linkify";
import MessageReactionBar, { type MessageReaction } from "@/components/shared/MessageReactionBar";
import MentionsTextarea from "@/components/shared/MentionsTextarea";
import VoiceRecorder from "@/components/shared/VoiceRecorder";
import CreateGroupModal from "@/components/shared/CreateGroupModal";
import ThreadDrawer from "@/components/shared/ThreadDrawer";
import MediaVaultDrawer from "@/components/shared/MediaVaultDrawer";
import { toast } from "sonner";

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
  current_status?: "AVAILABLE" | "LUNCH" | "BREAK";
  lunch_start_time?: string | null;
  lunch_expected_end?: string | null;
  break_start_time?: string | null;
}

interface ChatGroup {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  groupType: "custom" | "department" | "project" | "task";
  isPrivate?: boolean;
  announcementOnly?: boolean;
  members: string[];
  admins: string[];
  createdBy: string;
  updatedAt?: string;
}

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  recipient: string;
  groupId?: string;
  parentMessageId?: string;
  replyCount?: number;
  content: string;
  timestamp: string;
  type: "direct" | "broadcast" | "group" | "task_card" | "voice_note" | "system";
  status: "sent" | "delivered" | "read";
  createdAt?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
  voiceNote?: { url?: string; duration?: number; waveform?: number[] };
  taskCard?: { taskId?: string; title?: string; status?: string; priority?: string; dueDate?: string; assignees?: string[] };
  isPinned?: boolean;
  pinnedBy?: string;
  starredBy?: string[];
  reactions?: MessageReaction[];
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function normalizeMessage(m: any): Message {
  return {
    id: String(m._id || m.id || ""),
    sender: m.sender || "",
    senderAvatar: m.senderAvatar || "",
    recipient: m.recipient || "",
    groupId: m.groupId ? String(m.groupId) : undefined,
    parentMessageId: m.parentMessageId ? String(m.parentMessageId) : undefined,
    replyCount: Number(m.replyCount || 0),
    content: m.content || "",
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    type: m.type || "direct",
    status: m.status || "sent",
    createdAt: m.createdAt,
    attachment: m.attachment,
    attachments: Array.isArray(m.attachments) ? m.attachments : [],
    voiceNote: m.voiceNote,
    taskCard: m.taskCard,
    isPinned: Boolean(m.isPinned),
    pinnedBy: m.pinnedBy || "",
    starredBy: Array.isArray(m.starredBy) ? m.starredBy : [],
    reactions: Array.isArray(m.reactions)
      ? m.reactions.map((r: any) => ({ emoji: String(r.emoji || ""), username: String(r.username || "") }))
      : [],
  };
}

function isDuplicateMessage(prev: Message[], newMsg: Message): boolean {
  if (newMsg.id && prev.some((m) => m.id === newMsg.id)) return true;
  return prev.some((m) => {
    const isSameMetadata = 
      m.sender === newMsg.sender && 
      m.recipient === newMsg.recipient && 
      m.content === newMsg.content;
    if (!isSameMetadata) return false;
    const t1 = new Date(m.timestamp).getTime();
    const t2 = new Date(newMsg.timestamp).getTime();
    return Math.abs(t1 - t2) < 10000;
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Messaging() {
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { socket } = useSocket();

  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getAvatarRingStyles = (empStatus: string | undefined) => {
    if (empStatus === "LUNCH") {
      return {
        border: "2.5px solid #F59E0B",
        boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)",
      };
    }
    if (empStatus === "BREAK") {
      return {
        border: "2.5px solid #8B5CF6",
        boxShadow: "0 0 10px rgba(139, 92, 246, 0.6)",
      };
    }
    return {};
  };

  const getAvatarDotClassAndStyle = (empStatus: string | undefined, isActive: boolean) => {
    if (!isActive) return null;
    if (empStatus === "LUNCH") {
      return (
        <div 
          className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full shadow-md animate-pulse animate-duration-1000" 
          style={{ backgroundColor: "#F59E0B" }}
        />
      );
    }
    if (empStatus === "BREAK") {
      return (
        <div 
          className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full shadow-md animate-pulse animate-duration-1000" 
          style={{ backgroundColor: "#8B5CF6" }}
        />
      );
    }
    return (
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
    );
  };

  const getSubtitle = (emp: any) => {
    if (emp.current_status === "LUNCH" && emp.lunch_start_time) {
      const start = new Date(emp.lunch_start_time).getTime();
      const expectedEnd = emp.lunch_expected_end ? new Date(emp.lunch_expected_end).getTime() : start + 30 * 60 * 1000;
      const diff = expectedEnd - nowTime;
      const timeStr = new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      if (diff > 0) {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `On Lunch since ${timeStr} (${m}m ${s}s remaining)`;
      }
      const overdue = Math.floor(-diff / 60000);
      return `Overdue Lunch since ${timeStr} (${overdue}m overdue)`;
    }
    if (emp.current_status === "BREAK" && emp.break_start_time) {
      const start = new Date(emp.break_start_time).getTime();
      const expectedEnd = start + 15 * 60 * 1000;
      const diff = expectedEnd - nowTime;
      const timeStr = new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      if (diff > 0) {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `On Break since ${timeStr} (${m}m ${s}s remaining)`;
      }
      const overdue = Math.floor(-diff / 60000);
      return `Overdue Break since ${timeStr} (${overdue}m overdue)`;
    }
    return emp.department || "No department";
  };

  // View state
  const [view, setView] = useState<"list" | "conversation" | "employees" | "group">("list");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeTab, setActiveTab] = useState<"direct" | "groups" | "departments" | "starred">("direct");
  const [listFilter, setListFilter] = useState<"all" | "archived" | "bookmarked">("all");

  // Enterprise Drawers & Modals State
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [voiceRecordingOpen, setVoiceRecordingOpen] = useState(false);
  const [activeThreadParent, setActiveThreadParent] = useState<Message | null>(null);
  const [mediaVaultOpen, setMediaVaultOpen] = useState(false);
  const [multiAttachments, setMultiAttachments] = useState<{ fileName: string; url: string; mimeType: string; size: number }[]>([]);

  // Archive and Bookmark state (persisted to localStorage)
  const [archivedConversations, setArchivedConversations] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("messaging-archived");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [bookmarkedConversations, setBookmarkedConversations] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("messaging-bookmarked");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Real-time new message via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: any) => {
      const normalized = normalizeMessage(msg);
      if (!normalized.id) return;
      // Always refresh the conversation list sidebar
      loadConversations();
      // Append to current conversation if applicable
      if (
        view === "conversation" &&
        selectedEmployee &&
        (normalized.sender === selectedEmployee.name || normalized.recipient === selectedEmployee.name)
      ) {
        setConversationMessages((prev) => {
          if (isDuplicateMessage(prev, normalized)) return prev;
          return [...prev, normalized].sort((a, b) => a.id.localeCompare(b.id));
        });
      }
    };
    socket.on("new-message", handleNewMessage);
    return () => { socket.off("new-message", handleNewMessage); };
  }, [socket, view, selectedEmployee?.name]);

  // Real-time reaction updates via socket
  useEffect(() => {
    if (!socket) return;
    const handleReaction = (payload: { messageId?: string; reactions?: MessageReaction[] }) => {
      if (!payload?.messageId) return;
      setConversationMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions || [] } : m))
      );
    };
    socket.on("message-reaction", handleReaction);
    return () => { socket.off("message-reaction", handleReaction); };
  }, [socket]);

  // Real-time status updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (payload: {
      userId: string;
      current_status: "AVAILABLE" | "LUNCH" | "BREAK";
      lunch_start_time: string | null;
      lunch_expected_end: string | null;
      break_start_time: string | null;
      name: string;
    }) => {
      console.log("⚡ Status update received in Admin Messaging:", payload);

      // Update conversations list state
      setConversations((old) => {
        if (!old) return old;
        return old.map((conv) => {
          const empId = conv.employee.id || conv.employee._id;
          if (empId === payload.userId || conv.employee.name === payload.name) {
            return {
              ...conv,
              employee: {
                ...conv.employee,
                current_status: payload.current_status,
                lunch_start_time: payload.lunch_start_time,
                lunch_expected_end: payload.lunch_expected_end,
                break_start_time: payload.break_start_time,
              },
            };
          }
          return conv;
        });
      });

      // Update employees list state
      setEmployees((old) => {
        if (!old) return old;
        return old.map((emp) => {
          const empId = emp.id || emp._id;
          if (empId === payload.userId || emp.name === payload.name) {
            return {
              ...emp,
              current_status: payload.current_status,
              lunch_start_time: payload.lunch_start_time,
              lunch_expected_end: payload.lunch_expected_end,
              break_start_time: payload.break_start_time,
            };
          }
          return emp;
        });
      });

      // Update selected employee status in state
      setSelectedEmployee((prev) => {
        if (prev) {
          const prevId = prev.id || prev._id;
          if (prevId === payload.userId || prev.name === payload.name) {
            return {
              ...prev,
              current_status: payload.current_status,
              lunch_start_time: payload.lunch_start_time,
              lunch_expected_end: payload.lunch_expected_end,
              break_start_time: payload.break_start_time,
            };
          }
        }
        return prev;
      });
    };

    socket.on("status-update", handleStatusUpdate);

    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket]);

  // Polling fallback: refresh messages every 3s when conversation is open
  useEffect(() => {
    if (view !== "conversation" || !selectedEmployee) return;
    const interval = setInterval(() => {
      loadConversationMessages(selectedEmployee.name);
    }, 3000);
    return () => clearInterval(interval);
  }, [view, selectedEmployee?.name]);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("messaging-archived", JSON.stringify([...archivedConversations]));
  }, [archivedConversations]);

  useEffect(() => {
    localStorage.setItem("messaging-bookmarked", JSON.stringify([...bookmarkedConversations]));
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

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  // New message
  const [newMessageContent, setNewMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const isInitialLoad = useRef(true);
  const isSendingMessage = useRef(false);
  const prevMessagesLength = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEmployee) {
      isInitialLoad.current = true;
    }
  }, [selectedEmployee]);

  const { name: authName, username: authUsername } = getAuthState();
  const currentUser = (authName || authUsername || "Admin").trim();

  // Toggle the current user's emoji reaction on a message
  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await apiFetch<{ messageId: string; reactions: MessageReaction[] }>(
        `/api/messages/${encodeURIComponent(messageId)}/react`,
        { method: "POST", body: JSON.stringify({ emoji, username: currentUser }) }
      );
      setConversationMessages((prev) =>
        prev.map((m) => (m.id === res.messageId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

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

  useEffect(() => {
    loadConversations(true);
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeesList = await listResource<Employee>("employees");
      setEmployees(employeesList);
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await apiFetch<{ items: ChatGroup[] }>("/api/messages/groups");
      setGroups(res.items || []);
    } catch (e) {
      console.error("Failed to load groups:", e);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const startGroupChat = async (group: ChatGroup) => {
    setSelectedGroup(group);
    setSelectedEmployee(null);
    setView("group");
    if (socket) {
      socket.emit("join-group", group.id);
    }
    try {
      const res = await apiFetch<{ items: MessageApi[] }>(`/api/messages/groups/${group.id}/messages`);
      setConversationMessages((res.items || []).map(normalizeMessage));
    } catch (e) {
      toast.error("Failed to load group messages");
    }
  };

  const handleSendVoiceNote = async (audioBlob: Blob, duration: number, waveform: number[]) => {
    try {
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
      const att = await uploadAttachment(file);

      const payload: Partial<Message> = {
        sender: currentUser,
        senderAvatar: getInitials(currentUser),
        recipient: selectedEmployee ? selectedEmployee.name : "",
        groupId: selectedGroup ? selectedGroup.id : undefined,
        content: "Voice Note",
        timestamp: new Date().toISOString(),
        type: "voice_note",
        voiceNote: { url: att.url, duration, waveform },
      };

      const res = await apiFetch<{ item: MessageApi }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.item) {
        setConversationMessages((prev) => [...prev, normalizeMessage(res.item)]);
      }
      setVoiceRecordingOpen(false);
      toast.success("Voice note sent");
    } catch (err) {
      toast.error("Failed to send voice note");
    }
  };

  const handleConvertToTask = async (msg: Message) => {
    try {
      await apiFetch(`/api/messages/${msg.id}/convert-to-task`, {
        method: "POST",
        body: JSON.stringify({ priority: "medium" }),
      });
      toast.success("Task created from message successfully!");
    } catch (err) {
      toast.error("Failed to convert message to task");
    }
  };

  const handlePinMessage = async (msg: Message) => {
    try {
      const res = await apiFetch<{ item: MessageApi }>(`/api/messages/${msg.id}/pin`, { method: "POST" });
      const updated = normalizeMessage(res.item);
      setConversationMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success(updated.isPinned ? "Message pinned" : "Message unpinned");
    } catch (err) {
      toast.error("Failed to pin message");
    }
  };

  const handleStarMessage = async (msg: Message) => {
    try {
      const res = await apiFetch<{ item: MessageApi }>(`/api/messages/${msg.id}/star`, { method: "POST" });
      const updated = normalizeMessage(res.item);
      setConversationMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success(updated.starredBy?.includes(currentUser) ? "Message starred" : "Message unstarred");
    } catch (err) {
      toast.error("Failed to star message");
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

    isSendingMessage.current = true;
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
        setConversationMessages((prev) => {
          if (isDuplicateMessage(prev, newMsg)) return prev;
          return [...prev, newMsg];
        });
        setNewMessageContent("");
        await loadConversations();
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to send attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const loadConversations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setApiError(null);
      const res = await apiFetch<{ items?: ConversationFromApi[] }>(`/api/messages/conversations/${encodeURIComponent(currentUser)}`);
      const convs = res.items ?? [];
      setConversations(convs.map((c) => ({
        employee: c.employee,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
      })));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const loadConversationMessages = async (employeeName: string) => {
    try {
      const res = await apiFetch<{ items?: MessageApi[] }>(
        `/api/messages/conversation/${encodeURIComponent(currentUser)}/${encodeURIComponent(employeeName)}`
      );
      const msgs = res.items ?? [];
      setConversationMessages(msgs.map(normalizeMessage).sort((a, b) => a.id.localeCompare(b.id)));
    } catch (e) {
      console.error("Failed to load conversation messages:", e);
      setConversationMessages([]);
    }
  };

  const markMessagesAsRead = async (sender: string) => {
    try {
      await apiFetch("/api/messages/mark-read", {
        method: "POST",
        body: JSON.stringify({ sender, recipient: currentUser }),
      });
      // Refresh conversations to update unread counts
      await loadConversations();
      await queryClient.invalidateQueries({ queryKey: ["admin-messages-preview"] });
    } catch (e) {
      console.error("Failed to mark messages as read:", e);
    }
  };

  // Smart Scroll to bottom of messages
  useEffect(() => {
    if (view !== "conversation") return;
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isInitialLoad.current) {
      container.scrollTop = container.scrollHeight;
      isInitialLoad.current = false;
      prevMessagesLength.current = conversationMessages.length;
    } else if (isSendingMessage.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      isSendingMessage.current = false;
      prevMessagesLength.current = conversationMessages.length;
    } else if (conversationMessages.length > prevMessagesLength.current) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
      prevMessagesLength.current = conversationMessages.length;
    } else {
      prevMessagesLength.current = conversationMessages.length;
    }
  }, [view, conversationMessages]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.employee.name.toLowerCase().includes(q) ||
      conv.employee.email.toLowerCase().includes(q) ||
      conv.employee.department.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Filtered employees for selection
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchQuery.trim()) return employees;
    const q = employeeSearchQuery.toLowerCase();
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  }, [employees, employeeSearchQuery]);

  const startConversation = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setView("conversation");
    setEmployeeSearchQuery("");
    // Load conversation messages from API
    await loadConversationMessages(employee.name);
    // Mark messages as read
    if (employee.name) {
      await markMessagesAsRead(employee.name);
    }
  };

  const sendMessage = async () => {
    if (!newMessageContent.trim() || !selectedEmployee) return;

    isSendingMessage.current = true;
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
        setConversationMessages((prev) => {
          if (isDuplicateMessage(prev, newMsg)) return prev;
          return [...prev, newMsg];
        });
        setNewMessageContent("");
        setShowEmojiPicker(false);
        await loadConversations();
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to send message");
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

  // Empty state - No conversations yet
  if (!loading && conversations.length === 0 && view === "list") {
    return (
      <>
        <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">No Messages Yet</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Start a conversation with an employee to send and receive messages.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => setView("employees")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start Conversation
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            {view === "conversation" && selectedEmployee ? (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setView("list");
                    setSelectedEmployee(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10" style={getAvatarRingStyles(selectedEmployee.current_status)}>
                  {selectedEmployee.avatarUrl ? (
                    <AvatarImage src={toProxiedUrl(selectedEmployee.avatarUrl) || selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(selectedEmployee.name)}
                  </AvatarFallback>
                  {getAvatarDotClassAndStyle(selectedEmployee.current_status, true)}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">{selectedEmployee.name}</h1>
                    {selectedEmployee.current_status === "LUNCH" && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">On Lunch</Badge>
                    )}
                    {selectedEmployee.current_status === "BREAK" && (
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">On Break</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.current_status && selectedEmployee.current_status !== "AVAILABLE"
                      ? getSubtitle(selectedEmployee)
                      : selectedEmployee.email}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Messaging Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Enterprise messaging & group channels
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {["super-admin", "admin"].includes((getAuthState().role || "").toLowerCase()) && (
              <Button
                onClick={() => setCreateGroupOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
              >
                <Users className="h-4 w-4 mr-2" />
                + Create Group
              </Button>
            )}
            {view !== "conversation" && view !== "group" && (
              <Button 
                onClick={() => setView("employees")}
                variant="outline"
                className="font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Direct Chat
              </Button>
            )}
            {(selectedEmployee || selectedGroup) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaVaultOpen(true)}
                className="font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Folder className="h-4 w-4 text-blue-500" />
                Media Vault
              </Button>
            )}
          </div>
        </div>

        {/* Tab Selector for Conversations & Channels */}
        {view === "list" && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("direct")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "direct" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <MessageCircle className="h-4 w-4 text-blue-400" />
              Direct Messages ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "groups" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="h-4 w-4 text-purple-400" />
              Group Channels ({groups.length})
            </button>
          </div>
        )}

        {/* Error Message */}
        {apiError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
            <p className="text-sm text-destructive">{apiError}</p>
          </div>
        )}

        {/* Conversation & Group List View */}
        {view === "list" && activeTab === "groups" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Your Enterprise Groups & Channels
                </h3>
              </div>

              {groups.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Users className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No group channels found</p>
                  <p className="text-xs text-slate-400">Admins can create group channels for departments, projects, or teams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => startGroupChat(group)}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md cursor-pointer transition-all flex items-start gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold flex-shrink-0">
                        {group.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{group.name}</h4>
                          {group.isPrivate && <Lock className="h-3.5 w-3.5 text-purple-600" />}
                        </div>
                        {group.description && <p className="text-xs text-slate-500 truncate mt-0.5">{group.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                          </Badge>
                          {group.announcementOnly && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                              <Megaphone className="h-3 w-3" /> Announcement
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {view === "list" && activeTab === "direct" && (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={listFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setListFilter("all")}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                variant={listFilter === "archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setListFilter("archived")}
                className="whitespace-nowrap gap-1"
              >
                <Archive className="h-3.5 w-3.5" />
                Archived ({archivedConversations.size})
              </Button>
              <Button
                variant={listFilter === "bookmarked" ? "default" : "outline"}
                size="sm"
                onClick={() => setListFilter("bookmarked")}
                className="whitespace-nowrap gap-1"
              >
                <Bookmark className="h-3.5 w-3.5" />
                Bookmarked ({bookmarkedConversations.size})
              </Button>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conversations */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {/* Archived Section Header (when showing archived) */}
                  {listFilter === "archived" && archivedConversations.size > 0 && (
                    <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Archive className="h-3.5 w-3.5" />
                      Archived Conversations
                    </div>
                  )}
                  
                  {/* Bookmarked Section Header (when showing bookmarked) */}
                  {listFilter === "bookmarked" && bookmarkedConversations.size > 0 && (
                    <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Bookmark className="h-3.5 w-3.5" />
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
                      // "all" filter - show non-archived first, then archived at bottom
                      const nonArchived = filteredConversations.filter(
                        (conv) => !archivedConversations.has(conv.employee.id || conv.employee._id || "")
                      );
                      displayConversations = nonArchived;
                    }

                    if (displayConversations.length === 0) {
                      return (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">
                            {listFilter === "archived" 
                              ? "No archived conversations" 
                              : listFilter === "bookmarked"
                              ? "No bookmarked conversations"
                              : "No conversations found"}
                          </p>
                          {listFilter !== "all" && (
                            <Button 
                              variant="outline" 
                              className="mt-4"
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
                          className="group flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                        >
                          {/* Main conversation button */}
                          <button
                            onClick={() => startConversation(conv.employee)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0"
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-12 w-12" style={getAvatarRingStyles(conv.employee.current_status)}>
                                {conv.employee.avatarUrl ? (
                                  <AvatarImage src={toProxiedUrl(conv.employee.avatarUrl) || conv.employee.avatarUrl} alt={conv.employee.name} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getInitials(conv.employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              {getAvatarDotClassAndStyle(conv.employee.current_status, true)}
                              {conv.unreadCount > 0 && !isArchived && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{conv.employee.name}</p>
                                  {conv.employee.current_status === "LUNCH" && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] h-4 py-0 px-1 font-semibold">Lunch</Badge>
                                  )}
                                  {conv.employee.current_status === "BREAK" && (
                                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] h-4 py-0 px-1 font-semibold">Break</Badge>
                                  )}
                                  {isBookmarked && (
                                    <Bookmark className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" fill="currentColor" />
                                  )}
                                </div>
                                {conv.lastMessage && (
                                  <p className="text-xs text-muted-foreground flex-shrink-0">
                                    {formatMessageTime(conv.lastMessage.timestamp)}
                                  </p>
                                )}
                              </div>
                              <p className={cn(
                                "text-sm truncate",
                                conv.unreadCount > 0 && !isArchived ? "font-medium text-foreground" : "text-muted-foreground"
                              )}>
                                {conv.lastMessage 
                                  ? `${conv.lastMessage.sender === currentUser || conv.lastMessage.sender === "You" ? "You: " : ""}${conv.lastMessage.content}`
                                  : "Start a conversation..."
                                }
                              </p>
                            </div>
                          </button>
                          
                          {/* Action buttons - visible on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => toggleBookmark(e, empId)}
                              title={isBookmarked ? "Remove bookmark" : "Bookmark conversation"}
                            >
                              <Bookmark 
                                className={cn("h-4 w-4", isBookmarked ? "text-amber-500" : "text-muted-foreground")} 
                                fill={isBookmarked ? "currentColor" : "none"}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => toggleArchive(e, empId)}
                              title={isArchived ? "Unarchive" : "Archive conversation"}
                            >
                              <Archive 
                                className={cn("h-4 w-4", isArchived ? "text-primary" : "text-muted-foreground")} 
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
        <Dialog open={view === "employees"} onOpenChange={() => setView("list")}>
          <DialogContent className="w-[95vw] max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Employee to Message</DialogTitle>
            </DialogHeader>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or department..."
                className="pl-10"
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id || employee._id}
                  onClick={() => startConversation(employee)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12" style={getAvatarRingStyles(employee.current_status)}>
                      {employee.avatarUrl ? (
                        <AvatarImage src={toProxiedUrl(employee.avatarUrl) || employee.avatarUrl} alt={employee.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    {getAvatarDotClassAndStyle(employee.current_status, true)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{employee.name}</p>
                      {employee.current_status === "LUNCH" && (
                        <Badge className="bg-amber-500 text-white text-[10px] h-4 py-0 px-1 font-semibold">Lunch</Badge>
                      )}
                      {employee.current_status === "BREAK" && (
                        <Badge className="bg-purple-600 text-white text-[10px] h-4 py-0 px-1 font-semibold">Break</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {employee.current_status && employee.current_status !== "AVAILABLE"
                        ? getSubtitle(employee)
                        : employee.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {employee.department || "No Department"}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
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
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No employees found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try a different search term
                  </p>
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
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                      <span className="truncate">{preview.fileName}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => downloadAttachment(preview.url, preview.fileName)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="w-full">
                    <img
                      src={toProxiedUrl(preview.url) || preview.url}
                      alt={preview.fileName}
                      className="w-full max-h-[70vh] object-contain rounded-md"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}

            <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
              {/* Messages Area */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Start the conversation</p>
                  <p className="text-muted-foreground">
                    Send a message to {selectedEmployee.name}
                  </p>
                </div>
              ) : (
                <>
                  {conversationMessages.map((msg, index) => {
                    const isMe = msg.sender === currentUser || msg.sender === "You";
                    const showAvatar = index === 0 || conversationMessages[index - 1].sender !== msg.sender;
                    const attachmentUrl = msg.attachment?.url || "";
                    const attachmentName = msg.attachment?.fileName || "attachment";
                    const attachmentMime = msg.attachment?.mimeType || "";
                    const isImage = attachmentMime.startsWith("image/");
                    
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        {showAvatar ? (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {isMe ? null : selectedEmployee?.avatarUrl ? (
                              <AvatarImage src={toProxiedUrl(selectedEmployee.avatarUrl) || selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                              {getInitials(isMe ? currentUser : msg.sender)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        <div className={cn("max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted rounded-bl-none"
                          )}
                        >
                          {/* Voice Note Rendering */}
                          {msg.type === "voice_note" && msg.voiceNote?.url && (
                            <div className="flex items-center gap-2 bg-slate-900 text-white p-2.5 rounded-xl border border-slate-700 my-1">
                              <Mic className="h-4 w-4 text-blue-400 flex-shrink-0 animate-pulse" />
                              <span className="text-[11px] font-mono font-bold text-blue-300">Voice Note ({msg.voiceNote.duration || 0}s)</span>
                              <audio controls src={toProxiedUrl(msg.voiceNote.url) || msg.voiceNote.url} className="h-6 w-36" />
                            </div>
                          )}

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
                                  className="max-w-[160px] max-h-[160px] rounded-md object-cover"
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={cn(
                                  "text-sm underline",
                                  isMe ? "text-primary-foreground" : "text-foreground",
                                )}
                                onClick={() => downloadAttachment(attachmentUrl, attachmentName)}
                              >
                                {attachmentName}
                              </button>
                            )
                          ) : null}

                          {msg.content?.trim() ? <p className="text-sm">{renderMessageContent(msg.content, isMe)}</p> : null}

                          {/* Message Context Actions (Thread, Convert to Task, Pin, Star) */}
                          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-200/30 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setActiveThreadParent(msg)}
                              className="hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
                            >
                              <MessageSquare className="h-3 w-3" /> Reply in Thread {msg.replyCount ? `(${msg.replyCount})` : ""}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConvertToTask(msg)}
                              className="hover:underline flex items-center gap-1 text-amber-300 hover:text-amber-200"
                            >
                              <Sparkles className="h-3 w-3" /> Task
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePinMessage(msg)}
                              className="hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
                            >
                              <Pin className={`h-3 w-3 ${msg.isPinned ? "fill-current" : ""}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStarMessage(msg)}
                              className="hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
                            >
                              <Star className={`h-3 w-3 ${msg.starredBy?.includes(currentUser) ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>

                          <p className={cn(
                            "text-[10px] mt-0.5",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(msg.timestamp)}
                            {isMe && (
                              <span className="ml-2">
                                {msg.status === "sent" && "✓"}
                                {msg.status === "delivered" && "✓✓"}
                                {msg.status === "read" && "✓✓"}
                              </span>
                            )}
                          </p>
                        </div>
                        <MessageReactionBar
                          reactions={msg.reactions || []}
                          currentUser={currentUser}
                          isMe={isMe}
                          onToggle={(emoji) => void toggleReaction(msg.id, emoji)}
                        />
                        </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                 </>
               )}
               </div>
 
               {/* Message Input */}
               <div className="p-4 border-t relative">
                 {voiceRecordingOpen ? (
                   <VoiceRecorder
                     onSendVoiceNote={handleSendVoiceNote}
                     onCancel={() => setVoiceRecordingOpen(false)}
                   />
                 ) : (
                   <>
                     {showEmojiPicker && (
                       <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 z-50">
                         <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} emojiStyle={EmojiStyle.NATIVE} />
                       </div>
                     )}
                     <div className="flex items-center gap-3">
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
                         title="Attach File"
                       >
                         <Paperclip className="h-4 w-4" />
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="icon"
                         onClick={() => setVoiceRecordingOpen(true)}
                         title="Record Voice Note"
                       >
                         <Mic className="h-4 w-4 text-red-500" />
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="icon"
                         onClick={() => setShowEmojiPicker((prev) => !prev)}
                       >
                         <Smile className="h-4 w-4" />
                       </Button>
                       <MentionsTextarea
                         placeholder={`Message ${selectedEmployee?.name || selectedGroup?.name || 'chat'}... (type @ to mention)`}
                         className="min-h-[60px] resize-none"
                         value={newMessageContent}
                         onChange={setNewMessageContent}
                         onSubmit={sendMessage}
                         users={employees
                           .filter((e) => e.name && e.name !== currentUser)
                           .map((e) => ({ name: e.name, avatarUrl: toProxiedUrl(e.avatarUrl) || e.avatarUrl, role: e.role }))}
                       />
                       <Button
                         onClick={sendMessage}
                         disabled={!newMessageContent.trim() || sending || uploading}
                         className="h-auto px-4"
                       >
                         <Send className="h-5 w-5" />
                       </Button>
                     </div>
                   </>
                 )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Enterprise Group Creation Modal */}
      <CreateGroupModal
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        employees={employees}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
          startGroupChat(newGroup);
        }}
      />

      {/* Thread Drawer */}
      <ThreadDrawer
        open={Boolean(activeThreadParent)}
        onClose={() => setActiveThreadParent(null)}
        parentMessage={activeThreadParent}
        currentUser={currentUser}
      />

      {/* Media Vault Drawer */}
      <MediaVaultDrawer
        open={mediaVaultOpen}
        onClose={() => setMediaVaultOpen(false)}
        groupId={selectedGroup?.id}
        recipient={selectedEmployee?.name}
      />
    </>
  );
}
