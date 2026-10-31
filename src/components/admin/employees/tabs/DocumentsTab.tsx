import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  FileText,
  FileUp,
  Download,
  Trash2,
  Calendar,
  Shield,
  Eye,
  AlertTriangle,
  FileCheck2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DocumentsTabProps {
  employeeId: string;
  employeeName: string;
  onOpenUploadModal: () => void;
}

export function DocumentsTab({
  employeeId,
  employeeName,
  onOpenUploadModal,
}: DocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const qs = categoryFilter !== "all" ? `?category=${categoryFilter}` : "";
      const res = await apiFetch<{ items: any[] }>(`/api/employees/${employeeId}/documents${qs}`);
      setDocuments(res.items || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeId, categoryFilter]);

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to archive "${title}"?`)) return;
    try {
      await apiFetch(`/api/employees/${employeeId}/documents/${docId}`, {
        method: "DELETE",
      });
      fetchDocuments();
    } catch (err: any) {
      alert(err?.message || "Failed to archive document");
    }
  };

  const handleDownload = async (docId: string, fileUrl: string) => {
    try {
      const res = await apiFetch<{ downloadUrl: string }>(
        `/api/employees/${employeeId}/documents/${docId}/download`
      );
      window.open(res.downloadUrl || fileUrl, "_blank");
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  const categories = [
    { key: "all", label: "All Documents" },
    { key: "contracts", label: "Contracts & Agreements" },
    { key: "tax", label: "Tax (W-4, W-2)" },
    { key: "identity", label: "Identity & I-9" },
    { key: "compliance", label: "Compliance & Handbooks" },
    { key: "certification", label: "Certificates & Licenses" },
    { key: "performance", label: "Performance Reviews" },
    { key: "medical", label: "Medical & Benefits" },
  ];

  return (
    <div className="space-y-6">
      {/* Category Navigation Badges & Upload Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategoryFilter(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                categoryFilter === c.key
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={onOpenUploadModal}
          className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 h-8 text-xs font-medium shrink-0 shadow-lg shadow-violet-600/20"
        >
          <FileUp className="h-3.5 w-3.5" /> Upload Document
        </Button>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          <span>Loading Document Vault...</span>
        </div>
      ) : documents.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">No documents found</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No files uploaded under this category for {employeeName}. Click &quot;Upload Document&quot; to securely archive contracts, tax forms, or identification.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenUploadModal}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 mt-2"
            >
              <FileUp className="h-3.5 w-3.5" /> Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const isExpiringSoon =
              doc.expirationDate &&
              new Date(doc.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 &&
              new Date(doc.expirationDate).getTime() > Date.now();
            const isExpired = doc.expirationDate && new Date(doc.expirationDate).getTime() <= Date.now();

            return (
              <Card
                key={doc.id}
                className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all group"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                          {doc.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px] uppercase">
                            {doc.category}
                          </Badge>
                          {doc.sensitivity === "confidential" && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                              Confidential
                            </Badge>
                          )}
                          {doc.sensitivity === "restricted" && (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                              Restricted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(doc.id, doc.fileUrl)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Download / View"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                        title="Archive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                    </div>

                    {doc.expirationDate ? (
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          isExpired
                            ? "text-rose-400"
                            : isExpiringSoon
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {isExpired ? "Expired " : "Expires "}
                        {new Date(doc.expirationDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-slate-500">Does not expire</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
