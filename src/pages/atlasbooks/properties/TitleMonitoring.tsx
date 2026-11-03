import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2 } from "lucide-react";

interface TitleDeed {
  property: string;
  deedId: string;
  mortgageLender: string;
  lastSearch: string;
  countyRecord: "Secured" | "Alert Pending" | "Disputed";
}

const TitleMonitoring: React.FC = () => {
  const { activeEntity } = useAtlasBooks();

  const deeds: TitleDeed[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Title Deed & Deed Integrity Monitoring
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          County records tracking and deed safety index for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Monitored Deeds" value={`${deeds.length} Assets`} icon={ShieldCheck} subtitle="County recorder registries locked" />
        <KpiCard title="Active Title Warnings" value="1 Warning" icon={ShieldAlert} subtitle="DTLA Center Plaza Tower" />
        <KpiCard title="Registry Integrity Score" value="98 / 100" icon={KeyRound} subtitle="Secured deed verification index" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          County Title Deed Registries Status
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Asset Location</th>
                <th className="py-2.5">County Registry ID</th>
                <th className="py-2.5">Mortgage Underwriter</th>
                <th className="py-2.5">Last Record Search</th>
                <th className="py-2.5 text-right">County Record Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {deeds.map((d, idx) => (
                <tr key={idx} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">{d.property}</td>
                  <td className="py-3 text-zinc-550">{d.deedId}</td>
                  <td className="py-3 text-zinc-400">{d.mortgageLender}</td>
                  <td className="py-3 text-zinc-500">{d.lastSearch}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center ${
                      d.countyRecord === "Secured" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : "bg-rose-500/15 text-rose-400 animate-pulse"
                    }`}>
                      {d.countyRecord === "Secured" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Safe
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3 mr-1" /> Record Alert
                        </>
                      )}
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

export default TitleMonitoring;
