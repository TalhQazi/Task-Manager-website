import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageSquare, CornerDownRight, Paperclip } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  replyCount?: number;
  attachments?: { fileName?: string; url?: string }[];
}

interface ThreadDrawerProps {
  open: boolean;
  onClose: () => void;
  parentMessage: Message | null;
  currentUser: string;
}

export default function ThreadDrawer({
  open,
  onClose,
  parentMessage,
  currentUser,
}: ThreadDrawerProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && parentMessage) {
      loadThreadReplies();
    }
  }, [open, parentMessage?.id]);

  const loadThreadReplies = async () => {
    if (!parentMessage) return;
    try {
      setLoading(true);
      const res = await apiFetch<{ items: Message[] }>(`/api/messages/${parentMessage.id}/thread`);
      setReplies(res.items || []);
    } catch (err) {
      console.error("Failed to load thread replies:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !parentMessage) return;
    try {
      setSending(true);
      const res = await apiFetch<{ item: Message }>(`/api/messages/${parentMessage.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          content: replyText.trim(),
          sender: currentUser,
        }),
      });

      setReplies((prev) => [...prev, res.item]);
      setReplyText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (!open || !parentMessage) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h3 className="font-bold text-base">Thread Conversation</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Parent Message Box */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">{parentMessage.sender.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">{parentMessage.sender}</span>
              <span className="text-[10px] text-slate-400">{new Date(parentMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{parentMessage.content}</p>
          </div>
        </div>
      </div>

      {/* Replies Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6">Loading thread replies...</p>
        ) : replies.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No replies yet. Start the thread conversation!</p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3">
              <CornerDownRight className="h-3.5 w-3.5 text-slate-300 mt-1.5 flex-shrink-0" />
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-800">{reply.sender}</span>
                  <span className="text-[10px] text-slate-400">{new Date(reply.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <Input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply in thread..."
          onKeyDown={(e) => e.key === "Enter" && sendReply()}
          className="text-xs border-slate-200"
        />
        <Button size="sm" onClick={sendReply} disabled={sending} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
