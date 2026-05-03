import { useMemo, useState, useEffect } from "react";
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
  MessageSquare,
  RefreshCw,
  TrendingUp,
  PlusCircle,
  Paperclip,
  Layers,
  Maximize2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";
import { cn } from "@/lib/manger/utils";
import { apiFetch, downloadTaskAttachment, toProxiedUrl, updateComment, deleteComment } from "@/lib/manger/api";
import { getAuthState } from "@/lib/auth";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Pagination } from "@/components/Pagination";

interface Task {
  id: string;
  taskNumber?: number;
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
  taskId: string;
  message: string;
  authorUsername: string;
  authorFullName?: string;
  authorRole?: string;
  createdAt: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt?: string;
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
    taskNumber: t.taskNumber,
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

function getAttachmentCounts(attachments?: any[], attachment?: any) {
  const allAttachments = Array.isArray(attachments) ? [...attachments] : [];
  if (attachment && attachment.url && !allAttachments.some(a => a.url === attachment.url)) {
    allAttachments.push(attachment);
  }
  
  const images = allAttachments.filter(a => a.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.fileName || "")).length;
  const files = allAttachments.length - images;
  
  return { images, files };
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

function TaskAttachmentImg({ taskId, index, mimeType, fileName, fallbackUrl, onPreview }: { taskId: string; index: number; mimeType?: string; fileName?: string; fallbackUrl?: string; onPreview?: (url: string, name: string) => void }) {
  const [src, setSrc] = useState<string | null>(toProxiedUrl(fallbackUrl) as string || null);

  useEffect(() => {
    // If fallbackUrl is a real URL (S3 or data:), use it directly
    if (fallbackUrl && fallbackUrl.length > 0) {
      setSrc(toProxiedUrl(fallbackUrl) || fallbackUrl);
      return;
    }
    // fallbackUrl is undefined or empty string — fetch from dedicated endpoint
    apiFetch<{ url: string }>(`/api/tasks/${taskId}/attachments/${index}`)
      .then(d => setSrc(toProxiedUrl(d.url) as string || null))
      .catch(() => setSrc(null));
  }, [taskId, index, fallbackUrl]);

  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/task-att cursor-zoom-in" onClick={() => onPreview?.(src, fileName || "Attachment")}>
      <img src={src} alt={fileName} className="w-full h-24 object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/task-att:opacity-100 flex items-center justify-center transition-all duration-200">
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
          onClick={(e) => { e.stopPropagation(); onPreview?.(src, fileName || "Attachment"); }}
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <a 
          href={src} 
          download={fileName} 
          aria-label="Download" 
          onClick={(e) => e.stopPropagation()} 
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
  return <div className="w-full h-24 flex items-center justify-center bg-muted/40"><FileText className="h-8 w-8 text-muted-foreground/60" /></div>;
}

function CommentAttachmentImg({ taskId, commentId, index, mimeType, fileName, fallbackUrl, onPreview }: { taskId: string; commentId: string; index: number; mimeType?: string; fileName?: string; fallbackUrl?: string; onPreview?: (url: string, name: string) => void }) {
  const [src, setSrc] = useState<string | null>(toProxiedUrl(fallbackUrl) as string || null);
  useEffect(() => {
    if (fallbackUrl) return;
    apiFetch<{ url: string }>(`/api/tasks/${taskId}/comments/${commentId}/attachments/${index}`)
      .then(d => setSrc(toProxiedUrl(d.url) as string || null))
      .catch(() => setSrc(null));
  }, [taskId, commentId, index, fallbackUrl]);

  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/att cursor-zoom-in" onClick={() => onPreview?.(src, fileName || "Attachment")}>
      <img src={src} alt={fileName} className="w-full h-24 object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-all duration-200">
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
          onClick={(e) => { e.stopPropagation(); onPreview?.(src, fileName || "Attachment"); }}
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <a 
          href={src} 
          download={fileName} 
          aria-label="Download" 
          onClick={(e) => e.stopPropagation()} 
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
  return <div className="w-full h-24 flex items-center justify-center bg-muted/40"><FileText className="h-8 w-8 text-muted-foreground/60" /></div>;
}

function formatMessageTime(date: string | Date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Now";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Now";
  }
}

function renderMessageWithMentions(message: string) {
  if (!message) return null;
  const parts = message.split(/(@[a-zA-Z0-9 ]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return <span key={i} className="text-primary font-bold bg-primary/10 px-1 rounded">{part}</span>;
    }
    return part;
  });
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
    contributionType?: string;
    actions?: string[];
    addedAt?: string;
    avatar?: string;
    stats?: any;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContributors = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ items: typeof contributors }>(`/api/contributors/task/${encodeURIComponent(taskId)}/contributors`);
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
    return <div className="text-xs text-muted-foreground/70 italic">Loading collaborators...</div>;
  }

  if (contributors.length === 0) {
    return <div className="text-xs text-muted-foreground/70 italic bg-muted/10 border border-dashed border-border/40 rounded-lg p-3 text-center">No collaborators yet</div>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
      {contributors.map((contributor, idx) => (
        <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-xs">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700 font-bold">
              {contributor.name?.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-foreground/80 truncate">{contributor.name || "Unknown"}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[8px] h-3 px-1">
                {contributor.contributionType || "collaborator"}
              </Badge>
              <span className="text-[9px] text-muted-foreground">
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
  const [commentError, setCommentError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const queryClient = useQueryClient();
  const { triggerBlaster, incrementCompletedCount, isEligible } = useTaskBlasterContext();

  const currentUsername = getAuthState().username || "";
  const [projectComments, setProjectComments] = useState<any[]>([]);
  const [projectCommentsLoading, setProjectCommentsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Lightbox / File Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isViewProjectOpen, setIsViewProjectOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const chatContainerRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

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
    refetchInterval: 10000, // Auto-refresh every 10 seconds
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
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Reset pages when filters change
  useEffect(() => { setTaskPage(1); }, [searchQuery, statusFilter, priorityFilter, selectedProject?.id]);
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
    mutationFn: async ({ id, payload }: { id: string; payload: CreateTaskValues }) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return normalizeTask(res.item);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProject && selectedProject.id === variables.projectId) {
        setSelectedProject({ ...selectedProject, status: variables.status });
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

      const payload: CreateProjectPayload & { assignees?: string[]; logo?: ProjectLogo } = {
        name: projectName.trim(),
        description,
        assignees: projectCreationAssignees,
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

  const loadProjectComments = async (projectId: string) => {
    try {
      setProjectCommentsLoading(true);
      setCommentError(null);
      const res = await apiFetch<{ items: any[] }>(`/api/projects/${encodeURIComponent(projectId)}/comments`);
      setProjectComments(Array.isArray(res.items) ? res.items : []);
      setIsViewProjectOpen(true);
    } catch (err) {
      setCommentError("Failed to load project activity");
    } finally {
      setProjectCommentsLoading(false);
    }
  };

  const sendComment = async (isProject = false) => {
    const id = isProject ? selectedProject?.id : selectedTask?.id;
    if (!id) return;

    const msg = commentDraft.trim();
    if (!msg && commentAttachments.length === 0) return;

    try {
      setIsSendingComment(true);
      setCommentError(null);

      const endpoint = isProject
        ? `/api/projects/${encodeURIComponent(id)}/comments`
        : `/api/tasks/${encodeURIComponent(id)}/comments`;

      const processedAttachments = await Promise.all(
        commentAttachments.map(
          (file) =>
            new Promise<{ fileName: string; mimeType: string; size: number; url: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  fileName: file.name,
                  mimeType: file.type,
                  size: file.size,
                  url: reader.result as string,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await apiFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify({ message: msg, attachments: processedAttachments }),
      });

      if (isProject) {
        setProjectComments((prev) => [...prev, res.item]);
      } else {
        setComments((prev) => [...prev, res.item]);
      }

      setCommentDraft("");
      setCommentAttachments([]);
      
      // Smooth scroll to bottom
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

  // Socket.io for Real-time
  useEffect(() => {
    const token = getAuthState().token;
    if (!token) return;

    const socket: Socket = io(import.meta.env.VITE_API_BASE_URL || "https://api.task.se7eninc.com", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    
    socket.on("new-comment", (data: { taskId: string; comment: any }) => {
      if (selectedTask && data.taskId === selectedTask.id) {
        setComments(prev => {
          if (prev.find(c => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    });

    socket.on("new-project-comment", (data: { projectId: string; comment: any }) => {
      if (selectedProject && data.projectId === selectedProject.id) {
        setProjectComments(prev => {
          if (prev.find(c => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [selectedTask?.id, selectedProject?.id]);

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

  const onEditTask = (values: CreateTaskValues) => {
    if (!selectedTask) return;
    const previousStatus = selectedTask.status;

    updateTaskMutation.mutate(
      { id: selectedTask.id, payload: { ...values, assignees: editSelectedAssignees } },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditSelectedAssignees([]);
          toast({
            title: "Task updated",
            description: "Task has been updated.",
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

  const sourceTasks = selectedProject ? selectedProject.tasks : tasks;

  const filteredTasks = useMemo(() => {
    if (!selectedProject) return sourceTasks; // already filtered & paginated server-side
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

  const filteredProjects = projects; // filtering handled server-side

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
              <Button variant="outline" onClick={() => {
                setSelectedProject(null);
                setTaskPage(1);
              }}>
                Back to Projects
              </Button>
              <Button className="gap-2" onClick={() => setIsCreateTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </>
          ) : null}
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

      {selectedProject ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
          <div className="flex items-start gap-3">
            {selectedProject.logo?.url ? (
              <img src={selectedProject.logo.url} alt={`${selectedProject.name} logo`} className="w-12 h-12 rounded-md object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">Logo</div>
            )}
            <div>
              <h2 className="font-semibold text-lg">Project: {selectedProject.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedProject.description || "No description"}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedProject.assignees && selectedProject.assignees.length > 0 ? selectedProject.assignees.map(resolveAssigneeName).join(", ") : "No assignees"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground mt-3">
            <div className="flex items-center gap-3">
               <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {(tasksQuery.data?.items.length ?? 0) > 0 ? tasksQuery.data?.items.length : (selectedProject.tasks?.length || 0)} tasks</span>
               {(() => {
                 const { images, files } = getAttachmentCounts(selectedProject.attachments);
                 return (images > 0 || files > 0) && (
                   <div className="flex items-center gap-3 border-l pl-3 border-border/40">
                     {images > 0 && <span className="flex items-center gap-1 text-primary"><Paperclip className="w-3 h-3" /> {images} Image{images !== 1 ? "s" : ""}</span>}
                     {files > 0 && <span className="flex items-center gap-1 text-indigo-600"><FileText className="w-3 h-3" /> {files} File{files !== 1 ? "s" : ""}</span>}
                   </div>
                 );
               })()}
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="h-7 text-[10px] font-black uppercase tracking-wider gap-1.5 hover:bg-primary/5 hover:text-primary transition-all rounded-full border-primary/20" 
                 onClick={() => void loadProjectComments(selectedProject.id)}
               >
                 <TrendingUp className="w-3 h-3" /> Project activity
               </Button>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedProject.status || "No status"} onValueChange={(value) => {
                updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: value }, {
                  onSuccess: () => {
                    setSelectedProject({...selectedProject, status: value});
                  }
                });
              }}>
                <SelectTrigger className="w-[120px] h-8 font-bold text-[10px] uppercase">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="font-bold">
                  <SelectItem value="No tasks">No tasks</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <span>{selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : ""}</span>
            </div>
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
                    <button
                      key={project.id}
                      onClick={() => void loadProject(project.id)}
                      className="text-left p-3 sm:p-4 rounded-lg border border-border hover:border-primary transition bg-card shadow-sm hover:shadow-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 text-xs font-bold text-muted-foreground w-5 text-right">{projectNumber}.</span>
                        <ProjectLogoImg projectId={project.id} projectName={project.name} logoUrl={project.logo?.url} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{project.description || "No description"}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="truncate">{assigneeList.length > 0 ? assigneeList.join(", ") : "No assignees"}</span>
                        <div className="flex items-center gap-2">
                          <span className="ml-2 flex-shrink-0">{taskNum} task{taskNum === 1 ? "" : "s"}</span>
                          {(() => {
                            const { images, files } = getAttachmentCounts(project.attachments);
                            return (images > 0 || files > 0) && (
                              <div className="flex items-center gap-1.5 border-l pl-1.5 border-border/40">
                                {images > 0 && <span className="text-primary/70"><Paperclip className="w-2.5 h-2.5" /></span>}
                                {files > 0 && <span className="text-indigo-600/70"><FileText className="w-2.5 h-2.5" /></span>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-dashed border-border/40">
                        <Badge className="capitalize font-black text-[9px] px-1.5 h-4" variant="outline">
                          {project.status || "No tasks"}
                        </Badge>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedProject({ ...project, tasks: [] });
                            void loadProjectComments(project.id); 
                          }} 
                          className="text-primary font-black text-[9px] uppercase tracking-widest hover:underline flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full"
                        >
                           <MessageSquare className="w-2.5 h-2.5" /> Activity
                        </button>
                        <span className="text-[10px] text-muted-foreground/60 font-bold">
                          {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </button>
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
                        <p className="font-medium truncate text-sm">
                          <span className="text-primary mr-1.5">{task.taskNumber || ((taskPage - 1) * PAGE_SIZE + tasks.indexOf(task) + 1)}.</span>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p>
                      </div>

                      {/* Attachment Summary */}
                      {(() => {
                        const { images, files } = getAttachmentCounts(task.attachments, task.attachment);
                        return (images > 0 || files > 0) && (
                          <div className="flex items-center gap-1.5 py-1 px-2 bg-primary/5 border border-primary/10 rounded-md w-fit mb-2">
                            <Paperclip className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
                              {[
                                images > 0 && `${images} image${images !== 1 ? "s" : ""}`,
                                files > 0 && `${files} file${files !== 1 ? "s" : ""}`
                              ].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        );
                      })()}

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
                  aria-label="Upload project logo"
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
                    aria-label="Upload project attachments"
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
                                setProjectCreationAssigneesOpen(false);
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
                    spellCheck="true"
                    autoCorrect="on"
                    autoComplete="on"
                  />
                  {validationErrors.description && <p className="text-xs text-destructive">{validationErrors.description}</p>}
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
                    aria-label="Upload task attachments"
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
                        <Badge variant="outline" className={cn("text-[10px] h-5 uppercase tracking-wider font-extrabold px-2 shadow-sm rounded-full", priorityClasses[selectedTask.priority])}>
                          {selectedTask.priority} Priority
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold tracking-tight">• {selectedTask.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <DialogTitle className="text-xl sm:text-2xl font-black truncate leading-tight tracking-tight text-foreground">{selectedTask.title}</DialogTitle>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                    <div className="p-4 sm:p-8 space-y-10 max-w-4xl mx-auto">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground/80">
                          <FileText className="w-4 h-4" />
                          <h4 className="text-[12px] font-bold uppercase tracking-widest">Description</h4>
                        </div>
                        <div className="bg-muted/10 border border-border/40 rounded-2xl p-5 sm:p-6 shadow-sm">
                          <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                            {selectedTask.description || <span className="text-muted-foreground/50 italic">No description provided.</span>}
                          </p>
                        </div>
                      </div>

                      {/* Attachments Deck */}
                      {(selectedTask.attachments?.length || selectedTask.attachment?.url || selectedProject?.attachments?.length) ? (
                        <div className="space-y-5">
                          <div className="flex items-center gap-2 text-muted-foreground/80">
                            <Paperclip className="w-4 h-4" />
                            <h4 className="text-[12px] font-bold uppercase tracking-widest">Shared Assets</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Task Specific Attachments */}
                            {selectedTask.attachments?.map((att, idx) => (
                              <div key={`task-att-${idx}`} className="relative group rounded-xl overflow-hidden border border-border/60 bg-background shadow-xs hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-zoom-in" onClick={() => {
                                if (att.url) {
                                  setPreviewUrl(att.url);
                                  setPreviewName(att.fileName || "Attachment");
                                }
                              }}>
                                <TaskAttachmentImg taskId={selectedTask.id} index={idx} mimeType={att.mimeType} fileName={att.fileName} fallbackUrl={att.url} onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }} />
                                <div className="p-2.5 border-t text-[11px] font-bold truncate bg-card/50 backdrop-blur-sm text-muted-foreground">{att.fileName}</div>
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewUrl(att.url);
                                      setPreviewName(att.fileName || "Attachment");
                                    }} 
                                    className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Preview"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void downloadTaskAttachment(selectedTask.id, idx, att.fileName);
                                    }} 
                                    className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Project Attachments */}
                            {selectedProject?.attachments?.map((att, idx) => (
                              <div key={`proj-att-${idx}`} className="relative group rounded-xl overflow-hidden border border-primary/20 bg-primary/5 shadow-xs hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-zoom-in" onClick={() => {
                                if (att.url) {
                                  setPreviewUrl(att.url);
                                  setPreviewName(att.fileName || "Attachment");
                                }
                              }}>
                                <div className="absolute top-2 left-2 z-10"><Badge className="text-[8px] h-4 bg-primary text-white font-black border-none px-1.5 uppercase">Project</Badge></div>
                                {(att.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.fileName || "")) && att.url ? (
                                  <img src={att.url} alt={att.fileName} className="w-full h-24 object-cover" />
                                ) : (
                                  <div className="w-full h-24 flex items-center justify-center bg-muted/20"><FileText className="h-8 w-8 text-muted-foreground/40" /></div>
                                )}
                                <div className="p-2.5 border-t text-[11px] font-bold truncate bg-white/40 backdrop-blur-sm text-primary/70">{att.fileName}</div>
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewUrl(att.url); setPreviewName(att.fileName || "Attachment"); }}
                                    className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Preview"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </button>
                                  <a 
                                    href={att.url} 
                                    download={att.fileName}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedTask.attachmentNote && <p className="text-[11px] font-medium text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed border-border/60 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5" /> {selectedTask.attachmentNote}</p>}
                        </div>
                      ) : null}

                      {/* Activity Feed */}
                      <div className="pt-6 border-t border-border/60">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[13px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Activity Feed
                          </h4>
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={autoRefreshEnabled} onChange={(e) => setAutoRefreshEnabled(e.target.checked)} className="rounded border-border/60 text-primary focus:ring-primary" /> Auto Update
                            </label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { if (selectedTask) void loadComments(selectedTask.id); }} disabled={commentsLoading} className="h-8 px-3 text-[11px] font-bold gap-1.5 hover:bg-muted/80 rounded-full transition-all">
                              <RefreshCw className={cn("w-3 h-3", commentsLoading && "animate-spin")} /> Refresh
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-8 lg:ml-4" ref={chatContainerRef}>
                          {commentsLoading && comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 space-y-3"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading discussions...</p></div>
                          ) : comments.length === 0 ? (
                            <div className="text-center p-12 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 flex flex-col items-center">
                              <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center shadow-inner mb-4 border border-border/50"><MessageSquare className="h-6 w-6 text-muted-foreground/30" /></div>
                              <p className="text-sm font-bold text-foreground/60">No activity yet</p>
                              <p className="text-[11px] text-muted-foreground/60 font-medium mt-1">Be the first to leave a comment or update</p>
                            </div>
                          ) : (
                            <div className="space-y-8 relative">
                              <div className="absolute left-4.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"></div>
                              {comments.map((c) => (
                                <div key={c.id} className="flex gap-4 group relative">
                                  <Avatar className="w-10 h-10 border-2 border-background shadow-md flex-shrink-0 z-10 overflow-hidden ring-4 ring-muted/10">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black uppercase tracking-tighter">
                                      {(c.authorFullName || c.authorUsername || "U").split(" ").map((n: string) => n ? n[0] : "").join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2 min-w-0 bg-card p-4 rounded-2xl border border-border/60 ml-2 group-hover:border-primary/20 transition-all shadow-xs group-hover:shadow-md">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-[13px] text-foreground tracking-tight">{c.authorFullName || c.authorUsername}</span>
                                        {c.authorRole && <Badge variant="secondary" className="text-[9px] h-4 font-black bg-muted/50 text-muted-foreground uppercase px-1 border-none">{c.authorRole}</Badge>}
                                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight">{formatMessageTime(c.createdAt)}</span>
                                      </div>
                                    </div>
                                    <div className="text-[14px] leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap break-words">
                                      {renderMessageWithMentions(c.message)}
                                    </div>
                                    
                                    {/* Comment Attachments */}
                                    {c.attachments && c.attachments.length > 0 && (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-dashed border-border/50">
                                        {c.attachments.map((att, attIdx) => (
                                          <div key={attIdx} className="relative rounded-xl overflow-hidden border border-border/50 bg-background shadow-xs group/att aspect-square flex flex-col items-center justify-center cursor-pointer">
                                            <CommentAttachmentImg 
                                              taskId={selectedTask.id} 
                                              commentId={c.id} 
                                              index={attIdx} 
                                              mimeType={att.mimeType} 
                                              fileName={att.fileName} 
                                              fallbackUrl={att.url} 
                                              onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }}
                                            />
                                            <div className="p-1 px-2 text-[9px] w-full text-center font-bold text-muted-foreground/70 truncate border-t bg-muted/10">{att.fileName}</div>
                                            <a href={att.url || "#"} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"><Download className="h-5 w-5 text-white" /></a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Composer */}
                        <div className="mt-10 ml-0 lg:ml-16 sticky bottom-0 z-20">
                          <div className="relative rounded-3xl border-2 border-border/60 bg-background/80 backdrop-blur-xl overflow-visible focus-within:border-primary/40 focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-2xl">
                            {commentAttachments.length > 0 && (
                              <div className="p-3 border-b bg-muted/5 grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-40 overflow-y-auto rounded-t-3xl border-dashed">
                                {commentAttachments.map((f, i) => (
                                  <div key={i} className="relative rounded-xl border border-border/50 bg-background flex flex-col items-center justify-center p-2 text-center aspect-square group shadow-xs">
                                    {f.type.startsWith("image/") ? <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover rounded-md" /> : <FileText className="h-5 w-5 text-muted-foreground/60" />}
                                    <span className="text-[9px] w-full mt-1.5 truncate font-bold text-muted-foreground/70 uppercase px-1">{f.name}</span>
                                    <button type="button" onClick={() => setCommentAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-[10px] font-black border-2 border-background">✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <textarea
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="Type a message or share an update... @mention someone"
                              className="w-full min-h-[100px] max-h-[350px] border-0 focus:ring-0 resize-y p-5 text-[15px] bg-transparent outline-none placeholder-muted-foreground/50 font-semibold"
                              spellCheck="true"
                              autoCorrect="on"
                              autoComplete="on"
                            />
                            <div className="flex items-center justify-between p-3 pl-5 bg-muted/20 border-t border-border/40 rounded-b-[22px]">
                              <button type="button" onClick={() => { const el = document.getElementById("task-comment-attachment-input") as HTMLInputElement; el?.click(); }} className="p-2 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center gap-2 group" title="Shared assets">
                                <Paperclip className="w-4 h-4 group-hover:rotate-12 transition-transform" /> <span className="text-[12px] font-bold uppercase tracking-wider hidden sm:inline">Attach Files</span>
                              </button>
                              <input id="task-comment-attachment-input" type="file" multiple className="hidden" aria-label="Attach files to comment" onChange={(e) => { if (e.target.files) { setCommentAttachments(prev => [...prev, ...Array.from(e.target.files!)]); } e.target.value = ''; }} />
                              <Button type="button" onClick={() => void sendComment()} disabled={(!commentDraft.trim() && commentAttachments.length === 0) || isSendingComment} className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:shadow-primary/20 transition-all border-none">
                                {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Message"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Pane: Property Deck */}
                  <div className="w-full md:w-[320px] lg:w-[360px] bg-muted/10 shrink-0 border-t md:border-t-0 md:border-l border-border/50 overflow-y-auto hidden md:block">
                    <div className="p-8 space-y-10">
                      <h3 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-border/60">Property Deck</h3>

                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Assignees</label>
                        <div className="flex flex-col gap-2.5">
                          {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                            selectedTask.assignees.map((assignee, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-background border border-border/60 rounded-xl px-4 py-3 shadow-xs hover:border-primary/30 transition-colors">
                                <Avatar className="w-7 h-7 ring-2 ring-muted/10">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-black uppercase">{assignee.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-[13px] font-bold text-foreground/80 tracking-tight">{resolveAssigneeName(assignee)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[12px] text-muted-foreground/70 font-medium italic bg-muted/5 border border-dashed rounded-xl p-4 text-center">Unassigned</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest block">Priority Tier</label>
                          <Badge className={cn("px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-full shadow-sm", priorityClasses[selectedTask.priority])}>
                            {selectedTask.priority} Priority
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest block">Status Workflow</label>
                          <Select value={selectedTask.status} onValueChange={(v) => void updateStatus(v as Task["status"])} disabled={statusSaving}>
                            <SelectTrigger className={cn("h-11 font-black text-[11px] uppercase tracking-wider bg-background border-border/60 shadow-xs px-4 rounded-xl transition-all", statusClasses[selectedTask.status])}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-border/40 overflow-hidden font-bold">
                              <SelectItem value="pending" className="text-blue-600 focus:bg-blue-50 font-bold">Pending</SelectItem>
                              <SelectItem value="in-progress" className="text-amber-600 focus:bg-amber-50 font-bold">In Progress</SelectItem>
                              <SelectItem value="completed" className="text-green-600 focus:bg-green-50 font-bold">Completed</SelectItem>
                              <SelectItem value="overdue" className="text-red-600 focus:bg-red-50 font-bold">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3.5 h-3.5 ml-0.5" /> Delivery Date</label>
                          <div className="flex flex-col gap-1.5 bg-background border border-border/60 rounded-xl p-4 shadow-xs">
                            <span className="text-[14px] font-black text-foreground tracking-tight">{new Date(selectedTask.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            {selectedTask.dueTime && <span className="text-[11px] text-primary/70 font-black uppercase tracking-widest">{selectedTask.dueTime}</span>}
                          </div>
                        </div>
                        {selectedTask.location && (
                          <div className="space-y-3">
                            <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Workspace</label>
                            <p className="text-[13px] font-bold text-foreground/80 bg-background border border-border/60 rounded-xl px-4 py-3 truncate shadow-xs" title={selectedTask.location}>{selectedTask.location}</p>
                          </div>
                        )}
                        {(() => {
                          const { images, files } = getAttachmentCounts(selectedTask.attachments, selectedTask.attachment);
                          return (images > 0 || files > 0) && (
                            <div className="space-y-3">
                              <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2"><Paperclip className="w-3.5 h-3.5" /> Attachments</label>
                              <div className="flex items-center gap-4 bg-background border border-border/60 rounded-xl px-4 py-3 shadow-xs">
                                {images > 0 && <span className="flex items-center gap-1.5 text-xs font-bold text-primary"><Paperclip className="w-3.5 h-3.5" /> {images} Image{images !== 1 ? "s" : ""}</span>}
                                {files > 0 && <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600"><FileText className="w-3.5 h-3.5" /> {files} File{files !== 1 ? "s" : ""}</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Task Collaborators */}
                      <div className="space-y-3 pt-6 border-t border-border/60">
                        <label className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" /> Collaborators
                        </label>
                        <TaskContributorsList taskId={selectedTask.id} />
                      </div>

                      <div className="pt-8 space-y-3 border-t border-border/60 border-dashed">
                        <Button variant="outline" className="w-full justify-start gap-3 h-11 text-[12px] font-black uppercase tracking-widest border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all rounded-xl" onClick={() => void handlePrintTask(selectedTask)}>
                          <Printer className="h-4 w-4" /> Print PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
        </DialogContent>
      </Dialog>

      {/* Project Discussion Dialog */}
      <Dialog open={isViewProjectOpen} onOpenChange={setIsViewProjectOpen}>
        <DialogContent className="w-[98vw] sm:max-w-[95vw] lg:max-w-[1000px] h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-2xl">
            {selectedProject && (
              <>
                <DialogHeader className="p-4 sm:p-6 border-b bg-card flex-shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm rounded-xl">
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs uppercase">
                          {selectedProject.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[10px] h-4.5 bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest px-1.5">Project View</Badge>
                          <span className="text-[10px] text-muted-foreground font-bold tracking-tight">• {selectedProject.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black truncate leading-tight tracking-tight text-foreground">{selectedProject.name}</DialogTitle>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsViewProjectOpen(false)} className="rounded-full h-9 w-9 hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
                  {/* Left: Feed */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-card/10">
                    <div className="p-4 sm:p-8 space-y-10 max-w-3xl mx-auto min-h-full flex flex-col">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <TrendingUp className="w-4 h-4" />
                          <h4 className="text-[12px] font-black uppercase tracking-[0.15em]">Project Activity Feed</h4>
                        </div>
                        
                        <div className="flex-1 space-y-6">
                          {projectCommentsLoading && projectComments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 space-y-3">
                              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Hydrating activity stream...</p>
                            </div>
                          ) : projectComments.length === 0 ? (
                            <div className="text-center p-16 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/5 flex flex-col items-center">
                              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-inner border border-border/50 mb-5 text-2xl">🌍</div>
                              <p className="text-sm font-black text-foreground/80 uppercase tracking-wider">The project board is clean</p>
                              <p className="text-[11px] text-muted-foreground font-medium mt-1">Status updates and team discussions will appear here.</p>
                            </div>
                          ) : (
                            <div className="space-y-8 relative pb-10">
                              <div className="absolute left-4.5 top-2 bottom-0 w-0.5 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"></div>
                              {projectComments.map((c) => (
                                <div key={c.id} className="flex gap-4 group relative">
                                  <Avatar className="w-10 h-10 border-2 border-background shadow-md flex-shrink-0 z-10 overflow-hidden ring-4 ring-muted/10">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black uppercase tracking-tighter">
                                      {(c.authorFullName || c.authorUsername || "U").split(" ").map((n: string) => n ? n[0] : "").join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2 min-w-0 bg-background/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 ml-2 shadow-xs group-hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-[13px] text-foreground tracking-tight">{c.authorFullName || c.authorUsername}</span>
                                      {c.authorRole && <Badge variant="secondary" className="text-[9px] h-4 font-black bg-primary/10 text-primary uppercase px-1.5 border-none">{c.authorRole}</Badge>}
                                      <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-tight ml-auto">{formatMessageTime(c.createdAt)}</span>
                                    </div>
                                    <div className="text-[14px] leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap break-words">
                                      {renderMessageWithMentions(c.message)}
                                    </div>
                                    {c.attachments && c.attachments.length > 0 && (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                        {c.attachments.map((att: any, attIdx: number) => (
                                          <div key={attIdx} className="relative rounded-lg overflow-hidden border border-border/40 bg-background shadow-xs group/att aspect-square flex flex-col items-center justify-center cursor-pointer">
                                            {att.mimeType?.startsWith("image/") ? <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" /> : <FileText className="h-6 w-6 text-muted-foreground/30" />}
                                            <a href={att.url || "#"} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]" title="Download attachment"><Download className="h-4 w-4 text-white" /></a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Composer */}
                        <div className="sticky bottom-4 z-20 mt-auto pt-6 px-4 pb-4">
                           <div className="relative rounded-3xl border border-border/60 bg-white/60 dark:bg-black/40 backdrop-blur-2xl overflow-hidden focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-xl">
                            {commentAttachments.length > 0 && (
                              <div className="p-3 border-b bg-muted/5 grid grid-cols-6 gap-2">
                                {commentAttachments.map((f, i) => (
                                  <div key={i} className="relative rounded-lg border border-border/50 bg-background p-1 aspect-square group">
                                    {f.type.startsWith("image/") ? <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover rounded" /> : <FileText className="h-4 w-4 mx-auto mt-1 text-muted-foreground" />}
                                    <button type="button" onClick={() => setCommentAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-black border-2 border-background">✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <textarea
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="Post a status update or broad comment to project members..."
                              className="w-full min-h-[80px] border-0 focus:ring-0 resize-none p-5 text-[14px] bg-transparent outline-none placeholder-muted-foreground/40 font-bold"
                            />
                            <div className="flex items-center justify-between p-3 bg-muted/20 border-t border-border/40">
                              <button type="button" onClick={() => { const el = document.getElementById("proj-comment-attachment-input-emp") as HTMLInputElement; el?.click(); }} className="p-2 text-muted-foreground/70 hover:text-primary transition-colors flex items-center gap-2 group">
                                <Paperclip className="w-4 h-4" /> <span className="text-[11px] font-black uppercase tracking-wider">Add files</span>
                              </button>
                              <input id="proj-comment-attachment-input-emp" type="file" multiple className="hidden" aria-label="Attach files to project comment" onChange={(e) => { if (e.target.files) { setCommentAttachments(prev => [...prev, ...Array.from(e.target.files!)]); } e.target.value=''; }} />
                              <Button type="button" onClick={() => void sendComment(true)} disabled={(!commentDraft.trim() && commentAttachments.length === 0) || isSendingComment} className="h-9 px-5 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] shadow-lg">
                                {isSendingComment ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                Post Update
                              </Button>
                            </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sidebar */}
                  <div className="w-full md:w-[320px] bg-muted/5 border-t md:border-t-0 md:border-l border-border/40 overflow-y-auto hidden md:block">
                    <div className="p-8 space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] block">Description</label>
                        <p className="text-[13px] font-semibold text-foreground/70 leading-relaxed italic">{selectedProject.description || "Project parameters undefined."}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] block">Project Staff</label>
                          <div className="flex flex-col gap-2">
                             {selectedProject.assignees?.map((a, idx) => (
                               <div key={idx} className="flex items-center gap-3 bg-background border border-border/40 px-3 py-2 rounded-xl shadow-xs">
                                 <Avatar className="h-6 w-6">
                                   <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">{a ? a[0].toUpperCase() : "U"}</AvatarFallback>
                                 </Avatar>
                                 <span className="text-[12px] font-bold text-foreground/70 truncate">{resolveAssigneeName(a)}</span>
                               </div>
                             ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] block">Shared Resources</label>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedProject.attachments?.map((att, idx) => (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" key={idx} className="bg-background border border-border/40 p-2 rounded-xl flex flex-col items-center justify-center gap-2 group hover:border-primary/20 transition-all">
                                {att.mimeType?.startsWith("image/") ? <img src={att.url} alt={att.fileName} className="w-full h-12 object-cover rounded-md" /> : <FileText className="w-6 h-6 text-muted-foreground/30" />}
                                <span className="text-[8px] font-black text-muted-foreground/60 truncate w-full text-center">{att.fileName}</span>
                              </a>
                            ))}
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
                                  setEditAssigneesOpen(false);
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
                        <p className="font-semibold text-foreground line-clamp-1">
                          <span className="text-primary mr-1.5">{task.taskNumber || ((taskPage - 1) * PAGE_SIZE + index + 1)}.</span>
                          {task.title}
                        </p>
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

                    {/* Attachment Summary */}
                    {(() => {
                      const { images, files } = getAttachmentCounts(task.attachments, task.attachment);
                      return (images > 0 || files > 0) && (
                        <div className="flex items-center gap-1.5 py-1 px-2 bg-primary/5 border border-primary/10 rounded-md w-fit">
                          <Paperclip className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
                            {[
                              images > 0 && `${images} image${images !== 1 ? "s" : ""}`,
                              files > 0 && `${files} file${files !== 1 ? "s" : ""}`
                            ].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      );
                    })()}

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

      {/* File Preview Lightbox */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-[95vw] w-fit p-0 border-none bg-transparent shadow-none">
          <div className="relative group/preview-modal">
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3 opacity-0 group-hover/preview-modal:opacity-100 transition-opacity">
              <a 
                href={previewUrl || ""} 
                download={previewName}
                className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-lg transition-all"
                title="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
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
    </div>
  );
}

            
