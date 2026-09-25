import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import { toast } from "@/components/admin/ui/use-toast";
import {
  Plus,
  Search,
  Bell,
  Megaphone,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Pin,
  PinOff,
  TrendingUp,
  Users,
  Loader2,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { getAnnouncementWebSocket } from "@/lib/announcementWebSocket";
import AnnouncementModal from "./components/AnnouncementModal";
import AnnouncementCard from "./components/AnnouncementCard";
import AnnouncementAnalytics from "./components/AnnouncementAnalytics";
import AnnouncementAcknowledgement from "./components/AnnouncementAcknowledgement";

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  status: "draft" | "scheduled" | "active" | "expired" | "archived";
  authorName: string;
  authorRole: string;
  createdAt: string;
  expiresAt?: string;
  pinned: boolean;
  emergency: boolean;
  requiresAcknowledgement: boolean;
  readPercentage: number;
  acknowledgedPercentage: number;
  targetSummary: string;
  isRead: boolean;
  isAcknowledged: boolean;
}

export default function Announcements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") || "all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAuthor, setFilterAuthor] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const auth = getAuthState();
  const isAdmin = ["super-admin", "admin", "manager", "team-lead"].includes(auth.role || "");
  const queryClient = useQueryClient();

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAdmin) return;

    const ws = getAnnouncementWebSocket();
    ws.connect({
      onNewAnnouncement: () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
        toast({
          title: "New Announcement",
          description: "A new announcement has been published",
        });
      },
      onAnnouncementPublished: () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      },
      onAnnouncementUpdated: () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      },
      onAnnouncementDeleted: () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      },
      onAnnouncementExpired: () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      },
    });

    return () => {
      // Optionally disconnect on unmount, but keep connected for other pages
      // ws.disconnect();
    };
  }, [isAdmin, queryClient]);

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ["announcements", tab, page, filterPriority, filterCategory, filterAuthor, filterDateFrom, filterDateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterPriority && filterPriority !== "all") params.append("priority", filterPriority);
      if (filterCategory && filterCategory !== "all") params.append("category", filterCategory);
      if (filterAuthor) params.append("author", filterAuthor);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);
      
      return apiFetch<any>(`/api/announcements?${params.toString()}`);
    },
    enabled: isAdmin,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<any>(`/api/announcements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  // Pin mutation
  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      return apiFetch<any>(`/api/announcements/${id}/pin`, {
        method: "POST",
        body: JSON.stringify({ pinned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<any>(`/api/announcements/${id}/archive`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Success",
        description: "Announcement archived",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-white">Access Denied</h1>
          <p className="text-white/60 mt-2">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  const announcements = announcementsData?.items || [];
  const total = announcementsData?.total || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-[#00C6FF]" />
            Announcements
          </h1>
          <p className="text-white/60 mt-1">Manage company announcements and communications</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:shadow-lg hover:shadow-[#00C6FF]/20"
        >
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Tabs and Filters */}
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(newTab) => {
          setTab(newTab);
          setPage(1);
          setSearchParams({ tab: newTab });
        }}>
          <TabsList className="bg-white/[0.05] border border-white/10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-white/70 mb-1 block">Priority</label>
            <Select value={filterPriority} onValueChange={(val) => {
              setFilterPriority(val);
              setPage(1);
            }}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-white/70 mb-1 block">Category</label>
            <Select value={filterCategory} onValueChange={(val) => {
              setFilterCategory(val);
              setPage(1);
            }}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-white/70 mb-1 block">Author</label>
            <Input 
              placeholder="Filter by author"
              value={filterAuthor}
              onChange={(e) => {
                setFilterAuthor(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-white/70 mb-1 block">From Date</label>
            <Input 
              type="date"
              value={filterDateFrom}
              onChange={(e) => {
                setFilterDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-white/70 mb-1 block">To Date</label>
            <Input 
              type="date"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 border-white/10"
            />
          </div>

          {(filterPriority !== "all" || filterCategory !== "all" || filterAuthor || filterDateFrom || filterDateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterPriority("all");
                setFilterCategory("all");
                setFilterAuthor("");
                setFilterDateFrom("");
                setFilterDateTo("");
                setPage(1);
              }}
              className="gap-1.5"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Announcements Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#00C6FF]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] py-12">
          <Bell className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-semibold text-white/60">No announcements yet</h3>
          <p className="text-white/40 mt-2">Create your first announcement to get started</p>
        </div>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {announcements.map((announcement: Announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onView={() => {
                  setSelectedAnnouncement(announcement);
                  setShowAnalyticsModal(true);
                }}
                onEdit={() => {
                  setSelectedAnnouncement(announcement);
                  setShowCreateModal(true);
                }}
                onPin={() =>
                  pinMutation.mutate({ id: announcement.id, pinned: !announcement.pinned })
                }
                onArchive={() => archiveMutation.mutate(announcement.id)}
                onDelete={() => setDeleteId(announcement.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-white/60">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnnouncementModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedAnnouncement(null);
        }}
        announcement={selectedAnnouncement || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
          setShowCreateModal(false);
          setSelectedAnnouncement(null);
        }}
        onDelete={(id) => setDeleteId(id)}
      />

      {/* Analytics Modal */}
      {selectedAnnouncement && (
        <AnnouncementAnalytics
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          announcementId={selectedAnnouncement.id}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement and all related data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Acknowledgement Modal for Emergency Alerts */}
      {selectedAnnouncement && (
        <AnnouncementAcknowledgement
          isOpen={showAcknowledgementModal}
          onClose={() => setShowAcknowledgementModal(false)}
          announcement={selectedAnnouncement}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
          }}
        />
      )}
    </div>
  );
}
