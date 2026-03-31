import { useState } from "react";
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
import { Plus, Edit2, Trash2, FileText, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";

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
  const [formData, setFormData] = useState<Partial<FiledPatent>>({
    patentName: "",
    category: "",
    filingType: "Provisional",
    filingDate: "",
    applicationNumber: "",
    status: "Filed",
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

  const resetForm = () => {
    setFormData({
      patentName: "",
      category: "",
      filingType: "Provisional",
      filingDate: "",
      applicationNumber: "",
      status: "Filed",
      notes: "",
    });
    setSelectedPatent(null);
  };

  const calculateExpiration = (filingDate: string, filingType: string) => {
    if (filingType !== "Provisional" || !filingDate) return "";
    const date = new Date(filingDate);
    date.setFullYear(date.getFullYear() + 1);
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

      const expirationDate =
        formData.filingType === "Provisional"
          ? calculateExpiration(formData.filingDate, formData.filingType!)
          : "";

      const payload = {
        ...formData,
        provisionalExpiration: expirationDate,
      };

      if (selectedPatent) {
        await apiFetch(`/api/patents/${selectedPatent._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/patents", {
          method: "POST",
          body: JSON.stringify({ ...payload, patentType: "filed" }),
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
      await apiFetch(`/api/patents/${patent._id}`, {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <FileText className="h-4 w-4 mr-2" />
          Filed Patents
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-5xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filed Patents</DialogTitle>
        </DialogHeader>

        {apiError && (
          <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
            <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
          </div>
        )}

        <div className="space-y-4">
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

            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedPatent ? "Edit Patent" : "Add New Patent"}
                </DialogTitle>
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
                    value={formData.filingDate || ""}
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
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {patents.map((patent) => (
                <motion.div
                  key={patent._id}
                  variants={itemVariants}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{patent.patentName}</h3>
                      <p className="text-xs text-muted-foreground">{patent.applicationNumber}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={statusColors[patent.status]}>
                        {patent.status}
                      </Badge>
                      {patent.provisionalExpiration && isExpiringExpiringSoon(patent.provisionalExpiration) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Expiring
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p>{patent.category} • {patent.filingType}</p>
                    <p>Filed: {new Date(patent.filingDate).toLocaleDateString()}</p>
                    {patent.provisionalExpiration && (
                      <p>Expires: {new Date(patent.provisionalExpiration).toLocaleDateString()}</p>
                    )}
                    {patent.notes && <p>{patent.notes}</p>}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(patent)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(patent)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
