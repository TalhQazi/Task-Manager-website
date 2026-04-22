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

interface HeaderSettings {
  backgroundType: "color" | "image";
  colorConfig: {
    from: string;
    via: string;
    to: string;
  };
  imageConfig: {
    url: string;
    dataUrl: string;
    repeat: string;
    size: string;
    position: string;
  };
  height: number;
  overlay: {
    enabled: boolean;
    color: string;
  };
}

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

  const headerSettingsQuery = useQuery<HeaderSettings>({
    queryKey: ["header-settings"],
    queryFn: async () => {
      const res = await apiFetch<{ item: HeaderSettings }>("/api/header-settings");
      return res.item;
    },
  });

  const headerSettings = headerSettingsQuery.data;
  const isImageBackground = headerSettings?.backgroundType === "image";
  const settingsHeight = headerSettings?.height || 144;

  // Build background style based on settings
  const hasImageBackground = isImageBackground && headerSettings?.imageConfig?.dataUrl;

  // Auto-calculate header height from image aspect ratio
  const [autoImageHeight, setAutoImageHeight] = useState<number | null>(null);
  const imgAspectRef = useRef<number | null>(null);

  const calcHeight = useCallback(() => {
    if (imgAspectRef.current) {
      const screenW = window.innerWidth;
      const calculated = Math.round(screenW / imgAspectRef.current);
      // Clamp between 80px and 400px so it doesn't get too extreme
      setAutoImageHeight(Math.max(80, Math.min(400, calculated)));
    }
  }, []);

  useEffect(() => {
    if (!hasImageBackground || !headerSettings?.imageConfig?.dataUrl) {
      imgAspectRef.current = null;
      setAutoImageHeight(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imgAspectRef.current = img.naturalWidth / img.naturalHeight;
      calcHeight();
    };
    img.src = headerSettings.imageConfig.dataUrl;
  }, [hasImageBackground, headerSettings?.imageConfig?.dataUrl, calcHeight]);

  // Recalculate on window resize
  useEffect(() => {
    if (!hasImageBackground) return;
    window.addEventListener('resize', calcHeight);
    return () => window.removeEventListener('resize', calcHeight);
  }, [hasImageBackground, calcHeight]);

  // Fixed header height of 300px
  const headerHeight = 300;

  const getBackgroundStyle = () => {
    if (hasImageBackground) {
      return { background: 'transparent' };
    }

    if (!headerSettings) {
      return { background: "linear-gradient(to right, #133767, #133767, #133767)" };
    }

    const { from, via, to } = headerSettings.colorConfig || {};
    return {
      background: `linear-gradient(to right, ${from || "#133767"}, ${via || "#133767"}, ${to || "#133767"})`,
    };
  };

  const bgStyle = getBackgroundStyle();

  // Listen for header settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      void headerSettingsQuery.refetch();
    };
    window.addEventListener("header-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("header-settings-updated", handleSettingsUpdate);
  }, [headerSettingsQuery]);

  // Dispatch height change event when header height changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("header-height-changed", { detail: { height: headerHeight } }));
  }, [headerHeight]);

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

  // Cover photo edit state
  const [coverEditMode, setCoverEditMode] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverDragStart, setCoverDragStart] = useState<number | null>(null);
  const [coverPositionY, setCoverPositionY] = useState(50); // percentage 0-100
  const [coverSaving, setCoverSaving] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const compressCoverImage = (dataUrl: string, maxWidth = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;
      const compressed = await compressCoverImage(rawDataUrl);
      setCoverPreviewUrl(compressed);
      setCoverEditMode(true);
      setCoverPositionY(50);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!coverEditMode) return;
    e.preventDefault();
    setCoverDragStart(e.clientY);
  };

  const handleCoverMouseMove = useCallback((e: MouseEvent) => {
    if (coverDragStart === null || !coverContainerRef.current) return;
    const containerHeight = coverContainerRef.current.getBoundingClientRect().height;
    const delta = e.clientY - coverDragStart;
    const percentDelta = (delta / containerHeight) * 100;
    setCoverPositionY(prev => Math.max(0, Math.min(100, prev - percentDelta)));
    setCoverDragStart(e.clientY);
  }, [coverDragStart]);

  const handleCoverMouseUp = useCallback(() => {
    setCoverDragStart(null);
  }, []);

  // Touch support for mobile
  const handleCoverTouchStart = (e: React.TouchEvent) => {
    if (!coverEditMode) return;
    e.preventDefault();
    setCoverDragStart(e.touches[0].clientY);
  };

  const handleCoverTouchMove = useCallback((e: TouchEvent) => {
    if (coverDragStart === null || !coverContainerRef.current) return;
    e.preventDefault();
    const containerHeight = coverContainerRef.current.getBoundingClientRect().height;
    const delta = e.touches[0].clientY - coverDragStart;
    const percentDelta = (delta / containerHeight) * 100;
    setCoverPositionY(prev => Math.max(0, Math.min(100, prev - percentDelta)));
    setCoverDragStart(e.touches[0].clientY);
  }, [coverDragStart]);

  const handleCoverTouchEnd = useCallback(() => {
    setCoverDragStart(null);
  }, []);

  useEffect(() => {
    if (coverDragStart !== null) {
      window.addEventListener('mousemove', handleCoverMouseMove);
      window.addEventListener('mouseup', handleCoverMouseUp);
      window.addEventListener('touchmove', handleCoverTouchMove, { passive: false });
      window.addEventListener('touchend', handleCoverTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleCoverMouseMove);
        window.removeEventListener('mouseup', handleCoverMouseUp);
        window.removeEventListener('touchmove', handleCoverTouchMove);
        window.removeEventListener('touchend', handleCoverTouchEnd);
      };
    }
  }, [coverDragStart, handleCoverMouseMove, handleCoverMouseUp, handleCoverTouchMove, handleCoverTouchEnd]);

  const nudgeCoverUp = () => setCoverPositionY(prev => Math.max(0, prev - 5));
  const nudgeCoverDown = () => setCoverPositionY(prev => Math.min(100, prev + 5));

  const saveCoverPhoto = async () => {
    if (!coverPreviewUrl) return;
    try {
      setCoverSaving(true);
      await apiFetch("/api/header-settings", {
        method: "PUT",
        body: JSON.stringify({
          backgroundType: "image",
          imageConfig: {
            dataUrl: coverPreviewUrl,
            repeat: "no-repeat",
            size: "cover",
            position: `center ${coverPositionY}%`,
          },
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["header-settings"] });
      window.dispatchEvent(new Event("header-settings-updated"));
      setCoverEditMode(false);
      setCoverPreviewUrl(null);
    } catch (e) {
      console.error("Failed to save cover photo:", e);
    } finally {
      setCoverSaving(false);
    }
  };

  const cancelCoverEdit = () => {
    setCoverEditMode(false);
    setCoverPreviewUrl(null);
    setCoverDragStart(null);
  };

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
        ref={coverContainerRef}
      >
        {/* Background Image */}
        {(hasImageBackground || coverEditMode) && (
          <>
            <img
              src={coverEditMode ? (coverPreviewUrl || headerSettings?.imageConfig?.dataUrl) : headerSettings?.imageConfig?.dataUrl}
              alt="header background"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: coverEditMode ? `center ${coverPositionY}%` : (headerSettings?.imageConfig?.position || 'center'),
                cursor: coverEditMode ? (coverDragStart !== null ? 'grabbing' : 'grab') : 'default',
                userSelect: 'none',
              }}
              draggable={false}
              onMouseDown={coverEditMode ? handleCoverMouseDown : undefined}
              onTouchStart={coverEditMode ? handleCoverTouchStart : undefined}
            />
            {headerSettings?.overlay?.enabled && !coverEditMode && (
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: headerSettings.overlay.color || 'rgba(0,0,0,0.3)' }}
              />
            )}
          </>
        )}

        {/* Cover Edit Overlay */}
        {coverEditMode && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 pointer-events-auto">
              <Move className="h-4 w-4 text-white" />
              <span className="text-white text-xs font-medium">Drag up/down to reposition</span>
            </div>
            {/* Up/Down arrow buttons for precise positioning */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-auto">
              <button
                type="button"
                onClick={nudgeCoverUp}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-110"
                title="Move image up"
              >
                <ChevronUp className="h-5 w-5 text-gray-800" />
              </button>
              <span className="text-white text-[10px] font-medium bg-black/50 rounded px-2 py-0.5">
                {Math.round(coverPositionY)}%
              </span>
              <button
                type="button"
                onClick={nudgeCoverDown}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-110"
                title="Move image down"
              >
                <ChevronDown className="h-5 w-5 text-gray-800" />
              </button>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto">
              <Button
                size="sm"
                variant="ghost"
                className="bg-white/90 hover:bg-white text-gray-800 text-xs h-8 rounded-full px-4"
                onClick={cancelCoverEdit}
                disabled={coverSaving}
              >
                <XIcon className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-full px-4"
                onClick={() => void saveCoverPhoto()}
                disabled={coverSaving}
              >
                <Save className="h-3.5 w-3.5 mr-1" /> {coverSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Cover Photo Edit Button (visible on hover, only for admin/super-admin) */}
        {!coverEditMode && (auth_role === "admin" || auth_role === "super-admin") && (
          <>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverFileSelect}
            />
            <button
              type="button"
              className="absolute bottom-20 right-3 z-50 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto shadow-lg"
              onClick={() => coverFileRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Cover Photo</span>
            </button>
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
                      <span className="text-[11px] text-white/60 truncate tracking-wide uppercase font-semibold">{auth.role || "Admin"}</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" className="w-56 mt-2">
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

              {/* Quick Actions Bar (Bottom) */}
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

                <AdminInfoManager />

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

        {/* Bug Report Dialog */}
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="sm:max-w-md">
            {reportSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30">
                    <CheckCircle2 className="h-10 w-10 text-white animate-bounce" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">Report Sent!</DialogTitle>
                  <DialogDescription className="text-sm text-center text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
                    {reportSuccess}
                  </DialogDescription>
                </div>
                <Button 
                  onClick={() => {
                    setReportOpen(false);
                    setReportSuccess(null);
                  }}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-10 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
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
                         <div className="flex gap-2">
                           <button 
                            onClick={handlePasteImage}
                            className="h-16 w-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                            title="Paste image"
                           >
                             <Camera className="h-4 w-4 mb-1" />
                             <span className="text-[8px]">Paste</span>
                           </button>
                           <button 
                            onClick={() => document.getElementById('report-file-input')?.click()}
                            className="h-16 w-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                            title="Select file"
                           >
                             <Paperclip className="h-4 w-4 mb-1" />
                             <span className="text-[8px]">Select</span>
                           </button>
                           <input 
                             id="report-file-input"
                             type="file"
                             accept="image/*"
                             multiple
                             className="hidden"
                             onChange={(e) => {
                               const files = Array.from(e.target.files || []);
                               const remaining = 5 - reportImageFiles.length;
                               const toAdd = files.slice(0, remaining);
                               setReportImageFiles(p => [...p, ...toAdd]);
                               setReportImagePreviewUrls(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))]);
                               e.target.value = "";
                             }}
                           />
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                {reportError && <p className="text-xs text-red-500">{reportError}</p>}
                <DialogFooter>
                  <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={submitReport} disabled={reportSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {reportSubmitting ? "Sending..." : "Submit Report"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
        
        {/* Founder Message Bar - Fixed at the very bottom of the header banner */}
      <div className="absolute bottom-0 left-0 right-0 z-[60] bg-metallic-gold/90 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pointer-events-auto">
        <FounderMessageBar />
      </div>

      
      </header>
  );
}
