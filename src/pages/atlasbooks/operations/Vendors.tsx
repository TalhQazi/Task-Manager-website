import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, Briefcase, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

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
  const { stats, activeEntity } = useAtlasBooks();
  const [filterVerified, setFilterVerified] = useState("all");

  const ledger: VendorLedger[] = [
    { id: "VND-001", name: "Global Cloud Services", invoiceNo: "INV-9098", amount: 14200, dueDate: "2026-06-15", bankVerified: true, status: "Outstanding" },
    { id: "VND-002", name: "Cyber Security Labs", invoiceNo: "INV-8742", amount: 8900, dueDate: "2026-06-10", bankVerified: false, status: "Outstanding" },
    { id: "VND-003", name: "Modern Office Rentals", invoiceNo: "INV-1120", amount: 24500, dueDate: "2026-06-01", bankVerified: true, status: "Paid" },
    { id: "VND-004", name: "Power Grid Utility", invoiceNo: "INV-5411", amount: 3800, dueDate: "2026-06-12", bankVerified: true, status: "Outstanding" },
    { id: "VND-005", name: "Express Shipping Corp", invoiceNo: "INV-0911", amount: 1540, dueDate: "2026-06-20", bankVerified: true, status: "Disputed" }
  ];

  const totalOutstanding = ledger.filter(v => v.status === "Outstanding").reduce((sum, e) => sum + e.amount, 0);

  const filteredLedger = ledger.filter(v => {
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

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
          <button onClick={() => setFilterVerified("all")} className={`px-3 py-1.5 rounded-md transition-all ${filterVerified === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            All Vendors
          </button>
          <button onClick={() => setFilterVerified("verified")} className={`px-3 py-1.5 rounded-md transition-all ${filterVerified === "verified" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            Verified Routing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Accounts Payable (AP)" value={stats.accountsPayable} icon={Landmark} subtitle="Aging balance total" />
        <KpiCard title="Outstanding Invoices" value={totalOutstanding} icon={FileText} subtitle="Awaiting bank authorization" />
        <KpiCard title="Verified Vendor Rate" value={`${Math.round((ledger.filter(v => v.bankVerified).length / ledger.length) * 100)}%`} icon={Briefcase} subtitle="Secured banking credentials" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Vendor Accounts Ledger Detail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-400 font-mono">
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
              {filteredLedger.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">{v.name}</td>
                  <td className="py-3 text-zinc-500">{v.invoiceNo}</td>
                  <td className="py-3">{v.dueDate}</td>
                  <td className="py-3">
                    {v.bankVerified ? (
                      <span className="flex items-center text-emerald-400 text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Checked
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-400 text-[10px]">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 animate-pulse" /> UNVERIFIED
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
                          : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
