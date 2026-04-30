import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Loader2, Search, Image as ImageIcon, Check, FolderOpen } from "lucide-react";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";

type AssetItem = {
  id: string;
  _id?: string;
  originalFilename: string;
  mimeType: string;
  urlOriginal: string;
  sizeBytes?: number;
  attachment?: { url: string; fileName: string };
};

type FolderItem = {
  id: string;
  name: string;
  assetCount?: number;
  children?: FolderItem[];
};

interface AssetLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string, fileName: string) => void;
  /** Only show images (default true) */
  imagesOnly?: boolean;
}

export default function AssetLibraryPicker({ open, onOpenChange, onSelect, imagesOnly = true }: AssetLibraryPickerProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 60;

  // Flatten folder tree
  const flatFolders = useMemo(() => {
    const result: { id: string; name: string; depth: number }[] = [];
    const walk = (items: FolderItem[], depth: number) => {
      for (const f of items) {
        result.push({ id: f.id, name: f.name, depth });
        if (f.children?.length) walk(f.children, depth + 1);
      }
    };
    walk(folders, 0);
    return result;
  }, [folders]);

  // Load folders on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await apiFetch<{ items: FolderItem[] }>("/api/asset-library/folders");
        setFolders(res.items || []);
      } catch { /* ignore */ }
    })();
  }, [open]);

  // Reset page when folder or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedFolderId, search]);

  // Load assets when folder changes or search
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedFolderId) params.set("folderId", selectedFolderId);
    if (imagesOnly) params.set("type", "image");
    if (search.trim()) params.set("q", search.trim());
    params.set("sort", "az");
    params.set("limit", itemsPerPage.toString());
    params.set("page", page.toString());

    (async () => {
      try {
        const res = await apiFetch<{ items: AssetItem[], total: number, totalPages: number }>(`/api/asset-library/assets?${params.toString()}`);
        if (!cancelled) {
          setAssets(res.items || []);
          setTotalItems(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, selectedFolderId, search, imagesOnly, page]);

  const handleSelect = () => {
    if (!selectedAssetUrl) return;
    const asset = assets.find(a => getAssetUrl(a) === selectedAssetUrl);
    onSelect(selectedAssetUrl, asset?.originalFilename || asset?.attachment?.fileName || "image");
    onOpenChange(false);
    setSelectedAssetUrl("");
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedAssetUrl(""); setSearch(""); } }}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[750px] max-h-[85vh] overflow-hidden rounded-lg flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Pick from Company Information/Images</DialogTitle>
          <DialogDescription>Select an image from the asset library</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 overflow-hidden">
          {/* Folder sidebar */}
          <div className="sm:w-[180px] shrink-0 border rounded-lg overflow-y-auto max-h-[200px] sm:max-h-none">
            <button
              type="button"
              onClick={() => setSelectedFolderId("")}
              className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${!selectedFolderId ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`}
            >
              <FolderOpen className="h-3.5 w-3.5" /> All Files
            </button>
            {flatFolders.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolderId(f.id)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-1.5 transition-colors ${selectedFolderId === f.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}
                style={{ paddingLeft: `${12 + f.depth * 12}px` }}
              >
                <FolderOpen className="h-3 w-3" /> {f.name}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : assets.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No images found</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                  {assets.map((asset) => {
                    const url = getAssetUrl(asset);
                    const proxied = toProxiedUrl(url) || url;
                    const isSelected = selectedAssetUrl === url;
                    return (
                      <button
                        key={asset.id || asset._id}
                        type="button"
                        onClick={() => setSelectedAssetUrl(url)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:opacity-90 ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"}`}
                      >
                        <img
                          src={proxied}
                          alt={asset.originalFilename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                          <p className="text-[9px] text-white truncate">{asset.originalFilename || "image"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1 py-2 border-t border-b bg-muted/20">
                <p className="text-[10px] text-muted-foreground font-medium">
                  Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === 1 || loading}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <span className="sr-only">Previous Page</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    <span className="text-[10px] font-bold">{page}</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-[10px] text-muted-foreground">{totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === totalPages || loading}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <span className="sr-only">Next Page</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5"><path d="M6.15818 3.13514C5.95673 3.32401 5.94652 3.64042 6.13538 3.84188L9.56479 7.49991L6.13538 11.1579C5.94652 11.3594 5.95673 11.6758 6.15818 11.8647C6.35964 12.0535 6.67606 12.0433 6.86492 11.8419L10.6149 7.84188C10.7952 7.64955 10.7952 7.35027 10.6149 7.15794L6.86492 3.15794C6.67606 2.95648 6.35964 2.94628 6.15818 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" disabled={!selectedAssetUrl} onClick={handleSelect} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Use Selected Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getAssetUrl(asset: AssetItem): string {
  return asset.urlOriginal || asset.attachment?.url || "";
}
