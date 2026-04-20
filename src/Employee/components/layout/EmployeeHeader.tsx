import { useState, useEffect, useMemo } from "react";
import { Bell, Menu, Search, User } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { getEmployeeAuth, clearEmployeeAuth } from "@/Employee/lib/auth";
import { getEmployeeProfile, toProxiedUrl } from "@/Employee/lib/api";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";

interface EmployeeHeaderProps {
  onMenuClick?: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);

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
  const [headerHeight, setHeaderHeight] = useState(250);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setHeaderHeight(120);
      } else if (window.innerWidth < 1024) {
        setHeaderHeight(180);
      } else {
        setHeaderHeight(250);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const res = await apiFetch<{ items?: any[] } | any[]>("/api/notifications?type=broadcast");
      const items = Array.isArray(res) ? res : Array.isArray((res as any)?.items) ? (res as any).items : [];
      return items.map((m: any) => ({ ...m, id: String(m.id || m._id || "") })).filter((m: any) => Boolean(m.id));
    },
    refetchInterval: 5000,
  });

  const notifications = (notificationsQuery.data || [])
    .slice()
    .sort((a: any, b: any) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")))
    .slice(0, 4);

  const unreadCount = (notificationsQuery.data || []).filter((n: any) => n.status !== "read").length;

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

  const onLogout = () => {
    clearEmployeeAuth();
    localStorage.removeItem("token");
    navigate("/login/employee", { replace: true });
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-30 shadow-floating overflow-hidden"
      style={{ height: `${headerHeight}px` }}
    >
      <div 
        className="w-full h-full relative"
        style={{
          background: hasImageBackground 
            ? 'transparent'
            : `linear-gradient(to right, ${headerSettings?.colorConfig?.from || '#133767'}, ${headerSettings?.colorConfig?.via || '#133767'}, ${headerSettings?.colorConfig?.to || '#133767'})`
        }}
      >
        {/* Background Image - Full Width */}
        {hasImageBackground && (
          <>
            <img
              src={headerSettings?.imageConfig?.dataUrl}
              alt="header background"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                objectPosition: headerSettings?.imageConfig?.position || 'center',
                objectFit: headerSettings?.imageConfig?.size === 'contain' ? 'contain' : 'cover'
              }}
            />
            {/* Overlay */}
            {headerSettings?.overlay?.enabled && (
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: headerSettings.overlay.color || 'rgba(0,0,0,0.3)' }}
              />
            )}
          </>
        )}

        {/* Content - with left padding for sidebar on desktop */}
        <div 
          className="relative flex items-center justify-between px-3 sm:px-6 lg:px-10 py-2 md:py-4 animate-fade-in h-full md:pl-20 lg:pl-24"
        >
          <div className="flex items-center z-10" style={{ height: '75%', minHeight: '32px' }}>
            <div className="aspect-square h-full rounded-full border-2 border-white/80 overflow-hidden bg-white shadow-2xl transition-all duration-300 hover:scale-110">
              <img
                src="/taskmanager-by-reardon.svg"
                alt="Task Manager logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* CENTER BRANDING REMOVED FOR CLEANLINESS */}

          <div className="flex items-center gap-2 sm:gap-3 text-white z-10">
            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Open navigation"
              onClick={() => onMenuClick?.()}
            >
              <Menu className="h-5 w-5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex relative h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 mr-2">
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-xs text-muted-foreground">No notifications</DropdownMenuItem>
                ) : (
                  notifications.map((n: any) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-0.5 text-xs"
                      onClick={() => { void markRead(n.id); navigate("/employee/notifications"); }}
                    >
                      <span className={`font-medium line-clamp-2 ${n.status !== "read" ? "font-semibold" : "text-muted-foreground"}`}>{String(n.content || "")}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-center justify-center font-medium text-primary cursor-pointer"
                  onClick={async () => {
                    await markAllRead();
                    navigate("/employee/notifications");
                  }}
                >
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="hidden sm:inline-flex items-center justify-center h-12 w-12 p-0 rounded-full bg-transparent hover:bg-transparent"
                  aria-label="Account menu"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/70">
                    <AvatarImage src={toProxiedUrl(profile?.avatarUrl)} alt={fullName} crossOrigin="anonymous" />
                    <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mr-2">
                <DropdownMenuLabel className="text-xs">{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs" onClick={() => navigate("/employee/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onClick={onLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
