import { useEffect, useState, useRef } from "react";
import { getEmployeeDocuments, uploadDocument, employeeApiFetch } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Upload, FileText, Download, FolderOpen } from "lucide-react";

interface DocumentItem {
  id: string;
  docType?: string;
  status: "pending" | "completed";
  fileUrl?: string;
}

interface DocTypes {
  types: string[];
}

const CONTRACT_TYPES = ["W-4", "I-9", "Agreement", "NDA", "Policy Acknowledgment", "Other"];

export default function Documents() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("W-4");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const [uploadStatus, setUploadStatus] = useState<{
    id?: string;
    status?: string;
  } | null>(null);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeDocuments();
      setDocs(res.items || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async () => {
    if (!file || !docType) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const res = await uploadDocument(formData);

      const uploaded = res.item || res;

      setUploadStatus({
        id: uploaded.id,
        status: uploaded.status,
      });

      setFile(null);
      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await loadDocs();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = filterType === "all" 
    ? docs 
    : docs.filter(d => d.docType === filterType);

  const completedCount = docs.filter(d => d.status === "completed").length;
  const pendingCount = docs.filter(d => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Document Center</h1>
          <p className="text-sm text-muted-foreground">Manage your contracts and required documents</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{completedCount} Completed</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            >
              {CONTRACT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="file"
              ref={fileRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              {file ? file.name : "Choose File"}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All ({docs.length})
        </Button>
        {CONTRACT_TYPES.map(type => {
          const count = docs.filter(d => d.docType === type).length;
          if (count === 0) return null;
          return (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type} ({count})
            </Button>
          );
        })}
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`flex justify-between items-center p-4 border rounded-lg transition-colors ${
                    doc.status === "completed" 
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" 
                      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {doc.status === "completed" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{doc.docType}</p>
                      <Badge
                        variant={doc.status === "completed" ? "success" : "destructive"}
                        className="mt-1"
                      >
                        {doc.status === "completed" ? "✓ Completed" : "✗ Pending"}
                      </Badge>
                    </div>
                  </div>
                  {doc.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, "_blank")}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}