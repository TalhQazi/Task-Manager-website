import { useMemo, useState } from "react";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import { Textarea } from "@/components/manger/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/manger/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import { toast } from "@/components/manger/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Send,
  Search,
  Bell,
  MessageSquare,
  Users,
  Plus,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch } from "@/lib/manger/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  recipient: string;
  content: string;
  timestamp: string;
  type: "direct" | "broadcast";
  status: "sent" | "delivered" | "read";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success";
  read: boolean;
}

type MessageApi = Omit<Message, "id"> & {
  _id: string;
};

function normalizeMessage(m: MessageApi): Message {
  return {
    id: m._id,
    sender: m.sender,
    senderAvatar: m.senderAvatar,
    recipient: m.recipient,
    content: m.content,
    timestamp: m.timestamp,
    type: m.type,
    status: m.status,
  };
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "Task Completed",
    message: "Mike Johnson completed the site inspection task.",
    timestamp: "5 min ago",
    type: "success",
    read: false,
  },
  {
    id: "2",
    title: "Maintenance Alert",
    message: "Vehicle #3 is due for scheduled maintenance.",
    timestamp: "1 hour ago",
    type: "warning",
    read: false,
  },
  {
    id: "3",
    title: "New Employee Clock In",
    message: "Emma Davis clocked in at Garage location.",
    timestamp: "2 hours ago",
    type: "info",
    read: true,
  },
  {
    id: "4",
    title: "Schedule Updated",
    message: "Tomorrow's schedule has been modified.",
    timestamp: "3 hours ago",
    type: "info",
    read: true,
  },
];

const notificationTypeStyles = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const statusIcons = {
  sent: Clock,
  delivered: Check,
  read: Check,
};

const newMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("direct"),
    recipient: z.string().min(1, "Recipient is required"),
    content: z.string().min(1, "Message is required"),
  }),
  z.object({
    type: z.literal("broadcast"),
    recipient: z.string().optional().default(""),
    content: z.string().min(1, "Message is required"),
  }),
]);

type NewMessageValues = z.infer<typeof newMessageSchema>;

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">(
    "messages"
  );
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await apiFetch<{ items: MessageApi[] }>("/api/messages");
      return res.items.map(normalizeMessage);
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: async (payload: Omit<Message, "id">) => {
      const res = await apiFetch<{ item: MessageApi }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizeMessage(res.item);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const messages = messagesQuery.data ?? [];

  const form = useForm<NewMessageValues>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: {
      recipient: "",
      type: "direct",
      content: "",
    },
  });

  const onCreateMessage = (values: NewMessageValues) => {
    const payload: Omit<Message, "id"> = {
      sender: "You",
      senderAvatar: "JD",
      recipient: values.type === "broadcast" ? "All Employees" : values.recipient,
      content: values.content,
      timestamp: "Just now",
      type: values.type,
      status: "sent",
    };

    createMessageMutation.mutate(payload, {
      onSuccess: () => {
        setIsNewMessageOpen(false);
        form.reset();
        toast({
          title: "Message sent",
          description: "Your message has been added.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to send message",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      return (
        m.recipient.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
      );
    });
  }, [messages, searchQuery]);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Messages & Notifications</h1>
          <p className="page-subtitle">
            Communicate with your team and view alerts
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewMessageOpen(true)}>
          <Plus className="w-4 h-4" />
          New Message
        </Button>
      </div>

      <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Send a message to a person or broadcast to all employees.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateMessage)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="broadcast">Broadcast</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            form.watch("type") === "broadcast"
                              ? "All Employees"
                              : "Recipient name"
                          }
                          disabled={form.watch("type") === "broadcast"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[140px]" placeholder="Type your message..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("messages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "messages"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {notifications.filter((n) => !n.read).length > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {notifications.filter((n) => !n.read).length}
            </Badge>
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "messages" ? "Search messages..." : "Search notifications..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {activeTab === "messages" ? "Messages" : "Notifications"}
          </h3>
        </div>

        {activeTab === "messages" ? (
          <div className="divide-y divide-border">
            {messagesQuery.isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading messages...</div>
            ) : messagesQuery.isError ? (
              <div className="p-6 text-sm text-destructive">
                {messagesQuery.error instanceof Error
                  ? messagesQuery.error.message
                  : "Failed to load messages"}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No messages found.</div>
            ) : (
              filteredMessages.map((message) => {
                const StatusIcon = statusIcons[message.status];
                return (
                  <div key={message.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {message.senderAvatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              To: {message.recipient}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {message.type}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StatusIcon className="w-3.5 h-3.5" />
                            {message.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No notifications found.</div>
            ) : (
              filteredNotifications.map((n) => (
                <div key={n.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn("capitalize", notificationTypeStyles[n.type])}
                        >
                          {n.type}
                        </Badge>
                        {!n.read && (
                          <Badge variant="destructive" className="h-5">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-foreground mt-2">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{n.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
