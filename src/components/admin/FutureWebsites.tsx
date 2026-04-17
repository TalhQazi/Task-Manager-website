import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Plus, Edit2, Trash2, Rocket, Code } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";

interface FutureWebsite {
  _id: string;
  projectName: string;
  domain: string;
  developmentStage: "Concept" | "Planning" | "Design" | "Development" | "Testing" | "Ready for Launch";
  priority: "Low" | "Medium" | "High" | "Critical";
  concept: string;
  notes: string;
  createdAt: string;
}

const stageColors: Record<FutureWebsite["developmentStage"], string> = {
  "Concept": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  "Planning": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Design": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Development": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Testing": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Ready for Launch": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const priorityColors: Record<FutureWebsite["priority"], string> = {
  "Low": "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  "Medium": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "High": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Critical": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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

export function FutureWebsites() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FutureWebsite>>({
    projectName: "",
    domain: "",
    developmentStage: "Concept",
    priority: "Medium",
    concept: "",
    notes: "",
  });
  const [selectedWebsite, setSelectedWebsite] = useState<FutureWebsite | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const websitesQuery = useQuery<FutureWebsite[]>({
    queryKey: ["future-websites"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FutureWebsite[] }>("/api/websites/future");
      return res.items || [];
    },
  });

  const websites = websitesQuery.data || [];

  const resetForm = () => {
    setFormData({
      projectName: "",
      domain: "",
      developmentStage: "Concept",
      priority: "Medium",
      concept: "",
      notes: "",
    });
    setSelectedWebsite(null);
  };

  const handleSave = async () => {
    if (!formData.projectName || !formData.domain) {
      setApiError("Project Name and Domain are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      if (selectedWebsite) {
        await apiFetch(`/api/websites/${selectedWebsite._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/websites", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            websiteType: "future",
          }),
        });
      }

      await websitesQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (website: FutureWebsite) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiFetch(`/api/websites/${website._id}`, {
        method: "DELETE",
      });
      await websitesQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (website: FutureWebsite) => {
    setSelectedWebsite(website);
    setFormData(website);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              resetForm();
              setIsEditDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedWebsite ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              Plan and track website development projects
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Name *</label>
              <input
                type="text"
                value={formData.projectName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Domain *</label>
              <input
                type="text"
                value={formData.domain || ""}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Development Stage</label>
              <select
                value={formData.developmentStage || "Concept"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    developmentStage: e.target.value as FutureWebsite["developmentStage"],
                  })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Concept">Concept</option>
                <option value="Planning">Planning</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Ready for Launch">Ready for Launch</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={formData.priority || "Medium"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as FutureWebsite["priority"],
                  })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Concept</label>
              <textarea
                value={formData.concept || ""}
                onChange={(e) =>
                  setFormData({ ...formData, concept: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project concept and goals"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes"
                rows={2}
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
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {websitesQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : websites.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No future projects yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {websites.map((website) => (
            <motion.div key={website._id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">
                          {website.projectName}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={stageColors[website.developmentStage]}>
                          {website.developmentStage}
                        </Badge>
                        <Badge className={priorityColors[website.priority]}>
                          {website.priority} Priority
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 font-mono">
                        {website.domain}
                      </p>

                      {website.concept && (
                        <p className="text-sm text-gray-600">
                          <strong>Concept:</strong> {website.concept}
                        </p>
                      )}

                      {website.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {website.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(website)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(website)}
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
