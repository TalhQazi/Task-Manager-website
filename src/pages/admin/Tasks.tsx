import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import CostManager from "@/components/cost-manager/CostManager";
import TaskExpensesPanel from "@/components/cost-manager/TaskExpensesPanel";
import { AsanaQuickAddBar } from "@/components/tasks/AsanaQuickAddBar";
import { AsanaTaskDrawer } from "@/components/tasks/AsanaTaskDrawer";
import { getProjectCostSheet, getTaskCostSheet } from "@/lib/costManager";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/admin/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/admin/ui/command";
import { Textarea } from "@/components/admin/ui/textarea";
import { toast } from "@/components/admin/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  MapPin,
  FileText,
  Printer,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Users,
  User,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  Archive,
  Send,
  RefreshCw,
  UserCog,
  Paperclip,
  MessageSquare,
  Download,
  Maximize2,
  Smile,
  Flame,
  Image as ImageIcon,
  Video,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/admin/utils";
import { apiFetch, downloadTaskAttachment, toProxiedUrl, downloadViaUrl } from "@/lib/admin/apiClient";
import { resizeImageIfNeeded } from "@/lib/imageResizer";
import { getAuthState } from "@/lib/auth";
import { ROLE_GROUPS } from "@/constants/roles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { useSocket } from "@/contexts/SocketContext";
import { Pagination } from "@/components/Pagination";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import AssetLibraryPicker from "@/components/admin/AssetLibraryPicker";
import { TaskContributors } from "@/components/admin/tasks/TaskContributors";
import DropboxFilePicker, { type DropboxSelectedFile, formatBytes, DropboxIcon } from "@/components/admin/DropboxFilePicker";
import { useRewards } from "@/contexts/RewardContext";
import FollowUpControlCenter from "@/components/shared/FollowUpControlCenter";
import { VideoRecorderModal } from "@/components/admin/VideoRecorderModal";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { TaskTimeline } from "@/components/shared/TaskTimeline";
import { renderMessageContent } from "@/lib/linkify";

function ProjectLogoImg({ projectId, projectName, logoUrl }: { projectId: string; projectName: string; logoUrl?: string }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If logoUrl is a real URL (S3 or data:), use it directly
    if (logoUrl && logoUrl.length > 0) {
      setSrc(toProxiedUrl(logoUrl) || logoUrl);
      setError(false);
      return;
    }
    
    // logoUrl is undefined or empty string — fetch from dedicated endpoint
    // Empty string means the list API stripped a base64 value stored in MongoDB
    let cancelled = false;
    setSrc(undefined);

    apiFetch<{ logo: { url: string } }>(`/api/projects/${encodeURIComponent(projectId)}/logo`)
      .then(d => { 
        if (!cancelled) {
          setSrc(toProxiedUrl(d.logo?.url) || null);
          setError(false);
        }
      })
      .catch(() => { 
        if (!cancelled) {
          setSrc(null);
          setError(true);
        }
      });
    return () => { cancelled = true; };
  }, [projectId, logoUrl]);

  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={`${projectName} logo`} 
        className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-border" 
        onError={() => setError(true)}
      />
    );
  }

  if (src === undefined) {
    return <div className="w-10 h-10 rounded-md bg-muted/40 animate-pulse flex-shrink-0" />;
  }

  return (
    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0 border border-primary/20 uppercase">
      {projectName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ProjectLogoImgLarge({ projectId, projectName, logoUrl }: { projectId: string; projectName: string; logoUrl?: string }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (logoUrl && logoUrl.length > 0) {
      setSrc(toProxiedUrl(logoUrl) || logoUrl);
      setError(false);
      return;
    }
    let cancelled = false;
    setSrc(undefined);

    apiFetch<{ logo: { url: string } }>(`/api/projects/${encodeURIComponent(projectId)}/logo`)
      .then(d => { 
        if (!cancelled) {
          setSrc(toProxiedUrl(d.logo?.url) || null);
          setError(false);
        }
      })
      .catch(() => { 
        if (!cancelled) {
          setSrc(null);
          setError(true);
        }
      });
    return () => { cancelled = true; };
  }, [projectId, logoUrl]);

  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={`${projectName} logo`} 
        className="w-full h-full object-cover rounded-xl border border-border" 
        onError={() => setError(true)}
      />
    );
  }

  if (src === undefined) {
    return <div className="w-full h-full bg-muted/40 animate-pulse rounded-xl" />;
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white uppercase rounded-xl">
      {projectName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TaskAttachmentImg({ taskId, attachmentUrl, onPreview }: { taskId: string; attachmentUrl?: string; onPreview?: (url: string, fileName: string) => void }) {
  const [src, setSrc] = useState<string | null | undefined>(toProxiedUrl(attachmentUrl) || undefined);
  
  useEffect(() => {
    // If attachmentUrl is a real URL (S3 or data:), use it directly
    if (attachmentUrl && attachmentUrl.length > 0) {
      setSrc(toProxiedUrl(attachmentUrl) || attachmentUrl);
      return;
    }
    
    // attachmentUrl is undefined or empty string — fetch from dedicated endpoint
    let cancelled = false;
    apiFetch<{ attachment: { url: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/attachment`)
      .then(d => { if (!cancelled) setSrc(toProxiedUrl(d.attachment?.url) || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId, attachmentUrl]);

  if (src) return (
    <div className="w-full h-full relative group/task-att cursor-zoom-in" onClick={() => onPreview?.(src, "Task Attachment")}>
      <img src={src} alt="Task preview" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/task-att:opacity-100 flex items-center justify-center transition-all duration-200">
        <Maximize2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
  if (src === undefined) return <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin opacity-20" /></div>;
  return null;
}

function CommentAttachmentImg({ taskId, commentId, index, mimeType, fileName, fallbackUrl, onPreview }: { taskId: string; commentId: string; index: number; mimeType: string; fileName: string; fallbackUrl?: string; onPreview?: (url: string, name: string) => void }) {
  const [src, setSrc] = useState<string | null | undefined>(toProxiedUrl(fallbackUrl) || undefined);
  useEffect(() => {
    if (fallbackUrl) return; 
    let cancelled = false;
    apiFetch<{ attachment: { url: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}/attachments/${index}`)
      .then(d => { if (!cancelled) setSrc(toProxiedUrl(d.attachment?.url) || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId, commentId, index, fallbackUrl]);
  
  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-auto flex justify-center relative group/att cursor-zoom-in" onClick={() => onPreview?.(src, fileName)}>
      <img src={src} alt={fileName} className="w-full h-auto max-h-[180px] object-contain rounded-lg" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-all duration-200 rounded-lg">
        <Maximize2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
  if (src && (mimeType?.startsWith("video/") || fileName.match(/\.(webm|mp4|mov)$/i))) return (
    <div className="w-full h-auto flex justify-center relative rounded-lg bg-black/40 overflow-hidden">
      <video src={src} controls className="w-full h-auto max-h-[180px] rounded-lg" />
    </div>
  );
  if (src && !mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/att">
      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-white/10">
        <FileText className="w-6 h-6 text-white/60 mb-1" />
        <span className="text-[10px] text-white/40 truncate w-full px-2 font-medium">{fileName}</span>
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-[1px] cursor-default">
        <button 
          onClick={(e) => { e.stopPropagation(); onPreview?.(src, fileName); }}
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); void downloadViaUrl(src, fileName); }} 
          aria-label="Download" 
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
  if (src === undefined) return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><Loader2 className="h-4 w-4 animate-spin opacity-20" /></div>;
  return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><AlertCircle className="w-5 h-5 text-destructive/50" /></div>;
}

function TaskAttachmentItem({ attachment, onPreview }: { attachment: { fileName: string; url: string; mimeType?: string }; onPreview: (url: string, fileName: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const isImage = attachment.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(attachment.fileName || "");
  const imageUrl = toProxiedUrl(attachment.url) || attachment.url;
  
  if (isImage && !imgError && attachment.url) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-border/60 bg-background shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" onClick={() => onPreview(imageUrl, attachment.fileName || "Attachment")}>
        <img 
          src={imageUrl} 
          alt={attachment.fileName || "Attachment"} 
          className="w-full h-24 object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  
  return (
    <div className="w-full h-24 flex items-center justify-center bg-muted/40 rounded-lg border border-border/60">
      <FileText className="h-8 w-8 text-muted-foreground/60" />
    </div>
  );
}

// ... (all your interfaces and types remain exactly the same)
interface Task {
  id: string;
  taskNumber?: number;
  title: string;
  description: string;
  assignees: string[];
  assignee?: string;
  teamLead?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  dueTime?: string;
  location?: string;
  createdAt: string;
  projectId?: string;
  attachmentFileName?: string;
  attachmentNote?: string;
  dropboxAttachmentCount?: number;
  executionPriority?: number | null;
  introVideoUrl?: string;
  startedAt?: string | null;
  firstStartedAt?: string | null;
  startedByName?: string;
  completedAt?: string | null;
  completedByName?: string;
  attachment?: {
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  };
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
}

type CreateProjectTaskDraft = {
  title: string;
  description: string;
  assignees: string[];
  priority: Task["priority"];
  status: Task["status"];
  dueDate: string;
  dueTime?: string;
  location?: string;
  createdAt: string;
  attachmentFileName?: string;
  attachmentNote?: string;
  attachment?: {
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  };
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

type CreateProjectPayload = {
  name: string;
  description: string;
  assignees?: string[];
  logo?: ProjectLogo;
  introVideoUrl?: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  tasks: Array<Omit<CreateProjectTaskDraft, "location">>;
};

interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  role?: string;
  department?: string;
  avatarUrl?: string;
  avatarDataUrl?: string;
  status: "active" | "inactive" | "on-leave";
}

type TaskComment = {
  id: string;
  taskId: string;
  message: string;
  authorUsername: string;
  authorFullName?: string;
  authorAvatar?: string;
  authorRole?: string;
  createdAt: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt?: string;
  }>;
  reactions?: Array<{
    emoji: string;
    userId: string;
    username: string;
    fullName?: string;
    createdAt?: string;
  }>;
};

type TaskApi = Omit<Task, "id"> & {
  _id: string;
};

type TaskApiAttachmentFields = {
  attachmentFileName?: string;
  attachmentNote?: string;
  attachment?: Task["attachment"];
};

interface ProjectLogo {
  fileName?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdByUsername?: string;
  createdAt?: string;
  assignees?: string[];
  teamLead?: string;
  logo?: ProjectLogo;
  taskCount?: number;
  status?: string;
  introVideoUrl?: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  taskAttachmentStats?: { images: number; files: number };
}

interface ProjectWithTasks extends Project {
  tasks: Task[];
  taskCount?: number;
  status?: string;
}

function normalizeTask(t: any): Task {
  const legacyAssignee = typeof t.assignee === "string" ? t.assignee.trim() : "";
  const assignees = Array.isArray(t.assignees)
    ? t.assignees.filter((s: any) => typeof s === "string" && s.trim())
    : legacyAssignee
      ? [legacyAssignee]
      : [];
  const extra = t as TaskApiAttachmentFields;
  return {
    id: t._id || t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    description: t.description,
    assignees,
    teamLead: t.teamLead || "",
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    location: t.location,
    createdAt: t.createdAt,
    attachmentFileName: extra.attachmentFileName,
    attachmentNote: extra.attachmentNote,
    attachment: extra.attachment,
    attachments: Array.isArray((t as any).attachments) ? (t as any).attachments : undefined,
    dropboxAttachmentCount: t.dropboxAttachmentCount,
    executionPriority: t.executionPriority ?? null,
    introVideoUrl: t.introVideoUrl,
    startedAt: t.startedAt ?? null,
    firstStartedAt: t.firstStartedAt ?? null,
    startedByName: t.startedByName,
    completedAt: t.completedAt ?? null,
    completedByName: t.completedByName,
  };
}

function getAttachmentCounts(attachments?: any[], attachment?: any) {
  const allAttachments = Array.isArray(attachments) ? [...attachments] : [];
  if (attachment && attachment.url && !allAttachments.some(a => a.url === attachment.url)) {
    allAttachments.push(attachment);
  }
  
  const images = allAttachments.filter(a => a.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.fileName || "")).length;
  const files = allAttachments.length - images;
  
  return { images, files };
}

function renderMessageWithMentions(text: string) {
  if (!text) return null;
  // Split by mentions that start with @ and don't contain spaces
  const parts = text.split(/(\s+|@\S+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span key={i} className="text-primary font-medium bg-primary/10 px-1 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors">
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{renderMessageContent(part)}</React.Fragment>;
      })}
    </>
  );
}

function isImageFile(file: File) {
  const t = String(file.type || "").toLowerCase();
  return t.startsWith("image/");
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Invalid image"));
    i.src = dataUrl;
  });

  const maxW = 1600;
  const maxH = 1600;
  const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);

  const quality = 0.75;
  const mime = "image/jpeg";
  return canvas.toDataURL(mime, quality);
}

async function filesToAttachments(files: File[]) {
  const results = await Promise.all(
    files.map(
      async (file) => {
        let url = "";
        if (isImageFile(file)) {
          try {
            url = await compressImageToDataUrl(file);
          } catch (e) {
            console.error("Compression failed, using raw data URL", e);
            url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = () => reject(new Error("Failed to read file"));
              reader.readAsDataURL(file);
            });
          }
        } else {
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });
        }
        
        return {
          fileName: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        };
      }
    ),
  );

  return results;
}

const priorityClasses = {
  high: "bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border-destructive/20",
  medium: "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-600 border-green-500/20",
};

const statusClasses = {
  pending: "bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-600 border-blue-500/20",
  "in-progress": "bg-gradient-to-r from-amber-500/20 to-yellow-400/10 text-amber-600 border-amber-500/20",
  completed: "bg-gradient-to-r from-green-500/20 to-emerald-400/10 text-green-600 border-green-500/20",
  overdue: "bg-gradient-to-r from-red-500/20 to-rose-400/10 text-red-600 border-red-500/20",
};

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in-progress", "completed", "overdue"]),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  location: z.string().optional(),
  assignees: z.array(z.string()).optional().default([]),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

export default function Tasks() {
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [costManagerModalOpen, setCostManagerModalOpen] = useState(false);
  const [costManagerModalSheetId, setCostManagerModalSheetId] = useState<string | null>(null);
  const [costManagerModalSheetName, setCostManagerModalSheetName] = useState("");
  const activeTab = searchParams.get("tab") || "all";
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectTaskSearchQuery, setProjectTaskSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectPage, setProjectPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [projectTaskPage, setProjectTaskPage] = useState(1);
  const PAGE_SIZE = 25;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIntroVideoUrl, setProjectIntroVideoUrl] = useState("");
  const [projectLogoFile, setProjectLogoFile] = useState<File | null>(null);
  const [projectLogoPreview, setProjectLogoPreview] = useState<string>("");
  const [projectAttachmentFiles, setProjectAttachmentFiles] = useState<File[]>([]);
  const [projectAttachmentPreviews, setProjectAttachmentPreviews] = useState<string[]>([]);
  const [projectTasks, setProjectTasks] = useState<CreateProjectTaskDraft[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentFilePreviews, setAttachmentFilePreviews] = useState<string[]>([]);
  const [attachmentNoteDraft, setAttachmentNoteDraft] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ projectName?: string; title?: string; description?: string }>({});
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [editAssigneesOpen, setEditAssigneesOpen] = useState(false);
  const [projectCreationAssignees, setProjectCreationAssignees] = useState<string[]>([]);
  const [projectCreationAssigneesOpen, setProjectCreationAssigneesOpen] = useState(false);
  const [projectTeamLead, setProjectTeamLead] = useState("");
  const [projectTeamLeadPopoverOpen, setProjectTeamLeadPopoverOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isDirectTask, setIsDirectTask] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [editSelectedAssignees, setEditSelectedAssignees] = useState<string[]>([]);
  const [openReactionPopoverId, setOpenReactionPopoverId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  useEffect(() => {
    setAssigneeFilter("all");
  }, [selectedProject?.id]);
  const [taskTeamLead, setTaskTeamLead] = useState("");
  const [taskTeamLeadPopoverOpen, setTaskTeamLeadPopoverOpen] = useState(false);
  const [editTaskTeamLead, setEditTaskTeamLead] = useState("");
  const [editTaskTeamLeadPopoverOpen, setEditTaskTeamLeadPopoverOpen] = useState(false);
  const [editTaskFile, setEditTaskFile] = useState<File | null>(null);
  const [editTaskFilePreview, setEditTaskFilePreview] = useState<string | null>(null);
  const [editTaskFiles, setEditTaskFiles] = useState<File[]>([]);
  const [editTaskFilePreviews, setEditTaskFilePreviews] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Project edit/delete states
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectIntroVideoUrl, setEditProjectIntroVideoUrl] = useState("");
  const [editProjectLogoFile, setEditProjectLogoFile] = useState<File | null>(null);
  const [editProjectLogoPreview, setEditProjectLogoPreview] = useState<string>("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Reassign states
  const [isReassignTaskOpen, setIsReassignTaskOpen] = useState(false);
  const [isReassignProjectOpen, setIsReassignProjectOpen] = useState(false);
  const [reassigningTask, setReassigningTask] = useState<Task | null>(null);
  const [reassigningProject, setReassigningProject] = useState<Project | null>(null);
  const [reassignTaskAssignees, setReassignTaskAssignees] = useState<string[]>([]);
  const [reassignProjectAssignees, setReassignProjectAssignees] = useState<string[]>([]);
  const [isReassigningTask, setIsReassigningTask] = useState(false);
  const [isReassigningProject, setIsReassigningProject] = useState(false);
  const [reassignTaskOpen, setReassignTaskOpen] = useState(false);
  const [reassignProjectOpen, setReassignProjectOpen] = useState(false);

  // Execution Priority Mode states
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);
  const [viewByPriority, setViewByPriority] = useState(false);
  const [assigningPriority, setAssigningPriority] = useState(false);
  const [isAsanaDrawerOpen, setIsAsanaDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  const currentUsername = getAuthState().username || "";
  const currentRole = getAuthState().role || "";
  const isAdminRole = currentRole === "admin" || currentRole === "super-admin";
  const [archivingCommentId, setArchivingCommentId] = useState<string | null>(null);
  const [archivingAttachment, setArchivingAttachment] = useState<number | null>(null);

  // Dropbox integration state
  const [isDropboxPickerOpen, setIsDropboxPickerOpen] = useState(false);
  const [dropboxPickerTarget, setDropboxPickerTarget] = useState<"task" | "project" | "task-comment" | "project-comment">("task");
  const [dropboxSelectedFiles, setDropboxSelectedFiles] = useState<DropboxSelectedFile[]>([]);
  const [projectDropboxSelectedFiles, setProjectDropboxSelectedFiles] = useState<DropboxSelectedFile[]>([]);
  const [viewDropboxAttachments, setViewDropboxAttachments] = useState<Array<{ id: string; file_name: string; file_type: string; file_size: number; dropbox_path: string; temporary_link: string; created_at: string }>>([]);
  const [loadingDropboxAttachments, setLoadingDropboxAttachments] = useState(false);
  const [dropboxAttachmentsError, setDropboxAttachmentsError] = useState<string | null>(null);
  
  // Lightbox / File Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  // Gallery navigation for the preview dialog: browse sibling images without closing it
  const [previewGallery, setPreviewGallery] = useState<Array<{ url: string; name: string }>>([]);
  const [previewIdx, setPreviewIdx] = useState(0);

  const openImagePreview = (url: string, name: string, gallery?: Array<{ url: string; name: string }>) => {
    setPreviewUrl(url);
    setPreviewName(name);
    if (gallery && gallery.length > 1) {
      let idx = gallery.findIndex((g) => g.url === url);
      if (idx < 0) idx = gallery.findIndex((g) => g.name === name);
      setPreviewGallery(gallery);
      setPreviewIdx(idx >= 0 ? idx : 0);
    } else {
      setPreviewGallery([]);
      setPreviewIdx(0);
    }
  };

  const stepPreview = useCallback((dir: 1 | -1) => {
    setPreviewIdx((prev) => {
      if (previewGallery.length < 2) return prev;
      const next = (prev + dir + previewGallery.length) % previewGallery.length;
      setPreviewUrl(previewGallery[next].url);
      setPreviewName(previewGallery[next].name);
      return next;
    });
  }, [previewGallery]);

  // Arrow-key navigation while the preview is open
  useEffect(() => {
    if (!previewUrl || previewGallery.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); stepPreview(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stepPreview(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl, previewGallery, stepPreview]);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);

  // Asset Library Picker states
  const [isProjectLogoPickerOpen, setIsProjectLogoPickerOpen] = useState(false);
  const [isEditProjectLogoPickerOpen, setIsEditProjectLogoPickerOpen] = useState(false);
  const [isEditTaskLogoPickerOpen, setIsEditTaskLogoPickerOpen] = useState(false);

  // Inline editing states for View Dialog
  const [taskViewTitle, setTaskViewTitle] = useState("");
  const [taskViewDesc, setTaskViewDesc] = useState("");
  const [taskViewEdited, setTaskViewEdited] = useState(false);

  // Inline editing states for Project Header
  const [projectViewName, setProjectViewName] = useState("");
  const [projectViewDesc, setProjectViewDesc] = useState("");
  const [projectViewEdited, setProjectViewEdited] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  
  // Confirmation state for completing/archiving via side badge
  const [confirmCompleteTask, setConfirmCompleteTask] = useState<Task | null>(null);
  const [confirmArchiveCommentId, setConfirmArchiveCommentId] = useState<string | null>(null);
  const [confirmArchiveAttachmentIndex, setConfirmArchiveAttachmentIndex] = useState<number | null>(null);
  const [confirmDeleteProjectAttachmentIndex, setConfirmDeleteProjectAttachmentIndex] = useState<number | null>(null);
  const [deletingProjectAttachment, setDeletingProjectAttachment] = useState<number | null>(null);

  // Fetch tasks with server-side pagination
  const tasksQuery = useQuery({
    queryKey: ["tasks", taskPage, projectSearchQuery, statusFilter, priorityFilter, assignmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: taskPage.toString(),
        limit: PAGE_SIZE.toString(),
        search: projectSearchQuery,
        status: statusFilter,
        priority: priorityFilter,
        assignment: assignmentFilter,
        projectId: "none",
      });
      const res = await apiFetch<{ items: TaskApi[], totalPages: number, total: number }>(`/api/tasks?${params.toString()}`);
      return {
        items: res.items.map(normalizeTask),
        totalPages: res.totalPages || 1,
        totalItems: res.total || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // Fetch projects with server-side pagination
  const projectsQuery = useQuery({
    queryKey: ["projects", projectPage, projectSearchQuery, statusFilter, assignmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: projectPage.toString(),
        limit: PAGE_SIZE.toString(),
        search: projectSearchQuery,
        status: statusFilter,
        assignment: assignmentFilter,
      });
      const res = await apiFetch<{ items: Project[], totalPages: number, total: number }>(`/api/projects?${params.toString()}`);
      return {
        items: res.items,
        totalPages: res.totalPages || 1,
        totalItems: res.total || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    setProjectPage(1);
  }, [statusFilter, assignmentFilter]);

  useEffect(() => {
    if (tasksQuery.data) {
      setTasks(tasksQuery.data.items);
    }
  }, [tasksQuery.data]);

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data.items);
    }
  }, [projectsQuery.data]);

  const loadProject = async (projectId: string, partialProject?: Project) => {
    setProjectTaskSearchQuery(""); // Clear project-task search when opening a project
    try {
      setIsLoadingProject(true);
      if (partialProject) {
        // Only reset tasks if we are switching to a completely different project
        const currentTasks = selectedProject?.id === projectId ? selectedProject.tasks : [];
        setSelectedProject({ ...partialProject, tasks: currentTasks } as any);
      }
      setApiError(null);

      const res = await apiFetch<{ item: ProjectWithTasks }>(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!res.item) {
        throw new Error("Project not found");
      }

      const project = res.item;
      const projectTasks: Task[] = Array.isArray(project.tasks) 
        ? project.tasks.map(t => normalizeTask(t))
        : [];

      setSelectedProject({ ...project, tasks: projectTasks });
      setProjectViewName(project.name);
      setProjectViewDesc(project.description || "");
      setProjectViewEdited(false);
    } catch (err) {
      toast({ title: "Failed to load project", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
      if (!partialProject) {
        setSelectedProject(null);
      }
    } finally {
      setIsLoadingProject(false);
    }
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    const searchVal = String(searchParams.get("search") || "").trim();

    if (searchVal) {
      setProjectSearchQuery(searchVal);
      const next = new URLSearchParams(searchParams);
      next.delete("search");
      setSearchParams(next, { replace: true });
    }

    if (!viewId) return;
    if (isViewOpen || isEditOpen || isDeleteOpen || isCreateOpen) return;

    const match = tasks.find((t) => String(t.id) === viewId);
    if (match) {
      openView(match);
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next, { replace: true });
    } else {
      // Fetch specifically if not in list
      apiFetch<{ item: TaskApi }>(`/api/tasks/${encodeURIComponent(viewId)}`)
        .then(res => {
          if (res.item) {
            openView(normalizeTask(res.item));
            const next = new URLSearchParams(searchParams);
            next.delete("view");
            setSearchParams(next, { replace: true });
          }
        })
        .catch(err => console.error("Failed to fetch task for view:", err));
    }
  }, [tasks, searchParams, setSearchParams, isViewOpen, isEditOpen, isDeleteOpen, isCreateOpen]);

  // Fetch employees for mentions and assignees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await apiFetch<{ items: any[] }>("/api/employees");
        const list = (res.items || []).map(u => {
          const avatar = u.avatarUrl || u.avatarDataUrl || "";
          return {
            id: String(u.id || u._id),
            name: u.name,
            email: u.email || "",
            role: u.role || u.userRole || "",
            department: u.department || "",
            avatarUrl: avatar ? (toProxiedUrl(avatar) || avatar) : "",
            avatarDataUrl: avatar ? (toProxiedUrl(avatar) || avatar) : "",
            status: (u.status || "active") as Employee["status"],
            initials: u.initials || (u.name || "??")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)
          };
        });

        // Ensure current user is in the list of assignees for selection
        const auth = getAuthState();
        const myUsername = auth.username || "";
        if (myUsername && !list.find(e => e.name.toLowerCase() === myUsername.toLowerCase() || e.email.toLowerCase() === myUsername.toLowerCase())) {
          list.push({
            id: "me",
            name: myUsername,
            initials: myUsername.substring(0, 2).toUpperCase(),
            status: "active",
            email: myUsername,
            role: "",
            department: ""
          } as any);
        }

        setEmployees(list);
      } catch (err) {
        console.error("Failed to load employees:", err);
        setEmployees([]);
      }
    };
    void loadEmployees();
  }, []);

  const activeEmployees = useMemo(() => {
    return employees.filter((e) => {
      const s = String(e.status || "active").toLowerCase();
      return s !== "inactive";
    });
  }, [employees]);

  // Real-time task comments via socket
  useEffect(() => {
    if (!socket || !selectedTask) return;
    const taskId = selectedTask.id;

    socket.emit("join-task", taskId);

    const handleConnect = () => socket.emit("join-task", taskId);
    socket.on("connect", handleConnect);

    const handleNewComment = (comment: TaskComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    };
    socket.on("new-comment", handleNewComment);

    const handleTyping = ({ username, typing, taskId: tId }: { username: string; typing: boolean; taskId?: string }) => {
      if (username === currentUsername) return;
      if (tId !== selectedTask?.id) return;
      setOthersTyping(prev => {
        if (typing) return prev.includes(username) ? prev : [...prev, username];
        return prev.filter(u => u !== username);
      });
    };

    socket.on("typing", handleTyping);

    const handleReactionUpdated = ({ commentId, reactions }: { commentId: string; reactions: any[] }) => {
      setComments((prev) => prev.map(c => c.id === commentId ? { ...c, reactions } : c));
    };

    socket.on("comment-reaction-updated", handleReactionUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new-comment", handleNewComment);
      socket.off("typing", handleTyping);
      socket.off("comment-reaction-updated", handleReactionUpdated);
      socket.emit("leave-task", taskId);
    };
  }, [socket, selectedTask?.id, currentUsername]);

  useEffect(() => {
    if (isCreateOpen) {
      setFormData((prev) => ({ ...prev, dueDate: "" }));
    }
  }, [isCreateOpen]);

  // Admin-style form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "pending" as Task["status"],
    dueDate: "",
    dueTime: "",
    location: "",
    attachmentFileName: "",
    attachmentNote: "",
    introVideoUrl: "",
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Task> }) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return normalizeTask(res.item);
    },
    onSuccess: (updatedTask) => {
      // Invalidate both paginated tasks and general projects
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      
      // Only update local project state if we actually have a project selected and IDs match
      if (selectedProject && updatedTask.projectId && selectedProject.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ ok: true }>(`/api/tasks/${id}/archive`, { method: "POST" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const res = await apiFetch<any>(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProject) {
        setSelectedProject({ ...selectedProject, status: selectedProject.status });
      }
    },
  });

  const editProjectMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Project> }) => {
      const res = await apiFetch<{ item: Project }>(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return res.item;
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProject && selectedProject.id === updated.id) {
        setSelectedProject({ ...selectedProject, ...updated });
      }
    },
    onError: (err) => {
      console.error("Project update error details:", err);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ success: boolean }>(`/api/projects/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (selectedProject && editingProject && selectedProject.id === editingProject.id) {
        setSelectedProject(null);
      }
    },
  });

  // Reassign mutations - optimized to not refetch all data
  const reassignTaskMutation = useMutation({
    mutationFn: async ({ id, assignees }: { id: string; assignees: string[] }) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}/reassign`, {
        method: "PUT",
        body: JSON.stringify({ assignees }),
      });
      return normalizeTask(res.item);
    },
    onSuccess: (updatedTask) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Synchronize state immediately
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      
      // Explicit check to avoid null pointer when updatedTask.projectId is undefined/null
      if (selectedProject && updatedTask.projectId && selectedProject.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
    },
  });

  const reassignProjectMutation = useMutation({
    mutationFn: async ({ id, assignees }: { id: string; assignees: string[] }) => {
      const res = await apiFetch<{ item: Project }>(`/api/projects/${id}/reassign`, {
        method: "PUT",
        body: JSON.stringify({ assignees }),
      });
      return res.item;
    },
    onSuccess: (updatedProject) => {
      // Update cache directly instead of refetching
      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      });
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject({ ...selectedProject, ...updatedProject });
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // Execution Priority mutations
  const assignPriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}/priority`, {
        method: "POST",
        body: JSON.stringify({ executionPriority: priority }),
      });
      return normalizeTask(res.item);
    },
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"], type: "all" });
      await queryClient.cancelQueries({ queryKey: ["projects"], type: "all" });

      const previousTasksQueries = queryClient.getQueriesData<{ items: Task[]; totalPages: number; totalItems: number }>({
        queryKey: ["tasks"],
      });

      const optimisticUpdate = (t: Task) => (t.id === id ? { ...t, executionPriority: priority } : t);

      queryClient.setQueriesData<{ items: Task[]; totalPages: number; totalItems: number }>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return { ...old, items: old.items.map(optimisticUpdate) };
      });

      if (selectedProject) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(optimisticUpdate),
        });
      }

      if (selectedTask?.id === id) {
        setSelectedTask({ ...selectedTask, executionPriority: priority });
      }

      return { previousTasksQueries };
    },
    onSuccess: (updatedTask) => {
      // Invalidate all tasks queries (including paginated ones)
      queryClient.invalidateQueries({ queryKey: ["tasks"], type: "all" });
      queryClient.invalidateQueries({ queryKey: ["projects"], type: "all" });
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      if (selectedProject && updatedTask.projectId && selectedProject.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasksQueries) {
        for (const [key, data] of ctx.previousTasksQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
  });

  const removePriorityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}/priority`, {
        method: "DELETE",
      });
      return normalizeTask(res.item);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"], type: "all" });
      await queryClient.cancelQueries({ queryKey: ["projects"], type: "all" });

      const previousTasksQueries = queryClient.getQueriesData<{ items: Task[]; totalPages: number; totalItems: number }>({
        queryKey: ["tasks"],
      });

      const optimisticUpdate = (t: Task) => (t.id === id ? { ...t, executionPriority: null } : t);

      queryClient.setQueriesData<{ items: Task[]; totalPages: number; totalItems: number }>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return { ...old, items: old.items.map(optimisticUpdate) };
      });

      if (selectedProject) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(optimisticUpdate),
        });
      }

      if (selectedTask?.id === id) {
        setSelectedTask({ ...selectedTask, executionPriority: null });
      }

      return { previousTasksQueries };
    },
    onSuccess: (updatedTask) => {
      // Invalidate all tasks queries (including paginated ones)
      queryClient.invalidateQueries({ queryKey: ["tasks"], type: "all" });
      queryClient.invalidateQueries({ queryKey: ["projects"], type: "all" });
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      if (selectedProject && updatedTask.projectId && selectedProject.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasksQueries) {
        for (const [key, data] of ctx.previousTasksQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
  });

  const clearAllPrioritiesMutation = useMutation({
    mutationFn: async ({ type, projectId }: { type: "standalone" | "project"; projectId?: string }) => {
      const endpoint = type === "project" && projectId
        ? `/api/projects/${projectId}/priorities`
        : "/api/tasks/priorities";
      await apiFetch<{ success: boolean }>(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], type: "all" });
      queryClient.invalidateQueries({ queryKey: ["projects"], type: "all" });
      toast({ title: "Priorities cleared", description: "All execution priorities have been removed." });
    },
    onError: (err) => {
      toast({
        title: "Failed to clear priorities",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const resequencePrioritiesMutation = useMutation({
    mutationFn: async ({ taskIds }: { taskIds: string[] }) => {
      const res = await apiFetch<{ items: TaskApi[] }>("/api/tasks/resequence", {
        method: "POST",
        body: JSON.stringify({ taskIds }),
      });
      return res.items.map(normalizeTask);
    },
    onSuccess: (updatedTasks) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], type: "all" });
      queryClient.invalidateQueries({ queryKey: ["projects"], type: "all" });
      // Update selected project tasks if needed
      if (selectedProject) {
        const updatedTaskMap = new Map(updatedTasks.map(t => [t.id, t]));
        setSelectedProject({
          ...selectedProject,
          tasks: (selectedProject.tasks || []).map(t => updatedTaskMap.get(t.id) || t)
        });
      }
    },
  });

  // Reassign handlers
  const handleReassignTask = async () => {
    if (!reassigningTask) return;
    setIsReassigningTask(true);
    try {
      await reassignTaskMutation.mutateAsync({ id: reassigningTask.id, assignees: reassignTaskAssignees });
      setIsReassignTaskOpen(false);
      setReassigningTask(null);
      setReassignTaskAssignees([]);
      toast({ title: "Task reassigned", description: "Task has been reassigned successfully." });
    } catch (err) {
      toast({
        title: "Failed to reassign task",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsReassigningTask(false);
    }
  };

  const handleReassignProject = async () => {
    if (!reassigningProject) return;
    setIsReassigningProject(true);
    try {
      await reassignProjectMutation.mutateAsync({ id: reassigningProject.id, assignees: reassignProjectAssignees });
      setIsReassignProjectOpen(false);
      setReassigningProject(null);
      setReassignProjectAssignees([]);
      toast({ title: "Project reassigned", description: "Project has been reassigned successfully." });
    } catch (err) {
      toast({
        title: "Failed to reassign project",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsReassigningProject(false);
    }
  };

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      dueTime: "",
      location: "",
      introVideoUrl: "",
    },
  });

  const editForm = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      dueTime: "",
      location: "",
      introVideoUrl: "",
    },
  });

  const validateForm = () => {
    const errors: { projectName?: string; title?: string; description?: string } = {};
    if (!projectName.trim()) {
      errors.projectName = "Project name is required";
    }
    // Task is no longer mandatory during project creation
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetProjectFlow = () => {
    setProjectName("");
    setProjectDescription("");
    setProjectTasks([]);
    setProjectLogoFile(null);
    setProjectLogoPreview("");
    setProjectAttachmentFiles([]);
    setProjectAttachmentPreviews([]);
    setProjectDropboxSelectedFiles([]);
    setValidationErrors({});
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      dueTime: "",
      location: "",
      attachmentFileName: "",
    attachmentNote: "",
    introVideoUrl: "",
    });
    setSelectedAssignees([]);
  };

  // Handle task priority click in Priority Mode: 1-click sequencing
  const handleTaskPriorityClick = async (task: Task, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!priorityModeEnabled || assigningPriority) return;

    setAssigningPriority(true);
    try {
      if (task.executionPriority) {
        // If task already has a priority, clicking it removes it (unassigns and re-sequences remaining)
        await apiFetch<{ success: boolean }>(`/api/tasks/${encodeURIComponent(task.id)}/priority`, {
          method: "DELETE",
        });
        toast({
          title: "Priority removed",
          description: `Removed "${task.title}" from execution sequence.`,
        });
      } else {
        // If task is not prioritized, assign next sequence number (max current priority + 1)
        const allTasks = selectedProject ? (selectedProject.tasks || []) : tasks;
        const currentPriorities = allTasks
          .map((t) => t.executionPriority)
          .filter((p): p is number => typeof p === "number" && p > 0);

        const nextPriority = currentPriorities.length > 0 ? Math.max(...currentPriorities) + 1 : 1;

        await apiFetch<{ success: boolean; item: Task }>(`/api/tasks/${encodeURIComponent(task.id)}/priority`, {
          method: "POST",
          body: JSON.stringify({ executionPriority: nextPriority }),
        });

        toast({
          title: `Priority #${nextPriority} Assigned`,
          description: `Set "${task.title}" as #${nextPriority} in execution order.`,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProject) {
        await loadProject(selectedProject.id);
      }
    } catch (err) {
      toast({
        title: "Failed to update priority",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAssigningPriority(false);
    }
  };

  const draftFromForm = (attachmentOverride?: CreateProjectTaskDraft["attachment"]) => {
    const createdAt = new Date().toISOString().split("T")[0];
    const att = attachmentOverride
      ? attachmentOverride
      : attachmentFile
        ? {
          fileName: attachmentFile.name,
          url: "",
          mimeType: attachmentFile.type,
          size: attachmentFile.size,
        }
        : undefined;

    return {
      title: formData.title,
      description: formData.description,
      assignees: selectedAssignees,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime,
      location: formData.location,
      createdAt,
      attachmentFileName: formData.attachmentFileName || attachmentFile?.name || "",
      attachmentNote: formData.attachmentNote || "",
      attachment: att,
    } satisfies CreateProjectTaskDraft;
  };

  const addTaskToProject = async () => {
    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) errors.title = "Task title is required";
    if (!formData.description.trim()) errors.description = "Task description is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    const attachments = attachmentFiles.length > 0 ? await filesToAttachments(attachmentFiles) : [];
    const first = attachments[0];
    const firstAttachment = first
      ? { fileName: first.fileName, url: first.url, mimeType: first.mimeType, size: first.size }
      : undefined;

    setProjectTasks((prev) => [
      ...prev,
      {
        ...draftFromForm(firstAttachment),
        attachment: firstAttachment,
        attachmentFileName: first?.fileName || formData.attachmentFileName || "",
        attachments: attachments.length > 0 ? attachments : undefined,
      },
    ]);

    setValidationErrors((prev) => ({ ...prev, title: undefined, description: undefined }));
    setFormData((prev) => ({
      ...prev,
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      dueTime: "",
      location: "",
      attachmentFileName: "",
    attachmentNote: "",
    introVideoUrl: "",
    }));
    setSelectedAssignees([]);
    setAttachmentFile(null);
    setIsCreateTaskOpen(false);
    setAttachmentFiles([]);
    setAttachmentFilePreviews([]);
  };

  const handleCreateProject = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      setApiError(null);

      const description = projectDescription?.trim() || "—";

      const projectLogo = projectLogoFile
        ? await (async () => {
          try {
            const url = await compressImageToDataUrl(projectLogoFile);
            return {
              fileName: projectLogoFile.name,
              url,
              mimeType: projectLogoFile.type,
              size: projectLogoFile.size,
            };
          } catch (e) {
            return new Promise<ProjectLogo>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error("Failed to read project logo"));
              reader.onload = () => {
                const url = typeof reader.result === "string" ? reader.result : "";
                resolve({
                  fileName: projectLogoFile.name,
                  url,
                  mimeType: projectLogoFile.type,
                  size: projectLogoFile.size,
                });
              };
              reader.readAsDataURL(projectLogoFile);
            });
          }
        })()
        : undefined;

      const tasksToCreate: CreateProjectTaskDraft[] = projectTasks;

      const projectAttachments =
        projectAttachmentFiles.length > 0 ? await filesToAttachments(projectAttachmentFiles) : [];

      const payload: CreateProjectPayload & { assignees?: string[]; logo?: ProjectLogo; teamLead?: string; dropboxAttachments?: DropboxSelectedFile[] } = {
        name: projectName.trim(),
        description,
        assignees: projectCreationAssignees,
        teamLead: projectTeamLead || undefined,
        logo: projectLogo,
        introVideoUrl: projectIntroVideoUrl,
        attachments: projectAttachments,
        dropboxAttachments: projectDropboxSelectedFiles,
        tasks: tasksToCreate,
      };

      await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      setIsCreating(false);
      resetProjectFlow();
      toast({
        description: projectTasks.length > 0 ? "Your project has been created with tasks." : "Your project has been created.",
      });
    } catch (e) {
      setIsCreating(false);
      setApiError(e instanceof Error ? e.message : "Failed to create project");
      toast({
        title: "Failed to create project",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!isDirectTask && !selectedProject) {
      toast({ title: "Select a project first", description: "Please choose a project before creating a task.", variant: "destructive" });
      return;
    }

    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) errors.title = "Task title is required";
    if (!formData.description.trim()) errors.description = "Task description is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    try {
      setIsCreating(true);
      const nowDate = new Date().toISOString().split("T")[0];

      const attachments = attachmentFiles.length > 0 ? await filesToAttachments(attachmentFiles) : [];
      const first = attachments[0];
      const attachment = first
        ? { fileName: first.fileName, url: first.url, mimeType: first.mimeType, size: first.size }
        : undefined;

      const taskPayload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        assignees: selectedAssignees,
        teamLead: taskTeamLead || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        dueTime: formData.dueTime,
        location: formData.location,
        createdAt: nowDate,
        attachmentFileName: first?.fileName || "",
        attachmentNote: formData.attachmentNote,
        introVideoUrl: formData.introVideoUrl,
        attachment,
        attachments,
        // Dropbox attachment references (source == "DROPBOX")
        dropboxAttachments: dropboxSelectedFiles,
      };

      if (!isDirectTask && selectedProject) {
        taskPayload.projectId = selectedProject.id;
      }

      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskPayload),
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (!isDirectTask && selectedProject?.id) {
        void loadProject(selectedProject.id);
      }

      setIsCreating(false);
      setIsCreateTaskOpen(false);
      setIsDirectTask(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
        dueDate: "",
        dueTime: "",
        location: "",
        attachmentFileName: "",
    attachmentNote: "",
    introVideoUrl: "",
      });
      setSelectedAssignees([]);
      setTaskTeamLead("");
      setAttachmentFile(null);
      setAttachmentFiles([]);
      setAttachmentFilePreviews([]);
      setDropboxSelectedFiles([]);
      setValidationErrors({});

      toast({
        title: "Task created",
        description: isDirectTask ? "New standalone task has been created." : "New task has been added to the project.",
      });
    } catch (e) {
      setIsCreating(false);
      toast({
        title: "Failed to create task",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const openView = (task: Task) => {
    if (selectedProject) {
      setProjectTaskSearchQuery("");
    } else {
      setProjectSearchQuery("");
    }
    setSelectedTask(task);
    setTaskViewTitle(task.title);
    setTaskViewDesc(task.description);
    setTaskViewEdited(false);
    setIsViewOpen(true);
    setIsAsanaDrawerOpen(true);
    void loadComments(task.id);
    void loadDropboxAttachments(task.id);
  };

  // Load Dropbox attachments for a specific task
  const loadDropboxAttachments = async (taskId: string) => {
    try {
      setLoadingDropboxAttachments(true);
      setDropboxAttachmentsError(null);
      const res = await apiFetch<{ items: Array<{ id: string; file_name: string; file_type: string; file_size: number; dropbox_path: string; temporary_link: string; created_at: string }> }>(
        `/api/tasks/${encodeURIComponent(taskId)}/dropbox-attachments`
      );
      setViewDropboxAttachments(res.items || []);
    } catch (err) {
      setViewDropboxAttachments([]);
      setDropboxAttachmentsError(err instanceof Error ? err.message : "Failed to load Dropbox files");
    } finally {
      setLoadingDropboxAttachments(false);
    }
  };

  // Open a Dropbox file via a fresh temporary link
  const openDropboxFile = async (dropboxPath: string) => {
    try {
      const res = await apiFetch<{ link: string }>("/api/dropbox/files/temporary-link", {
        method: "POST",
        body: JSON.stringify({ path: dropboxPath }),
      });
      if (res.link) {
        window.open(res.link, "_blank", "noopener,noreferrer");
      } else {
        toast({ title: "Link unavailable", description: "Could not generate a viewing link for this file.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed to open file", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    }
  };

  const loadComments = async (taskId: string, silent: boolean = false) => {
    try {
      if (!silent) setCommentsLoading(true);
      setCommentError(null);
      const res = await apiFetch<{ items: TaskComment[] }>(`/api/tasks/${encodeURIComponent(taskId)}/comments?_t=${Date.now()}`);
      const newComments = Array.isArray(res.items) ? res.items : [];
      setComments(newComments);
      // Auto scroll to bottom if new messages arrived and chat is open
      setTimeout(() => {
        if (chatContainerRef.current && isViewOpen) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (e) {
      if (!silent) setCommentError(e instanceof Error ? e.message : "Failed to load messages");
      setComments([]);
    } finally {
      if (!silent) setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!selectedTask || isSendingComment) return;
    const msg = commentDraft.trim();
    if (!msg && commentAttachments.length === 0) return;

    try {
      setIsSendingComment(true);
      setCommentError(null);

      // Process attachments with compression if they are images
      const processedAttachments = await filesToAttachments(commentAttachments);

      const res = await apiFetch<{ item: TaskComment }>(`/api/tasks/${encodeURIComponent(selectedTask.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: msg, attachments: processedAttachments }),
      });
      setComments((prev) => [...prev, res.item]);
      setCommentDraft("");
      setCommentAttachments([]); // Clear attachments
      // Scroll to bottom after sending
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleTypingIndicator = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentDraft(e.target.value);
    
    if (!socket || !selectedTask) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { taskId: selectedTask.id, username: currentUsername, typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { taskId: selectedTask.id, username: currentUsername, typing: false });
    }, 3000);
  };

  // Socket logic for live messages
  useEffect(() => {
    if (!isViewOpen || !selectedTask || !socket) return;
    const taskId = selectedTask.id;

    // Bypass the isConnected guard in joinTask — emit directly so the room join
    // is not skipped if isConnected state lags behind the actual socket state.
    socket.emit("join-task", taskId);

    // Re-join after any reconnection (socket.io resets rooms on reconnect)
    const handleConnect = () => socket.emit("join-task", taskId);
    socket.on("connect", handleConnect);

    const handleNewComment = (comment: TaskComment) => {
      setComments((prev) => {
        if (prev.find((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    socket.on("new-comment", handleNewComment);

    const handleTyping = ({ username, typing }: { username: string; typing: boolean }) => {
      if (username === currentUsername) return;
      setOthersTyping(prev => {
        if (typing) return prev.includes(username) ? prev : [...prev, username];
        return prev.filter(u => u !== username);
      });
    };

    socket.on("typing", handleTyping);

    const handleReactionUpdated = ({ commentId, reactions }: { commentId: string; reactions: any[] }) => {
      setComments((prev) => prev.map(c => c.id === commentId ? { ...c, reactions } : c));
    };

    socket.on("comment-reaction-updated", handleReactionUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new-comment", handleNewComment);
      socket.off("typing", handleTyping);
      socket.off("comment-reaction-updated", handleReactionUpdated);
      socket.emit("leave-task", taskId);
    };
  }, [isViewOpen, selectedTask?.id, socket]);

  const toggleReaction = async (commentId: string, emoji: string) => {
    if (!selectedTask) return;
    try {
      // Optimistic update
      setComments((prev) => 
        prev.map(c => {
          if (c.id !== commentId) return c;
          const auth = getAuthState();
          const userId = String(auth.sub || auth.id || "");
          const existing = (c.reactions || []).find(r => r.emoji === emoji && r.userId === userId);
          let newReactions;
          if (existing) {
            newReactions = (c.reactions || []).filter(r => !(r.emoji === emoji && r.userId === userId));
          } else {
            newReactions = [...(c.reactions || []), { emoji, userId, username: auth.username || "", fullName: "" }];
          }
          return { ...c, reactions: newReactions };
        })
      );

      await apiFetch(`/api/tasks/${encodeURIComponent(selectedTask.id)}/comments/${encodeURIComponent(commentId)}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
    } catch (e) {
      console.error("Failed to toggle reaction:", e);
    }
  };

  const archiveComment = async (commentId: string) => {
    if (!selectedTask) return;
    try {
      setArchivingCommentId(commentId);
      await apiFetch(`/api/tasks/${encodeURIComponent(selectedTask.id)}/comments/${encodeURIComponent(commentId)}/archive`, {
        method: "POST",
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({ title: "Comment archived", description: "The comment has been moved to archive." });
    } catch (e) {
      toast({
        title: "Archive failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setArchivingCommentId(null);
    }
  };

  const archiveAttachment = async (attachmentIndex: number) => {
    if (!selectedTask) return;
    try {
      setArchivingAttachment(attachmentIndex);
      await apiFetch(`/api/tasks/${encodeURIComponent(selectedTask.id)}/attachments/${attachmentIndex}/archive`, {
        method: "POST",
      });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (attachmentIndex === -1) {
        setSelectedTask({ ...selectedTask, attachment: undefined, attachmentFileName: undefined });
      } else if (selectedTask.attachments) {
        const newAttachments = [...selectedTask.attachments];
        newAttachments.splice(attachmentIndex, 1);
        setSelectedTask({ ...selectedTask, attachments: newAttachments });
      }
      toast({ title: "Attachment archived", description: "The attachment has been moved to archive." });
    } catch (e) {
      toast({
        title: "Archive failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setArchivingAttachment(null);
    }
  };

  const deleteProjectAttachment = async (attachmentIndex: number) => {
    if (!selectedProject) return;
    try {
      setDeletingProjectAttachment(attachmentIndex);
      await apiFetch(`/api/projects/${encodeURIComponent(selectedProject.id)}/attachments/${attachmentIndex}`, {
        method: "DELETE",
      });

      const updatedAtts = [...(selectedProject.attachments || [])];
      updatedAtts.splice(attachmentIndex, 1);
      setSelectedProject({
        ...selectedProject,
        attachments: updatedAtts,
      });

      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["project", selectedProject.id] });
      toast({
        title: "Project file deleted",
        description: "The attachment has been removed from the project.",
      });
    } catch (err) {
      console.error("Failed to delete project attachment:", err);
      toast({
        title: "Failed to delete file",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeletingProjectAttachment(null);
      setConfirmDeleteProjectAttachmentIndex(null);
    }
  };

  const { triggerBlaster, incrementCompletedCount } = useTaskBlasterContext();
  const { triggerReward } = useRewards();

  const handleToggleTaskComplete = async (task: Task, event?: React.MouseEvent) => {
    const isCompleted = task.status === "completed";
    const nextStatus: Task["status"] = isCompleted ? "pending" : "completed";
    try {
      // Optimistically update local states
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      if (selectedProject) {
        setSelectedProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: (prev.tasks || []).map((t) =>
              t.id === task.id ? { ...t, status: nextStatus } : t
            ),
          };
        });
      }
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: nextStatus });
      }

      const res = await apiFetch<{ item: TaskApi }>(
        `/api/tasks/${encodeURIComponent(task.id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const normalized = normalizeTask(res.item);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? normalized : t))
      );

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (task.projectId) {
        await queryClient.invalidateQueries({ queryKey: ["project", task.projectId] });
        await queryClient.invalidateQueries({ queryKey: ["projects"] });
      }

      if (nextStatus === "completed") {
        // Trigger Blaster & Reward
        const taskForBlaster = {
          id: normalized.id,
          title: normalized.title,
          priority: normalized.priority as any,
          status: "completed",
        };
        const triggered = triggerBlaster(taskForBlaster);
        if (triggered) incrementCompletedCount();

        if (event) {
          triggerReward(event.clientX || window.innerWidth / 2, event.clientY || window.innerHeight / 2);
        } else {
          triggerReward(window.innerWidth / 2, window.innerHeight / 2);
        }
        toast({
          title: "Task completed! 🎉",
          description: `"${task.title}" has been marked as complete.`,
        });
      } else {
        toast({
          title: "Task reopened",
          description: `"${task.title}" status changed to pending.`,
        });
      }
    } catch (err) {
      console.error("Failed to toggle task status:", err);
      toast({
        title: "Failed to update task status",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  };

  const updateStatus = async (next: Task["status"], event?: React.MouseEvent | React.TouchEvent | { x: number; y: number }) => {
    if (!selectedTask) return;
    const previousStatus = selectedTask.status;
    try {
      setStatusSaving(true);
      setCommentError(null);
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${encodeURIComponent(selectedTask.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      const normalized = normalizeTask(res.item);
      setSelectedTask(normalized);

      // Update in selectedProject tasks if applicable
      if (selectedProject && normalized.projectId && selectedProject.id === normalized.projectId) {
        setSelectedProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: next === "completed"
              ? prev.tasks.filter((t) => t.id !== normalized.id)
              : prev.tasks.map((t) => (t.id === normalized.id ? normalized : t)),
          };
        });
      }

      // Update in standalone tasks list (tasks state)
      setTasks((prev) => next === "completed"
        ? prev.filter((t) => t.id !== normalized.id)
        : prev.map((t) => (t.id === normalized.id ? normalized : t)));

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (normalized.projectId) {
        await queryClient.invalidateQueries({ queryKey: ["project", normalized.projectId] });
      }

      // Trigger TaskBlaster & Reward System when task is marked as completed
      if (next === "completed" && previousStatus !== "completed") {
        // 1. Trigger Global Blaster (Legacy)
        const taskForBlaster = {
          id: normalized.id,
          title: normalized.title,
          priority: normalized.priority as any,
          status: "completed",
        };
        const triggered = triggerBlaster(taskForBlaster);
        if (triggered) {
          incrementCompletedCount();
        }

        // 2. Trigger Professional Reward System (Micro-animations, Haptics, Sound)
        if (event) {
          let x = 0, y = 0;
          if ('clientX' in event) {
            x = event.clientX;
            y = event.clientY;
          } else if ('touches' in event && event.touches[0]) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
          } else if ('x' in event) {
            x = (event as any).x;
            y = (event as any).y;
          }
          if (x || y) triggerReward(x, y);
        } else {
          // Fallback to center of screen if no event provided
          triggerReward(window.innerWidth / 2, window.innerHeight / 2);
        }
      }
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const openEdit = (task: Task) => {
    if (selectedProject) {
      setProjectTaskSearchQuery("");
    } else {
      setProjectSearchQuery("");
    }
    setSelectedTask(task);
    setEditSelectedAssignees(task.assignees || []);
    setEditTaskTeamLead(task.teamLead || "");
    editForm.reset({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      dueTime: task.dueTime || "",
      location: task.location || "",
    });
    setIsEditOpen(true);
    setEditTaskFile(null);
    setEditTaskFilePreview(task.attachment?.url || null);
    setEditTaskFiles([]);
    setEditTaskFilePreviews(task.attachments?.map(a => a.url) || (task.attachment?.url ? [task.attachment.url] : []));
  };

  const openDelete = (task: Task) => {
    if (selectedProject) {
      setProjectTaskSearchQuery("");
    } else {
      setProjectSearchQuery("");
    }
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const handlePrintTask = async (task: Task) => {
    try {
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const maxWidth = pageWidth - margin * 2;

      let y = margin;

      const addHeading = (text: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const lines = doc.splitTextToSize(text || "—", maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 18 + 6;
      };

      const addLabelValue = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${label}:`, margin, y);
        doc.setFont("helvetica", "normal");
        const valLines = doc.splitTextToSize(value || "—", maxWidth - 80);
        doc.text(valLines, margin + 80, y);
        y += valLines.length * 14 + 6;
      };

      const ensureSpace = (needed: number) => {
        if (y + needed <= pageHeight - margin) return;
        doc.addPage();
        y = margin;
      };

      addHeading(task.title || "Task");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Assigned to: ${(task.assignees || []).join(", ") || "—"}`, margin, y);
      y += 18;

      ensureSpace(120);
      addLabelValue("Status", task.status || "—");
      addLabelValue("Priority", task.priority || "—");
      addLabelValue("Due Date", task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—");
      addLabelValue("Location", task.location || "—");
      addLabelValue("Created", task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "—");

      ensureSpace(80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Description", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const descLines = doc.splitTextToSize(task.description || "—", maxWidth);
      doc.text(descLines, margin, y);
      y += descLines.length * 14 + 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      ensureSpace(30);
      doc.text("Attachment", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const attUrl = String(task.attachment?.url || "").trim();
      const attMime = String(task.attachment?.mimeType || "").trim();
      const attIsImage = !!attUrl && (attMime.startsWith("image/") || attUrl.startsWith("data:image/"));
      const attName = task.attachment?.fileName || task.attachmentFileName || "";

      if (attIsImage) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Essential for CORS
        const proxiedUrl = toProxiedUrl(attUrl) || attUrl;
        img.src = proxiedUrl;
        
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = (err) => {
            console.error("Failed to load image for PDF:", err);
            resolve();
          };
          // Handle case where image is already loaded
          if (img.complete) resolve();
        });

        if (img.complete && img.naturalWidth > 0) {
          const imgW = img.naturalWidth;
          const imgH = img.naturalHeight;
          const renderW = maxWidth;
          const renderH = (imgH / imgW) * renderW;
          
          ensureSpace(Math.min(renderH + 10, pageHeight - margin * 2));
          
          // Use the image object directly
          const type: "PNG" | "JPEG" = attMime.includes("png") || proxiedUrl.includes(".png") || proxiedUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
          try {
            doc.addImage(img, type, margin, y, renderW, renderH);
            y += renderH + 10;
          } catch (addImageError) {
            console.error("jsPDF addImage failed:", addImageError);
            doc.text(`[Image could not be rendered: ${attName}]`, margin, y);
            y += 18;
          }
        } else {
          doc.text(`[Image missing or failed to load: ${attName}]`, margin, y);
          y += 18;
        }
      } else if (attName) {
        const attLines = doc.splitTextToSize(attName, maxWidth);
        doc.text(attLines, margin, y);
        y += attLines.length * 14 + 6;
      } else {
        doc.text("—", margin, y);
        y += 18;
      }

      if (task.attachmentNote) {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Attachment Note", margin, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const noteLines = doc.splitTextToSize(task.attachmentNote, maxWidth);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 14 + 6;
      }

      const safeName = String(task.title || "task")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .slice(0, 80);
      doc.save(`${safeName || "task"}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast({
        title: "Failed to generate PDF",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const onEditTask = async (values: CreateTaskValues) => {
    if (!selectedTask) return;
    const previousStatus = selectedTask.status;

    const payload: Partial<Task> = { ...values, assignees: editSelectedAssignees, teamLead: editTaskTeamLead || undefined };

    // Handle multiple attachments
    const newAttachments = editTaskFiles.length > 0 ? await filesToAttachments(editTaskFiles) : [];
    const existingAttachments = (selectedTask.attachments || [])
      .filter(a => editTaskFilePreviews.includes(a.url));

    // Support legacy single attachment
    if (selectedTask.attachment?.url && editTaskFilePreviews.includes(selectedTask.attachment.url)) {
      if (!existingAttachments.some(a => a.url === selectedTask.attachment?.url)) {
        existingAttachments.push(selectedTask.attachment);
      }
    }

    const combinedAttachments = [...existingAttachments, ...newAttachments];
    payload.attachments = combinedAttachments;
    
    // Maintain legacy field for compatibility
    if (combinedAttachments.length > 0) {
      payload.attachment = combinedAttachments[0];
      payload.attachmentFileName = combinedAttachments[0].fileName;
    } else {
      payload.attachment = { fileName: "", url: "", mimeType: "", size: 0 };
      payload.attachmentFileName = "";
    }

    updateTaskMutation.mutate(
      { id: selectedTask.id, payload },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditTaskFile(null);
          setEditTaskFilePreview(null);
          setEditTaskFiles([]);
          setEditTaskFilePreviews([]);
          setEditSelectedAssignees([]);
          toast({
            title: "Task updated",
            description: "Task has been updated.",
          });

          // Trigger TaskBlaster & Reward System when task is marked as completed via edit
          if (values.status === "completed" && previousStatus !== "completed") {
            const taskForBlaster = {
              id: selectedTask.id,
              title: selectedTask.title,
              priority: values.priority as any,
              status: "completed",
            };
            const triggered = triggerBlaster(taskForBlaster);
            if (triggered) {
              incrementCompletedCount();
            }

            // Trigger reward at center for form submission completion
            triggerReward(window.innerWidth / 2, window.innerHeight / 2);
          }
        },
        onError: (err) => {
          console.error("Task update error:", err);
          toast({
            title: "Failed to update task",
            description: err instanceof Error ? err.message : "Something went wrong",
          });
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!selectedTask) return;
    const toDelete = selectedTask;

    deleteTaskMutation.mutate(toDelete.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedTask(null);
        toast({
          title: "Task archived",
          description: "Task has been moved to archive.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to archive task",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const sourceTasks = selectedProject ? selectedProject.tasks : (tasksQuery.data?.items || []);

  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach((e) => {
      if (e.name && e.name.trim()) {
        set.add(e.name.trim());
      }
    });
    sourceTasks.forEach((t: any) => {
      if (Array.isArray(t.assignees)) {
        t.assignees.forEach((a: string) => {
          if (a && typeof a === "string" && a.trim()) {
            set.add(a.trim());
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [activeEmployees, sourceTasks]);

  // Helper to match an assignee string against assigneeFilter
  const matchesSelectedAssignee = useCallback((assigneesList: string[], filter: string, teamLead?: string) => {
    if (!filter || filter === "all") return true;
    const filterLower = filter.toLowerCase().trim();

    const emp = activeEmployees.find(
      (e) => (e.name && e.name.toLowerCase().trim() === filterLower) || (e.email && e.email.toLowerCase().trim() === filterLower)
    );

    const variants = new Set<string>();
    variants.add(filterLower);
    if (emp) {
      if (emp.name) variants.add(emp.name.toLowerCase().trim());
      if (emp.email) variants.add(emp.email.toLowerCase().trim());
    }

    if (teamLead && Array.from(variants).some((v) => teamLead.toLowerCase().trim().includes(v))) {
      return true;
    }

    if (Array.isArray(assigneesList)) {
      return assigneesList.some((a) => {
        if (!a || typeof a !== "string") return false;
        const aLower = a.toLowerCase().trim();
        return Array.from(variants).some((v) => aLower === v || aLower.includes(v) || v.includes(aLower));
      });
    }

    return false;
  }, [activeEmployees]);

  const filteredTasks = useMemo(() => {
    const filtered = sourceTasks.filter((task) => {
      const assigneesText = Array.isArray(task.assignees) ? task.assignees.join(" ") : "";
      const taskSearch = selectedProject ? projectTaskSearchQuery : projectSearchQuery;
      const matchesSearch =
        !taskSearch ||
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(taskSearch.toLowerCase())) ||
        assigneesText.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.status.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.priority.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (task.projectName && task.projectName.toLowerCase().includes(taskSearch.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && task.assignees && task.assignees.length > 0) ||
        (assignmentFilter === "unassigned" && (!task.assignees || task.assignees.length === 0)) ||
        (assignmentFilter === "me" && (task.assignees || []).some((a: string) => {
          const term = a.toLowerCase().trim();
          const meUsername = currentUsername.toLowerCase().trim();
          const authState = getAuthState();
          const meName = (authState.name || "").toLowerCase().trim();
          return (meUsername && term === meUsername) || (meName && term === meName);
        }));
      const matchesAssignee = matchesSelectedAssignee(task.assignees || [], assigneeFilter);
 
      if (showArchivedTasks && task.status !== "completed") return false;
 
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignment && matchesAssignee;
    });

    if (viewByPriority) {
      return [...filtered].sort((a, b) => {
        const aP = a.executionPriority ?? null;
        const bP = b.executionPriority ?? null;
        if (aP !== null && bP === null) return -1;
        if (aP === null && bP !== null) return 1;
        if (aP !== null && bP !== null) return aP - bP;
        return 0;
      });
    }

    return filtered;
  }, [sourceTasks, projectTaskSearchQuery, projectSearchQuery, statusFilter, priorityFilter, assignmentFilter, assigneeFilter, showArchivedTasks, viewByPriority, selectedProject, matchesSelectedAssignee]);

  const filteredProjects = useMemo(() => {
    const qMain = projectSearchQuery.trim().toLowerCase();
    const sFilter = statusFilter.toLowerCase();
    const pFilter = priorityFilter.toLowerCase();

    return projects.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const assigneesText = (p.assignees || []).join(" ").toLowerCase();
      const teamLeadText = (p.teamLead || "").toLowerCase();
      const status = (p.status || "").toLowerCase();
      const priority = (p.priority || "").toLowerCase();

      // Status Filter
      if (sFilter !== "all" && status !== sFilter) {
        return false;
      }

      // Priority Filter
      if (pFilter !== "all" && priority !== pFilter) {
        return false;
      }

      // Assignee Filter
      if (assigneeFilter !== "all") {
        const directAssigneeMatch = matchesSelectedAssignee(p.assignees || [], assigneeFilter, p.teamLead);
        const taskAssigneeMatch = Array.isArray(p.tasks) && p.tasks.some((t: any) => matchesSelectedAssignee(t.assignees || [], assigneeFilter));
        if (!directAssigneeMatch && !taskAssigneeMatch) {
          return false;
        }
      }

      // Assignment Filter ("me", "assigned", "unassigned")
      if (assignmentFilter === "assigned") {
        const hasProjectAssignees = (p.assignees && p.assignees.length > 0) || !!p.teamLead;
        const hasTaskAssignees = Array.isArray(p.tasks) && p.tasks.some((t: any) => t.assignees && t.assignees.length > 0);
        if (!hasProjectAssignees && !hasTaskAssignees) return false;
      } else if (assignmentFilter === "unassigned") {
        const hasProjectAssignees = (p.assignees && p.assignees.length > 0) || !!p.teamLead;
        const hasTaskAssignees = Array.isArray(p.tasks) && p.tasks.some((t: any) => t.assignees && t.assignees.length > 0);
        if (hasProjectAssignees || hasTaskAssignees) return false;
      } else if (assignmentFilter === "me") {
        const meUsername = currentUsername.toLowerCase().trim();
        const meName = (getAuthState().name || "").toLowerCase().trim();
        const meVariants = [meUsername, meName].filter(Boolean);
        const isProjectMe = (p.assignees || []).some((a: string) => meVariants.includes(a.toLowerCase().trim())) || (p.teamLead && meVariants.includes(p.teamLead.toLowerCase().trim()));
        const isTaskMe = Array.isArray(p.tasks) && p.tasks.some((t: any) => (t.assignees || []).some((a: string) => meVariants.includes(a.toLowerCase().trim())));
        if (!isProjectMe && !isTaskMe) return false;
      }

      // Search Query
      if (qMain && !name.includes(qMain) && !desc.includes(qMain) && !assigneesText.includes(qMain) && !teamLeadText.includes(qMain)) {
        return false;
      }

      return true;
    });
  }, [projects, projectSearchQuery, statusFilter, priorityFilter, assignmentFilter, assigneeFilter, matchesSelectedAssignee]);

  const filteredStandaloneTasks = useMemo(() => {
    let standalone = tasksQuery.data?.items || [];
    const qMain = projectSearchQuery.trim().toLowerCase();

    standalone = standalone.filter((task) => {
      const assigneesText = Array.isArray(task.assignees) ? task.assignees.join(" ") : "";
      const matchesSearch = !qMain || task.title.toLowerCase().includes(qMain) || assigneesText.toLowerCase().includes(qMain);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && task.assignees && task.assignees.length > 0) ||
        (assignmentFilter === "unassigned" && (!task.assignees || task.assignees.length === 0)) ||
        (assignmentFilter === "me" && (task.assignees || []).some((a: string) => {
          const term = a.toLowerCase().trim();
          const meUsername = currentUsername.toLowerCase().trim();
          const meName = (getAuthState().name || "").toLowerCase().trim();
          return (meUsername && term === meUsername) || (meName && term === meName);
        }));
      const matchesAssignee = matchesSelectedAssignee(task.assignees || [], assigneeFilter);

      if (showArchivedTasks && task.status !== "completed") return false;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignment && matchesAssignee;
    });

    if (viewByPriority) {
      return [...standalone].sort((a, b) => {
        const aP = a.executionPriority ?? null;
        const bP = b.executionPriority ?? null;
        if (aP !== null && bP === null) return -1;
        if (aP === null && bP !== null) return 1;
        if (aP !== null && bP !== null) return aP - bP;
        return 0;
      });
    }
    return standalone;
  }, [tasksQuery.data, projectSearchQuery, statusFilter, priorityFilter, assignmentFilter, assigneeFilter, showArchivedTasks, viewByPriority, matchesSelectedAssignee]);

  // Project & Task counts from server data
  const projectTotalPages = projectsQuery.data?.totalPages || 1;
  const taskTotalPages = tasksQuery.data?.totalPages || 1;
  const projectTaskTotalPages = 1; // Handled within selective project view currently

  // Format time for messages
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="px-4 md:px-0 md:pl-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title text-xl sm:text-2xl md:text-3xl">Task Management</h1>
          <p className="page-subtitle text-sm sm:text-base text-muted-foreground">Create, assign, and track all tasks</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedProject ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { 
                setSelectedProject(null); 
                // Preserve project-level search and filters when returning
                setProjectTaskSearchQuery("");
                setTaskPage(1);
              }} className="h-9 text-sm">
                Back to Projects
              </Button>
              <Button size="sm" className="gap-2 h-9 text-sm" onClick={() => {
                setIsDirectTask(false);
                if (selectedProject?.teamLead) {
                  setTaskTeamLead(selectedProject.teamLead);
                }
                setIsCreateTaskOpen(true);
              }}>
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="gap-2 h-9 text-sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
              <Button size="sm" className="gap-2 h-9 text-sm" onClick={() => {
                setIsDirectTask(true);
                setIsCreateTaskOpen(true);
              }}>
                <Plus className="w-4 h-4" />
                Create Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Asana Style Quick-Add Bar */}
      <div className="mb-4">
        <AsanaQuickAddBar
          projectId={selectedProject?.id}
          projectName={selectedProject?.name}
          onTaskCreated={() => {
            void tasksQuery.refetch();
            if (selectedProject) void loadProject(selectedProject.id);
          }}
          onOpenFullModal={() => {
            setIsDirectTask(true);
            setIsCreateTaskOpen(true);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 items-stretch md:items-center">
        <div className="relative flex-1 min-w-[220px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder={selectedProject ? "Search tasks in this project..." : "Search projects, tasks, or assignee..."}
            className="pl-10 pr-10 h-10 w-full bg-background border border-border text-foreground text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-sm rounded-lg"
            value={selectedProject ? projectTaskSearchQuery : projectSearchQuery}
            onChange={(e) => {
              const next = e.target.value;
              if (selectedProject) {
                setProjectTaskSearchQuery(next);
                setProjectTaskPage(1);
              } else {
                setProjectSearchQuery(next);
                setProjectPage(1);
                setTaskPage(1);
              }
            }}
          />
          {(selectedProject ? projectTaskSearchQuery : projectSearchQuery) && (
            <button
              type="button"
              onClick={() => {
                if (selectedProject) {
                  setProjectTaskSearchQuery("");
                  setProjectTaskPage(1);
                } else {
                  setProjectSearchQuery("");
                  setProjectPage(1);
                  setTaskPage(1);
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Quick Filter Chips (Replaces Mobile-Buggy Dropdowns) */}
        <div className="w-full overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={statusFilter === "all" && priorityFilter === "all" && assignmentFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setAssignmentFilter("all");
              setAssigneeFilter("all");
            }}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            All Tasks
          </Button>
          <Button
            size="sm"
            variant={assignmentFilter === "me" ? "default" : "outline"}
            onClick={() => setAssignmentFilter(assignmentFilter === "me" ? "all" : "me")}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            Assigned to Me
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            In Progress
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            Completed
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === "high" ? "default" : "outline"}
            onClick={() => setPriorityFilter(priorityFilter === "high" ? "all" : "high")}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0"
          >
            High Priority
          </Button>
          <Button
            size="sm"
            variant={showArchivedTasks ? "secondary" : "outline"}
            onClick={() => setShowArchivedTasks(!showArchivedTasks)}
            className="h-8 text-xs font-semibold rounded-full px-3 shrink-0 gap-1.5"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>{showArchivedTasks ? "Hide Archived" : "Show Archived"}</span>
          </Button>
        </div>
          {/* <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 hidden sm:flex">
            <Filter className="w-4 h-4" />
          </Button> */}

          {/* Execution Priority Mode Controls - Admin Only */}
          {isAdminRole && (
            <>
              <Button
                variant={priorityModeEnabled ? "default" : "outline"}
                onClick={() => {
                  setPriorityModeEnabled(!priorityModeEnabled);
                  if (!priorityModeEnabled) {
                    toast({ title: "Priority Mode Enabled", description: "Click tasks to assign execution order." });
                  }
                }}
                className="h-10 px-3 flex items-center gap-2"
                disabled={assigningPriority}
              >
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">{priorityModeEnabled ? "Priority Mode ON" : "Priority Mode"}</span>
              </Button>

              {priorityModeEnabled && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to clear all execution priorities? This cannot be undone.")) {
                      try {
                        await clearAllPrioritiesMutation.mutateAsync({
                          type: selectedProject ? "project" : "standalone",
                          projectId: selectedProject?.id,
                        });
                      } catch (err) {
                        toast({
                          title: "Failed to clear priorities",
                          description: err instanceof Error ? err.message : "Something went wrong",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="h-10 px-3 flex items-center gap-2"
                  disabled={clearAllPrioritiesMutation.isPending}
                >
                  {clearAllPrioritiesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">Clear Slate</span>
                </Button>
              )}

              <Button
                variant={viewByPriority ? "secondary" : "outline"}
                onClick={() => setViewByPriority(!viewByPriority)}
                className="h-10 px-3 flex items-center gap-2"
                disabled={priorityModeEnabled}
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">{viewByPriority ? "By Priority" : "View by Priority"}</span>
              </Button>
            </>
          )}
        </div>

      {/* Premium Tab Switcher */}
      {!selectedProject && (
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 w-fit">
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("tab", "all");
              setSearchParams(next);
            }}
            className="h-8 text-xs font-semibold px-4 rounded-lg"
          >
            All
          </Button>
          <Button
            variant={activeTab === "projects" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("tab", "projects");
              setSearchParams(next);
            }}
            className="h-8 text-xs font-semibold px-4 rounded-lg"
          >
            Projects Only
          </Button>
          <Button
            variant={activeTab === "tasks" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("tab", "tasks");
              setSearchParams(next);
            }}
            className="h-8 text-xs font-semibold px-4 rounded-lg"
          >
            Tasks Only
          </Button>
        </div>
      )}

      {/* Project/Tasks sections - same as before, omitted for brevity but all code remains */}
      {selectedProject ? (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-4">
          {/* Modern SaaS Header Banner */}
          <div className="h-16 bg-gradient-to-r from-indigo-955 via-purple-955 to-slate-955 relative overflow-hidden">
            {/* SaaS Glow Decorative background */}
            <div className="absolute top-[-55px] left-[5%] w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-55px] right-[15%] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

            {/* Premium action header overlay */}
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              {isAdminRole && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-sm shadow-md font-semibold text-xs gap-1.5 transition-all"
                  onClick={() => {
                    setEditingProject(selectedProject);
                    setEditProjectName(selectedProject.name);
                    setEditProjectDescription(selectedProject.description || "");
                    setEditProjectIntroVideoUrl(selectedProject.introVideoUrl || "");
                    setEditProjectLogoPreview(selectedProject.logo?.url || "");
                    setEditProjectLogoFile(null);
                    setIsEditProjectOpen(true);
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Project
                </Button>
              )}
            </div>
          </div>

          {/* Banner Overlapping Logo & Main details */}
          <div className="px-6 pb-6 pt-4 relative flex flex-col items-center sm:items-start gap-4 border-b border-border/40">
            {/* Large logo container */}
            <div className="w-32 h-32 rounded-2xl bg-card border-4 border-muted/30 shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
              <ProjectLogoImgLarge 
                projectId={selectedProject.id} 
                projectName={selectedProject.name} 
                logoUrl={selectedProject.logo?.url} 
              />
            </div>

            {/* Project info details */}
            <div className="flex-1 w-full min-w-0 space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  className="font-extrabold text-2xl tracking-tight text-foreground border-transparent hover:border-border focus:border-primary px-1 -ml-1 !bg-transparent h-auto py-0 shadow-none focus-visible:ring-0 text-center sm:text-left"
                  value={projectViewName}
                  onChange={(e) => {
                    setProjectViewName(e.target.value);
                    setProjectViewEdited(true);
                  }}
                  placeholder="Project Name"
                />
                <Badge className="capitalize font-semibold text-xs w-fit mx-auto sm:mx-0" variant="secondary">{selectedProject.status || "No tasks"}</Badge>
              </div>
              <Textarea
                className="text-sm text-muted-foreground border-transparent hover:border-border focus:border-primary px-1 -ml-1 !bg-transparent resize-none min-h-[40px] py-0 shadow-none focus-visible:ring-0 text-center sm:text-left"
                value={projectViewDesc}
                onChange={(e) => {
                  setProjectViewDesc(e.target.value);
                  setProjectViewEdited(true);
                }}
                placeholder="Add project description..."
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary/60" />
                  {selectedProject.assignees && selectedProject.assignees.length > 0 ? selectedProject.assignees.join(", ") : "No assignees"}
                </span>
                <span className="border-l border-border h-3 hidden sm:inline" />
                <span>Created {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : ""}</span>
              </div>
              
              {projectViewEdited && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    className="h-7 text-xs" 
                    disabled={isUpdatingProject || !projectViewName.trim()}
                    onClick={async () => {
                      setIsUpdatingProject(true);
                      try {
                        await editProjectMutation.mutateAsync({
                          id: selectedProject.id,
                          payload: { name: projectViewName, description: projectViewDesc }
                        });
                        setProjectViewEdited(false);
                        toast({ title: "Project updated" });
                      } catch (err) {
                        toast({ title: "Update failed", variant: "destructive" });
                      } finally {
                        setIsUpdatingProject(false);
                      }
                    }}
                  >
                    {isUpdatingProject && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Save Project Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => {
                      setProjectViewName(selectedProject.name);
                      setProjectViewDesc(selectedProject.description || "");
                      setProjectViewEdited(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Intro video & attachments list inside premium header */}
          <div className="p-4 sm:p-6 space-y-4">
            {selectedProject.introVideoUrl && (
              /youtube\.com|youtu\.be|vimeo\.com/i.test(selectedProject.introVideoUrl) ? (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Project Synopsis</p>
                      <p className="text-sm font-medium">Watch the introductory video for this project.</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-primary/20 hover:bg-primary/5 text-primary font-bold"
                    onClick={() => window.open(selectedProject.introVideoUrl, "_blank")}
                  >
                    Watch Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Project Synopsis</p>
                  <video
                    src={toProxiedUrl(selectedProject.introVideoUrl) || selectedProject.introVideoUrl}
                    controls
                    className="w-full max-h-[320px] object-contain rounded-lg border border-primary/10 bg-black"
                  />
                </div>
              )
            )}
            {selectedProject.attachments && selectedProject.attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Project Attachments ({selectedProject.attachments.length})
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/50">
                  {selectedProject.attachments.map((att, idx) => {
                    const proxied = toProxiedUrl(att.url) || att.url;
                    const isImg = att.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(att.fileName || "");
                    return (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/60 bg-background shadow-xs hover:shadow-md transition-shadow">
                        {isImg && proxied ? (
                          <img src={proxied} alt={att.fileName || "Attachment"} className="w-full h-20 object-cover cursor-zoom-in" onClick={() => { setPreviewUrl(proxied); setPreviewName(att.fileName || "Attachment"); }} />
                        ) : (
                          <div className="w-full h-20 flex flex-col items-center justify-center bg-muted/40 p-2 text-center">
                            <FileText className="h-6 w-6 text-muted-foreground/70 mb-1" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-full">{att.fileName || "Document"}</span>
                          </div>
                        )}
                        <div className="p-1.5 border-t text-[11px] font-medium truncate text-muted-foreground bg-card/80">
                          {att.fileName || "Attachment"}
                        </div>

                        {/* Hover Overlay with Preview, Download & Delete */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                          {proxied && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewUrl(proxied); setPreviewName(att.fileName || "Attachment"); }}
                              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform hover:scale-110"
                              title="Preview"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void downloadViaUrl(proxied, att.fileName || "download"); }}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform hover:scale-110"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteProjectAttachmentIndex(idx); }}
                            className="p-1.5 bg-rose-600/80 hover:bg-rose-600 rounded-full text-white transition-transform hover:scale-110"
                            title="Delete file from project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground pt-3 border-t border-border/40">
              <div className="flex items-center gap-4">
                <span>{selectedProject.tasks.length} tasks</span>
                {(() => {
                  const projectAtts = getAttachmentCounts(selectedProject.attachments);
                  const taskAtts = (selectedProject.tasks || []).reduce((acc, t) => {
                    const { images, files } = getAttachmentCounts(t.attachments, t.attachment);
                    return { images: acc.images + images, files: acc.files + files };
                  }, { images: 0, files: 0 });
                  
                  const images = projectAtts.images + taskAtts.images;
                  const files = projectAtts.files + taskAtts.files;
                  
                  return (images > 0 || files > 0) && (
                    <div className="flex items-center gap-3 border-l pl-4 border-border/40">
                      {images > 0 && (
                        <span className="flex items-center gap-1.5 text-primary font-semibold" title={`${projectAtts.images} from project, ${taskAtts.images} from tasks`}>
                          <Paperclip className="w-3.5 h-3.5" /> {images} Image{images !== 1 ? "s" : ""}
                        </span>
                      )}
                      {files > 0 && (
                        <span className="flex items-center gap-1.5 text-indigo-600 font-semibold" title={`${projectAtts.files} from project, ${taskAtts.files} from tasks`}>
                          <FileText className="w-3.5 h-3.5" /> {files} File{files !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedProject.status || "No status"} onValueChange={(value) => {
                  updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: value }, {
                    onSuccess: () => {
                      setSelectedProject({ ...selectedProject, status: value });
                    }
                  });
                }}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No tasks">No tasks</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs">{selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : ""}</span>
              </div>
            </div>
          </div>

          {/* Project Cost Manager Link */}
          <ProjectCostSheetLink
            projectId={selectedProject.id}
            onOpenSheet={(id, name) => {
              setCostManagerModalSheetId(id);
              setCostManagerModalSheetName(name);
              setCostManagerModalOpen(true);
            }}
          />
        </div>
      ) : (
        <>
          {/* Projects Section */}
          {(activeTab === "all" || activeTab === "projects") && (
            <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h2 className="font-semibold text-lg">
                  Projects ({projectsQuery.data?.items.length ? `${(projectPage - 1) * PAGE_SIZE + 1} - ${(projectPage - 1) * PAGE_SIZE + projectsQuery.data.items.length}` : "0"} of {projectsQuery.data?.totalItems || 0})
                </h2>
                <div className="relative w-full sm:w-64 hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-10 h-9 w-full"
                    value={projectSearchQuery}
                    onChange={(e) => { setProjectSearchQuery(e.target.value); setProjectPage(1); }}
                  />
                </div>
              </div>
              {projectsQuery.isLoading ? (
                <p className="text-muted-foreground">Loading projects...</p>
              ) : projectsQuery.isError ? (
                <p className="text-destructive">{(() => { const msg = projectsQuery.error instanceof Error ? projectsQuery.error.message : "Failed to load projects"; return msg.startsWith("<") ? "Server error: failed to load projects. The server may be temporarily unavailable (504 Gateway Timeout). Please try again later." : msg; })()}</p>
              ) : filteredProjects.length === 0 ? (
                <p className="text-muted-foreground">{(projectSearchQuery || assigneeFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all" || assignmentFilter !== "all") ? "No projects match your filter criteria." : "No projects found. Create one to begin."}</p>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project, idx) => {
                      const assigneeList = Array.isArray(project.assignees) && project.assignees.length > 0 ? project.assignees : [];
                      const taskNum = project.taskCount ?? 0;
                      const projectLetter = String.fromCharCode(65 + (idx % 26));
                      const projectNumber = (projectPage - 1) * PAGE_SIZE + idx + 1;
                      return (
                        <div
                          key={project.id}
                          className="relative text-left p-3 sm:p-4 rounded-lg border border-border hover:border-primary transition bg-card shadow-sm hover:shadow-card w-full group"
                        >
                          <button
                            onClick={() => void loadProject(project.id, project)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex-shrink-0 text-xs font-bold text-primary w-fit text-right min-w-[20px]">{projectNumber}.</span>
                              <ProjectLogoImg projectId={project.id} projectName={project.name} logoUrl={project.logo?.url} />
                              <div className="min-w-0 flex-1 pr-8">
                                <p className="font-medium truncate">{project.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{project.description || "No description"}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground mb-3 bg-muted/20 p-2 rounded-lg gap-2">
                              <span className="truncate flex-1 font-medium flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-primary/60" />
                                {assigneeList.length} Assignee{assigneeList.length === 1 ? "" : "s"}
                              </span>
                              <span className="flex-shrink-0 font-medium flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" />
                                {taskNum} task{taskNum === 1 ? "" : "s"}
                              </span>
                              {(() => {
                                const projectAtts = getAttachmentCounts(project.attachments);
                                const taskAtts = project.taskAttachmentStats || { images: 0, files: 0 };
                                const images = projectAtts.images + taskAtts.images;
                                const files = projectAtts.files + taskAtts.files;
                                
                                return (images > 0 || files > 0) && (
                                  <div className="flex items-center gap-2 w-full pt-1.5 border-t border-border/40">
                                    {images > 0 && (
                                      <span className="flex items-center gap-1 text-primary/70" title={`${projectAtts.images} from project, ${taskAtts.images} from tasks`}>
                                        <Paperclip className="w-3 h-3" /> {images}
                                      </span>
                                    )}
                                    {files > 0 && (
                                      <span className="flex items-center gap-1 text-indigo-600/70" title={`${projectAtts.files} from project, ${taskAtts.files} from tasks`}>
                                        <FileText className="w-3 h-3" /> {files}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Badge className="capitalize" variant="outline">{project.status || "No tasks"}</Badge>
                              <span className="text-muted-foreground text-xs">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                          </button>

                          {/* Three dots menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(project);
                                  setEditProjectName(project.name);
                                  setEditProjectDescription(project.description || "");
                                  setEditProjectIntroVideoUrl(project.introVideoUrl || "");
                                  setEditProjectLogoPreview(project.logo?.url || "");
                                  setEditProjectLogoFile(null);
                                  setIsEditProjectOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReassigningProject(project);
                                  setReassignProjectAssignees(project.assignees || []);
                                  setIsReassignProjectOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Reassign
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(project);
                                  setIsDeleteProjectOpen(true);
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    currentPage={projectPage}
                    totalPages={projectTotalPages}
                    onPageChange={setProjectPage}
                    className="mt-6"
                  />
                </>
              )}
            </div>
          )}

          {/* Tasks Section */}
          {(activeTab === "all" || activeTab === "tasks") && (
            <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
              <h2 className="font-semibold text-lg mb-3">
                Tasks ({tasksQuery.data?.items.length ? `${(taskPage - 1) * PAGE_SIZE + 1} - ${(taskPage - 1) * PAGE_SIZE + tasksQuery.data.items.length}` : "0"} of {tasksQuery.data?.totalItems || 0})
              </h2>
              {tasksQuery.isLoading ? (
                <p className="text-muted-foreground">Loading tasks...</p>
              ) : tasksQuery.isError ? (
                <p className="text-destructive">Failed to load tasks</p>
              ) : filteredStandaloneTasks.length === 0 ? (
                <p className="text-muted-foreground">{projectSearchQuery ? "No tasks match your search." : "No standalone tasks found. Create one to begin."}</p>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredStandaloneTasks.map((task, idx) => {
                      const assigneeList = Array.isArray(task.assignees) && task.assignees.length > 0 ? task.assignees : [];
                      const taskLetter = String.fromCharCode(65 + (idx % 26));
                      const taskNumber = task.taskNumber ?? ((taskPage - 1) * PAGE_SIZE + idx + 1);
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "relative text-left p-3 sm:p-4 rounded-lg border transition w-full group",
                            priorityModeEnabled && "cursor-pointer hover:border-orange-500 hover:ring-2 hover:ring-orange-500/20",
                            !priorityModeEnabled && "border-border hover:border-primary bg-card shadow-sm hover:shadow-card",
                            task.executionPriority && "border-orange-400 bg-orange-50/10 dark:bg-orange-950/10"
                          )}
                          onClick={(e) => {
                            if (priorityModeEnabled) {
                              void handleTaskPriorityClick(task, e);
                            }
                          }}
                        >
                          <button
                            onClick={(e) => {
                              if (!priorityModeEnabled) {
                                openView(task);
                              } else {
                                e.stopPropagation();
                                void handleTaskPriorityClick(task, e);
                              }
                            }}
                            className="w-full text-left"
                          >
                            {/* Execution Priority Badge */}
                            {task.executionPriority && (
                              <div className="absolute -top-2 -left-2 z-10">
                                <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                  <Flame className="w-3 h-3" />
                                  #{task.executionPriority}
                                </div>
                              </div>
                            )}
                            {priorityModeEnabled && !task.executionPriority && (
                              <div className="absolute -top-2 -left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full border border-dashed border-muted-foreground/30">
                                  <Flame className="w-3 h-3" />
                                  Click to assign
                                </div>
                              </div>
                            )}
                            <div className="mb-2 pr-8">
                              <p className="font-medium truncate text-sm">
                                <span className="text-primary mr-1">{taskNumber}.</span>
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p>
                            </div>
                            {(() => {
                              const allAtts = Array.isArray(task.attachments) ? [...task.attachments] : [];
                              if (task.attachment?.url && !allAtts.some(a => a.url === task.attachment.url)) {
                                allAtts.unshift(task.attachment);
                              }
                              const imgAtt = allAtts.find(a => a.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.fileName || ""));
                              if (!imgAtt) return null;
                              return (
                                <div className="mb-2 rounded-md overflow-hidden border border-border/50 h-24 bg-muted/20">
                                  <TaskAttachmentImg
                                    taskId={task.id}
                                    attachmentUrl={imgAtt.url}
                                    onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }}
                                  />
                                </div>
                              );
                            })()}
                            {/* Attachment indicators */}
                            {(task.dropboxAttachmentCount && task.dropboxAttachmentCount > 0) ? (
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded w-fit border border-blue-500/20">
                                  <DropboxIcon size={9} />
                                  {task.dropboxAttachmentCount} file{task.dropboxAttachmentCount > 1 ? "s" : ""}
                                </div>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground mb-3 gap-2">
                              <span className="truncate flex-1 font-medium flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {assigneeList.length === 1 ? assigneeList[0] : `${assigneeList.length} persons`}
                              </span>
                              {(() => {
                                const { images, files } = getAttachmentCounts(task.attachments, task.attachment);
                                return (images > 0 || files > 0) && (
                                  <div className="flex items-center gap-2">
                                    {images > 0 && (
                                      <span className="flex items-center gap-1 text-primary font-bold">
                                        <Paperclip className="w-3.5 h-3.5" /> {images}
                                      </span>
                                    )}
                                    {files > 0 && (
                                      <span className="flex items-center gap-1 text-indigo-600 font-bold">
                                        <FileText className="w-3.5 h-3.5" /> {files}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                              <div className="flex gap-1 flex-wrap">
                                <Badge
                                  className={cn(
                                    "capitalize text-xs relative overflow-hidden",
                                    task.status === 'completed' && "task-complete-pulse"
                                  )}
                                  variant="outline"
                                  style={{
                                    backgroundColor: task.priority === 'high' ? 'rgb(239, 68, 68)' : task.priority === 'medium' ? 'rgb(234, 179, 8)' : 'rgb(34, 197, 94)',
                                    color: 'white'
                                  }}
                                >
                                  {task.priority}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "capitalize text-xs relative overflow-hidden",
                                    task.status === 'completed' && "bg-green-500 text-white border-green-500"
                                  )}
                                  variant="outline"
                                >
                                  <span className="relative z-10">{task.status}</span>
                                  {task.status === 'completed' && (
                                    <>
                                      {/* Neon pulse ring - 600ms */}
                                      <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                                      {/* Electric streak - 300ms */}
                                      <span className="absolute inset-0 animate-electric-streak" />
                                      {/* Particle shimmer - <1s */}
                                      <span className="absolute inset-0 animate-particle-shimmer" />
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground text-xs whitespace-nowrap">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                              </span>
                            </div>
                          </button>

                          {/* Three dots menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleToggleTaskComplete(task, e);
                                }}
                                className="cursor-pointer font-medium"
                              >
                                {task.status === "completed" ? (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2 text-amber-500" />
                                    Mark as Incomplete
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                    Mark as Complete
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openView(task);
                                }}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handlePrintTask(task);
                                }}
                                className="cursor-pointer"
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReassigningTask(task);
                                  setReassignTaskAssignees(task.assignees || []);
                                  setIsReassignTaskOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Reassign
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(task);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDelete(task);
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    currentPage={taskPage}
                    totalPages={taskTotalPages}
                    onPageChange={setTaskPage}
                    className="mt-6"
                  />
                </>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent 
          className="w-[95vw] max-w-[95vw] sm:max-w-[620px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a project and assign it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); void handleCreateProject(); }} className="space-y-4">
            {/* ... form fields remain same ... */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Name *</label>
                <div className="flex gap-2">
                  <Input placeholder="Project name" value={projectName} onChange={(e) => { setProjectName(e.target.value); if (validationErrors.projectName) { setValidationErrors({ ...validationErrors, projectName: undefined }); } }} className={cn("flex-1", validationErrors.projectName ? "border-destructive ring-1 ring-destructive" : "")} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Add Emoji">
                        <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 z-[150]" align="end">
                      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {["📁", "🚀", "💻", "🎨", "📈", "⚙️", "🔧", "💡", "📅", "✏️", "🔥", "✨", "🌟", "🎯", "🏆", "🔒", "🔑", "📦", "📝", "📊", "💰", "📢", "💬", "❤️", "👍", "🍀", "🌍", "🍕", "☕", "🎮", "🎵", "🚗", "🏠", "🏢"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setProjectName((prev) => emoji + " " + prev);
                            }}
                            className="p-1.5 hover:bg-muted rounded text-lg text-center transition-all duration-100 hover:scale-110 active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {validationErrors.projectName && <p className="text-xs text-destructive">{validationErrors.projectName}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Description</label>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <Textarea 
                      placeholder="Short project description" 
                      className="min-h-[80px] w-full resize-y" 
                      value={projectDescription} 
                      onChange={(e) => setProjectDescription(e.target.value)}
                      spellCheck="true"
                      autoCorrect="on"
                      autoComplete="on"
                    />
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto sm:pb-0.5">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="flex-1 sm:w-32">Cancel</Button>
                    <Button type="submit" disabled={isCreating} className="flex-1 sm:w-32 gap-2">{isCreating && <Loader2 className="h-4 w-4 animate-spin" />}Create Project</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Intro Video</label>
                <VideoUploadField value={projectIntroVideoUrl} onChange={setProjectIntroVideoUrl} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Logo</label>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted" onClick={() => { const el = document.getElementById("project-logo-input") as HTMLInputElement | null; el?.click(); }}>Upload Logo</button>
                  <button
                    type="button"
                    onClick={() => setIsProjectLogoPickerOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-500/20 transition-all text-xs font-medium"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Pick from Images
                  </button>
                  {projectLogoPreview ? <img src={projectLogoPreview} alt="Project Logo" className="w-10 h-10 rounded-md object-cover" /> : <div className="w-10 h-10 rounded-md bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">No logo</div>}
                </div>
                <input id="project-logo-input" type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0] ?? null; if (file) { const compressed = await resizeImageIfNeeded(file, 400, 400, 0.85); setProjectLogoFile(compressed); const reader = new FileReader(); reader.onload = () => { setProjectLogoPreview(typeof reader.result === "string" ? reader.result : ""); }; reader.readAsDataURL(compressed); } else { setProjectLogoFile(null); setProjectLogoPreview(""); } }} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Attachments</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button type="button" className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted flex-1" onClick={() => { const el = document.getElementById("project-attachments-input") as HTMLInputElement | null; el?.click(); }}>+ Add Files/Images</button>
                    {ROLE_GROUPS.DROPBOX_ALLOWED.includes(currentRole) && (
                      <button type="button" className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted flex-1 flex items-center justify-center gap-2" onClick={() => { setDropboxPickerTarget("project"); setIsDropboxPickerOpen(true); }}>
                        <DropboxIcon size={14} />Dropbox
                      </button>
                    )}
                  </div>
                  <input id="project-attachments-input" type="file" accept="*" multiple className="hidden" onChange={async (e) => {
  const files = Array.from(e.target.files ?? []);
  if (!files.length) return;
  const processedFiles = await Promise.all(files.map(async (f) => {
    if (f.type.startsWith("image/")) return await resizeImageIfNeeded(f, 1200, 1200, 0.8);
    return f;
  }));
  const previews = await Promise.all(processedFiles.map(file => new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.readAsDataURL(file);
    } else resolve("");
  })));
  setProjectAttachmentFiles((prev) => [...prev, ...processedFiles]);
  setProjectAttachmentPreviews((prev) => [...prev, ...previews]);
  e.target.value = "";
}} />
                  {projectAttachmentFiles.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-md p-2">{projectAttachmentFiles.map((file, idx) => (<div key={idx} className="relative group">{projectAttachmentPreviews[idx] ? (<img src={projectAttachmentPreviews[idx]} alt={file.name} className="w-full h-20 object-cover rounded-md" />) : (<div className="w-full h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground truncate px-2">📄 {file.name}</div>)}<button type="button" onClick={() => { setProjectAttachmentFiles((prev) => prev.filter((_, i) => i !== idx)); setProjectAttachmentPreviews((prev) => prev.filter((_, i) => i !== idx)); }} className="absolute top-0 right-0 bg-destructive/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button></div>))}</div>)}
                  {projectDropboxSelectedFiles.length > 0 && (
                    <div className="border border-border rounded-md p-2 space-y-1.5 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><DropboxIcon size={12} />Dropbox Files (External)</p>
                      {projectDropboxSelectedFiles.map((dbf, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-background rounded-md px-2.5 py-1.5 border border-border text-sm">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="flex-1 truncate text-foreground">{dbf.file_name}</span>
                          <span className="text-xs text-muted-foreground">{dbf.file_size > 0 ? formatBytes(dbf.file_size) : ""}</span>
                          <button type="button" onClick={() => setProjectDropboxSelectedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive transition-colors">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
               <div className="space-y-1.5">
                <label className="text-sm font-medium">Team Lead (Optional)</label>
                <Popover open={projectTeamLeadPopoverOpen} onOpenChange={setProjectTeamLeadPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between h-10">
                      <span className="truncate">{projectTeamLead || "Select team lead"}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" collisionPadding={20}>
                    <Command className="h-full">
                      <CommandInput placeholder="Search team lead..." />
                      <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem 
                            value="" 
                            onSelect={() => { 
                              setProjectTeamLead(""); 
                              setProjectTeamLeadPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", projectTeamLead === "" ? "opacity-100" : "opacity-0")} />
                            <span className="text-muted-foreground">None</span>
                          </CommandItem>
                          {activeEmployees.map((employee) => (
                            <CommandItem 
                              key={employee.id} 
                              value={employee.name} 
                              onSelect={() => { 
                                setProjectTeamLead(employee.name);
                                setProjectTeamLeadPopoverOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", projectTeamLead === employee.name ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                {employee.avatarDataUrl || employee.avatarUrl ? (
                                  <img src={employee.avatarDataUrl || employee.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials || employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                )}
                              </Avatar>
                              {employee.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Assignees</label>
                <Popover open={projectCreationAssigneesOpen} onOpenChange={setProjectCreationAssigneesOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between h-10">
                      <span className="truncate">{projectCreationAssignees.length > 0 ? projectCreationAssignees.join(", ") : "Select assignees"}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" collisionPadding={20}>
                    <Command className="h-full">
                      <CommandInput placeholder="Search employees..." />
                      <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {activeEmployees.map((employee) => (
                            <CommandItem 
                              key={employee.id} 
                              value={employee.name} 
                              onSelect={() => { 
                                setProjectCreationAssignees((prev) => 
                                  prev.includes(employee.name) 
                                    ? prev.filter((name) => name !== employee.name) 
                                    : [...prev, employee.name]
                                ); 
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", projectCreationAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                {employee.avatarDataUrl || employee.avatarUrl ? (
                                  <img src={employee.avatarDataUrl || employee.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials || employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                )}
                              </Avatar>
                              {employee.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><label className="text-sm font-medium">Project Tasks</label><Button type="button" size="sm" onClick={() => setIsCreateTaskOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Task</Button></div>
              {projectTasks.length > 0 ? (<div className="space-y-2 max-h-[300px] overflow-y-auto border border-border rounded-md p-3">{projectTasks.map((task, idx) => (<div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-3 p-2 bg-muted/50 rounded-md"><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{task.title || `Task ${idx + 1}`}</p><p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p><div className="flex gap-2 mt-1 flex-wrap text-xs"><span className="px-2 py-0.5 bg-muted rounded capitalize">{task.priority}</span><span className="px-2 py-0.5 bg-muted rounded capitalize">{task.status}</span></div></div><Button type="button" variant="ghost" size="sm" onClick={() => { setProjectTasks((prev) => prev.filter((_, i) => i !== idx)); }} className="h-8 w-8 p-0 flex-shrink-0 self-start"><X className="h-4 w-4" /></Button></div>))}</div>) : (<div className="border border-dashed border-border rounded-md p-4 text-center text-sm text-muted-foreground">No tasks added yet. You can create the project and add tasks later.</div>)}
              {validationErrors.title && <p className="text-xs text-destructive">{validationErrors.title}</p>}
            </div>
            
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog - same as before */}
      <Dialog open={isCreateTaskOpen} onOpenChange={(open) => { setIsCreateTaskOpen(open); if (!open) setIsDirectTask(false); }}>
        <DialogContent 
          className="w-[95vw] max-w-[95vw] sm:max-w-[620px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader><DialogTitle>{isDirectTask ? "Create Standalone Task" : "Create Task"}</DialogTitle><DialogDescription>{isDirectTask ? "Create a new standalone task without a project." : "Create a new task under the selected project."}</DialogDescription></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); void (isCreateOpen ? addTaskToProject() : handleCreateTask()); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Task Title *</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  spellCheck="true"
                  autoCorrect="on"
                  autoComplete="on"
                />
                {validationErrors.title && <p className="text-xs text-destructive">{validationErrors.title}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Task Description *</label>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      spellCheck="true"
                      autoCorrect="on"
                      autoComplete="on"
                      className="min-h-[80px] w-full resize-y"
                    />
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto sm:pb-0.5">
                    <Button type="button" variant="outline" onClick={() => { setIsCreateTaskOpen(false); setIsDirectTask(false); }} disabled={isCreating} className="flex-1 sm:w-32">Cancel</Button>
                    <Button type="submit" disabled={isCreating} className="flex-1 sm:w-32 gap-2">
                      {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create Task
                    </Button>
                  </div>
                </div>
                {validationErrors.description && <p className="text-xs text-destructive">{validationErrors.description}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Assignees</label>
                <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between h-10">
                      <span className="truncate">{selectedAssignees.length > 0 ? selectedAssignees.join(", ") : "Select assignees"}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] max-w-[380px] p-0 z-[150]" align="start" collisionPadding={20}>
                    <Command>
                      <CommandInput placeholder="Search employees..." />
                      <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {activeEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={`${employee.name} ${employee.role || ""} ${employee.department || ""} ${employee.email || ""}`}
                              onSelect={() => {
                                setSelectedAssignees((prev) =>
                                  prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]
                                );
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4 shrink-0", selectedAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2 shrink-0">
                                {(employee.avatarDataUrl || employee.avatarUrl) ? (
                                  <img src={employee.avatarDataUrl || employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{employee.initials}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate text-sm font-medium">{employee.name}</span>
                                {(employee.role || employee.department || employee.email) && (
                                  <span className="truncate text-[11px] text-muted-foreground">
                                    {[employee.role, employee.department || employee.email].filter(Boolean).join(" • ")}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Team Lead (Optional)</label>
                <Popover open={taskTeamLeadPopoverOpen} onOpenChange={setTaskTeamLeadPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between h-10">
                      <span className="truncate">{taskTeamLead || "Select team lead"}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] max-w-[380px] p-0 z-[150]" align="start" collisionPadding={20}>
                    <Command>
                      <CommandInput placeholder="Search team lead..." />
                      <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="" onSelect={() => { setTaskTeamLead(""); setTaskTeamLeadPopoverOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", taskTeamLead === "" ? "opacity-100" : "opacity-0")} />
                            <span className="text-muted-foreground">None</span>
                          </CommandItem>
                          {activeEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={`${employee.name} ${employee.role || ""} ${employee.department || ""} ${employee.email || ""}`}
                              onSelect={() => { setTaskTeamLead(employee.name); setTaskTeamLeadPopoverOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4 shrink-0", taskTeamLead === employee.name ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2 shrink-0">
                                {(employee.avatarDataUrl || employee.avatarUrl) ? (
                                  <img src={employee.avatarDataUrl || employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{employee.initials}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate text-sm font-medium">{employee.name}</span>
                                {(employee.role || employee.department || employee.email) && (
                                  <span className="truncate text-[11px] text-muted-foreground">
                                    {[employee.role, employee.department || employee.email].filter(Boolean).join(" • ")}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="sm:col-span-1 space-y-1.5"><label className="text-sm font-medium">Priority</label><Select value={formData.priority} onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as Task['priority'] }))}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
              <div className="sm:col-span-1 space-y-1.5"><label className="text-sm font-medium">Status</label><Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as Task['status'] }))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select></div>
              <div className="sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">Due Date (Optional)</label>
                <Input 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))} 
                />
              </div>
              <div className="sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">Due Time (Optional)</label>
                <Input 
                  type="time" 
                  value={formData.dueTime} 
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueTime: e.target.value }))} 
                />
              </div>
            </div>
            
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Task Video</label>
              <VideoUploadField value={formData.introVideoUrl || ""} onChange={(val) => setFormData((prev) => ({ ...prev, introVideoUrl: val }))} />
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label><div className="space-y-2"><div className="flex gap-2"><button type="button" className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted flex-1" onClick={() => { const el = document.getElementById("task-attachments-input") as HTMLInputElement | null; el?.click(); }}>+ Add Files/Images</button>{ROLE_GROUPS.DROPBOX_ALLOWED.includes(currentRole) && (<button type="button" className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted flex-1 flex items-center justify-center gap-2" onClick={() => { setDropboxPickerTarget("task"); setIsDropboxPickerOpen(true); }}><DropboxIcon size={14} />Dropbox</button>)}</div><input id="task-attachments-input" type="file" accept="*" multiple className="hidden" onChange={async (e) => {
  const files = Array.from(e.target.files ?? []);
  if (!files.length) return;
  const processedFiles = await Promise.all(files.map(async (f) => {
    if (f.type.startsWith("image/")) return await resizeImageIfNeeded(f, 1200, 1200, 0.8);
    return f;
  }));
  const previews = await Promise.all(processedFiles.map(file => new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.readAsDataURL(file);
    } else resolve("");
  })));
  setAttachmentFiles((prev) => [...prev, ...processedFiles]);
  setAttachmentFilePreviews((prev) => [...prev, ...previews]);
  e.target.value = "";
}} />{attachmentFiles.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-md p-2">{attachmentFiles.map((file, idx) => (<div key={idx} className="relative group">{attachmentFilePreviews[idx] ? (<img src={attachmentFilePreviews[idx]} alt={file.name} className="w-full h-20 object-cover rounded-md" />) : (<div className="w-full h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground truncate px-2">📄 {file.name}</div>)}<button type="button" onClick={() => { setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx)); setAttachmentFilePreviews((prev) => prev.filter((_, i) => i !== idx)); }} className="absolute top-0 right-0 bg-destructive/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button></div>))}</div>)}{dropboxSelectedFiles.length > 0 && (<div className="border border-border rounded-md p-2 space-y-1.5 bg-muted/30"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><DropboxIcon size={12} />Dropbox Files (External)</p>{dropboxSelectedFiles.map((dbf, idx) => (<div key={idx} className="flex items-center gap-2 bg-background rounded-md px-2.5 py-1.5 border border-border text-sm"><FileText className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="flex-1 truncate text-foreground">{dbf.file_name}</span><span className="text-xs text-muted-foreground">{dbf.file_size > 0 ? formatBytes(dbf.file_size) : ""}</span><button type="button" onClick={() => setDropboxSelectedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive transition-colors">✕</button></div>))}</div>)}</div></div>
            
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent 
          className="w-[98vw] max-w-[1100px] h-[90vh] flex flex-col overflow-hidden rounded-xl p-0 gap-0 border-0 shadow-2xl"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          {selectedTask && (
            <>
              {/* Visually hidden for accessibility */}
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedTask.title}</DialogTitle>
                <DialogDescription>{selectedTask.description || "Task details and activity"}</DialogDescription>
              </DialogHeader>
              {/* Asana-style Header: Status Badge and Actions */}
              <div className="flex items-center justify-between p-3 border-b bg-background z-10 shrink-0">
                <div className="flex items-center gap-3 ml-2">
                  <Badge variant="outline" className={cn("capitalize px-3 py-1 font-semibold rounded-full border-2 cursor-pointer transition-colors hover:opacity-80", selectedTask.status === "completed" ? "border-green-500 text-green-700 bg-green-50" : selectedTask.status === "in-progress" ? "border-blue-500 text-blue-700 bg-blue-50" : selectedTask.status === "overdue" ? "border-red-500 text-red-700 bg-red-50" : "border-amber-500 text-amber-700 bg-amber-50")} onClick={() => {
                    const next: Record<string, Task["status"]> = {
                      "pending": "in-progress",
                      "in-progress": "completed",
                      "completed": "pending",
                      "overdue": "completed"
                    };
                    const nextStatus = next[selectedTask.status] || "pending";
                    if (nextStatus === "completed") {
                      setConfirmCompleteTask(selectedTask);
                    } else {
                      void updateStatus(nextStatus, (e as any));
                    }
                  }}>
                    {selectedTask.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : selectedTask.status === "overdue" ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                    {selectedTask.status}
                  </Badge>
                </div>
                {/* We leave space for standard dialog close X button, so add marginRight */}
                <div className="flex items-center gap-1.5 mr-10">
                  {taskViewEdited && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={async () => {
                        try {
                          await updateTaskMutation.mutateAsync({
                            id: selectedTask.id,
                            payload: { title: taskViewTitle, description: taskViewDesc }
                          });
                          setTaskViewEdited(false);
                          toast({ title: "Task updated" });
                        } catch (err) {
                          toast({ title: "Update failed", variant: "destructive" });
                        }
                      }}
                      disabled={updateTaskMutation.isPending || !taskViewTitle.trim()}
                    >
                      {updateTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                      Save
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => void handlePrintTask(selectedTask)} title="Print Task"><Printer className="w-4 h-4 mr-1.5 hidden sm:block" /> Print</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsViewOpen(false); openEdit(selectedTask); }} title="Edit Task"><Edit className="w-4 h-4 mr-1.5 hidden sm:block" /> Edit</Button>
                </div>

                {/* Close button - top right */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 hover:bg-muted"
                  onClick={() => setIsViewOpen(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 2-Pane Body */}
              <div className="flex-1 flex flex-col lg:flex-row shadow-inner overflow-hidden relative bg-background">

                {/* Left Pane: Title, Description, Attachments, Comments Feed */}
                <div className="flex-1 overflow-y-auto w-full lg:w-2/3 p-5 sm:p-8 space-y-8 scroll-smooth pb-24">
                  {/* Task Title */}
                  <div className="group/title relative">
                    <Input
                      className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight break-words bg-transparent border-transparent hover:border-border focus:border-primary focus:ring-0 px-1 -ml-1 h-auto py-1 shadow-none transition-all"
                      value={taskViewTitle}
                      onChange={(e) => {
                        setTaskViewTitle(e.target.value);
                        setTaskViewEdited(true);
                      }}
                      placeholder="Task Title"
                      spellCheck="true"
                    />
                  </div>

                  {/* Mobile Status - Only visible on mobile */}
                  <div className="lg:hidden space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Status</label>
                    <Select value={selectedTask.status} onValueChange={async (v) => { await updateStatus(v as Task["status"]); }} disabled={statusSaving}>
                      <SelectTrigger className={cn("h-9 font-medium text-xs bg-background border-border/60", statusClasses[selectedTask.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending","in-progress","completed","overdue"].map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            <span className="flex items-center gap-2">
                              <span className={cn("inline-block w-2 h-2 rounded-full", {
                                "bg-slate-400": s === "pending",
                                "bg-amber-500": s === "in-progress",
                                "bg-emerald-600": s === "completed",
                                "bg-red-500": s === "overdue",
                              })} />
                              {s === "pending" && "Pending"}
                              {s === "in-progress" && "In Progress"}
                              {s === "completed" && "Completed"}
                              {s === "overdue" && "Overdue"}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Task Description */}
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Description</h4>
                    <Textarea
                      className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words border border-border/60 rounded-xl p-4 sm:p-5 bg-muted/10 shadow-sm min-h-[150px] focus:bg-background transition-colors focus:ring-2 focus:ring-primary/10"
                      value={taskViewDesc}
                      onChange={(e) => {
                        setTaskViewDesc(e.target.value);
                        setTaskViewEdited(true);
                      }}
                      placeholder="Add a detailed description..."
                      spellCheck="true"
                      autoCorrect="on"
                    />
                  </div>

                  {/* Task Cost Manager Link */}
                  <TaskCostSheetLink
                    taskId={selectedTask.id}
                    onOpenSheet={(id, name) => {
                      setCostManagerModalSheetId(id);
                      setCostManagerModalSheetName(name);
                      setCostManagerModalOpen(true);
                    }}
                  />

                  {/* Task Video */}
                  {selectedTask.introVideoUrl && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Video className="w-4 h-4" /> Video</h4>
                      {/youtube\.com|youtu\.be|vimeo\.com/i.test(selectedTask.introVideoUrl) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(selectedTask.introVideoUrl, "_blank")}
                        >
                          <Video className="w-4 h-4" /> Watch Video
                        </Button>
                      ) : (
                        <video
                          src={toProxiedUrl(selectedTask.introVideoUrl) || selectedTask.introVideoUrl}
                          controls
                          className="w-full max-h-[320px] object-contain rounded-xl border border-border/60 bg-black"
                        />
                      )}
                    </div>
                  )}

                  {/* Task Start/Close Timeline */}
                  <TaskTimeline task={selectedTask} />

                  {/* Task Attachments Grid */}
                  {((selectedTask.attachments && selectedTask.attachments.length > 0) || selectedTask.attachment?.fileName) && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attached Files</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                        {selectedTask.attachments && selectedTask.attachments.length > 0
                          ? selectedTask.attachments.map((attachment, idx) => {
                            const taskImageGallery = (selectedTask.attachments || [])
                              .filter((a) => a.url && (a.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.fileName || "")))
                              .map((a) => ({ url: toProxiedUrl(a.url) || a.url, name: a.fileName || "Attachment" }));
                            return (
                            <div key={idx} className="relative group">
                              <TaskAttachmentItem attachment={attachment} onPreview={(url, fileName) => openImagePreview(url, fileName, taskImageGallery)} />
                              <div className="p-2 border-t text-[11px] font-medium truncate text-muted-foreground">{attachment.fileName}</div>

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openImagePreview(toProxiedUrl(attachment.url) || attachment.url, attachment.fileName || "Attachment", taskImageGallery); }}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                  title="Preview"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); void downloadTaskAttachment(selectedTask.id, idx, attachment.fileName || "download"); }}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setConfirmArchiveAttachmentIndex(idx); }} 
                                disabled={archivingAttachment === idx} 
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600/90 hover:bg-rose-700 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10 hover:scale-105" 
                                title="Delete attachment from task"
                              >
                                {archivingAttachment === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          );
                          })
                          : selectedTask.attachment?.fileName ? (
                            <div className="relative group rounded-lg overflow-hidden border border-border/60 bg-background shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" onClick={() => { if (selectedTask.attachment?.url) { setPreviewUrl(toProxiedUrl(selectedTask.attachment.url) || selectedTask.attachment.url); setPreviewName(selectedTask.attachment.fileName || "Attachment"); } }}>
                              {selectedTask.attachment.mimeType?.startsWith("image/") && selectedTask.attachment.url ? (
                                <img src={toProxiedUrl(selectedTask.attachment.url) || selectedTask.attachment.url} alt={selectedTask.attachment.fileName || "Attachment"} className="w-full h-24 object-cover" />
                              ) : (
                                <div className="w-full h-24 flex items-center justify-center bg-muted/40"><FileText className="h-8 w-8 text-muted-foreground/60" /></div>
                              )}
                              <div className="p-2 border-t text-[11px] font-medium truncate text-muted-foreground">{selectedTask.attachment.fileName}</div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(toProxiedUrl(selectedTask.attachment!.url) || selectedTask.attachment!.url); setPreviewName(selectedTask.attachment!.fileName || "Attachment"); }}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                  title="Preview"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); void downloadTaskAttachment(selectedTask.id, -1, selectedTask.attachment?.fileName || "download"); }}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setConfirmArchiveAttachmentIndex(-1); }} 
                                disabled={archivingAttachment === -1} 
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600/90 hover:bg-rose-700 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10 hover:scale-105" 
                                title="Delete attachment from task"
                              >
                                {archivingAttachment === -1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          ) : null}
                      </div>
                    </div>
                  )}

                  {/* Dropbox (External) Attachments */}
                  {viewDropboxAttachments.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <DropboxIcon size={14} className="flex-shrink-0" />
                        Dropbox Files
                      </h4>
                      <div className="space-y-2 bg-muted/20 border border-border/50 rounded-xl p-3">
                        {viewDropboxAttachments.map((dbAtt) => (
                          <button
                            key={dbAtt.id}
                            type="button"
                            onClick={() => void openDropboxFile(dbAtt.dropbox_path)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
                            aria-label={`Open ${dbAtt.file_name} from Dropbox`}
                            title={dbAtt.file_name}
                          >
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{dbAtt.file_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">External File</span>
                                {dbAtt.file_size > 0 && <span className="text-[10px] text-muted-foreground">{formatBytes(dbAtt.file_size)}</span>}
                                {dbAtt.file_type && <span className="text-[10px] text-muted-foreground">{dbAtt.file_type.split('/').pop()?.toUpperCase()}</span>}
                              </div>
                            </div>
                            <DropboxIcon size={12} className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Dropbox loading state */}
                  {loadingDropboxAttachments && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2" role="status">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading Dropbox attachments...
                    </div>
                  )}
                  {/* Dropbox error state — shows when fetch fails */}
                  {dropboxAttachmentsError && !loadingDropboxAttachments && viewDropboxAttachments.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <DropboxIcon size={12} className="opacity-40" />
                      <span className="text-destructive/70">Couldn't load external files</span>
                    </div>
                  )}

                  {/* Activity Thread */}
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Activity Feed
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => { if (selectedTask) void loadComments(selectedTask.id); }} disabled={commentsLoading} className="h-7 px-2 text-[11px] gap-1 hover:bg-muted/50">
                          <RefreshCw className={cn("w-3 h-3", commentsLoading && "animate-spin")} /> Refresh
                        </Button>
                        <Button type="button" variant={autoRefreshEnabled ? "secondary" : "ghost"} size="sm" onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)} className="h-7 px-2 text-[11px] gap-1 hover:bg-muted/50 rounded-full">
                          <Clock className="w-3 h-3" /> Auto Update {autoRefreshEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>

                    {commentError && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 mb-4 flex items-center gap-2 max-w-fit">
                        <AlertTriangle className="h-4 w-4" /> {commentError}
                      </div>
                    )}

                    {/* Feed Display */}
                    <div className="flex flex-col h-full max-h-[600px] bg-muted/5 rounded-2xl border border-border/40 overflow-hidden">
                      <div 
                        ref={chatContainerRef} 
                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
                      >
                        {commentsLoading && comments.length === 0 ? (
                          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : comments.length === 0 ? (
                          <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No activity here yet. Start the conversation!</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {comments.map((c, idx) => {
                              const isMe = c.authorUsername === currentUsername;
                              const prevComment = idx > 0 ? comments[idx - 1] : null;
                              const isSameAuthor = prevComment?.authorUsername === c.authorUsername;
                              const showSenderName = !isMe && !isSameAuthor;
                              
                              return (
                                <div 
                                  key={c.id} 
                                  className={cn(
                                    "flex flex-col group",
                                    isMe ? "items-end" : "items-start",
                                    !isSameAuthor && idx !== 0 ? "mt-4" : "mt-0"
                                  )}
                                >
                                  {showSenderName && (
                                    <div className="flex items-center gap-2 mb-1 ml-10">
                                      <span className="chat-sender-name">
                                        {c.authorFullName || c.authorUsername}
                                      </span>
                                      {c.authorRole && (
                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                          {c.authorRole}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className={cn(
                                    "flex items-end gap-2 max-w-[85%] w-fit",
                                    isMe ? "flex-row-reverse" : "flex-row"
                                  )}>
                                    {!isMe && (
                                      <div className="w-8 flex-shrink-0">
                                        {!isSameAuthor ? (
                                          <Avatar className="w-8 h-8 border shadow-sm flex-shrink-0 mb-1">
                                            {c.authorAvatar ? (
                                              <img src={toProxiedUrl(c.authorAvatar) || c.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                {(c.authorFullName || c.authorUsername).substring(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                        ) : null}
                                      </div>
                                    )}
                                    
                                    <div className={cn(
                                      "flex flex-col group/bubble relative min-w-0",
                                      isMe ? "items-end" : "items-start"
                                    )}>
                                      {/* Reaction Trigger */}
                                      <div className={cn(
                                        "absolute -top-4 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-background border border-border shadow-sm rounded-full px-1.5 py-0.5 z-20",
                                        isMe ? "right-0" : "left-0"
                                      )}>
                                        <Popover open={openReactionPopoverId === c.id} onOpenChange={(open) => setOpenReactionPopoverId(open ? c.id : null)}>
                                          <PopoverTrigger asChild>
                                            <button className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground">
                                              <Smile className="w-3.5 h-3.5" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-fit p-1.5 grid grid-cols-4 gap-1" align={isMe ? "end" : "start"}>
                                            {["👍", "❤️", "🔥", "🚀", "👏", "🎉", "😮", "🙏"].map(emoji => (
                                              <button
                                                key={emoji}
                                                onClick={() => {
                                                  toggleReaction(c.id, emoji);
                                                  setOpenReactionPopoverId(null);
                                                }}
                                                className="p-1.5 hover:bg-muted rounded text-lg transition-transform hover:scale-125"
                                              >
                                                {emoji}
                                              </button>
                                            ))}
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      <div className={cn(
                                        "chat-bubble",
                                        isMe ? "chat-bubble-me" : "chat-bubble-others"
                                      )}>
                                        <div className="whitespace-pre-wrap break-words overflow-hidden leading-snug">
                                          {renderMessageWithMentions(c.message)}
                                        </div>
                                        
                                        {c.attachments && c.attachments.length > 0 && (
                                          <div className={cn(
                                            "grid gap-2 mt-2 max-w-[140px] sm:max-w-[180px]",
                                            c.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                          )}>
                                            {c.attachments.map((att, attIdx) => (
                                              <div key={attIdx} className="relative rounded-xl overflow-hidden border border-white/20 bg-black/10 min-w-[120px] max-w-full h-auto">
                                                <CommentAttachmentImg
                                                  taskId={selectedTask.id}
                                                  commentId={c.id}
                                                  index={attIdx}
                                                  mimeType={att.mimeType}
                                                  fileName={att.fileName}
                                                  fallbackUrl={att.url}
                                                  onPreview={(url, name) => {
                                                    // Gallery of every image in the whole comment thread
                                                    const gallery = comments.flatMap((cm) =>
                                                      (cm.attachments || [])
                                                        .filter((a) => a.url && a.mimeType?.startsWith("image/"))
                                                        .map((a) => ({ url: toProxiedUrl(a.url) || a.url, name: a.fileName || "image" }))
                                                    );
                                                    openImagePreview(url, name, gallery);
                                                  }}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Reactions Display */}
                                      {c.reactions && c.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 px-1">
                                          {Object.entries(
                                            c.reactions.reduce((acc, r) => {
                                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                              return acc;
                                            }, {} as Record<string, number>)
                                          ).map(([emoji, count]) => {
                                            const auth = getAuthState();
                                            const userId = String(auth.sub || auth.id || "");
                                            const hasReacted = c.reactions?.some(r => r.emoji === emoji && r.userId === userId);
                                            return (
                                              <button
                                                key={emoji}
                                                onClick={() => toggleReaction(c.id, emoji)}
                                                className={cn(
                                                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all",
                                                  hasReacted 
                                                    ? "bg-primary/20 border-primary/40 text-primary" 
                                                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
                                                )}
                                              >
                                                <span>{emoji}</span>
                                                <span className="font-bold">{count}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      <div className={cn(
                                        "text-[10px] text-muted-foreground/60 font-medium mt-1",
                                        isMe ? "text-right mr-1" : "text-left ml-1"
                                      )}>
                                        {formatMessageTime(c.createdAt)}
                                      </div>
                                    </div>
                                    
                                    {isMe && (
                                      <div className="flex flex-col justify-end pb-5 opacity-40">
                                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                      </div>
                                    )}

                                    {isAdminRole && (
                                      <button 
                                        type="button" 
                                        onClick={() => setConfirmArchiveCommentId(c.id)} 
                                        disabled={archivingCommentId === c.id} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 -right-8 p-1 text-muted-foreground hover:text-destructive"
                                        title="Archive"
                                      >
                                        {archivingCommentId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {othersTyping.length > 0 && (
                              <div className="flex items-center gap-2 max-w-[85%] self-start pt-2">
                                <div className="typing-indicator">
                                  <div className="typing-dot" />
                                  <div className="typing-dot" />
                                  <div className="typing-dot" />
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                                  {othersTyping.join(", ")} {othersTyping.length === 1 ? "is" : "are"} typing...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Composer Box */}
                    <div className="mt-6 ml-0 lg:ml-14 relative rounded-2xl border-2 border-border/60 bg-background overflow-visible focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm group">
                      {/* Mention Dropdown */}
                      {(() => {
                        const match = commentDraft.match(/@([a-zA-Z0-9 ]*)$/);
                        if (!match) return null;
                        const filterTerm = match[1].toLowerCase();
                        
                        const results = employees.filter(e => e.name.toLowerCase().includes(filterTerm)).slice(0, 10);
                        if (results.length === 0) return null;
                        return (
                          <div className="absolute bottom-[calc(100%+4px)] left-0 w-64 bg-background border border-border shadow-md rounded-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                            <div className="px-2 py-1.5 border-b bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wide">Mentions</div>
                            {results.map(e => (
                              <button key={e.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted font-medium flex items-center gap-2 transition-colors border-b last:border-b-0 border-border/50" onClick={() => {
                                const newDraft = commentDraft.replace(/@([a-zA-Z0-9 ]*)$/, `@${e.name} `);
                                setCommentDraft(newDraft);
                              }}>
                                <Avatar className="h-6 w-6">
                                  {e.avatarDataUrl || e.avatarUrl ? (
                                    <img src={e.avatarDataUrl || e.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{e.initials}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="truncate">{e.name}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                      {commentAttachments.length > 0 && (
                        <div className="p-2 border-b bg-muted/10 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                          {commentAttachments.map((f, i) => (
                            <div key={i} className="relative rounded-md border border-border/50 bg-background flex flex-col items-center justify-center p-2 text-center h-16 group/rem">
                              <span className="text-[10px] w-full mt-1 truncate font-medium text-muted-foreground">{f.name}</span>
                              <button type="button" onClick={() => setCommentAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/rem:opacity-100 transition-opacity text-[9px] shadow-sm ring-2 ring-background">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={commentDraft}
                        onChange={handleTypingIndicator}
                        placeholder="Write a comment... (Type @ to mention)"
                        autoComplete="on"
                        autoCorrect="on"
                        spellCheck="true"
                        className="w-full min-h-[90px] max-h-[300px] border-0 focus:ring-0 resize-y p-4 text-[14px] bg-transparent outline-none placeholder-muted-foreground/60 font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            void sendComment();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between p-2 pl-3 bg-muted/20 border-t border-border/40">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => { const el = document.getElementById("comment-attachment-input") as HTMLInputElement; el?.click(); }} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent hover:border-primary/20" title="Attach file">
                            <Paperclip className="w-4 h-4" /> <span className="text-xs font-semibold hidden sm:inline">Attach</span>
                          </button>
                          <button type="button" onClick={() => setIsVideoRecorderOpen(true)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent hover:border-red-500/20" title="Record Video">
                            <Video className="w-4 h-4" /> <span className="text-xs font-semibold hidden sm:inline">Record</span>
                          </button>
                          {ROLE_GROUPS.DROPBOX_ALLOWED.includes(currentRole) && (
                            <button type="button" onClick={() => { setDropboxPickerTarget("task-comment"); setIsDropboxPickerOpen(true); }} className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent hover:border-blue-500/20" title="Attach from Dropbox">
                              <DropboxIcon size={14} /> <span className="text-xs font-semibold hidden sm:inline">Dropbox</span>
                            </button>
                          )}
                          <span className="text-[11px] text-muted-foreground/60 px-3 hidden sm:inline-block font-medium border-l ml-1 border-border/50">Pro tip: Ctrl+Enter to send.</span>
                          <input id="comment-attachment-input" type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) { setCommentAttachments(prev => [...prev, ...Array.from(e.target.files!)]); } e.target.value = ''; }} />
                        </div>
                        <Button type="button" onClick={() => void sendComment()} disabled={(!commentDraft.trim() && commentAttachments.length === 0) || isSendingComment} size="sm" className="h-9 px-5 rounded-lg font-bold shadow hover:shadow-md transition-all gap-1.5 flex items-center">
                          {isSendingComment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {isSendingComment ? "Sending..." : "Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Pane: Properties Sidebar */}
                <div className="w-full lg:w-[320px] xl:w-[360px] bg-muted/10 shrink-0 border-t lg:border-t-0 lg:border-l border-border/50 overflow-y-auto hidden lg:block">
                  <div className="p-6 space-y-7">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b">Properties</h3>

                    {/* Assignees */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assignees</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0 z-[150]" align="end">
                            <Command>
                              <CommandInput placeholder="Search employees..." />
                              <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                                <CommandEmpty>No employee found.</CommandEmpty>
                                <CommandGroup>
                                  {activeEmployees.map((employee) => {
                                    const isAssigned = (selectedTask.assignees || []).includes(employee.name);
                                    return (
                                      <CommandItem
                                        key={employee.id}
                                        value={employee.name}
                                        onSelect={async () => {
                                          const currentAssignees = selectedTask.assignees || [];
                                          const nextAssignees = isAssigned
                                            ? currentAssignees.filter((name) => name !== employee.name)
                                            : [...currentAssignees, employee.name];
                                          try {
                                            await reassignTaskMutation.mutateAsync({
                                              id: selectedTask.id,
                                              assignees: nextAssignees,
                                            });
                                          } catch (err) {
                                            toast({
                                              title: "Reassignment failed",
                                              description: err instanceof Error ? err.message : "Something went wrong",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            isAssigned ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <Avatar className="h-6 w-6 mr-2">
                                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {employee.initials}
                                          </AvatarFallback>
                                        </Avatar>
                                        {employee.name}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                          selectedTask.assignees.map((assignee, idx) => {
                            const term = assignee.toLowerCase().trim();
                            const emp = employees.find(e => 
                              e.name.toLowerCase().trim() === term || 
                              e.email.toLowerCase().trim() === term ||
                              (e.id && e.id.toLowerCase() === term)
                            );
                            const avatar = toProxiedUrl(emp?.avatarDataUrl || emp?.avatarUrl) || emp?.avatarDataUrl || emp?.avatarUrl;
                            return (
                              <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-border">
                                <Avatar className="w-6 h-6">
                                  {avatar ? (
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                      {assignee.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="text-foreground text-sm font-medium truncate">{assignee}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm px-3 py-2 border border-dashed rounded-lg text-muted-foreground italic bg-muted/20">Unassigned</div>
                        )}
                      </div>
                    </div>

                    {/* Team Lead - only show when teamLead exists */}
                    {selectedTask.teamLead && (
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Team Lead</label>
                        <div className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-sm">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                              {selectedTask.teamLead.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-sm font-medium truncate">{selectedTask.teamLead}</span>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Due Date</label>
                      <div className={cn("text-sm font-semibold p-2.5 rounded-lg border", selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== "completed" ? "border-red-200 bg-red-50 text-red-700" : "border-border/60 bg-background text-foreground")}>
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "No due date"}
                      </div>
                    </div>

                    {/* Status Select */}
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Status</label>
                      <Select value={selectedTask.status} onValueChange={(v) => { void updateStatus(v as Task["status"]); }} disabled={statusSaving}>
                        <SelectTrigger className="w-full h-10 border-border/60 bg-background font-semibold"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent className="font-medium"><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Priority</label>
                      <div>
                        <Badge className={cn("capitalize px-3 py-1 font-bold text-[12px] rounded-md shadow-none", priorityClasses[selectedTask.priority])}>{selectedTask.priority}</Badge>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location / Project</label>
                      <p className="text-[13px] font-medium text-foreground bg-muted/20 p-2.5 rounded-lg border border-transparent hover:border-border transition-colors">{selectedTask.location || "Organizational Task"}</p>
                    </div>

                    {/* Created */}
                    <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground font-medium space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Created</span>
                        <span className="text-foreground/80">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                      </div>
                      {(() => {
                        const { images, files } = getAttachmentCounts(selectedTask.attachments, selectedTask.attachment);
                        return (images > 0 || files > 0) && (
                          <div className="flex justify-between items-center pt-2 border-t border-border/20">
                            <span>Attachments</span>
                            <div className="flex items-center gap-3">
                              {images > 0 && <span className="flex items-center gap-1 text-primary font-bold"><Paperclip className="w-3 h-3" /> {images}</span>}
                              {files > 0 && <span className="flex items-center gap-1 text-indigo-600 font-bold"><FileText className="w-3 h-3" /> {files}</span>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Task Contributors */}
                    {selectedTask && <TaskContributors taskId={selectedTask.id} />}

                    {/* Task Follow-Up Control Center */}
                    {selectedTask && (
                      <div className="pt-4 border-t border-border/20">
                        <FollowUpControlCenter taskId={selectedTask.id} isManager={true} isAdmin={true} />
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedTask(null); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[700px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle><DialogDescription>Update task details.</DialogDescription></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditTask)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Title</FormLabel><FormControl><Input placeholder="Task title" autoComplete="on" autoCorrect="on" spellCheck="true" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="description" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description" className="min-h-[90px]" autoComplete="on" autoCorrect="on" spellCheck="true" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium">Assignees</label><Popover open={editAssigneesOpen} onOpenChange={setEditAssigneesOpen}><PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-between h-10"><span className="truncate">{editSelectedAssignees.length > 0 ? editSelectedAssignees.join(", ") : "Select assignees"}</span><ChevronsUpDown className="h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" collisionPadding={20}><Command className="h-full"><CommandInput placeholder="Search employees..." /><CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain"><CommandEmpty>No employee found.</CommandEmpty><CommandGroup>{activeEmployees.map((employee) => (<CommandItem key={employee.id} value={employee.name} onSelect={() => { setEditSelectedAssignees((prev) => prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]); }}><Check className={cn("mr-2 h-4 w-4", editSelectedAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} /><Avatar className="h-6 w-6 mr-2"><AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback></Avatar>{employee.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Team Lead (Optional)</label>
                  <Popover open={editTaskTeamLeadPopoverOpen} onOpenChange={setEditTaskTeamLeadPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between h-10">
                        <span className="truncate">{editTaskTeamLead || "Select team lead"}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" collisionPadding={20}>
                      <Command>
                        <CommandInput placeholder="Search team lead..." />
                        <CommandList className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="" onSelect={() => { setEditTaskTeamLead(""); setEditTaskTeamLeadPopoverOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", editTaskTeamLead === "" ? "opacity-100" : "opacity-0")} />
                              <span className="text-muted-foreground">None</span>
                            </CommandItem>
                            {activeEmployees.map((employee) => (
                              <CommandItem key={employee.id} value={employee.name} onSelect={() => { setEditTaskTeamLead(employee.name); setEditTaskTeamLeadPopoverOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", editTaskTeamLead === employee.name ? "opacity-100" : "opacity-0")} />
                                <Avatar className="h-6 w-6 mr-2"><AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback></Avatar>
                                {employee.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormField control={editForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Main Office" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="dueTime" render={({ field }) => (<FormItem><FormLabel>Due Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              
              <FormField
                control={editForm.control}
                name="introVideoUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Task Video</FormLabel>
                    <FormControl>
                      <VideoUploadField value={field.value || ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-1.5 pt-2">
                <FormLabel>Task Attachments</FormLabel>
                <div className="space-y-2">
                  <button 
                    type="button" 
                    className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted w-full flex items-center justify-center gap-2" 
                    onClick={() => { const el = document.getElementById("edit-task-attachments-input") as HTMLInputElement | null; el?.click(); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Files
                  </button>
                  <input 
                    id="edit-task-attachments-input" 
                    type="file" 
                    accept="*" 
                    multiple 
                    className="hidden" 
                    onChange={async (e) => { 
                      const files = Array.from(e.target.files ?? []); 
                      const processedFiles = await Promise.all(
                        files.map(async (f) => {
                          if (f.type.startsWith("image/")) {
                            return await resizeImageIfNeeded(f, 1200, 1200, 0.8);
                          }
                          return f;
                        })
                      );
                      setEditTaskFiles((prev) => [...prev, ...processedFiles]); 
                      processedFiles.forEach((file) => { 
                        const reader = new FileReader(); 
                        reader.onload = () => { 
                          const result = typeof reader.result === "string" ? reader.result : ""; 
                          setEditTaskFilePreviews((prev) => [...prev, result]); 
                        }; 
                        if (file.type.startsWith("image/")) { 
                          reader.readAsDataURL(file); 
                        } else { 
                          setEditTaskFilePreviews((prev) => [...prev, ""]); 
                        } 
                      }); 
                    }} 
                  />
                  {editTaskFilePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-md p-2">
                      {editTaskFilePreviews.map((url, idx) => {
                        const isNewFile = idx >= (editTaskFilePreviews.length - editTaskFiles.length);
                        const fileName = isNewFile 
                          ? editTaskFiles[idx - (editTaskFilePreviews.length - editTaskFiles.length)].name 
                          : (selectedTask?.attachments?.[idx]?.fileName || selectedTask?.attachment?.fileName || "Existing File");
                        
                        const isImage = url.startsWith("data:image/") || 
                                       url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ||
                                       (idx < (selectedTask?.attachments?.length || 0) && selectedTask?.attachments?.[idx]?.mimeType?.startsWith("image/")) ||
                                       (idx === 0 && selectedTask?.attachment?.mimeType?.startsWith("image/"));

                        return (
                          <div key={idx} className="relative group rounded-md overflow-hidden border border-border aspect-square bg-muted/20">
                            {isImage && url ? (
                              <img src={url} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                <FileText className="w-8 h-8 text-muted-foreground/40 mb-1" />
                                <span className="text-[10px] text-muted-foreground truncate w-full px-1">{fileName}</span>
                              </div>
                            )}
                            <button 
                              type="button" 
                              onClick={() => { 
                                const isNew = idx >= (editTaskFilePreviews.length - editTaskFiles.length);
                                if (isNew) {
                                  const newIdx = idx - (editTaskFilePreviews.length - editTaskFiles.length);
                                  setEditTaskFiles(prev => prev.filter((_, i) => i !== newIdx));
                                }
                                setEditTaskFilePreviews((prev) => prev.filter((_, i) => i !== idx)); 
                              }} 
                              className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-md"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20"
                      onClick={() => setIsEditTaskLogoPickerOpen(true)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" /> Pick from Library
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end"><Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditSelectedAssignees([]); setEditTaskTeamLead(""); }} disabled={updateTaskMutation.isPending} className="w-full sm:w-auto">Cancel</Button><Button type="submit" disabled={updateTaskMutation.isPending} className="w-full sm:w-auto gap-2">{updateTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md rounded-lg">
          <AlertDialogHeader><AlertDialogTitle>Archive task?</AlertDialogTitle><AlertDialogDescription>This will move the task and its comments to the archive. You can restore it later from the Archive Data page.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2"><AlertDialogCancel disabled={deleteTaskMutation.isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleteTaskMutation.isPending} className="gap-2 bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">{deleteTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Archive className="h-4 w-4" />Archive</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmCompleteTask} onOpenChange={(open) => !open && setConfirmCompleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete & Archive Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as completed? It will be moved out of the active tasks view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={statusSaving} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              if (confirmCompleteTask) {
                void updateStatus("completed", e);
              }
              setConfirmCompleteTask(null);
            }} disabled={statusSaving} className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto text-white">
              {statusSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              Complete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmArchiveCommentId} onOpenChange={(open) => !open && setConfirmArchiveCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this comment? It will be moved to the archive and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={!!archivingCommentId}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmArchiveCommentId) {
                  void archiveComment(confirmArchiveCommentId);
                }
                setConfirmArchiveCommentId(null);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!!archivingCommentId}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmArchiveAttachmentIndex !== null} onOpenChange={(open) => !open && setConfirmArchiveAttachmentIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete / Archive Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this file from the task?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={archivingAttachment !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmArchiveAttachmentIndex !== null) {
                  void archiveAttachment(confirmArchiveAttachmentIndex);
                }
                setConfirmArchiveAttachmentIndex(null);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={archivingAttachment !== null}
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Attachment Confirmation Dialog */}
      <AlertDialog open={confirmDeleteProjectAttachmentIndex !== null} onOpenChange={(open) => !open && setConfirmDeleteProjectAttachmentIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this attachment from the project? This action will remove the file reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={deletingProjectAttachment !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmDeleteProjectAttachmentIndex !== null) {
                  void deleteProjectAttachment(confirmDeleteProjectAttachmentIndex);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={deletingProjectAttachment !== null}
            >
              {deletingProjectAttachment !== null && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[620px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingProject) return;
              setIsEditingProject(true);

              const updateProject = async () => {
                try {
                  let logoPayload = undefined;
                  if (editProjectLogoFile) {
                    logoPayload = await new Promise<ProjectLogo>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onerror = () => reject(new Error("Failed to read project logo"));
                      reader.onload = () => {
                        const url = typeof reader.result === "string" ? reader.result : "";
                        resolve({
                          fileName: editProjectLogoFile.name,
                          url,
                          mimeType: editProjectLogoFile.type,
                          size: editProjectLogoFile.size,
                        });
                      };
                      reader.readAsDataURL(editProjectLogoFile);
                    });
                  }

                  const payload: Partial<Project> = {
                    name: editProjectName,
                    description: editProjectDescription,
                    introVideoUrl: editProjectIntroVideoUrl,
                  };
                  if (logoPayload) {
                    payload.logo = logoPayload;
                  }

                  console.log("[EditProject] Sending payload:", {
                    id: editingProject.id,
                    hasLogo: !!payload.logo,
                    logoFileName: payload.logo?.fileName,
                    logoUrlPrefix: payload.logo?.url?.substring(0, 40),
                    logoUrlLength: payload.logo?.url?.length,
                  });

                  await editProjectMutation.mutateAsync({ id: editingProject.id, payload });

                  setIsEditProjectOpen(false);
                  setEditingProject(null);
                  setEditProjectName("");
                  setEditProjectDescription("");
                  setEditProjectLogoPreview("");
                  setEditProjectLogoFile(null);
                  toast({ title: "Project updated", description: "Project has been updated successfully." });
                } catch (err) {
                  toast({
                    title: "Failed to update project",
                    description: err instanceof Error ? err.message : "Something went wrong",
                    variant: "destructive",
                  });
                } finally {
                  setIsEditingProject(false);
                }
              };

              void updateProject();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Name *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Project name"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Add Emoji">
                        <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 z-[150]" align="end">
                      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {["📁", "🚀", "💻", "🎨", "📈", "⚙️", "🔧", "💡", "📅", "✏️", "🔥", "✨", "🌟", "🎯", "🏆", "🔒", "🔑", "📦", "📝", "📊", "💰", "📢", "💬", "❤️", "👍", "🍀", "🌍", "🍕", "☕", "🎮", "🎵", "🚗", "🏠", "🏢"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setEditProjectName((prev) => emoji + " " + prev);
                            }}
                            className="p-1.5 hover:bg-muted rounded text-lg text-center transition-all duration-100 hover:scale-110 active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Description</label>
                <Textarea
                  placeholder="Short project description"
                  className="min-h-[80px]"
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Intro Video</label>
                <VideoUploadField value={editProjectIntroVideoUrl} onChange={setEditProjectIntroVideoUrl} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Logo</label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted"
                    onClick={() => {
                      const el = document.getElementById("edit-project-logo-input") as HTMLInputElement | null;
                      el?.click();
                    }}
                  >
                    Change Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditProjectLogoPickerOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-500/20 transition-all text-xs font-medium"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Pick from Images
                  </button>
                  {editProjectLogoPreview ? (
                    <img src={editProjectLogoPreview} alt="Project Logo" className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                  )}
                </div>
                <input
                  id="edit-project-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file) {
                      const compressed = await resizeImageIfNeeded(file, 400, 400, 0.85);
                      setEditProjectLogoFile(compressed);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setEditProjectLogoPreview(typeof reader.result === "string" ? reader.result : "");
                      };
                      reader.readAsDataURL(compressed);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditProjectOpen(false);
                  setEditingProject(null);
                  setEditProjectName("");
                  setEditProjectDescription("");
                  setEditProjectLogoPreview("");
                  setEditProjectLogoFile(null);
                }}
                disabled={isEditingProject}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditingProject || !editProjectName.trim()} className="w-full sm:w-auto gap-2">
                {isEditingProject && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={isDeleteProjectOpen} onOpenChange={setIsDeleteProjectOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{editingProject?.name}" and all its associated tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isDeletingProject}
              className="w-full sm:w-auto"
              onClick={() => {
                setIsDeleteProjectOpen(false);
                setEditingProject(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!editingProject) return;
                setIsDeletingProject(true);
                deleteProjectMutation.mutate(editingProject.id, {
                  onSuccess: () => {
                    setIsDeleteProjectOpen(false);
                    setEditingProject(null);
                    setIsDeletingProject(false);
                    toast({ title: "Project deleted", description: "Project and its tasks have been deleted." });
                  },
                  onError: (err) => {
                    setIsDeletingProject(false);
                    toast({
                      title: "Failed to delete project",
                      description: err instanceof Error ? err.message : "Something went wrong",
                      variant: "destructive",
                    });
                  },
                });
              }}
              disabled={isDeletingProject}
              className="gap-2 bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
            >
              {isDeletingProject && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Task Dialog */}
      <Dialog open={isReassignTaskOpen} onOpenChange={setIsReassignTaskOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Change the assignees for task "{reassigningTask?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Assignees</label>
              <Popover open={reassignTaskOpen} onOpenChange={setReassignTaskOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between h-10">
                    <span className="truncate">{reassignTaskAssignees.length > 0 ? reassignTaskAssignees.join(", ") : "Select assignees"}</span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 pointer-events-auto z-[101] shadow-xl border-border" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  collisionPadding={10}
                >
                  <Command className="w-full">
                    <CommandInput placeholder="Search employees..." />
                    <div 
                      className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain" 
                      onWheel={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <CommandList className="h-auto">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup className="pb-2">
                          {activeEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.name.toLowerCase()}
                              onSelect={() => {
                                setReassignTaskAssignees((prev) =>
                                  prev.includes(employee.name)
                                    ? prev.filter((name) => name !== employee.name)
                                    : [...prev, employee.name]
                                );
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", reassignTaskAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>

            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReassignTaskOpen(false);
                setReassigningTask(null);
                setReassignTaskAssignees([]);
              }}
              disabled={isReassigningTask}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReassignTask}
              disabled={isReassigningTask}
              className="w-full sm:w-auto gap-2"
            >
              {isReassigningTask && <Loader2 className="h-4 w-4 animate-spin" />}
              Reassign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Project Dialog */}
      <Dialog open={isReassignProjectOpen} onOpenChange={setIsReassignProjectOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg pb-6 sm:pb-4">
          <DialogHeader>
            <DialogTitle>Reassign Project</DialogTitle>
            <DialogDescription>
              Change the assignees for project "{reassigningProject?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Assignees</label>
              <Popover open={reassignProjectOpen} onOpenChange={setReassignProjectOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between h-10">
                    <span className="truncate">{reassignProjectAssignees.length > 0 ? reassignProjectAssignees.join(", ") : "Select assignees"}</span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[90vw] sm:w-[--radix-popover-trigger-width] p-0 pointer-events-auto z-[101] shadow-xl border-border" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  collisionPadding={10}
                >
                  <Command className="w-full">
                    <CommandInput placeholder="Search employees..." />
                    <div 
                      className="max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain" 
                      onWheel={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <CommandList className="h-auto">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup className="pb-2">
                          {activeEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.name.toLowerCase()}
                              onSelect={() => {
                                setReassignProjectAssignees((prev) =>
                                  prev.includes(employee.name)
                                    ? prev.filter((name) => name !== employee.name)
                                    : [...prev, employee.name]
                                );
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", reassignProjectAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>

            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReassignProjectOpen(false);
                setReassigningProject(null);
                setReassignProjectAssignees([]);
              }}
              disabled={isReassigningProject}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReassignProject}
              disabled={isReassigningProject}
              className="w-full sm:w-auto gap-2"
            >
              {isReassigningProject && <Loader2 className="h-4 w-4 animate-spin" />}
              Reassign Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProject && (
        <div className="space-y-6">
          {isLoadingProject && (!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
            <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground text-center">No tasks found</div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task, index) => {
                  const letterIndex = String.fromCharCode(65 + (index % 26));
                  const displayNumber = task.taskNumber ?? ((projectTaskPage - 1) * PAGE_SIZE + index + 1);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "rounded-xl transition-all overflow-hidden flex flex-col group",
                        priorityModeEnabled && "cursor-pointer hover:border-orange-500 hover:ring-2 hover:ring-orange-500/20",
                        !priorityModeEnabled && "bg-card border border-muted/50 hover:border-primary/50 hover:shadow-md cursor-pointer",
                        task.executionPriority && "border-orange-400 bg-orange-50/10 dark:bg-orange-950/10"
                      )}
                      onClick={(e) => {
                        if (priorityModeEnabled) {
                          void handleTaskPriorityClick(task, e);
                        } else {
                          openView(task);
                        }
                      }}
                    >
                      {/* Execution Priority Badge */}
                      {task.executionPriority && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                            <Flame className="w-3 h-3" />
                            #{task.executionPriority}
                          </div>
                        </div>
                      )}
                      {priorityModeEnabled && !task.executionPriority && (
                        <div className="absolute -top-2 -left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full border border-dashed border-muted-foreground/30">
                            <Flame className="w-3 h-3" />
                            Click to assign
                          </div>
                        </div>
                      )}
                      <div className="p-4 border-b border-muted/30 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground line-clamp-1 break-words">
                            <span className="text-primary mr-1.5">{displayNumber}.</span>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">{task.priority} priority</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" aria-label="Task actions" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleTaskComplete(task, e);
                              }}
                              className="cursor-pointer font-medium"
                            >
                              {task.status === "completed" ? (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2 text-amber-500" />
                                  Mark as Incomplete
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                  Mark as Complete
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openView(task); }} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handlePrintTask(task); }} className="cursor-pointer">
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(task); }} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDelete(task); }} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Archive / Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="p-4 flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 break-words">{task.description}</p>
                        {(() => {
                          const allAtts = Array.isArray(task.attachments) ? [...task.attachments] : [];
                          if (task.attachment?.url && !allAtts.some(a => a.url === task.attachment.url)) {
                            allAtts.unshift(task.attachment);
                          }
                          const imgAtt = allAtts.find(a => a.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.fileName || ""));
                          if (!imgAtt) return null;
                          return (
                            <div className="rounded-md overflow-hidden border border-border/50 h-24 bg-muted/20">
                              <TaskAttachmentImg 
                                taskId={task.id} 
                                attachmentUrl={imgAtt.url}
                                onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }}
                              />
                            </div>
                          );
                        })()}
                        {(() => {
                          const { images, files } = getAttachmentCounts(task.attachments, task.attachment);
                          return (images > 0 || files > 0 || (task.dropboxAttachmentCount !== undefined && task.dropboxAttachmentCount > 0)) && (
                            <div className="flex flex-wrap items-center gap-2">
                              {images > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight bg-primary/10 text-primary px-2 py-1 rounded-md w-fit border border-primary/20">
                                  <Paperclip size={11} />
                                  {images} Image{images > 1 ? "s" : ""}
                                </div>
                              )}
                              {files > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight bg-indigo-500/10 text-indigo-600 px-2 py-1 rounded-md w-fit border border-indigo-500/20">
                                  <FileText size={11} />
                                  {files} File{files > 1 ? "s" : ""}
                                </div>
                              )}
                              {(task.dropboxAttachmentCount !== undefined && task.dropboxAttachmentCount > 0) && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md w-fit border border-blue-500/20">
                                  <DropboxIcon size={10} />
                                  {task.dropboxAttachmentCount} file{task.dropboxAttachmentCount > 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Assigned to</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px] uppercase font-bold px-2 py-0 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReassigningTask(task);
                                setReassignTaskAssignees(task.assignees || []);
                                setIsReassignTaskOpen(true);
                              }}
                            >
                              <UserCog className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {task.assignees && task.assignees.length > 0 ? (
                              <>
                                <div className="flex -space-x-2">
                                  {task.assignees.slice(0, 3).map((assignee, idx) => {
                                    const term = assignee.toLowerCase().trim();
                                    const emp = employees.find(e => 
                                      e.name.toLowerCase().trim() === term || 
                                      e.email.toLowerCase().trim() === term ||
                                      (e.id && e.id.toLowerCase() === term)
                                    );
                                    const avatar = toProxiedUrl(emp?.avatarDataUrl || emp?.avatarUrl) || emp?.avatarDataUrl || emp?.avatarUrl;
                                    return (
                                      <Avatar key={idx} className="w-7 h-7 border-2 border-background">
                                        {avatar ? (
                                          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                            {(emp?.initials || assignee.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()).substring(0, 2)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                    );
                                  })}
                                  {task.assignees.length > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                      +{task.assignees.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-foreground break-words">
                                  {task.assignees.length === 1 ? task.assignees[0] : `${task.assignees.length} persons`}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap"><Badge variant="secondary" className={cn("text-xs", statusClasses[task.status])}>{task.status}</Badge><Badge variant="outline" className={cn("text-xs border", priorityClasses[task.priority])}>{task.priority}</Badge></div>
                      </div>
                      <div className="p-4 border-t border-muted/30 bg-muted/10 space-y-2 text-sm"><div className="flex items-center gap-2 text-muted-foreground flex-wrap"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span></div><div className="flex items-center gap-2 text-muted-foreground flex-wrap"><Clock className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs">Created: {new Date(task.createdAt).toLocaleDateString()}</span></div>{task.location && (<div className="flex items-center gap-2 text-muted-foreground flex-wrap"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs break-words">{task.location}</span></div>)}</div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground mt-6 pt-4 border-t border-muted/20">
                <span className="text-center sm:text-left">
                  Showing {filteredTasks.length ? `${(projectTaskPage - 1) * PAGE_SIZE + 1} - ${(projectTaskPage - 1) * PAGE_SIZE + filteredTasks.length}` : "0"} of {sourceTasks.length} tasks
                </span>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />{sourceTasks.filter((t) => t.status === "completed").length} completed</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />{sourceTasks.filter((t) => t.status === "in-progress").length} in progress</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" />{sourceTasks.filter((t) => t.status === "pending").length} pending</span>
                </div>
              </div>
              {projectTaskTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-2">
                  <span className="text-sm text-muted-foreground">
                    Page {projectTaskPage} of {projectTaskTotalPages} ({filteredTasks.length} tasks)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setProjectTaskPage((p) => Math.max(1, p - 1))} disabled={projectTaskPage === 1}>Previous</Button>
                    <span className="text-sm px-1">{projectTaskPage} / {projectTaskTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setProjectTaskPage((p) => Math.min(projectTaskTotalPages, p + 1))} disabled={projectTaskPage === projectTaskTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* File Preview Lightbox */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) { setPreviewUrl(null); setPreviewGallery([]); } }}>
        <DialogContent className="max-w-[95vw] w-fit p-0 border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>File Preview: {previewName}</DialogTitle>
            <DialogDescription>Previewing attachment file</DialogDescription>
          </DialogHeader>
          <div className="relative group/preview-modal">
            {previewGallery.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); stepPreview(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-50 p-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white shadow-lg transition-all hover:scale-110"
                  title="Previous image (←)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); stepPreview(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white shadow-lg transition-all hover:scale-110"
                  title="Next image (→)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold shadow-lg">
                  {previewIdx + 1} / {previewGallery.length}
                </div>
              </>
            )}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3 opacity-0 group-hover/preview-modal:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); if (previewUrl) void downloadViaUrl(previewUrl, previewName); }}
                className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setPreviewUrl(null); setPreviewGallery([]); }}
                className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewUrl && (
              <div className="flex flex-col items-center bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                {(previewUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)/i) || previewUrl.startsWith("data:image/")) ? (
                  <img 
                    src={previewUrl} 
                    alt={previewName} 
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-[1.02]" 
                  />
                ) : (previewUrl.match(/\.(webm|mp4|mov|ogg|3gp)/i) || previewUrl.startsWith("data:video/")) ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl" 
                    autoPlay
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/10 min-w-[300px]">
                    <FileText className="w-20 h-20 text-white/40 mb-4" />
                    <p className="text-white font-semibold mb-2">{previewName}</p>
                    <p className="text-white/40 text-xs mb-6">Preview not available for this file type</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (previewUrl) void downloadViaUrl(previewUrl, previewName); }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                )}
                <div className="mt-6 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold shadow-lg border border-white/10 uppercase tracking-widest">
                  {previewName}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AssetLibraryPicker
        open={isProjectLogoPickerOpen}
        onOpenChange={setIsProjectLogoPickerOpen}
        onSelect={(url) => setProjectLogoPreview(url)}
      />

      <AssetLibraryPicker
        open={isEditProjectLogoPickerOpen}
        onOpenChange={setIsEditProjectLogoPickerOpen}
        onSelect={(url) => setEditProjectLogoPreview(url)}
      />

      <AssetLibraryPicker
        open={isEditTaskLogoPickerOpen}
        onOpenChange={setIsEditTaskLogoPickerOpen}
        onSelect={(url) => setEditTaskFilePreview(url)}
      />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar {
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain !important;
          touch-action: pan-y !important;
        }
        /* Mobile specific fix for Radix Popover/CommandList scroll */
        [data-radix-popper-content-wrapper] {
          z-index: 200 !important;
          pointer-events: auto !important;
        }
        /* Ensure the dialog doesn't block scroll on its own children on some mobile browsers */
        [role="dialog"] {
          pointer-events: auto !important;
          overscroll-behavior: contain;
        }
      `}</style>

      {/* Dropbox File Picker Modal */}
      <DropboxFilePicker
        open={isDropboxPickerOpen}
        onOpenChange={setIsDropboxPickerOpen}
        onSelect={(files) => {
          if (dropboxPickerTarget === "project") {
            setProjectDropboxSelectedFiles((prev) => [...prev, ...files]);
          } else if (dropboxPickerTarget === "task") {
            setDropboxSelectedFiles((prev) => [...prev, ...files]);
          } else {
            // handle comment attachments later
          }
        }}
        multiple={true}
      />
      {/* Video Recorder Modal */}
      <VideoRecorderModal
        isOpen={isVideoRecorderOpen}
        onClose={() => setIsVideoRecorderOpen(false)}
        onSave={(file) => setCommentAttachments((prev) => [...prev, file])}
      />

      {/* Global Cost Manager Modal */}
      <Dialog open={costManagerModalOpen} onOpenChange={setCostManagerModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Wallet className="h-5 w-5 text-indigo-500" />
              {costManagerModalSheetName}
            </DialogTitle>
            <DialogDescription>
              Attached Cost Sheet Details
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {costManagerModalSheetId && (
              <CostManager sheetId={costManagerModalSheetId} projectName={costManagerModalSheetName} />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setCostManagerModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asana Style Right-Side Task Detail Drawer */}
      <AsanaTaskDrawer
        task={selectedTask}
        open={isAsanaDrawerOpen}
        onOpenChange={setIsAsanaDrawerOpen}
        onTaskUpdated={() => {
          void tasksQuery.refetch();
          if (selectedProject) void loadProject(selectedProject.id);
        }}
        onTaskDeleted={() => {
          if (selectedTask) void deleteTask(selectedTask.id);
          setIsAsanaDrawerOpen(false);
        }}
        employees={employees}
      />
    </div>
  );
}

function ProjectCostSheetLink({ projectId, onOpenSheet }: { projectId: string; onOpenSheet: (id: string, name: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-cost-sheet-link", projectId],
    queryFn: () => getProjectCostSheet(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 pb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Checking attached cost sheet...
      </div>
    );
  }

  const sheet = data?.sheet;
  if (!sheet) {
    return (
      <div className="px-4 sm:px-6 pb-6">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <span>No Expense Sheet attached to this project. Go to the Expense Sheets tab to attach one.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pb-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-indigo-200 transition-colors">
        <div className="space-y-0.5">
          <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-indigo-500" />
            Attached Expense Sheet
          </h4>
          <p className="text-xs text-indigo-700/80">{sheet.name}</p>
        </div>
        <Button
          onClick={() => onOpenSheet(sheet.id, sheet.name)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 flex items-center gap-1.5"
        >
          <Maximize2 className="h-3.5 w-3.5" /> View Expense Sheet
        </Button>
      </div>
    </div>
  );
}

function TaskCostSheetLink({ taskId, onOpenSheet }: { taskId: string; onOpenSheet: (id: string, name: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["task-cost-sheet-link", taskId],
    queryFn: () => getTaskCostSheet(taskId),
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> Checking attached cost sheet...
      </div>
    );
  }

  const sheet = data?.sheet;
  if (!sheet) {
    return null;
  }

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-emerald-200 transition-colors my-2">
      <div className="space-y-0.5">
        <h4 className="font-semibold text-emerald-950 text-sm flex items-center gap-1.5">
          <Wallet className="h-4 w-4 text-emerald-600" />
          Attached Expense Sheet
        </h4>
        <p className="text-xs text-emerald-800/80">{sheet.name}</p>
      </div>
      <Button
        onClick={() => onOpenSheet(sheet.id, sheet.name)}
        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 flex items-center gap-1.5"
      >
        <Maximize2 className="h-3.5 w-3.5" /> View Expense Sheet
      </Button>
    </div>
  );
}
