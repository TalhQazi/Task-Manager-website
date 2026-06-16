import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent } from "@/components/admin/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  FileText,
  X,
  Filter,
  Upload,
  Paperclip,
  Image,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Tag,
  Mail,
  Phone,
  Hash,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import { StatCard } from "@/components/admin/dashboard/StatCard";

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface CompanyRegistryEntry {
  id: string;
  companyName: string;
  entityType: string;
  fein: string;
  phone: string;
  email: string;
  status: "active" | "hold" | "archived";
  notes: string;
  attachments: Attachment[];
  colorTag: "green" | "blue" | "yellow" | "red" | "gray";
  createdAt: string;
  updatedAt: string;
}

const ENTITY_TYPES = [
  "LLC","Corporation","S-Corp","Partnership",
  "Sole Proprietorship","Non-Profit","LLP","PC",
];

const COLOR_TAGS = {
  green: { label: "Parent Company", dot: "bg-emerald-500", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" },
  blue:  { label: "Operational",    dot: "bg-blue-500",    class: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400" },
  yellow:{ label: "Missing Info",   dot: "bg-amber-400",   class: "bg-amber-400/10 text-amber-600 border-amber-400/25 dark:text-amber-400" },
  red:   { label: "Critical",       dot: "bg-red-500",     class: "bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400" },
  gray:  { label: "Archived",       dot: "bg-slate-400",   class: "bg-slate-500/10 text-slate-500 border-slate-400/25" },
};

const STATUS_MAP = {
  active:   { label: "Active",   icon: CheckCircle2, class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  hold:     { label: "Hold",     icon: Clock,        class: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
  archived: { label: "Archived", icon: Archive,      class: "bg-slate-500/10 text-slate-500 border-slate-400/20" },
};

const initialFormData = {
  companyName: "",
  entityType: "",
  fein: "",
  phone: "",
  email: "",
  status: "active" as const,
  notes: "",
  colorTag: "blue" as const,
};

function isValidEIN(ein: string): boolean {
  if (!ein) return true;
  return /^\d{2}-\d{7}$/.test(ein);
}

function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

const API_BASE = getApiBaseUrl();

/* ─── tiny spring helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};
const stagger = { show: { transition: { staggerChildren: 0.04 } } };

/* ─── Skeleton row ─── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border/40">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="p-3 border-r border-border/20">
          <div className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Empty state ─── */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
        <Building2 className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base">No companies yet</p>
        <p className="text-sm text-muted-foreground mt-1">Add your first company to get started.</p>
      </div>
      <Button onClick={onAdd} size="sm">
        <Plus className="w-4 h-4 mr-1.5" /> Add Company
      </Button>
    </motion.div>
  );
}

/* ─── Color Dot Tag ─── */
function ColorTag({ tag }: { tag: keyof typeof COLOR_TAGS }) {
  const t = COLOR_TAGS[tag];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${t.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {t.label}
    </span>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const s = STATUS_MAP[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.class}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

/* ─── Attachment Card (in view drawer) ─── */
function AttachmentCard({
  att,
  onPreview,
  onDownload,
  isImage,
}: {
  att: Attachment;
  onPreview: () => void;
  onDownload: () => void;
  isImage: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all hover:border-border"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isImage ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
        {isImage ? <Image className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
      </div>
      <span className="text-sm font-medium truncate flex-1">{att.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPreview}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-500/10 transition-colors"
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDownload}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 transition-colors"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Field Label ─── */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="text-sm font-medium">{value || <span className="text-muted-foreground font-normal">—</span>}</div>
    </div>
  );
}

export default function CompanyRegistry() {
  const [entries, setEntries] = useState<CompanyRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CompanyRegistryEntry | null>(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [einError, setEinError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/company-registry?_cb=${Date.now()}`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        id: String(item._id || item.id),
        companyName: item.companyName || "",
        entityType: item.entityType || "",
        fein: item.fein || "",
        phone: item.phone || "",
        email: item.email || "",
        status: item.status || "active",
        notes: item.notes || "",
        attachments: item.attachments || [],
        colorTag: item.colorTag || "blue",
        createdAt: item.createdAt || "",
        updatedAt: item.updatedAt || "",
      }));
      setEntries(items);
      setError(null);
    } catch (err) {
      setError("Failed to load company registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || entry.companyName.toLowerCase().includes(q) || entry.fein.toLowerCase().includes(q) || entry.email.toLowerCase().includes(q)) &&
      (statusFilter === "all" || entry.status === statusFilter) &&
      (colorFilter === "all" || entry.colorTag === colorFilter)
    );
  }), [entries, searchQuery, statusFilter, colorFilter]);

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setSelectedFiles([]);
    setEinError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    selectedFiles.forEach((file) => fd.append("files", file));
    return fd;
  };

  const handleAdd = async () => {
    if (!formData.companyName.trim()) return;
    if (!isValidEIN(formData.fein)) { setEinError("EIN must be in format XX-XXXXXXX"); return; }
    setIsSubmitting(true); setEinError(null);
    try {
      const res = await fetch(`${API_BASE}/api/company-registry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
        body: buildFormData(),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Save failed (${res.status})`); }
      setIsAddModalOpen(false); resetForm(); fetchEntries();
    } catch (err: any) { alert(err.message || "Failed to save company"); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selectedEntry || !formData.companyName.trim()) return;
    if (!isValidEIN(formData.fein)) { setEinError("EIN must be in format XX-XXXXXXX"); return; }
    setIsSubmitting(true); setEinError(null);
    try {
      const res = await fetch(`${API_BASE}/api/company-registry/${selectedEntry.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
        body: buildFormData(),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Update failed (${res.status})`); }
      setIsEditModalOpen(false); setSelectedEntry(null); resetForm(); fetchEntries();
    } catch (err: any) { alert(err.message || "Failed to update company"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/company-registry/${selectedEntry.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setIsDeleteConfirmOpen(false); setSelectedEntry(null); fetchEntries();
    } catch { alert("Failed to delete company"); }
    finally { setIsSubmitting(false); }
  };

  const openAddModal = () => { resetForm(); setIsAddModalOpen(true); };
  const openEditModal = (e: CompanyRegistryEntry) => {
    setSelectedEntry(e);
    setFormData({ companyName: e.companyName, entityType: e.entityType, fein: e.fein, phone: e.phone, email: e.email, status: e.status, notes: e.notes, colorTag: e.colorTag });
    setSelectedFiles([]); setEinError(null); setIsEditModalOpen(true);
  };
  const openViewDrawer  = (e: CompanyRegistryEntry) => { setSelectedEntry(e); setIsViewDrawerOpen(true); };
  const openDeleteConfirm = (e: CompanyRegistryEntry) => { setSelectedEntry(e); setIsDeleteConfirmOpen(true); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };
  const removeFile = (i: number) => setSelectedFiles((p) => p.filter((_, idx) => idx !== i));

  const handleExport = () => {
    const csv = [
      ["Company Name","Entity Type","EIN/FEIN","Phone","Email","Status","Notes","Color Tag"].join(","),
      ...filteredEntries.map((e) => [`"${e.companyName}"`,`"${e.entityType}"`,`"${e.fein}"`,`"${e.phone}"`,`"${e.email}"`,e.status,`"${e.notes}"`,e.colorTag].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "company-registry.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const getFullUrl = (url: string) => url?.startsWith("http") ? url : `${API_BASE}${url}`;
  const isImg = (type: string) => type?.startsWith("image/");

  const downloadAttachment = async (att: Attachment) => {
    try {
      const res = await fetch(getFullUrl(att.url), { headers: { Authorization: `Bearer ${getAuthState().token || ""}` } });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = blobUrl; a.download = att.name; a.click();
      URL.revokeObjectURL(blobUrl);
    } catch { alert("Failed to download file"); }
  };

  const openPreview = (att: Attachment) => { setPreviewAttachment(att); setIsPreviewOpen(true); };

  /* ── shared form body ── */
  const renderForm = (isOpen: boolean, onClose: () => void, onSubmit: () => void, title: string) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Modal header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Company Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Name <span className="text-red-500">*</span></label>
            <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Acme Corporation" className="h-10" />
          </div>

          {/* Entity Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity Type</label>
            <Select value={formData.entityType} onValueChange={(v) => setFormData({ ...formData, entityType: v })}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* EIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">EIN / FEIN</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={formData.fein}
                onChange={(e) => { setFormData({ ...formData, fein: formatEIN(e.target.value) }); setEinError(null); }}
                placeholder="12-3456789"
                className={`h-10 pl-8 font-mono ${einError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
            {einError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{einError}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" className="h-10 pl-8" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contact@company.com" className="h-10 pl-8" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">✅ Active</SelectItem>
                <SelectItem value="hold">⏸️ Hold</SelectItem>
                <SelectItem value="archived">📦 Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Tag</label>
            <Select value={formData.colorTag} onValueChange={(v) => setFormData({ ...formData, colorTag: v as any })}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="green">🟢 Parent Company</SelectItem>
                <SelectItem value="blue">🔵 Operational</SelectItem>
                <SelectItem value="yellow">🟡 Missing Info</SelectItem>
                <SelectItem value="red">🔴 Critical</SelectItem>
                <SelectItem value="gray">⚫ Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full min-h-[90px] rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
            />
          </div>

          {/* File Upload */}
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachments</label>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">Any file type supported</p>
                </div>
              </div>
            </label>

            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                      className="flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/50">
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                      <span className="max-w-[140px] truncate">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="ml-0.5 rounded-full hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t bg-background/95 backdrop-blur-sm">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !formData.companyName.trim()} className="min-w-[80px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8v8z" fill="currentColor" className="opacity-75" /></svg>
                Saving…
              </span>
            ) : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto w-full min-w-0 overflow-hidden">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Company Registry</h1>
            <p className="text-sm text-muted-foreground">Manage company tax &amp; legal information</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openAddModal} className="h-9">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Company
          </Button>
        </div>
      </motion.div>

      {/* ── Stats bar ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.08 } }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Total",     value: entries.length,                                      icon: Building2,  variant: "blue" as const },
          { title: "Active",    value: entries.filter((e) => e.status === "active").length,  icon: CheckCircle2, variant: "green" as const },
          { title: "On Hold",   value: entries.filter((e) => e.status === "hold").length,    icon: Clock,        variant: "amber" as const },
          { title: "Archived",  value: entries.filter((e) => e.status === "archived").length, icon: Archive,      variant: "dark-grey" as const },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.06 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12 } }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by company, EIN, or email…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[148px] h-9">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hold">Hold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-full sm:w-[168px] h-9">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            <SelectItem value="green">🟢 Parent Company</SelectItem>
            <SelectItem value="blue">🔵 Operational</SelectItem>
            <SelectItem value="yellow">🟡 Missing Info</SelectItem>
            <SelectItem value="red">🔴 Critical</SelectItem>
            <SelectItem value="gray">⚫ Archived</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Table ── */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}
        className="w-full min-w-0"
      >
        <Card className="w-full overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-0">
            {error ? (
              <div className="flex items-center justify-center gap-2 py-16 text-destructive">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            ) : (
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[1000px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/40">
                      {["Company Name","Entity","EIN / FEIN","Phone","Email","Status","Tag","Files","Actions"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap ${i < 8 ? "border-r border-border/30" : ""} ${h === "Actions" ? "text-center" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : filteredEntries.length === 0 ? (
                      <tr><td colSpan={9}><EmptyState onAdd={openAddModal} /></td></tr>
                    ) : (
                      filteredEntries.map((entry, index) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3), type: "spring", stiffness: 380, damping: 28 }}
                          onClick={() => openViewDrawer(entry)}
                          className="border-b border-border/30 hover:bg-muted/40 cursor-pointer transition-colors group"
                        >
                          {/* Company Name */}
                          <td className="px-4 py-3 border-r border-border/20">
                            <div className="flex items-center gap-2.5 min-w-[160px]">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${COLOR_TAGS[entry.colorTag]?.class} border`}>
                                {entry.companyName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold truncate max-w-[180px]">{entry.companyName}</span>
                            </div>
                          </td>

                          {/* Entity */}
                          <td className="px-4 py-3 border-r border-border/20 text-muted-foreground whitespace-nowrap">
                            {entry.entityType || <span className="text-border">—</span>}
                          </td>

                          {/* EIN */}
                          <td className="px-4 py-3 border-r border-border/20">
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md border border-border/30">
                              {entry.fein || "—"}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3 border-r border-border/20 text-muted-foreground whitespace-nowrap">
                            {entry.phone || <span className="text-border">—</span>}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 border-r border-border/20 text-muted-foreground max-w-[180px]">
                            <span className="truncate block">{entry.email || <span className="text-border">—</span>}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 border-r border-border/20 whitespace-nowrap">
                            <StatusBadge status={entry.status} />
                          </td>

                          {/* Tag */}
                          <td className="px-4 py-3 border-r border-border/20 whitespace-nowrap">
                            <ColorTag tag={entry.colorTag} />
                          </td>

                          {/* Files */}
                          <td className="px-4 py-3 border-r border-border/20">
                            {entry.attachments?.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                                  <Paperclip className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">{entry.attachments.length}</span>
                              </div>
                            ) : <span className="text-border text-sm">—</span>}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openViewDrawer(entry)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-colors" title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEditModal(entry)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openDeleteConfirm(entry)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Footer */}
                {!loading && filteredEntries.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      Showing <strong>{filteredEntries.length}</strong> of <strong>{entries.length}</strong> companies
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Add / Edit Modals ── */}
      {renderForm(isAddModalOpen, () => { setIsAddModalOpen(false); resetForm(); }, handleAdd, "Add Company")}
      {renderForm(isEditModalOpen, () => { setIsEditModalOpen(false); resetForm(); }, handleEdit, "Edit Company")}

      {/* ── View Drawer ── */}
      <Dialog open={isViewDrawerOpen} onOpenChange={setIsViewDrawerOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0">
          {/* Top band */}
          <div className="px-6 pt-6 pb-4 border-b space-y-3 bg-muted/30">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border ${selectedEntry ? COLOR_TAGS[selectedEntry.colorTag]?.class : ""}`}>
                {selectedEntry?.companyName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold truncate">{selectedEntry?.companyName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {selectedEntry && <StatusBadge status={selectedEntry.status} />}
                  {selectedEntry && <ColorTag tag={selectedEntry.colorTag} />}
                </div>
              </div>
            </div>
          </div>

          {selectedEntry && (
            <div className="px-6 py-5 space-y-5">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Entity Type" value={selectedEntry.entityType} />
                <Field label="EIN / FEIN" value={<span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md border border-border/40">{selectedEntry.fein || "—"}</span>} />
                <Field label="Phone" value={selectedEntry.phone} />
                <Field label="Email" value={selectedEntry.email} />
              </div>

              {/* Notes */}
              {selectedEntry.notes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
                  <p className="text-sm leading-relaxed bg-muted/40 rounded-xl px-4 py-3 border border-border/30">{selectedEntry.notes}</p>
                </div>
              )}

              {/* Attachments */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Attachments {selectedEntry.attachments?.length > 0 && `(${selectedEntry.attachments.length})`}
                </span>
                {selectedEntry.attachments?.length ? (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-2">
                    {selectedEntry.attachments.map((att, i) => (
                      <AttachmentCard
                        key={i}
                        att={att}
                        isImage={isImg(att.type)}
                        onPreview={() => openPreview(att)}
                        onDownload={() => downloadAttachment(att)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                )}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t bg-background/95 backdrop-blur-sm">
            <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>Close</Button>
            <Button onClick={() => { setIsViewDrawerOpen(false); if (selectedEntry) openEditModal(selectedEntry); }}>
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Modal ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 border-b bg-background/95 backdrop-blur-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${previewAttachment && isImg(previewAttachment.type) ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
              {previewAttachment && isImg(previewAttachment.type) ? <Image className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
            </div>
            <span className="font-semibold truncate flex-1 text-sm">{previewAttachment?.name}</span>
            {previewAttachment && (
              <Button size="sm" variant="outline" onClick={() => downloadAttachment(previewAttachment)} className="h-8 shrink-0">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download
              </Button>
            )}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {previewAttachment && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              {isImg(previewAttachment.type) ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={getFullUrl(previewAttachment.url)}
                  alt={previewAttachment.name}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg ring-1 ring-border"
                />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-10">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center ring-1 ring-border">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold">{previewAttachment.name}</p>
                  </div>
                  <Button onClick={() => downloadAttachment(previewAttachment)}>
                    <Download className="w-4 h-4 mr-1.5" /> Download to view
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm p-0">
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20 mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-base">Delete Company</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-foreground">{selectedEntry?.companyName}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}