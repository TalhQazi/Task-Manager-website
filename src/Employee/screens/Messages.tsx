import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useSocket } from "@/contexts/SocketContext";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  Search,
  ChevronLeft,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Download,
  Smile,
} from "lucide-react";
import {
  getEmployeeConversations,
  getConversation,
  sendMessage,
  markMessagesAsRead,
  getEmployeeProfile,
  uploadMessageAttachment,
  toProxiedUrl,
} from "../lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { renderMessageContent } from "@/lib/linkify";

interface Conversation {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    initials: string;
    avatarUrl?: string;
    current_status?: string;
    lunch_start_time?: string | null;
    lunch_expected_end?: string | null;
    break_start_time?: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: string;
    sender: string;
    status: string;
  } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  type: string;
  status: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
}

const normalizeMessage = (m: any): Message => {
  return {
    id: String(m.id || m._id || ""),
    sender: String(m.sender || ""),
    recipient: String(m.recipient || ""),
    content: String(m.content || ""),
    timestamp: String(m.timestamp || m.createdAt || new Date().toISOString()),
    type: String(m.type || "direct"),
    status: String(m.status || "sent"),
    attachment: m.attachment,
  };
};

const isDuplicateMessage = (prev: Message[], newMsg: Message): boolean => {
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
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EmployeeMessages() {
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const isInitialLoad = useRef(true);
  const isSendingMessage = useRef(false);
  const prevMessagesLength = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversation) {
      isInitialLoad.current = true;
    }
  }, [selectedConversation]);

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
          className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full shadow-md animate-pulse" 
          style={{ backgroundColor: "#F59E0B", animationDuration: "1s" }}
        />
      );
    }
    if (empStatus === "BREAK") {
      return (
        <div 
          className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full shadow-md animate-pulse" 
          style={{ backgroundColor: "#8B5CF6", animationDuration: "1s" }}
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
  
  const { socket } = useSocket();

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const profileRes = await getEmployeeProfile();
        const name = profileRes.item.name;
        setEmployeeName(name);

        const convRes = await getEmployeeConversations(name);
        setConversations(convRes.items || []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  // Real-time new message via socket
  useEffect(() => {
    if (!socket || !employeeName) return;

    const handleNewMessage = (data: any) => {
      console.log("📩 Incoming:", data);

      if (
        data.sender === employeeName ||
        data.recipient === employeeName
      ) {
        const normalized = normalizeMessage(data);

        if (!normalized.id) return;

        // Only add to current message view if it belongs to the selected conversation
        const partnerName = selectedConversation?.employee?.name;
        if (partnerName && (normalized.sender === partnerName || normalized.recipient === partnerName)) {
          setMessages((prev) => {
            if (isDuplicateMessage(prev, normalized)) return prev;
            return [...prev, normalized].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
          });
        }

        // Always refresh conversations list so unread counts and lastMessage stay current
        getEmployeeConversations(employeeName)
          .then((res) => setConversations(res.items || []))
          .catch(() => {});
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => { socket.off("new-message", handleNewMessage); };
  }, [socket, employeeName, selectedConversation?.employee?.name]);

  // Real-time employee status update via socket
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
      console.log("⚡ Status update received in Messages:", payload);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.employee.id === payload.userId || c.employee.name === payload.name) {
            return {
              ...c,
              employee: {
                ...c.employee,
                current_status: payload.current_status,
                lunch_start_time: payload.lunch_start_time,
                lunch_expected_end: payload.lunch_expected_end,
                break_start_time: payload.break_start_time,
              },
            };
          }
          return c;
        })
      );

      setSelectedConversation((prev) => {
        if (prev && (prev.employee.id === payload.userId || prev.employee.name === payload.name)) {
          return {
            ...prev,
            employee: {
              ...prev.employee,
              current_status: payload.current_status,
              lunch_start_time: payload.lunch_start_time,
              lunch_expected_end: payload.lunch_expected_end,
              break_start_time: payload.break_start_time,
            },
          };
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
    if (!selectedConversation || !employeeName) return;
    const interval = setInterval(async () => {
      try {
        const res = await getConversation(employeeName, selectedConversation.employee.name);
        setMessages(res.items || []);
      } catch { /* ignore polling errors */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation?.employee?.name, employeeName]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !employeeName) return;

    const loadMessages = async () => {
      try {
        const res = await getConversation(employeeName, selectedConversation.employee.name);
        setMessages(res.items || []);

        // Mark messages as read
        if (selectedConversation.unreadCount > 0) {
          await markMessagesAsRead(selectedConversation.employee.name, employeeName);
          // Invalidate employee conversations preview query to update header badge
          queryClient.invalidateQueries({ queryKey: ["employee-conversations-preview", employeeName] });
          // Update unread count in conversations list
          setConversations((prev) =>
            prev.map((c) =>
              c.employee.id === selectedConversation.employee.id ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        toast.error("Failed to load messages");
      }
    };

    loadMessages();
  }, [selectedConversation, employeeName]);

  // Smart Scroll to bottom when messages change
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isInitialLoad.current) {
      container.scrollTop = container.scrollHeight;
      isInitialLoad.current = false;
      prevMessagesLength.current = messages.length;
    } else if (isSendingMessage.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      isSendingMessage.current = false;
      prevMessagesLength.current = messages.length;
    } else if (messages.length > prevMessagesLength.current) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
      prevMessagesLength.current = messages.length;
    } else {
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !employeeName) return;

    isSendingMessage.current = true;
    setSending(true);
    try {
      const newMessage = {
        sender: employeeName,
        recipient: selectedConversation.employee.name,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
        type: "direct" as const,
        status: "sent",
      };

      const res = await sendMessage(newMessage);
      setMessages((prev) => {
        const normalized = normalizeMessage(res.item);
        if (!normalized.id) return prev;
        if (isDuplicateMessage(prev, normalized)) return prev;
        return [...prev, normalized].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
      });
      setMessageInput("");

      // Update last message in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.employee.id === selectedConversation.employee.id
            ? { ...c, lastMessage: res.item }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
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
    if (!file || !selectedConversation || !employeeName) return;

    isSendingMessage.current = true;
    setUploading(true);
    try {
      const up = await uploadMessageAttachment(file);
      const attachment = up.attachment;

      const payload = {
        sender: employeeName,
        recipient: selectedConversation.employee.name,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
        type: "direct" as const,
        status: "sent",
        attachment,
      };

      const res = await sendMessage(payload);
      setMessages((prev) => {
        const normalized = normalizeMessage(res.item);
        if (!normalized.id) return prev;
        if (isDuplicateMessage(prev, normalized)) return prev;
        return [...prev, normalized].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
      });
      setMessageInput("");

      setConversations((prev) =>
        prev.map((c) =>
          c.employee.id === selectedConversation.employee.id
            ? { ...c, lastMessage: res.item }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send attachment:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
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

  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(next, 40)}px`;
  }, [messageInput]);

  const filteredConversations = conversations.filter((c) =>
    c.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile view: Show either conversation list or chat
  if (selectedConversation) {
    return (
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

        <div className="h-[calc(100vh-11rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
        {/* Chat Header */}
        <Card className="mb-4 border-b-2 border-[#133767]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="relative">
                <Avatar className="h-11 w-11" style={getAvatarRingStyles(selectedConversation.employee.current_status)}>
                  {selectedConversation.employee.avatarUrl ? (
                    <AvatarImage src={toProxiedUrl(selectedConversation.employee.avatarUrl) || selectedConversation.employee.avatarUrl} alt={selectedConversation.employee.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-[#133767] text-white font-semibold text-sm">
                    {selectedConversation.employee.initials}
                  </AvatarFallback>
                </Avatar>
                {getAvatarDotClassAndStyle(selectedConversation.employee.current_status, selectedConversation.employee.status === "active")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate text-gray-900">{selectedConversation.employee.name}</p>
                  {selectedConversation.employee.current_status && selectedConversation.employee.current_status !== "AVAILABLE" && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] py-0 px-1.5 animate-pulse shrink-0 font-medium",
                        selectedConversation.employee.current_status === "LUNCH"
                          ? "border-amber-500 text-amber-700 bg-amber-50"
                          : "border-purple-500 text-purple-700 bg-purple-50"
                      )}
                    >
                      {selectedConversation.employee.current_status === "LUNCH" ? "On Lunch" : "On Break"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {getSubtitle(selectedConversation.employee)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  selectedConversation.employee.status === "active"
                    ? "border-green-500 text-green-700 bg-green-50"
                    : "border-gray-300 text-gray-600 bg-gray-50"
                }
              >
                {selectedConversation.employee.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSentByMe = msg.sender === employeeName;
                  const showAvatar = !isSentByMe && (index === 0 || messages[index - 1].sender === employeeName);
                  const attachmentUrl = msg.attachment?.url || "";
                  const attachmentName = msg.attachment?.fileName || "attachment";
                  const attachmentMime = msg.attachment?.mimeType || "";
                  const isImage = attachmentMime.startsWith("image/");
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2",
                        isSentByMe ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isSentByMe && (
                        showAvatar ? (
                          <Avatar className="h-7 w-7 flex-shrink-0 mb-1">
                            {selectedConversation.employee.avatarUrl ? (
                              <AvatarImage src={toProxiedUrl(selectedConversation.employee.avatarUrl) || selectedConversation.employee.avatarUrl} alt={selectedConversation.employee.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-[#133767] text-white text-[10px] font-semibold">
                              {selectedConversation.employee.initials}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7 flex-shrink-0" />
                        )
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[65%] min-w-0 rounded-2xl p-2 sm:p-3 shadow-sm",
                          isSentByMe
                            ? "bg-[#133767] text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
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
                                className="max-w-[160px] max-h-[160px] rounded-md object-cover"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={cn(
                                "text-sm underline break-all",
                                isSentByMe ? "text-white" : "text-gray-900",
                              )}
                              onClick={() => downloadAttachment(attachmentUrl, attachmentName)}
                            >
                              {attachmentName}
                            </button>
                          )
                        ) : null}

                        {msg.content?.trim() ? (
                          <p className="text-sm whitespace-pre-wrap break-all">{renderMessageContent(msg.content, isSentByMe)}</p>
                        ) : null}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isSentByMe ? "text-white/70" : "text-gray-500"
                          )}
                        >
                          {formatTime(msg.timestamp)}
                          {isSentByMe && (
                            <>
                              {msg.status === "read" ? (
                                <CheckCheck className="h-3 w-3 ml-1" />
                              ) : (
                                <Check className="h-3 w-3 ml-1" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <Separator />

          {/* Input */}
          <div className="p-4 relative">
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={380} />
              </div>
            )}
            <div className="flex items-center gap-2">
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
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <textarea
                ref={messageInputRef}
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className={cn(
                  "flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "resize-none overflow-y-auto leading-5"
                )}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending || uploading}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
        </div>
      </>
    );
  }

  return (
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

      {/* Conversation List View */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No conversations found" : "No conversations yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.employee.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12" style={getAvatarRingStyles(conversation.employee.current_status)}>
                          {conversation.employee.avatarUrl ? (
                            <AvatarImage src={toProxiedUrl(conversation.employee.avatarUrl) || conversation.employee.avatarUrl} alt={conversation.employee.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-[#133767] text-white font-semibold">
                            {conversation.employee.initials}
                          </AvatarFallback>
                        </Avatar>
                        {getAvatarDotClassAndStyle(conversation.employee.current_status, conversation.employee.status === "active")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-semibold truncate text-gray-900">
                              {conversation.employee.name}
                            </p>
                            {conversation.employee.current_status && conversation.employee.current_status !== "AVAILABLE" && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] py-0 px-1 animate-pulse shrink-0 font-medium",
                                  conversation.employee.current_status === "LUNCH"
                                    ? "border-amber-500 text-amber-700 bg-amber-50"
                                    : "border-purple-500 text-purple-700 bg-purple-50"
                                )}
                              >
                                {conversation.employee.current_status === "LUNCH" ? "Lunch" : "Break"}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 font-medium">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage
                            ? conversation.lastMessage.content
                            : "No messages yet"}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-[#133767] text-white shrink-0">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
