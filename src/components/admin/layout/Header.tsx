import { Bell, Bug, Camera, CheckCircle2, ChevronDown, ChevronUp, Loader2, LogOut, Mail, Menu, Move, Save, Search, User, Settings, X as XIcon, Paperclip, Palette, Sparkles } from "lucide-react";
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
    if (days === 1) return "yesterday";
    return `${days}d ago`;
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

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "TASK_ASSIGNED": return "Task";
      case "PROJECT_ASSIGNED": return "Project";
      case "TASK_COMPLETED": return "Done";
      case "MENTIONED": return "Mention";
      case "COMMENT_ADDED": return "Comment";
      case "SYSTEM_ALERT": return "Alert";
      default: return null;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "TASK_ASSIGNED": return "bg-blue-500/20 text-blue-300";
      case "PROJECT_ASSIGNED": return "bg-indigo-500/20 text-indigo-300";
      case "TASK_COMPLETED": return "bg-emerald-500/20 text-emerald-300";
      case "MENTIONED": return "bg-yellow-500/20 text-yellow-300";
      case "COMMENT_ADDED": return "bg-green-500/20 text-green-300";
      case "SYSTEM_ALERT": return "bg-orange-500/20 text-orange-300";
      default: return "bg-slate-700/60 text-slate-300";
    }
  };

  const resolveNotificationLink = (n: MessageApi) => {
    // Prioritise resourceType+resourceId — more reliable than meta.link which the
    // backend sets as "/admin/tasks/:id" (a route that doesn't exist in the SPA).
    const resourceTypeRaw = String(n.meta?.resourceType || "").trim();
    const resourceType = resourceTypeRaw.toLowerCase();
    const resourceId = String(n.meta?.resourceId || "").trim();
    const direct = String(n.meta?.link || "").trim();

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
    if (resourceType === "task" || resourceType === "task comment") {
      if (resourceId) return `/admin/tasks?view=${encodeURIComponent(resourceId)}`;
      return "/admin/tasks";
    }
    if (resourceType === "project" || resourceType === "project comment") {
      if (resourceId) return `/admin/tasks?projectView=${encodeURIComponent(resourceId)}`;
      return "/admin/tasks";
    }
    if (resourceType === "bug") {
      if (resourceId) return `/developer/bugs?view=${encodeURIComponent(resourceId)}`;
      return "/developer/bugs";
    }

    // Fall back to direct link if the backend provided one and it looks like a real SPA route
    if (direct && direct.startsWith("/admin/")) return direct;

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
        return await apiFetch<any>("/api/header-settings");
      } catch (e) {
        console.warn("Failed to fetch header settings:", e);
        return null;
      }
    },
    staleTime: 0, // Always fresh for real-time updates
  });

  // Listen for custom event from Settings page
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["header-settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    };
    window.addEventListener("header-settings-updated", handleUpdate);
    return () => window.removeEventListener("header-settings-updated", handleUpdate);
  }, [queryClient]);

  // Real-time socket listeners for instant badge updates
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    };
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages-preview"] });
    };
    socket.on("new-notification", handleNewNotification);
    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("new-notification", handleNewNotification);
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, queryClient]);

  const headerSettings = headerSettingsQuery.data?.item;
  const activeHoliday = headerSettings?.holidayTheme?.active ? headerSettings.holidayTheme : null;
  const showImage = activeHoliday
    ? activeHoliday.backgroundType === "image"
    : headerSettings?.backgroundType === "image";

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

  // Banner header height (static 300px)
  const headerHeight = 300;

  // Dynamic background style based on settings
  const bgStyle = useMemo(() => {
    const baseStyle: any = {
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#133767'
    };

    if (activeHoliday) {
      if (activeHoliday.backgroundType === "image") {
        baseStyle.backgroundImage = `url("${headerImageUrl}")`;
        baseStyle.backgroundSize = activeHoliday.imageConfig?.size || 'cover';
        baseStyle.backgroundPosition = activeHoliday.imageConfig?.position || 'center';
        baseStyle.backgroundRepeat = activeHoliday.imageConfig?.repeat || 'no-repeat';
      } else {
        const { from = '#133767', via = '#133767', to = '#133767' } = activeHoliday.colorConfig || {};
        baseStyle.background = `linear-gradient(to right, ${from}, ${via}, ${to})`;
      }
    } else if (headerImageUrl && showImage) {
      baseStyle.backgroundImage = `url("${headerImageUrl}")`;
      baseStyle.backgroundSize = headerSettings?.imageConfig?.size || 'cover';
      baseStyle.backgroundPosition = localPosition || 'center';
      baseStyle.backgroundRepeat = headerSettings?.imageConfig?.repeat || 'no-repeat';
    } else {
      const { from = '#133767', via = '#133767', to = '#133767' } = headerSettings?.colorConfig || {};
      baseStyle.background = `linear-gradient(to right, ${from}, ${via}, ${to})`;
    }

    return baseStyle;
  }, [headerImageUrl, headerSettings, activeHoliday, showImage, localPosition]);

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



  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await apiFetch<{ item: { fullName?: string; email?: string; avatarUrl?: string; avatarDataUrl?: string } }>("/api/settings");
      if (data?.item) {
        localStorage.setItem("taskflow_cached_profile", JSON.stringify({
          fullName: data.item.fullName,
          avatarUrl: data.item.avatarDataUrl || data.item.avatarUrl
        }));
      }
      return data;
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

  const me = String(auth.username || "").trim();
  const myName = String(auth.name || "").trim();

  // Only show unread notifications in the dropdown.
  // Backend tracks reads via a readBy[] array, not a status field — check both.
  const notifications = (notificationsQuery.data || [])
    .filter((n: any) => {
      if (n.status === "read") return false;
      const readBy: string[] = Array.isArray(n.readBy) ? n.readBy : [];
      if (me && readBy.includes(me)) return false;
      if (myName && readBy.includes(myName)) return false;
      return true;
    })
    .slice()
    .sort((a, b) =>
      String(b.timestamp || b.createdAt || "").localeCompare(String(a.timestamp || a.createdAt || ""))
    )
    .slice(0, 8);

  const unreadCount = notifications.length;
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
    // Optimistic: mark all as read via both status and readBy so the filter catches it
    queryClient.setQueryData(["admin-notifications"], (old: any) =>
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
    // Optimistic: mark read in cache via both status and readBy so the filter catches it
    queryClient.setQueryData(["admin-notifications"], (old: any) =>
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

  let cachedProfile = null;
  try {
    const cachedRaw = localStorage.getItem("taskflow_cached_profile");
    if (cachedRaw) cachedProfile = JSON.parse(cachedRaw);
  } catch (e) {}

  const settings = settingsQuery.data?.item;
  const fullName = (settings?.fullName || cachedProfile?.fullName || auth.name || auth.username || "Admin").trim();
  const email = (settings?.email || "").trim();
  const avatarUrl = toProxiedUrl((settings as any)?.avatarDataUrl || (settings as any)?.avatarUrl || cachedProfile?.avatarUrl as string | undefined);
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
        key={`header-bg-${headerImageUrl || 'none'}-${headerSettings?.updatedAt || headerSettings?.height || '0'}`}
        className="w-full h-full relative overflow-hidden group"
        style={bgStyle}
      >
        {/* Holiday Effects Canvas Overlay */}
        {activeHoliday?.effects && (
          <HolidayEffects type={activeHoliday.effects} />
        )}

        {/* Overlay for image backgrounds */}
        {showImage && ((activeHoliday && activeHoliday.overlay?.enabled) || (!activeHoliday && headerSettings?.overlay?.enabled)) && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              backgroundColor: activeHoliday
                ? activeHoliday.overlay.color || "rgba(0,0,0,0.3)"
                : headerSettings.overlay.color || 'var(--tb-header-overlay-color)',
              opacity: 1
            }}
          />
        )}

        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Header Content Area */}
          <div 
            className="flex-1 relative flex flex-col justify-end px-3 sm:px-6 lg:px-8 md:pl-64 pb-8 sm:pb-12 md:pb-16 animate-fade-in pointer-events-auto"
          >
            {/* Branding and Profile */}
            {/* Header Picture Edit Button (Camera Icon) */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button 
                onClick={() => navigate("/admin/theme-engine")}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm border border-white/20"
                title="Theme Customization"
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
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
                    <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
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
                    <DropdownMenuContent align="end" side="bottom" className="w-80 mt-2 p-0 shadow-2xl border-slate-700 bg-[#0f172a]">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <DropdownMenuLabel className="text-sm font-bold text-white p-0">Direct Messages</DropdownMenuLabel>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {messagesQuery.data?.length === 0 ? (
                          <div className="p-8 text-center">
                            <Mail className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No messages found</p>
                          </div>
                        ) : (
                          messagesQuery.data?.map(c => (
                            <DropdownMenuItem 
                              key={c.employee?.id} 
                              onClick={() => navigate("/admin/messaging")}
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="relative">
                                <Avatar className="h-9 w-9 border border-white/10">
                                  <AvatarFallback className="bg-slate-800 text-slate-300 text-[10px]">
                                    {c.employee?.name?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {(c.unreadCount || 0) > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-[#00C6FF] border-2 border-slate-900 rounded-full" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-[13px] font-semibold text-white truncate">{c.employee?.name}</span>
                                  {c.lastMessage?.createdAt && (
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                      {new Date(c.lastMessage.createdAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs truncate ${ (c.unreadCount || 0) > 0 ? 'text-slate-200 font-medium' : 'text-slate-400' }`}>
                                  {c.lastMessage?.content || "No message content"}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                      <DropdownMenuSeparator className="m-0 bg-slate-800" />
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/messaging")}
                        className="justify-center py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                      >
                        Open Messenger
                      </DropdownMenuItem>
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
                    <DropdownMenuContent align="end" side="bottom" className="w-80 mt-2 p-0 shadow-2xl border-slate-700 bg-[#0f172a]">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <DropdownMenuLabel className="text-sm font-bold text-white p-0">Notifications</DropdownMenuLabel>
                        {unreadCount > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#00C6FF] hover:text-white transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.map(n => {
                            const category = n.meta?.category;
                            const label = getCategoryLabel(category);
                            const relTime = formatRelativeTime(n.createdAt || n.timestamp);
                            return (
                              <DropdownMenuItem
                                key={n.id}
                                onSelect={() => {
                                  navigate(resolveNotificationLink(n));
                                  markRead(n.id);
                                }}
                                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer border-b border-slate-800 last:border-0 rounded-none text-white focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white transition-colors"
                              >
                                <span className="text-base leading-none mt-0.5 flex-shrink-0">
                                  {getCategoryIcon(category)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[12px] font-semibold leading-tight truncate">
                                      {n.title || "Notification"}
                                    </span>
                                    {label && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${getCategoryColor(category)}`}>
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                    {n.content}
                                  </p>
                                  {relTime && (
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">{relTime}</span>
                                  )}
                                </div>
                              </DropdownMenuItem>
                            );
                          })
                        )}
                      </div>
                      <DropdownMenuSeparator className="m-0 bg-slate-800" />
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/notifications")}
                        className="justify-center py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                      >
                        View all notifications
                      </DropdownMenuItem>
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

                  <button 
                    onClick={() => { clearAuthState(); navigate("/login"); }}
                    className="relative group p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors text-white/70 hover:text-white hover:text-red-400"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
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
                  {reportError && <div className="text-red-500 text-sm mt-1">{reportError}</div>}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Attachments ({reportImageFiles.length}/5)</span>
                      <Button variant="outline" size="sm" type="button" onClick={handlePasteImage} title="Click to paste image from clipboard">
                        <Paperclip className="h-4 w-4 mr-2" /> Paste Image
                      </Button>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-foreground"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length + reportImageFiles.length > 5) {
                          setReportError("You can only attach up to 5 images.");
                          return;
                        }
                        const newFiles = [...reportImageFiles, ...files].slice(0, 5);
                        setReportImageFiles(newFiles);
                        setReportImagePreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
                        setReportError(null);
                      }}
                    />
                    {reportImagePreviewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {reportImagePreviewUrls.map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border">
                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <button
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-0.5"
                              onClick={() => {
                                const newFiles = [...reportImageFiles];
                                newFiles.splice(i, 1);
                                setReportImageFiles(newFiles);
                                const newUrls = [...reportImagePreviewUrls];
                                URL.revokeObjectURL(newUrls[i]);
                                newUrls.splice(i, 1);
                                setReportImagePreviewUrls(newUrls);
                              }}
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Founder Message Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[60] bg-metallic-gold/90 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pointer-events-auto">
        <FounderMessageBar />
      </div>

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
