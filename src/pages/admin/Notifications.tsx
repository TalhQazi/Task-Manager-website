import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import { Plus, Search, Bell, Eye, EyeOff } from "lucide-react";
import { apiFetch, createResource, listResource } from "@/lib/admin/apiClient";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  message?: string;
  audience: "all" | "employees" | "managers";
  createdAt: string;
  readBy?: string[];
  status?: string;
  meta?: {
    resourceType?: string;
    resourceId?: string;
    link?: string;
    category?: string;
  };
}

function formatUSA(dateStr: string) {
  if (!dateStr) return { date: "-", time: "-" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: dateStr, time: "" };
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { date, time };
}

const resolveNotificationLink = (n: NotificationItem) => {
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

  if (direct && direct.startsWith("/admin/")) return direct;

  const content = String(n.content || n.message || "").toLowerCase();
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

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>(() => []);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { socket } = useSocket();
  const auth = getAuthState();
  const currentUser = auth.username || "";

  const onOpenNotification = async (n: NotificationItem) => {
    const id = String(n.id).trim();
    if (id) {
      void markRead(id);
    }
    navigate(resolveNotificationLink(n));
  };

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "all" as NotificationItem["audience"],
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const notificationsList = await listResource<NotificationItem>("notifications", { type: "broadcast" });
        if (!mounted) return;
        setItems(notificationsList);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load notifications");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);


  

  const refresh = async () => {
    const notificationsList = await listResource<NotificationItem>("notifications", { type: "broadcast" });
    setItems(notificationsList);
  };

  const markRead = async (id: string) => {
    // Optimistic: immediately mark as read in local state so it disappears from unread view
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, status: "read", readBy: [...(Array.isArray(n.readBy) ? n.readBy : []), currentUser] }
          : n
      )
    );
    try {
      await apiFetch(`/api/notifications/${encodeURIComponent(id)}/mark-read`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // ignore — optimistic update already applied
    }
  };

  // Real-time: refresh list when a new notification arrives
  useEffect(() => {
    if (!socket) return;
    const handleNew = () => { void refresh(); };
    socket.on("new-notification", handleNew);
    return () => { socket.off("new-notification", handleNew); };
  }, [socket]);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items
      .map((n) => ({ ...n, isRead: n.status === "read" }))
      .sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    if (unreadOnly) list = list.filter((n) => !n.isRead);
    if (!q) return list;
    return list.filter((n) => {
      const content = n.content || n.message || "";
      return (
        n.title?.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q) ||
        n.audience?.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, unreadOnly, currentUser]);

  const addNotification = async () => {
    if (!formData.title || !formData.message) return;
    const next: NotificationItem = {
      id: `NTF-${Date.now().toString().slice(-6)}`,
      title: formData.title,
      message: formData.message,
      audience: formData.audience,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      setApiError(null);
      await createResource<NotificationItem>("notifications", next);
      await refresh();
      setAddOpen(false);
      setFormData({ title: "", message: "", audience: "all" });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to send notification");
    }
  };

  return (
    <>
      {/* Mobile-first container */}
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">
        
        {/* Page Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
              Send system-wide notifications and track logs.
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnreadOnly((v) => !v)}
              className="gap-2 text-xs"
            >
              {unreadOnly ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {unreadOnly ? "Show All" : "Unread Only"}
            </Button>

            {/* New Notification Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="sm:hidden">New</span>
                  <span className="hidden sm:inline">New Notification</span>
                </Button>
              </DialogTrigger>
          
            <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-1.5 sm:space-y-2">
                <DialogTitle className="text-lg sm:text-xl">New Notification</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create and send a notification
                </DialogDescription>
              </DialogHeader>
              
              <form className="space-y-4 sm:space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Title *</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base"
                    placeholder="Overdue task reminder"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm sm:text-base min-h-[80px] sm:min-h-24 resize-none"
                    placeholder="Write message..."
                    required
                  />
                </div>

                {/* Audience */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Audience</label>
                    <select
                      value={formData.audience}
                      onChange={(e) =>
                        setFormData({ ...formData, audience: e.target.value as NotificationItem["audience"] })
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm sm:text-base bg-white"
                    >
                      <option value="all">All</option>
                      <option value="employees">Employees</option>
                      <option value="managers">Managers</option>
                    </select>
                  </div>
                </div>
              </form>
              
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setAddOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addNotification} 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto order-1 sm:order-2"
                >
                  <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-destructive break-words">
              {apiError}
            </p>
          </div>
        )}

        {/* Search Card */}
        <Card className="shadow-soft border-0 sm:border">
          <CardContent className="p-3 sm:p-6">
            <div className="relative w-full sm:max-w-md">
              <label className="block text-xs text-muted-foreground mb-1.5 sm:hidden">
                Search Notifications
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Log Card */}
        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
              Notification Log ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Loading...
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="block sm:hidden space-y-3 p-4">
                  {filteredNotifications.map((n) => {
                    const { date, time } = formatUSA(n.createdAt);
                    return (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-4 space-y-3 cursor-pointer ${n.isRead ? "bg-white" : "bg-blue-50/40"}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => void onOpenNotification(n)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { void onOpenNotification(n); } }}
                      >
                        {/* Header with Icon and Title */}
                        <div className="flex items-start gap-3">
                          <div className="relative h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="h-4 w-4 text-accent" />
                            {!n.isRead && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${n.isRead ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                          </div>
                        </div>

                        {/* Message */}
                        <div className="pl-11">
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.content || n.message}</p>
                        </div>

                        {/* Footer - Audience and Date/Time */}
                        <div className="flex items-center justify-between pt-1 border-t">
                          <Badge variant="secondary" className="text-xs">
                            {n.audience}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{date} • {time}</span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Bell className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">No notifications found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or send a new notification
                      </p>
                    </div>
                  )}
                </div>

                {/* Tablet/Desktop View - Table */}
                <div className="hidden sm:block w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm w-[45%]">Notification</TableHead>
                        <TableHead className="text-xs md:text-sm w-[15%]">Audience</TableHead>
                        <TableHead className="text-xs md:text-sm w-[20%]">Date</TableHead>
                        <TableHead className="text-xs md:text-sm w-[20%]">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((n) => {
                        const { date, time } = formatUSA(n.createdAt);
                        const isUnread = !n.isRead;
                        return (
                          <TableRow
                            key={n.id}
                            className={`cursor-pointer hover:bg-muted/30 ${isUnread ? "bg-blue-50/40" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => void onOpenNotification(n)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { void onOpenNotification(n); } }}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {isUnread && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                  <p className={`text-sm md:text-base ${isUnread ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                                  {n.content || n.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs md:text-sm">
                                {n.audience}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm md:text-base text-muted-foreground whitespace-nowrap">{date}</TableCell>
                            <TableCell className="text-sm md:text-base text-muted-foreground whitespace-nowrap">{time}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
