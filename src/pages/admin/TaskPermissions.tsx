import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
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
import { Plus, Trash2, Shield, Lock, Unlock, CheckCircle, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "@/hooks/use-toast";

interface TaskPermission {
  id: string;
  taskId: string;
  canReassign: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  taskNumber?: string;
}

export default function TaskPermissions() {
  const [permissions, setPermissions] = useState<TaskPermission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<TaskPermission | null>(null);
  const [formData, setFormData] = useState({
    taskId: "",
    canReassign: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPermissions = async () => {
    try {
      const res = await apiFetch<{ items: TaskPermission[] }>("/api/task-permissions");
      setPermissions(res?.items || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch task permissions",
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await apiFetch<{ items: Task[] }>("/api/tasks");
      setTasks(res?.items || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPermissions(), fetchTasks()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Task is required",
      });
      return;
    }

    try {
      await apiFetch("/api/task-permissions", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast({
        title: "Success",
        description: "Task permission saved successfully",
      });
      setDialogOpen(false);
      setFormData({ taskId: "", canReassign: true });
      await fetchPermissions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save task permission",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;

    try {
      await apiFetch(`/api/task-permissions?taskId=${selectedPermission.taskId}`, {
        method: "DELETE",
      });
      toast({
        title: "Success",
        description: "Task permission deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedPermission(null);
      await fetchPermissions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task permission",
      });
    }
  };

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? `${task.taskNumber ? `#${task.taskNumber} ` : ""}${task.title}` : taskId;
  };

  const filteredPermissions = permissions.filter((p) =>
    getTaskTitle(p.taskId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage task-specific reassignment permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:from-[#0072FF] hover:to-[#00C6FF]">
              <Plus className="w-4 h-4 mr-2" />
              Add Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Task Permission</DialogTitle>
              <DialogDescription>
                Set reassignment permission for a specific task
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task</label>
                  <Select
                    value={formData.taskId}
                    onValueChange={(value) => setFormData({ ...formData, taskId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.taskNumber ? `#${task.taskNumber} ` : ""}{task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="canReassign"
                    checked={formData.canReassign}
                    onChange={(e) => setFormData({ ...formData, canReassign: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="canReassign" className="text-sm font-medium">
                    Allow task reassignment
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  When disabled, this task cannot be reassigned by anyone (including team leads)
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF]">
                  Save Permission
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Task Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C6FF]" />
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No task permissions found</p>
              <p className="text-sm">Add a permission to control task reassignment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Can Reassign</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{getTaskTitle(permission.taskId)}</TableCell>
                    <TableCell>
                      {permission.canReassign ? (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Allowed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPermission(permission);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission for task "{selectedPermission && getTaskTitle(selectedPermission.taskId)}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
