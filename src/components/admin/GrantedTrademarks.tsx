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
import { Badge } from "@/components/admin/ui/badge";
import { Plus, Edit2, Trash2, ShieldCheck } from "lucide-react";
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

export function GrantedTrademarks() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Trademark>>({
    name: "",
    type: "granted",
    registrationNumber: "",
    applicationNumber: "",
    registrationDate: "",
    status: "Registered",
    class: "",
    description: "",
    notes: "",
  });
  const [selectedTrademark, setSelectedTrademark] = useState<Trademark | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trademarksQuery = useQuery<Trademark[]>({
    queryKey: ["granted-trademarks"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Trademark[] }>("/api/trademarks/granted");
      return res.items || [];
    },
  });

  const trademarks = trademarksQuery.data || [];

  const resetForm = () => {
    setFormData({
      name: "",
      type: "granted",
      registrationNumber: "",
      applicationNumber: "",
      registrationDate: "",
      status: "Registered",
      class: "",
      description: "",
      notes: "",
    });
    setSelectedTrademark(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.registrationNumber) {
      setApiError("Trademark Name and Registration Number are required");
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
          <ShieldCheck className="h-5 w-5 text-green-500" />
          Granted Trademarks
        </h3>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="bg-gradient-to-r from-green-600 to-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Granted Trademark
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedTrademark ? "Edit Trademark" : "Add Granted Trademark"}
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
                <label className="text-sm font-medium">Reg Number *</label>
                <Input
                  value={formData.registrationNumber || ""}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g., 1234567"
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
                <label className="text-sm font-medium">Reg Date</label>
                <Input
                  type="date"
                  value={formData.registrationDate ? new Date(formData.registrationDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={formData.status || "Registered"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Registered">Registered</option>
                  <option value="Renewed">Renewed</option>
                  <option value="Expired">Expired</option>
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
              <TableHead className="font-bold">Reg #</TableHead>
              <TableHead className="font-bold">Class</TableHead>
              <TableHead className="font-bold">Reg Date</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trademarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No granted trademarks found.
                </TableCell>
              </TableRow>
            ) : (
              trademarks.map((tm) => (
                <TableRow key={tm._id}>
                  <TableCell className="font-medium">{tm.name}</TableCell>
                  <TableCell className="font-mono text-xs">{tm.registrationNumber}</TableCell>
                  <TableCell>{tm.class}</TableCell>
                  <TableCell>{tm.registrationDate ? new Date(tm.registrationDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 font-bold text-[10px] uppercase">
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
