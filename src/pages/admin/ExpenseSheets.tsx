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
import { Wallet, Plus, Trash2, Link as LinkIcon, ArrowLeft, Loader2, Edit, AlertCircle, Sparkles, Check, ChevronsUpDown, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/admin/ui/command";
import QuoteComparisonModal from "@/components/cost-manager/QuoteComparisonModal";
import { cn } from "@/lib/utils";

interface ExpenseSheetItem {
  id: string;
  projectId?: string;
  taskId?: string;
  name: string;
  vendorName?: string;
  quoteNumber?: string;
  isQuote?: boolean;
  quoteStatus?: string;
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

  // Multi-quote comparison state
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Detailed view sheet
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>("");

  // Create / Edit modal state
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<ExpenseSheetItem | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [sheetVendorName, setSheetVendorName] = useState("");
  const [sheetQuoteNumber, setSheetQuoteNumber] = useState("");
  const [sheetBudget, setSheetBudget] = useState("");
  const [savingSheet, setSavingSheet] = useState(false);

  // Attach modal state
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachingSheet, setAttachingSheet] = useState<ExpenseSheetItem | null>(null);
  const [attachType, setAttachType] = useState<"none" | "project" | "task">("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [savingAttach, setSavingAttach] = useState(false);

  // Direct inline search input state & dropdown open states
  const [projectSearchInput, setProjectSearchInput] = useState("");
  const [taskSearchInput, setTaskSearchInput] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!projectSearchInput.trim()) return projects;
    const q = projectSearchInput.toLowerCase().trim();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, projectSearchInput]);

  const filteredTasks = useMemo(() => {
    if (!taskSearchInput.trim()) return tasks;
    const q = taskSearchInput.toLowerCase().trim();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, taskSearchInput]);

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
        apiFetch<{ items?: any[] }>("/api/projects?limit=5000&all=true"),
        apiFetch<{ items?: any[] }>("/api/tasks?limit=5000&all=true"),
      ]);
      const rawProjects = Array.isArray(projRes) ? projRes : (projRes?.items || []);
      const rawTasks = Array.isArray(taskRes) ? taskRes : (taskRes?.items || []);

      setProjects(
        rawProjects
          .map((p: any) => ({
            id: String(p.id || p._id || ""),
            name: String(p.name || p.title || "Untitled Project"),
          }))
          .filter((p: any) => Boolean(p.id))
      );

      setTasks(
        rawTasks
          .map((t: any) => ({
            id: String(t.id || t._id || ""),
            title: String(t.title || t.name || "Untitled Task"),
          }))
          .filter((t: any) => Boolean(t.id))
      );
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
    setSheetVendorName("");
    setSheetQuoteNumber("");
    setSheetBudget("0.00");
    setSheetModalOpen(true);
  };

  const handleOpenEditModal = (sheet: ExpenseSheetItem) => {
    setEditingSheet(sheet);
    setSheetName(sheet.name);
    setSheetVendorName(sheet.vendorName || "");
    setSheetQuoteNumber(sheet.quoteNumber || "");
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
      const payload = {
        name: sheetName.trim(),
        vendorName: sheetVendorName.trim(),
        quoteNumber: sheetQuoteNumber.trim(),
        isQuote: Boolean(sheetVendorName.trim() || sheetQuoteNumber.trim()),
        availableBudgetCents: budgetCents,
      };

      if (editingSheet) {
        await updateCostSheet(editingSheet.id, payload);
        toast.success("Expense sheet updated successfully");
      } else {
        await createCostSheet(payload);
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
    loadAttachOptions();
    setAttachingSheet(sheet);
    setProjectDropdownOpen(false);
    setTaskDropdownOpen(false);
    if (sheet.projectId) {
      setAttachType("project");
      setSelectedProjectId(sheet.projectId);
      const proj = projects.find((p) => p.id === sheet.projectId);
      setProjectSearchInput(proj ? proj.name : "");
      setSelectedTaskId("");
      setTaskSearchInput("");
    } else if (sheet.taskId) {
      setAttachType("task");
      setSelectedTaskId(sheet.taskId);
      const t = tasks.find((tk) => tk.id === sheet.taskId);
      setTaskSearchInput(t ? t.title : "");
      setSelectedProjectId("");
      setProjectSearchInput("");
    } else {
      setAttachType("none");
      setSelectedProjectId("");
      setProjectSearchInput("");
      setSelectedTaskId("");
      setTaskSearchInput("");
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
      const vendor = (s.vendorName || "").toLowerCase();
      const quoteNum = (s.quoteNumber || "").toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        vendor.includes(query) ||
        quoteNum.includes(query) ||
        projName.includes(query) ||
        taskName.includes(query) ||
        creator.includes(query)
      );
    });
  }, [sheets, search, projects, tasks]);

  const toggleSelectSheet = (id: string) => {
    setSelectedSheetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSheetIds.length === filteredSheets.length) {
      setSelectedSheetIds([]);
    } else {
      setSelectedSheetIds(filteredSheets.map((s) => s.id));
    }
  };

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
            Standalone Expense & Quote Sheets
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Create, manage, and compare vendor quotes (e.g. Gaftek vs. Simard) side-by-side or attach expense sheets to projects.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedSheetIds.length >= 2 && (
            <Button
              onClick={() => setCompareModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md animate-pulse"
            >
              <Sparkles className="h-4 w-4" /> Compare Quotes ({selectedSheetIds.length})
            </Button>
          )}
          <Button onClick={handleOpenCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Expense Sheet
          </Button>
        </div>
      </div>

      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Input
                placeholder="Search by name, vendor (e.g. Gaftek), quote #, project..."
                className="h-9 sm:h-10 text-sm sm:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedSheetIds.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>{selectedSheetIds.length} sheet(s) selected</span>
                {selectedSheetIds.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompareModalOpen(true)}
                    className="h-8 border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                  >
                    Compare Selected
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedSheetIds([])} className="h-8">
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
            All Expense & Quote Sheets ({filteredSheets.length})
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
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all sheets"
                        checked={filteredSheets.length > 0 && selectedSheetIds.length === filteredSheets.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="text-sm">Sheet Name</TableHead>
                    <TableHead className="text-sm">Vendor / Quote</TableHead>
                    <TableHead className="text-sm">Available Budget</TableHead>
                    <TableHead className="text-sm">Attached To</TableHead>
                    <TableHead className="text-sm">Created By</TableHead>
                    <TableHead className="text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheets.map((s) => {
                    const isSelected = selectedSheetIds.includes(s.id);
                    return (
                      <TableRow key={s.id} className={`hover:bg-muted/30 ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}>
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={`Select ${s.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelectSheet(s.id)}
                            className="rounded border-slate-300 h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-white">
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
                        <TableCell>
                          {s.vendorName ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {s.vendorName}
                              </span>
                              {s.quoteNumber && (
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  Quote #{s.quoteNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                          {formatMoney(s.availableBudgetCents, s.currency)}
                        </TableCell>
                        <TableCell>
                          {s.projectId ? (
                            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs">
                              Project: {getProjectName(s.projectId)}
                            </Badge>
                          ) : s.taskId ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs">
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
                    );
                  })}
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
            <DialogTitle>{editingSheet ? "Edit Expense / Quote Sheet" : "Create Expense / Quote Sheet"}</DialogTitle>
            <DialogDescription>
              Provide sheet details, vendor name (e.g. Gaftek, Simard), and budget limit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">Sheet Name *</Label>
              <Input
                id="name"
                placeholder="e.g. 978 - Gaftek Quote"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendor" className="text-sm font-semibold">Vendor / Contractor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g. Gaftek / Simard"
                  value={sheetVendorName}
                  onChange={(e) => setSheetVendorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quoteNum" className="text-sm font-semibold">Quote / Ref #</Label>
                <Input
                  id="quoteNum"
                  placeholder="e.g. Q-978"
                  value={sheetQuoteNumber}
                  onChange={(e) => setSheetQuoteNumber(e.target.value)}
                />
              </div>
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

      {/* Quote Comparison Modal */}
      <QuoteComparisonModal
        sheetIds={selectedSheetIds}
        open={compareModalOpen}
        onOpenChange={setCompareModalOpen}
      />

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
              <div className="space-y-1.5 animate-fadeIn relative">
                <Label className="text-sm font-semibold">Select Project</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Choose project..."
                    value={projectSearchInput}
                    onFocus={() => setProjectDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProjectSearchInput(val);
                      setProjectDropdownOpen(true);
                      if (!val.trim()) {
                        setSelectedProjectId("");
                      } else {
                        const exact = projects.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                        if (exact) setSelectedProjectId(exact.id);
                      }
                    }}
                    className="w-full h-10 pr-10 bg-background border-input text-foreground text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                  />
                  {projectSearchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProjectSearchInput("");
                        setSelectedProjectId("");
                        setProjectDropdownOpen(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <ChevronsUpDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-60"
                    />
                  )}
                </div>

                {projectDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setProjectDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-[100] max-h-[220px] overflow-y-auto custom-scrollbar bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-1 animate-in fade-in-50 zoom-in-95">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between hover:bg-accent hover:text-accent-foreground",
                              selectedProjectId === p.id && "bg-primary/10 text-primary font-semibold"
                            )}
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setProjectSearchInput(p.name);
                              setProjectDropdownOpen(false);
                            }}
                          >
                            <span className="truncate">{p.name}</span>
                            {selectedProjectId === p.id && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No projects found{projectSearchInput ? ` for "${projectSearchInput}"` : ""}.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {attachType === "task" && (
              <div className="space-y-1.5 animate-fadeIn relative">
                <Label className="text-sm font-semibold">Select Task</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Choose task..."
                    value={taskSearchInput}
                    onFocus={() => setTaskDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTaskSearchInput(val);
                      setTaskDropdownOpen(true);
                      if (!val.trim()) {
                        setSelectedTaskId("");
                      } else {
                        const exact = tasks.find(t => t.title.toLowerCase() === val.trim().toLowerCase());
                        if (exact) setSelectedTaskId(exact.id);
                      }
                    }}
                    className="w-full h-10 pr-10 bg-background border-input text-foreground text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                  />
                  {taskSearchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskSearchInput("");
                        setSelectedTaskId("");
                        setTaskDropdownOpen(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <ChevronsUpDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-60"
                    />
                  )}
                </div>

                {taskDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setTaskDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-[100] max-h-[220px] overflow-y-auto custom-scrollbar bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-1 animate-in fade-in-50 zoom-in-95">
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between hover:bg-accent hover:text-accent-foreground",
                              selectedTaskId === t.id && "bg-primary/10 text-primary font-semibold"
                            )}
                            onClick={() => {
                              setSelectedTaskId(t.id);
                              setTaskSearchInput(t.title);
                              setTaskDropdownOpen(false);
                            }}
                          >
                            <span className="truncate">{t.title}</span>
                            {selectedTaskId === t.id && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No tasks found{taskSearchInput ? ` for "${taskSearchInput}"` : ""}.
                        </div>
                      )}
                    </div>
                  </>
                )}
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
