import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeeApiFetch, toProxiedUrl } from "@/Employee/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Download, FileText, Folder, FolderOpen, Image as ImageIcon, Search, Link as LinkIcon } from "lucide-react";

type FolderNode = {
  id: string;
  name: string;
  parentFolderId?: string | null;
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
  sizeBytes?: number;
  width?: number;
  height?: number;
  checksumSha256?: string;
  currentVersionNumber?: number;
  urlThumbnail?: string;
  urlPreview?: string;
  updatedAt?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
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

function formatBytes(bytes: number | undefined) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const v = b / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function EmployeeAssetLibrary() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Asset | null>(null);

  const [typeFilter, setTypeFilter] = useState<"" | "image" | "pdf">("");
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "za" | "size-asc" | "size-desc">("newest");
  const [page, setPage] = useState(1);
  const limit = 24;

  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});

  const foldersQuery = useQuery({
    queryKey: ["asset-library", "folders", "employee"],
    queryFn: async () => {
      const res = await employeeApiFetch<{ items: FolderNode[] }>("/api/asset-library/folders");
      return res.items || [];
    },
  });

  const assetsQuery = useQuery({
    queryKey: ["asset-library", "assets", "employee", selectedFolderId, search, typeFilter, sort, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolderId) params.set("folderId", selectedFolderId);
      if (search.trim()) params.set("q", search.trim());
      if (typeFilter) params.set("type", typeFilter);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const qs = params.toString() ? `?${params.toString()}` : "";
      const result = await employeeApiFetch<Paginated<Asset>>(`/api/asset-library/assets${qs}`);
      console.log("[AssetLibrary] API Response:", result);
      return result;
    },
    enabled: !foldersQuery.isLoading,
  });

  const allFolders = useMemo(() => flattenFolders(foldersQuery.data ?? []), [foldersQuery.data]);
  const assets = assetsQuery.data?.items ?? [];
  const totalPages = assetsQuery.data?.totalPages ?? 1;
  const total = assetsQuery.data?.total ?? assets.length;

  const downloadAsset = async (asset: Asset) => {
    const res = await employeeApiFetch<{ url: string; fileName: string }>(
      `/api/asset-library/assets/${encodeURIComponent(asset.id)}/download`,
      { method: "POST" }
    );

    const safeUrl = toProxiedUrl(res.url);
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
    return (
      <div key={node.id}>
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            isActive && "bg-muted"
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Browse and download approved brand assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card className="min-h-[520px] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Folders</CardTitle>
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
                <Badge variant="secondary" className="ml-auto">{total}</Badge>
              </button>
              {(foldersQuery.data ?? []).map((n) => renderFolderNode(n, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[520px] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Assets</CardTitle>
              <div className="flex items-center justify-end gap-2 w-full">
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
                    placeholder="Search..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 h-full overflow-y-auto">
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
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className="group rounded-lg border bg-card hover:bg-muted/40 transition-colors overflow-hidden text-left"
                      onClick={() => setPreview(a)}
                    >
                      <div className="absolute z-10 right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-background/90"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const link = toProxiedUrl(a.attachment?.url || "") || a.attachment?.url || "";
                            if (link) await navigator.clipboard.writeText(link);
                          }}
                          title="Copy link"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {isImage && thumb ? (
                          <img src={thumb} alt={a.originalFilename || "asset"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            {mime === "application/pdf" ? <FileText className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
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
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 px-1 py-3">
              <div className="text-xs text-muted-foreground">{total} total</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || assetsQuery.isLoading}
                >
                  Prev
                </Button>
                <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || assetsQuery.isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => (!o ? setPreview(null) : null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="truncate">{preview?.originalFilename || preview?.attachment?.fileName || "Asset"}</span>
              {preview ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const url = preview.attachment?.url || "";
                      const link = toProxiedUrl(url);
                      if (!link) return;
                      await navigator.clipboard.writeText(link);
                    }}
                  >
                    Copy Link
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
                  const safeUrl = toProxiedUrl(url);

                  if (isImage && safeUrl) {
                    return (
                      <img
                        src={safeUrl}
                        alt={preview.originalFilename || "asset"}
                        className="w-full max-h-[70vh] object-contain"
                      />
                    );
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
                  <div><span className="font-medium text-foreground">Folder:</span> {preview.folderId ? (allFolders.find((f) => f.id === preview.folderId)?.name || "—") : "—"}</div>
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
    </div>
  );
}
