import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../../components/atlasbooks/HighContrastChart";
import { Landmark, TrendingUp, DollarSign, Activity, FileDown } from "lucide-react";

const CashFlow: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();

  // Cash flow components
  const netIncome = stats.netProfit;
  const depreciation = 0;
  const arChanges = -Math.round(stats.accountsReceivable * 0.08);
  const apChanges = 0;
  const operatingCash = netIncome + depreciation + arChanges + apChanges;

  const capex = -Math.round(stats.cashPosition * 0.04);
  const investingCash = capex;

  const debtRepayment = -Math.round(stats.cashPosition * 0.02);
  const financingCash = debtRepayment;

  const netIncrease = operatingCash + investingCash + financingCash;
  const startCash = stats.cashPosition - netIncrease;
  const endCash = stats.cashPosition;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Cash Flow Statement
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Dynamic statement for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
          <FileDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Export Cash Statement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Operating Cash" value={operatingCash} icon={Activity} subtitle={`Net income adjustments`} />
        <KpiCard title="Investing Cash" value={investingCash} icon={TrendingUp} subtitle={`CapEx: $${Math.abs(capex).toLocaleString()}`} />
        <KpiCard title="Financing Cash" value={financingCash} icon={Landmark} subtitle={`Repayments & Dividends`} />
        <KpiCard title="End Cash Balance" value={endCash} icon={DollarSign} subtitle={`Beginning: $${startCash.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Statement table */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Statement of Cash Flows (MTD Period)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2">Activity Category</th>
                  <th className="py-2 text-right">Cash In/Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {/* Operating */}
                <tr className="bg-zinc-950/20 font-semibold text-zinc-300">
                  <td className="py-2.5">Operating Activities</td>
                  <td className="py-2.5 text-right text-emerald-400">${operatingCash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Net Earnings</td>
                  <td className="py-2 text-right">${netIncome.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Depreciation & Amortization</td>
                  <td className="py-2 text-right">${depreciation.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Receivables changes (AR)</td>
                  <td className="py-2 text-right text-rose-400">${arChanges.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Payables changes (AP)</td>
                  <td className="py-2 text-right text-emerald-400">${apChanges.toLocaleString()}</td>
                </tr>

                {/* Investing */}
                <tr className="bg-zinc-950/20 font-semibold text-zinc-300">
                  <td className="py-2.5">Investing Activities</td>
                  <td className="py-2.5 text-right text-rose-400">${investingCash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Capital Expenditures (CapEx)</td>
                  <td className="py-2 text-right text-rose-400">${capex.toLocaleString()}</td>
                </tr>

                {/* Financing */}
                <tr className="bg-zinc-950/20 font-semibold text-zinc-300">
                  <td className="py-2.5">Financing Activities</td>
                  <td className="py-2.5 text-right text-rose-400">${financingCash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 pl-4 text-zinc-400">Repayment of short-term notes</td>
                  <td className="py-2 text-right text-rose-400">${debtRepayment.toLocaleString()}</td>
                </tr>

                {/* Summary */}
                <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                  <td className="py-3">NET INCREASE IN CASH</td>
                  <td className="py-3 text-right text-amber-500">${netIncrease.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-2 text-zinc-500">Beginning Cash Balance</td>
                  <td className="py-2 text-right text-zinc-500">${startCash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40 font-semibold text-zinc-100">
                  <td className="py-2">Ending Cash Balance</td>
                  <td className="py-2 text-right text-amber-400">${endCash.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Performance Chart */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
              End Cash Position trend
            </h3>
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded uppercase">
              {timeframe}
            </span>
          </div>
          <div className="h-64">
            <HighContrastChart type="area" metricType="cash" height={220} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;
