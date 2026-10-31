import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, AlertTriangle, ShieldCheck, Check } from "lucide-react";

interface DeclineAlert {
  id: string;
  source: string;
  trigger: string;
  variance: string;
  status: "Active" | "Acknowledged" | "Swept";
}

const CashDeclines: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [alerts, setAlerts] = useState<DeclineAlert[]>([]);

  const handleSweep = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: "Swept" } : a))
    );
  };

  const activeCount = alerts.filter(a => a.status === "Active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
          Cash Position Decline Warnings
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Liquidity warning triggers for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Cash Dips" value={`${activeCount} Warnings`} icon={AlertTriangle} subtitle="Exceeds 10% cash decline variance" />
        <KpiCard title="Group Cash Position" value={stats.cashPosition || 0} icon={Landmark} subtitle="Consolidated pool cash" />
        <KpiCard title="Buffer Protection" value={alerts.length > 0 ? "Active sweep" : "N/A"} icon={ShieldCheck} subtitle="Automatic intercompany refills" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Liquidity Level Depletion Logs
        </h3>

        <div className="space-y-4">
          {alerts.map((al) => (
            <div key={al.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Ref: {al.id}
                  </span>
                  <span className="text-rose-450 text-[10px] font-mono font-bold">BURN RUNWAY LIMIT EXCEEDED</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Decline trigger: {al.trigger} ({al.source})</p>
                <span className="text-[10px] text-zinc-500 font-mono block">Variance check: {al.variance}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  al.status === "Swept" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {al.status}
                </span>

                {al.status !== "Swept" && (
                  <button
                    onClick={() => handleSweep(al.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>TRIGGER SWEEP REFILL</span>
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

export default CashDeclines;
