import React, { useState, useEffect } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, Briefcase, FileText, CheckCircle2, ShieldAlert, Plus, X, ArrowRight, UserPlus } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "sonner";

interface VendorLedger {
  id: string;
  name: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  bankVerified: boolean;
  status: "Paid" | "Outstanding" | "Disputed";
}

const Vendors: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [filterVerified, setFilterVerified] = useState("all");
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Unpaid" | "Paid" | "Partially Paid" | "Overdue">("Unpaid");
  
  // Inline vendor creation form inside modal
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorServiceType, setNewVendorServiceType] = useState("Maintenance");
  const [newVendorStatus, setNewVendorStatus] = useState<"approved" | "not-approved">("approved");
  const [newVendorNotes, setNewVendorNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resBills, resVendors] = await Promise.all([
        apiFetch<{ success: boolean; items: any[] }>("/api/atlasbook/bills"),
        apiFetch<{ success?: boolean; items?: any[] } | any[]>("/api/vendors")
      ]);

      setBills(resBills.items || []);
      
      // Only vendors already approved on the Vendors page are usable here
      const allVendors = Array.isArray(resVendors) ? resVendors : (resVendors.items || []);
      const vendorList = allVendors.filter((v: any) => v.status === "approved");
      setVendors(vendorList);
      if (vendorList.length > 0) {
        setSelectedVendorId(vendorList[0]._id);
      }
    } catch (error: any) {
      toast.error("Failed to load accounts ledger: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVendor = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorPhone) {
      toast.error("Vendor name and phone number are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: newVendorName,
        phone: newVendorPhone,
        email: newVendorEmail,
        serviceType: newVendorServiceType,
        status: newVendorStatus,
        notes: newVendorNotes
      };

      const res = await apiFetch<{ item: any }>("/api/vendors", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const newVendor = res.item || res;
      toast.success(`Vendor "${newVendorName}" registered successfully.`);
      
      // Refresh vendor list (approved vendors only)
      const freshVendorsRes = await apiFetch<{ success?: boolean; items?: any[] } | any[]>("/api/vendors");
      const freshAll = Array.isArray(freshVendorsRes) ? freshVendorsRes : (freshVendorsRes.items || []);
      const freshVendors = freshAll.filter((v: any) => v.status === "approved");
      setVendors(freshVendors);
      if (freshVendors.some((v: any) => v._id === newVendor._id)) {
        setSelectedVendorId(newVendor._id);
      }

      // Reset vendor fields and close sub-form
      setNewVendorName("");
      setNewVendorPhone("");
      setNewVendorEmail("");
      setNewVendorServiceType("Maintenance");
      setNewVendorStatus("approved");
      setNewVendorNotes("");
      setShowNewVendorForm(false);
    } catch (error: any) {
      toast.error("Failed to register vendor: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !billNumber || !amount) {
      toast.error("Vendor, bill number, and amount are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vendor: selectedVendorId,
        billNumber,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        status,
        description
      };

      await apiFetch("/api/atlasbook/bills", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Vendor bill recorded successfully.");
      setShowAddModal(false);
      
      // Reset form
      setBillNumber("");
      setAmount("");
      setDueDate("");
      setDescription("");
      setStatus("Unpaid");

      fetchData();
    } catch (error: any) {
      toast.error("Failed to record bill: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Map backend bills to front-end schema
  const mappedLedger: VendorLedger[] = bills.map(b => {
    const vName = b.vendor && typeof b.vendor === "object" ? b.vendor.name : "Unknown Vendor";
    const verified = b.vendor && typeof b.vendor === "object" ? b.vendor.status === "approved" : false;
    const statusMapped = b.status === "Paid" ? "Paid" : b.status === "Overdue" ? "Disputed" : "Outstanding";

    return {
      id: b._id,
      name: vName,
      invoiceNo: b.billNumber || "---",
      amount: b.amount || 0,
      dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : "N/A",
      bankVerified: verified,
      status: statusMapped
    };
  });

  const accountsPayable = mappedLedger.filter(v => v.status !== "Paid").reduce((sum, e) => sum + e.amount, 0);
  const totalOutstanding = mappedLedger.filter(v => v.status === "Outstanding").reduce((sum, e) => sum + e.amount, 0);
  const totalVerified = mappedLedger.filter(v => v.bankVerified).length;
  const verifiedVendorRate = mappedLedger.length > 0 ? Math.round((totalVerified / mappedLedger.length) * 100) : 0;

  const filteredLedger = mappedLedger.filter(v => {
    if (filterVerified === "verified") return v.bankVerified;
    if (filterVerified === "unverified") return !v.bankVerified;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Vendor Accounts Payable (A/P)
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Vendor accounts and billing details for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button onClick={() => setFilterVerified("all")} className={`px-3 py-1.5 rounded-md transition-all ${filterVerified === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
              All Vendors
            </button>
            <button onClick={() => setFilterVerified("verified")} className={`px-3 py-1.5 rounded-md transition-all ${filterVerified === "verified" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
              Verified Routing
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10 transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Bill</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <KpiCard title="Accounts Payable (AP)" value={accountsPayable} icon={Landmark} subtitle="Aging balance total" />
            <KpiCard title="Outstanding Invoices" value={totalOutstanding} icon={FileText} subtitle="Awaiting bank authorization" />
            <KpiCard title="Verified Vendor Rate" value={`${verifiedVendorRate}%`} icon={Briefcase} subtitle="Secured banking credentials" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
              Vendor Accounts Ledger Detail
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-450 font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5">Vendor Name</th>
                    <th className="py-2.5">Invoice Reference</th>
                    <th className="py-2.5">Due Date</th>
                    <th className="py-2.5">Routing Verification</th>
                    <th className="py-2.5 text-right">Invoice Amount</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-500">
                        No vendor ledger entries found. Click "Record Bill" to log a new invoice.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3 text-zinc-200 font-bold">{v.name}</td>
                        <td className="py-3 text-zinc-500">{v.invoiceNo}</td>
                        <td className="py-3 text-zinc-400">{v.dueDate}</td>
                        <td className="py-3">
                          {v.bankVerified ? (
                            <span className="flex items-center text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Approved
                            </span>
                          ) : (
                            <span className="flex items-center text-rose-450 text-[10px] font-bold">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> UNVERIFIED
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-white">${v.amount.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            v.status === "Paid" 
                              ? "bg-emerald-500/15 text-emerald-400" 
                              : v.status === "Outstanding"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-rose-500/15 text-rose-450"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Record Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Record Vendor Bill (A/P)</span>
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setShowNewVendorForm(false);
                }}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Dynamic vendor selector */}
              {!showNewVendorForm ? (
                <div className="space-y-1.5 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Select Active Vendor *</label>
                    <button
                      type="button"
                      onClick={() => setShowNewVendorForm(true)}
                      className="text-amber-500 hover:text-amber-400 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New Vendor</span>
                    </button>
                  </div>
                  {vendors.length === 0 ? (
                    <p className="text-zinc-500 mt-2">No vendors registered. Click the link above to add one.</p>
                  ) : (
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    >
                      {vendors.map((v) => (
                        <option key={v._id} value={v._id}>{v.name} ({v.serviceType}) [{v.status === "approved" ? "Verified" : "Unverified"}]</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                /* Inline Vendor Creation form */
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-amber-500/20 space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                    <h3 className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">Register New Vendor</h3>
                    <button
                      type="button"
                      onClick={() => setShowNewVendorForm(false)}
                      className="text-zinc-500 hover:text-zinc-300 font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Vendor Name *</label>
                      <input
                        type="text"
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        placeholder="e.g. Acme Maintenance Corp"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Phone *</label>
                      <input
                        type="text"
                        value={newVendorPhone}
                        onChange={(e) => setNewVendorPhone(e.target.value)}
                        placeholder="e.g. 555-0199"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Email</label>
                      <input
                        type="email"
                        value={newVendorEmail}
                        onChange={(e) => setNewVendorEmail(e.target.value)}
                        placeholder="e.g. billing@acme.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Service Classification</label>
                      <input
                        type="text"
                        value={newVendorServiceType}
                        onChange={(e) => setNewVendorServiceType(e.target.value)}
                        placeholder="e.g. Security, Utility, Cleaning"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Routing Verification</label>
                      <select
                        value={newVendorStatus}
                        onChange={(e) => setNewVendorStatus(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500/40"
                      >
                        <option value="approved">Verified Approved</option>
                        <option value="not-approved">Unverified / Pending</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCreateVendor}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2 rounded-lg font-bold transition-colors cursor-pointer mt-2"
                  >
                    {submitting ? "Registering Vendor..." : "Register Vendor & Continue"}
                  </button>
                </div>
              )}

              {/* Bill Details */}
              <form onSubmit={handleCreateBill} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Bill Number / Invoice Ref *</label>
                    <input
                      type="text"
                      required
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      placeholder="e.g. INV-9098"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Bill Amount ($) *</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 14200"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Payment Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    >
                      <option value="Unpaid">Unpaid / Outstanding</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue / Disputed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Description / Memo</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Monthly server capacity wires, Q2 office rents..."
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center space-x-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || showNewVendorForm || vendors.length === 0}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-lg font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Recording..." : "Record Bill"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
