import { Bell, Bug, Camera, CheckCircle2, ChevronDown, ChevronUp, Loader2, LogOut, Mail, Menu, Move, Save, Search, User, Settings, X as XIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { AdminInfoManager } from "@/components/admin/AdminInfoManager";
import { FounderMessageBar } from "@/components/FounderMessageBar";
import { useQueryClient } from "@tanstack/react-query";



interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();

  const auth = getAuthState();

  type MessageApi = {
    id: string;
    _id?: string;
    title?: string;
    content?: string;
    timestamp?: string;
    createdAt?: string;
    status?: "sent" | "delivered" | "read";
    meta?: {
      resourceType?: string;
      resourceId?: string;
      link?: string;
    };
  };

  const resolveNotificationLink = (n: MessageApi) => {
    const direct = String(n.meta?.link || "").trim();
    if (direct) return direct;

    const resourceTypeRaw = String(n.meta?.resourceType || "").trim();
    const resourceType = resourceTypeRaw.toLowerCase();
    const resourceId = String(n.meta?.resourceId || "").trim();

    if (resourceType === "vehicle") {
      if (resourceId) return `/admin/vehicles?view=${encodeURIComponent(resourceId)}`;
      return "/admin/vehicles";
    }
    if (resourceType === "employee") {
      if (resourceId) return `/admin/employees?view=${encodeURIComponent(resourceId)}`;
      return "/admin/employees";
    }
    if (resourceType === "location") {
      if (resourceId) return `/admin/locations?view=${encodeURIComponent(resourceId)}`;
      return "/admin/locations";
    }
    if (resourceType === "vendor") {
      if (resourceId) return `/admin/vendors?view=${encodeURIComponent(resourceId)}`;
      return "/admin/vendors";
    }
    if (resourceType === "company") {
      if (resourceId) return `/admin/companies?view=${encodeURIComponent(resourceId)}`;
      return "/admin/companies";
    }
    if (resourceType === "onboarding") {
      if (resourceId) return `/admin/onboarding?view=${encodeURIComponent(resourceId)}`;
      return "/admin/onboarding";
    }
    if (resourceType === "time entry" || resourceType === "timeentry" || resourceType === "time_entry") {
      if (resourceId) return `/admin/time-tracking?view=${encodeURIComponent(resourceId)}`;
      return "/admin/time-tracking";
    }
    if (resourceType === "do not hire entry" || resourceType === "donothire" || resourceType === "do_not_hire") {
      if (resourceId) return `/admin/do-not-hire?view=${encodeURIComponent(resourceId)}`;
      return "/admin/do-not-hire";
    }
    if (resourceType === "user") {
      if (resourceId) return `/admin/users?view=${encodeURIComponent(resourceId)}`;
      return "/admin/users";
    }
    if (resourceType === "appliance") {
      if (resourceId) return `/admin/appliances?view=${encodeURIComponent(resourceId)}`;
      return "/admin/appliances";
    }
    if (resourceType === "task") {
      if (resourceId) return `/admin/tasks?view=${encodeURIComponent(resourceId)}`;
      return "/admin/tasks";
    }
    if (resourceType === "bug") {
      if (resourceId) return `/developer/bugs?view=${encodeURIComponent(resourceId)}`;
      return "/developer/bugs";
    }

    const content = String(n.content || "").toLowerCase();
    if (content.includes(" employee")) return "/admin/employees";
    if (content.includes(" vehicle")) return "/admin/vehicles";
    if (content.includes(" location")) return "/admin/locations";
    if (content.includes(" vendor")) return "/admin/vendors";
    if (content.includes(" company")) return "/admin/companies";
    if (content.includes(" onboarding")) return "/admin/onboarding";
    if (content.includes(" do not hire")) return "/admin/do-not-hire";
    if (content.includes(" appliance")) return "/admin/appliances";
    if (content.includes(" task")) return "/admin/tasks";

    return "/admin/notifications";
  };

  // Standard header height
  const headerHeight = 64;
  const bgStyle = { background: '#133767' };



  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: { fullName?: string; email?: string; avatarUrl?: string } }>("/api/settings");
    },
  });

  // System notifications (broadcasts only)
  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: MessageApi[] } | MessageApi[]>("/api/messages?type=broadcast");
      const items = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
      return items
        .map((m: any) => ({
          ...m,
          id: String(m.id || m._id || ""),
        }))
        .filter((m: any) => Boolean(m.id));
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time notifications
  });

  // Direct messages for message dropdown
  const messagesQuery = useQuery({
    queryKey: ["admin-messages-preview"],
    queryFn: async () => {
      const user = getAuthState().username || "admin";
      const res = await apiFetch<{ items: any[] }>(`/api/messages/conversations/${user}`);
      const items = res?.items || [];
      return items.slice(0, 4); // Last 4 conversations
    },
  });

  const notifications = (notificationsQuery.data || [])
    .slice()
    .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
    .slice(0, 4);

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
      setReportSuccess("Your bug report has been sent successfully!");
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

  
  
  
  
  
  
  
  

  

  

  

  const markAllRead = async () => {
    try {
      await apiFetch("/api/messages/mark-all-read", { method: "POST" });
      await notificationsQuery.refetch();
    } catch {
      // ignore errors
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/messages/${id}/mark-read`, { method: "POST" });
      await notificationsQuery.refetch();
    } catch {
      // ignore errors
    }
  };

  const settings = settingsQuery.data?.item;
  const fullName = (settings?.fullName || auth.username || "Admin").trim();
  const email = (settings?.email || "").trim();
  const avatarUrl = toProxiedUrl((settings as any)?.avatarDataUrl || (settings as any)?.avatarUrl as string | undefined);
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "M";



  const auth_role = auth.role;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 shadow-md flex items-center px-4 sm:px-6 lg:px-8 bg-[#133767] text-white"
      style={{ height: `${headerHeight}px` }}
    >
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-white leading-tight">{fullName}</span>
                <span className="text-[10px] text-white/70 uppercase font-semibold">{auth.role || "Admin"}</span>
              </div>
              <Avatar className="h-9 w-9 border border-white/20 shadow-sm">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-white/10 text-white text-xs font-bold">{initials}</AvatarFallback>
                )}
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
              <User className="mr-2 h-4 w-4" /> Profile Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" /> System Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { clearAuthState(); navigate("/login"); }} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <button className="relative p-2 text-white/70 hover:text-white transition-colors" onClick={() => navigate("/admin/messaging")}>
            <Mail className="h-5 w-5" />
            {unreadMessageCount > 0 && (
              <Badge className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#00C6FF] text-[9px] border-none">{unreadMessageCount}</Badge>
            )}
          </button>
          
          <button className="relative p-2 text-white/70 hover:text-white transition-colors" onClick={() => navigate("/admin/notifications")}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] border-none">{unreadCount}</Badge>
            )}
          </button>

          <button 
            onClick={() => { resetReport(); setReportOpen(true); }}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Submit Bug Report"
          >
            <Bug className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bug Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-lg">
          {reportSuccess ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Report Sent!</h2>
              <p className="text-muted-foreground mb-6">{reportSuccess}</p>
              <Button onClick={() => { setReportOpen(false); setReportSuccess(null); }}>Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>Help us improve by describing the issue.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="Issue Title" />
                <textarea 
                  value={reportDescription} 
                  onChange={e => setReportDescription(e.target.value)} 
                  className="w-full min-h-[100px] p-3 rounded-md border"
                  placeholder="Describe the issue..."
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
                <Button onClick={submitReport} disabled={reportSubmitting}>
                  {reportSubmitting ? "Sending..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
