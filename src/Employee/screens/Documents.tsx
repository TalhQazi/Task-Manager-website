import { useEffect, useState, useRef } from "react";
import { getEmployeeDocuments, uploadDocument } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  docType?: string;
  status: "pending" | "completed";
  fileUrl?: string;
}

export default function Documents() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("W-4");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<{
    id?: string;
    status?: string;
  } | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

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

  const handleUpload = async () => {
    if (!file || !docType) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const res = await uploadDocument(formData);

      // handle both {item: {...}} OR direct response
      const uploaded = res.item || res;

      setUploadStatus({
        id: uploaded.id,
        status: uploaded.status,
      });

      // reset file input
      setFile(null);
      if (fileRef.current) {
        fileRef.current.value = "";
      }

      // refresh list
      await loadDocs();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ✅ TITLE */}
      <h2 className="text-2xl font-bold">Documents</h2>

      {/* ✅ UPLOAD SECTION */}
      <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
        <h3 className="font-medium">Upload Document</h3>

        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option>W-4</option>
          <option>I-9</option>
          <option>Agreement</option>
        </select>

        <input
          type="file"
          ref={fileRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>

       
      </div>

      
      {loading ? (
        <p className="text-gray-500">Loading documents...</p>
      ) : docs.length === 0 ? (
        <p className="text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex justify-between items-center p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">
                  {doc.docType || "Unknown Document"}
                </p>
                <p className="text-xs text-gray-500">
                  ID: {doc.id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={
                    doc.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {doc.status}
                </Badge>

                {doc.fileUrl && (
                  <button
                    className="text-blue-600 text-sm"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}