import { useState, useMemo } from "react";
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
import { Plus, Edit2, Trash2, ExternalLink, Lock } from "lucide-react";
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

interface Website {
  _id: string;
  siteName: string;
  url: string;
  platform: string;
  hostingProvider: string;
  status: "Live" | "Maintenance" | "Development" | "Offline";
  notes: string;
  createdAt: string;
}

const statusColors = {
  Live: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Development: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Offline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 },
  },
} as const;

export function ActiveWebsites() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Website>>({
    siteName: "",
    url: "",
    platform: "",
    hostingProvider: "",
    status: "Live",
    notes: "",
  });
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState<string | null>(null);

  const websitesQuery = useQuery<Website[]>({
    queryKey: ["active-websites"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Website[] }>("/api/websites/active");
      return res.items || [];
    },
  });

  const websites = useMemo(() => 
    (websitesQuery.data || []).slice().sort((a, b) => a.siteName.localeCompare(b.siteName)),
    [websitesQuery.data]
  );

  const resetForm = () => {
    setFormData({
      siteName: "",
      url: "",
      platform: "",
      hostingProvider: "",
      status: "Live",
      notes: "",
    });
    setSelectedWebsite(null);
  };

  const handleSave = async () => {
    if (!formData.siteName || !formData.url) {
      setApiError("Site Name and URL are required");
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
            websiteType: "active",
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

  const handleDelete = async (website: Website) => {
    if (!confirm("Are you sure you want to delete this website?")) return;

    try {
      await apiFetch(`/api/websites/${website._id}`, {
        method: "DELETE",
      });
      await websitesQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (website: Website) => {
    setSelectedWebsite(website);
    setFormData(website);
    setIsEditDialogOpen(true);
  };

  return (
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
                Add Website
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedWebsite ? "Edit Website" : "Add New Website"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <input
                    type="text"
                    value={formData.siteName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, siteName: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Company Main Site"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">URL</label>
                  <input
                    type="url"
                    value={formData.url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <input
                    type="text"
                    value={formData.platform || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., WordPress, React, etc."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Hosting Provider</label>
                  <input
                    type="text"
                    value={formData.hostingProvider || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, hostingProvider: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., AWS, DigitalOcean"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status || "Live"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Website["status"],
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Live">Live</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Development">Development</option>
                    <option value="Offline">Offline</option>
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

          {websitesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : websites.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No websites yet. Click "Add Website" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 font-bold">#</TableHead>
                    <TableHead className="font-bold">Site Name</TableHead>
                    <TableHead className="font-bold">URL</TableHead>
                    <TableHead className="font-bold">Platform</TableHead>
                    <TableHead className="font-bold">Hosting</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {websites.map((website, index) => (
                    <TableRow key={website._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{website.siteName}</TableCell>
                      <TableCell>
                        <a
                          href={website.url.startsWith("http") ? website.url : `https://${website.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {website.url.length > 30 ? website.url.slice(0, 30) + "..." : website.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">{website.platform}</TableCell>
                      <TableCell className="text-xs">{website.hostingProvider}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[website.status]} border-0 shadow-none font-bold text-[10px] uppercase`}>
                          {website.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleEdit(website)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-amber-600"
                            onClick={() => setShowCredentials(showCredentials === website._id ? null : website._id)}
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(website)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
    </div>
  );
}
