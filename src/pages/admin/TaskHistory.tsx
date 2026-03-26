import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Search, Users, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { listResource } from "@/lib/admin/apiClient";

interface Employee {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "on-leave";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  status: "active" | "inactive" | "pending";
}

interface Task {
  id: string;
  title: string;
  assignees: string[];
  assignee?: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  createdAt: string;
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

const getEmployeeTaskStats = (employeeName: string, allTasks: Task[]) => {
  const employeeTasks = allTasks.filter((task) =>
    task.assignees?.includes(employeeName) || task.assignee === employeeName
  );

  const total = employeeTasks.length;
  const completed = employeeTasks.filter((t) => t.status === "completed").length;
  const pending = employeeTasks.filter((t) => t.status === "pending" || t.status === "in-progress").length;
  const overdue = employeeTasks.filter((t) => t.status === "overdue").length;

  return { total, completed, pending, overdue };
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

const statusClasses = {
  pending: "bg-muted/50 text-muted-foreground",
  "in-progress": "bg-[#3b82f6]/10 text-[#3b82f6]",
  completed: "bg-[#22c55e]/10 text-[#22c55e]",
  overdue: "bg-destructive/10 text-destructive",
};

const TaskHistory = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch tasks
        const taskList = await listResource<Task>("tasks");
        setTasks(taskList.map(normalizeTaskAssignees));

        // Fetch employees
        let allEmployees: Employee[] = [];
        try {
          const employeeList = await listResource<Employee>("employees");
          allEmployees = employeeList.filter((e) => e.status === "active");
        } catch (err) {
          console.error("Failed to load employees:", err);
        }

        // Fetch users with employee role
        try {
          const userList = await listResource<User>("users");
          const employeeUsers = userList
            .filter((u) => u.role === "employee" && (u.status === "active" || u.status === "pending"))
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              status: "active" as const,
            }));

          // Merge both lists (remove duplicates by email)
          employeeUsers.forEach((eu) => {
            if (!allEmployees.some((e) => e.email === eu.email)) {
              allEmployees.push(eu);
            }
          });
        } catch (err) {
          console.error("Failed to load users:", err);
        }

        setEmployees(allEmployees);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmployeeClick = (employeeName: string) => {
    navigate(`/admin/task-history/${encodeURIComponent(employeeName)}`);
  };

  return (
    <>
      <motion.div
        className="pl-6 space-y-4 sm:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Task History</h1>
            <p className="text-sm text-muted-foreground">
              View task history for all employees
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              All Employees ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredEmployees.map((employee, index) => {
                  const stats = getEmployeeTaskStats(employee.name, tasks);
                  return (
                    <motion.div
                      key={employee.id}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEmployeeClick(employee.name)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:flex items-center gap-3">
                          {stats.total > 0 && (
                            <>
                              <div className="text-center">
                                <Badge variant="secondary" className="text-xs">
                                  {stats.total} Total
                                </Badge>
                              </div>
                              {stats.completed > 0 && (
                                <div className="flex items-center gap-1 text-[#22c55e]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-xs">{stats.completed}</span>
                                </div>
                              )}
                              {stats.pending > 0 && (
                                <div className="flex items-center gap-1 text-[#eab308]">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">{stats.pending}</span>
                                </div>
                              )}
                              {stats.overdue > 0 && (
                                <div className="flex items-center gap-1 text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  <span className="text-xs">{stats.overdue}</span>
                                </div>
                              )}
                            </>
                          )}
                          {stats.total === 0 && (
                            <span className="text-xs text-muted-foreground">No tasks</span>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default TaskHistory;
