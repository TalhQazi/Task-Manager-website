import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import { FileUp, Loader2, Upload, Calendar, Shield, Paperclip } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onSuccess: () => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
}: DocumentUploadModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("contracts");
  const [sensitivity, setSensitivity] = useState("standard");
  const [issueDate, setIssueDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [employeeVisible, setEmployeeVisible] = useState(true);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Auto-populate title from clean filename
        const cleanName = selected.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    if (!title.trim()) {
      setError("Document title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("sensitivity", sensitivity);
      if (issueDate) formData.append("issueDate", issueDate);
      if (expirationDate) formData.append("expirationDate", expirationDate);
      formData.append("employeeVisible", String(employeeVisible));
      if (notes) formData.append("notes", notes);

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/employees/${employeeId}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Failed to upload document");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] bg-slate-900 border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Upload to Document Vault
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Add compliance, contract, or identity records to employee file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Drag & Drop File Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              file
                ? "border-violet-500/60 bg-violet-950/20"
                : "border-slate-700 hover:border-slate-500 bg-slate-950/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-violet-400">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm font-medium text-white truncate max-w-[300px]">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="space-y-1 text-slate-400">
                <Upload className="h-7 w-7 mx-auto text-slate-500 mb-1.5" />
                <p className="text-xs font-medium text-slate-300">
                  Click to select file or drag and drop
                </p>
                <p className="text-[11px] text-slate-500">
                  PDF, DOCX, PNG, JPG up to 50MB
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Document Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2026 Employment Agreement"
              className="bg-slate-950 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="contracts">Contracts & Agreements</SelectItem>
                  <SelectItem value="tax">Tax Forms (W-4, W-2, 1099)</SelectItem>
                  <SelectItem value="identity">Identity & Work Auth (I-9, ID)</SelectItem>
                  <SelectItem value="compliance">Compliance & Handbooks</SelectItem>
                  <SelectItem value="certification">Certifications & Licenses</SelectItem>
                  <SelectItem value="performance">Performance Reviews</SelectItem>
                  <SelectItem value="medical">Medical & Benefits</SelectItem>
                  <SelectItem value="other">Other Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Shield className="h-3 w-3 text-slate-400" />
                Sensitivity
              </label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="standard">Standard (General File)</SelectItem>
                  <SelectItem value="confidential">Confidential (Management/HR)</SelectItem>
                  <SelectItem value="restricted">Restricted (Executive/Admin Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Issue Date
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Expiration Date (Optional)
              </label>
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-medium text-white">Employee Self-Service Visibility</div>
              <div className="text-[11px] text-slate-400">
                Allow employee to view and download this document from their portal
              </div>
            </div>
            <Switch
              checked={employeeVisible}
              onCheckedChange={setEmployeeVisible}
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium gap-2 shadow-lg shadow-violet-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload to Vault
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
