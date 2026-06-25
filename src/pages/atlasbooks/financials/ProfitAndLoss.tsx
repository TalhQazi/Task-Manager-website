import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../../components/atlasbooks/HighContrastChart";
import { Landmark, TrendingUp, DollarSign, Wallet, FileDown } from "lucide-react";

const ProfitAndLoss: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();
  const [filterMargin, setFilterMargin] = useState("all");

  const revenue = stats.revenueMtd;
  const cogs = 0;
  const grossProfit = revenue - cogs;
  const opex = 0;
  const ebitda = grossProfit - opex;
  const netIncome = stats.netProfit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Profit & Loss (P&L) Statement
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Dynamic statement for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
          <FileDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Export P&L Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Revenues" value={revenue} icon={DollarSign} subtitle={`COGS: $${cogs.toLocaleString()}`} />
        <KpiCard title="Gross Margin" value={`${((grossProfit / revenue) * 100).toFixed(1)}%`} icon={TrendingUp} subtitle={`Gross Profit: $${grossProfit.toLocaleString()}`} />
        <KpiCard title="EBITDA" value={ebitda} icon={Landmark} subtitle={`OpEx: $${opex.toLocaleString()}`} />
        <KpiCard title="Net Income" value={netIncome} icon={Wallet} subtitle={`Net Margin: ${((netIncome / revenue) * 100).toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Statement breakdown Table */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Income Statement Ledger Detail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5">Line Item</th>
                  <th className="py-2.5 text-right">Value</th>
                  <th className="py-2.5 text-right">% of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">Gross Revenues</td>
                  <td className="py-3 text-right text-white font-bold">${revenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-zinc-500">100.0%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Cost of Goods Sold (COGS)</td>
                  <td className="py-3 text-right text-rose-400">-${cogs.toLocaleString()}</td>
                  <td className="py-3 text-right">35.0%</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/20">
                  <td className="py-3 text-zinc-100 font-bold">Gross Profit Margin</td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${grossProfit.toLocaleString()}</td>
                  <td className="py-3 text-right text-amber-500 font-bold">{((grossProfit / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Sales & Marketing (S&M)</td>
                  <td className="py-3 text-right">-${Math.round(opex * 0.45).toLocaleString()}</td>
                  <td className="py-3 text-right">20.2%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Research & Dev (R&D)</td>
                  <td className="py-3 text-right">-${Math.round(opex * 0.35).toLocaleString()}</td>
                  <td className="py-3 text-right">15.7%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">General & Admin (G&A)</td>
                  <td className="py-3 text-right">-${Math.round(opex * 0.2).toLocaleString()}</td>
                  <td className="py-3 text-right">9.0%</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/20">
                  <td className="py-3 text-zinc-100 font-bold">Operating Income (EBITDA)</td>
                  <td className="py-3 text-right text-amber-400 font-bold">${ebitda.toLocaleString()}</td>
                  <td className="py-3 text-right font-bold">{((ebitda / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40 border-b border-zinc-850">
                  <td className="py-3 text-zinc-200 font-bold">Net Earnings (Profit)</td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${netIncome.toLocaleString()}</td>
                  <td className="py-3 text-right text-amber-400 font-bold">{((netIncome / revenue) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Margin Distribution Chart */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
              Operational Earnings Trend
            </h3>
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded uppercase">
              {timeframe}
            </span>
          </div>
          <div className="h-64">
            <HighContrastChart type="bar" metricType="revenue" height={220} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;
