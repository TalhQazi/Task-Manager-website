import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { AlertOctagon, Check, ShieldAlert, DollarSign } from "lucide-react";

interface DuplicatePayment {
  invoiceNo: string;
  vendor: string;
  amount: number;
  payoutDate1: string;
  payoutDate2: string;
  resolved: boolean;
}

const DuplicatePayments: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [duplicates, setDuplicates] = useState<DuplicatePayment[]>([]);

  const handleResolve = (invoiceNo: string) => {
    setDuplicates(prev =>
      prev.map(d => (d.invoiceNo === invoiceNo ? { ...d, resolved: true } : d))
    );
  };

  const activeCount = duplicates.filter(d => !d.resolved).length;
  const totalWasted = duplicates.filter(d => !d.resolved).reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertOctagon className="w-5 h-5 text-amber-500 mr-2" />
          Duplicate Payments Audit Center
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Double-billing reconciliation for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Duplicate Incidents" value={`${activeCount} Events`} icon={ShieldAlert} subtitle="Exceeds duplicate match score thresholds" />
        <KpiCard title="Potential double-billing total" value={totalWasted} icon={DollarSign} subtitle="Amounts flagged for recovery" />
        <KpiCard title="Reconciliation Status" value="Auto-flagging active" icon={Check} subtitle="Ledger crawler active" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Identified Duplicate Payment Matches
        </h3>

        <div className="space-y-4">
          {duplicates.map((dup) => (
            <div key={dup.invoiceNo} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Invoice: {dup.invoiceNo}
                  </span>
                  <span className="text-rose-400 text-[10px] font-mono font-bold">MATCH DETECTED</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Double payout processed to: {dup.vendor}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>Tx 1: {dup.payoutDate1}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Tx 2: {dup.payoutDate2}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-white mr-4">${dup.amount.toLocaleString()}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  dup.resolved 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {dup.resolved ? "Refund Reconciled" : "Action Required"}
                </span>

                {!dup.resolved && (
                  <button
                    onClick={() => handleResolve(dup.invoiceNo)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>CLAIM REFUND</span>
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

export default DuplicatePayments;
