import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  AlertTriangle,
  Paperclip,
  Download,
} from "lucide-react";
import { createResource, deleteResource, listResource, updateResource, getApiBaseUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";

interface LegalCourt {
  id: string;
  name: string;
}

interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  type: string;
  status: "Open" | "In Progress" | "Pending Review" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  court?: string;
  judge?: string;
  description?: string;
  openDate?: string;
  closeDate?: string;
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  createdAt?: string;
  updatedAt?: string;
}

const statusClasses = {
  Open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Pending Review": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Closed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const priorityClasses = {
  Low: "text-slate-400",
  Medium: "text-blue-400",
  High: "text-amber-500",
  Critical: "text-rose-500 font-bold",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

const formatCaseNumber = (val: string): string => {
  const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const parts = [];
  if (clean.length > 0) parts.push(clean.slice(0, 4));
  if (clean.length > 4) parts.push(clean.slice(4, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 13));
  if (clean.length > 13) parts.push(clean.slice(13, 17));
  return parts.join("-");
};

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [casesList, setCasesList] = useState<LegalCase[]>([]);
  const [courtsList, setCourtsList] = useState<LegalCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [addCourtOpen, setAddCourtOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const auth = getAuthState();
  const isAdminRole = auth.role === "admin" || auth.role === "super-admin" || auth.role === "manager";

  const [formData, setFormData] = useState<{
    caseNumber: string;
    title: string;
    clientName: string;
    type: string;
    status: LegalCase["status"];
    priority: LegalCase["priority"];
    court: string;
    judge: string;
    description: string;
    openDate: string;
    closeDate: string;
    attachments: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  }>({
    caseNumber: "",
    title: "",
    clientName: "",
    type: "",
    status: "Open",
    priority: "Medium",
    court: "",
    judge: "",
    description: "",
    openDate: "",
    closeDate: "",
    attachments: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, courts] = await Promise.all([
        listResource<LegalCase>("legal/cases"),
        listResource<LegalCourt>("legal/courts")
      ]);
      setCasesList(list);
      setCourtsList(courts);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      caseNumber: "",
      title: "",
      clientName: "",
      type: "",
      status: "Open",
      priority: "Medium",
      court: "",
      judge: "",
      description: "",
      openDate: "",
      closeDate: "",
      attachments: []
    });
  };

  const handleAdd = async () => {
    try {
      setIsSubmitting(true);
      await createResource<LegalCase>("legal/cases", {
        ...formData,
        openDate: formData.openDate || undefined,
        closeDate: formData.closeDate || undefined,
      });
      await loadData();
      setAddOpen(false);
      resetForm();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to create case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOpen = (c: LegalCase) => {
    setSelectedCase(c);
    setFormData({
      caseNumber: c.caseNumber || "",
      title: c.title,
      clientName: c.clientName,
      type: c.type,
      status: c.status,
      priority: c.priority,
      court: c.court || "",
      judge: c.judge || "",
      description: c.description || "",
      openDate: c.openDate ? c.openDate.split("T")[0] : "",
      closeDate: c.closeDate ? c.closeDate.split("T")[0] : "",
      attachments: c.attachments || []
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      await updateResource<LegalCase>("legal/cases", selectedCase.id, {
        ...formData,
        openDate: formData.openDate || undefined,
        closeDate: formData.closeDate || undefined,
      });
      await loadData();
      setEditOpen(false);
      setSelectedCase(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      await deleteResource("legal/cases", selectedCase.id);
      await loadData();
      setDeleteOpen(false);
      setSelectedCase(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to delete case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCourt = async () => {
    if (!newCourtName.trim()) return;
    try {
      setIsSubmitting(true);
      const newCourt = await createResource<LegalCourt>("legal/courts", { name: newCourtName.trim() });
      setCourtsList(prev => [...prev, newCourt].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, court: newCourt.name }));
      setAddCourtOpen(false);
      setNewCourtName("");
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to create court");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingFiles(true);
      const files = Array.from(e.target.files);
      const newAtts = await Promise.all(files.map(async (file) => {
        const base64Url = await fileToBase64(file);
        return {
          fileName: file.name,
          url: base64Url,
          mimeType: file.type,
          size: file.size
        };
      }));
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAtts]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== idx)
    }));
  };

  const filteredCases = useMemo(() => {
    return casesList.filter((c) => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [casesList, searchQuery]);

  const renderFormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Title *</label>
        <input 
          type="text" 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          placeholder="Case Title" 
          required 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Case Number (Format: PENC-CIV-000061-2026)</label>
        <input 
          type="text" 
          value={formData.caseNumber} 
          onChange={e => setFormData({...formData, caseNumber: formatCaseNumber(e.target.value)})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono" 
          placeholder="PENC-CIV-000061-2026" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Client Name *</label>
        <input 
          type="text" 
          value={formData.clientName} 
          onChange={e => setFormData({...formData, clientName: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          placeholder="Client Name" 
          required 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Case Type *</label>
        <input 
          type="text" 
          value={formData.type} 
          onChange={e => setFormData({...formData, type: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          placeholder="e.g. Civil, Criminal" 
          required 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Status</label>
        <select 
          value={formData.status} 
          onChange={e => setFormData({...formData, status: e.target.value as any})} 
          className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Priority</label>
        <select 
          value={formData.priority} 
          onChange={e => setFormData({...formData, priority: e.target.value as any})} 
          className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>
      <div className="space-y-1 min-w-0">
        <label className="text-xs font-medium text-slate-300">Court</label>
        <div className="flex gap-2 min-w-0">
          <select
            value={formData.court}
            onChange={e => setFormData({...formData, court: e.target.value})}
            className="flex-1 min-w-0 truncate rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Select a court</option>
            {courtsList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <Button type="button" variant="outline" onClick={() => setAddCourtOpen(true)} className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 text-white px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Judge</label>
        <input 
          type="text" 
          value={formData.judge} 
          onChange={e => setFormData({...formData, judge: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          placeholder="Judge Name" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300">Open Date</label>
        <input 
          type="date" 
          value={formData.openDate} 
          onChange={e => setFormData({...formData, openDate: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-medium text-slate-300">Description</label>
        <textarea 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24" 
          placeholder="Case details..." 
        />
      </div>

      {/* File Attachments (Admins/Super Admins only) */}
      {isAdminRole && (
        <div className="space-y-1.5 sm:col-span-2 border-t border-white/5 pt-3 mt-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" /> Attachments
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="file" 
              id="case-attachments-input" 
              multiple 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => document.getElementById("case-attachments-input")?.click()}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs"
            >
              Attach Files
            </Button>
            {uploadingFiles && <span className="text-xs text-slate-400">Processing files...</span>}
          </div>
          
          {formData.attachments && formData.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/20">
              {formData.attachments.map((att: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs text-slate-300 bg-white/5 p-1.5 px-2.5 rounded border border-white/5">
                  <span className="truncate max-w-[250px]">{att.fileName} ({att.size ? (att.size / 1024).toFixed(1) : 0} KB)</span>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(idx)}
                    className="text-rose-400 hover:text-rose-300 font-semibold text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div className="pl-12 pr-2 sm:pr-0 pb-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-transparent p-6 border border-white/10">
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Briefcase className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Legal Cases</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Manage your legal cases, track statuses, priorities, and assignments.
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Case
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Fill out the details to open a new case record.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
                {renderFormFields()}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
                <Button onClick={handleAdd} disabled={isSubmitting || uploadingFiles || !formData.title || !formData.clientName || !formData.type} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {isSubmitting ? "Saving..." : "Create Case"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-black/20 hover:bg-black/20">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">Case No.</TableHead>
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Client</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Priority</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading cases...</TableCell>
                </TableRow>
              ) : filteredCases.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">No cases found.</TableCell>
                </TableRow>
              ) : (
                filteredCases.map((c) => (
                  <TableRow key={c.id} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-sm text-slate-300">{c.caseNumber}</TableCell>
                    <TableCell className="font-medium text-white">{c.title}</TableCell>
                    <TableCell className="text-slate-300">{c.clientName}</TableCell>
                    <TableCell className="text-slate-300">{c.type}</TableCell>
                    <TableCell>
                      <span className={priorityClasses[c.priority] || "text-slate-400"}>
                        {c.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClasses[c.status] || ""}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => { setSelectedCase(c); setViewOpen(true); }} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOpen(c)} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit Case
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedCase(c); setDeleteOpen(true); }} className="text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case {selectedCase?.caseNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
            {renderFormFields()}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting || uploadingFiles || !formData.title || !formData.clientName || !formData.type} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="py-4 space-y-4">
              <div>
                <div className="text-xs text-slate-400">Case Number</div>
                <div className="font-mono text-lg">{selectedCase.caseNumber}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Title</div>
                  <div className="font-medium">{selectedCase.title}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Client</div>
                  <div className="font-medium">{selectedCase.clientName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Status</div>
                  <Badge variant="outline" className={statusClasses[selectedCase.status] || ""}>{selectedCase.status}</Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Priority</div>
                  <div className={priorityClasses[selectedCase.priority] || ""}>{selectedCase.priority}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Type</div>
                  <div>{selectedCase.type}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Court</div>
                  <div>{selectedCase.court || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Judge</div>
                  <div>{selectedCase.judge || "N/A"}</div>
                </div>
              </div>
              {selectedCase.description && (
                <div>
                  <div className="text-xs text-slate-400">Description</div>
                  <div className="text-sm bg-white/5 p-3 rounded-md mt-1 break-words">{selectedCase.description}</div>
                </div>
              )}
              
              {/* Show Attachments */}
              {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Attachments
                  </div>
                  <div className="space-y-1.5">
                    {selectedCase.attachments.map((att, idx) => {
                      const fileUrl = att.url.startsWith("http") ? att.url : `${getApiBaseUrl().replace(/\/$/, "")}${att.url}`;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded border border-white/10">
                          <span className="truncate max-w-[280px] text-slate-300">{att.fileName} ({att.size ? (att.size / 1024).toFixed(1) : 0} KB)</span>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline hover:text-blue-300 flex items-center gap-1 font-medium ml-2"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#0f172a] border-rose-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Case
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Are you sure you want to delete case <strong>{selectedCase?.caseNumber}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleDelete} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-500 text-white border-0">
              {isSubmitting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Court Dialog */}
      <Dialog open={addCourtOpen} onOpenChange={setAddCourtOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Court</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Court Name *</label>
              <input 
                type="text" 
                value={newCourtName} 
                onChange={e => setNewCourtName(e.target.value)} 
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                placeholder="Enter court name" 
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddCourtOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleAddCourt} disabled={isSubmitting || !newCourtName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isSubmitting ? "Adding..." : "Add Court"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
