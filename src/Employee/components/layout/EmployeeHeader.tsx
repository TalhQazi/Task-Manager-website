import { useState, useEffect, useRef } from "react";
import { Bell, Menu, Mail, User, Settings, LogOut, Camera, Palette, Loader2, Megaphone, Sparkles, Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useSocket } from "@/contexts/SocketContext";
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
import { getEmployeeProfile, toProxiedUrl, employeeApiFetch } from "@/Employee/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/manger/api";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";

function HolidayEffects({ type }: { type: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const maxParticles = 35;

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement.clientHeight || 300;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedX = 0;
      speedY = 0;
      opacity = 0;
      color = "";
      angle = 0;
      spin = 0;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        
        if (type === "lanterns") {
          this.y = init ? Math.random() * canvas.height : canvas.height + Math.random() * 20;
          this.size = Math.random() * 10 + 5;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.speedY = -(Math.random() * 0.4 + 0.2);
        } else if (type === "snow") {
          this.y = init ? Math.random() * canvas.height : -10;
          this.size = Math.random() * 2.5 + 0.8;
          this.speedX = Math.random() * 0.4 + 0.1;
          this.speedY = Math.random() * 0.8 + 0.3;
        } else if (type === "leaves") {
          this.y = init ? Math.random() * canvas.height : -20;
          this.size = Math.random() * 7 + 3;
          this.speedX = (Math.random() - 0.5) * 0.4;
          this.speedY = Math.random() * 0.6 + 0.3;
          this.angle = Math.random() * 360;
          this.spin = (Math.random() - 0.5) * 1.5;
        } else if (type === "confetti") {
          this.y = init ? Math.random() * canvas.height : -10;
          this.size = Math.random() * 5 + 3;
          this.speedX = (Math.random() - 0.5) * 1.2;
          this.speedY = Math.random() * 1.5 + 1.2;
          this.angle = Math.random() * 360;
          this.spin = (Math.random() - 0.5) * 4;
        } else {
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 3 + 1.2;
          this.speedX = (Math.random() - 0.5) * 0.08;
          this.speedY = (Math.random() - 0.5) * 0.08;
        }

        this.opacity = Math.random() * 0.4 + 0.2;

        if (type === "lanterns") {
          this.color = `rgba(${Math.floor(Math.random() * 45 + 210)}, ${Math.floor(Math.random() * 80 + 50)}, 0, `;
        } else if (type === "snow") {
          this.color = `rgba(255, 255, 255, `;
        } else if (type === "leaves") {
          const leafColors = ["#D66060", "#F3904F", "#EBB02D", "#C0392B", "#D35400"];
          this.color = leafColors[Math.floor(Math.random() * leafColors.length)];
        } else if (type === "confetti") {
          const confColors = ["#FF2E93", "#FF8A00", "#FF007A", "#00F0FF", "#9E00FF", "#00FF66"];
          this.color = confColors[Math.floor(Math.random() * confColors.length)];
        } else {
          this.color = `rgba(255, ${Math.floor(Math.random() * 45 + 210)}, 80, `;
        }
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (type === "leaves" || type === "confetti") {
          this.angle += this.spin;
        }

        if (type === "lanterns") {
          if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
            this.reset();
          }
        } else {
          if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
            this.reset();
          }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();

        if (type === "lanterns") {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.6);
          grad.addColorStop(0, "rgba(255, 220, 150, 1)");
          grad.addColorStop(0.3, this.color + this.opacity + ")");
          grad.addColorStop(1, "rgba(255, 50, 0, 0)");
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.size);
          ctx.lineTo(this.x, this.y + this.size * 1.8);
          ctx.strokeStyle = `rgba(220, 30, 0, ${this.opacity * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (type === "snow") {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color + this.opacity + ")";
          ctx.fill();
        } else if (type === "leaves") {
          ctx.translate(this.x, this.y);
          ctx.rotate((this.angle * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.opacity;
          ctx.fill();
        } else if (type === "confetti") {
          ctx.translate(this.x, this.y);
          ctx.rotate((this.angle * Math.PI) / 180);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.opacity;
          ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
          ctx.translate(this.x, this.y);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.lineTo(0, this.size);
            ctx.lineTo(this.size * 0.18, 0);
          }
          ctx.closePath();
          ctx.fillStyle = this.color + this.opacity + ")";
          ctx.fill();
        }

        ctx.restore();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70" />;
}

interface EmployeeHeaderProps {
  onMenuClick?: () => void;
}

interface ProfileData {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  current_status?: "AVAILABLE" | "LUNCH" | "BREAK";
  lunch_start_time?: string | null;
  lunch_expected_end?: string | null;
  break_start_time?: string | null;
}

interface Notification {
  id: string;
  content: string;
  timestamp?: string;
  status?: string;
  meta?: {
    resourceType?: string;
    resourceId?: string;
    link?: string;
    category?: string;
  };
}

export function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    try {
      const cachedRaw = localStorage.getItem("employee_cached_profile");
      if (cachedRaw) return JSON.parse(cachedRaw);
    } catch {}
    return null;
  });

  // Header image upload states
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHeaderPickerOpen, setIsHeaderPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const auth = getEmployeeAuth();

  const resolveEmployeeLink = (n: Notification): string => {
    const resourceType = String(n.meta?.resourceType || "").toLowerCase().trim();
    const resourceId = String(n.meta?.resourceId || "").trim();
    const direct = String(n.meta?.link || "").trim();

    if (resourceType === "task" || resourceType === "task comment") {
      return resourceId ? `/employee/tasks/${resourceId}` : "/employee/tasks";
    }
    if (resourceType === "project" || resourceType === "project comment") {
      return "/employee/tasks";
    }
    if (resourceType === "time entry" || resourceType === "timeentry" || resourceType === "time_entry") {
      return "/employee/timeLogs";
    }
    if (resourceType === "payroll") {
      return "/employee/payroll";
    }
    if (resourceType === "leave_request" || resourceType === "leaverequest") {
      return "/employee/leave-requests";
    }
    if (resourceType === "announcement") {
      return "/employee/announcements";
    }

    if (direct) {
      if (direct.includes("/tasks")) {
        const match = direct.match(/\/tasks\/([a-f0-9]+)/i);
        return match ? `/employee/tasks/${match[1]}` : "/employee/tasks";
      }
      if (direct.includes("/projects")) {
        return "/employee/tasks";
      }
      if (direct.includes("/time-tracking") || direct.includes("/time-logs") || direct.includes("/timelogs")) {
        return "/employee/timeLogs";
      }
      if (direct.includes("/payroll")) {
        return "/employee/payroll";
      }
      if (direct.includes("/leave-requests")) {
        return "/employee/leave-requests";
      }
      if (direct.includes("/announcements")) {
        return "/employee/announcements";
      }
      if (direct.includes("/shopping-lists")) {
        return "/employee/shopping-lists";
      }
      if (direct.includes("/travel-calendar")) {
        return "/employee/travel-calendar";
      }
    }

    return "/employee/notifications";
  };

  // Fetch profile for avatar image
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getEmployeeProfile();
        setProfile(res.item);
        if (res.item) {
          localStorage.setItem("employee_cached_profile", JSON.stringify(res.item));
        }
      } catch (err) {
        console.error("Failed to load profile for header:", err);
      }
    };
    loadProfile();

    window.addEventListener("employee-profile-updated", loadProfile);
    return () => {
      window.removeEventListener("employee-profile-updated", loadProfile);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
    };
    window.addEventListener("header-settings-updated", handleUpdate);
    return () => window.removeEventListener("header-settings-updated", handleUpdate);
  }, [queryClient]);

  // Header settings from admin panel
  const headerSettingsQuery = useQuery({
    queryKey: ["header-settings"],
    queryFn: async () => {
      return apiFetch<{ item: {
        backgroundType: 'color' | 'image';
        colorConfig?: { from: string; via: string; to: string };
        imageConfig?: { dataUrl?: string; url?: string; size?: string; position?: string; repeat?: string };
        overlay?: { enabled: boolean; color: string };
        height: number;
        holidayTheme?: {
          active: boolean;
          name: string;
          displayName: string;
          message: string;
          backgroundType: 'color' | 'image';
          colorConfig?: { from: string; via: string; to: string };
          imageConfig?: { dataUrl?: string; url?: string; size?: string; position?: string; repeat?: string };
          overlay?: { enabled: boolean; color: string };
          effects?: string;
          isLunar?: boolean;
        };
      } }>("/api/header-settings");
    },
  });

  const headerSettings = headerSettingsQuery.data?.item;
  const activeHoliday = headerSettings?.holidayTheme?.active ? headerSettings.holidayTheme : null;
  const headerHeight = 300;
  
  const headerImageUrlRaw = activeHoliday
    ? activeHoliday.backgroundType === "image"
      ? activeHoliday.imageConfig?.url || activeHoliday.imageConfig?.dataUrl
      : null
    : headerSettings?.backgroundType === "image"
      ? headerSettings?.imageConfig?.url || headerSettings?.imageConfig?.dataUrl
      : null;

  const headerImageUrl = headerImageUrlRaw ? toProxiedUrl(headerImageUrlRaw) : null;
  const hasImageBackground = Boolean(headerImageUrl);

  const [localPosition, setLocalPosition] = useState<string>("");

  useEffect(() => {
    if (headerSettings?.imageConfig?.position) {
      setLocalPosition(headerSettings.imageConfig.position);
    }
  }, [headerSettings?.imageConfig?.position]);

  const getVerticalPositionValue = (posStr: string | undefined): number => {
    if (!posStr) return 50;
    if (posStr === "center") return 50;
    if (posStr === "top") return 0;
    if (posStr === "bottom") return 100;
    if (posStr === "left" || posStr === "right") return 50;
    const match = posStr.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 50;
  };

  const fullName = (profile?.name || auth?.name || auth?.username || "Employee").trim();
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "E";

  const { socket } = useSocket();

  const announcementUnreadQuery = useQuery({
    queryKey: ["employee-announcement-unread"],
    queryFn: async () => {
      const res = await employeeApiFetch<{ unread?: number }>("/api/announcements/unread-count");
      return typeof res?.unread === "number" ? res.unread : 0;
    },
    refetchInterval: 60000,
    retry: 1,
  });
  const announcementUnread = announcementUnreadQuery.data ?? 0;

  // Direct message conversations preview
  const conversationsQuery = useQuery({
    queryKey: ["employee-conversations-preview", profile?.name],
    queryFn: async () => {
      const name = profile?.name;
      if (!name) return [];
      const res = await employeeApiFetch<{ items?: any[] }>(`/api/messages/conversations/${encodeURIComponent(name)}`);
      return (res.items || []).slice(0, 4);
    },
    enabled: !!profile?.name,
    staleTime: 20000,
  });

  const unreadMessageCount = (conversationsQuery.data || []).reduce(
    (sum: number, c: any) => sum + (c.unreadCount || 0),
    0
  );

  const notificationsQuery = useQuery({
    queryKey: ["employee-notifications"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: Notification[] } | Notification[]>("/api/notifications?type=broadcast");
      const items = Array.isArray(res) ? res : Array.isArray((res as { items?: Notification[] })?.items) ? (res as { items?: Notification[] }).items : [];
      return items.map((m: Notification) => ({ ...m, id: String(m.id || (m as any)._id || "") })).filter((m: Notification) => Boolean(m.id));
    },
    refetchInterval: 30000,
  });

  // Real-time: immediately refresh unread count when a targeted notification or message arrives
  useEffect(() => {
    if (!socket) return;
    const handleNew = () => { queryClient.invalidateQueries({ queryKey: ["employee-notifications"] }); };
    socket.on("new-notification", handleNew);

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["employee-conversations-preview"] });
    };
    socket.on("new-message", handleNewMessage);

    const handleStatusUpdate = (payload: {
      userId: string;
      current_status: "AVAILABLE" | "LUNCH" | "BREAK";
      lunch_start_time: string | null;
      lunch_expected_end: string | null;
      break_start_time: string | null;
      name: string;
    }) => {
      if (profile && profile.id === payload.userId) {
        setProfile((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            current_status: payload.current_status,
            lunch_start_time: payload.lunch_start_time,
            lunch_expected_end: payload.lunch_expected_end,
            break_start_time: payload.break_start_time,
          };
          localStorage.setItem("employee_cached_profile", JSON.stringify(updated));
          return updated;
        });
      }
    };

    socket.on("status-update", handleStatusUpdate);

    return () => {
      socket.off("new-notification", handleNew);
      socket.off("new-message", handleNewMessage);
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket, queryClient, profile]);

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

  const getStatusDot = () => {
    const status = profile?.current_status || "AVAILABLE";
    if (status === "LUNCH") {
      return (
        <div 
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-black rounded-full shadow-md animate-pulse"
          style={{ backgroundColor: "#F59E0B", animationDuration: "1s" }}
          title="On Lunch"
        />
      );
    }
    if (status === "BREAK") {
      return (
        <div 
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-black rounded-full shadow-md animate-pulse"
          style={{ backgroundColor: "#8B5CF6", animationDuration: "1s" }}
          title="On Break"
        />
      );
    }
    return (
      <div 
        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-black rounded-full shadow-md"
        title="Available"
      />
    );
  };

  const getAvatarStyles = () => {
    const status = profile?.current_status || "AVAILABLE";
    if (status === "LUNCH") {
      return {
        borderColor: "#F59E0B",
        boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)",
      };
    }
    if (status === "BREAK") {
      return {
        borderColor: "#8B5CF6",
        boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
      };
    }
    return {};
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 shadow-floating h-40 sm:h-[220px] md:h-[300px]"
    >
      <div
        className="w-full h-full relative overflow-hidden group"
        style={{
          background: activeHoliday
            ? activeHoliday.backgroundType === "image"
              ? "transparent"
              : `linear-gradient(to right, ${activeHoliday.colorConfig?.from || '#133767'}, ${activeHoliday.colorConfig?.via || '#133767'}, ${activeHoliday.colorConfig?.to || '#133767'})`
            : hasImageBackground
              ? 'transparent'
              : `linear-gradient(to right, ${headerSettings?.colorConfig?.from || 'var(--tb-header-bg)'}, ${headerSettings?.colorConfig?.via || 'var(--tb-header-bg)'}, ${headerSettings?.colorConfig?.to || 'var(--tb-header-bg)'})`
        }}
      >
        {/* Holiday Effects Canvas Overlay */}
        {activeHoliday?.effects && (
          <HolidayEffects type={activeHoliday.effects} />
        )}

        {/* Background Image (Holiday overrides custom) */}
        {(activeHoliday?.backgroundType === "image" || (!activeHoliday && hasImageBackground)) && (
          <>
            <img      
              src={activeHoliday?.backgroundType === "image"
                ? toProxiedUrl(activeHoliday.imageConfig?.url || activeHoliday.imageConfig?.dataUrl)
                : headerImageUrl || undefined}
              alt="header background"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: (activeHoliday?.backgroundType === "image"
                  ? (activeHoliday.imageConfig?.size === "100% 100%" ? "fill" : activeHoliday.imageConfig?.size === "auto" ? "none" : activeHoliday.imageConfig?.size || "cover")
                  : (headerSettings?.imageConfig?.size === "100% 100%" ? "fill" : headerSettings?.imageConfig?.size === "auto" ? "none" : headerSettings?.imageConfig?.size || "cover")) as any,
                objectPosition: activeHoliday?.backgroundType === "image"
                  ? activeHoliday.imageConfig?.position || 'center'
                  : localPosition || 'center',
              }}
              draggable={false}
            />
            {((activeHoliday && activeHoliday.overlay?.enabled) || (!activeHoliday && headerSettings?.overlay?.enabled)) && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: activeHoliday
                    ? activeHoliday.overlay.color || "rgba(0,0,0,0.3)"
                    : headerSettings.overlay.color || 'var(--tb-header-overlay-color)',
                  opacity: 1
                }}
              />
            )}
          </>
        )}

        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Header Content Area */}
          <div
            className="flex-1 relative flex flex-col justify-end px-3 sm:px-6 lg:px-8 md:pl-64 pb-3 sm:pb-6 md:pb-16 animate-fade-in pointer-events-auto"
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

            {/* Branding and Profile - Structured Flex Layout for Right Greeting Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
              <div className="flex flex-col gap-2 sm:gap-4">
                {/* Profile Card (Top) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-xl backdrop-blur-md border hover:bg-black/30 transition-all cursor-pointer group w-fit" style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', borderColor: 'var(--tb-header-border, rgba(255,255,255,0.1))' }}>
                      <div className="relative">
                        <Avatar className="h-10 w-10 border shadow-lg group-hover:ring-2 group-hover:ring-[#00C6FF]/20 transition-all" style={{ borderColor: 'var(--tb-header-border, rgba(255,255,255,0.2))', ...getAvatarStyles() }}>
                          {profile?.avatarUrl ? (
                            <AvatarImage src={toProxiedUrl(profile.avatarUrl)} alt={fullName} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white text-xs font-bold">{initials}</AvatarFallback>
                          )}
                        </Avatar>
                        {getStatusDot()}
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

                  <button
                    type="button"
                    title="Announcements"
                    onClick={() => navigate("/employee/announcements")}
                    className="relative group p-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-black/40"
                    style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', color: 'var(--tb-sidebar-text-color, white)', opacity: 0.7 }}
                  >
                    <Megaphone className="h-5 w-5" />
                    {announcementUnread > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 flex items-center justify-center bg-[#00C6FF] text-[9px] border-black text-black font-bold">
                        {announcementUnread > 9 ? "9+" : announcementUnread}
                      </Badge>
                    )}
                  </button>

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
                          <DropdownMenuItem key={n.id} className="text-xs cursor-pointer focus:bg-white/10" onClick={() => { void markRead(n.id); navigate(resolveEmployeeLink(n)); }}>
                            {String(n.content || "")}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg backdrop-blur-sm transition-colors hover:bg-black/40"
                    title="Search"
                    style={{ backgroundColor: 'var(--tb-header-bg, rgba(0,0,0,0.2))', color: 'var(--tb-sidebar-text-color, white)', opacity: 0.7 }}
                  >
                    <Search className="h-4.5 w-4.5" />
                  </button>

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

              {/* Holiday/Seasonal Greeting Banner Card (Right Side) */}
              {activeHoliday && (
                <div className="flex flex-col items-center md:items-end justify-center pointer-events-auto p-3 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 max-w-sm text-center md:text-right md:mb-1 mr-2 shadow-xl animate-fade-in relative z-20">
                  <div className="text-xs sm:text-sm font-bold text-white drop-shadow-md flex items-center gap-1.5 justify-center md:justify-end">
                    <Sparkles className="h-4 w-4 text-[#FFD700]" />
                    <span>{activeHoliday.displayName}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-white/95 drop-shadow-sm leading-normal mt-1 font-semibold">
                    {activeHoliday.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header Settings Modal */}
      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Header Picture</DialogTitle>
            <DialogDescription>Upload a custom image or pick from images.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Header Background</label>
              <div className="relative h-40 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden group">
                {hasImageBackground ? (
                  <img
                    src={headerImageUrl || undefined}
                    alt="Header preview"
                    className="w-full h-full"
                    style={{ 
                      objectFit: (headerSettings?.imageConfig?.size === "100% 100%" ? "fill" : headerSettings?.imageConfig?.size === "auto" ? "none" : headerSettings?.imageConfig?.size || "cover") as any,
                      objectPosition: headerSettings?.imageConfig?.position || "center"
                    }}
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
                <Palette className="h-4 w-4" /> Pick from Images
              </Button>
              {uploading && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading image...</span>
                </div>
              )}

              {hasImageBackground && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground">Reposition Cover (Uplift / Downlift)</label>
                    <span className="text-xs text-muted-foreground font-mono">{getVerticalPositionValue(localPosition)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getVerticalPositionValue(localPosition)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalPosition(`center ${val}%`);
                    }}
                    onMouseUp={async (e: any) => {
                      const val = e.target.value;
                      const newPos = `center ${val}%`;
                      await apiFetch("/api/header-settings", {
                        method: "PUT",
                        body: JSON.stringify({
                          imageConfig: {
                            position: newPos
                          }
                        })
                      });
                      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
                      window.dispatchEvent(new CustomEvent("header-settings-updated"));
                    }}
                    onTouchEnd={async (e: any) => {
                      const val = e.target.value;
                      const newPos = `center ${val}%`;
                      await apiFetch("/api/header-settings", {
                        method: "PUT",
                        body: JSON.stringify({
                          imageConfig: {
                            position: newPos
                          }
                        })
                      });
                      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
                      window.dispatchEvent(new CustomEvent("header-settings-updated"));
                    }}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Downlift (Top)</span>
                    <span>Center</span>
                    <span>Uplift (Bottom)</span>
                  </div>
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

      {/* Global Search Palette */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} isEmployee={true} />
    </header>
  );
}
