import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useSocket } from "@/contexts/SocketContext"; 

import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationApi, employeeApiFetch } from "../lib/api";



interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "task" | "payroll" | "document";
  timestamp: string;
  read: boolean;
  category?: string;
  link?: string;
  meta?: { resourceType?: string; resourceId?: string; link?: string; category?: string };
}



const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Task Assigned",
    message: "You have been assigned a new task: Complete project documentation",
    type: "task",
    timestamp: "2024-12-24T10:30:00",
    read: false,
  },
  {
    id: "2",
    title: "Shift Reminder",
    message: "Your shift starts in 1 hour at Main Office",
    type: "info",
    timestamp: "2024-12-24T08:00:00",
    read: false,
  },
  {
    id: "3",
    title: "Task Completed",
    message: "Great job! You completed the client presentation task",
    type: "success",
    timestamp: "2024-12-23T16:45:00",
    read: true,
  },
  {
    id: "4",
    title: "Schedule Change",
    message: "Your Friday shift has been moved to 10:00 AM - 6:00 PM",
    type: "warning",
    timestamp: "2024-12-22T14:20:00",
    read: true,
  },
];

// Add support for specific notification types
const notificationIcons = {
  info: <Info className="mr-2 text-blue-500" />,
  success: <CheckCircle className="mr-2 text-green-500" />,
  warning: <AlertTriangle className="mr-2 text-yellow-500" />,
  task: <Clock className="mr-2 text-purple-500" />,
  payroll: <CheckCheck className="mr-2 text-green-500" />,
  document: <AlertTriangle className="mr-2 text-red-500" />,
};

function resolveEmployeeLink(meta?: { resourceType?: string; resourceId?: string; link?: string; category?: string }): string {
  const resourceType = String(meta?.resourceType || "").toLowerCase().trim();
  const resourceId = String(meta?.resourceId || "").trim();
  const direct = String(meta?.link || "").trim();

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
}

export default function EmployeeNotifications() {
const [notifications, setNotifications] = useState<Notification[]>([]);
const navigate = useNavigate();

  const unreadCount = useMemo(() => {
  return notifications.filter((n) => !n.read).length;
}, [notifications]);
  const { socket } = useSocket();



const user = JSON.parse(localStorage.getItem("employee_auth") || "{}");
const role = user?.role || "employee";
const userEmail = user?.username || "";   // employee_auth stores email as "username"
const userName = user?.name || userEmail;


useEffect(() => {
  if (!socket) return;

  const handleNotification = (data: any) => {
    console.log("FROM BACKEND:", data);

    // Check if notification is for this user
    const recipient = data.recipient || "";
    const isForMe = recipient.includes(userEmail) || recipient.includes(userName) || data.audience === "all";
    if (!isForMe) return;

    const formatted: Notification = {
      id: data.id || data._id || Date.now().toString(),
      title: data.title || "New Notification",
      message: data.content || data.message || "No message body",
      type: data.type === "broadcast" ? "info" : (data.type || "info"),
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      category: data.meta?.category || "",
      link: resolveEmployeeLink(data.meta),
      meta: data.meta,
    };

    setNotifications((prev) => {
      if (prev.find((n) => n.id === formatted.id)) return prev;
      return [formatted, ...prev];
    });
  };

  socket.on("new-notification", handleNotification);

  return () => {
    socket.off("new-notification", handleNotification);
  };
}, [socket, userEmail, userName]);


const loadNotifications = useCallback(async () => {
  try {
    const res = await employeeApiFetch<{ items?: any[] } | any[]>("/api/messages?type=broadcast");
    const rawItems = Array.isArray(res) ? res : (res?.items ?? []);
    const filteredData = rawItems.filter((n: any) => {
      const recipient = n.recipient || "";
      return recipient.includes(userEmail) || recipient.includes(userName) || n.audience === "all";
    });

    const formatted: Notification[] = filteredData.map((n: any) => {
      const safeType: Notification["type"] =
        n.type === "success" || n.type === "warning" || n.type === "task"
          ? n.type
          : "info";
      const readByList = Array.isArray(n.readBy) ? n.readBy : [];
      const isRead = readByList.includes(userName) || readByList.includes(userEmail);
      return {
        id: n.id || n._id,
        title: n.title || "Notification",
        message: n.content || n.message,
        type: safeType,
        timestamp: n.timestamp,
        read: isRead,
        category: n.meta?.category || "",
        link: resolveEmployeeLink(n.meta),
        meta: n.meta,
      };
    });

    formatted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Replace state with fresh API data — socket listener prepends new arrivals on top
    setNotifications(formatted);
  } catch (err) {
    console.error("Failed to load notifications", err);
  }
}, [userEmail, userName]);

useEffect(() => {
  loadNotifications();
}, [loadNotifications]);



  const markAsRead = async (id: string) => {
    // Optimistic update - update UI immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Reload notifications to get correct state
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update - update UI immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      // Reload notifications on error to get correct state
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update - update UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNotificationApi(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      // Reload notifications to get correct state
      loadNotifications();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "task":
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-orange-500/10 border-orange-500/30";
      case "task":
        return "bg-blue-500/10 border-blue-500/30";
      default:
        return "bg-white/[0.03] border-white/10";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#133767]/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#133767]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                <p className="text-sm text-gray-500">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                <p className="text-sm text-gray-500">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.length - unreadCount}
                </p>
                <p className="text-sm text-gray-500">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700">{unreadCount} new</Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({readNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              <NotificationList
                notifications={notifications}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                formatTime={formatTime}
                onNavigate={(link) => navigate(link)}
              />
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <NotificationList
                notifications={unreadNotifications}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                formatTime={formatTime}
                onNavigate={(link) => navigate(link)}
                emptyMessage="No unread notifications"
              />
            </TabsContent>

            <TabsContent value="read" className="m-0">
              <NotificationList
                notifications={readNotifications}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                formatTime={formatTime}
                onNavigate={(link) => navigate(link)}
                emptyMessage="No read notifications"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  formatTime: (timestamp: string) => string;
  onNavigate?: (link: string) => void;
  emptyMessage?: string;
}

function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
  getTypeIcon,
  getTypeColor,
  formatTime,
  onNavigate,
  emptyMessage = "No notifications",
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    const map: Record<string, { label: string; color: string }> = {
      TASK_ASSIGNED: { label: "Task Assigned", color: "bg-blue-100 text-blue-700" },
      PROJECT_ASSIGNED: { label: "Project Assigned", color: "bg-indigo-100 text-indigo-700" },
      MENTIONED: { label: "Mentioned", color: "bg-yellow-100 text-yellow-700" },
      COMMENT_ADDED: { label: "Comment", color: "bg-green-100 text-green-700" },
      TASK_COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
      SYSTEM: { label: "System", color: "bg-gray-100 text-gray-600" },
    };
    const entry = map[category];
    if (!entry) return null;
    return <Badge className={cn("text-[10px] px-1.5 py-0", entry.color)}>{entry.label}</Badge>;
  };

  return (
    <div className="divide-y divide-white/10">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-3 p-3 border-b transition-colors",
            notification.read ? "bg-gray-50" : "bg-white",
            notification.link && "cursor-pointer hover:bg-gray-100"
          )}
          onClick={() => {
            if (notification.link && onNavigate) {
              onMarkRead(notification.id);
              onNavigate(notification.link);
            }
          }}
        >
          <div className="mt-0.5">{notificationIcons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{notification.title}</p>
              {getCategoryBadge(notification.category)}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(notification.timestamp)}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {!notification.read && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
              >
                Mark Read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-red-500 hover:text-red-700"
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
