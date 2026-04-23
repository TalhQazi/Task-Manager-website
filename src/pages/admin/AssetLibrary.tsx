import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Download,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  History,
  Archive,
  Share2,
} from "lucide-react";

type FolderNode = {
  id: string;
  name: string;
  parentFolderId?: string | null;
  isArchived?: boolean;
  isReadOnly?: boolean;
  sortOrder?: number;
  assetCount?: number;
  children?: FolderNode[];
};

type Asset = {
  id: string;
  folderId?: string | null;
  title?: string;
  description?: string;
  tags?: string[];
  originalFilename?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  checksumSha256?: string;
  currentVersionNumber?: number;
  urlThumbnail?: string;
  urlPreview?: string;
  createdAt?: string;
  updatedAt?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
};

type AssetVersion = {
  id: string;
  assetId: string;
  versionNumber: number;
  originalFilename?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  urlOriginal?: string;
  changeNote?: string;
  uploadedBy?: string;
  createdAt?: string;
};

type BrandKit = {
  id: string;
  name: string;
  description?: string;
  logoAssetId?: string;
  colors?: string[];
  fonts?: { name: string; usage: string }[];
  guidelines?: string;
  assetIds?: string[];
  folderId?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function flattenFolders(tree: FolderNode[], out: FolderNode[] = []): FolderNode[] {
  for (const n of tree) {
    out.push(n);
    if (n.children?.length) flattenFolders(n.children, out);
  }
  return out;
}

function isDescendant(potentialDescendantId: string, ancestorId: string | null, allFolders: FolderNode[]): boolean {
  if (!ancestorId) return false;
  const folder = allFolders.find((f) => f.id === potentialDescendantId);
  if (!folder) return false;
  let current = folder.parentFolderId;
  while (current) {
    if (current === ancestorId) return true;
    const parent = allFolders.find((f) => f.id === current);
    if (!parent) break;
    current = parent.parentFolderId;
  }
  return false;
}

function formatBytes(bytes: number | undefined) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const v = b / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AssetLibrary() {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"assets" | "brand-kits">("assets");
  const [typeFilter, setTypeFilter] = useState<"" | "image" | "pdf">("");
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "za" | "size-asc" | "size-desc">("newest");
  const [page, setPage] = useState(1);
  const limit = 25;

  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [editFolderName, setEditFolderName] = useState("");

  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [moveFolderTargetId, setMoveFolderTargetId] = useState<string | "">("");

  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [preview, setPreview] = useState<Asset | null>(null);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [editAssetTitle, setEditAssetTitle] = useState("");
  const [editAssetDescription, setEditAssetDescription] = useState("");
  const [editAssetTags, setEditAssetTags] = useState("");
  const [editAssetFolderId, setEditAssetFolderId] = useState<string | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isReplaceVersionOpen, setIsReplaceVersionOpen] = useState(false);
  const [replaceFileInputRef, setReplaceFileInputRef] = useState<HTMLInputElement | null>(null);
  const [replaceChangeNote, setReplaceChangeNote] = useState("");

  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isBulkTagOpen, setIsBulkTagOpen] = useState(false);
  const [bulkTags, setBulkTags] = useState("");

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareExpiresIn, setShareExpiresIn] = useState(24);
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpiresAt, setShareExpiresAt] = useState("");

  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [brandKitName, setBrandKitName] = useState("");
  const [brandKitDescription, setBrandKitDescription] = useState("");
  const [brandKitColors, setBrandKitColors] = useState("");
  const [brandKitGuidelines, setBrandKitGuidelines] = useState("");
  const [editingBrandKitId, setEditingBrandKitId] = useState<string | null>(null);

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const foldersQuery = useQuery({
    queryKey: ["asset-library", "folders"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FolderNode[] }>("/api/asset-library/folders");
      return res.items || [];
    },
  });

  const globalStatsQuery = useQuery({
    queryKey: ["asset-library", "stats"],
    queryFn: async () => {
      const data = await apiFetch<{ totalAssets: number }>("/api/asset-library/stats");
      return data;
    },
  });

  const patchFolderMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string }) => {
      return apiFetch<{ item: FolderNode }>(`/api/asset-library/folders/${encodeURIComponent(payload.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: payload.name }),
      });
    },
    onSuccess: async () => {
      setIsEditFolderOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["asset-library", "folders"] });
    },
  });

  const archiveFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      return apiFetch<{ ok: true }>(`/api/asset-library/folders/${encodeURIComponent(folderId)}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      setSelectedFolderId(null);
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: async (payload: { id: string; parentFolderId: string | null }) => {
      return apiFetch<{ item: FolderNode }>(`/api/asset-library/folders/${encodeURIComponent(payload.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ parentFolderId: payload.parentFolderId }),
      });
    },
    onSuccess: async () => {
      setIsMoveFolderOpen(false);
      setMoveFolderTargetId("");
      await queryClient.invalidateQueries({ queryKey: ["asset-library", "folders"] });
    },
  });

  const bulkTagMutation = useMutation({
    mutationFn: async (payload: { assetIds: string[]; tags: string[] }) => {
      return apiFetch<{ updatedCount: number }>("/api/asset-library/assets/bulk", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setIsBulkTagOpen(false);
      setBulkTags("");
      setSelectedAssetIds(new Set());
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (payload: { assetId?: string; folderId?: string; expiresInHours: number }) => {
      return apiFetch<{ shareUrl: string; expiresAt: string; shareId: string }>("/api/asset-library/shares", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async (data) => {
      setShareUrl(data.shareUrl);
      setShareExpiresAt(data.expiresAt);
    },
  });

  const brandKitsQuery = useQuery({
    queryKey: ["asset-library", "brand-kits"],
    queryFn: async () => {
      const res = await apiFetch<{ items: BrandKit[] }>("/api/asset-library/brand-kits");
      return res.items || [];
    },
  });

  const createBrandKitMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; colors: string[]; guidelines: string }) => {
      return apiFetch<{ item: BrandKit }>("/api/asset-library/brand-kits", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setIsBrandKitOpen(false);
      setBrandKitName("");
      setBrandKitDescription("");
      setBrandKitColors("");
      setBrandKitGuidelines("");
      setEditingBrandKitId(null);
      await queryClient.invalidateQueries({ queryKey: ["asset-library", "brand-kits"] });
    },
  });

  const deleteBrandKitMutation = useMutation({
    mutationFn: async (kitId: string) => {
      return apiFetch<{ ok: true }>(`/api/asset-library/brand-kits/${encodeURIComponent(kitId)}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asset-library", "brand-kits"] });
    },
  });

  const assetsQuery = useQuery({
    queryKey: ["asset-library", "assets", selectedFolderId, search, typeFilter, sort, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolderId) params.set("folderId", selectedFolderId);
      if (search.trim()) params.set("q", search.trim());
      if (typeFilter) params.set("type", typeFilter);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const qs = params.toString() ? `?${params.toString()}` : "";
      return apiFetch<Paginated<Asset>>(`/api/asset-library/assets${qs}`);
    },
    enabled: !foldersQuery.isLoading,
  });

  const allFolders = useMemo(() => flattenFolders(foldersQuery.data ?? []), [foldersQuery.data]);
  const selectedFolder = useMemo(
    () => (selectedFolderId ? allFolders.find((f) => f.id === selectedFolderId) ?? null : null),
    [allFolders, selectedFolderId]
  );

  const isSelectedFolderReadOnly = Boolean(selectedFolder?.isReadOnly);

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newFolderName.trim(),
        parentFolderId: selectedFolderId,
      };
      return apiFetch<{ item: FolderNode }>("/api/asset-library/folders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      await queryClient.invalidateQueries({ queryKey: ["asset-library", "folders"] });
    },
  });

  const uploadAssetsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadError(null);

      const supported = files.filter(
        (f) => f.type?.startsWith("image/") || f.type === "application/pdf"
      );
      const rejected = files.filter(
        (f) => !(f.type?.startsWith("image/") || f.type === "application/pdf")
      );

      if (rejected.length) {
        const first = rejected[0];
        throw new Error(`Unsupported file type: ${first.type || first.name}`);
      }

      const fd = new FormData();
      console.log("Uploading with folderId:", selectedFolderId);
      if (selectedFolderId) fd.append("folderId", selectedFolderId);
      supported.forEach((f) => fd.append("files", f));
      return apiFetch<{ items: Asset[] }>("/api/asset-library/assets/upload", {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
    onError: (err: any) => {
      setUploadError(err?.message || "Upload failed");
    },
  });

  const patchAssetMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      description: string;
      tags: string[];
      folderId: string | null;
    }) => {
      return apiFetch<{ item: Asset }>(`/api/asset-library/assets/${encodeURIComponent(payload.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          folderId: payload.folderId,
        }),
      });
    },
    onSuccess: async (data) => {
      setIsEditAssetOpen(false);
      if (data?.item) setPreview(data.item);
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      return apiFetch<{ ok: true }>(`/api/asset-library/assets/${encodeURIComponent(assetId)}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      setPreview(null);
      setIsEditAssetOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
  });

  const versionsQuery = useQuery({
    queryKey: ["asset-library", "asset-versions", preview?.id],
    queryFn: async () => {
      if (!preview?.id) return [];
      const res = await apiFetch<{ items: AssetVersion[] }>(`/api/asset-library/assets/${encodeURIComponent(preview.id)}/versions`);
      return res.items || [];
    },
    enabled: isVersionHistoryOpen && !!preview?.id,
  });

  const replaceVersionMutation = useMutation({
    mutationFn: async (payload: { file: File; changeNote: string }) => {
      const fd = new FormData();
      fd.append("file", payload.file);
      if (payload.changeNote.trim()) fd.append("changeNote", payload.changeNote.trim());
      return apiFetch<{ item: Asset }>(`/api/asset-library/assets/${encodeURIComponent(preview!.id)}/replace`, {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: async (data) => {
      setIsReplaceVersionOpen(false);
      setReplaceChangeNote("");
      if (data?.item) setPreview(data.item);
      await queryClient.invalidateQueries({ queryKey: ["asset-library"] });
    },
  });

  const downloadAsset = async (asset: Asset) => {
    const res = await apiFetch<{ url: string; fileName: string }>(
      `/api/asset-library/assets/${encodeURIComponent(asset.id)}/download`,
      { method: "POST" }
    );

    const safeUrl = toProxiedUrl(res.url) || res.url;
    const r = await fetch(safeUrl);
    if (!r.ok) throw new Error(`Download failed (${r.status})`);
    const blob = await r.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = res.fileName || asset.attachment?.fileName || "asset";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const renderFolderNode = (node: FolderNode, depth = 0) => {
    const isActive = selectedFolderId === node.id;
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedFolderIds[node.id] ?? true;
    const isDragging = draggedFolderId === node.id;
    const isDropTarget = dropTargetId === node.id;
    return (
      <div key={node.id}>
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            setDraggedFolderId(node.id);
          }}
          onDragEnd={() => {
            setDraggedFolderId(null);
            setDropTargetId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedFolderId && draggedFolderId !== node.id && !isDescendant(node.id, draggedFolderId, allFolders)) {
              setDropTargetId(node.id);
            }
          }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedFolderId && draggedFolderId !== node.id && !isDescendant(node.id, draggedFolderId, allFolders)) {
              moveFolderMutation.mutate({
                id: draggedFolderId,
                parentFolderId: node.id,
              });
            }
            setDraggedFolderId(null);
            setDropTargetId(null);
          }}
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            isActive && "bg-muted",
            isDragging && "opacity-50",
            isDropTarget && "ring-2 ring-ring ring-offset-2"
          )}
          onClick={() => setSelectedFolderId(node.id)}
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          {hasChildren ? (
            <span
              className="w-4 h-4 inline-flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpandedFolderIds((prev) => ({ ...prev, [node.id]: !(prev[node.id] ?? true) }));
              }}
            >
              <ChevronRight className={cn("h-4 w-4 opacity-70 transition-transform", isExpanded && "rotate-90")} />
            </span>
          ) : (
            <span className="w-4" />
          )}
          {isActive ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          <span className="truncate">{node.name}</span>
          <Badge variant="secondary" className="ml-auto">{Number(node.assetCount || 0)}</Badge>
        </button>
        {hasChildren && isExpanded ? node.children!.map((c) => renderFolderNode(c, depth + 1)) : null}
      </div>
    );
  };

  const assets = assetsQuery.data?.items ?? [];
  const totalPages = assetsQuery.data?.totalPages ?? 1;
  const total = assetsQuery.data?.total ?? assets.length;

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Upload, organize, preview, and download brand assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md bg-background">
            <button
              type="button"
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-l-md",
                activeTab === "assets" ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("assets")}
            >
              Assets
            </button>
            <button
              type="button"
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-r-md",
                activeTab === "brand-kits" ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("brand-kits")}
            >
              Brand Kits
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            aria-label="Upload assets"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) uploadAssetsMutation.mutate(files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Folder
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAssetsMutation.isPending || isSelectedFolderReadOnly}
          >
            {uploadAssetsMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {isSelectedFolderReadOnly ? (
        <div className="text-xs text-muted-foreground">
          Selected folder is <span className="font-medium text-foreground">read-only</span>. Upload and move actions are disabled.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card className="h-[calc(100vh-260px)] min-h-[420px] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Folders</CardTitle>
              {selectedFolder ? (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setEditFolderName(selectedFolder.name || "");
                      setIsEditFolderOpen(true);
                    }}
                    disabled={patchFolderMutation.isPending || archiveFolderMutation.isPending || moveFolderMutation.isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setMoveFolderTargetId(selectedFolder.parentFolderId || "");
                      setIsMoveFolderOpen(true);
                    }}
                    disabled={patchFolderMutation.isPending || archiveFolderMutation.isPending || moveFolderMutation.isPending}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Move
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => archiveFolderMutation.mutate(selectedFolder.id)}
                    disabled={archiveFolderMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Archive
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="pt-0 h-full overflow-y-auto">
            <div className="space-y-1">
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  !selectedFolderId && "bg-muted"
                )}
                onClick={() => setSelectedFolderId(null)}
              >
                <Folder className="h-4 w-4" />
                <span className="truncate">All Assets</span>
                <Badge variant="secondary" className="ml-auto">
                  {globalStatsQuery.isLoading ? "..." : globalStatsQuery.data?.totalAssets ?? 0}
                </Badge>
              </button>
              {(foldersQuery.data ?? []).map((n) => renderFolderNode(n, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-260px)] min-h-[420px] overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assets.length > 0 && assets.every((a) => selectedAssetIds.has(a.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAssetIds(new Set(assets.map((a) => a.id)));
                    } else {
                      setSelectedAssetIds(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-input"
                />
                <CardTitle className="text-base">Assets</CardTitle>
              </div>
              <div className="flex items-center justify-end gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    const payload: { folderId?: string; assetIds?: string[] } = {};
                    if (selectedFolderId) payload.folderId = selectedFolderId;
                    const res = await apiFetch("/api/asset-library/assets/bulk-download", {
                      method: "POST",
                      body: JSON.stringify(payload),
                      headers: { "Content-Type": "application/json" },
                    });
                    const blob = await (res as Response).blob();
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = objectUrl;
                    a.download = `asset-library-${Date.now()}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(objectUrl);
                  }}
                  disabled={assetsQuery.isLoading || assets.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
                {selectedAssetIds.size > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsBulkTagOpen(true)}
                  >
                    Tag ({selectedAssetIds.size})
                  </Button>
                ) : null}
                <select
                  className={cn(
                    "h-10 rounded-md border border-input bg-background px-3 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  value={typeFilter}
                  onChange={(e) => {
                    setPage(1);
                    setTypeFilter(e.target.value as any);
                  }}
                >
                  <option value="">All types</option>
                  <option value="image">Images</option>
                  <option value="pdf">PDF</option>
                </select>

                <select
                  className={cn(
                    "h-10 rounded-md border border-input bg-background px-3 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value as any);
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="az">A–Z</option>
                  <option value="za">Z–A</option>
                  <option value="size-asc">File size (small → large)</option>
                  <option value="size-desc">File size (large → small)</option>
                </select>

                <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search by name..."
                  className="pl-10"
                />
              </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 overflow-y-auto">
            {uploadError ? (
              <div className="p-3 mb-2 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                {uploadError}
              </div>
            ) : null}

            <div
              className={cn("relative h-full", isDraggingFiles && "ring-2 ring-primary ring-offset-2")}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isSelectedFolderReadOnly) return;
                setIsDraggingFiles(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isSelectedFolderReadOnly) return;
                setIsDraggingFiles(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFiles(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFiles(false);
                if (isSelectedFolderReadOnly) return;
                const files = Array.from(e.dataTransfer.files || []);
                if (files.length) uploadAssetsMutation.mutate(files);
              }}
            >
              {isDraggingFiles && !isSelectedFolderReadOnly ? (
                <div className="absolute inset-0 z-10 bg-background/80 flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Drop files to upload</div>
                </div>
              ) : null}

              {assetsQuery.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading assets...</div>
              ) : assets.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No assets found</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 p-1">
                  {assets.map((a) => {
                    const url = a.urlThumbnail || a.attachment?.url || "";
                    const mime = a.attachment?.mimeType || a.mimeType || "";
                    const isImage = mime.startsWith("image/");
                    const thumb = toProxiedUrl(url) || url;
                    const updatedLabel = a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "";
                    const dimensions = a.width && a.height ? `${a.width}×${a.height}` : "";
                    const isSelected = selectedAssetIds.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "group rounded-lg border bg-card hover:bg-muted/40 transition-colors overflow-hidden text-left",
                          isSelected && "ring-2 ring-ring"
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={() => setPreview(a)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setPreview(a);
                        }}
                      >
                        <div className="absolute z-10 left-2 top-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(selectedAssetIds);
                              if (e.target.checked) {
                                newSet.add(a.id);
                              } else {
                                newSet.delete(a.id);
                              }
                              setSelectedAssetIds(newSet);
                            }}
                            className="h-4 w-4 rounded border-input bg-background/90"
                          />
                        </div>
                        <div className="absolute z-10 right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-background/90"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = a.attachment?.url || "";
                              const link = toProxiedUrl(url) || url;
                              if (link) await navigator.clipboard.writeText(link);
                            }}
                            title="Copy link"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-background/90"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              downloadAsset(a);
                            }}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteAssetMutation.mutate(a.id);
                            }}
                            disabled={deleteAssetMutation.isPending}
                            aria-label="Delete asset"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                          {isImage && thumb ? (
                            <img src={thumb} alt={a.originalFilename || "asset"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              {mime === "application/pdf" ? (
                                <FileText className="h-8 w-8" />
                              ) : (
                                <ImageIcon className="h-8 w-8" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">
                            {a.title?.trim() || a.originalFilename || a.attachment?.fileName || "Asset"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {formatBytes(a.sizeBytes || a.attachment?.size)}
                            {dimensions ? ` · ${dimensions}` : ""}
                            {updatedLabel ? ` · ${updatedLabel}` : ""}
                          </p>
                          {a.tags?.length ? (
                            <p className="text-[11px] text-muted-foreground truncate">{a.tags.join(", ")}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>

          <div className="border-t bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground font-medium">
                Showing <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground">{total}</span> assets
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || assetsQuery.isLoading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) pageNum = page - 3 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    if (pageNum <= 0 || pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || assetsQuery.isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {activeTab === "brand-kits" ? (
        <Card className="min-h-[420px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Brand Kits</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setBrandKitName("");
                  setBrandKitDescription("");
                  setBrandKitColors("");
                  setBrandKitGuidelines("");
                  setEditingBrandKitId(null);
                  setIsBrandKitOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create Brand Kit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {brandKitsQuery.isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading brand kits...</div>
            ) : brandKitsQuery.data?.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No brand kits found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandKitsQuery.data?.map((kit) => (
                  <div key={kit.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{kit.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteBrandKitMutation.mutate(kit.id)}
                          disabled={deleteBrandKitMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {kit.description ? <p className="text-xs text-muted-foreground line-clamp-2">{kit.description}</p> : null}
                    {kit.colors?.length ? (
                      <div className="flex items-center gap-1">
                        {kit.colors.slice(0, 5).map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} title={color} />
                        ))}
                        {kit.colors.length > 5 ? <span className="text-xs text-muted-foreground">+{kit.colors.length - 5}</span> : null}
                      </div>
                    ) : null}
                    {kit.assetIds?.length ? (
                      <div className="text-xs text-muted-foreground">{kit.assetIds.length} assets</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Folder name</label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground">
              Parent: {selectedFolderId ? (allFolders.find((f) => f.id === selectedFolderId)?.name || "Selected") : "Root"}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createFolderMutation.mutate()}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Folder name</label>
              <Input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditFolderOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!selectedFolderId) return;
                  patchFolderMutation.mutate({ id: selectedFolderId, name: editFolderName.trim() });
                }}
                disabled={!selectedFolderId || !editFolderName.trim() || patchFolderMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveFolderOpen} onOpenChange={setIsMoveFolderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Move Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              Moving: <span className="font-medium">{selectedFolder?.name}</span>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">New parent folder</label>
              <select
                className={cn(
                  "w-full h-10 rounded-md border border-input bg-background px-3 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                value={moveFolderTargetId}
                onChange={(e) => setMoveFolderTargetId(e.target.value)}
              >
                <option value="">Root</option>
                {allFolders
                  .filter((f) => f.id !== selectedFolderId && !isDescendant(f.id, selectedFolderId, allFolders))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsMoveFolderOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!selectedFolderId) return;
                  moveFolderMutation.mutate({
                    id: selectedFolderId,
                    parentFolderId: moveFolderTargetId ? moveFolderTargetId : null,
                  });
                }}
                disabled={!selectedFolderId || moveFolderMutation.isPending}
              >
                Move
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => (!o ? setPreview(null) : null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="truncate">{preview?.originalFilename || preview?.attachment?.fileName || "Asset"}</span>
              {preview ? (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setShareExpiresIn(24);
                      setShareUrl("");
                      setIsShareOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setIsVersionHistoryOpen(true)}
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setIsReplaceVersionOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const url = preview.attachment?.url || "";
                      const link = toProxiedUrl(url) || url;
                      if (!link) return;
                      await navigator.clipboard.writeText(link);
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setEditAssetTitle(preview.title || "");
                      setEditAssetDescription(preview.description || "");
                      setEditAssetTags((preview.tags || []).join(", "));
                      setEditAssetFolderId(preview.folderId || "");
                      setIsEditAssetOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => deleteAssetMutation.mutate(preview.id)}
                    disabled={deleteAssetMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => downloadAsset(preview)}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {preview ? (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
              <div className="rounded-md border bg-muted overflow-hidden flex items-center justify-center min-h-[360px]">
                {(() => {
                  const url = preview.attachment?.url || "";
                  const mime = preview.attachment?.mimeType || preview.mimeType || "";
                  const isImage = mime.startsWith("image/");
                  const safeUrl = toProxiedUrl(url) || url;
                  if (isImage && safeUrl) {
                    return <img src={safeUrl} alt={preview.originalFilename || "asset"} className="w-full max-h-[70vh] object-contain" />;
                  }
                  if (mime === "application/pdf" && safeUrl) {
                    return (
                      <iframe
                        title={preview.originalFilename || "pdf"}
                        src={safeUrl}
                        className="w-full h-[70vh] bg-white"
                      />
                    );
                  }
                  return (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Preview not available for this file type.
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Details</div>
                <div className="text-xs text-muted-foreground break-words">
                  <div><span className="font-medium text-foreground">File:</span> {preview.originalFilename || preview.attachment?.fileName || "—"}</div>
                  <div><span className="font-medium text-foreground">Type:</span> {preview.mimeType || preview.attachment?.mimeType || "—"}</div>
                  <div><span className="font-medium text-foreground">Size:</span> {formatBytes(preview.sizeBytes || preview.attachment?.size)}</div>
                  {preview.width && preview.height ? (
                    <div><span className="font-medium text-foreground">Dimensions:</span> {preview.width}×{preview.height}</div>
                  ) : null}
                  {preview.currentVersionNumber ? (
                    <div><span className="font-medium text-foreground">Version:</span> {preview.currentVersionNumber}</div>
                  ) : null}
                  {preview.tags?.length ? (
                    <div><span className="font-medium text-foreground">Tags:</span> {preview.tags.join(", ")}</div>
                  ) : null}
                  {preview.updatedAt ? (
                    <div><span className="font-medium text-foreground">Updated:</span> {new Date(preview.updatedAt).toLocaleString()}</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <Input value={editAssetTitle} onChange={(e) => setEditAssetTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input value={editAssetDescription} onChange={(e) => setEditAssetDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input value={editAssetTags} onChange={(e) => setEditAssetTags(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Folder</label>
              <select
                className={cn(
                  "w-full h-10 rounded-md border border-input bg-background px-3 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                value={editAssetFolderId}
                onChange={(e) => setEditAssetFolderId(e.target.value)}
              >
                <option value="">Root</option>
                {allFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditAssetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!preview) return;
                  const tags = editAssetTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);

                  patchAssetMutation.mutate({
                    id: preview.id,
                    title: editAssetTitle.trim(),
                    description: editAssetDescription.trim(),
                    tags,
                    folderId: editAssetFolderId ? editAssetFolderId : null,
                  });
                }}
                disabled={!preview || patchAssetMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          {versionsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading versions...</div>
          ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {versionsQuery.data.map((v) => (
                <div key={v.id} className="p-3 rounded-md border bg-muted/50 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">Version {v.versionNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.createdAt ? new Date(v.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    File: {v.originalFilename || "—"}
                  </div>
                  {v.changeNote ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      Note: {v.changeNote}
                    </div>
                  ) : null}
                  {v.width && v.height ? (
                    <div className="text-xs text-muted-foreground">
                      Dimensions: {v.width}×{v.height}
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    Size: {formatBytes(v.sizeBytes)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No version history available.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReplaceVersionOpen} onOpenChange={setIsReplaceVersionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Replace with New Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">New file</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    replaceVersionMutation.mutate({ file, changeNote: replaceChangeNote });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Change note (optional)</label>
              <Input
                value={replaceChangeNote}
                onChange={(e) => setReplaceChangeNote(e.target.value)}
                placeholder="Describe what changed..."
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Current version: {preview?.currentVersionNumber || 1}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsReplaceVersionOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkTagOpen} onOpenChange={setIsBulkTagOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tag {selectedAssetIds.size} asset{selectedAssetIds.size !== 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                placeholder="logo, brand, marketing"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBulkTagOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const tags = bulkTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
                  bulkTagMutation.mutate({
                    assetIds: Array.from(selectedAssetIds),
                    tags,
                  });
                }}
                disabled={selectedAssetIds.size === 0 || bulkTagMutation.isPending}
              >
                Apply Tags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Expiration (hours)</label>
              <Input
                type="number"
                min="1"
                max="8760"
                value={shareExpiresIn}
                onChange={(e) => setShareExpiresIn(Number(e.target.value))}
              />
            </div>
            {!shareUrl ? (
              <Button
                type="button"
                onClick={() => {
                  shareMutation.mutate({
                    assetId: preview?.id,
                    expiresInHours: shareExpiresIn,
                  });
                }}
                disabled={shareMutation.isPending}
              >
                Generate Share Link
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Share Link:</div>
                  <div className="text-xs text-muted-foreground break-all mt-1">{shareUrl}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Expires: {shareExpiresAt ? new Date(shareExpiresAt).toLocaleString() : ""}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                  }}
                >
                  Copy Link
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsShareOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBrandKitOpen} onOpenChange={setIsBrandKitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBrandKitId ? "Edit" : "Create"} Brand Kit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={brandKitName}
                onChange={(e) => setBrandKitName(e.target.value)}
                placeholder="Brand name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={brandKitDescription}
                onChange={(e) => setBrandKitDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Colors (comma-separated hex codes)</label>
              <Input
                value={brandKitColors}
                onChange={(e) => setBrandKitColors(e.target.value)}
                placeholder="#FF0000, #00FF00, #0000FF"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Guidelines</label>
              <textarea
                value={brandKitGuidelines}
                onChange={(e) => setBrandKitGuidelines(e.target.value)}
                placeholder="Brand usage guidelines..."
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBrandKitOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const colors = brandKitColors.split(",").map((c) => c.trim()).filter((c) => c.match(/^#[0-9A-Fa-f]{6}$/));
                  createBrandKitMutation.mutate({
                    name: brandKitName,
                    description: brandKitDescription,
                    colors,
                    guidelines: brandKitGuidelines,
                  });
                }}
                disabled={!brandKitName.trim() || createBrandKitMutation.isPending}
              >
                {editingBrandKitId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
