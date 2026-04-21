import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import { Avatar, AvatarFallback } from "@/components/manger/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/manger/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/manger/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/manger/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/manger/ui/command";
import { Textarea } from "@/components/manger/ui/textarea";
import { toast } from "@/components/manger/ui/use-toast";
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
  Download,
  Printer,
  Check,
  ChevronsUpDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  Send,
  RefreshCw,
  Paperclip,
  MessageSquare,
  Archive,
  User,
  PlusCircle,
  TrendingUp,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch, downloadTaskAttachment, toProxiedUrl, getTopContributors, downloadViaUrl, updateComment, deleteComment } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import jsPDF from "jspdf";
import { Pagination } from "@/components/Pagination";

interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  assignee?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  dueTime?: string;
  location?: string;
  createdAt: string;
  projectId?: string;
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
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
};

type CreateProjectPayload = {
  name: string;
  description: string;
  assignees?: string[];
  logo?: ProjectLogo;
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  tasks: Array<Omit<CreateProjectTaskDraft, "location">>;
};

interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  status: "active" | "inactive" | "on-leave";
}

type TaskComment = {
  id: string;
  taskId?: string;
  projectId?: string;
  message: string;
  authorUsername: string;
  authorFullName?: string;
  authorAvatar?: string;
  authorRole?: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt?: string;
  }>;
  createdAt: string;
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
  logo?: ProjectLogo;
  taskCount?: number;
  status?: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
}

interface ProjectWithTasks extends Project {
  tasks: Task[];
  taskCount?: number;
  status?: string;
}

function normalizeTask(t: TaskApi): Task {
  const legacyAssignee = typeof t.assignee === "string" ? t.assignee.trim() : "";
  const assignees = Array.isArray(t.assignees)
    ? t.assignees.filter(Boolean)
    : legacyAssignee
      ? [legacyAssignee]
      : [];
  const extra = t as TaskApi & TaskApiAttachmentFields;
  return {
    id: t._id,
    title: t.title,
    description: t.description,
    assignees,
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
  };
}

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
        crossOrigin="anonymous"
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

function CommentAttachmentImg({ taskId, projectId, commentId, index, mimeType, fileName, fallbackUrl, onPreview }: { taskId?: string; projectId?: string; commentId: string; index: number; mimeType: string; fileName: string; fallbackUrl?: string; onPreview?: (url: string, name: string) => void }) {
  const [src, setSrc] = useState<string | null | undefined>(toProxiedUrl(fallbackUrl) || undefined);
  useEffect(() => {
    if (fallbackUrl) return; 
    let cancelled = false;
    const url = taskId 
      ? `/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}/attachments/${index}`
      : `/api/projects/${encodeURIComponent(projectId!)}/comments/${encodeURIComponent(commentId)}/attachments/${index}`;
      
    apiFetch<{ attachment: { url: string } }>(url)
      .then(d => { if (!cancelled) setSrc(toProxiedUrl(d.attachment?.url) || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId, projectId, commentId, index, fallbackUrl]);
  
  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-auto flex justify-center relative group/att cursor-zoom-in" onClick={() => onPreview?.(src, fileName)}>
      <img src={src} alt={fileName} className="w-full h-auto max-h-[180px] object-contain rounded-lg" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-all duration-200 rounded-lg">
        <Maximize2 className="w-5 h-5 text-white" />
      </div>
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
  if (src === undefined) return <div className="w-full h-20 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin opacity-10" /></div>;
  return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/10"><X className="w-4 h-4 text-muted-foreground/40" /></div>;
}

async function filesToAttachments(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<{ fileName: string; url: string; mimeType: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.onload = () => {
            resolve({ fileName: file.name, url: typeof reader.result === "string" ? reader.result : "", mimeType: file.type, size: file.size });
          };
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function renderMessageWithMentions(text: string) {
  if (!text) return null;
  const parts = text.split(/(@\S+)/g);
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
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

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

// Task Contributors Component
function TaskContributorsList({ taskId }: { taskId: string }) {
  const [contributors, setContributors] = useState<Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    contributionType: string;
    actions: string[];
    addedAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContributors = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ items: Array<{
          userId: string;
          name: string;
          email: string;
          role: string;
          contributionType?: string;
          actions?: string[];
          addedAt?: string;
          avatar?: string;
          stats?: any;
        }> }>(`/api/contributors/task/${encodeURIComponent(taskId)}/contributors`);
        setContributors(res.items || []);
      } catch (err) {
        console.error("Failed to load task contributors:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContributors();
  }, [taskId]);

  if (loading) {
    return <div className="text-sm text-muted-foreground italic">Loading contributors...</div>;
  }

  if (contributors.length === 0) {
    return <div className="text-sm text-muted-foreground italic bg-muted/20 border border-dashed rounded-lg p-3 text-center">No contributors yet</div>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
      {contributors.map((contributor, idx) => (
        <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-sm">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700 font-bold">
              {contributor.name?.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground/80 truncate">{contributor.name || "Unknown"}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                {contributor.contributionType}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {contributor.actions?.length || 0} actions
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectPage, setProjectPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const PAGE_SIZE = 25;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
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
  const [editTaskFile, setEditTaskFile] = useState<File | null>(null);
  const [editTaskFilePreview, setEditTaskFilePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ projectName?: string; title?: string; description?: string }>({});
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [editAssigneesOpen, setEditAssigneesOpen] = useState(false);
  const [projectCreationAssignees, setProjectCreationAssignees] = useState<string[]>([]);
  const [projectCreationAssigneesOpen, setProjectCreationAssigneesOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isDirectTask, setIsDirectTask] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [editSelectedAssignees, setEditSelectedAssignees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [archivingCommentId, setArchivingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [archivingAttachment, setArchivingAttachment] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [isViewProjectOpen, setIsViewProjectOpen] = useState(false);
  const [projectComments, setProjectComments] = useState<TaskComment[]>([]);
  const [projectCommentsLoading, setProjectCommentsLoading] = useState(false);
  
  // Top contributors state
  const [topContributors, setTopContributors] = useState<Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    stats: {
      totalTasksCreated: number;
      totalTasksUpdated: number;
      totalTasksCompleted: number;
    };
    projects: Array<{
      projectId: string;
      projectName: string;
      contributionCount: number;
    }>;
  }>>([]);
  const [topContributorsLoading, setTopContributorsLoading] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const projectChatContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentUsername = getAuthState().username || "";
  const { socket, joinTask, leaveTask } = useSocket();

  // Lightbox / File Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  // Fetch tasks with server-side pagination
  const tasksQuery = useQuery({
    queryKey: ["tasks", taskPage, searchQuery, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: taskPage.toString(),
        limit: PAGE_SIZE.toString(),
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
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
    queryKey: ["projects", projectPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: projectPage.toString(),
        limit: PAGE_SIZE.toString(),
        search: searchQuery,
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

  // Reset pages when filters change
  useEffect(() => { setTaskPage(1); }, [searchQuery, statusFilter, priorityFilter]);
  useEffect(() => { setProjectPage(1); }, [searchQuery]);

  useEffect(() => {
    if (tasksQuery.data) {
      setTasks(tasksQuery.data.items);
    }
  }, [tasksQuery.data]);

  useEffect(() => {
    if (!selectedProject && tasksQuery.data) {
      setTasks(tasksQuery.data.items);
    }
  }, [selectedProject, tasksQuery.data]);

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data.items);
    }
  }, [projectsQuery.data]);

  // Load top contributors
  useEffect(() => {
    const loadTopContributors = async () => {
      setTopContributorsLoading(true);
      try {
        const res = await getTopContributors(5);
        setTopContributors(res.contributors || []);
      } catch (err) {
        console.error("Failed to load top contributors:", err);
      } finally {
        setTopContributorsLoading(false);
      }
    };
    loadTopContributors();
  }, []);

  // Real-time task comments via socket
  useEffect(() => {
    if (!socket || !selectedTask) return;
    joinTask(selectedTask.id);
    const handleNewComment = (comment: TaskComment) => {
      setComments((prev) => {
        // Avoid duplicates (in case the sender already added it optimistically)
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
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

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.off("typing", handleTyping);
      leaveTask(selectedTask.id);
    };
  }, [socket, selectedTask?.id]);

  const loadProject = async (projectId: string) => {
    setIsLoadingProject(true);
    setSelectedProject(null);

    try {
      const res = await apiFetch<{ item: ProjectWithTasks }>(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!res.item) {
        throw new Error("Project not found");
      }

      const project = res.item;
      const projectTasks: Task[] = Array.isArray(project.tasks) ? project.tasks : [];

      setSelectedProject({ ...project, tasks: projectTasks });
      setTasks(projectTasks);
    } catch (err) {
      toast({ title: "Failed to load project", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
      setSelectedProject(null);
      setTasks([]);
    } finally {
      setIsLoadingProject(false);
    }
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    const searchVal = String(searchParams.get("search") || "").trim();
    
    if (searchVal) {
      setSearchQuery(searchVal);
      const next = new URLSearchParams(searchParams);
      next.delete("search");
      setSearchParams(next, { replace: true });
    }

    if (!viewId) return;
    if (isViewOpen || isEditOpen || isDeleteOpen || isCreateOpen) return;

    const match = tasks.find((t) => String(t.id) === viewId);
    if (!match) return;

    openView(match);

    const next = new URLSearchParams(searchParams);
    next.delete("view");
    setSearchParams(next, { replace: true });
  }, [tasks, searchParams, setSearchParams, isViewOpen, isEditOpen, isDeleteOpen, isCreateOpen]);

  // Fetch employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await apiFetch<{ items: Employee[] }>("/api/employees");
        setEmployees(res.items.filter((e) => e.status === "active"));
      } catch {
        setEmployees([]);
      }
    };
    void loadEmployees();
  }, []);

  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.status === "active");
  }, [employees]);

  // Resolve an assignee string (could be email or name) to display name
  const resolveAssigneeName = useMemo(() => {
    const byEmail = new Map(employees.map((e) => [e.email.toLowerCase(), e.name]));
    const byName  = new Map(employees.map((e) => [e.name.toLowerCase(),  e.name]));
    return (val: string): string => {
      const v = (val || "").trim();
      return byEmail.get(v.toLowerCase()) || byName.get(v.toLowerCase()) || v;
    };
  }, [employees]);

  useEffect(() => {
    if (isCreateOpen) {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, dueDate: today }));
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
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ ok: true }>(`/api/tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    },
  });

  const validateForm = () => {
    const errors: { projectName?: string; title?: string; description?: string } = {};
    if (!projectName.trim()) {
      errors.projectName = "Project name is required";
    }
    if (projectTasks.length === 0) {
      errors.title = "At least one task is required";
    }
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
    });
    setSelectedAssignees([]);
    setProjectCreationAssignees([]);
    setAttachmentFile(null);
    setAttachmentFiles([]);
    setAttachmentFilePreviews([]);
  };

  const draftFromForm = (attachmentOverride?: CreateProjectTaskDraft["attachment"], attachmentsOverride?: CreateProjectTaskDraft["attachments"]) => {
    const createdAt = new Date().toISOString().split("T")[0];
    const att = attachmentOverride ?? attachmentsOverride?.[0] ?? undefined;

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
      attachmentFileName: att?.fileName || formData.attachmentFileName || "",
      attachmentNote: formData.attachmentNote || "",
      attachment: att,
      attachments: attachmentsOverride,
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
    setProjectTasks((prev) => [
      ...prev,
      draftFromForm(first, attachments.length > 0 ? attachments : undefined),
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
    }));
    setSelectedAssignees([]);
    setAttachmentFile(null);
    setAttachmentFiles([]);
    setAttachmentFilePreviews([]);
    setIsCreateTaskOpen(false);
  };

  const handleCreateProject = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      setApiError(null);

      const description = projectDescription?.trim() || "—";

      const projectLogo = projectLogoFile
        ? await new Promise<ProjectLogo>((resolve, reject) => {
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
          })
        : undefined;

      const tasksToCreate: CreateProjectTaskDraft[] =
        projectTasks.length > 0 ? projectTasks : [draftFromForm(undefined)];

      const projectAttachments =
        projectAttachmentFiles.length > 0 ? await filesToAttachments(projectAttachmentFiles) : [];

      // Always include the current manager so the project appears in their list
      const assigneesWithSelf = currentUsername && !projectCreationAssignees.includes(currentUsername)
        ? [currentUsername, ...projectCreationAssignees]
        : projectCreationAssignees;

      const payload: CreateProjectPayload & { assignees?: string[]; logo?: ProjectLogo } = {
        name: projectName.trim(),
        description,
        assignees: assigneesWithSelf,
        logo: projectLogo,
        attachments: projectAttachments,
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
        title: "Project created",
        description: "Your project has been created with tasks.",
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

      const taskPayload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        assignees: selectedAssignees,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || nowDate,
        dueTime: formData.dueTime,
        location: formData.location,
        createdAt: nowDate,
        attachmentFileName: first?.fileName || "",
        attachmentNote: formData.attachmentNote,
        attachment: first,
        attachments,
      };

      // Only add projectId if not a direct task
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
      });
      setSelectedAssignees([]);
      setAttachmentFile(null);
      setAttachmentFiles([]);
      setAttachmentFilePreviews([]);
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
    setSelectedTask(task);
    setIsViewOpen(true);
    void loadComments(task.id);
  };

  const loadComments = async (taskId: string) => {
    try {
      setCommentsLoading(true);
      setCommentError(null);
      const res = await apiFetch<{ items: TaskComment[] }>(`/api/tasks/${encodeURIComponent(taskId)}/comments`);
      setComments(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to load messages");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async (isProject?: boolean) => {
    const targetId = isProject ? selectedProject?.id : selectedTask?.id;
    if (!targetId) return;
    
    const msg = commentDraft.trim();
    if (!msg && commentAttachments.length === 0) return;

    try {
      setIsSendingComment(true);
      setCommentError(null);
      
      let attachments: any[] = [];
      if (commentAttachments.length > 0) {
        attachments = await filesToAttachments(commentAttachments);
      }

      const type = isProject ? "projects" : "tasks";
      const res = await apiFetch<{ item: TaskComment }>(`/api/${type}/${encodeURIComponent(targetId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ 
          message: msg,
          attachments: attachments
        }),
      });
      
      if (isProject) {
        setProjectComments((prev) => [...prev, res.item]);
        setTimeout(() => {
          projectChatContainerRef.current?.scrollTo({ top: projectChatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      } else {
        setComments((prev) => [...prev, res.item]);
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
      
      setCommentDraft("");
      setCommentAttachments([]);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setIsSendingComment(false);
    }
  };

  const startEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.message);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentDraft("");
  };

  const saveEditComment = async () => {
    if (!selectedTask || !editingCommentId) return;
    const msg = editCommentDraft.trim();
    if (!msg) return;

    try {
      setCommentError(null);
      const res = await updateComment(selectedTask.id, editingCommentId, { message: msg });
      setComments((prev) => prev.map((c) => (c.id === editingCommentId ? { ...c, message: res.item.message, updatedAt: res.item.updatedAt } : c)));
      setEditingCommentId(null);
      setEditCommentDraft("");
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to update comment");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
  };

  const handleDeleteComment = async () => {
    if (!selectedTask || !deletingCommentId) return;
    try {
      setCommentError(null);
      await deleteComment(selectedTask.id, deletingCommentId);
      setComments((prev) => prev.filter((c) => c.id !== deletingCommentId));
      setDeletingCommentId(null);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to delete comment");
    }
  };

  const handleTypingIndicator = (e: React.ChangeEvent<HTMLTextAreaElement>, isProject: boolean = false) => {
    setCommentDraft(e.target.value);
    
    if (!socket || (!selectedTask && !isProject) || (isProject && !selectedProject)) return;

    if (!isTyping) {
      setIsTyping(true);
      const payload: any = { typing: true };
      if (isProject) payload.projectId = selectedProject!.id;
      else payload.taskId = selectedTask!.id;
      socket.emit("typing", payload);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const payload: any = { typing: false };
      if (isProject) payload.projectId = selectedProject!.id;
      else payload.taskId = selectedTask!.id;
      socket.emit("typing", payload);
    }, 3000);
  };

  const loadProjectComments = async (projectId: string) => {
    try {
      setProjectCommentsLoading(true);
      const res = await apiFetch<{ items: TaskComment[] }>(`/api/projects/${encodeURIComponent(projectId)}/comments`);
      setProjectComments(Array.isArray(res.items) ? res.items : []);
      setTimeout(() => {
        projectChatContainerRef.current?.scrollTo({ top: projectChatContainerRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (e) {
      console.error("Failed to load project comments:", e);
      setProjectComments([]);
    } finally {
      setProjectCommentsLoading(false);
    }
  };

  const openViewProject = (project: Project) => {
    // We already have some project data, but we might want to fetch full details if not already there
    // For now we just use what we have and load comments
    if (selectedProject?.id === project.id) {
       setIsViewProjectOpen(true);
       void loadProjectComments(project.id);
       return;
    }

    void loadProject(project.id);
    setIsViewProjectOpen(true);
    void loadProjectComments(project.id);
  };

  const { triggerBlaster, incrementCompletedCount } = useTaskBlasterContext();

  const updateStatus = async (next: Task["status"]) => {
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
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });

      // Trigger TaskBlaster when task is marked as completed
      if (next === "completed" && previousStatus !== "completed") {
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
      }
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setEditSelectedAssignees(task.assignees || []);
    setEditTaskFile(null);
    setEditTaskFilePreview(task.attachment?.url || null);
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
  };

  const openDelete = (task: Task) => {
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
        img.src = attUrl;
        await new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });

        const imgW = img.naturalWidth || 1;
        const imgH = img.naturalHeight || 1;
        const renderW = maxWidth;
        const renderH = (imgH / imgW) * renderW;
        ensureSpace(Math.min(renderH + 10, pageHeight - margin * 2));
        const type: "PNG" | "JPEG" = attMime.includes("png") || attUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(attUrl, type, margin, y, renderW, renderH);
        y += renderH + 10;
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
    try {
      let attachment = undefined;
      if (editTaskFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(editTaskFile);
        });
        attachment = {
          fileName: editTaskFile.name,
          url: base64,
          mimeType: editTaskFile.type,
          size: editTaskFile.size
        };
      } else if (editTaskFilePreview === null) {
        attachment = { fileName: "", url: "", mimeType: "", size: 0 };
      }

      const payload: Partial<Task> = { ...values, assignees: editSelectedAssignees };
      if (attachment !== undefined) {
        (payload as any).attachment = attachment;
      }

      updateTaskMutation.mutate(
        { id: selectedTask.id, payload },
        {
          onSuccess: (updatedTask) => {
            setIsEditOpen(false);
            setEditSelectedAssignees([]);
            setEditTaskFile(null);
            setEditTaskFilePreview(null);
            toast({
              title: "Task updated",
              description: "The task has been updated successfully.",
            });

            // Trigger TaskBlaster when task is marked as completed via edit
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
            }
          },
          onError: (err) => {
            toast({
              title: "Failed to update task",
              description: err instanceof Error ? err.message : "Something went wrong",
              variant: "destructive",
            });
          },
        }
      );
    } catch (err) {
      toast({
        title: "Error preparing update",
        description: "Failed to process attachment file",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (!selectedTask) return;
    const toDelete = selectedTask;

    deleteTaskMutation.mutate(toDelete.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedTask(null);
        toast({
          title: "Task deleted",
          description: "Task has been removed.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to delete task",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  // When a project is selected, tasks come from that project (client-side filtered)
  // Otherwise tasks come from the server-paginated query
  const sourceTasks = selectedProject ? selectedProject.tasks : tasks;

  const filteredTasks = useMemo(() => {
    if (!selectedProject) return sourceTasks; // already filtered server-side
    // Client-side filter only for selected-project task view
    return sourceTasks.filter((task) => {
      const assigneesText = Array.isArray(task.assignees) ? task.assignees.join(" ") : "";
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assigneesText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [sourceTasks, searchQuery, statusFilter, priorityFilter, selectedProject]);

  // Projects come from server-paginated query (filtering handled server-side)
  const filteredProjects = projects;

  // Pagination is server-driven when no project is selected; client-driven when project is selected
  const paginatedProjects = filteredProjects;
  const projectTotalPages = projectsQuery.data?.totalPages || 1;

  const paginatedTasks = useMemo(() => {
    if (!selectedProject) return filteredTasks; // already paginated server-side
    const start = (taskPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, taskPage, selectedProject]);
  const taskTotalPages = selectedProject
    ? (Math.ceil(filteredTasks.length / PAGE_SIZE) || 1)
    : (tasksQuery.data?.totalPages || 1);

  return (
    <div className="px-2 sm:px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">Create, assign, and track all tasks</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedProject ? (
            <>
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                Back to Projects
              </Button>
              <Button className="gap-2" onClick={() => setIsCreateTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </>
          ) : (
            <>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
              <Button className="gap-2" onClick={() => {
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks or assignee..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:pb-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Top Contributors Section */}
      <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/30 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Top Contributors</h3>
        </div>
        {topContributorsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-48 h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : topContributors.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No contributors yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topContributors.map((contributor, index) => (
              <div
                key={contributor.userId}
                className="flex-shrink-0 bg-white dark:bg-background rounded-lg border border-amber-200/60 dark:border-amber-800/30 p-3 min-w-[200px] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-bold">
                        {contributor.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === 0 ? "bg-yellow-400 text-yellow-900" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        "bg-amber-600 text-white"
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contributor.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{contributor.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {contributor.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-amber-100 dark:border-amber-800/30">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-amber-700">{contributor.stats?.totalTasksCreated || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-amber-700">{contributor.stats?.totalTasksUpdated || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-amber-700">{contributor.stats?.totalTasksCompleted || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProject ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <ProjectLogoImg 
                projectId={selectedProject.id} 
                projectName={selectedProject.name} 
                logoUrl={selectedProject.logo?.url} 
              />
              <div className="min-w-0">
                <h2 className="font-bold text-lg truncate leading-tight flex items-center gap-2">
                  {selectedProject.name}
                  <Badge variant="outline" className="text-[10px] h-5 font-bold bg-primary/5 text-primary border-primary/10">Project</Badge>
                </h2>
                <p className="text-sm text-muted-foreground truncate max-w-sm">{selectedProject.description || "No description provided."}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 font-medium italic">
                  Team: {selectedProject.assignees && selectedProject.assignees.length > 0 ? selectedProject.assignees.map(resolveAssigneeName).join(", ") : "Unassigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-9 gap-2 font-bold px-4 shadow-sm hover:shadow-md transition-all border-primary/10"
                onClick={() => {
                  if (selectedProject) {
                    void loadProjectComments(selectedProject.id);
                  }
                }}
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                Discussion
              </Button>
              <Select value={selectedProject.status || "No status"} onValueChange={(value) => {
                updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: value }, {
                  onSuccess: () => {
                    setSelectedProject({...selectedProject, status: value});
                  }
                });
              }}>
                <SelectTrigger className="w-[130px] h-9 font-medium text-xs bg-background shadow-xs">
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
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mt-4 pt-3 border-t font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><PlusCircle className="w-3 h-3" /> {selectedProject.tasks.length} Total Tasks</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
            <h2 className="font-semibold text-lg mb-3">Projects</h2>
            {projectsQuery.isLoading ? (
              <p className="text-muted-foreground">Loading projects...</p>
            ) : projectsQuery.isError ? (
              <p className="text-destructive">Failed to load projects</p>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground">No projects found. Create one to begin.</p>
            ) : (
              <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProjects.map((project, idx) => {
                  const assigneeList = Array.isArray(project.assignees) && project.assignees.length > 0
                    ? project.assignees.map(resolveAssigneeName)
                    : [];
                  const taskNum = project.taskCount ?? 0;
                  const projectNumber = (projectPage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <div
                      key={project.id}
                      className="group relative p-3 sm:p-4 rounded-xl border border-border/60 hover:border-primary/50 transition-all bg-card shadow-sm hover:shadow-md flex flex-col gap-3"
                    >
                      <div className="cursor-pointer flex flex-col flex-1" onClick={() => void loadProject(project.id)}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex-shrink-0 text-[10px] font-black text-muted-foreground/30 w-4">{projectNumber}</span>
                          <ProjectLogoImg projectId={project.id} projectName={project.name} logoUrl={project.logo?.url} />
                          <div className="min-w-0">
                            <p className="font-bold text-[15px] truncate group-hover:text-primary transition-colors">{project.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate leading-tight">{project.description || "No description"}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 mb-3 bg-muted/10 p-1.5 rounded-lg px-2">
                          <span className="truncate flex items-center gap-1"><Users className="w-3 h-3" /> {assigneeList.length > 0 ? (assigneeList.length > 1 ? `${assigneeList[0]} +${assigneeList.length-1}` : assigneeList[0]) : "Member Only"}</span>
                          <span className="flex-shrink-0 font-bold bg-background px-1.5 py-0.5 rounded border border-border/50">{taskNum} total</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
                        <Badge variant="outline" className="h-6 text-[10px] font-bold bg-muted/5 border-border/60">
                          {project.status || "Pending"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            void loadProjectComments(project.id);
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={projectPage}
                totalPages={projectTotalPages}
                onPageChange={setProjectPage}
                className="mt-4"
              />
              </>
            )}
          </div>

          {/* Tasks Section */}
          <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
            <h2 className="font-semibold text-lg mb-3">Tasks</h2>
            {tasksQuery.isLoading ? (
              <p className="text-muted-foreground">Loading tasks...</p>
            ) : tasksQuery.isError ? (
              <p className="text-destructive">Failed to load tasks</p>
            ) : tasks.filter(t => !t.projectId).length === 0 ? (
              <p className="text-muted-foreground">No standalone tasks found. Create one to begin.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.filter(t => !t.projectId).map((task) => {
                  const assigneeList = Array.isArray(task.assignees) && task.assignees.length > 0
                    ? task.assignees.map(resolveAssigneeName)
                    : [];
                  
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        openView(task);
                      }}
                      className="text-left p-3 sm:p-4 rounded-lg border border-border hover:border-primary transition bg-card shadow-sm hover:shadow-card"
                    >
                      <div className="mb-2">
                        <p className="font-medium truncate text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="truncate">{assigneeList.length > 0 ? assigneeList.join(", ") : "Unassigned"}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                        <div className="flex gap-1">
                          <Badge className="capitalize" variant="outline" style={{
                            backgroundColor: task.priority === 'high' ? 'rgb(239, 68, 68)' : task.priority === 'medium' ? 'rgb(234, 179, 8)' : 'rgb(34, 197, 94)',
                            color: 'white'
                          }}>
                            {task.priority}
                          </Badge>
                          <Badge className="capitalize" variant="outline">
                            {task.status}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a project and assign it.</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); void handleCreateProject(); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Name *</label>
                <Input
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (validationErrors.projectName) {
                      setValidationErrors({ ...validationErrors, projectName: undefined });
                    }
                  }}
                  className={validationErrors.projectName ? "border-destructive ring-1 ring-destructive" : ""}
                />
                {validationErrors.projectName && (
                  <p className="text-xs text-destructive">{validationErrors.projectName}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Description</label>
                <Textarea
                  placeholder="Short project description"
                  className="min-h-[80px]"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Logo</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted"
                    onClick={() => {
                      const el = document.getElementById("project-logo-input") as HTMLInputElement | null;
                      el?.click();
                    }}
                  >
                    Upload Logo
                  </button>
                  {projectLogoPreview ? (
                    <img src={projectLogoPreview} alt="Project Logo" className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                  )}
                </div>
                <input
                  id="project-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setProjectLogoFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProjectLogoPreview(typeof reader.result === "string" ? reader.result : "");
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setProjectLogoPreview("");
                    }
                  }}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Attachments</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted w-full"
                    onClick={() => {
                      const el = document.getElementById("project-attachments-input") as HTMLInputElement | null;
                      el?.click();
                    }}
                  >
                    + Add Files/Images
                  </button>
                  <input
                    id="project-attachments-input"
                    type="file"
                    accept="*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setProjectAttachmentFiles((prev) => [...prev, ...files]);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = typeof reader.result === "string" ? reader.result : "";
                          setProjectAttachmentPreviews((prev) => [...prev, result]);
                        };
                        if (file.type.startsWith("image/")) {
                          reader.readAsDataURL(file);
                        } else {
                          setProjectAttachmentPreviews((prev) => [...prev, ""]);
                        }
                      });
                    }}
                  />
                  {projectAttachmentFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-md p-2">
                      {projectAttachmentFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          {projectAttachmentPreviews[idx] ? (
                            <img src={projectAttachmentPreviews[idx]} alt={file.name} className="w-full h-20 object-cover rounded-md" />
                          ) : (
                            <div className="w-full h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground truncate px-2">
                              📄 {file.name}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setProjectAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
                              setProjectAttachmentPreviews((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-0 right-0 bg-destructive/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Assignees</label>
                <Popover open={projectCreationAssigneesOpen} onOpenChange={setProjectCreationAssigneesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10"
                    >
                      <span className="truncate">
                        {projectCreationAssignees.length > 0
                          ? projectCreationAssignees.join(", ")
                          : "Select assignees"}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search employees..." />
                      <CommandList>
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
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  projectCreationAssignees.includes(employee.name)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {employee.initials}
                                </AvatarFallback>
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

            {/* Tasks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Project Tasks</label>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
              
              {projectTasks.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-border rounded-md p-3">
                  {projectTasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-muted/50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title || `Task ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p>
                        <div className="flex gap-2 mt-1 flex-wrap text-xs">
                          <span className="px-2 py-0.5 bg-muted rounded capitalize">{task.priority}</span>
                          <span className="px-2 py-0.5 bg-muted rounded capitalize">{task.status}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProjectTasks((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-md p-4 text-center text-sm text-muted-foreground">
                  No tasks added yet. Add at least one task to create the project.
                </div>
              )}
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="w-full sm:w-auto gap-2">
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateTaskOpen} onOpenChange={(open) => {
          setIsCreateTaskOpen(open);
          if (!open) setIsDirectTask(false);
        }}>
          <DialogContent className="w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isDirectTask ? "Create Standalone Task" : "Create Task"}</DialogTitle>
              <DialogDescription>
                {isDirectTask 
                  ? "Create a new standalone task without a project." 
                  : "Create a new task under the selected project."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void (isCreateOpen ? addTaskToProject() : handleCreateTask());
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Task Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  {validationErrors.title && <p className="text-xs text-destructive">{validationErrors.title}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Task Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  {validationErrors.description && <p className="text-xs text-destructive">{validationErrors.description}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Assignees</label>
                  <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between h-10">
                        <span className="truncate">
                          {selectedAssignees.length > 0 ? selectedAssignees.join(", ") : "Select assignees"}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search employees..." />
                        <CommandList>
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            {activeEmployees.map((employee) => (
                              <CommandItem
                                key={employee.id}
                                value={employee.name}
                                onSelect={() => {
                                  setSelectedAssignees((prev) =>
                                    prev.includes(employee.name)
                                      ? prev.filter((name) => name !== employee.name)
                                      : [...prev, employee.name]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAssignees.includes(employee.name) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {employee.initials}
                                  </AvatarFallback>
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
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as Task['priority'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as Task['status'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Task Attachments</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="py-2 px-3 border border-border rounded-md text-sm hover:bg-muted w-full"
                    onClick={() => {
                      const el = document.getElementById("task-attachments-input") as HTMLInputElement | null;
                      el?.click();
                    }}
                  >
                    + Add Files/Images
                  </button>
                  <input
                    id="task-attachments-input"
                    type="file"
                    accept="*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setAttachmentFiles((prev) => [...prev, ...files]);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = typeof reader.result === "string" ? reader.result : "";
                          setAttachmentFilePreviews((prev) => [...prev, result]);
                        };
                        if (file.type.startsWith("image/")) {
                          reader.readAsDataURL(file);
                        } else {
                          setAttachmentFilePreviews((prev) => [...prev, ""]);
                        }
                      });
                    }}
                  />
                  {attachmentFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border border-border rounded-md p-2">
                      {attachmentFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          {attachmentFilePreviews[idx] ? (
                            <img src={attachmentFilePreviews[idx]} alt={file.name} className="w-full h-20 object-cover rounded-md" />
                          ) : (
                            <div className="w-full h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground truncate px-2">
                              📄 {file.name}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
                              setAttachmentFilePreviews((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-0 right-0 bg-destructive/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateTaskOpen(false);
                  setIsDirectTask(false);
                }} disabled={isCreating} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={isCreating} className="w-full sm:w-auto gap-2">
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isDirectTask ? "Create Task" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="w-[98vw] sm:max-w-[95vw] lg:max-w-[1100px] h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-2xl">
            {selectedTask && (
              <>
                <DialogHeader className="p-4 sm:p-6 border-b bg-card flex-shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-wider font-bold bg-muted/30">Task Details</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">• ID: {selectedTask.id.slice(-6)}</span>
                      </div>
                      <DialogTitle className="text-lg sm:text-2xl font-bold truncate leading-tight">{selectedTask.title}</DialogTitle>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
                  {/* Left Pane: Content & Comments */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                    <div className="p-4 sm:p-7 space-y-8 max-w-4xl mx-auto">
                      {/* Description Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <h4 className="text-[13px] font-bold uppercase tracking-wider">Description</h4>
                        </div>
                        <div className="bg-muted/10 border border-border/40 rounded-xl p-4 sm:p-5">
                          <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {selectedTask.description || <span className="text-muted-foreground/50 italic">No description provided.</span>}
                          </p>
                        </div>
                      </div>

                      {/* Task Attachments Grid - Same as Admin Panel */}
                      {((selectedTask.attachments && selectedTask.attachments.length > 0) || selectedTask.attachment?.fileName) && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attached Files</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                            {selectedTask.attachments && selectedTask.attachments.length > 0
                              ? selectedTask.attachments.map((attachment, idx) => (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/60 bg-background shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" onClick={() => { if (attachment.url) { setPreviewUrl(toProxiedUrl(attachment.url) || attachment.url); setPreviewName(attachment.fileName || "Attachment"); } }}>
                                  {(attachment.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.fileName || "")) && attachment.url ? (
                                    <img src={toProxiedUrl(attachment.url) || attachment.url} alt={attachment.fileName || `Attachment`} className="w-full h-24 object-cover" />
                                  ) : (
                                    <div className="w-full h-24 flex items-center justify-center bg-muted/40"><FileText className="h-8 w-8 text-muted-foreground/60" /></div>
                                  )}
                                  <div className="p-2 border-t text-[11px] font-medium truncate text-muted-foreground">{attachment.fileName}</div>

                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setPreviewUrl(toProxiedUrl(attachment.url) || attachment.url); setPreviewName(attachment.fileName || "Attachment"); }}
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
                                </div>
                              ))
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
                                </div>
                              ) : null}
                          </div>
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
                              <div className="space-y-4">
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
                                        isMe ? "items-end" : "items-start"
                                      )}
                                    >
                                      {showSenderName && (
                                        <span className="chat-sender-name ml-10">
                                          {c.authorFullName || c.authorUsername}
                                        </span>
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
                                                  <img src={c.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
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
                                          <div className={cn(
                                            "chat-bubble",
                                            isMe ? "chat-bubble-me" : "chat-bubble-others"
                                          )}>
                                            {editingCommentId === c.id ? (
                                              <div className="space-y-2">
                                                <textarea
                                                  value={editCommentDraft}
                                                  onChange={(e) => setEditCommentDraft(e.target.value)}
                                                  className="w-full min-h-[60px] bg-transparent border-0 focus:ring-0 resize-y p-0 text-sm"
                                                  autoFocus
                                                />
                                                <div className="flex items-center gap-2 justify-end">
                                                  <Button type="button" size="sm" variant="ghost" onClick={cancelEditComment} className="h-7 text-xs">
                                                    Cancel
                                                  </Button>
                                                  <Button type="button" size="sm" onClick={() => void saveEditComment()} disabled={!editCommentDraft.trim()} className="h-7 text-xs">
                                                    Save
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="whitespace-pre-wrap break-words overflow-hidden leading-snug">
                                                {renderMessageWithMentions(c.message)}
                                              </div>
                                            )}
                                            
                                            {c.attachments && c.attachments.length > 0 && editingCommentId !== c.id && (
                                              <div className={cn(
                                                "grid gap-2 mt-2 max-w-[140px] sm:max-w-[180px]",
                                                c.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                              )}>
                                                {c.attachments.map((att, attIdx) => (
                                                  <div key={attIdx} className="relative rounded-lg overflow-hidden border border-white/20 bg-black/10 min-w-[120px] max-w-full h-auto">
                                                    <CommentAttachmentImg 
                                                      taskId={selectedTask!.id} 
                                                      commentId={c.id} 
                                                      index={attIdx} 
                                                      mimeType={att.mimeType} 
                                                      fileName={att.fileName} 
                                                      fallbackUrl={att.url} 
                                                      onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className={cn(
                                            "chat-timestamp",
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

                                        {/* Three dots menu for Edit/Delete */}
                                        {isMe && editingCommentId !== c.id && (
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button 
                                                  type="button" 
                                                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                                                  title="Actions"
                                                >
                                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-36">
                                                <DropdownMenuItem onClick={() => startEditComment(c)} className="text-xs">
                                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                  onClick={() => confirmDeleteComment(c.id)} 
                                                  className="text-xs text-destructive focus:text-destructive"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
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
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{e.initials}</AvatarFallback>
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
                  </div>


                  {/* Right Pane: Properties Sidebar */}
                  <div className="w-full md:w-[320px] lg:w-[360px] bg-muted/10 shrink-0 border-t md:border-t-0 md:border-l border-border/50 overflow-y-auto hidden md:block">
                    <div className="p-6 space-y-7">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b">Properties</h3>

                      {/* Assignees */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assignees</label>
                        <div className="flex flex-col gap-2">
                          {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                            selectedTask.assignees.map((assignee, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-border">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                    {assignee.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground/80">{resolveAssigneeName(assignee)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground italic bg-muted/20 border border-dashed rounded-lg p-3 text-center">Unassigned</div>
                          )}
                        </div>
                      </div>

                      {/* Task Contributors */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> Task Contributors
                        </label>
                        <TaskContributorsList taskId={selectedTask.id} />
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Priority</label>
                          <Badge className={cn("px-3 py-1 font-bold text-[11px] capitalize rounded-full", priorityClasses[selectedTask.priority])}>
                            {selectedTask.priority}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Status</label>
                          <Select value={selectedTask.status} onValueChange={(v) => void updateStatus(v as Task["status"])} disabled={statusSaving}>
                            <SelectTrigger className={cn("h-9 font-medium text-xs bg-background border-border/60", statusClasses[selectedTask.status])}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Due Date</label>
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground/70 bg-background border border-border/60 rounded-lg px-3 py-2">
                            {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date"}
                            {selectedTask.dueTime && <span className="text-muted-foreground/60 ml-auto font-medium">{selectedTask.dueTime}</span>}
                          </div>
                        </div>
                        {selectedTask.location && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</label>
                            <p className="text-[13px] font-medium text-foreground bg-background border border-border/60 rounded-lg px-3 py-2 truncate" title={selectedTask.location}>{selectedTask.location}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 space-y-3">
                        <Button variant="outline" className="w-full justify-start gap-2 h-10 text-[13px] font-semibold border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all" onClick={() => void handlePrintTask(selectedTask)}>
                          <Printer className="h-4 w-4" /> Print PDF
                        </Button>
                        <Button className="w-full gap-2 h-10 text-[13px] font-bold shadow-md hover:shadow-lg transition-all" onClick={() => { setIsViewOpen(false); openEdit(selectedTask); }}>
                          <Edit className="h-4 w-4" /> Edit Task Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedTask(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditTask)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Short description" className="min-h-[90px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-Assignees Edit */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Assignees *</label>
                  <Popover open={editAssigneesOpen} onOpenChange={setEditAssigneesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between h-10"
                      >
                        <span className="truncate">
                          {editSelectedAssignees.length > 0
                            ? editSelectedAssignees.join(", ")
                            : "Select assignees"}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search employees..." />
                        <CommandList>
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            {activeEmployees.map((employee) => (
                              <CommandItem
                                key={employee.id}
                                value={employee.name}
                                onSelect={() => {
                                  setEditSelectedAssignees((prev) =>
                                    prev.includes(employee.name)
                                      ? prev.filter((name) => name !== employee.name)
                                      : [...prev, employee.name]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editSelectedAssignees.includes(employee.name)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {employee.initials}
                                  </AvatarFallback>
                                </Avatar>
                                {employee.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {editSelectedAssignees.length === 0 && (
                    <p className="text-xs text-destructive">At least one assignee is required</p>
                  )}
                </div>

                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Office" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dueTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Task Attachment</label>
                  <div className="flex flex-col gap-3 p-4 border border-dashed rounded-lg bg-muted/30">
                    {editTaskFilePreview ? (
                      <div className="relative w-full h-40 rounded-md overflow-hidden border">
                        <img src={editTaskFilePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                          onClick={() => { setEditTaskFile(null); setEditTaskFilePreview(null); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border/60 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('edit-task-attachment-input-manager')?.click()}>
                        <Paperclip className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Click to upload or drag image</span>
                        <span className="text-[10px] opacity-70">PNG, JPG, PDF (Max 10MB)</span>
                      </div>
                    )}
                    <input 
                      id="edit-task-attachment-input-manager"
                      type="file" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditTaskFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setEditTaskFilePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditSelectedAssignees([]); }} disabled={updateTaskMutation.isPending} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTaskMutation.isPending} className="w-full sm:w-auto gap-2">{updateTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTaskMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTaskMutation.isPending} className="gap-2">{deleteTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Cards Grid (only visible after project selected) */}
      {selectedProject && (
        <div className="space-y-6">
          {tasksQuery.isLoading ? (
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
              Loading tasks...
            </div>
          ) : tasksQuery.isError ? (
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-destructive">
              {tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : "Failed to load tasks"}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground text-center">
              No tasks found
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl border border-muted/50 hover:border-primary/50 transition-all hover:shadow-md overflow-hidden flex flex-col group cursor-pointer"
                    onClick={() => openView(task)}
                  >
                    {/* Card Header with Title and Menu */}
                    <div className="p-4 border-b border-muted/30 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground line-clamp-1">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{task.priority} priority</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Task actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openView(task); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void handlePrintTask(task); }}>
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(task); }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDelete(task); }}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 space-y-3">
                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>

                      {/* Assignees */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Assigned to</p>
                        <div className="flex items-center gap-2">
                          {task.assignees && task.assignees.length > 0 ? (
                            <>
                              <div className="flex -space-x-2">
                                {task.assignees.slice(0, 3).map((assignee, idx) => {
                                  const displayName = resolveAssigneeName(assignee);
                                  return (
                                    <Avatar key={idx} className="w-7 h-7 border-2 border-background">
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                        {displayName.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {task.assignees.length > 3 && (
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-foreground">
                                {task.assignees.slice(0, 2).map(resolveAssigneeName).join(", ")} {task.assignees.length > 2 ? `+${task.assignees.length - 2}` : ""}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Status & Priority Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", statusClasses[task.status])}
                        >
                          {task.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs border", priorityClasses[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Card Footer with Dates and Location */}
                    <div className="p-4 border-t border-muted/30 bg-muted/10 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                      {task.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs">{task.location}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
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

      <Dialog open={isViewProjectOpen} onOpenChange={setIsViewProjectOpen}>
        <DialogContent className="w-[98vw] sm:max-w-[95vw] lg:max-w-[1100px] h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-2xl">
          {selectedProject && (
            <>
              <DialogHeader className="p-4 sm:p-6 border-b bg-card flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-wider font-bold bg-muted/30 text-primary border-primary/20">Project Overview</Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">• {selectedProject.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <DialogTitle className="text-lg sm:text-2xl font-bold truncate leading-tight">{selectedProject.name}</DialogTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsViewProjectOpen(false)} className="rounded-full h-8 w-8 hover:bg-muted/80">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                  <div className="p-4 sm:p-7 space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <h4 className="text-[13px] font-bold uppercase tracking-wider">About this project</h4>
                      </div>
                      <div className="bg-muted/10 border border-border/40 rounded-xl p-4 sm:p-5 shadow-inner">
                        <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {selectedProject.description || <span className="text-muted-foreground/50 italic">No description provided.</span>}
                        </p>
                      </div>
                    </div>

                    {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Paperclip className="w-4 h-4" />
                          <h4 className="text-[13px] font-bold uppercase tracking-wider">Project Files</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {selectedProject.attachments.map((attachment, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/60 bg-background shadow-xs hover:shadow-md transition-shadow">
                              {attachment.mimeType?.startsWith("image/") ? (
                                <img src={attachment.url} alt={attachment.fileName} className="w-full h-24 object-cover" />
                              ) : (
                                <div className="w-full h-24 flex items-center justify-center bg-muted/40"><FileText className="h-8 w-8 text-muted-foreground/60" /></div>
                              )}
                              <div className="p-2 border-t text-[11px] font-medium truncate text-muted-foreground">{attachment.fileName}</div>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]"><span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/50 bg-black/40">Open File</span></a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/60">
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" /> Project Discussion
                        </h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { if (selectedProject) void loadProjectComments(selectedProject.id); }} disabled={projectCommentsLoading} className="h-7 px-2 text-[11px] gap-1 hover:bg-muted/50">
                          <RefreshCw className={cn("w-3 h-3", projectCommentsLoading && "animate-spin")} /> Refresh Feed
                        </Button>
                      </div>

                      <div className="space-y-6 lg:ml-2">
                        {projectCommentsLoading && projectComments.length === 0 ? (
                          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : projectComments.length === 0 ? (
                          <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No discussion yet on this project.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full max-h-[500px] bg-muted/5 rounded-2xl border border-border/40 overflow-hidden">
                            <div 
                              ref={projectChatContainerRef} 
                              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
                            >
                              {projectCommentsLoading && projectComments.length === 0 ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                              ) : projectComments.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                  <p className="text-sm font-medium">No discussion yet on this project.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {projectComments.map((c, idx) => {
                                    const isMe = c.authorUsername === currentUsername;
                                    const prevComment = idx > 0 ? projectComments[idx - 1] : null;
                                    const showSenderName = !isMe && prevComment?.authorUsername !== c.authorUsername;
                                    
                                    return (
                                      <div 
                                        key={c.id} 
                                        className={cn(
                                          "flex flex-col group",
                                          isMe ? "items-end" : "items-start"
                                        )}
                                      >
                                        {showSenderName && (
                                          <span className="chat-sender-name ml-10">
                                            {c.authorFullName || c.authorUsername}
                                          </span>
                                        )}
                                        
                                        <div className={cn(
                                          "flex items-end gap-2 max-w-[85%]",
                                          isMe ? "flex-row-reverse" : "flex-row"
                                        )}>
                                          {!isMe && (
                                            <Avatar className="w-8 h-8 border shadow-sm flex-shrink-0 mb-1">
                                              {c.authorAvatar ? (
                                                <img src={c.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                                              ) : (
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                  {(c.authorFullName || c.authorUsername).substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                              )}
                                            </Avatar>
                                          )}
                                          
                                          <div className="flex flex-col group/bubble relative">
                                            <div className={cn(
                                              "chat-bubble",
                                              isMe ? "chat-bubble-me" : "chat-bubble-others"
                                            )}>
                                              <div className="whitespace-pre-wrap break-words">
                                                {renderMessageWithMentions(c.message)}
                                              </div>
                                              
                                              {c.attachments && c.attachments.length > 0 && (
                                                <div className="grid grid-cols-1 gap-2 mt-2 max-w-[140px] sm:max-w-[180px]">
                                                  {c.attachments.map((att, attIdx) => (
                                                    <div key={attIdx} className="relative rounded-lg overflow-hidden border border-border bg-background/10 group/att h-auto">
                                                      <CommentAttachmentImg 
                                                        projectId={selectedProject.id} 
                                                        commentId={c.id} 
                                                        index={attIdx} 
                                                        mimeType={att.mimeType} 
                                                        fileName={att.fileName} 
                                                        fallbackUrl={att.url} 
                                                      />
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className={cn(
                                              "chat-timestamp",
                                              isMe ? "text-right mr-1" : "text-left ml-1"
                                            )}>
                                              {formatMessageTime(c.createdAt)}
                                            </div>
                                          </div>
                                          
                                          {isMe && (
                                            <div className="flex flex-col justify-end pb-1 opacity-40">
                                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 ml-0 lg:ml-14 relative rounded-2xl border-2 border-border/60 bg-background overflow-visible focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
                        {commentAttachments.length > 0 && (
                          <div className="p-2 border-b bg-muted/10 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                            {commentAttachments.map((f, i) => (
                              <div key={i} className="relative rounded-md border border-border/50 bg-background flex flex-col items-center justify-center p-2 text-center h-16 group shadow-xs">
                                <span className="text-[10px] w-full mt-1 truncate font-medium text-muted-foreground">{f.name}</span>
                                <button type="button" onClick={() => setCommentAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] shadow-sm">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <textarea
                          value={commentDraft}
                          onChange={(e) => handleTypingIndicator(e, true)}
                          placeholder="Announce something to the project team..."
                          className="w-full min-h-[90px] max-h-[300px] border-0 focus:ring-0 resize-y p-4 text-[14px] bg-transparent outline-none placeholder-muted-foreground/60 font-medium"
                        />
                        <div className="flex items-center justify-between p-2 pl-3 bg-muted/20 border-t border-border/40">
                          <button type="button" onClick={() => { const el = document.getElementById("project-comment-attachment-input") as HTMLInputElement; el?.click(); }} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5" title="Attach file">
                            <Paperclip className="w-4 h-4" /> <span className="text-xs font-semibold hidden sm:inline">Attach Files</span>
                          </button>
                          <input id="project-comment-attachment-input" type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) { setCommentAttachments(prev => [...prev, ...Array.from(e.target.files!)]); } e.target.value = ''; }} />
                          <Button type="button" onClick={() => void sendComment(true)} disabled={(!commentDraft.trim() && commentAttachments.length === 0) || isSendingComment} size="sm" className="h-9 px-5 rounded-lg font-bold shadow hover:shadow-md transition-all">
                            {isSendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post Announcement"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[320px] lg:w-[360px] bg-muted/10 shrink-0 border-t md:border-t-0 md:border-l border-border/50 overflow-y-auto hidden md:block">
                  <div className="p-6 space-y-7">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b">Project Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-3 border border-border/50 shadow-xs">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Tasks</p>
                        <p className="text-xl font-bold">{selectedProject.tasks.length}</p>
                      </div>
                      <div className="bg-background rounded-xl p-3 border border-border/50 shadow-xs">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Attachments</p>
                        <p className="text-xl font-bold">{selectedProject.attachments?.length || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Project Team</label>
                      <div className="flex flex-col gap-2">
                        {selectedProject.assignees && selectedProject.assignees.length > 0 ? (
                          selectedProject.assignees.map((assignee, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-xs transition-colors hover:border-border">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{assignee.split(" ").map(n => n ? n[0] : "").join("").toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-[13px] font-semibold text-foreground/80">{resolveAssigneeName(assignee)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">No team members assigned</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Timeline</label>
                      <div className="bg-background border border-border/60 rounded-xl p-4 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="w-3 h-3" /> Created On</span>
                          <span className="text-xs font-bold">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Status</span>
                          <Badge variant="outline" className="text-[10px] font-bold capitalize">{selectedProject.status || "In Planning"}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview Lightbox */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-[95vw] w-fit p-0 border-none bg-transparent shadow-none">
          <div className="relative group/preview-modal">
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3 opacity-0 group-hover/preview-modal:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); if (previewUrl) void downloadViaUrl(previewUrl, previewName); }}
                className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewUrl && (
              <div className="flex flex-col items-center">
                <img 
                  src={previewUrl} 
                  alt={previewName} 
                  className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl" 
                />
                <div className="mt-4 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-medium shadow-lg">
                  {previewName}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setDeletingCommentId(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteComment()}
              className="gap-2 bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
