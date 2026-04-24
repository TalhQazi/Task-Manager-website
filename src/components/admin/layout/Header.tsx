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
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

  // Query for header background/picture settings
  const headerSettingsQuery = useQuery({
    queryKey: ["header-settings"],
    queryFn: async () => {
      try {
        return await apiFetch<any>("/api/admin/header-settings");
      } catch (e) {
        console.warn("Failed to fetch header settings:", e);
        return null;
      }
    },
    staleTime: 60000,
  });

  const headerSettings = headerSettingsQuery.data?.item;
  const headerImageUrl = headerSettings?.imageConfig?.url || headerSettings?.imageConfig?.dataUrl;

  // Banner header height
  const headerHeight = 300;
  
  // Dynamic background style based on settings
  const bgStyle = useMemo(() => {
    const baseStyle: any = {
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#133767'
    };

    if (headerImageUrl) {
      baseStyle.backgroundImage = `url("${headerImageUrl}")`;
      baseStyle.backgroundSize = headerSettings?.imageConfig?.size || 'cover';
      baseStyle.backgroundPosition = headerSettings?.imageConfig?.position || 'center';
      baseStyle.backgroundRepeat = headerSettings?.imageConfig?.repeat || 'no-repeat';
    } else {
      baseStyle.background = 'linear-gradient(to right, #133767, #133767, #133767)';
    }

    return baseStyle;
  }, [headerImageUrl, headerSettings]);

  // Handle Image Upload for Header
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await apiFetch("/api/admin/header-settings", {
          method: "PUT",
          body: {
            backgroundType: "image",
            imageConfig: {
              dataUrl: base64String,
              url: base64String
            }
          }
        });
        queryClient.invalidateQueries({ queryKey: ["header-settings"] });
        setHeaderModalOpen(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload header image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleResetHeader = async () => {
    try {
      await apiFetch("/api/admin/header-settings/reset", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
      setHeaderModalOpen(false);
    } catch (error) {
      console.error("Failed to reset header:", error);
    }
  };



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
      className="fixed top-0 left-0 right-0 z-50 shadow-floating"
      style={{ 
        height: `${headerHeight}px`,
        left: '0',
      }}
    >
      <div 
        className="w-full h-full relative overflow-hidden group"
        style={bgStyle}
      >
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Header Content Area */}
          <div 
            className="flex-1 relative flex flex-col justify-end px-3 sm:px-6 lg:px-8 md:pl-64 pb-8 sm:pb-12 md:pb-16 animate-fade-in pointer-events-auto"
          >
            {/* Branding and Profile */}
            {/* Header Picture Edit Button (Camera Icon) */}
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setHeaderModalOpen(true)}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm border border-white/20"
                title="Change Header Picture"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all cursor-pointer group w-fit">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-white/20 shadow-lg group-hover:ring-2 group-hover:ring-[#00C6FF]/20 transition-all">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white text-xs font-bold">{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-black rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-base font-bold text-white truncate leading-tight drop-shadow-md">{fullName}</span>
                      <span className="text-[11px] text-white/60 truncate tracking-wide uppercase font-semibold">{auth.role || "Admin"}</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" className="w-56 mt-2">
                  <DropdownMenuLabel className="text-xs text-foreground">Account Settings</DropdownMenuLabel>
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

              <div className="flex items-center justify-start gap-4">
                <div className="md:hidden">
                  <button type="button" className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/[0.14] transition-all" aria-label="Open navigation" onClick={() => onMenuClick?.()}><Menu className="h-5 w-5 text-white" /></button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors text-white/70 hover:text-white">
                      <Mail className="h-5 w-5" />
                      {unreadMessageCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#00C6FF] text-[9px] border-black">
                          {Math.min(unreadMessageCount, 9)}
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="w-64 mt-2">
                    <DropdownMenuLabel className="text-xs text-foreground">Direct Messages</DropdownMenuLabel>
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
                    <button className="relative group p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors text-white/70 hover:text-white">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] border-black">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="w-64 mt-2">
                    <DropdownMenuLabel className="text-xs text-foreground">Notifications</DropdownMenuLabel>
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
                  className="relative group p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                  title="Submit Bug Report"
                >
                  <Bug className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header Settings Modal (Simplified for Image Only) */}
        <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Header Picture</DialogTitle>
              <DialogDescription>Choose a high-quality image for your admin dashboard banner.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/5 overflow-hidden relative group">
                  {headerImageUrl ? (
                    <img src={headerImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground mt-2">No background image set</p>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Click to Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleHeaderImageUpload} disabled={uploading} />
                  </label>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading image...</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between w-full">
              <Button variant="outline" size="sm" onClick={handleResetHeader} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Reset to Default
              </Button>
              <Button size="sm" onClick={() => setHeaderModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="Issue Title" className="text-foreground" />
                  <textarea 
                    value={reportDescription} 
                    onChange={e => setReportDescription(e.target.value)} 
                    className="w-full min-h-[100px] p-3 rounded-md border bg-background text-foreground"
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
      </div>

      {/* Founder Message Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[60] bg-metallic-gold/90 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pointer-events-auto">
        <FounderMessageBar />
      </div>
    </header>
  );
}
