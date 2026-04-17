import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  Clock,
  AlertCircle,
  CheckCircle2,
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
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/admin/utils";
import { RewardEmployeeModal } from "@/components/manger/RewardEmployeeModal";
import { apiFetch, downloadTaskAttachment } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { useSocket } from "@/contexts/SocketContext";
import { Pagination } from "@/components/Pagination";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";

// Types
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
  reward?: {
    isRewarded: boolean;
    animationStyle?: string;
    message?: string;
    rewardedBy?: string;
    rewardedAt?: string;
  };
  context: "HOUSE" | "OFFICE" | "SHOP" | "FIELD" | "OTHER";
  priority_color: "red" | "yellow" | "green";
  execution_rank?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdByUsername?: string;
  createdAt?: string;
  assignees?: string[];
  logo?: {
    fileName?: string;
    url?: string;
    mimeType?: string;
    size?: number;
  };
  taskCount?: number;
  status?: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  defaultContext?: "HOUSE" | "OFFICE" | "SHOP" | "FIELD" | "OTHER";
}

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatarUrl?: string;
  avatarDataUrl?: string;
  status: "active" | "inactive" | "on-leave";
}

interface TaskComment {
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
}

type TaskApi = Omit<Task, "id"> & {
  _id: string;
};

// Helper functions
function normalizeTask(t: any): Task {
  const legacyAssignee = typeof t.assignee === "string" ? t.assignee.trim() : "";
  const assignees = Array.isArray(t.assignees)
    ? t.assignees.filter((s: any) => typeof s === "string" && s.trim())
    : legacyAssignee
      ? [legacyAssignee]
      : [];
  return {
    id: t._id || t.id,
    title: t.title,
    description: t.description,
    assignees,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    location: t.location,
    createdAt: t.createdAt,
    attachmentFileName: t.attachmentFileName,
    attachmentNote: t.attachmentNote,
    attachment: t.attachment,
    attachments: t.attachments,
    reward: t.reward,
    context: t.context || "OTHER",
    priority_color: t.priority_color || "green",
    execution_rank: t.execution_rank,
  };
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
  priority_color: z.enum(["red", "yellow", "green"]).optional().default("green"),
  context: z.enum(["HOUSE", "OFFICE", "SHOP", "FIELD", "OTHER"]),
  status: z.enum(["pending", "in-progress", "completed", "overdue"]),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  location: z.string().optional(),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

// Logo Component
function ProjectLogoImg({ projectId, projectName, logoUrl }: { projectId: string; projectName: string; logoUrl?: string }) {
  const [src, setSrc] = useState<string | null | undefined>(logoUrl !== undefined ? (logoUrl || null) : undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (logoUrl) {
      setSrc(logoUrl);
      setError(false);
      return;
    }
    let cancelled = false;
    apiFetch<{ logo: { url: string } }>(`/api/projects/${encodeURIComponent(projectId)}/logo`)
      .then(d => { 
        if (!cancelled) {
          setSrc(d.logo?.url || null);
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

  if (src === undefined && logoUrl === undefined) {
    return <div className="w-10 h-10 rounded-md bg-muted/40 animate-pulse flex-shrink-0" />;
  }

  return (
    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0 border border-primary/20 uppercase">
      {projectName.slice(0, 2).toUpperCase()}
    </div>
  );
}

// Attachment Components
function TaskAttachmentImg({ taskId, onPreview }: { taskId: string; onPreview?: (url: string, fileName: string) => void }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ attachment: { url: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/attachment`)
      .then(d => { if (!cancelled) setSrc(d.attachment?.url || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId]);
  
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
  const [src, setSrc] = useState<string | null | undefined>(fallbackUrl || undefined);
  useEffect(() => {
    if (fallbackUrl) return; 
    let cancelled = false;
    apiFetch<{ attachment: { url: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}/attachments/${index}`)
      .then(d => { if (!cancelled) setSrc(d.attachment?.url || null); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [taskId, commentId, index, fallbackUrl]);
  
  if (src && mimeType?.startsWith("image/")) return (
    <div className="w-full h-full relative group/att cursor-zoom-in" onClick={() => onPreview?.(src, fileName)}>
      <img src={src} alt={fileName} className="w-full h-full object-cover rounded-lg" />
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
  if (src === undefined) return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><Loader2 className="h-4 w-4 animate-spin opacity-20" /></div>;
  return <div className="w-full h-20 flex flex-col items-center justify-center p-2 text-center bg-muted/20"><AlertCircle className="w-5 h-5 text-destructive/50" /></div>;
}

// Main Component
export default function Tasks() {
  const { socket, joinTask, leaveTask } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectPage, setProjectPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [projectTaskPage, setProjectTaskPage] = useState(1);
  const PAGE_SIZE = 25;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectLogoFile, setProjectLogoFile] = useState<File | null>(null);
  const [projectLogoPreview, setProjectLogoPreview] = useState<string>("");
  const [projectAttachmentFiles, setProjectAttachmentFiles] = useState<File[]>([]);
  const [projectAttachmentPreviews, setProjectAttachmentPreviews] = useState<string[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
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
  const [projectDefaultContext, setProjectDefaultContext] = useState<Task["context"]>("OTHER");
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
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [rewardingTask, setRewardingTask] = useState<Task | null>(null);

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectLogoFile, setEditProjectLogoFile] = useState<File | null>(null);
  const [editProjectLogoPreview, setEditProjectLogoPreview] = useState<string>("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
    context: "OTHER" as Task["context"],
    priority_color: "green" as Task["priority_color"],
  });

  const queryClient = useQueryClient();

  const currentUsername = getAuthState().username || "";
  const currentRole = getAuthState().role || "";
  const isAdminRole = currentRole === "admin" || currentRole === "super-admin";
  const canGiveReward = ["manager", "admin", "super-admin"].includes(String(currentRole).toLowerCase());
  const [archivingCommentId, setArchivingCommentId] = useState<string | null>(null);
  const [archivingAttachment, setArchivingAttachment] = useState<number | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

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

  const projectsQuery = useQuery({
    queryKey: ["projects", projectPage, projectSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: projectPage.toString(),
        limit: PAGE_SIZE.toString(),
        search: projectSearchQuery,
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
    try {
      setIsLoadingProject(true);
      if (partialProject) {
        setSelectedProject({ ...partialProject, tasks: [] } as any);
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

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await apiFetch<{ items: any[] }>("/api/users/all");
        const list = (res.items || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          avatarDataUrl: u.avatarUrl,
          status: (u.status || "active") as Employee["status"],
          initials: (u.name || u.username || "??")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
        }));

        const auth = getAuthState();
        const myUsername = auth.username || "";
        if (myUsername && !list.find(e => e.name.toLowerCase() === myUsername.toLowerCase() || e.email.toLowerCase() === myUsername.toLowerCase())) {
          list.push({
            id: "me",
            name: myUsername,
            initials: myUsername.substring(0, 2).toUpperCase(),
            status: "active",
            email: myUsername
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
      const s = String(e.status || "").toLowerCase();
      return s === "active" || s === "on-leave" || !e.status;
    });
  }, [employees]);

  useEffect(() => {
    if (isCreateOpen) {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, dueDate: today }));
    }
  }, [isCreateOpen]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateTaskValues & { assignees?: string[] } }) => {
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
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      if (selectedProject?.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: selectedProject.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
        setSelectedProject({ ...selectedProject });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProject && editingProject && selectedProject.id === editingProject.id) {
        void loadProject(selectedProject.id);
      }
    },
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

  const reassignTaskMutation = useMutation({
    mutationFn: async ({ id, assignees }: { id: string; assignees: string[] }) => {
      const res = await apiFetch<{ item: TaskApi }>(`/api/tasks/${id}/reassign`, {
        method: "PUT",
        body: JSON.stringify({ assignees }),
      });
      return normalizeTask(res.item);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      });
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      if (selectedProject?.id === updatedTask.projectId) {
        setSelectedProject({
          ...selectedProject,
          tasks: selectedProject.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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

  const createProjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch<{ item: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch<{ item: TaskApi }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizeTask(res.item);
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (newTask.projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (selectedProject?.id === newTask.projectId) {
          void loadProject(newTask.projectId);
        }
      }
    },
  });

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
      context: "OTHER",
      priority_color: "green",
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
      context: "OTHER",
      priority_color: "green",
    },
  });

  const { triggerBlaster, incrementCompletedCount } = useTaskBlasterContext();

  const openView = (task: Task) => {
    setSelectedTask(task);
    setIsViewOpen(true);
    void loadComments(task.id);
  };

  const loadComments = async (taskId: string, silent: boolean = false) => {
    try {
      if (!silent) setCommentsLoading(true);
      setCommentError(null);
      const res = await apiFetch<{ items: TaskComment[] }>(`/api/tasks/${encodeURIComponent(taskId)}/comments?_t=${Date.now()}`);
      const newComments = Array.isArray(res.items) ? res.items : [];
      setComments(newComments);
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

  useEffect(() => {
    if (isViewOpen && selectedTask && autoRefreshEnabled) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      autoRefreshIntervalRef.current = setInterval(() => {
        if (selectedTask && isViewOpen) {
          loadComments(selectedTask.id, true);
        }
      }, 5000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [isViewOpen, selectedTask, autoRefreshEnabled]);

  const sendComment = async () => {
    if (!selectedTask || isSendingComment) return;
    const msg = commentDraft.trim();
    if (!msg && commentAttachments.length === 0) return;

    try {
      setIsSendingComment(true);
      setCommentError(null);

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

      const res = await apiFetch<{ item: TaskComment }>(`/api/tasks/${encodeURIComponent(selectedTask.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: msg, attachments: processedAttachments }),
      });
      setComments((prev) => [...prev, res.item]);
      setCommentDraft("");
      setCommentAttachments([]);
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
      socket.emit("typing", { taskId: selectedTask.id, typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { taskId: selectedTask.id, typing: false });
    }, 3000);
  };

  useEffect(() => {
    if (isViewOpen && selectedTask && socket) {
      joinTask(selectedTask.id);

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

      socket.on("user-typing", handleTyping);

      return () => {
        socket.off("new-comment", handleNewComment);
        socket.off("user-typing", handleTyping);
        leaveTask(selectedTask.id);
      };
    }
  }, [isViewOpen, selectedTask?.id, socket, joinTask, leaveTask, currentUsername]);

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    try {
      setIsCreating(true);
      const payload = {
        name: projectName,
        description: projectDescription,
        defaultContext: projectDefaultContext,
        assignees: projectCreationAssignees,
      };
      await createProjectMutation.mutateAsync(payload);
      setProjectName("");
      setProjectDescription("");
      setProjectCreationAssignees([]);
      setProjectDefaultContext("OTHER");
      setIsCreateOpen(false);
      toast({ title: "Project created", description: "Project has been created successfully." });
    } catch (err) {
      toast({ title: "Failed to create project", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    try {
      setIsCreating(true);
      const payload = {
        ...formData,
        projectId: isDirectTask ? undefined : selectedProject?.id,
        assignees: selectedAssignees,
      };
      await createTaskMutation.mutateAsync(payload);
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
        context: "OTHER",
        priority_color: "green",
      });
      setSelectedAssignees([]);
      setIsCreateTaskOpen(false);
      setIsDirectTask(false);
      toast({ title: "Task created", description: "Task has been created successfully." });
    } catch (err) {
      toast({ title: "Failed to create task", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

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

  const handleReward = (task: Task) => {
    if (!canGiveReward) return;
    setRewardingTask(task);
    setIsRewardOpen(true);
  };

  const onGrantReward = async (rewardData: any) => {
    if (!rewardingTask) return;
    try {
      await apiFetch(`/api/tasks/${rewardingTask.id}/reward`, {
        method: "POST",
        body: JSON.stringify(rewardData),
      });
      toast({
        title: "Reward granted!",
        description: `Successfully rewarded ${rewardingTask.assignees?.join(", ") || "employee"}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      toast({
        title: "Failed to grant reward",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive"
      });
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
      context: task.context || "OTHER",
      priority_color: task.priority_color || "green",
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

  const sourceTasks = selectedProject ? selectedProject.tasks : tasks;

  const filteredTasks = useMemo(() => {
    return sourceTasks.filter((task) => {
      const assigneesText = Array.isArray(task.assignees) ? task.assignees.join(" ") : "";
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assigneesText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [sourceTasks, searchQuery, statusFilter, priorityFilter]);

  const filteredProjects = useMemo(() => {
    const qProject = projectSearchQuery.trim().toLowerCase();
    const qMain = searchQuery.trim().toLowerCase();
    const sFilter = statusFilter.toLowerCase();

    return projects.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const assignees = (p.assignees || []).join(" ").toLowerCase();
      const status = (p.status || "").toLowerCase();

      if (sFilter !== "all" && status !== sFilter) {
        return false;
      }

      if (qProject && !name.includes(qProject) && !desc.includes(qProject) && !assignees.includes(qProject)) {
        return false;
      }

      if (qMain && !name.includes(qMain) && !desc.includes(qMain) && !assignees.includes(qMain)) {
        return false;
      }

      return true;
    });
  }, [projects, projectSearchQuery, searchQuery, statusFilter]);

  const filteredStandaloneTasks = useMemo(() => {
    const standalone = tasks.filter((t) => !t.projectId);
    if (!searchQuery.trim()) return standalone;
    const q = searchQuery.toLowerCase();
    return standalone.filter((task) => {
      const assigneesText = Array.isArray(task.assignees) ? task.assignees.join(" ") : "";
      return task.title.toLowerCase().includes(q) || assigneesText.toLowerCase().includes(q);
    });
  }, [tasks, searchQuery]);

  const projectTotalPages = projectsQuery.data?.totalPages || 1;
  const taskTotalPages = tasksQuery.data?.totalPages || 1;

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
              <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)} className="h-9 text-sm">
                Back to Projects
              </Button>
              <Button size="sm" className="gap-2 h-9 text-sm" onClick={() => {
                setIsDirectTask(false);
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks or assignee..."
            className="pl-10 h-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-10">
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
            <SelectTrigger className="w-full sm:w-[150px] h-10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 hidden sm:flex">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Project/Tasks sections */}
      {selectedProject ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <ProjectLogoImg 
              projectId={selectedProject.id} 
              projectName={selectedProject.name} 
              logoUrl={selectedProject.logo?.url} 
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg break-words">Project: {selectedProject.name}</h2>
              <p className="text-sm text-muted-foreground break-words">{selectedProject.description || "No description"}</p>
              <p className="text-xs text-muted-foreground mt-1 break-words">{selectedProject.assignees && selectedProject.assignees.length > 0 ? selectedProject.assignees.join(", ") : "No assignees"}</p>
            </div>
          </div>
          {selectedProject.attachments && selectedProject.attachments.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Attachments ({selectedProject.attachments.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedProject.attachments.map((att, idx) => (
                  att.mimeType?.startsWith("image/") ? (
                    <a key={idx} href={att.url} target="_blank" rel="noreferrer">
                      <img src={att.url} alt={att.fileName} className="h-16 w-16 object-cover rounded-md border border-border" />
                    </a>
                  ) : (
                    <a key={idx} href={att.url} target="_blank" rel="noreferrer" download={att.fileName}
                      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs hover:bg-muted truncate max-w-[160px]">
                      📄 {att.fileName}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground mt-3">
            <span>{selectedProject.tasks.length} tasks</span>
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
      ) : (
        <>
          {/* Projects Section */}
          <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-lg">
                Projects ({Math.min(projectPage * PAGE_SIZE, projectsQuery.data?.totalItems || 0)} - {projectsQuery.data?.totalItems || 0})
              </h2>
              <div className="relative w-full sm:w-64">
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
              <p className="text-destructive">Failed to load projects</p>
            ) : projectsQuery.data?.items.length === 0 ? (
              <p className="text-muted-foreground">{projectSearchQuery ? "No projects match your search." : "No projects found. Create one to begin."}</p>
            ) : (
              <>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {projectsQuery.data?.items.map((project, idx) => {
                    const assigneeList = Array.isArray(project.assignees) && project.assignees.length > 0 ? project.assignees : [];
                    const taskNum = project.taskCount ?? 0;
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
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{project.description || "No description"}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="truncate flex-1 mr-2">{assigneeList.length > 0 ? assigneeList.join(", ") : "No assignees"}</span>
                            <span className="flex-shrink-0">{taskNum} task{taskNum === 1 ? "" : "s"}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <Badge className="capitalize" variant="outline">{project.status || "No tasks"}</Badge>
                            <span className="text-muted-foreground text-xs">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ""}</span>
                          </div>
                        </button>

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

          {/* Tasks Section */}
          <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-4">
            <h2 className="font-semibold text-lg mb-3">Tasks ({Math.min(taskPage * PAGE_SIZE, tasksQuery.data?.totalItems || 0)} - {tasksQuery.data?.totalItems || 0})</h2>
            {tasksQuery.isLoading ? (
              <p className="text-muted-foreground">Loading tasks...</p>
            ) : tasksQuery.isError ? (
              <p className="text-destructive">Failed to load tasks</p>
            ) : filteredStandaloneTasks.length === 0 ? (
              <p className="text-muted-foreground">{searchQuery ? "No tasks match your search." : "No standalone tasks found. Create one to begin."}</p>
            ) : (
              <>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task, idx) => {
                    const assigneeList = Array.isArray(task.assignees) && task.assignees.length > 0 ? task.assignees : [];
                    const taskNumber = (taskPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <div
                        key={task.id}
                        className="relative text-left p-3 sm:p-4 rounded-lg border border-border hover:border-primary transition bg-card shadow-sm hover:shadow-card w-full group"
                      >
                        <button
                          onClick={() => openView(task)}
                          className="w-full text-left"
                        >
                          <div className="mb-2">
                            <p className="font-medium truncate text-sm">
                              <span className="text-primary mr-1">{taskNumber}.</span>
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{task.description || "No description"}</p>
                          </div>
                          {task.attachment?.fileName && (
                            <div className="mb-2 rounded-md overflow-hidden border border-border/50 h-24 bg-muted/20">
                              <TaskAttachmentImg taskId={task.id} />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="truncate flex-1 mr-2">{assigneeList.length > 0 ? assigneeList.join(", ") : "Unassigned"}</span>
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
                              </Badge>
                            </div>
                            <div className="flex gap-1 items-center">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px] h-5 px-1.5 font-bold border",
                                  task.context === "HOUSE" && "bg-blue-100/20 text-blue-600 border-blue-200/50",
                                  task.context === "OFFICE" && "bg-green-100/20 text-green-600 border-green-200/50",
                                  task.context === "SHOP" && "bg-yellow-100/20 text-yellow-600 border-yellow-200/50",
                                  task.context === "FIELD" && "bg-orange-100/20 text-orange-600 border-orange-200/50",
                                  task.context === "OTHER" && "bg-slate-100 text-slate-600 border-slate-200"
                                )}
                              >
                                {task.context}
                              </Badge>
                              <span className="text-muted-foreground text-xs whitespace-nowrap">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-50 pt-2.5">
                            {task.reward?.isRewarded ? (
                              <div className="flex items-center gap-1.5 text-[#16a34a] font-bold text-[11px] bg-[#f0fdf4] px-2.5 py-1 rounded-full border border-[rgb(187,247,208)]">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-[#16a34a]" /> Rewarded
                              </div>
                            ) : task.status === "completed" && canGiveReward ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2.5 text-[#3b82f6] hover:text-[#2563eb] hover:bg-[#eff6ff] gap-1.5 font-bold text-[11px] rounded-full transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReward(task);
                                }}
                              >
                                <Trophy className="w-3.5 h-3.5" /> Reward
                              </Button>
                            ) : (
                              <div className="h-7" />
                            )}
                          </div>
                        </button>

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
                                openView(task);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
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
        </>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a project and assign it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Name *</label>
                <Input placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Project Description</label>
                <Textarea placeholder="Short project description" className="min-h-[80px]" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Default Task Context *</label>
                <Select value={projectDefaultContext} onValueChange={(v) => setProjectDefaultContext(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE">HOUSE</SelectItem>
                    <SelectItem value="OFFICE">OFFICE</SelectItem>
                    <SelectItem value="SHOP">SHOP</SelectItem>
                    <SelectItem value="FIELD">FIELD</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">New tasks in this project will inherit this context by default.</p>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={(open) => { setIsCreateTaskOpen(open); if (!open) setIsDirectTask(false); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>{isDirectTask ? "Create Standalone Task" : "Create Task"}</DialogTitle>
            <DialogDescription>{isDirectTask ? "Create a new standalone task without a project." : "Create a new task under the selected project."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Task Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Task Description *</label>
                <Textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
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
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search employees..." />
                      <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {activeEmployees.map((employee) => (
                            <CommandItem key={employee.id} value={employee.name} onSelect={() => { 
                              setSelectedAssignees((prev) => prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
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
                <label className="text-sm font-medium">Focus Context *</label>
                <Select 
                  value={formData.context} 
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, context: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE">HOUSE</SelectItem>
                    <SelectItem value="OFFICE">OFFICE</SelectItem>
                    <SelectItem value="SHOP">SHOP</SelectItem>
                    <SelectItem value="FIELD">FIELD</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => { setIsCreateTaskOpen(false); setIsDirectTask(false); }} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[98vw] max-w-[1100px] h-[90vh] flex flex-col overflow-hidden rounded-xl p-0 gap-0 border-0 shadow-2xl">
          {selectedTask && (
            <>
              <div className="flex items-center justify-between p-3 border-b bg-background z-10 shrink-0">
                <div className="flex items-center gap-3 ml-2">
                  <Badge variant="outline" className={cn("capitalize px-3 py-1 font-semibold rounded-full border-2 cursor-pointer transition-colors hover:opacity-80", 
                    selectedTask.status === "completed" ? "border-green-500 text-green-700 bg-green-50" : 
                    selectedTask.status === "in-progress" ? "border-blue-500 text-blue-700 bg-blue-50" : 
                    selectedTask.status === "overdue" ? "border-red-500 text-red-700 bg-red-50" : "border-amber-500 text-amber-700 bg-amber-50")} 
                    onClick={() => {
                      const next: Record<string, Task["status"]> = {
                        "pending": "in-progress",
                        "in-progress": "completed",
                        "completed": "pending",
                        "overdue": "completed"
                      };
                      void updateStatus(next[selectedTask.status] || "pending");
                    }}>
                    {selectedTask.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : 
                     selectedTask.status === "overdue" ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                    {selectedTask.status}
                  </Badge>
                <div className="flex items-center gap-1.5 mr-10">
                  <Button variant="ghost" size="sm" onClick={() => void handlePrintTask(selectedTask)} title="Print Task">
                    <Printer className="w-4 h-4 mr-1.5 hidden sm:block" /> Print
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsViewOpen(false); openEdit(selectedTask); }} title="Edit Task">
                    <Edit className="w-4 h-4 mr-1.5 hidden sm:block" /> Edit
                  </Button>
                </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row shadow-inner overflow-hidden relative bg-background">
                <div className="flex-1 overflow-y-auto w-full md:w-2/3 p-5 sm:p-8 space-y-8 scroll-smooth pb-24">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight break-words">{selectedTask.title}</h2>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Description
                    </h4>
                    <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words border border-border/60 rounded-xl p-4 sm:p-5 bg-muted/10 shadow-sm min-h-[100px]">
                      {selectedTask.description ? selectedTask.description : <span className="text-muted-foreground italic">No description provided.</span>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Activity Feed
                      </h4>
                    </div>

                    <div className="flex flex-col h-full max-h-[600px] bg-muted/5 rounded-2xl border border-border/40 overflow-hidden">
                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
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
                                <div key={c.id} className={cn("flex flex-col group", isMe ? "items-end" : "items-start", !isSameAuthor && idx !== 0 ? "mt-4" : "mt-0")}>
                                  {showSenderName && (<span className="chat-sender-name ml-10">{c.authorFullName || c.authorUsername}</span>)}
                                  <div className={cn("flex items-end gap-2 max-w-[85%] w-fit", isMe ? "flex-row-reverse" : "flex-row")}>
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
                                    <div className={cn("flex flex-col group/bubble relative min-w-0", isMe ? "items-end" : "items-start")}>
                                      <div className={cn("chat-bubble", isMe ? "chat-bubble-me" : "chat-bubble-others")}>
                                        <div className="whitespace-pre-wrap break-words overflow-hidden leading-snug">
                                          {renderMessageWithMentions(c.message)}
                                        </div>
                                      </div>
                                      <div className={cn("chat-timestamp", isMe ? "text-right mr-1" : "text-left ml-1")}>
                                        {formatMessageTime(c.createdAt)}
                                      </div>
                                    </div>
                                    {isMe && (<div className="flex flex-col justify-end pb-5 opacity-40"><CheckCircle2 className="w-3 h-3 text-blue-500" /></div>)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 ml-0 lg:ml-14 relative rounded-2xl border-2 border-border/60 bg-background overflow-visible focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm group">
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
                          <span className="text-[11px] text-muted-foreground/60 px-3 hidden sm:inline-block font-medium border-l ml-1 border-border/50">Pro tip: Ctrl+Enter to send.</span>
                        </div>
                        <Button type="button" onClick={() => void sendComment()} disabled={(!commentDraft.trim() && commentAttachments.length === 0) || isSendingComment} size="sm" className="h-9 px-5 rounded-lg font-bold shadow hover:shadow-md transition-all gap-1.5 flex items-center">
                          {isSendingComment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {isSendingComment ? "Sending..." : "Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[320px] lg:w-[360px] bg-muted/10 shrink-0 border-t md:border-t-0 md:border-l border-border/50 overflow-y-auto hidden md:block">
                  <div className="p-6 space-y-7">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b">Properties</h3>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Assignees
                      </label>
                      <div className="flex flex-col gap-2">
                        {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                          selectedTask.assignees.map((assignee, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-border">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                  {assignee.split(" ").map((n) => n ? n[0] : "").join("").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-foreground text-sm font-medium truncate">{assignee}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm px-3 py-2 border border-dashed rounded-lg text-muted-foreground italic bg-muted/20">Unassigned</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Due Date
                      </label>
                      <div className={cn("text-sm font-semibold p-2.5 rounded-lg border", 
                        selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== "completed" ? 
                        "border-red-200 bg-red-50 text-red-700" : "border-border/60 bg-background text-foreground")}>
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No due date"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Status
                      </label>
                      <Select value={selectedTask.status} onValueChange={(v) => { void updateStatus(v as Task["status"]); }} disabled={statusSaving}>
                        <SelectTrigger className="w-full h-10 border-border/60 bg-background font-semibold">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="font-medium">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTask.status === "completed" && !selectedTask.reward?.isRewarded && canGiveReward && (
                      <Button variant="outline" className="w-full gap-2.5 border-[#bbf7d0] bg-[#f0fdf4]/30 hover:bg-[#f0fdf4] hover:border-[#86efac] text-[#16a34a] font-bold h-11 transition-all shadow-sm rounded-xl" onClick={() => handleReward(selectedTask)}>
                        <Trophy className="w-4 h-4" />
                        Reward Employee
                      </Button>
                    )}

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Priority
                      </label>
                      <div>
                        <Badge className={cn("capitalize px-3 py-1 font-bold text-[12px] rounded-md shadow-none", priorityClasses[selectedTask.priority])}>
                          {selectedTask.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground font-medium flex justify-between items-center">
                      <span>Created</span>
                      <span className="text-foreground/80">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedTask(null); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle><DialogDescription>Update task details.</DialogDescription></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditTask)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Title</FormLabel><FormControl><Input placeholder="Task title" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="description" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description" className="min-h-[90px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Assignees *</label>
                  <Popover open={editAssigneesOpen} onOpenChange={setEditAssigneesOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between h-10">
                        <span className="truncate">{editSelectedAssignees.length > 0 ? editSelectedAssignees.join(", ") : "Select assignees"}</span>
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
                              <CommandItem key={employee.id} value={employee.name} onSelect={() => {
                                setEditSelectedAssignees((prev) => prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", editSelectedAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                                </Avatar>
                                {employee.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {editSelectedAssignees.length === 0 && <p className="text-xs text-destructive">At least one assignee is required</p>}
                </div>
                <FormField control={editForm.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priority</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="context" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Context</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select context" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HOUSE">HOUSE</SelectItem>
                        <SelectItem value="OFFICE">OFFICE</SelectItem>
                        <SelectItem value="SHOP">SHOP</SelectItem>
                        <SelectItem value="FIELD">FIELD</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="priority_color" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Color</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="red"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Red (Urgent)</div></SelectItem>
                        <SelectItem value="yellow"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Yellow (Important)</div></SelectItem>
                        <SelectItem value="green"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Green (Normal)</div></SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditSelectedAssignees([]); }} disabled={updateTaskMutation.isPending} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={updateTaskMutation.isPending} className="w-full sm:w-auto gap-2">
                  {updateTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Task AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive task?</AlertDialogTitle>
            <AlertDialogDescription>This will move the task and its comments to the archive. You can restore it later from the Archive Data page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleteTaskMutation.isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTaskMutation.isPending} className="gap-2 bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
              {deleteTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Archive className="h-4 w-4" />Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Task Dialog */}
      <Dialog open={isReassignTaskOpen} onOpenChange={setIsReassignTaskOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>Change the assignees for task "{reassigningTask?.title}".</DialogDescription>
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {activeEmployees.map((employee) => (
                          <CommandItem key={employee.id} value={employee.name} onSelect={() => {
                            setReassignTaskAssignees((prev) =>
                              prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]
                            );
                            setReassignTaskOpen(false);
                          }}>
                            <Check className={cn("mr-2 h-4 w-4", reassignTaskAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                            </Avatar>
                            {employee.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {reassignTaskAssignees.length === 0 && <p className="text-xs text-destructive">At least one assignee is required</p>}
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => { setIsReassignTaskOpen(false); setReassigningTask(null); setReassignTaskAssignees([]); }} disabled={isReassigningTask} className="w-full sm:w-auto">Cancel</Button>
            <Button type="button" onClick={handleReassignTask} disabled={isReassigningTask || reassignTaskAssignees.length === 0} className="w-full sm:w-auto gap-2">
              {isReassigningTask && <Loader2 className="h-4 w-4 animate-spin" />}
              Reassign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Project Dialog */}
      <Dialog open={isReassignProjectOpen} onOpenChange={setIsReassignProjectOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Reassign Project</DialogTitle>
            <DialogDescription>Change the assignees for project "{reassigningProject?.name}".</DialogDescription>
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {activeEmployees.map((employee) => (
                          <CommandItem key={employee.id} value={employee.name} onSelect={() => {
                            setReassignProjectAssignees((prev) =>
                              prev.includes(employee.name) ? prev.filter((name) => name !== employee.name) : [...prev, employee.name]
                            );
                            setReassignProjectOpen(false);
                          }}>
                            <Check className={cn("mr-2 h-4 w-4", reassignProjectAssignees.includes(employee.name) ? "opacity-100" : "opacity-0")} />
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                            </Avatar>
                            {employee.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {reassignProjectAssignees.length === 0 && <p className="text-xs text-destructive">At least one assignee is required</p>}
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => { setIsReassignProjectOpen(false); setReassigningProject(null); setReassignProjectAssignees([]); }} disabled={isReassigningProject} className="w-full sm:w-auto">Cancel</Button>
            <Button type="button" onClick={handleReassignProject} disabled={isReassigningProject || reassignProjectAssignees.length === 0} className="w-full sm:w-auto gap-2">
              {isReassigningProject && <Loader2 className="h-4 w-4 animate-spin" />}
              Reassign Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Modal */}
      {rewardingTask && (
        <RewardEmployeeModal
          isOpen={isRewardOpen}
          onClose={() => setIsRewardOpen(false)}
          onReward={onGrantReward}
          taskTitle={rewardingTask.title}
        />
      )}
    </div>
  );
}