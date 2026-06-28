import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { AlertTriangle, ShieldCheck, Box, Check, Landmark } from "lucide-react";

interface NewLienAlert {
  id: string;
  property: string;
  claimant: string;
  amount: number;
  filedDate: string;
  countyRef: string;
  resolved: boolean;
}

const NewLiens: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [liens, setLiens] = useState<NewLienAlert[]>([]);

  const handleResolve = (id: string) => {
    setLiens(prev =>
      prev.map(l => (l.id === id ? { ...l, resolved: true } : l))
    );
  };

  const activeCount = liens.filter(l => !l.resolved).length;
  const totalClaims = liens.filter(l => !l.resolved).reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 animate-pulse" />
          New Property Liens Register
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Property title encumbrance alerts for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Liens" value={`${activeCount} Claims`} icon={AlertTriangle} subtitle="Unreleased property encumbrances" />
        <KpiCard title="Total Claims Value" value={totalClaims} icon={Landmark} subtitle="Amount required to discharge claims" />
        <KpiCard title="Title Status" value={liens.length > 0 ? "County monitored" : "N/A"} icon={ShieldCheck} subtitle="Automatic deed lock active" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          New County Court Lien Filings
        </h3>

        <div className="space-y-4">
          {liens.map((lien) => (
            <div key={lien.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Ref: {lien.id}
                  </span>
                  <span className="text-rose-400 text-[10px] font-mono font-bold">NEW ENCUMBRANCE EXCEPTION</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Claimant: {lien.claimant} against {lien.property}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>Filed Date: {lien.filedDate}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>County Record ID: {lien.countyRef}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-white mr-4">${lien.amount.toLocaleString()}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  lien.resolved 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {lien.resolved ? "Surety Bond Released" : "Deed Encumbered"}
                </span>

                {!lien.resolved && (
                  <button
                    onClick={() => handleResolve(lien.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>BOND & DISCHARGE LIEN</span>
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

export default NewLiens;
