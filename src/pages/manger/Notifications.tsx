import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/manger/ui/table";
import { Search, Bell, CheckCircle2, Clock, FileText, MessageSquare, Trash2, Check } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  message?: string;
  audience: string;
  createdAt: string;
  _id?: string;
  sender?: string;
  recipient?: string;
  type?: string;
  status?: string;
  readBy?: string[];
  assignees?: string[];
  meta?: {
    resourceType?: string;
    resourceId?: string;
    link?: string;
  };
  timestamp?: string;
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

export default function Notifications() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const getNotificationIcon = (resourceType: string) => {
    const rt = resourceType.toLowerCase();
    if (rt.includes("task")) return CheckCircle2;
    if (rt.includes("message")) return MessageSquare;
    if (rt.includes("comment")) return MessageSquare;
    if (rt.includes("project")) return FileText;
    if (rt.includes("delete") || rt.includes("archived")) return Trash2;
    return Bell;
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/api/messages/mark-all-read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } catch {
      // ignore
    }
  };

  const resolveNotificationLink = (n: NotificationItem): string => {
    const direct = String(n.meta?.link || "").trim();
    if (direct) return direct;

    const resourceType = String(n.meta?.resourceType || "").toLowerCase();
    const resourceId = String(n.meta?.resourceId || "").trim();

    if (resourceType.includes("task") && resourceId) return `/manager/tasks?view=${encodeURIComponent(resourceId)}`;
    if (resourceType.includes("project") && resourceId) return `/manager/tasks?project=${encodeURIComponent(resourceId)}`;
    if (resourceType.includes("time") && resourceId) return `/manager/time-tracking?view=${encodeURIComponent(resourceId)}`;

    return "/manager/notifications";
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${encodeURIComponent(id)}/mark-read`, { method: "POST" });
    } catch {
      // ignore
    }
  };

  const onOpenNotification = async (n: NotificationItem) => {
    const id = String(n.id || n._id || "").trim();
    if (id) {
      void markRead(id);
    }
    navigate(resolveNotificationLink(n));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await apiFetch<{ items?: NotificationItem[] } | NotificationItem[]>("/api/notifications?type=broadcast");
        const notificationsList = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        if (!mounted) return;
        setItems(notificationsList);
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load notifications");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => {
      const content = n.content || n.message || "";
      return (
        n.title?.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q) ||
        n.audience?.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            View system notifications and updates.
          </p>
        </div>
        {items.some((n) => n.status !== "read") && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* API Error Message */}
      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-destructive break-words">
            {apiError}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{items.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{items.filter((n) => n.status !== "read").length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unread</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
            Notifications ({filteredNotifications.length})
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
                      className="bg-white rounded-lg border p-4 space-y-3 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => void onOpenNotification(n)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") void onOpenNotification(n);
                      }}
                    >
                      {/* Header with Icon and Title */}
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.status === "read" ? "bg-muted" : "bg-primary/10"}`}>
                          {(() => {
                            const Icon = getNotificationIcon(n.meta?.resourceType || "");
                            return <Icon className={`h-4 w-4 ${n.status === "read" ? "text-muted-foreground" : "text-primary"}`} />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${n.status === "read" ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.sender || "System"}</p>
                        </div>
                        {n.status !== "read" && <div className="w-2 h-2 rounded-full bg-red-500 mt-1" />}
                      </div>

                      {/* Message */}
                      <div className="pl-11">
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.content || n.message}</p>
                      </div>

                      {/* Footer - Audience and Date/Time */}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <Badge variant="secondary" className="text-xs">
                          {n.audience || "Targeted"}
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
                      Try adjusting your search
                    </p>
                  </div>
                )}
              </div>

              {/* Tablet/Desktop View - Table */}
              <div className="hidden sm:block w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm w-[50%]">Notification</TableHead>
                      <TableHead className="text-xs md:text-sm w-[15%]">From</TableHead>
                      <TableHead className="text-xs md:text-sm w-[20%]">Date</TableHead>
                      <TableHead className="text-xs md:text-sm w-[15%]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((n) => {
                      const { date, time } = formatUSA(n.createdAt);
                      const Icon = getNotificationIcon(n.meta?.resourceType || "");
                      const isRead = n.status === "read";
                      return (
                        <TableRow
                          key={n.id}
                          className={`hover:bg-muted/30 cursor-pointer ${isRead ? "" : "bg-primary/5"}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => void onOpenNotification(n)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") void onOpenNotification(n);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isRead ? "bg-muted" : "bg-primary/10"}`}>
                                <Icon className={`w-3.5 h-3.5 ${isRead ? "text-muted-foreground" : "text-primary"}`} />
                              </div>
                              <div className="space-y-1 min-w-0">
                                <p className={`font-medium text-sm md:text-base truncate ${isRead ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                                  {n.content || n.message}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs md:text-sm text-muted-foreground">{n.sender || "System"}</span>
                          </TableCell>
                          <TableCell className="text-sm md:text-base text-muted-foreground whitespace-nowrap">{date}<br/><span className="text-xs text-muted-foreground/60">{time}</span></TableCell>
                          <TableCell>
                            {isRead ? (
                              <Badge variant="outline" className="text-[10px] md:text-xs">Read</Badge>
                            ) : (
                              <Badge className="text-[10px] md:text-xs bg-red-500 hover:bg-red-500">Unread</Badge>
                            )}
                          </TableCell>
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
  );
}
