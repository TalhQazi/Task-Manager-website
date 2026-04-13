import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { io } from "socket.io-client";

import {
  MessageCircle,
  Send,
  Search,
  ChevronLeft,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  getEmployeeConversations,
  getConversation,
  sendMessage,
  markMessagesAsRead,
  getEmployeeProfile,
} from "../lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    initials: string;
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
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EmployeeMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const socketRef = useRef<any>(null);

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


  useEffect(() => {

  socketRef.current = io("https://task.se7eninc.com", {
 //socketRef.current = io("http://192.168.31.13:5000", {
    path: "/api/socket.io",
    transports: ["websocket"],
  });

  socketRef.current.on("connect", () => {
    console.log("✅ Employee connected",employeeName);
  });

  socketRef.current.on("new-message", (data: any) => {
    console.log("📩 Incoming:", data);

    if (
      data.sender === employeeName ||
      data.recipient === employeeName
    ) {
       setMessages((prev) => {
    const alreadyExists = prev.find((m) => m.id === data.id);

    if (alreadyExists) {
      return prev; 
    }

    return [...prev, data]; 
  });
    }
  });

  return () => socketRef.current.disconnect();
}, [employeeName]);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !employeeName) return;

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
      //setMessages((prev) => [...prev, res.item]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Chat Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#133767] text-white">
                  {selectedConversation.employee.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedConversation.employee.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.employee.department || "No department"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  selectedConversation.employee.status === "active"
                    ? "border-green-500 text-green-700"
                    : "border-gray-500 text-gray-700"
                }
              >
                {selectedConversation.employee.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.sender === employeeName;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isSentByMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          isSentByMe
                            ? "bg-[#133767] text-white"
                            : "bg-gray-100 text-gray-900"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isSentByMe ? "text-white/70" : "text-gray-500"
                          )}
                        >
                          <Clock className="h-3 w-3" />
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
          </ScrollArea>

          <Separator />

          {/* Input */}
          <div className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Conversation List View
  return (
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
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[#133767] text-white">
                        {conversation.employee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {conversation.employee.name}
                        </p>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage
                          ? conversation.lastMessage.content
                          : "No messages yet"}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-[#133767] text-white">
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
  );
}
