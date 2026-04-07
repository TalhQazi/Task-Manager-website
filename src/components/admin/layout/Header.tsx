import { Bell, Bug, Camera, ChevronDown, ChevronUp, Loader2, Mail, Menu, Move, Save, Search, User, X as XIcon } from "lucide-react";
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
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { AdminInfoManager } from "@/components/admin/AdminInfoManager";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

  // Fixed header height of 250px
  const headerHeight = 250;

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
    reportImagePreviewUrls.forEach(url => { if (url) URL.revokeObjectURL(url); });
    setReportImagePreviewUrls([]);
    setReportError(null);
    setReportSuccess(null);
  };

  const submitReport = async () => {
    const title = reportTitle.trim();
    const description = reportDescription.trim();
    if (!title || !description) {
      setReportError("Please enter both a title and description for the bug report.");
      return;
    }

    // Validate file sizes (16MB per file limit)
    const MAX_FILE_SIZE = 16 * 1024 * 1024;
    for (const file of reportImageFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setReportError(`File "${file.name}" is too large. Maximum file size is 16MB.`);
        return;
      }
    }

    try {
      setReportSubmitting(true);
      setReportError(null);
      setReportSuccess(null);

      const toDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsDataURL(file);
        });

      // Convert all files to attachments
      const attachments = await Promise.all(
        reportImageFiles.map(async (file) => ({
          fileName: file.name,
          url: await toDataUrl(file),
          mimeType: file.type,
          size: file.size,
        }))
      );

      await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          attachments,
          source: {
            panel: "admin",
            path: typeof window !== "undefined" ? window.location.pathname : "/admin",
          },
        }),
      });

      setReportSuccess("Bug report submitted successfully! Thank you for your feedback.");
      setTimeout(() => {
        setReportOpen(false);
        resetReport();
      }, 2000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to submit report";
      setReportError(`Failed to submit bug report: ${errorMessage}. Please try again or contact support.`);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handlePasteImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let pastedCount = 0;
      const newFiles: File[] = [];

      for (const item of clipboardItems) {
        // Check for image types
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (imageType && reportImageFiles.length + pastedCount < 5) {
          const blob = await item.getType(imageType);
          const fileName = `pasted-image-${Date.now()}.png`;
          const file = new File([blob], fileName, { type: imageType });
          
          if (file.size > 16 * 1024 * 1024) {
            setReportError(`Pasted image is too large. Maximum file size is 16MB.`);
            return;
          }
          
          newFiles.push(file);
          pastedCount++;
        }
      }

      if (newFiles.length > 0) {
        setReportImageFiles(prev => [...prev, ...newFiles]);
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        setReportImagePreviewUrls(prev => [...prev, ...newUrls]);
        setReportError(null);
      } else {
        setReportError("No image found in clipboard. Please copy an image first.");
      }
    } catch (err) {
      console.error("Paste error:", err);
      setReportError("Unable to paste image. Please make sure you've copied an image to your clipboard.");
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
  const fullName = (settings?.fullName || auth.username || "Admin").trim();
  const email = (settings?.email || "").trim();
  const avatarUrl = (settings as any)?.avatarDataUrl || (settings as any)?.avatarUrl as string | undefined;
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

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverPreviewUrl(dataUrl);
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
            url: coverPreviewUrl,
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
              className="absolute bottom-2 right-3 z-20 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => coverFileRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Cover Photo</span>
            </button>
          </>
        )}
        <div 
          className="relative flex h-full items-start sm:items-center justify-between px-3 sm:px-6 lg:px-10 py-3 md:py-4 animate-fade-in pointer-events-none"
        >
          {/* LEFT SIDE: Profile Menu Swap */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white z-30 relative pointer-events-auto max-w-[50%] sm:max-w-none">
            <button
              type="button"
              className="group inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/[0.14] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear mr-2"
              aria-label="Open navigation"
              onClick={() => onMenuClick?.()}
            >
              <Menu className="h-5 w-5 group-hover:brightness-[108%] transition-all duration-100 linear" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="inline-flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 p-0 rounded-full bg-transparent hover:bg-transparent"
                  aria-label="Account menu"
                >
                  <Avatar className="h-9 w-9 sm:h-12 sm:w-12 border border-white/70">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-white/20 text-sm font-semibold">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 ml-2">
                <DropdownMenuLabel className="text-xs">
                  {fullName}
                  {email && <span className="block text-[11px] text-muted-foreground">{email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs" onClick={() => navigate("/admin/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-destructive"
                  onClick={() => {
                    clearAuthState();
                    navigate("/login", { replace: true });
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="group inline-flex relative h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-white/10 hover:bg-white/[0.14] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear"
                  aria-label="Messages"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:brightness-[108%] transition-all duration-100 linear" />
                  {unreadMessageCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                      {Math.min(unreadMessageCount, 9)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 ml-2">
                <DropdownMenuSeparator />
                {(messagesQuery.data || []).length === 0 ? (
                  <DropdownMenuItem className="text-xs text-muted-foreground">No messages</DropdownMenuItem>
                ) : (
                  (messagesQuery.data || []).slice(0, 4).map((c) => (
                    <DropdownMenuItem
                      key={c.employee?.id || c.employee?.name}
                      className="flex items-start gap-3 py-3 text-xs"
                      onClick={() => navigate("/admin/messaging", { state: { selectedEmployee: c.employee } })}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">{c.employee?.initials || c.employee?.name?.slice(0,2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{c.employee?.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {c.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      {c.unreadCount > 0 && (
                        <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] text-white flex-shrink-0">
                          {c.unreadCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="group inline-flex relative h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-white/10 hover:bg-white/[0.14] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear"
                  aria-label="Notifications"
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:brightness-[108%] transition-all duration-100 linear" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 ml-2">
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-xs text-muted-foreground">No notifications</DropdownMenuItem>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-0.5 text-xs"
                      onClick={() => {
                        void markRead(n.id);
                        navigate(resolveNotificationLink(n));
                      }}
                    >
                      <span className="font-medium line-clamp-2">{String(n.content || "")}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-center justify-center font-medium text-primary cursor-pointer"
                  onClick={async () => {
                    await markAllRead();
                    navigate("/admin/notifications");
                  }}
                >
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Info Manager */}
            <AdminInfoManager />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="group inline-flex relative h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-white/10 hover:bg-white/[0.14] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-100 linear"
              aria-label="Report Issue"
              onClick={() => {
                resetReport();
                setReportOpen(true);
              }}
            >
              <Bug className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:brightness-[108%] transition-all duration-100 linear" />
            </Button>
          </div>

          {/* CENTER LOGO */}
          <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center pointer-events-auto z-10" style={{ height: `${headerHeight * 0.7}px`, minHeight: '48px', maxHeight: '160px' }}>
            <div className="relative h-full flex items-center">
              <img
                src="/logo.jpeg"
                alt="TaskManager by Reardon"
                className="w-auto h-full max-w-[120px] sm:max-w-[190px] md:max-w-[280px] lg:max-w-[380px] object-contain transition-all duration-300 rounded-md shadow-md"
              />
            </div>
          </div>

          {/* RIGHT SIDE: SE7EN Logo Swap */}
          <div className="flex items-center sm:items-end sm:pb-2 z-20 pointer-events-auto" style={{ height: `${headerHeight * 0.6}px`, minHeight: '40px', maxHeight: '120px' }}>
            <img
              src="/seven logo.png"
              alt="SE7EN Inc. logo"
              className="w-auto h-full max-w-[90px] sm:max-w-[180px] md:max-w-[250px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-all duration-300"
            />
          </div>
        </div>
      </div>

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

          {reportSuccess && (
            <div className="rounded-md bg-green-100 p-3 border border-green-300">
              <p className="text-xs sm:text-sm text-green-800 break-words">{reportSuccess}</p>
            </div>
          )}

          {reportError && (
            <div className="rounded-md bg-destructive/10 p-3 border border-destructive/30">
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
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium">Description *</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm sm:text-base min-h-24 resize-none"
                placeholder="Explain what happened, expected vs actual..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium">Screenshots (optional)</label>
              <p className="text-xs text-muted-foreground">Upload up to 5 images (max 16MB each)</p>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={reportImageFiles.length >= 5 || reportSubmitting}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const remainingSlots = 5 - reportImageFiles.length;
                  const newFiles = files.slice(0, remainingSlots);
                  
                  // Check file sizes
                  const oversizedFiles = newFiles.filter(f => f.size > 16 * 1024 * 1024);
                  if (oversizedFiles.length > 0) {
                    setReportError(`Some files exceed 16MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
                    return;
                  }
                  
                  setReportImageFiles(prev => [...prev, ...newFiles]);
                  const newUrls = newFiles.map(file => URL.createObjectURL(file));
                  setReportImagePreviewUrls(prev => [...prev, ...newUrls]);
                }}
                className="block w-full text-xs sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {/* Paste Image Button */}
              <button
                type="button"
                onClick={handlePasteImage}
                disabled={reportImageFiles.length >= 5 || reportSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm text-gray-600">Click to paste image from clipboard</span>
                <span className="text-xs text-gray-400">(Ctrl+V)</span>
              </button>
              
              {reportImagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {reportImagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(url);
                          setReportImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
                          setReportImageFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={reportSubmitting}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                      <p className="text-xs truncate mt-1 text-center">{reportImageFiles[index]?.name}</p>
                    </div>
                  ))}
                </div>
              )}
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
            <Button 
              onClick={() => void submitReport()} 
              className="w-full sm:w-auto min-w-[120px]" 
              disabled={reportSubmitting || !!reportSuccess}
            >
              {reportSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : reportSuccess ? (
                "Submitted!"
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
