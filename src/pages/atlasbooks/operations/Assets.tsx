import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, DollarSign, Box } from "lucide-react";

interface CapitalAsset {
  tag: string;
  description: string;
  cost: number;
  acquired: string;
  depreciationRate: number; // annual %
  accumulated: number;
}

const Assets: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();

  // Asset register
  const assetRoster: CapitalAsset[] = [];

  const totalCost = assetRoster.reduce((sum, a) => sum + a.cost, 0);
  const totalAccumulated = assetRoster.reduce((sum, a) => sum + a.accumulated, 0);
  const totalBookValue = totalCost - totalAccumulated;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Capital Assets & Depreciation Register
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Capital allocations and valuations for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Total Capital Cost" value={totalCost} icon={DollarSign} subtitle="Historical purchase total" />
        <KpiCard title="Accumulated Depreciation" value={totalAccumulated} icon={Box} subtitle={`Straight-line amortization`} />
        <KpiCard title="Net Book Value" value={totalBookValue} icon={Landmark} subtitle="Current balance sheet value" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Fixed Assets Ledger Directory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Asset Tag</th>
                <th className="py-2.5">Description</th>
                <th className="py-2.5">Acquisition Date</th>
                <th className="py-2.5 text-right">Depreciation Rate</th>
                <th className="py-2.5 text-right">Historical Cost</th>
                <th className="py-2.5 text-right">Accumulated</th>
                <th className="py-2.5 text-right text-amber-500 font-bold">Net Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {assetRoster.map((asset) => {
                const bookValue = asset.cost - asset.accumulated;
                return (
                  <tr key={asset.tag} className="hover:bg-zinc-950/40">
                    <td className="py-3 text-zinc-500">{asset.tag}</td>
                    <td className="py-3 text-zinc-200 font-bold">{asset.description}</td>
                    <td className="py-3">{asset.acquired}</td>
                    <td className="py-3 text-right">{asset.depreciationRate.toFixed(1)}% / Yr</td>
                    <td className="py-3 text-right">${asset.cost.toLocaleString()}</td>
                    <td className="py-3 text-right text-rose-400">-${asset.accumulated.toLocaleString()}</td>
                    <td className="py-3 text-right font-extrabold text-amber-500">${bookValue.toLocaleString()}</td>
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

export default Assets;
