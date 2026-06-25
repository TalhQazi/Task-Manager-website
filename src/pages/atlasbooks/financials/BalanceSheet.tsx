import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../../components/atlasbooks/HighContrastChart";
import { Landmark, ShieldCheck, DollarSign, Wallet, FileDown } from "lucide-react";

const BalanceSheet: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();

  // Mock balance values calculated from cashPosition
  const cash = stats.cashPosition;
  const ar = stats.accountsReceivable;
  const inventory = 0;
  const fixedAssets = 0;
  const totalAssets = cash + ar + inventory + fixedAssets;

  const ap = stats.accountsPayable;
  const shortDebt = 0;
  const longDebt = 0;
  const totalLiabilities = ap + shortDebt + longDebt;

  const equity = totalAssets - totalLiabilities;
  const workingCapital = (cash + ar) - (ap + shortDebt);
  const debtToEquity = (totalLiabilities / equity).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Balance Sheet Statement
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Dynamic statement for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
          <FileDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Export Balance Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Assets" value={totalAssets} icon={DollarSign} subtitle={`Cash Asset: $${cash.toLocaleString()}`} />
        <KpiCard title="Total Liabilities" value={totalLiabilities} icon={Landmark} subtitle={`Debt Obligations: $${(shortDebt + longDebt).toLocaleString()}`} />
        <KpiCard title="Retained Equity" value={equity} icon={Wallet} subtitle={`Calculated Net Capital`} />
        <KpiCard title="Working Capital" value={workingCapital} icon={ShieldCheck} subtitle={`Debt-to-Equity Ratio: ${debtToEquity}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets table */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Asset Allocations (What we Own)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2">Asset Group</th>
                  <th className="py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200">Cash and equivalents</td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${cash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Accounts Receivable (A/R)</td>
                  <td className="py-3 text-right">${ar.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Inventory reserves</td>
                  <td className="py-3 text-right">${inventory.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Property, Plant & Equipment (PPE)</td>
                  <td className="py-3 text-right">${fixedAssets.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                  <td className="py-3.5">TOTAL CONSOLIDATED ASSETS</td>
                  <td className="py-3.5 text-right text-amber-500">${totalAssets.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Liabilities & Equity (How it is Funded)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2">Obligation Group</th>
                  <th className="py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Accounts Payable (A/P)</td>
                  <td className="py-3 text-right text-rose-400">-${ap.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Short-term notes / debt</td>
                  <td className="py-3 text-right">-${shortDebt.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Long-term leverage commitments</td>
                  <td className="py-3 text-right">-${longDebt.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40 bg-zinc-950/10 font-semibold text-zinc-200">
                  <td className="py-3 pl-2">Total Liabilities</td>
                  <td className="py-3 text-right text-rose-400 font-bold">${totalLiabilities.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Shareholder capital & retained earnings</td>
                  <td className="py-3 text-right">${equity.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                  <td className="py-3.5">TOTAL LIABILITIES & EQUITY</td>
                  <td className="py-3.5 text-right text-amber-500">${(totalLiabilities + equity).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
