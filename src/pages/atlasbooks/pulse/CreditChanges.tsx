import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, ShieldCheck, Check } from "lucide-react";

interface CreditScoreChange {
  id: string;
  agency: "Dun & Bradstreet" | "Experian Business" | "Fitch Rating";
  change: string;
  previous: string;
  current: string;
  date: string;
  resolved: boolean;
}

const CreditChanges: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [logs, setLogs] = useState<CreditScoreChange[]>([]);

  const handleResolve = (id: string) => {
    setLogs(prev =>
      prev.map(l => (l.id === id ? { ...l, resolved: true } : l))
    );
  };

  const activeCount = logs.filter(l => !l.resolved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Bureau Credit Rating Adjustments
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Credit indexes and ratings updates for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Score Changes" value={`${activeCount} Index Shifts`} icon={TrendingUp} subtitle="D&B and Fitch agency checks" />
        <KpiCard title="Corporate Score" value={stats.creditScore || "N/A"} icon={Landmark} subtitle="Average credit rating" />
        <KpiCard title="Audit Clearance" value={logs.length > 0 ? "AAA Score" : "N/A"} icon={ShieldCheck} subtitle="Current solvency classification" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Bureau Rating Shift Logs
        </h3>

        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    Ref: {log.id}
                  </span>
                  <span className="text-amber-400 text-[10px] font-mono font-bold">{log.agency}</span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">Credit variance: {log.change}</p>
                <div className="flex items-center space-x-4 text-[10px] text-zinc-500 font-mono">
                  <span>Previous: <strong className="text-zinc-400">{log.previous}</strong></span>
                  <span>Current: <strong className="text-white">{log.current}</strong></span>
                  <span>Date: {log.date}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  log.resolved 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                }`}>
                  {log.resolved ? "Acknowledged" : "Review Required"}
                </span>

                {!log.resolved && (
                  <button
                    onClick={() => handleResolve(log.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ACKNOWLEDGE</span>
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

export default CreditChanges;
