import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/admin/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/admin/ui/dialog";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { createResource, deleteResource, listResource, updateResource } from "@/lib/admin/apiClient";

interface LegalDeadline {
  id: string;
  deadlineNumber: string;
  title: string;
  description?: string;
  dueDate?: string;
  caseReference?: string;
  assignedTo?: string;
  status?: "Pending" | "Met" | "Missed";
  priority?: "Low" | "Medium" | "High" | "Critical";
  createdAt?: string;
  updatedAt?: string;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } } };

export default function Deadlines() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsList, setItemsList] = useState<LegalDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<LegalDeadline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    caseReference: "",
    assignedTo: "",
    status: "Pending",
    priority: "Medium"
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await listResource<LegalDeadline>("legal/deadlines");
      setItemsList(list);
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setFormData({
    title: "",
    description: "",
    dueDate: "",
    caseReference: "",
    assignedTo: "",
    status: "Pending",
    priority: "Medium"
    });
  };

  const handleAdd = async () => {
    try {
      setIsSubmitting(true);
      
      const payload: any = { ...formData };
      Object.keys(payload).forEach(k => {
        if (payload[k] === "") delete payload[k];
      });
      
      await createResource<LegalDeadline>("legal/deadlines", payload);
      await loadData();
      setAddOpen(false);
      resetForm();
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to create"); }
    finally { setIsSubmitting(false); }
  };

  const handleEditOpen = (c: LegalDeadline) => {
    setSelectedItem(c);
    setFormData({
      title: c.title || "",
      description: c.description || "",
      dueDate: c.dueDate ? c.dueDate.split("T")[0] : "",
      caseReference: c.caseReference || "",
      assignedTo: c.assignedTo || "",
      status: c.status || "",
      priority: c.priority || ""
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
      await updateResource<LegalDeadline>("legal/deadlines", selectedItem.id, payload);
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
      await deleteResource("legal/deadlines", selectedItem.id);
      await loadData();
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (e) { setApiError(e instanceof Error ? e.message : "Failed to delete"); }
    finally { setIsSubmitting(false); }
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
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Due Date </label><input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Due Date"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Case Reference </label><input type="text" value={formData.caseReference} onChange={e => setFormData({...formData, caseReference: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Case Reference"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Assigned To </label><input type="text" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Assigned To"  /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Status </label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"><option value="Pending">Pending</option><option value="Met">Met</option><option value="Missed">Missed</option></select></div>
      <div className="space-y-1"><label className="text-xs font-medium text-slate-300">Priority </label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full rounded-md border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
    </div>
  );

  return (
    <motion.div className="pl-12 pr-2 sm:pr-0 pb-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-transparent p-6 border border-white/10">
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Legal Deadlines</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">Manage your deadlines and associated metadata.</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Deadline
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Deadline</DialogTitle>
                <DialogDescription className="text-slate-400">Fill out the details to create a record.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
                {renderFormFields()}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
                <Button onClick={handleAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {isSubmitting ? "Saving..." : "Create Deadline"}
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
                <TableHead className="text-slate-400">Deadline No.</TableHead>
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Due Date</TableHead>
                <TableHead className="text-slate-400">Case Reference</TableHead>
                <TableHead className="text-slate-400">Assigned To</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Priority</TableHead>
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
                    <TableCell className="font-mono text-sm text-slate-300">{c.deadlineNumber}</TableCell>
                    <TableCell className="font-medium text-white">{c.title}</TableCell>
                    <TableCell className="text-slate-300">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-slate-300">{c.caseReference}</TableCell>
                    <TableCell className="text-slate-300">{c.assignedTo}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{c.status}</Badge></TableCell>
                    <TableCell className="text-slate-300">{c.priority}</TableCell>
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
          <DialogHeader><DialogTitle>Edit Deadline {selectedItem?.deadlineNumber}</DialogTitle></DialogHeader>
          <div className="py-4">
            {apiError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">{apiError}</div>}
            {renderFormFields()}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="hover:bg-white/10 text-white">Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Deadline Details</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-slate-400">Deadline No.</div><div className="font-mono text-lg">{selectedItem.deadlineNumber}</div></div>
                <div><div className="text-xs text-slate-400">Title</div><div className="font-medium">{selectedItem.title || 'N/A'}</div></div>
                {selectedItem.description && (<div><div className="text-xs text-slate-400">Description</div><div className="text-sm bg-white/5 p-3 rounded-md mt-1">{selectedItem.description}</div></div>)}
                <div><div className="text-xs text-slate-400">Due Date</div><div>{selectedItem.dueDate ? new Date(selectedItem.dueDate).toLocaleDateString() : 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Case Reference</div><div className="font-medium">{selectedItem.caseReference || 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Assigned To</div><div className="font-medium">{selectedItem.assignedTo || 'N/A'}</div></div>
                <div><div className="text-xs text-slate-400">Status</div><Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{selectedItem.status}</Badge></div>
                <div><div className="text-xs text-slate-400">Priority</div><div className="font-medium">{selectedItem.priority || 'N/A'}</div></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#0f172a] border-rose-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Delete Deadline</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">Are you sure you want to delete <strong>{selectedItem?.deadlineNumber}</strong>? This cannot be undone.</DialogDescription>
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
