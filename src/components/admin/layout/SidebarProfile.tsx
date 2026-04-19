import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Mail, Bell, Bug, User, Settings, Loader2, X as XIcon, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminInfoManager } from "@/components/admin/AdminInfoManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SidebarProfile() {
  const navigate = useNavigate();
  const auth = getAuthState();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: { fullName?: string; email?: string; avatarUrl?: string; avatarDataUrl?: string } }>("/api/settings");
    },
  });

  const settings = settingsQuery.data?.item;
  const fullName = (settings?.fullName || auth.username || "Admin").trim();
  const email = (settings?.email || "").trim();
  const avatarUrl = toProxiedUrl(settings?.avatarDataUrl || settings?.avatarUrl);
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "M";

  // System notifications
  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await apiFetch<any>("/api/messages?type=broadcast");
      const items = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
      return items.map((m: any) => ({ ...m, id: String(m.id || m._id || "") })).filter((m: any) => Boolean(m.id));
    },
    refetchInterval: 5000,
  });

  // Messages
  const messagesQuery = useQuery({
    queryKey: ["admin-messages-preview"],
    queryFn: async () => {
      const user = auth.username || "admin";
      const res = await apiFetch<{ items: any[] }>(`/api/messages/conversations/${user}`);
      return (res?.items || []).slice(0, 4);
    },
  });

  const unreadCount = (notificationsQuery.data || []).filter((n) => n.status !== "read").length;
  const unreadMessageCount = (messagesQuery.data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Bug Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportImageFiles, setReportImageFiles] = useState<File[]>([]);
  const [reportImagePreviewUrls, setReportImagePreviewUrls] = useState<string[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const resetReport = () => {
    setReportTitle("");
    setReportDescription("");
    setReportImageFiles([]);
    reportImagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setReportImagePreviewUrls([]);
    setReportError(null);
    setReportSuccess(null);
  };

  const submitReport = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      setReportError("Title and description are required.");
      return;
    }
    setReportSubmitting(true);
    try {
      const toDataUrl = (file: File) => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(String(reader.result));
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const attachments = await Promise.all(reportImageFiles.map(async (f) => ({ fileName: f.name, url: await toDataUrl(f), mimeType: f.type, size: f.size })));
      await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({ title: reportTitle, description: reportDescription, attachments, source: { panel: "admin", path: window.location.pathname } }),
      });
      setReportSuccess("Submitted!");
      setTimeout(() => setReportOpen(false), 1500);
    } catch (e) {
      setReportError("Failed to submit.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handlePasteImage = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith("image/"));
        if (type && reportImageFiles.length < 5) {
          const blob = await item.getType(type);
          const file = new File([blob], `pasted-${Date.now()}.png`, { type });
          setReportImageFiles(p => [...p, file]);
          setReportImagePreviewUrls(p => [...p, URL.createObjectURL(file)]);
        }
      }
    } catch {}
  };

  return (
    <div className="mt-auto border-t border-white/10 bg-black/20 backdrop-blur-md p-4 space-y-4">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-start gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative group p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <Mail className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#00C6FF] text-[9px] border-black">
                  {Math.min(unreadMessageCount, 9)}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64 mb-2">
            <DropdownMenuLabel className="text-xs">Direct Messages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {messagesQuery.data?.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No messages</div>
            ) : (
              messagesQuery.data?.map(c => (
                <DropdownMenuItem key={c.employee?.id} onClick={() => navigate("/admin/messaging")}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-xs">{c.employee?.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{c.lastMessage?.content}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative group p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] border-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64 mb-2">
            <DropdownMenuLabel className="text-xs">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsQuery.data?.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
            ) : (
              notificationsQuery.data?.slice(0, 5).map(n => (
                <DropdownMenuItem key={n.id} className="text-xs">{n.content}</DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AdminInfoManager />

        <button 
          onClick={() => { resetReport(); setReportOpen(true); }}
          className="relative group p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <Bug className="h-4.5 w-4.5" />
        </button>

        <button 
          onClick={() => { clearAuthState(); navigate("/login"); }}
          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Profile Info */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group">
            <div className="relative">
              <Avatar className="h-9 w-9 border border-white/10 shadow-lg ring-2 ring-transparent group-hover:ring-[#00C6FF]/20 transition-all">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white text-xs font-bold">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 border-2 border-[#0B1323] rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate leading-tight">{fullName}</span>
              <span className="text-[10px] text-white/40 truncate tracking-wide uppercase font-medium">{auth.role || "Admin"}</span>
            </div>
            <Settings className="h-3.5 w-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
          <DropdownMenuLabel className="text-xs">Account Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
            <User className="mr-2 h-4 w-4" /> Profile Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" /> System Preferences
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bug Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>Help us improve Task Manager by reporting bugs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Title</label>
              <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="What's wrong?" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Description</label>
              <textarea 
                value={reportDescription} 
                onChange={e => setReportDescription(e.target.value)} 
                className="w-full rounded-md border p-2 text-sm min-h-24 bg-background"
                placeholder="Give us details..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Attachments (Max 5)</label>
              <div className="flex flex-wrap gap-2">
                 {reportImagePreviewUrls.map((url, i) => (
                   <div key={i} className="relative h-16 w-16 border rounded overflow-hidden group">
                     <img src={url} className="h-full w-full object-cover" />
                     <button onClick={() => {
                        URL.revokeObjectURL(url);
                        setReportImagePreviewUrls(p => p.filter((_, idx) => idx !== i));
                        setReportImageFiles(p => p.filter((_, idx) => idx !== i));
                     }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                       <XIcon className="h-3 w-3" />
                     </button>
                   </div>
                 ))}
                 {reportImageFiles.length < 5 && (
                   <button 
                    onClick={handlePasteImage}
                    className="h-16 w-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    title="Paste image"
                   >
                     <Camera className="h-4 w-4 mb-1" />
                     <span className="text-[8px]">Paste</span>
                   </button>
                 )}
              </div>
            </div>
          </div>
          {reportError && <p className="text-xs text-red-500">{reportError}</p>}
          {reportSuccess && <p className="text-xs text-green-500 font-bold">{reportSuccess}</p>}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submitReport} disabled={reportSubmitting}>{reportSubmitting ? "Sending..." : "Submit Report"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
