import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, ShieldCheck, Activity } from "lucide-react";

interface CreditLine {
  institution: string;
  facility: string;
  limit: number;
  utilization: number; // percentage
  rate: number; // percentage APR
}

const CreditMonitoring: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();

  const lines: CreditLine[] = [];

  const totalCreditLimit = lines.reduce((sum, l) => sum + l.limit, 0);
  const totalDrawn = lines.reduce((sum, l) => sum + (l.limit * l.utilization) / 100, 0);
  const averageUtilization = Math.round((totalDrawn / totalCreditLimit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Corporate Credit Monitoring & Facilities
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Active credit facilities and bureau indexes for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Dun & Bradstreet Score" value={`${stats.creditScore} (AAA)`} icon={ShieldCheck} subtitle="Bureau rating verification" />
        <KpiCard title="Total Facility Limit" value={totalCreditLimit} icon={Landmark} subtitle={`Drawn: $${totalDrawn.toLocaleString()}`} />
        <KpiCard title="Avg Utilization Rate" value={`${averageUtilization}%`} icon={Activity} subtitle={`APR range: 6.85% - 8.50%`} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Active Bank Credit Lines & Utilization
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Financial Institution</th>
                <th className="py-2.5">Facility Type</th>
                <th className="py-2.5 text-right">Interest Rate (APR)</th>
                <th className="py-2.5 text-right">Credit Limit</th>
                <th className="py-2.5 text-right">Drawn balance</th>
                <th className="py-2.5 text-right font-bold text-amber-500">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {lines.map((l, idx) => {
                const drawn = (l.limit * l.utilization) / 100;
                return (
                  <tr key={idx} className="hover:bg-zinc-950/40">
                    <td className="py-3 text-zinc-200 font-bold">{l.institution}</td>
                    <td className="py-3 text-zinc-450">{l.facility}</td>
                    <td className="py-3 text-right">{l.rate.toFixed(2)}%</td>
                    <td className="py-3 text-right">${l.limit.toLocaleString()}</td>
                    <td className="py-3 text-right text-rose-450">${drawn.toLocaleString()}</td>
                    <td className="py-3 text-right font-extrabold">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={l.utilization > 40 ? "text-amber-400" : "text-emerald-400"}>
                          {l.utilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditMonitoring;
