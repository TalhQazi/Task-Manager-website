import { useState, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Plus, Edit2, Trash2, FileText, AlertCircle, X, Bell } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";

interface FiledPatent {
  _id: string;
  patentName: string;
  category: string;
  filingType: "Provisional" | "Non-Provisional" | "International";
  filingDate: string;
  applicationNumber: string;
  provisionalExpiration: string;
  status: "Filed" | "Issued" | "Expired" | "Abandoned";
  notes: string;
  attachments: string[];
  customReminderDays: number[];
  createdAt: string;
}

const statusColors = {
  Filed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Issued: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Abandoned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export function FiledPatents() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [formData, setFormData] = useState<Partial<FiledPatent>>({
    patentName: "",
    category: "",
    filingType: "Provisional",
    filingDate: "",
    applicationNumber: "",
    status: "Filed",
    notes: "",
    customReminderDays: [],
  });
  const [selectedPatent, setSelectedPatent] = useState<FiledPatent | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReminderDay, setNewReminderDay] = useState("");

  const patentsQuery = useQuery<FiledPatent[]>({
    queryKey: ["filed-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FiledPatent[] }>("/api/patents/filed");
      return res.items || [];
    },
  });

  const patents = patentsQuery.data || [];

  const filteredPatents = patents.filter((p) => {
    // Hide expired by default so they go to the Expired tab
    if (p.status === "Expired") return false;

    if (filterSearch) {
      const query = filterSearch.toLowerCase();
      const nameMatch = p.patentName?.toLowerCase().includes(query);
      const appNumMatch = p.applicationNumber?.toLowerCase().includes(query);
      if (!nameMatch && !appNumMatch) return false;
    }
    if (filterCategory && !p.category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterStartDate && new Date(p.filingDate) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(p.filingDate) > new Date(filterEndDate)) return false;
    return true;
  });

  const resetForm = () => {
    setFormData({
      patentName: "",
      category: "",
      filingType: "Provisional",
      filingDate: "",
      applicationNumber: "",
      status: "Filed",
      notes: "",
      customReminderDays: [],
    });
    setSelectedPatent(null);
    setNewReminderDay("");
  };

  const handleAddReminderDay = useCallback(() => {
    const val = Math.round(Number(newReminderDay));
    if (!Number.isFinite(val) || val <= 0) return;
    const current = formData.customReminderDays || [];
    if (current.includes(val)) return;
    setFormData({ ...formData, customReminderDays: [...current, val].sort((a, b) => a - b) });
    setNewReminderDay("");
  }, [newReminderDay, formData]);

  const handleRemoveReminderDay = useCallback((day: number) => {
    setFormData((prev) => ({
      ...prev,
      customReminderDays: (prev.customReminderDays || []).filter((d) => d !== day),
    }));
  }, []);

  const autoCalculateExpiration = (filingDate: string, filingType: string) => {
    if (!filingDate) return "";
    const date = new Date(filingDate);
    if (filingType === "Provisional") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 20);
    }
    return date.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!formData.patentName) {
      setApiError("Patent Name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const expirationDate = formData.provisionalExpiration
        ? formData.provisionalExpiration.split("T")[0]
        : formData.filingDate
          ? autoCalculateExpiration(formData.filingDate, formData.filingType || "Provisional")
          : "";

      const payload = {
        ...formData,
        provisionalExpiration: expirationDate,
      };

      if (selectedPatent) {
        await apiFetch(`/api/patents/filed/${selectedPatent._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/patents/filed", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await patentsQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (patent: FiledPatent) => {
    if (!confirm("Are you sure you want to delete this patent?")) return;

    try {
      await apiFetch(`/api/patents/filed/${patent._id}`, {
        method: "DELETE",
      });
      await patentsQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (patent: FiledPatent) => {
    setSelectedPatent(patent);
    setFormData(patent);
    setIsEditDialogOpen(true);
  };

  const isExpiringExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.floor(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patent
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-md flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedPatent ? "Edit Patent" : "Add New Patent"}
              </DialogTitle>
            </DialogHeader>

            {apiError && (
              <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
                <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="text-sm font-medium">Patent Name</label>
                <input
                  type="text"
                  value={formData.patentName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, patentName: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  placeholder="Patent name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  type="text"
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Software, Mechanical"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Filing Type</label>
                <select
                  value={formData.filingType || "Provisional"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      filingType: e.target.value as FiledPatent["filingType"],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Provisional">Provisional</option>
                  <option value="Non-Provisional">Non-Provisional</option>
                  <option value="International">International</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Filing Date</label>
                <input
                  type="date"
                  value={formData.filingDate || ""}
                  onChange={(e) => {
                    const newFilingDate = e.target.value;
                    const calculated = autoCalculateExpiration(newFilingDate, formData.filingType || "Provisional");
                    setFormData({
                      ...formData,
                      filingDate: newFilingDate,
                      provisionalExpiration: calculated,
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Expiration Date</span>
                  <span className="text-xs text-muted-foreground font-normal">(Editable)</span>
                </label>
                <input
                  type="date"
                  value={
                    formData.provisionalExpiration
                      ? formData.provisionalExpiration.split("T")[0]
                      : formData.filingDate
                        ? autoCalculateExpiration(formData.filingDate, formData.filingType || "Provisional")
                        : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, provisionalExpiration: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Application Number</label>
                <input
                  type="text"
                  value={formData.applicationNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationNumber: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., US 10,123,456"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status || "Filed"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as FiledPatent["status"],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Filed">Filed</option>
                  <option value="Issued">Issued</option>
                  <option value="Expired">Expired</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Custom Email Reminder Days */}
              <div className="space-y-2 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                <label className="text-sm font-medium flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
                  <Bell className="h-3.5 w-3.5" />
                  Custom Email Reminder Days
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Set custom days before expiration to receive email reminders for this patent. Leave empty to use the global notification settings.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(formData.customReminderDays || []).map((day) => (
                    <Badge
                      key={day}
                      variant="outline"
                      className="px-2 py-0.5 text-xs font-medium bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 flex items-center gap-1 group hover:border-red-400 transition-colors"
                    >
                      {day} {day === 1 ? "day" : "days"}
                      <button
                        type="button"
                        onClick={() => handleRemoveReminderDay(day)}
                        className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(formData.customReminderDays || []).length === 0 && (
                    <span className="text-[11px] text-muted-foreground italic">Using global settings</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 45"
                    value={newReminderDay}
                    onChange={(e) => setNewReminderDay(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddReminderDay();
                      }
                    }}
                    className="w-28 h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddReminderDay}
                    className="h-7 text-xs gap-1 border-indigo-300 dark:border-indigo-700"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-primary"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {patentsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : patents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No patents yet. Click "Add Patent" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
                <input
                  type="text"
                  placeholder="Search name or app number..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <input
                  type="text"
                  placeholder="Filter category..."
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Statuses</option>
                  <option value="Filed">Filed</option>
                  <option value="Issued">Issued</option>
                  <option value="Expired">Expired</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Filed After</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Filed Before</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 font-bold">#</TableHead>
                  <TableHead className="font-bold">Patent Name</TableHead>
                  <TableHead className="font-bold">Filed Date</TableHead>
                  <TableHead className="font-bold">Expires</TableHead>
                  <TableHead className="font-bold">App Number</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No patents match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatents.map((patent, index) => (
                    <TableRow key={patent._id} className="hover:bg-muted/30 transition-colors text-sm">
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{patent.patentName}</TableCell>
                      <TableCell className="text-xs">{patent.filingDate ? new Date(patent.filingDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-xs text-amber-600 font-medium">
                        {patent.provisionalExpiration ? new Date(patent.provisionalExpiration).toLocaleDateString() : "—"}
                        {patent.provisionalExpiration && isExpiringExpiringSoon(patent.provisionalExpiration) && (
                          <Badge variant="destructive" className="ml-2 text-[8px] px-1 py-0 h-4">EXPIRING</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{patent.applicationNumber}</TableCell>
                      <TableCell className="text-xs">{patent.category}</TableCell>
                      <TableCell className="text-xs">{patent.filingType}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[patent.status]} border-0 shadow-none font-bold text-[10px] uppercase`}>
                          {patent.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleEdit(patent)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(patent)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </div>
  );
}
