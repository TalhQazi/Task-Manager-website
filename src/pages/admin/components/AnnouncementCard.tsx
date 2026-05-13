import { motion } from "framer-motion";
import { Badge } from "@/components/admin/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  AlertCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Eye,
  Edit,
  Trash2,
  Archive,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  status: string;
  authorName: string;
  authorRole?: string;
  createdAt: string;
  expiresAt?: string;
  pinned: boolean;
  emergency: boolean;
  readPercentage: number;
  acknowledgedPercentage: number;
  targetSummary: string;
  attachments?: any[];
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onView: () => void;
  onEdit: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColors = {
  draft: "bg-gray-500/10 text-gray-400",
  scheduled: "bg-purple-500/10 text-purple-400",
  active: "bg-green-500/10 text-green-400",
  expired: "bg-red-500/10 text-red-400",
  archived: "bg-gray-500/10 text-gray-400",
};

export default function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onPin,
  onArchive,
  onDelete,
}: AnnouncementCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-lg border p-4 backdrop-blur-sm transition-all duration-200",
        announcement.emergency
          ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent hover:border-red-500/50 hover:bg-gradient-to-br hover:from-red-500/10"
          : announcement.pinned
          ? "border-[#00C6FF]/30 bg-gradient-to-br from-[#00C6FF]/5 to-transparent hover:border-[#00C6FF]/50"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      )}
    >
      {/* Emergency badge */}
      {announcement.emergency && (
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="h-3 w-3 text-red-400 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">EMERGENCY</span>
          </div>
        </div>
      )}

      {/* Pinned indicator */}
      {announcement.pinned && (
        <Pin className="absolute top-2 right-2 h-4 w-4 text-[#00C6FF] fill-[#00C6FF]" />
      )}

      {/* Title */}
      <h3 className={cn(
        "font-semibold text-white line-clamp-2 mb-2",
        announcement.emergency ? "pt-6" : ""
      )}>
        {announcement.title}
      </h3>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge 
          variant="outline"
          className={cn("border", priorityColors[announcement.priority])}
        >
          {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
        </Badge>
        <Badge 
          variant="outline"
          className={statusColors[announcement.status as keyof typeof statusColors]}
        >
          {announcement.status}
        </Badge>
      </div>

      {/* Author, role, and date */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/50">
          By {announcement.authorName}
          {announcement.authorRole && ` (${announcement.authorRole})`}
        </p>
        <p className="text-xs text-white/50">
          {new Date(announcement.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Expiration date and attachments */}
      {(announcement.expiresAt || announcement.attachments?.length) && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
          {announcement.expiresAt && (
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Calendar className="h-3 w-3" />
              Expires {new Date(announcement.expiresAt).toLocaleDateString()}
            </div>
          )}
          {announcement.attachments?.length ? (
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Paperclip className="h-3 w-3" />
              {announcement.attachments.length} file{announcement.attachments.length > 1 ? 's' : ''}
            </div>
          ) : null}
        </div>
      )}

      {/* Target summary */}
      <p className="text-sm text-white/60 mb-4 line-clamp-1">
        <Users className="inline h-3.5 w-3.5 mr-1" />
        {announcement.targetSummary}
      </p>

      {/* Analytics */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="rounded bg-white/5 p-2">
          <div className="text-white/60">Read</div>
          <div className="text-sm font-semibold text-[#00C6FF]">
            {announcement.readPercentage}%
          </div>
        </div>
        <div className="rounded bg-white/5 p-2">
          <div className="text-white/60">Acknowledged</div>
          <div className="text-sm font-semibold text-green-400">
            {announcement.acknowledgedPercentage}%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all duration-150"
        >
          <TrendingUp className="h-4 w-4" />
          Analytics
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded hover:bg-white/10 text-white/60 hover:text-white transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPin} className="gap-2">
              {announcement.pinned ? (
                <>
                  <PinOff className="h-4 w-4" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive} className="gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-400 focus:text-red-400">
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
