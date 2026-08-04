import { Sidebar } from "./Sidebar";
import { ReactNode, useState, useEffect, useRef } from "react";
import { Bell, Bug, Camera, Loader2, LogOut, Mail, Menu, Palette, Search, Settings, User, Sparkles } from "lucide-react";
import { ThemeShell } from "./ThemeShell";
import { GlobalSearchButton } from "@/components/GlobalSearchButton";
import { useTheme } from "@/contexts/ThemeContext";

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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { apiFetch, toProxiedUrl } from "@/lib/manger/api";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { FounderMessageBar } from "@/components/FounderMessageBar";
import { applyFullTheme, themeDefaults } from "@/lib/manger/theme";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { uiTheme } = useTheme();
  const isMetallic = uiTheme.theme === "metallic-elite";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const auth = getAuthState();

  type MessageApi = {
    id: string;
    _id?: string;
    title?: string;
    content?: string;
    timestamp?: string;
    createdAt?: string;
    status?: "sent" | "delivered" | "read";
    readBy?: string[];
    meta?: {
      resourceType?: string;
      resourceId?: string;
      link?: string;
      category?: string;
    };
  };

  const formatRelativeTime = (ts?: string) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? "yesterday" : `${days}d ago`;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "TASK_ASSIGNED": return "📋";
      case "PROJECT_ASSIGNED": return "📁";
      case "TASK_COMPLETED": return "✅";
      case "MENTIONED": return "💬";
      case "COMMENT_ADDED": return "💬";
      case "SYSTEM_ALERT": return "🔔";
      default: return "🔔";
    }
  };

  const resolveNotificationLink = (n: MessageApi) => {
    // Prioritise resourceType+resourceId — meta.link uses /admin/ prefix which is wrong here.

    const resourceTypeRaw = String(n.meta?.resourceType || "").trim();
    const resourceType = resourceTypeRaw.toLowerCase();
    const resourceId = String(n.meta?.resourceId || "").trim();
    const direct = String(n.meta?.link || "").trim().replace(/^\/admin\//, "/manager/");

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
    if (resourceType === "task" || resourceType === "task comment") {
      if (resourceId) return `/manager/tasks?view=${encodeURIComponent(resourceId)}`;
      return "/manager/tasks";
    }
    if (resourceType === "project" || resourceType === "project comment") {
      if (resourceId) return `/manager/tasks?project=${encodeURIComponent(resourceId)}`;
      return "/manager/tasks";
    }
    if (resourceType === "bug") {
      if (resourceId) return `/developer/bugs?view=${encodeURIComponent(resourceId)}`;
      return "/developer/bugs";
    }

    if (direct) {
      if (direct.includes("/tasks/")) {
        const match = direct.match(/\/tasks\/([a-f0-9]+)/i);
        return match ? `/manager/tasks?view=${match[1]}` : "/manager/tasks";
      }
      if (direct.includes("/employees/")) {
        const match = direct.match(/\/employees\/([a-f0-9]+)/i);
        return match ? `/manager/employees?view=${match[1]}` : "/manager/employees";
      }
      if (direct.includes("/vehicles/")) {
        const match = direct.match(/\/vehicles\/([a-f0-9]+)/i);
        return match ? `/manager/vehicles?view=${match[1]}` : "/manager/vehicles";
      }
      if (direct.includes("/locations/")) {
        const match = direct.match(/\/locations\/([a-f0-9]+)/i);
        return match ? `/manager/locations?view=${match[1]}` : "/manager/locations";
      }
      if (direct.includes("/vendors/")) {
        const match = direct.match(/\/vendors\/([a-f0-9]+)/i);
        return match ? `/manager/vendors?view=${match[1]}` : "/manager/vendors";
      }
      if (direct.includes("/onboarding/")) {
        const match = direct.match(/\/onboarding\/([a-f0-9]+)/i);
        return match ? `/manager/onboarding?view=${match[1]}` : "/manager/onboarding";
      }
      if (direct.includes("/do-not-hire/")) {
        const match = direct.match(/\/do-not-hire\/([a-f0-9]+)/i);
        return match ? `/manager/do-not-hire?view=${match[1]}` : "/manager/do-not-hire";
      }
      if (direct.includes("/appliances/")) {
        const match = direct.match(/\/appliances\/([a-f0-9]+)/i);
        return match ? `/manager/appliances?view=${match[1]}` : "/manager/appliances";
      }
      if (direct.includes("/projects/")) {
        const match = direct.match(/\/projects\/([a-f0-9]+)/i);
        return match ? `/manager/tasks?project=${match[1]}` : "/manager/tasks";
      }

      if (direct.startsWith("/manager/")) return direct;
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

  let cachedProfile: any = null;
  try {
    const cachedRaw = localStorage.getItem("manager_cached_profile");
    if (cachedRaw) cachedProfile = JSON.parse(cachedRaw);
  } catch (e) {}

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: { fullName?: string; email?: string; avatarUrl?: string; avatarDataUrl?: string } }>("/api/settings");
    },
  });

  useEffect(() => {
    if (settingsQuery.data?.item) {
      localStorage.setItem("manager_cached_profile", JSON.stringify(settingsQuery.data.item));
    }
  }, [settingsQuery.data]);

  const profileQuery = useQuery({
    queryKey: ["manager-profile-status"],
    queryFn: async () => {
      return apiFetch<{ item: { current_status?: string; lunch_start_time?: string; lunch_expected_end?: string; break_start_time?: string; id: string } }>("/api/employees/me");
    },
  });

  useEffect(() => {
    if (!socket || !profileQuery.data?.item?.id) return;

    const handleStatusUpdate = (data: { userId: string; current_status: string; lunch_start_time?: string | null; lunch_expected_end?: string | null; break_start_time?: string | null }) => {
      if (data.userId === profileQuery.data.item.id) {
        queryClient.setQueryData(["manager-profile-status"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            item: {
              ...old.item,
              current_status: data.current_status,
              lunch_start_time: data.lunch_start_time || null,
              lunch_expected_end: data.lunch_expected_end || null,
              break_start_time: data.break_start_time || null,
            },
          };
        });
      }
    };

    socket.on("status-update", handleStatusUpdate);
    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [socket, profileQuery.data?.item?.id, queryClient]);

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

  // Handle Image Upload for Header
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHeaderPickerOpen, setIsHeaderPickerOpen] = useState(false);

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

  // Apply user UI preferences on load - same as EmployeeLayout (full applyThemeToDOM)
  useEffect(() => {
    apiFetch<{item: { theme?: string; cardStyle?: string; customColors?: { textColor?: string } }}>("/api/ui-preferences").then(res => {
      const theme = res?.item?.theme || "metallic-elite";
      const cardStyle = res?.item?.cardStyle || "metallic";
      const textColor = res?.item?.customColors?.textColor;
      applyFullTheme(theme, textColor || themeDefaults[theme], cardStyle);
    }).catch(() => {
      // Fallback to metallic-elite
      applyFullTheme("metallic-elite", undefined, "metallic");
    });
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
    };
    window.addEventListener("header-settings-updated", handleUpdate);
    return () => window.removeEventListener("header-settings-updated", handleUpdate);
  }, [queryClient]);

  // System notifications (broadcasts only)
  const notificationsQuery = useQuery({
    queryKey: ["manager-notifications"],
    queryFn: async () => {
      const res = await apiFetch<{ items?: MessageApi[] } | MessageApi[]>("/api/notifications?type=broadcast");
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

  const me = String(auth.username || "").trim();
  const myName = String(auth.name || "").trim();

  const isUnread = (n: any) => {
    if (n.status === "read") return false;
    const readBy: string[] = Array.isArray(n.readBy) ? n.readBy : [];
    if (me && readBy.includes(me)) return false;
    if (myName && readBy.includes(myName)) return false;
    return true;
  };

  const notifications = (notificationsQuery.data || [])
    .filter(isUnread)
    .slice()
    .sort((a, b) => String(b.timestamp || b.createdAt || "").localeCompare(String(a.timestamp || a.createdAt || "")))
    .slice(0, 8);

  const unreadCount = (notificationsQuery.data || []).filter(isUnread).length;
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

  // Socket notifications listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      // Check if this notification is for me
      const me = String(auth.username || "").trim();
      const myName = String(auth.name || "").trim();
      const myRole = String(auth.role || "").trim();
      const recipients = String(data.recipient || "").split(",").map(s => s.trim());

      const isForMe = recipients.includes(me) ||
                      (myName && recipients.includes(myName)) ||
                      recipients.includes(myRole) ||
                      recipients.includes("all") ||
                      (myRole === "manager" && recipients.includes("managers")) ||
                      myRole === "super-admin" ||
                      myRole === "admin";

      if (isForMe) {
        // Refresh notifications count
        queryClient.invalidateQueries({ queryKey: ["manager-notifications"] });
        
        // Determine where to navigate when clicking "View" using robust resolver
        const link = resolveNotificationLink(data);
        
        // Show toast
        // toast(data.title || "New Notification", {
        //   description: data.content || data.message,
        //   action: {
        //     label: "View",
        //     onClick: () => navigate(link)
        //   }
        // });
      }
    };

    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, auth, queryClient, navigate]);

  // Real-time direct message listener — keeps the message badge count current
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["manager-messages-preview"] });
    };
    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, queryClient]);

  const markAllRead = async () => {
    queryClient.setQueryData(["manager-notifications"], (old: any) =>
      Array.isArray(old)
        ? old.map((n) => ({
            ...n,
            status: "read",
            readBy: Array.isArray(n.readBy)
              ? [...new Set([...n.readBy, me, myName].filter(Boolean))]
              : [me, myName].filter(Boolean),
          }))
        : old
    );
    try {
      await apiFetch("/api/messages/mark-all-read", { method: "POST" });
    } catch {
      await notificationsQuery.refetch();
    }
  };

  const markRead = async (id: string) => {
    queryClient.setQueryData(["manager-notifications"], (old: any) =>
      Array.isArray(old)
        ? old.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: "read",
                  readBy: Array.isArray(n.readBy)
                    ? [...new Set([...n.readBy, me, myName].filter(Boolean))]
                    : [me, myName].filter(Boolean),
                }
              : n
          )
        : old
    );
    try {
      await apiFetch(`/api/messages/${id}/mark-read`, { method: "POST" });
    } catch {
      // ignore errors
    }
  };

  const settings = settingsQuery.data?.item;
  const fullName = (settings?.fullName || cachedProfile?.fullName || auth.name || auth.username || "Manager").trim();
  const email = (settings?.email || cachedProfile?.email || "").trim();
  const avatarUrlRaw = (settings as any)?.avatarDataUrl || (settings as any)?.avatarUrl || cachedProfile?.avatarDataUrl || cachedProfile?.avatarUrl;
  const avatarUrl = avatarUrlRaw ? toProxiedUrl(avatarUrlRaw) : "";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "M";

  const currentStatus = profileQuery.data?.item?.current_status || "AVAILABLE";

  let statusRingClass = "border border-white/20 shadow-lg group-hover:ring-2 group-hover:ring-[#00C6FF]/20 transition-all";
  let dotClass = "absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-black rounded-full";

  if (currentStatus === "LUNCH") {
    statusRingClass = "border-2 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all animate-[pulse_2s_infinite]";
    dotClass += " bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse";
  } else if (currentStatus === "BREAK") {
    statusRingClass = "border-2 border-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.5)] transition-all animate-[pulse_2s_infinite]";
    dotClass += " bg-purple-500 shadow-[0_0_6px_#8b5cf6] animate-pulse";
  } else {
    dotClass += " bg-green-500";
  }

  return (
    <ThemeShell>
      <div className="min-h-screen relative" style={{ background: isMetallic ? "transparent" : "var(--tb-dashboard-bg)" }}>
      {/* Top header with dynamic background from admin settings - FULL WIDTH */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 shadow-floating h-[180px] sm:h-[240px] md:h-[300px]"
        style={{ 
          left: '0',
        }}
      >
        <div 
          className={cn(
            "w-full h-full relative overflow-hidden group transition-all duration-300",
            isMetallic ? "border-b border-[#ffd27a]/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)]" : ""
          )}
          style={{
            background: activeHoliday
              ? activeHoliday.backgroundType === "image"
                ? "transparent"
                : `linear-gradient(to right, ${activeHoliday.colorConfig?.from || '#133767'}, ${activeHoliday.colorConfig?.via || '#133767'}, ${activeHoliday.colorConfig?.to || '#133767'})`
              : hasImageBackground 
                ? 'transparent'
                : isMetallic
                ? 'linear-gradient(135deg, #1f2022 0%, #111315 100%)'
                : `linear-gradient(to right, ${headerSettings?.colorConfig?.from || '#133767'}, ${headerSettings?.colorConfig?.via || '#133767'}, ${headerSettings?.colorConfig?.to || '#133767'})`
          }}
        >
          {isMetallic && (
            <>
              {/* Metallic top/bottom rail on header */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#555] via-[#eee] to-[#333] border-b border-[#ffd27a]/20 z-20" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#333] via-[#ffd27a]/30 to-[#111] border-t border-[#ffd27a]/20 z-20" />
              {/* Beveled corner caps */}
              <div className="absolute top-[4px] left-[2px] w-3 h-3 bg-gradient-to-br from-[#444] to-[#222] border-r border-b border-[#ffd27a]/20 z-20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#888]" />
              </div>
              <div className="absolute top-[4px] right-[2px] w-3 h-3 bg-gradient-to-bl from-[#444] to-[#222] border-l border-b border-[#ffd27a]/20 z-20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#888]" />
              </div>
              
              {/* Spark line animation inside header */}
              <div className="spark-line z-20">
                <div className="spark-dot" style={{ animationDuration: uiTheme.animationSettings?.reduceMotion ? "0s" : "4s" }} />
              </div>
            </>
          )}
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
              className={cn(
                "flex-1 relative flex flex-col justify-end px-3 sm:px-6 lg:px-8 pb-4 sm:pb-8 md:pb-12 lg:pb-16 animate-fade-in pointer-events-auto",
                isSidebarCollapsed ? "md:pl-24" : "md:pl-60 lg:pl-68"
              )}
            >
              {/* Header Picture Edit Button (Camera Icon) */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button 
                  onClick={() => navigate("/manager/ui-customization")}
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

              {/* Branding, Profile and Holiday Banner in a responsive Flex row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full relative z-10">
                <div className="flex flex-col gap-4">
                  {isMetallic && (
                    <div className="flex flex-col select-none pointer-events-none mb-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#ffd27a] animate-pulse" />
                        <span className="text-xl sm:text-2xl font-black tracking-widest text-[#ffd27a] drop-shadow-[0_0_8px_rgba(255,151,42,0.5)]" style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
                          TASKBLASTER
                        </span>
                      </div>
                      <span className="text-[9px] tracking-[0.25em] font-mono text-[#cfd7dc]/60 uppercase ml-7">
                        COMMAND CONTROL SHELL
                      </span>
                    </div>
                  )}

                  {/* Profile Card (Top) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group w-fit relative",
                        isMetallic 
                          ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/35 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_4px_8px_rgba(0,0,0,0.5)]" 
                          : "bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30"
                      )}>
                        {isMetallic && (
                          <>
                            {/* Inner glow frame */}
                            <div className="absolute inset-[1px] rounded-lg border border-white/5 pointer-events-none" />
                            {/* Corner brackets */}
                            <div className="metallic-corner-bracket metallic-bracket-tl" />
                            <div className="metallic-corner-bracket metallic-bracket-tr" />
                            <div className="metallic-corner-bracket metallic-bracket-bl" />
                            <div className="metallic-corner-bracket metallic-bracket-br" />
                          </>
                        )}
                        <div className="relative z-10">
                          <Avatar className={cn(
                            "h-10 w-10 border transition-all",
                            isMetallic 
                              ? "border-[#ffd27a]/35 shadow-md group-hover:ring-2 group-hover:ring-[#ffd27a]/25" 
                              : "border-white/20 shadow-lg group-hover:ring-2 group-hover:ring-[#00C6FF]/20"
                          )}>
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                            ) : (
                              <AvatarFallback className={cn(
                                "text-white text-xs font-bold",
                                isMetallic
                                  ? "bg-gradient-to-br from-[#c89537] to-[#ffd27a] text-black"
                                  : "bg-gradient-to-br from-[#00C6FF] to-[#0072FF]"
                              )}>{initials}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-black rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)]",
                            currentStatus === "LUNCH"
                              ? "bg-amber-500 animate-pulse"
                              : currentStatus === "BREAK"
                              ? "bg-purple-500 animate-pulse"
                              : "bg-green-500"
                          )} />
                        </div>
                        <div className="flex flex-col min-w-0 pr-4 relative z-10">
                          <span className="text-base font-bold text-white truncate leading-tight drop-shadow-md">{fullName}</span>
                          <span className={cn(
                            "text-[11px] truncate tracking-wide uppercase font-semibold",
                            isMetallic ? "text-[#ffd27a]" : "text-white/60"
                          )}>{auth.role || "Manager"}</span>
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
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative z-10">
                    <div className="md:hidden">
                      <button 
                        type="button" 
                        className={cn(
                          "group inline-flex h-9 w-9 items-center justify-center rounded-full transition-all",
                          isMetallic
                            ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] text-[#ffd27a] border border-[#ffd27a]/30 shadow-md"
                            : "bg-white/10 hover:bg-white/[0.14]"
                        )}
                        aria-label="Open navigation" 
                        onClick={() => setMobileSidebarOpen(true)}
                      >
                        <Menu className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "relative group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95",
                          isMetallic
                            ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/25 text-[#ffd27a] hover:border-[#ffd27a]/40 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                            : "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white"
                        )}>
                          {isMetallic && <div className="absolute inset-px rounded-md border border-white/5 pointer-events-none" />}
                          <Mail className="h-5 w-5 relative z-10" />
                          {unreadMessageCount > 0 && (
                            <Badge className={cn(
                              "absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] border-black z-20",
                              isMetallic ? "bg-[#ffd27a] text-black" : "bg-[#00C6FF]"
                            )}>
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
                            <DropdownMenuItem
                              key={c.employee?.id}
                              onClick={() => {
                                if (c.employee) {
                                  navigate("/manager/messages", { state: { selectedEmployee: c.employee } });
                                } else {
                                  navigate("/manager/messages");
                                }
                              }}
                            >
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
                        <button className={cn(
                          "relative group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95",
                          isMetallic
                            ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/25 text-[#ffd27a] hover:border-[#ffd27a]/40 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                            : "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white"
                        )}>
                          {isMetallic && <div className="absolute inset-px rounded-md border border-white/5 pointer-events-none" />}
                          <Bell className="h-4.5 w-4.5 relative z-10" />
                          {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[9px] border-black z-20">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom" className={cn("w-80 mt-2 p-0 shadow-2xl", isMetallic ? "border-[#ffd27a]/35 bg-[#111315]" : "border-slate-700 bg-[#0f172a]")}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <DropdownMenuLabel className="text-sm font-bold text-white p-0">Notifications</DropdownMenuLabel>
                          {unreadCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void markAllRead(); }}
                              className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", isMetallic ? "text-[#ffd27a] hover:text-white" : "text-[#00C6FF] hover:text-white")}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-[380px] overflow-y-auto">
                          {notificationsQuery.isLoading ? (
                            <div className="p-6 text-center text-xs text-slate-400">Loading...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-6 text-center">
                              <Bell className="h-7 w-7 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400">You're all caught up!</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const category = n.meta?.category;
                              const relTime = formatRelativeTime(n.createdAt || n.timestamp);
                              return (
                                <DropdownMenuItem
                                  key={n.id}
                                  onClick={() => {
                                    navigate(resolveNotificationLink(n));
                                    void markRead(String(n.id));
                                  }}
                                  className="flex items-start gap-3 px-3 py-2.5 cursor-pointer border-b border-slate-800 last:border-0 rounded-none text-white focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white transition-colors"
                                >
                                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{getCategoryIcon(category)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold leading-tight truncate">{n.title || "Notification"}</p>
                                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mt-0.5">{n.content}</p>
                                    {relTime && <span className="text-[10px] text-slate-500 mt-0.5 block">{relTime}</span>}
                                  </div>
                                </DropdownMenuItem>
                              );
                            })
                          )}
                        </div>
                        <DropdownMenuSeparator className="m-0 bg-slate-800" />
                        <DropdownMenuItem
                          onClick={() => navigate("/manager/notifications")}
                          className="justify-center py-2.5 text-xs font-bold text-slate-400 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-slate-800/50 transition-all"
                        >
                          View all notifications
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button 
                      onClick={() => { resetReport(); setReportOpen(true); }}
                      className={cn(
                        "relative group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95",
                        isMetallic
                          ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/25 text-[#ffd27a] hover:border-[#ffd27a]/40 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          : "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white"
                      )}
                      title="Submit Bug Report"
                    >
                      {isMetallic && <div className="absolute inset-px rounded-md border border-white/5 pointer-events-none" />}
                      <Bug className="h-4.5 w-4.5 relative z-10" />
                    </button>

                    <GlobalSearchButton
                      isEmployee={false}
                      basePath="/manager"
                      iconClassName="h-4.5 w-4.5 relative z-10"
                      className={cn(
                        "relative group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95",
                        isMetallic
                          ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-[#ffd27a]/25 text-[#ffd27a] hover:border-[#ffd27a]/40 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          : "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white"
                      )}
                    >
                      {isMetallic && <div className="absolute inset-px rounded-md border border-white/5 pointer-events-none" />}
                    </GlobalSearchButton>

                    <button
                      onClick={() => { clearAuthState(); navigate("/login"); }}
                      className={cn(
                        "relative group p-2 rounded-lg backdrop-blur-sm transition-all duration-150 active:scale-95",
                        isMetallic
                          ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border border-red-500/30 text-red-400 hover:border-red-500 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          : "bg-black/20 hover:bg-red-500/20 text-red-400/70 hover:text-red-400"
                      )}
                      title="Logout"
                    >
                      {isMetallic && <div className="absolute inset-px rounded-md border border-white/5 pointer-events-none" />}
                      <LogOut className="h-4.5 w-4.5 relative z-10" />
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
              <DialogDescription>Choose a high-quality image for your manager dashboard banner.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/5 overflow-hidden relative group">
                  {headerImageUrl ? (
                    <img 
                      src={headerImageUrl} 
                      alt="Preview" 
                      className="w-full h-full" 
                      style={{ 
                        objectFit: (headerSettings?.imageConfig?.size === "100% 100%" ? "fill" : headerSettings?.imageConfig?.size === "auto" ? "none" : headerSettings?.imageConfig?.size || "cover") as any,
                        objectPosition: headerSettings?.imageConfig?.position || "center"
                      }} 
                    />
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
              </div>

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
              <label className="block text-xs sm:text-sm font-medium">Attachment (Image or Video)</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReportImageFile(file);
                  if (reportImagePreviewUrl) URL.revokeObjectURL(reportImagePreviewUrl);
                  setReportImagePreviewUrl(file ? URL.createObjectURL(file) : "");
                }}
              />
              {reportImagePreviewUrl ? (
                <div className="w-full overflow-hidden rounded-lg border bg-black flex justify-center">
                  {reportImageFile?.type?.startsWith("video/") ? (
                    <video src={reportImagePreviewUrl} controls className="w-full h-auto max-h-64 object-contain" />
                  ) : (
                    <img src={reportImagePreviewUrl} alt="preview" className="w-full h-auto max-h-64 object-contain" />
                  )}
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
          <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
        </div>
        <main
          className={cn(
            "flex-1 min-h-screen pt-[180px] sm:pt-[240px] md:pt-[300px] transition-all duration-300",
            isSidebarCollapsed ? "md:ml-20" : "md:ml-56 lg:ml-64"
          )}
          style={{ background: isMetallic ? 'transparent' : 'var(--tb-dashboard-bg)' }}
        >
          <div className="w-full px-4 py-4 sm:py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* TaskBlaster overlay for celebrations */}
      <TaskBlaster />
      </div>
    </ThemeShell>
  );
}
