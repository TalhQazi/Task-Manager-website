import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { toast } from "@/components/admin/ui/use-toast";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnnouncementWebSocket } from "@/lib/announcementWebSocket";
import AnnouncementAcknowledgement from "@/pages/admin/components/AnnouncementAcknowledgement";
import { employeeApiFetch } from "@/Employee/lib/api";

type JsonFetch = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  authorName: string;
  createdAt: string;
  expiresAt?: string;
  emergency: boolean;
  requiresAcknowledgement: boolean;
  isRead: boolean;
  isAcknowledged: boolean;
}

interface EmployeeAnnouncementsProps {
  /** Employee portal uses employee JWT; manager uses admin apiFetch. */
  fetchJson?: JsonFetch;
  /** Prefix for React Query keys (avoid collisions when both portals are used). */
  cacheScope?: string;
}

export default function EmployeeAnnouncements({
  fetchJson = employeeApiFetch,
  cacheScope = "employee",
}: EmployeeAnnouncementsProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
  const [tab, setTab] = useState("unread");

  const queryClient = useQueryClient();

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const ws = getAnnouncementWebSocket();
    ws.connect({
      onNewAnnouncement: () => {
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcements`] });
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcement-unread`] });
        queryClient.invalidateQueries({ queryKey: ["employee-announcement-unread"] });
        toast({
          title: "New Announcement",
          description: "A new announcement has been published",
        });
      },
      onAnnouncementPublished: () => {
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcements`] });
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcement-unread`] });
        queryClient.invalidateQueries({ queryKey: ["employee-announcement-unread"] });
      },
      onAnnouncementUpdated: () => {
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcements`] });
        queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcement-unread`] });
        queryClient.invalidateQueries({ queryKey: ["employee-announcement-unread"] });
      },
    });

    return () => {
      // Keep connection alive
    };
  }, [queryClient, cacheScope]);

  // Fetch announcements for employee
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: [`${cacheScope}-announcements`, tab],
    queryFn: async () => {
      return fetchJson<any>(`/api/announcements?filter=${encodeURIComponent(tab)}`);
    },
  });

  // Mark as read
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson<any>(`/api/announcements/${id}/read`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcements`] });
      queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcement-unread`] });
      queryClient.invalidateQueries({ queryKey: ["employee-announcement-unread"] });
    },
  });

  const announcements = announcementsData?.items || [];

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bell className="h-8 w-8 text-[#00C6FF]" />
          Announcements
        </h1>
        <p className="text-white/60 mt-1">Stay updated with company announcements</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/[0.05] border border-white/10">
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="important">Important</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Announcements List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#00C6FF]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] py-12">
          <Bell className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-semibold text-white/60">No announcements</h3>
          <p className="text-white/40 mt-2">You're all caught up!</p>
        </div>
      ) : (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {announcements.map((announcement: Announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "relative rounded-lg border p-4 backdrop-blur-sm transition-all duration-200",
                  announcement.emergency
                    ? "border-red-500/50 bg-gradient-to-r from-red-500/10 to-transparent hover:from-red-500/15"
                    : !announcement.isRead
                      ? "border-[#00C6FF]/30 bg-gradient-to-r from-[#00C6FF]/5 to-transparent"
                      : "border-white/10 bg-white/[0.02]"
                )}
              >
                {/* Emergency Badge */}
                {announcement.emergency && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                      <AlertTriangle className="h-3 w-3 text-red-400 animate-pulse" />
                      <span className="text-xs font-semibold text-red-400">EMERGENCY</span>
                    </div>
                  </div>
                )}

                {/* Unread indicator */}
                {!announcement.isRead && !announcement.emergency && (
                  <div className="absolute top-4 right-4">
                    <div className="h-3 w-3 rounded-full bg-[#00C6FF] animate-pulse" />
                  </div>
                )}

                <div className={announcement.emergency ? "mt-8" : ""}>
                  {/* Title */}
                  <h3 className="font-semibold text-white text-lg mb-2">
                    {announcement.title}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={cn("border", priorityColors[announcement.priority])}
                    >
                      {announcement.priority.charAt(0).toUpperCase() +
                        announcement.priority.slice(1)}
                    </Badge>
                    {announcement.requiresAcknowledgement && !announcement.isAcknowledged && (
                      <Badge variant="outline" className="border-orange-500/20 bg-orange-500/10 text-orange-400">
                        Requires Acknowledgement
                      </Badge>
                    )}
                    {announcement.isAcknowledged && (
                      <Badge
                        variant="outline"
                        className="border-green-500/20 bg-green-500/10 text-green-400 gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>

                  {/* Author and Date */}
                  <p className="text-xs text-white/60 mb-4">
                    From {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString()}
                    {announcement.expiresAt && (
                      <>
                        {" "}
                        • Expires {new Date(announcement.expiresAt).toLocaleDateString()}
                      </>
                    )}
                  </p>

                  {/* Body Preview */}
                  <p className="text-white/80 mb-4 line-clamp-2">{announcement.body}</p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        if (!announcement.isRead) {
                          readMutation.mutate(announcement.id);
                        }
                        if (announcement.requiresAcknowledgement && !announcement.isAcknowledged) {
                          setShowAcknowledgementModal(true);
                        }
                      }}
                      disabled={readMutation.isPending}
                      className="gap-2"
                    >
                      {announcement.isRead ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Read
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Mark as Read
                        </>
                      )}
                    </Button>

                    {announcement.requiresAcknowledgement && !announcement.isAcknowledged && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setShowAcknowledgementModal(true);
                        }}
                        className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-600/20"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Acknowledgement Modal */}
      {selectedAnnouncement && (
        <AnnouncementAcknowledgement
          isOpen={showAcknowledgementModal}
          onClose={() => setShowAcknowledgementModal(false)}
          announcement={selectedAnnouncement}
          request={fetchJson}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcements`] });
            queryClient.invalidateQueries({ queryKey: [`${cacheScope}-announcement-unread`] });
            queryClient.invalidateQueries({ queryKey: ["employee-announcement-unread"] });
            setShowAcknowledgementModal(false);
          }}
        />
      )}
    </div>
  );
}
