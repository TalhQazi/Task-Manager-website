import React, { useState, useEffect } from "react";
import { X, Folder, FileText, Image as ImageIcon, Download, Mic, ExternalLink } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";

interface SharedMediaItem {
  id: string;
  sender: string;
  timestamp: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
  voiceNote?: { url?: string; duration?: number };
}

interface MediaVaultDrawerProps {
  open: boolean;
  onClose: () => void;
  groupId?: string | null;
  recipient?: string | null;
}

export default function MediaVaultDrawer({
  open,
  onClose,
  groupId,
  recipient,
}: MediaVaultDrawerProps) {
  const [items, setItems] = useState<SharedMediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMediaVault();
    }
  }, [open, groupId, recipient]);

  const loadMediaVault = async () => {
    try {
      setLoading(true);
      const query = groupId ? `groupId=${groupId}` : `recipient=${encodeURIComponent(recipient || "")}`;
      const res = await apiFetch<{ items: SharedMediaItem[] }>(`/api/messages/media-vault?${query}`);
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load media vault:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-400" />
          <h3 className="font-bold text-base">Shared Media & Files</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 custom-scrollbar">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-8">Loading shared files...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No media or files shared in this chat yet.</p>
        ) : (
          items.map((item) => {
            const allAtts = [
              ...(item.attachment?.url ? [item.attachment] : []),
              ...(item.attachments || []),
            ];

            return (
              <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>{item.sender}</span>
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>

                {/* Attachments */}
                {allAtts.map((att, idx) => {
                  const isImg = att.mimeType?.startsWith("image/") || /\.(jpg|png|webp|gif|jpeg)$/i.test(att.fileName || "");
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {isImg ? (
                          <ImageIcon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium text-slate-800">{att.fileName || "Shared File"}</span>
                      </div>
                      <a
                        href={toProxiedUrl(att.url) || att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })}

                {/* Voice Note */}
                {item.voiceNote?.url && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Voice Note ({item.voiceNote.duration || 0}s)</span>
                    </div>
                    <a
                      href={toProxiedUrl(item.voiceNote.url) || item.voiceNote.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
