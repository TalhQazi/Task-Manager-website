import React, { useRef, useState } from "react";
import {
  CostFileType,
  CostLineItem,
  CostSheetPayload,
  FILE_TYPE_LABELS,
  deleteCostItemFile,
  fileToDataUrl,
  uploadCostItemFiles,
} from "@/lib/costManager";
import { toProxiedUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";

export default function FilesDialog({
  item,
  readOnly,
  onClose,
  onSaved,
  onError,
}: {
  item: CostLineItem;
  readOnly: boolean;
  onClose: () => void;
  onSaved: (payload: CostSheetPayload) => void;
  onError: (err: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<CostFileType>("invoice");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const payloads = await Promise.all(
        Array.from(files)
          .slice(0, 10)
          .map(async (f) => ({ fileName: f.name, fileType, dataUrl: await fileToDataUrl(f) }))
      );
      onSaved(await uploadCostItemFiles(item.id, payloads));
    } catch (err) {
      onError(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> Files — {item.itemName}
          </DialogTitle>
          <DialogDescription>
            Quotes, invoices, receipts, purchase orders, spec sheets, safety data sheets, lab reports, photos, and
            tracking documents.
          </DialogDescription>
        </DialogHeader>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
            <Select value={fileType} onValueChange={(v) => setFileType(v as CostFileType)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FILE_TYPE_LABELS) as CostFileType[]).map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {FILE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Files
            </Button>
            <span className="text-[11px] text-muted-foreground">Max 10 files at a time, 25 MB each.</span>
          </div>
        )}

        <div className="space-y-1.5">
          {item.attachments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No files attached yet.</p>
          )}
          {item.attachments.map((att) => {
            const proxied = toProxiedUrl(att.url) || att.url;
            return (
              <div
                key={att.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <a
                    href={proxied}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium truncate hover:underline"
                    title={att.fileName}
                  >
                    {att.fileName}
                  </a>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {FILE_TYPE_LABELS[att.fileType] || att.fileType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-[11px] text-muted-foreground">
                  {att.size > 0 && <span>{(att.size / 1024).toFixed(0)} KB</span>}
                  {att.uploadedByUsername && <span>by {att.uploadedByUsername}</span>}
                  {!readOnly && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        if (!window.confirm(`Delete "${att.fileName}"?`)) return;
                        try {
                          onSaved(await deleteCostItemFile(item.id, att.id));
                        } catch (err) {
                          onError(err);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
