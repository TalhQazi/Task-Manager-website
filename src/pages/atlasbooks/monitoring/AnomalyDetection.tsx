import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { ShieldCheck, ShieldAlert, Sparkles, Activity, Check } from "lucide-react";

interface AnomalyLog {
  id: string;
  source: string;
  pattern: string;
  severity: "Critical" | "Warning" | "Low";
  status: "Active" | "Investigated" | "Muted";
}

const AnomalyDetection: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [logs, setLogs] = useState<AnomalyLog[]>([
    { id: "AML-991", source: "A/P Payout Ledger", pattern: "Sudden spike in recurring vendor payment amounts (+200%)", severity: "Critical", status: "Active" },
    { id: "AML-992", source: "Security Audit Log", pattern: "Multiple credential edits from unauthorized geographic IPs", severity: "Warning", status: "Investigated" },
    { id: "AML-993", source: "Expense Sync", pattern: "Off-hours booking charges recorded on corporate ledger cards", severity: "Low", status: "Active" }
  ]);

  const handleMute = (id: string) => {
    setLogs(prev =>
      prev.map(l => (l.id === id ? { ...l, status: "Muted" } : l))
    );
  };

  const activeCount = logs.filter(l => l.status === "Active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
          Machine Learning Anomaly Detection
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Pattern detection models for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active ML Flags" value={`${activeCount} Flags`} icon={ShieldAlert} subtitle="Outliers exceeding standard deviation threshold" />
        <KpiCard title="Model Training Accuracy" value="99.4%" icon={ShieldCheck} subtitle="Supervised pattern match index" />
        <KpiCard title="Integrity Score" value={`${stats.integrityScore}%`} icon={Activity} subtitle="Combined ledger trust index" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Neural-Network Transaction Outlier Logs
        </h3>

        <div className="space-y-4">
          {logs.map((l) => (
            <div key={l.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    {l.id}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{l.source}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                    l.severity === "Critical" ? "bg-rose-500/10 text-rose-455" : "bg-amber-500/10 text-amber-455"
                  }`}>
                    {l.severity} Risk
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-bold">{l.pattern}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  l.status === "Muted" 
                    ? "bg-zinc-800 text-zinc-500" 
                    : l.status === "Investigated"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400 animate-pulse"
                }`}>
                  {l.status}
                </span>

                {l.status === "Active" && (
                  <button
                    onClick={() => handleMute(l.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>MUTE ALERT</span>
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

export default AnomalyDetection;
