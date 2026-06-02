import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { CreditCard, FileImage, ShieldCheck, Check } from "lucide-react";

interface MissingReceipt {
  id: string;
  employee: string;
  merchant: string;
  amount: number;
  date: string;
  resolved: boolean;
}

const MissingReceipts: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [receipts, setReceipts] = useState<MissingReceipt[]>([
    { id: "MR-201", employee: "John Connor (Ops)", merchant: "Uber Ride NY", amount: 48.50, date: "2026-06-02", resolved: false },
    { id: "MR-202", employee: "Sarah Connor (Eng)", merchant: "Github Seats Subscription", amount: 120.00, date: "2026-05-28", resolved: false }
  ]);

  const handleResolve = (id: string) => {
    setReceipts(prev =>
      prev.map(r => (r.id === id ? { ...r, resolved: true } : r))
    );
  };

  const activeCount = receipts.filter(r => !r.resolved).length;
  const totalOutstanding = receipts.filter(r => !r.resolved).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Missing Receipts Queue
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Unmatched corporate card overhead for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Missing Attachments" value={`${activeCount} Expenses`} icon={CreditCard} subtitle="Card sync transactions lacking receipts" />
        <KpiCard title="Outstanding Audit Value" value={totalOutstanding} icon={FileImage} subtitle="Lacks tax deduction proof" />
        <KpiCard title="Audit compliance" value="Auto-flagging active" icon={ShieldCheck} subtitle="Matching crawler active" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Card Transactions Awaiting Receipt Files
        </h3>

        <div className="space-y-4">
          {receipts.map((rec) => (
            <div key={rec.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Ref: {rec.id}
                  </span>
                  <span className="text-amber-400 text-[10px] font-mono font-bold">AUDIT EXEMPTION FLAG</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Merchant charge: {rec.merchant} (Charged by {rec.employee})</p>
                <span className="text-[10px] text-zinc-500 font-mono block">Transaction Date: {rec.date}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-white mr-4">${rec.amount.toFixed(2)}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  rec.resolved 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                }`}>
                  {rec.resolved ? "Matched Reconciled" : "Receipt Awaiting"}
                </span>

                {!rec.resolved && (
                  <button
                    onClick={() => handleResolve(rec.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>UPLOAD RECEIPT</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissingReceipts;
