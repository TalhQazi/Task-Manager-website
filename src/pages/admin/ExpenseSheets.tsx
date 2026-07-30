import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/manger/api";
import {
  CostSheetPayload,
  getCostSheets,
  createCostSheet,
  deleteCostSheet,
  attachCostSheet,
  updateCostSheet,
  formatMoney,
  dollarsToCents,
  centsToDollarInput,
} from "@/lib/costManager";
import CostManager from "@/components/cost-manager/CostManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Trash2, Link as LinkIcon, ArrowLeft, Loader2, Edit, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ExpenseSheetItem {
  id: string;
  projectId?: string;
  taskId?: string;
  name: string;
  currency: string;
  availableBudgetCents: number;
  createdByUsername?: string;
  createdAt?: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface TaskOption {
  id: string;
  title: string;
}

export default function ExpenseSheets() {
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState<ExpenseSheetItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [search, setSearch] = useState("");

  // Detailed view sheet
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>("");

  // Create / Edit modal state
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<ExpenseSheetItem | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [sheetBudget, setSheetBudget] = useState("");
  const [savingSheet, setSavingSheet] = useState(false);

  // Attach modal state
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachingSheet, setAttachingSheet] = useState<ExpenseSheetItem | null>(null);
  const [attachType, setAttachType] = useState<"none" | "project" | "task">("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [savingAttach, setSavingAttach] = useState(false);

  // Load expense sheets
  const loadSheets = async () => {
    try {
      setLoading(true);
      const res = await getCostSheets();
      setSheets(res.items || []);
    } catch (err) {
      toast.error("Failed to load expense sheets");
    } finally {
      setLoading(false);
    }
  };

  // Load helper data (projects, tasks) for attachment
  const loadAttachOptions = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        apiFetch<{ items?: ProjectOption[] }>("/api/projects?limit=1000"),
        apiFetch<{ items?: TaskOption[] }>("/api/tasks?limit=1000"),
      ]);
      setProjects(projRes.items || []);
      setTasks(taskRes.items || []);
    } catch (err) {
      console.error("Failed to load attachment options", err);
    }
  };

  useEffect(() => {
    loadSheets();
    loadAttachOptions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingSheet(null);
    setSheetName("");
    setSheetBudget("0.00");
    setSheetModalOpen(true);
  };

  const handleOpenEditModal = (sheet: ExpenseSheetItem) => {
    setEditingSheet(sheet);
    setSheetName(sheet.name);
    setSheetBudget(centsToDollarInput(sheet.availableBudgetCents));
    setSheetModalOpen(true);
  };

  const handleSaveSheet = async () => {
    if (!sheetName.trim()) {
      toast.error("Please enter a sheet name");
      return;
    }

    try {
      setSavingSheet(true);
      const budgetCents = dollarsToCents(sheetBudget);

      if (editingSheet) {
        await updateCostSheet(editingSheet.id, {
          name: sheetName.trim(),
          availableBudgetCents: budgetCents,
        });
        toast.success("Expense sheet updated successfully");
      } else {
        await createCostSheet({
          name: sheetName.trim(),
          availableBudgetCents: budgetCents,
        });
        toast.success("Expense sheet created successfully");
      }
      setSheetModalOpen(false);
      loadSheets();
    } catch (err) {
      toast.error("Failed to save expense sheet");
    } finally {
      setSavingSheet(false);
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!confirm("Are you sure you want to delete this expense sheet? This will delete all its sections, line items, and files permanently.")) {
      return;
    }

    try {
      await deleteCostSheet(sheetId);
      toast.success("Expense sheet deleted successfully");
      loadSheets();
      if (activeSheetId === sheetId) {
        setActiveSheetId(null);
      }
    } catch (err) {
      toast.error("Failed to delete expense sheet");
    }
  };

  const handleOpenAttachModal = (sheet: ExpenseSheetItem) => {
    setAttachingSheet(sheet);
    if (sheet.projectId) {
      setAttachType("project");
      setSelectedProjectId(sheet.projectId);
      setSelectedTaskId("");
    } else if (sheet.taskId) {
      setAttachType("task");
      setSelectedTaskId(sheet.taskId);
      setSelectedProjectId("");
    } else {
      setAttachType("none");
      setSelectedProjectId("");
      setSelectedTaskId("");
    }
    setAttachModalOpen(true);
  };

  const handleSaveAttach = async () => {
    if (!attachingSheet) return;

    try {
      setSavingAttach(true);
      const projectId = attachType === "project" ? selectedProjectId : null;
      const taskId = attachType === "task" ? selectedTaskId : null;

      await attachCostSheet(attachingSheet.id, { projectId, taskId });
      toast.success("Attachment updated successfully");
      setAttachModalOpen(false);
      loadSheets();
    } catch (err) {
      toast.error("Failed to update attachment");
    } finally {
      setSavingAttach(false);
    }
  };

  const getProjectName = (id?: string) => {
    if (!id) return "";
    return projects.find((p) => p.id === id)?.name || "Unknown Project";
  };

  const getTaskName = (id?: string) => {
    if (!id) return "";
    return tasks.find((t) => t.id === id)?.title || "Unknown Task";
  };

  // Filter sheets
  const filteredSheets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sheets;
    return sheets.filter((s) => {
      const projName = s.projectId ? getProjectName(s.projectId).toLowerCase() : "";
      const taskName = s.taskId ? getTaskName(s.taskId).toLowerCase() : "";
      const creator = (s.createdByUsername || "").toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        projName.includes(query) ||
        taskName.includes(query) ||
        creator.includes(query)
      );
    });
  }, [sheets, search, projects, tasks]);

  // If a sheet is selected, display the CostManager
  if (activeSheetId) {
    return (
      <div className="pl-6 space-y-4 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSheetId(null)}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sheets
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{activeSheetName}</h1>
            <Badge variant="secondary">Detailed Cost Sheet</Badge>
          </div>
        </div>

        <CostManager sheetId={activeSheetId} projectName={activeSheetName} />
      </div>
    );
  }

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-7 w-7 text-indigo-500" />
            Standalone Expense Sheets
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Create, manage, and attach premium expense sheets to your projects or tasks.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Expense Sheet
        </Button>
      </div>

      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6">
          <div className="relative w-full sm:max-w-md">
            <Input
              placeholder="Search expense sheets by name, project, task, creator..."
              className="h-9 sm:h-10 text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
            All Expense Sheets ({filteredSheets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 sm:py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <div className="text-xs sm:text-sm text-muted-foreground">Loading expense sheets...</div>
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm italic">
              No expense sheets found. Click "Create Expense Sheet" to get started.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Sheet Name</TableHead>
                    <TableHead className="text-sm">Available Budget</TableHead>
                    <TableHead className="text-sm">Attached To</TableHead>
                    <TableHead className="text-sm">Created By</TableHead>
                    <TableHead className="text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheets.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-slate-900">
                        <button
                          onClick={() => {
                            setActiveSheetId(s.id);
                            setActiveSheetName(s.name);
                          }}
                          className="hover:underline text-left"
                        >
                          {s.name}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {formatMoney(s.availableBudgetCents, s.currency)}
                      </TableCell>
                      <TableCell>
                        {s.projectId ? (
                          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs">
                            Project: {getProjectName(s.projectId)}
                          </Badge>
                        ) : s.taskId ? (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                            Task: {getTaskName(s.taskId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Unattached</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {s.createdByUsername || "System"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAttachModal(s)}
                            className="h-8 px-2 flex items-center gap-1 text-slate-600 border-slate-200"
                            title="Attach to Project/Task"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Attach</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(s)}
                            className="h-8 px-2 flex items-center gap-1 text-indigo-600 border-indigo-200"
                            title="Edit Sheet"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSheet(s.id)}
                            className="h-8 px-2 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            title="Delete Sheet"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Sheet Dialog */}
      <Dialog open={sheetModalOpen} onOpenChange={setSheetModalOpen}>
        <DialogContent className="max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingSheet ? "Edit Expense Sheet" : "Create Expense Sheet"}</DialogTitle>
            <DialogDescription>
              Provide a name and budget limit for this independent expense sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">Sheet Name</Label>
              <Input
                id="name"
                placeholder="e.g. Q3 Hardware Purchases"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget" className="text-sm font-semibold">Available Budget ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                  value={sheetBudget}
                  onChange={(e) => setSheetBudget(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSheetModalOpen(false)} disabled={savingSheet}>
              Cancel
            </Button>
            <Button onClick={handleSaveSheet} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={savingSheet}>
              {savingSheet ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Sheet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Sheet Dialog */}
      <Dialog open={attachModalOpen} onOpenChange={setAttachModalOpen}>
        <DialogContent className="max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Attach Expense Sheet</DialogTitle>
            <DialogDescription>
              Link this expense sheet to a Project or Task, or leave it standalone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Attachment Type</Label>
              <Select value={attachType} onValueChange={(v: any) => setAttachType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone (Unattached)</SelectItem>
                  <SelectItem value="project">Attach to Project</SelectItem>
                  <SelectItem value="task">Attach to Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {attachType === "project" && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label className="text-sm font-semibold">Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {attachType === "task" && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label className="text-sm font-semibold">Select Task</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {attachType !== "none" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Attaching this sheet will update the project/task details to link directly here. If this sheet is already attached elsewhere, it will be moved.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAttachModalOpen(false)} disabled={savingAttach}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttach} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={savingAttach}>
              {savingAttach ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Linking...
                </>
              ) : (
                "Save Attachment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
