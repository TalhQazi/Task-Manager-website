import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  FileText,
  User,
  AlertTriangle
} from "lucide-react";
import { listResource } from "@/lib/admin/apiClient";

interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  assignee?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  dueTime: string;
  createdAt: string;
  attachmentFileName?: string;
  attachmentNote?: string;
}

const getInitials = (name: string) => {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const toDateOnly = (value: string) => {
  const v = String(value || "").trim();
  if (!v) return "";
  const idx = v.indexOf("T");
  return idx >= 0 ? v.slice(0, idx) : v;
};

const normalizeTaskAssignees = (task: Task): Task => {
  const legacyAssignee = typeof task.assignee === "string" ? task.assignee.trim() : "";
  const assignees = Array.isArray(task.assignees)
    ? task.assignees.filter(Boolean)
    : legacyAssignee
      ? [legacyAssignee]
      : [];
  return { ...task, assignees };
};

const priorityClasses = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-[#eab308]/10 text-[#eab308]",
  low: "bg-[#22c55e]/10 text-[#22c55e]",
};

const statusClasses = {
  pending: "bg-muted/50 text-muted-foreground",
  "in-progress": "bg-[#3b82f6]/10 text-[#3b82f6]",
  completed: "bg-[#22c55e]/10 text-[#22c55e]",
  overdue: "bg-destructive/10 text-destructive",
};

const statusIcons = {
  pending: <Clock className="h-3.5 w-3.5" />,
  "in-progress": <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  overdue: <AlertCircle className="h-3.5 w-3.5" />,
};

const EmployeeTaskHistory = () => {
  const navigate = useNavigate();
  const { employee } = useParams<{ employee: string }>();
  const employeeName = decodeURIComponent(employee || "");
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const taskList = await listResource<Task>("tasks");
        const normalizedTasks = taskList.map(normalizeTaskAssignees);
        
        // Filter tasks for this employee
        const employeeTasks = normalizedTasks.filter(
          (task) =>
            task.assignees?.includes(employeeName) || task.assignee === employeeName
        );
        
        setTasks(employeeTasks);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeName) {
      loadTasks();
    }
  }, [employeeName]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending" || t.status === "in-progress").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  // Sort tasks by created date (newest first)
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
      <motion.div
        className="space-y-4 sm:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/task-history")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                {getInitials(employeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{employeeName}</h1>
              <p className="text-sm text-muted-foreground">Task History</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-[#22c55e]">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#22c55e]">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-[#eab308]">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#eab308]">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-destructive">Overdue</p>
              <p className="text-2xl sm:text-3xl font-bold text-destructive">{stats.overdue}</p>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              All Tasks ({sortedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-muted-foreground">No tasks assigned to this employee</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    className="p-4 space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Task Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">#{task.id.slice(-6)}</span>
                          <Badge className={`${priorityClasses[task.priority]} text-xs`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`${statusClasses[task.status]} text-xs flex items-center gap-1`}>
                            {statusIcons[task.status]}
                            {task.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm sm:text-base">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Task Details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Assigned: {toDateOnly(task.createdAt) || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Due: {toDateOnly(task.dueDate) || "—"} {task.dueTime && `at ${task.dueTime}`}</span>
                      </div>
                      {task.attachmentFileName && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Has attachment</span>
                        </div>
                      )}
                    </div>

                    {/* Task Note */}
                    {task.attachmentNote && (
                      <div className="bg-muted/50 p-2 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Note:</span> {task.attachmentNote}
                        </p>
                      </div>
                    )}

                    {/* Status Message */}
                    <div className="flex items-center gap-2">
                      {task.status === "completed" && (
                        <div className="flex items-center gap-1.5 text-[#22c55e] text-xs">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Task completed successfully</span>
                        </div>
                      )}
                      {task.status === "overdue" && (
                        <div className="flex items-center gap-1.5 text-destructive text-xs">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Task is overdue</span>
                        </div>
                      )}
                      {(task.status === "pending" || task.status === "in-progress") && (
                        <div className="flex items-center gap-1.5 text-[#eab308] text-xs">
                          <Clock className="h-4 w-4" />
                          <span>Task is pending</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
  );
};

export default EmployeeTaskHistory;
