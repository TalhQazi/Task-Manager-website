import { Sidebar } from "./Sidebar";
import { ReactNode, useState, useEffect } from "react";
import { Bell, Bug, LogOut, Mail, Menu, Search, Settings, User } from "lucide-react";
import { TaskBlaster } from "@/components/shared/TaskBlaster";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/manger/ui/sheet";
import { Button } from "@/components/manger/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/manger/ui/dropdown-menu";
import { Badge } from "@/components/manger/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manger/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import { Input } from "@/components/manger/ui/input";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, toProxiedUrl } from "@/lib/manger/api";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { FounderMessageBar } from "@/components/FounderMessageBar";
import { applyFullTheme, themeDefaults } from "@/lib/manger/theme";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      if (resourceId) return `/manager/vehicles?view=${encodeURIComponent(resourceId)}`;
      return "/manager/vehicles";
    }
    if (resourceType === "employee") {
      if (resourceId) return `/manager/employees?view=${encodeURIComponent(resourceId)}`;
      return "/manager/employees";
    }
    if (resourceType === "location") {
      if (resourceId) return `/manager/locations?view=${encodeURIComponent(resourceId)}`;
      return "/manager/locations";
    }
    if (resourceType === "vendor") {
      if (resourceId) return `/manager/vendors?view=${encodeURIComponent(resourceId)}`;
      return "/manager/vendors";
    }
    if (resourceType === "onboarding") {
      if (resourceId) return `/manager/onboarding?view=${encodeURIComponent(resourceId)}`;
      return "/manager/onboarding";
    }
    if (resourceType === "do not hire entry" || resourceType === "donothire" || resourceType === "do_not_hire") {
      if (resourceId) return `/manager/do-not-hire?view=${encodeURIComponent(resourceId)}`;
      return "/manager/do-not-hire";
    }
    if (resourceType === "appliance") {
      if (resourceId) return `/manager/appliances?view=${encodeURIComponent(resourceId)}`;
      return "/manager/appliances";
    }
    if (resourceType === "task") {
      if (resourceId) return `/manager/tasks?view=${encodeURIComponent(resourceId)}`;
      return "/manager/tasks";
    }
    if (resourceType === "bug") {
      if (resourceId) return `/developer/bugs?view=${encodeURIComponent(resourceId)}`;
      return "/developer/bugs";
    }

    const content = String(n.content || "").toLowerCase();
    if (content.includes(" employee")) return "/manager/employees";
    if (content.includes(" vehicle")) return "/manager/vehicles";
    if (content.includes(" location")) return "/manager/locations";
    if (content.includes(" vendor")) return "/manager/vendors";
    if (content.includes(" onboarding")) return "/manager/onboarding";
    if (content.includes(" do not hire")) return "/manager/do-not-hire";
    if (content.includes(" appliance")) return "/manager/appliances";
    if (content.includes(" task")) return "/manager/tasks";

    return "/manager/notifications";
  };

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: { fullName?: string; email?: string; avatarUrl?: string } }>("/api/settings");
    },
  });

  // Header settings from admin panel
  const headerSettingsQuery = useQuery({
    queryKey: ["header-settings"],
    queryFn: async () => {
      return apiFetch<{ item: {
        backgroundType: 'color' | 'image';
        colorConfig?: { from: string; via: string; to: string };
        imageConfig?: { dataUrl: string; size: string; position: string };
        overlay?: { enabled: boolean; color: string };
        height: number;
      } }>("/api/header-settings");
    },
  });

  const headerSettings = headerSettingsQuery.data?.item;

  const hasImageBackground = headerSettings?.backgroundType === 'image' && headerSettings.imageConfig?.dataUrl;

  // Apply user UI preferences on load - same as EmployeeLayout (full applyThemeToDOM)
  useEffect(() => {
    apiFetch<{item: { theme?: string; cardStyle?: string; customColors?: { textColor?: string } }}>("/api/ui-preferences").then(res => {
      const theme = res?.item?.theme || "dark-minimal";
      const cardStyle = res?.item?.cardStyle || "glass";
      const textColor = res?.item?.customColors?.textColor;
      applyFullTheme(theme, textColor || themeDefaults[theme], cardStyle);
    }).catch(() => {
      // Fallback to dark-minimal
      applyFullTheme("dark-minimal");
    });
  }, []);

  // System notifications (broadcasts only)
  const notificationsQuery = useQuery({
    queryKey: ["manager-notifications"],
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
    queryKey: ["manager-messages-preview"],
    queryFn: async () => {
      const user = getAuthState().username || "manager";
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

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportImageFile, setReportImageFile] = useState<File | null>(null);
  const [reportImagePreviewUrl, setReportImagePreviewUrl] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const resetReport = () => {
    setReportTitle("");
    setReportDescription("");
    setReportImageFile(null);
    if (reportImagePreviewUrl) URL.revokeObjectURL(reportImagePreviewUrl);
    setReportImagePreviewUrl("");
    setReportError(null);
  };

  const submitReport = async () => {
    const title = reportTitle.trim();
    const description = reportDescription.trim();
    if (!title || !description) {
      setReportError("Title and description are required");
      return;
    }

    try {
      setReportSubmitting(true);
      setReportError(null);

      const toDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(file);
        });

      const attachment = reportImageFile
        ? {
            fileName: reportImageFile.name,
            url: await toDataUrl(reportImageFile),
            mimeType: reportImageFile.type,
            size: reportImageFile.size,
          }
        : undefined;

      await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          attachment,
          source: {
            panel: "manager",
            path: typeof window !== "undefined" ? window.location.pathname : "/manager",
          },
        }),
      });

      setReportOpen(false);
      resetReport();
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Failed to submit report");
    } finally {
      setReportSubmitting(false);
    }
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
  const fullName = (settings?.fullName || auth.username || "Manager").trim();
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

  return (
    <div className="min-h-screen tb-manager-panel" style={{ background: "var(--tb-dashboard-bg)" }}>
      {/* Top header with dynamic background from admin settings - FULL WIDTH */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 shadow-floating"
        style={{ 
          height: '300px',
          left: '0',
        }}
      >
        <div 
          className="w-full h-full relative overflow-hidden group"
          style={{
            background: hasImageBackground 
              ? 'transparent'
              : `linear-gradient(to right, ${headerSettings?.colorConfig?.from || '#133767'}, ${headerSettings?.colorConfig?.via || '#133767'}, ${headerSettings?.colorConfig?.to || '#133767'})`
          }}
        >
          {/* Background Image */}
          {hasImageBackground && (
            <>
              <img
                src={headerSettings?.imageConfig?.dataUrl}
                alt="header background"
                className="absolute inset-0 w-full h-full"
                style={{
                  objectFit: 'cover',
                  objectPosition: headerSettings?.imageConfig?.position || 'center',
                }}
                draggable={false}
              />
              {headerSettings?.overlay?.enabled && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: headerSettings.overlay.color || 'var(--tb-header-overlay-color)', opacity: headerSettings.overlay.color ? 1 : 'var(--tb-header-overlay-opacity)' }}
                />
              )}
            </>
          )}

          <div className="absolute inset-0 flex flex-col pointer-events-none">
            {/* Header Content Area */}
            <div 
              className="flex-1 relative flex flex-col justify-end px-3 sm:px-6 lg:px-8 md:pl-64 pb-8 sm:pb-12 md:pb-16 animate-fade-in pointer-events-auto"
            >
              {/* LEFT SIDE: Branding and Profile Stacking */}
              <div className="flex flex-col gap-4">
                {/* Profile Card (Top) */}
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
                        <span className="text-[11px] text-white/60 truncate tracking-wide uppercase font-semibold">{auth.role || "Manager"}</span>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="w-56 mt-2">
                    <DropdownMenuLabel className="text-xs">Account Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/manager/settings")}>
                      <User className="mr-2 h-4 w-4" /> Profile Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/manager/settings")}>
                      <Settings className="mr-2 h-4 w-4" /> System Preferences
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Quick Actions Bar (Bottom) */}
                <div className="flex items-center justify-start gap-4">
                  <div className="md:hidden">
                    <button type="button" className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/[0.14] transition-all" aria-label="Open navigation" onClick={() => setMobileSidebarOpen(true)}><Menu className="h-5 w-5 text-white" /></button>
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
                      <DropdownMenuLabel className="text-xs">Direct Messages</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {messagesQuery.data?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No messages</div>
                      ) : (
                        messagesQuery.data?.map(c => (
                          <DropdownMenuItem key={c.employee?.id} onClick={() => navigate("/manager/messages")}>
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
                        <Bell className="h-4.5 w-4.5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] border-black">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="bottom" className="w-64 mt-2">
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

                  <button 
                    onClick={() => { resetReport(); setReportOpen(true); }}
                    className="relative group p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors text-white/70 hover:text-white"
                    title="Submit Bug Report"
                  >
                    <Bug className="h-4.5 w-4.5" />
                  </button>

                  <button 
                    onClick={() => { clearAuthState(); navigate("/login"); }}
                    className="p-2 rounded-lg bg-black/20 hover:bg-red-500/20 backdrop-blur-sm transition-colors text-red-400/70 hover:text-red-400"
                    title="Logout"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-[#0B1323] via-[#0B1323] to-[#0F172A]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for managers</SheetDescription>
          </SheetHeader>
          <Sidebar mode="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) resetReport();
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Report an Issue</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Add screenshot and describe the issue. Current page will be attached automatically.
            </DialogDescription>
          </DialogHeader>

          {reportError && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-xs sm:text-sm text-destructive break-words">{reportError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium">Title *</label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Button not working"
                className="text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium">Description *</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm sm:text-base min-h-24 resize-none bg-background text-foreground placeholder:text-muted-foreground/60"
                placeholder="Explain what happened, expected vs actual..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium">Screenshot (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReportImageFile(file);
                  if (reportImagePreviewUrl) URL.revokeObjectURL(reportImagePreviewUrl);
                  setReportImagePreviewUrl(file ? URL.createObjectURL(file) : "");
                }}
              />
              {reportImagePreviewUrl ? (
                <div className="w-full overflow-hidden rounded-lg border bg-white">
                  <img src={reportImagePreviewUrl} alt="preview" className="w-full h-auto max-h-64 object-contain" />
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => setReportOpen(false)}
              className="w-full sm:w-auto"
              disabled={reportSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={() => void submitReport()} className="w-full sm:w-auto" disabled={reportSubmitting}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Body: left icon rail + content */}
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main
          className="flex-1 min-h-screen md:ml-56 lg:ml-64"
          style={{ paddingTop: '300px', background: 'var(--tb-dashboard-bg)' }}
        >
          <div className="w-full px-4 py-4 sm:py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* TaskBlaster overlay for celebrations */}
      <TaskBlaster />
    </div>
  );
}
