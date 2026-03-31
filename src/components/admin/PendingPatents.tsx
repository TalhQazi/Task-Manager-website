import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface PendingPatent {
  _id?: string;
  patentName: string;
  category: string;
  stage: "Concept" | "Research" | "Drafting" | "Ready to File";
  startDate: string;
  estimatedFilingDate: string;
  inventors: string[];
  notes?: string;
  createdAt?: string;
}

const stageColors: Record<PendingPatent["stage"], string> = {
  "Concept": "bg-gray-500/10 text-gray-700 border border-gray-300",
  "Research": "bg-blue-500/10 text-blue-700 border border-blue-300",
  "Drafting": "bg-purple-500/10 text-purple-700 border border-purple-300",
  "Ready to File": "bg-green-500/10 text-green-700 border border-green-300",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export function PendingPatents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatent, setSelectedPatent] = useState<PendingPatent | null>(
    null
  );
  const [formData, setFormData] = useState<PendingPatent>({
    patentName: "",
    category: "",
    stage: "Concept",
    startDate: new Date().toISOString().split("T")[0],
    estimatedFilingDate: "",
    inventors: [],
    notes: "",
  });

  const patentsQuery = useQuery<PendingPatent[]>({
    queryKey: ["pending-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: PendingPatent[] }>(
        "/api/patents/pending"
      );
      return res.items || [];
    },
  });

  const handleOpenDialog = (patent?: PendingPatent) => {
    if (patent) {
      setSelectedPatent(patent);
      setFormData(patent);
    } else {
      setSelectedPatent(null);
      setFormData({
        patentName: "",
        category: "",
        stage: "Concept",
        startDate: new Date().toISOString().split("T")[0],
        estimatedFilingDate: "",
        inventors: [],
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.patentName || !formData.estimatedFilingDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (selectedPatent) {
        await apiFetch(`/api/patents/${selectedPatent._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/patents", {
          method: "POST",
          body: JSON.stringify({ ...formData, patentType: "pending" }),
        });
      }
      await patentsQuery.refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save patent:", error);
      alert("Failed to save patent");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patent?")) return;

    try {
      await apiFetch(`/api/patents/${id}`, { method: "DELETE" });
      await patentsQuery.refetch();
    } catch (error) {
      console.error("Failed to delete patent:", error);
      alert("Failed to delete patent");
    }
  };

  const patents = patentsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending/Draft Patents</h2>
          <p className="text-sm text-gray-500">Patents in development stages</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedPatent ? "Edit Patent" : "New Patent"}
              </DialogTitle>
              <DialogDescription>
                Track patents in development stages
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Patent Name *</label>
                <input
                  type="text"
                  value={formData.patentName}
                  onChange={(e) =>
                    setFormData({ ...formData, patentName: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Patent name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software, Mechanical"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stage: e.target.value as PendingPatent["stage"],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Concept">Concept</option>
                  <option value="Research">Research</option>
                  <option value="Drafting">Drafting</option>
                  <option value="Ready to File">Ready to File</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Filing Date *</label>
                <input
                  type="date"
                  value={formData.estimatedFilingDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedFilingDate: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Inventors</label>
                <input
                  type="text"
                  value={formData.inventors.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventors: e.target.value.split(",").map((i) => i.trim()),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comma-separated inventor names"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                >
                  {selectedPatent ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {patentsQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Loading patents...
          </CardContent>
        </Card>
      ) : patents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No pending patents yet
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {patents.map((patent) => (
            <motion.div key={patent._id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">
                          {patent.patentName}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{patent.category}</Badge>
                        <Badge className={stageColors[patent.stage]}>
                          {patent.stage}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Started: {patent.startDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>Filing: {patent.estimatedFilingDate}</span>
                        </div>
                      </div>
                      {patent.inventors.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <strong>Inventors:</strong> {patent.inventors.join(", ")}
                        </p>
                      )}
                      {patent.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {patent.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(patent)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(patent._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
