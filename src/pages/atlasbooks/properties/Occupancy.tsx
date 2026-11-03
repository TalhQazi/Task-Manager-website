import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";

interface RolloverSchedule {
  tenant: string;
  property: string;
  unitNo: string;
  expiration: string;
  risk: "Low" | "Medium" | "High";
}

const Occupancy: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();

  const rollovers: RolloverSchedule[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Occupancy & Rollover Risk
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Lease expiration risk analysis for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Portfolio Occupancy" value={rollovers.length > 0 ? "91.4%" : "0%"} icon={ShieldCheck} subtitle="Target: 95.0% threshold" />
        <KpiCard title="Expiring Leases (90 Days)" value={`${rollovers.length} Leases`} icon={AlertTriangle} subtitle={rollovers.length > 0 ? "Sarah Connor, Miles Dyson" : "N/A"} />
        <KpiCard title="Average Lease Term" value={rollovers.length > 0 ? "18.5 Mos" : "0 Mos"} icon={Landmark} subtitle="Contract duration index" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Lease Rollover Risk Matrix (Next 120 Days)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Tenant Name</th>
                <th className="py-2.5">Property Location</th>
                <th className="py-2.5">Unit</th>
                <th className="py-2.5">Expiration Date</th>
                <th className="py-2.5 text-right">Rollover Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {rollovers.map((roll, idx) => (
                <tr key={idx} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">{roll.tenant}</td>
                  <td className="py-3">{roll.property}</td>
                  <td className="py-3 text-zinc-500">{roll.unitNo}</td>
                  <td className="py-3 text-zinc-500">{roll.expiration}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      roll.risk === "High" 
                        ? "bg-rose-500/15 text-rose-400" 
                        : roll.risk === "Medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {roll.risk} Risk
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

export default Occupancy;
