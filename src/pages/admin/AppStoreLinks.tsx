import { useMemo, useState } from "react";
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
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Textarea } from "@/components/admin/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface AppStoreLink {
  _id: string;
  appName: string;
  brand: string;
  googlePlayUrl: string;
  appleStoreUrl: string;
  status: "Active" | "Inactive" | "Coming Soon";
  notes: string;
  createdAt: string;
}

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  "Coming Soon": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const emptyForm: Partial<AppStoreLink> = {
  appName: "",
  brand: "",
  googlePlayUrl: "",
  appleStoreUrl: "",
  status: "Active",
  notes: "",
};

export default function AppStoreLinks() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AppStoreLink>>(emptyForm);
  const [selected, setSelected] = useState<AppStoreLink | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const linksQuery = useQuery<AppStoreLink[]>({
    queryKey: ["app-store-links"],
    queryFn: async () => {
      const res = await apiFetch<{ items: AppStoreLink[] }>("/api/app-store-links");
      return res.items || [];
    },
  });

  const links = useMemo(() => {
    let list = (linksQuery.data || []).slice();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.appName.toLowerCase().includes(q) ||
          (a.brand || "").toLowerCase().includes(q) ||
          (a.notes || "").toLowerCase().includes(q) ||
          (a.googlePlayUrl || "").toLowerCase().includes(q) ||
          (a.appleStoreUrl || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.appName.localeCompare(b.appName));
  }, [linksQuery.data, searchQuery]);

  const resetForm = () => {
    setFormData(emptyForm);
    setSelected(null);
    setApiError(null);
  };

  const handleCopy = async (url: string, key: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success("Link copied");
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSave = async () => {
    if (!formData.appName?.trim()) {
      setApiError("App name is required");
      return;
    }
    if (!formData.googlePlayUrl?.trim() && !formData.appleStoreUrl?.trim()) {
      setApiError("Add at least one Google Play or Apple Store link");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      if (selected) {
        await apiFetch(`/api/app-store-links/${selected._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/app-store-links", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      await linksQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success(selected ? "Link updated" : "Link added");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: AppStoreLink) => {
    if (!confirm(`Delete store links for "${item.appName}"?`)) return;
    try {
      await apiFetch(`/api/app-store-links/${item._id}`, { method: "DELETE" });
      await linksQuery.refetch();
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleEdit = (item: AppStoreLink) => {
    setSelected(item);
    setFormData({
      appName: item.appName,
      brand: item.brand || "",
      googlePlayUrl: item.googlePlayUrl || "",
      appleStoreUrl: item.appleStoreUrl || "",
      status: item.status || "Active",
      notes: item.notes || "",
    });
    setApiError(null);
    setIsEditDialogOpen(true);
  };

  const LinkCell = ({
    url,
    copyKey,
    label,
  }: {
    url: string;
    copyKey: string;
    label: string;
  }) => {
    if (!url) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    const isCopied = copiedKey === copyKey;
    return (
      <div className="flex items-center gap-1.5 max-w-[280px]">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
          title={url}
        >
          {url}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => handleCopy(url, copyKey)}
          title={`Copy ${label} link`}
        >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer" title={`Open ${label}`}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Smartphone className="h-7 w-7 text-muted-foreground" />
            App Store Links
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Store Google Play and Apple App Store links for quick copy and paste
          </p>
        </div>
      </div>

      {apiError && !isEditDialogOpen && (
        <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Store Links
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected ? "Edit Store Links" : "Add Store Links"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {apiError && (
                <div className="rounded-lg bg-red-100 p-3 border border-red-300 dark:bg-red-900/30 dark:border-red-700">
                  <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="appName">App Name *</Label>
                <Input
                  id="appName"
                  value={formData.appName || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, appName: e.target.value }))}
                  placeholder="e.g. Task Manager Mobile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand / Product</Label>
                <Input
                  id="brand"
                  value={formData.brand || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="Optional brand name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googlePlayUrl">Google Play Store URL</Label>
                <Input
                  id="googlePlayUrl"
                  value={formData.googlePlayUrl || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, googlePlayUrl: e.target.value }))}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appleStoreUrl">Apple App Store URL</Label>
                <Input
                  id="appleStoreUrl"
                  value={formData.appleStoreUrl || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, appleStoreUrl: e.target.value }))}
                  placeholder="https://apps.apple.com/app/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status || "Active"}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      status: e.target.value as AppStoreLink["status"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Coming Soon">Coming Soon</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : selected ? "Save Changes" : "Add Links"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search apps, brands, or URLs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {linksQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No app store links yet. Add Google Play and Apple Store URLs to copy when you need them.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Google Play</TableHead>
                    <TableHead>Apple Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="font-medium">{item.appName}</div>
                        {item.brand ? (
                          <div className="text-xs text-muted-foreground">{item.brand}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <LinkCell
                          url={item.googlePlayUrl}
                          copyKey={`${item._id}-google`}
                          label="Google Play"
                        />
                      </TableCell>
                      <TableCell>
                        <LinkCell
                          url={item.appleStoreUrl}
                          copyKey={`${item._id}-apple`}
                          label="Apple Store"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status] || statusColors.Active} variant="secondary">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item)}
                            title="Delete"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
