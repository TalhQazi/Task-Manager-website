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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
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
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
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

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEstimatedDate, setFilterEstimatedDate] = useState("");

  const [filingData, setFilingData] = useState({
    filingDate: "",
    applicationNumber: "",
    filingType: "Provisional" as "Provisional" | "Non-Provisional" | "International",
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
        await apiFetch(`/api/patents/pending/${selectedPatent._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/patents/pending", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      await patentsQuery.refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save patent:", error);
      alert("Failed to save patent");
    }
  };

  const handleFilePatent = async () => {
    if (!selectedPatent) return;
    if (!filingData.filingDate || !filingData.applicationNumber) {
      alert("Filing Date and Application Number are required");
      return;
    }

    try {
      await apiFetch(`/api/patents/${selectedPatent._id}`, {
        method: "PUT",
        body: JSON.stringify({
          patentType: "filed",
          status: "Filed",
          filingDate: filingData.filingDate,
          applicationNumber: filingData.applicationNumber,
          filingType: filingData.filingType,
        }),
      });
      await patentsQuery.refetch();
      setIsFileDialogOpen(false);
    } catch (error) {
      console.error("Failed to file patent:", error);
      alert("Failed to file patent");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patent?")) return;

    try {
      await apiFetch(`/api/patents/pending/${id}`, { method: "DELETE" });
      await patentsQuery.refetch();
    } catch (error) {
      console.error("Failed to delete patent:", error);
      alert("Failed to delete patent");
    }
  };

  const patents = patentsQuery.data || [];

  const filteredPatents = patents.filter((p) => {
    if (filterCategory && !p.category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    if (filterStage && p.stage !== filterStage) return false;
    if (filterStartDate && new Date(p.startDate) < new Date(filterStartDate)) return false;
    if (filterEstimatedDate && new Date(p.estimatedFilingDate) > new Date(filterEstimatedDate)) return false;
    return true;
  });

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

        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Move to Filed Patents</DialogTitle>
              <DialogDescription>
                Provide the filing details to update this patent's status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Filing Type</label>
                <select
                  value={filingData.filingType}
                  onChange={(e) =>
                    setFilingData({
                      ...filingData,
                      filingType: e.target.value as any,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Provisional">Provisional</option>
                  <option value="Non-Provisional">Non-Provisional</option>
                  <option value="International">International</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Filing Date *</label>
                <input
                  type="date"
                  value={filingData.filingDate}
                  onChange={(e) =>
                    setFilingData({ ...filingData, filingDate: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Application Number *</label>
                <input
                  type="text"
                  value={filingData.applicationNumber}
                  onChange={(e) =>
                    setFilingData({ ...filingData, applicationNumber: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., US 10,123,456"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleFilePatent} className="flex-1 bg-green-600 hover:bg-green-700">
                  File Patent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFileDialogOpen(false)}
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
        <div className="space-y-4">
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Stages</option>
                  <option value="Concept">Concept</option>
                  <option value="Research">Research</option>
                  <option value="Drafting">Drafting</option>
                  <option value="Ready to File">Ready to File</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Started After</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Est. Filing Before</label>
                <input
                  type="date"
                  value={filterEstimatedDate}
                  onChange={(e) => setFilterEstimatedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border overflow-hidden mt-4 bg-background">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 font-bold">#</TableHead>
                <TableHead className="font-bold">Patent Name</TableHead>
                <TableHead className="font-bold">Stage</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Inventors</TableHead>
                <TableHead className="font-bold">Started</TableHead>
                <TableHead className="font-bold">Est. Filing</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No patents match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatents.map((patent, index) => (
                  <TableRow key={patent._id} className="hover:bg-muted/30 transition-colors text-sm">
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{patent.patentName}</TableCell>
                  <TableCell>
                    <Badge className={`${stageColors[patent.stage]} border-0 shadow-none font-bold text-[10px] uppercase whitespace-nowrap`}>
                      {patent.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{patent.category}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{patent.inventors.join(", ") || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{patent.startDate}</TableCell>
                  <TableCell className="text-xs font-medium text-blue-600">{patent.estimatedFilingDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600"
                        title="Move to Filed"
                        onClick={() => {
                          setSelectedPatent(patent);
                          setFilingData({
                            filingDate: new Date().toISOString().split("T")[0],
                            applicationNumber: "",
                            filingType: "Provisional",
                          });
                          setIsFileDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600"
                        title="Edit"
                        onClick={() => handleOpenDialog(patent)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        title="Delete"
                        onClick={() => handleDelete(patent._id!)}
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
