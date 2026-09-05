import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/admin/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/admin/ui/dialog";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Scale, AlertTriangle, Paperclip, Download } from "lucide-react";
import { createResource, deleteResource, listResource, updateResource, getApiBaseUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";

interface LegalEvidence {
  id: string;
  evidenceNumber: string;
  title: string;
  description?: string;
  evidenceType: "Physical" | "Digital" | "Testimonial";
  dateAcquired?: string;
  location?: string;
  caseReference?: string;
  status?: "Logged" | "Under Review" | "Admitted";
  attachments?: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  createdAt?: string;
  updatedAt?: string;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } } };

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function Evidence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsList, setItemsList] = useState<LegalEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<LegalEvidence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const auth = getAuthState();
  const isAdminRole = auth.role === "admin" || auth.role === "super-admin" || auth.role === "manager";

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    evidenceType: string;
    dateAcquired: string;
    location: string;
    caseReference: string;
    status: string;
    attachments: Array<{ fileName: string; url: string; mimeType: string; size: number }>;
  }>({
    title: "",
    description: "",
    evidenceType: "Physical",
    dateAcquired: "",
    location: "",
    caseReference: "",
    status: "Logged",
    attachments: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await listResource<LegalEvidence>("legal/evidence");
      setItemsList(list);
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      evidenceType: "Physical",
      dateAcquired: "",
      location: "",
      caseReference: "",
      status: "Logged",
      attachments: []
    });
  };

  const handleAdd = async () => {
    try {
      setIsSubmitting(true);
      
      const payload: any = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === "") delete payload[k];
      });
      
      await createResource<LegalEvidence>("legal/evidence", payload);
      await loadData();
      setAddOpen(false);
      resetForm();
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to create"); }
    finally { setIsSubmitting(false); }
  };

  const handleEditOpen = (c: LegalEvidence) => {
    setSelectedItem(c);
    setFormData({
      title: c.title || "",
      description: c.description || "",
      evidenceType: c.evidenceType || "",
      dateAcquired: c.dateAcquired ? c.dateAcquired.split("T")[0] : "",
      location: c.location || "",
      caseReference: c.caseReference || "",
      status: c.status || "",
      attachments: c.attachments || []
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      const payload: any = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === "") delete payload[k];
      });
      await updateResource<LegalEvidence>("legal/evidence", selectedItem.id, payload);
      await loadData();
      setEditOpen(false);
      setSelectedItem(null);
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to update"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      await deleteResource("legal/evidence", selectedItem.id);
      await loadData();
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to delete"); }
    finally { setIsSubmitting(false); }
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

  const filteredItems = useMemo(() => {
    return itemsList.filter((c) => 
      JSON.stringify(c).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [itemsList, searchQuery]);

  const renderFormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Title *</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Title" required /></div>
      <div className="space-y-1 sm:col-span-2"><label className="text-xs font-medium text-slate-300">Description </label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24" placeholder="Description..." /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Evidence Type *</label><select value={formData.evidenceType} onChange={e => setFormData({...formData, evidenceType: e.target.value as any})} className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"><option value="Physical">Physical</option><option value="Digital">Digital</option><option value="Testimonial">Testimonial</option></select></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Date Acquired </label><input type="date" value={formData.dateAcquired} onChange={e => setFormData({...formData, dateAcquired: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Date Acquired"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Storage Location </label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Storage Location"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Case Reference </label><input type="text" value={formData.caseReference} onChange={e => setFormData({...formData, caseReference: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Case Reference"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Status </label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"><option value="Logged">Logged</option><option value="Under Review">Under Review</option><option value="Admitted">Admitted</option></select></div>
      
      {/* File Attachments (Admins/Super Admins only) */}
      {isAdminRole && (
        <div className="space-y-1.5 sm:col-span-2 border-t border-white/5 pt-3 mt-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" /> Attachments
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="file" 
              id="evidence-attachments-input" 
              multiple 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => document.getElementById("evidence-attachments-input")?.click()}
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
              <Scale className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Legal Evidence</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">Manage your evidence and associated metadata.</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Evidence</DialogTitle>
                <DialogDescription className="text-slate-400">Fill out the details to create a record.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
                {renderFormFields()}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
                <Button onClick={handleAdd} disabled={isSubmitting || uploadingFiles} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {isSubmitting ? "Saving..." : "Create Evidence"}
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
              type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-black/20 hover:bg-black/20">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">Evidence No.</TableHead>
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Evidence Type</TableHead>
                <TableHead className="text-slate-400">Storage Location</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/10"><TableCell colSpan={10} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={10} className="text-center py-8 text-slate-400">No records found.</TableCell></TableRow>
              ) : (
                filteredItems.map((c) => (
                  <TableRow key={c.id} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-sm text-slate-300">{c.evidenceNumber}</TableCell>
                    <TableCell className="font-medium text-white">{c.title}</TableCell>
                    <TableCell className="font-medium text-white">{c.evidenceType}</TableCell>
                    <TableCell className="text-slate-300">{c.location}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => { setSelectedItem(c); setViewOpen(true); }} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOpen(c)} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedItem(c); setDeleteOpen(true); }} className="text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>Edit Evidence {selectedItem?.evidenceNumber}</DialogTitle></DialogHeader>
          <div className="py-4">
            {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
            {renderFormFields()}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting || uploadingFiles} className="bg-blue-600 hover:bg-blue-500 text-white">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Evidence Details</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-slate-400">Evidence No.</div><div className="font-mono text-lg">{selectedItem.evidenceNumber}</div></div>
                <div><div className="text-xs text-slate-400">Title</div><div className="font-medium">{selectedItem.title || 'N/A'}</div></div>
                {selectedItem.description && (<div className="col-span-2"><div className="text-xs text-slate-400">Description</div><div className="text-sm bg-white/5 p-3 rounded-md mt-1 break-words">{selectedItem.description}</div></div>)}
                <div><div className="text-xs text-slate-400">Evidence Type</div><div className="font-medium">{selectedItem.evidenceType || 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Date Acquired</div><div>{selectedItem.dateAcquired ? new Date(selectedItem.dateAcquired).toLocaleDateString() : 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Storage Location</div><div className="font-medium">{selectedItem.location || 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Case Reference</div><div className="font-medium">{selectedItem.caseReference || 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Status</div><Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{selectedItem.status}</Badge></div>
              </div>
              
              {/* Show Attachments */}
              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Attachments
                  </div>
                  <div className="space-y-1.5">
                    {selectedItem.attachments.map((att, idx) => {
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
            <DialogTitle className="text-rose-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Delete Evidence</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">Are you sure you want to delete <strong>{selectedItem?.evidenceNumber}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleDelete} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-500 text-white border-0">{isSubmitting ? "Deleting..." : "Delete Permanently"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
