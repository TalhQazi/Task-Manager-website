import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, ShieldAlert, KeyRound, CheckCircle2, Check } from "lucide-react";

interface VendorAnomalyItem {
  id: string;
  vendor: string;
  anomalyType: "Routing Code Change" | "No Contract Uploaded" | "New Payout Bank Country";
  flagDate: string;
  resolved: boolean;
}

const VendorAnomalies: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [anomalies, setAnomalies] = useState<VendorAnomalyItem[]>([]);

  const handleResolve = (id: string) => {
    setAnomalies(prev =>
      prev.map(a => (a.id === id ? { ...a, resolved: true } : a))
    );
  };

  const activeCount = anomalies.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <ShieldAlert className="w-5 h-5 text-amber-500 mr-2 animate-pulse" />
          Vendor Compliance Anomalies
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Vendor payment credentials checks for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Compliance Flags" value={`${activeCount} Flags`} icon={ShieldAlert} subtitle="Uncontracted routing shifts" />
        <KpiCard title="Verified Vendor Rate" value="88%" icon={CheckCircle2} subtitle="Passed legal contracts checks" />
        <KpiCard title="Regulatory compliance" value="Level 4 Safe" icon={KeyRound} subtitle="System security lock active" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Vendor Operational Integrity Alerts
        </h3>

        <div className="space-y-4">
          {anomalies.map((anom) => (
            <div key={anom.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Ref: {anom.id}
                  </span>
                  <span className="text-rose-400 text-[10px] font-mono font-bold">ROUTING EXCEPTION FLAG</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Vendor alert: {anom.anomalyType} (Merchant: {anom.vendor})</p>
                <span className="text-[10px] text-zinc-500 font-mono block">Registered date: {anom.flagDate}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  anom.resolved 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {anom.resolved ? "Ledger Cleared" : "Wire Blocked"}
                </span>

                {!anom.resolved && (
                  <button
                    onClick={() => handleResolve(anom.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>VERIFY & RELEASE WIRE</span>
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

export default VendorAnomalies;
