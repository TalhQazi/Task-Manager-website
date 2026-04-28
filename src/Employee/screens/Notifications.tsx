import { useEffect, useMemo, useState, useCallback } from "react";
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
<<<<<<< Updated upstream
import { listResource } from "@/lib/manger/api";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationApi } from "../lib/api";
=======
import { listResource, deleteResource } from "@/lib/manger/api";
>>>>>>> Stashed changes



interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "task";
  timestamp: string;
  read: boolean;
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

export default function EmployeeNotifications() {
const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = useMemo(() => {
  return notifications.filter((n) => !n.read).length;
}, [notifications]);
  const { socket } = useSocket();



const user = JSON.parse(localStorage.getItem("employee") || "{}");
const role = user?.role || "employees";
const userEmail = user?.email || "";
const userName = user?.name || user?.username || userEmail;


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
    };

    setNotifications((prev) => {
      const exists = prev.find((n) => n.id === formatted.id);
      if (exists) return prev;

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
    const data = await listResource<Notification>("notifications");;
   console.log("API DATA:", data);
   const filteredData = (data || []).filter((n: any) => {
    // Check if notification is for this user via recipient field or audience
    const recipient = n.recipient || "";
    const isForMe = recipient.includes(userEmail) || recipient.includes(userName) || n.audience === "all";
    return isForMe;
  });

const formatted: Notification[] = filteredData.map((n: any) => {
      const safeType: Notification["type"] =
        n.type === "success" ||
        n.type === "warning" ||
        n.type === "task"
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
          };
        });


      formatted.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );

      setNotifications((prev) => {
    const merged = [...formatted, ...prev];
    const unique = merged.filter(
    (n, index, self) =>
      index === self.findIndex((x) => x.id === n.id)
    );

    return unique;
}   );
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
<<<<<<< Updated upstream
    // Optimistic update - update UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNotificationApi(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      // Reload notifications to get correct state
      loadNotifications();
=======
    try {
      await deleteResource("notifications", id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Failed to delete notification");
>>>>>>> Stashed changes
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
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "task":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
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
          <Tabs defaultValue="all" className="w-full">
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
  emptyMessage?: string;
}

function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
  getTypeIcon,
  getTypeColor,
  formatTime,
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

  return (
    <div className="divide-y divide-gray-100">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "p-4 hover:bg-gray-50 transition-colors group",
            !notification.read && getTypeColor(notification.type)
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    className={cn(
                      "font-semibold text-gray-900",
                      !notification.read && "text-[#133767]"
                    )}
                  >
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {formatTime(notification.timestamp)}
                    </span>
                    {!notification.read && (
                      <Badge className="bg-[#133767] text-white text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMarkRead(notification.id)}
                    >
                      <CheckCheck className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
