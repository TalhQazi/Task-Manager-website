import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Plus, Trash2, Edit2, FileText, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { useQuery } from "@tanstack/react-query";

interface MediaItem {
  type: "image" | "file";
  fileName: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

interface AdminInfo {
  _id: string;
  id?: string;
  title?: string;
  text: string;
  media: MediaItem[];
  createdAt: string;
  createdBy: string;
}

interface AdminInfoManagerProps {
  onClose?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
} as const;

export function AdminInfoManager({ onClose }: AdminInfoManagerProps) {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for new/edit
  const [formData, setFormData] = useState<Partial<AdminInfo>>({
    title: "",
    text: "",
    media: [],
  });

  const [selectedItemForEdit, setSelectedItemForEdit] = useState<AdminInfo | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<AdminInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all admin info
  const adminInfoQuery = useQuery<AdminInfo[]>({
    queryKey: ["admin-info"],
    queryFn: async () => {
      const res = await apiFetch<{ items: AdminInfo[] }>("/api/admin-info/admin/all");
      return (res.items || []).map(item => ({
        ...item,
        id: item._id || item.id,
      }));
    },
  });

  const adminInfoList = adminInfoQuery.data || [];

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      text: "",
      media: [],
    });
    setSelectedItemForEdit(null);
    setApiError(null);
  };

  // File upload handler for images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setApiError("File size exceeds 10MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        media: [
          ...(prev.media || []),
          {
            type: "image",
            fileName: file.name,
            dataUrl,
            mimeType: file.type,
            size: file.size,
          },
        ],
      }));
      setApiError(null);
    };
    reader.readAsDataURL(file);
  };

  // File upload handler for files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setApiError("File size exceeds 10MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        media: [
          ...(prev.media || []),
          {
            type: "file",
            fileName: file.name,
            dataUrl,
            mimeType: file.type,
            size: file.size,
          },
        ],
      }));
      setApiError(null);
    };
    reader.readAsDataURL(file);
  };

  // Remove media
  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index),
    }));
  };

  // Save (create or update)
  const handleSave = async () => {
    // Validation: at least text OR media
    const hasText = formData.text && typeof formData.text === "string" && formData.text.trim().length > 0;
    const hasMedia = formData.media && formData.media.length > 0;

    if (!hasText && !hasMedia) {
      setApiError("Please add at least text or media (image/file)");
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload = {
        title: formData.title && typeof formData.title === "string" ? formData.title.trim() : "",
        text: hasText ? formData.text.trim() : "",
        media: hasMedia ? formData.media : [],
      };

      if (selectedItemForEdit) {
        // Update
        await apiFetch(`/api/admin-info/${selectedItemForEdit.id || selectedItemForEdit._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccessMessage("Information updated successfully");
      } else {
        // Create
        await apiFetch("/api/admin-info", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccessMessage("Information created successfully");
      }

      await adminInfoQuery.refetch();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handler
  const handleEdit = (item: AdminInfo) => {
    setSelectedItemForEdit(item);
    setFormData({
      title: item.title || "",
      text: item.text,
      media: item.media,
    });
    setIsEditDialogOpen(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedItemForDelete) return;

    try {
      setApiError(null);
      await apiFetch(`/api/admin-info/${selectedItemForDelete.id || selectedItemForDelete._id}`, {
        method: "DELETE",
      });
      setSuccessMessage("Information deleted successfully");
      await adminInfoQuery.refetch();
      setSelectedItemForDelete(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Download file
  const downloadFile = (media: MediaItem) => {
    const link = document.createElement("a");
    link.href = media.dataUrl;
    link.download = media.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
          title="Admin Information Manager"
        >
          <FileText className="h-4 w-4 mr-2" />
          Admin Info
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-4xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Information
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Manage text, images, and files for your admin panel
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-lg bg-success/10 p-3 sm:p-4 border border-success/20"
            >
              <p className="text-xs sm:text-sm text-success">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-lg bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
            >
              <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {apiError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 sm:space-y-5">
          {/* Add Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Information
            </Button>
          </motion.div>

          {/* List of Admin Info */}
          {adminInfoQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : adminInfoList.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No information yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="space-y-3 sm:space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {adminInfoList.map((item) => (
                <motion.div key={item.id || item._id} variants={itemVariants}>
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Show title if available */}
                          {item.title && (
                            <h3 className="font-semibold text-sm sm:text-base">{item.title}</h3>
                          )}
                          {/* Show text preview if available */}
                          {item.text && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.text}</p>
                          )}
                          {/* Show media count */}
                          {item.media && item.media.length > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {item.media.length} {item.media.length === 1 ? "file" : "files"}
                              </Badge>
                            </div>
                          )}
                          {/* Created info */}
                          <p className="text-xs text-muted-foreground">
                            By {item.createdBy} • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedItemForDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Media Preview */}
                    {item.media && item.media.length > 0 && (
                      <CardContent className="pt-4 pb-3">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Attached Media</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {item.media.map((media, idx) => (
                              <div key={idx} className="relative group">
                                {media.type === "image" ? (
                                  <img
                                    src={media.dataUrl}
                                    alt={media.fileName}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-muted rounded-lg border flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => downloadFile(media)}
                                  >
                                    <div className="text-center">
                                      <FileText className="h-6 w-6 mx-auto text-primary mb-1" />
                                      <p className="text-xs truncate px-1 text-muted-foreground max-w-full">{media.fileName}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                  <span className="text-xs text-white text-center px-1">{formatFileSize(media.size)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {selectedItemForEdit ? "Edit Information" : "Create New Information"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Add or edit text, images, and/or files. At least one is required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Title (Optional)</label>
              <input
                type="text"
                placeholder="Add a title for this information"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all h-9 sm:h-10"
              />
            </div>

            {/* Text */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Text (Optional)</label>
              <textarea
                placeholder="Enter your text here..."
                value={formData.text || ""}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={5}
                className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can add text, image, file, or any combination
              </p>
            </div>

            {/* Media Upload */}
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Upload Media (Optional)</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <label className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="text-xs sm:text-sm flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="text-xs sm:text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Upload File
                    </span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Media List */}
              {(formData.media || []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Attached Media ({formData.media.length})</p>
                  <div className="space-y-2">
                    {formData.media.map((media, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border text-xs sm:text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {media.type === "image" ? (
                            <ImageIcon className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{media.fileName}</p>
                            <p className="text-muted-foreground text-xs">{formatFileSize(media.size)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMedia(idx)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 p-3 sm:p-4 border border-destructive/20"
              >
                <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {apiError}
                </p>
              </motion.div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/80 text-white order-1 sm:order-2"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!selectedItemForDelete} onOpenChange={(open) => !open && setSelectedItemForDelete(null)}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg text-destructive">Delete Information</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 p-3 sm:p-4 text-xs sm:text-sm mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-muted-foreground">Are you sure you want to delete this information?</p>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => setSelectedItemForDelete(null)}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="order-1 sm:order-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
