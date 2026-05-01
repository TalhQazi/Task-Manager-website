import { useState, useEffect } from "react";
import { Bell, Menu, Mail, User, Settings, LogOut, Bug, Camera, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { getEmployeeAuth, clearEmployeeAuth } from "@/Employee/lib/auth";
import { getEmployeeProfile, toProxiedUrl } from "@/Employee/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";

interface EmployeeHeaderProps {
  onMenuClick?: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Notification {
  id: string;
  content: string;
  timestamp?: string;
  status?: string;
}

export function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Header image upload states
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHeaderPickerOpen, setIsHeaderPickerOpen] = useState(false);

  const auth = getEmployeeAuth();

  // Fetch profile for avatar image
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getEmployeeProfile();
        setProfile(res.item);
      } catch (err) {
        console.error("Failed to load profile for header:", err);
      }
    };
    loadProfile();
  }, []);

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
  const headerHeight = 300;
  const hasImageBackground = headerSettings?.backgroundType === 'image' && headerSettings.imageConfig?.dataUrl;

  const fullName = (profile?.name || auth?.name || auth?.username || "Employee").trim();
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "E";

  const notificationsQuery = useQuery({
    queryKey: ["employee-notifications"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: Notification[] } | Notification[]>("/api/notifications?type=broadcast");
      const items = Array.isArray(res) ? res : Array.isArray((res as { items?: Notification[] })?.items) ? (res as { items?: Notification[] }).items : [];
      return items.map((m: Notification) => ({ ...m, id: String(m.id || m._id || "") })).filter((m: Notification) => Boolean(m.id));
    },
    refetchInterval: 5000,
  });

  const notifications = (notificationsQuery.data || [])
    .slice()
    .sort((a: Notification, b: Notification) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
    .slice(0, 4);

  const unreadCount = (notificationsQuery.data || []).filter((n: Notification) => n.status !== "read").length;

  const markAllRead = async () => {
    try {
      await apiFetch("/api/messages/mark-all-read", { method: "POST" });
      await notificationsQuery.refetch();
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/mark-read`, { method: "POST" });
      await notificationsQuery.refetch();
    } catch {
      // ignore
    }
  };

  const onLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearEmployeeAuth();
    localStorage.removeItem("token");
    navigate("/login/employee", { replace: true });
  };

  // Handle header image upload
  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await apiFetch("/api/header-settings", {
          method: "PUT",
          body: JSON.stringify({
            backgroundType: "image",
            imageConfig: {
              dataUrl: base64String,
              url: base64String
            }
          })
        });
        queryClient.invalidateQueries({ queryKey: ["header-settings"] });
        window.dispatchEvent(new CustomEvent("header-settings-updated"));
        setHeaderModalOpen(false);
      } catch (error) {
        console.error("Failed to upload header image:", error);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetHeader = async () => {
    try {
      await apiFetch("/api/header-settings/reset", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
      window.dispatchEvent(new CustomEvent("header-settings-updated"));
      setHeaderModalOpen(false);
    } catch (error) {
      console.error("Failed to reset header:", error);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 shadow-floating"
      style={{ height: '300px' }}
    >
      <div
        className="w-full h-full relative overflow-hidden group"
        style={{
          background: hasImageBackground
            ? 'transparent'
            : `linear-gradient(to right, ${headerSettings?.colorConfig?.from || 'var(--tb-header-bg)'}, ${headerSettings?.colorConfig?.via || 'var(--tb-header-bg)'}, ${headerSettings?.colorConfig?.to || 'var(--tb-header-bg)'})`
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
            {/* Header Picture Edit Buttons */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                onClick={() => navigate("/employee/ui-customization")}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm border border-white/20"
                title="UI Customization"
              >
                <Palette className="h-5 w-5" />
              </button>
              <button
                onClick={() => setHeaderModalOpen(true)}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm border border-white/20"
                title="Change Header Picture"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            {/* LEFT SIDE: Branding and Profile Stacking */}
            <div className="flex flex-col gap-4">
              {/* Profile Card (Top) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 p-2 rounded-xl backdrop-blur-md border hover:bg-black/30 transition-all cursor-pointer group w-fit" style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', borderColor: 'var(--tb-header-border, rgba(255,255,255,0.1))' }}>
                    <div className="relative">
                      <Avatar className="h-10 w-10 border shadow-lg group-hover:ring-2 group-hover:ring-[#00C6FF]/20 transition-all" style={{ borderColor: 'var(--tb-header-border, rgba(255,255,255,0.2))' }}>
                        {profile?.avatarUrl ? (
                          <AvatarImage src={toProxiedUrl(profile.avatarUrl)} alt={fullName} crossOrigin="anonymous" className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white text-xs font-bold">{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-black rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-base font-bold truncate leading-tight drop-shadow-md" style={{ color: 'var(--tb-sidebar-text-color, white)' }}>{fullName}</span>
                      <span className="text-[11px] truncate tracking-wide uppercase font-semibold" style={{ color: 'var(--tb-sidebar-text-color, white)', opacity: 0.6 }}>Employee</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" className="w-56 mt-2">
                  <DropdownMenuLabel className="text-xs">Account Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/employee/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/employee/ui-customization")}>
                    <Settings className="mr-2 h-4 w-4" /> UI Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Actions Bar (Bottom) */}
              <div className="flex items-center justify-start gap-4">
                <div className="md:hidden">
                  <button type="button" className="group inline-flex h-9 w-9 items-center justify-center rounded-full transition-all" aria-label="Open navigation" title="Open navigation" onClick={() => onMenuClick?.()} style={{ backgroundColor: 'var(--tb-header-bg, rgba(255,255,255,0.1))' }}><Menu className="h-5 w-5" style={{ color: 'var(--tb-sidebar-text-color, white)' }} /></button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group p-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-black/40" style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', color: 'var(--tb-sidebar-text-color, white)', opacity: 0.7 }}>
                      <Mail className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="w-64 mt-2">
                    <DropdownMenuLabel className="text-xs">Direct Messages</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-4 text-center text-xs text-muted-foreground">No messages</div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group p-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-black/40" style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', color: 'var(--tb-sidebar-text-color, white)', opacity: 0.7 }}>
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
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.map((n: Notification) => (
                        <DropdownMenuItem key={n.id} className="text-xs" onClick={() => { void markRead(n.id); navigate("/employee/notifications"); }}>
                          {String(n.content || "")}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-red-500/20"
                  title="Logout"
                  style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', color: 'var(--tb-sidebar-text-color, #f87171)', opacity: 0.7 }}
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Settings Modal */}
      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Header Picture</DialogTitle>
            <DialogDescription>Upload a custom image or pick from the asset library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Header Background</label>
              <div className="relative h-40 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden group">
                {hasImageBackground ? (
                  <img
                    src={headerSettings?.imageConfig?.dataUrl}
                    alt="Header preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Click to Upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleHeaderImageUpload} disabled={uploading} />
                </label>
              </div>
              <div className="w-full flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">OR</span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20 gap-2 font-bold"
                onClick={() => setIsHeaderPickerOpen(true)}
              >
                <Palette className="h-4 w-4" /> Pick from Asset Library
              </Button>
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

      {/* Asset Library Picker */}
      <AssetLibraryPicker
        open={isHeaderPickerOpen}
        onOpenChange={setIsHeaderPickerOpen}
        onSelect={async (url) => {
          try {
            await apiFetch("/api/header-settings", {
              method: "PUT",
              body: JSON.stringify({
                backgroundType: "image",
                imageConfig: {
                  url: url,
                  dataUrl: url
                }
              })
            });
            queryClient.invalidateQueries({ queryKey: ["header-settings"] });
            window.dispatchEvent(new CustomEvent("header-settings-updated"));
            setIsHeaderPickerOpen(false);
            setHeaderModalOpen(false);
          } catch (error) {
            console.error("Failed to set header image from library:", error);
          }
        }}
      />
    </header>
  );
}
