import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import { toast } from "@/components/admin/ui/use-toast";
import {
  Archive,
  RotateCcw,
  Trash2,
  MessageSquare,
  Paperclip,
  FileText,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { Input } from "@/components/admin/ui/input";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";

type ArchivedItem = {
  id: string;
  itemType: string;
  itemData: Record<string, any>;
  parentType: string;
  parentId: string;
  parentName: string;
  archivedByUsername: string;
  archivedByRole: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const itemTypeIcons: Record<string, any> = {
  comment: MessageSquare,
  attachment: Paperclip,
  task: FileText,
  user: User,
};

const itemTypeColors: Record<string, string> = {
  comment: "bg-blue-100 text-blue-700 border-blue-200",
  attachment: "bg-purple-100 text-purple-700 border-purple-200",
  task: "bg-amber-100 text-amber-700 border-amber-200",
  user: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ArchiveData() {
  const [items, setItems] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  const auth = getAuthState();
  const isAdminRole = auth.role === "admin" || auth.role === "super-admin" || auth.role === "manager";

  const fetchArchive = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (typeFilter !== "all") params.set("itemType", typeFilter);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await apiFetch<{ items: ArchivedItem[]; totalPages: number; total: number; page: number; limit: number }>(
          `/api/archive?${params.toString()}`,
          { signal: controller.signal }
        );
        setItems(res.items || []);
        if (res.total !== undefined) {
          setPagination({
            page: res.page || 1,
            limit: res.limit || 20,
            total: res.total || 0,
            totalPages: res.totalPages || 1
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("Request timed out. The server is taking too long — try again.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load archive");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    void fetchArchive(1);
  }, [typeFilter]);

  const handleRestore = async (id: string) => {
    try {
      setRestoring(id);
      await apiFetch(`/api/archive/${id}/restore`, { method: "POST" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Restored", description: "Item has been restored successfully." });
    } catch (e) {
      toast({
        title: "Restore failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/archive/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteId(null);
      toast({ title: "Deleted", description: "Item permanently deleted." });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const filtered = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const data = item.itemData;
    return (
      (data.message || "").toLowerCase().includes(q) ||
      (data.fileName || "").toLowerCase().includes(q) ||
      (data.name || "").toLowerCase().includes(q) ||
      (data.email || "").toLowerCase().includes(q) ||
      (data.username || "").toLowerCase().includes(q) ||
      (item.parentName || "").toLowerCase().includes(q) ||
      (data.authorUsername || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString();
  };

  return (
    <>
      <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            Archive Data
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            View and manage archived comments, attachments, and other items. Items can be restored or permanently deleted.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-destructive break-words">{error}</p>
          </div>
        )}

        {/* Filters */}
        <Card className="shadow-soft border-0 sm:border">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="attachment">Attachments</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchArchive()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Archived", count: pagination.total, color: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200" },
            { label: "Comments", count: items.filter((i) => i.itemType === "comment").length, color: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200" },
            { label: "Attachments", count: items.filter((i) => i.itemType === "attachment").length, color: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200" },
            { label: "Tasks", count: items.filter((i) => i.itemType === "task").length, color: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200" },
            { label: "Users", count: items.filter((i) => i.itemType === "user").length, color: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200" },
          ].map((stat) => (
            <Card key={stat.label} className={`shadow-sm border ${stat.color}`}>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold">{stat.count}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Items List */}
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading archived items...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No archived items found</p>
              <p className="text-xs mt-1">Archived comments and attachments will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const Icon = itemTypeIcons[item.itemType] || FileText;
                const colorClass = itemTypeColors[item.itemType] || "bg-gray-100 text-gray-700";
                const letterIndex = String.fromCharCode(65 + (idx % 26));
                const displayNumber = (pagination.page - 1) * pagination.limit + idx + 1;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="shadow-sm hover:shadow-md transition-shadow border-0 sm:border">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`relative rounded-full p-2.5 flex-shrink-0 ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                            <span className="absolute -top-1 -right-1 bg-white border border-current text-[9px] font-bold h-fit min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                              {displayNumber}.
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                                {item.itemType}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                from <span className="font-medium">{item.parentName || "Unknown"}</span>
                              </span>
                            </div>

                            {/* Item-specific content */}
                            {item.itemType === "comment" && (
                              <p className="text-sm break-words line-clamp-3">
                                {item.itemData.message || "—"}
                              </p>
                            )}
                            {item.itemType === "attachment" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium truncate">
                                    {item.itemData.fileName || "Unknown file"}
                                  </span>
                                  {item.itemData.size > 0 && (
                                    <span className="text-[11px] text-muted-foreground">
                                      ({(item.itemData.size / 1024).toFixed(1)} KB)
                                    </span>
                                  )}
                                </div>
                                {item.itemData.mimeType?.startsWith("image/") && item.itemData.url && (
                                  <div className="w-32 h-20 rounded-md overflow-hidden border bg-muted/20">
                                    <img 
                                      src={toProxiedUrl(item.itemData.url) || item.itemData.url} 
                                      alt="preview" 
                                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={() => { setPreviewUrl(toProxiedUrl(item.itemData.url) || item.itemData.url); setPreviewName(item.itemData.fileName); }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === "task" && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium break-words">
                                  {item.itemData.title || "—"}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                                  {item.itemData.status && (
                                    <span className="px-1.5 py-0.5 rounded bg-muted capitalize">{item.itemData.status}</span>
                                  )}
                                  {item.itemData.priority && (
                                    <span className="px-1.5 py-0.5 rounded bg-muted capitalize">{item.itemData.priority}</span>
                                  )}
                                  {item.itemData.assignees?.length > 0 && (
                                    <span>Assigned: {item.itemData.assignees.join(", ")}</span>
                                  )}
                                </div>
                                {item.itemData.attachment?.url && item.itemData.attachment?.mimeType?.startsWith("image/") && (
                                  <div className="w-32 h-20 rounded-md overflow-hidden border bg-muted/20 mt-1">
                                    <img 
                                      src={toProxiedUrl(item.itemData.attachment.url) || item.itemData.attachment.url} 
                                      alt="task preview" 
                                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={() => { setPreviewUrl(toProxiedUrl(item.itemData.attachment.url) || item.itemData.attachment.url); setPreviewName(item.itemData.title); }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {item.itemType === "user" && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium break-words">
                                  {item.itemData.name || "—"}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                                  <span>{item.itemData.email}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted capitalize">{item.itemData.role}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted">username: {item.itemData.username}</span>
                                </div>
                              </div>
                            )}

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                              {item.itemData.authorUsername && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {item.itemData.authorUsername}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {formatDate(item.createdAt)}
                              </span>
                              <span>by {item.archivedByUsername || "system"}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => void handleRestore(item.id)}
                              disabled={restoring === item.id}
                            >
                              {restoring === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden sm:inline">Restore</span>
                            </Button>
                            {isAdminRole && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1 text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && void handleDelete(deleteId)}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setPreviewUrl(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <img
                src={previewUrl}
                alt={previewName}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <p className="mt-4 text-white font-medium text-lg drop-shadow-md">{previewName}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
