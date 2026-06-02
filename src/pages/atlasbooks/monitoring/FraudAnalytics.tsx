import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { ShieldAlert, ShieldCheck, AlertOctagon, Check, Search } from "lucide-react";

interface FraudItem {
  id: string;
  source: string;
  description: string;
  amount: number;
  probability: number; // percentage risk
  status: "Flagged" | "Investigating" | "Cleared";
}

const FraudAnalytics: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [items, setItems] = useState<FraudItem[]>([
    { id: "FRD-101", source: "A/P Wire Transfer", description: "Out-of-band banking details change for Cyberdyne", amount: 145000, probability: 94.2, status: "Flagged" },
    { id: "FRD-102", source: "Corporate Card Sync", description: "CTO card swipe: multiple micro-charges in London", amount: 120, probability: 68.5, status: "Investigating" },
    { id: "FRD-103", source: "Invoice OCR Scan", description: "Duplicate billing scan: invoice VND-9081 re-submitted", amount: 4250, probability: 89.0, status: "Flagged" },
    { id: "FRD-104", source: "Payroll Audit", description: "Salary payout mismatch for Marcus Wright", amount: 5500, probability: 45.1, status: "Cleared" }
  ]);

  const handleResolve = (id: string) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, status: "Cleared" } : i))
    );
  };

  const flaggedCount = items.filter(i => i.status !== "Cleared").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertOctagon className="w-5 h-5 text-amber-500 mr-2" />
          Fraud Analytics & Ledger Auditing
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Machine Learning transactional anomaly metrics for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Fraud Logs" value={`${flaggedCount} Events`} icon={ShieldAlert} subtitle="Requiring executive audit clearance" />
        <KpiCard title="Ledger Verification" value="99.2%" icon={ShieldCheck} subtitle="Cross-reconciliation audit level" />
        <KpiCard title="Audit Score" value={`${stats.integrityScore}%`} icon={Landmark} subtitle="Financial Integrity Score" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Flagged Fraud Risk Entries
        </h3>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    {item.id}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.source}</span>
                </div>
                
                <p className="text-xs text-zinc-200 font-bold">{item.description}</p>
                
                <div className="flex items-center space-x-4 text-[10px] text-zinc-500 font-mono">
                  <span>Probability: <strong className="text-amber-400">{item.probability}% Risk</strong></span>
                  <span>Amount: <strong className="text-white">${item.amount.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  item.status === "Cleared" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : item.status === "Investigating"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {item.status}
                </span>

                {item.status !== "Cleared" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResolve(item.id)}
                      className="flex items-center space-x-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-zinc-500" />
                      <span>INVESTIGATE</span>
                    </button>
                    <button
                      onClick={() => handleResolve(item.id)}
                      className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>RESOLVE</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FraudAnalytics;
