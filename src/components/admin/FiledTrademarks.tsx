import { useState } from "react";
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
import { Plus, Edit2, Trash2, ShieldCheck, Globe } from "lucide-react";
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

interface Trademark {
  _id: string;
  name: string;
  type: "filed" | "granted";
  registrationNumber: string;
  applicationNumber: string;
  filingDate: string;
  registrationDate: string;
  status: string;
  class: string;
  description: string;
  notes: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Filed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Published: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Registered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Abandoned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function FiledTrademarks() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Trademark>>({
    name: "",
    type: "filed",
    applicationNumber: "",
    filingDate: "",
    status: "Filed",
    class: "",
    description: "",
    notes: "",
  });
  const [selectedTrademark, setSelectedTrademark] = useState<Trademark | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trademarksQuery = useQuery<Trademark[]>({
    queryKey: ["filed-trademarks"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Trademark[] }>("/api/trademarks/filed");
      return res.items || [];
    },
  });

  const trademarks = trademarksQuery.data || [];

  const resetForm = () => {
    setFormData({
      name: "",
      type: "filed",
      applicationNumber: "",
      filingDate: "",
      status: "Filed",
      class: "",
      description: "",
      notes: "",
    });
    setSelectedTrademark(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.applicationNumber) {
      setApiError("Trademark Name and Application Number are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      if (selectedTrademark) {
        await apiFetch(`/api/trademarks/${selectedTrademark._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/trademarks", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      await trademarksQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tm: Trademark) => {
    if (!confirm("Are you sure you want to delete this trademark?")) return;

    try {
      await apiFetch(`/api/trademarks/${tm._id}`, {
        method: "DELETE",
      });
      await trademarksQuery.refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (tm: Trademark) => {
    setSelectedTrademark(tm);
    setFormData(tm);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Filed Trademarks
        </h3>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filed Trademark
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedTrademark ? "Edit Trademark" : "Add Filed Trademark"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Trademark Name *</label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Apple"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">App Number *</label>
                <Input
                  value={formData.applicationNumber || ""}
                  onChange={(e) => setFormData({ ...formData, applicationNumber: e.target.value })}
                  placeholder="e.g., 90123456"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Class</label>
                <Input
                  value={formData.class || ""}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g., 009"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Filing Date</label>
                <Input
                  type="date"
                  value={formData.filingDate ? new Date(formData.filingDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={formData.status || "Filed"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Filed">Filed</option>
                  <option value="Published">Published</option>
                  <option value="Registered">Registered</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Goods and services..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">App #</TableHead>
              <TableHead className="font-bold">Class</TableHead>
              <TableHead className="font-bold">Filing Date</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trademarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No filed trademarks found.
                </TableCell>
              </TableRow>
            ) : (
              trademarks.map((tm) => (
                <TableRow key={tm._id}>
                  <TableCell className="font-medium">{tm.name}</TableCell>
                  <TableCell className="font-mono text-xs">{tm.applicationNumber}</TableCell>
                  <TableCell>{tm.class}</TableCell>
                  <TableCell>{tm.filingDate ? new Date(tm.filingDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[tm.status] || ""} border-0 font-bold text-[10px] uppercase`}>
                      {tm.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(tm)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tm)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    />
  );
}
