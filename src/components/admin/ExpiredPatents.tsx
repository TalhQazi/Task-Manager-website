import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Edit2, Trash2, FileText } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";
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
  createdAt: string;
}

const statusColors = {
  Filed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Issued: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Abandoned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function ExpiredPatents() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [formData, setFormData] = useState<Partial<FiledPatent>>({
    patentName: "",
    category: "",
    filingType: "Provisional",
    filingDate: "",
    applicationNumber: "",
    status: "Expired",
    notes: "",
  });
  const [selectedPatent, setSelectedPatent] = useState<FiledPatent | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patentsQuery = useQuery<FiledPatent[]>({
    queryKey: ["filed-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FiledPatent[] }>("/api/patents/filed");
      return res.items || [];
    },
  });

  const patents = patentsQuery.data || [];

  const expiredPatents = patents.filter((p) => {
    // Only expired patents
    if (p.status !== "Expired") return false;

    if (filterSearch) {
      const query = filterSearch.toLowerCase();
      const nameMatch = p.patentName?.toLowerCase().includes(query);
      const appNumMatch = p.applicationNumber?.toLowerCase().includes(query);
      if (!nameMatch && !appNumMatch) return false;
    }

    if (filterCategory && !p.category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
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
      status: "Expired",
      notes: "",
    });
    setSelectedPatent(null);
  };

  const calculateExpiration = (filingDate: string, filingType: string) => {
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
    if (!formData.patentName || !formData.filingDate || !formData.applicationNumber) {
      setApiError("Patent Name, Filing Date, and Application Number are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const expirationDate = calculateExpiration(formData.filingDate, formData.filingType!);
      const payload = {
        ...formData,
        provisionalExpiration: expirationDate,
      };

      if (selectedPatent) {
        await apiFetch(`/api/patents/filed/${selectedPatent._id}`, {
          method: "PUT",
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

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Expired Patent</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
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
                  value={formData.filingDate ? formData.filingDate.split("T")[0] : ""}
                  onChange={(e) =>
                    setFormData({ ...formData, filingDate: e.target.value })
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
                  value={formData.status || "Expired"}
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
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {patentsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expiredPatents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No expired patents.
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
                  <TableHead className="font-bold">Patent Name</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Application Number</TableHead>
                  <TableHead className="font-bold">Filing Date</TableHead>
                  <TableHead className="font-bold">Expiration Date</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredPatents.map((patent) => (
                  <TableRow key={patent._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {patent.patentName}
                      </div>
                    </TableCell>
                    <TableCell>{patent.filingType}</TableCell>
                    <TableCell>{patent.category || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{patent.applicationNumber}</TableCell>
                    <TableCell>
                      {new Date(patent.filingDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {patent.provisionalExpiration
                        ? new Date(patent.provisionalExpiration).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors.Expired} border-0 font-bold text-[10px] uppercase`}>
                        {patent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
