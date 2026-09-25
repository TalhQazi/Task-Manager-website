import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { KeyRound, ShieldCheck, Check, X, FileSignature } from "lucide-react";

interface ApprovalItem {
  id: string;
  requester: string;
  type: "Vendor Payment" | "Contract Sign-Off" | "New Hire Base";
  details: string;
  amount?: number;
  signersRequired: string[];
  signersApproved: string[];
  status: "Pending" | "Approved" | "Rejected";
}

const Approvals: React.FC = () => {
  const { stats, activeRole, activeEntity } = useAtlasBooks();
  const [items, setItems] = useState<ApprovalItem[]>([]);

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          // Verify if activeRole is required and add to signersApproved
          const isEligible = item.signersRequired.includes(activeRole);
          if (!isEligible && action === "Approved") {
            alert(`Access Denied: Your active role preview '${activeRole}' does not possess signing authority for this item. Switch roles in the header toolbar.`);
            return item;
          }

          let updatedSigners = [...item.signersApproved];
          if (action === "Approved" && !updatedSigners.includes(activeRole)) {
            updatedSigners.push(activeRole);
          }

          // Check if all required signers have approved
          const isFullyApproved = item.signersRequired.every(r => updatedSigners.includes(r));

          return {
            ...item,
            signersApproved: updatedSigners,
            status: action === "Rejected" ? "Rejected" : isFullyApproved ? "Approved" : "Pending"
          };
        }
        return item;
      })
    );
  };

  const pendingCount = items.filter(i => i.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Approval Chains & Sign-Offs
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Active validation parameters for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 font-mono">
          Signature Permission: <strong className="text-amber-400">{activeRole}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Awaiting Validation" value={pendingCount} icon={FileSignature} subtitle="Verification queues pending signature" />
        <KpiCard title="Group Ledger Check" value={stats.integrityScore} icon={ShieldCheck} subtitle="Current integrity metrics" />
        <KpiCard title="Active Signer Role" value={activeRole} icon={KeyRound} subtitle="Header controls update credentials" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Pending Validation Requests
        </h3>

        <div className="space-y-4">
          {items.map((item) => {
            const progress = (item.signersApproved.length / item.signersRequired.length) * 100;
            return (
              <div key={item.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold text-zinc-200 font-mono">{item.type}</span>
                  </div>
                  
                  <p className="text-xs text-zinc-350">{item.details}</p>
                  
                  <div className="flex items-center space-x-4 text-[10px] text-zinc-500 font-mono">
                    <span>Requested by: <strong className="text-zinc-400">{item.requester}</strong></span>
                    {item.amount && <span>Allocation: <strong className="text-amber-400">${item.amount.toLocaleString()}</strong></span>}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] text-zinc-500 font-mono mr-1">Sign-Off Matrix:</span>
                    {item.signersRequired.map((role) => {
                      const hasApproved = item.signersApproved.includes(role);
                      return (
                        <span key={role} className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                          hasApproved 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                        }`}>
                          {role} {hasApproved ? "✓" : "⏳"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between min-h-full gap-3">
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                    item.status === "Approved" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : item.status === "Rejected"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {item.status}
                  </span>

                  {item.status === "Pending" && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAction(item.id, "Rejected")}
                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-rose-500/50 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(item.id, "Approved")}
                        className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>AUTHORIZE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Approvals;
