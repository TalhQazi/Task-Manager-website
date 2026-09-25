import React, { useEffect, useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../../components/atlasbooks/HighContrastChart";
import { Landmark, ShieldCheck, DollarSign, Wallet, FileDown } from "lucide-react";

const BalanceSheet: React.FC = () => {
  const { timeframe, activeEntity } = useAtlasBooks();
  
  const [data, setData] = useState<any>({
    cash: 0, ar: 0, inventory: 0, fixedAssets: 0,
    ap: 0, shortDebt: 0, longDebt: 0, equity: 0,
    totalAssets: 0, totalLiabilities: 0
  });

  useEffect(() => {
    const fetchBS = async () => {
      try {
        const res = await apiFetch<any>("/api/atlasbook/reports/balance-sheet");
        
        let cash = 0, ar = 0, inventory = 0, fixedAssets = 0, otherAssets = 0;
        let ap = 0, shortDebt = 0, longDebt = 0, otherLiab = 0;
        
        (res.assets || []).forEach((a: any) => {
          const name = a.name.toLowerCase();
          if (name.includes("cash") || name.includes("bank")) cash += a.balance;
          else if (name.includes("receivable") || name.includes("ar")) ar += a.balance;
          else if (name.includes("inventory")) inventory += a.balance;
          else if (name.includes("asset") || name.includes("property") || name.includes("equipment")) fixedAssets += a.balance;
          else otherAssets += a.balance;
        });

        (res.liabilities || []).forEach((l: any) => {
          const name = l.name.toLowerCase();
          const bal = Math.abs(l.balance);
          if (name.includes("payable") || name.includes("ap")) ap += bal;
          else if (name.includes("short") || name.includes("current")) shortDebt += bal;
          else if (name.includes("long") || name.includes("loan") || name.includes("mortgage")) longDebt += bal;
          else otherLiab += bal;
        });

        // Use the fallback if the totals don't match exactly due to categorization, but the total is from API
        const totalAssets = res.totalAssets || 0;
        const totalLiabilities = res.totalLiabilities || 0;
        const equity = res.totalEquity || (totalAssets - totalLiabilities);

        setData({
          cash, ar, inventory, fixedAssets: fixedAssets + otherAssets,
          ap, shortDebt, longDebt: longDebt + otherLiab,
          equity, totalAssets, totalLiabilities
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchBS();
  }, []);

  const workingCapital = (data.cash + data.ar) - (data.ap + data.shortDebt);
  const debtToEquity = data.equity ? (data.totalLiabilities / data.equity).toFixed(2) : "0.00";

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
        <KpiCard title="Total Assets" value={data.totalAssets} icon={DollarSign} subtitle={`Cash Asset: $${data.cash.toLocaleString()}`} />
        <KpiCard title="Total Liabilities" value={data.totalLiabilities} icon={Landmark} subtitle={`Debt Obligations: $${(data.shortDebt + data.longDebt).toLocaleString()}`} />
        <KpiCard title="Retained Equity" value={data.equity} icon={Wallet} subtitle={`Calculated Net Capital`} />
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
                  <td className="py-3 text-right text-emerald-400 font-bold">${data.cash.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Accounts Receivable (A/R)</td>
                  <td className="py-3 text-right">${data.ar.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Inventory reserves</td>
                  <td className="py-3 text-right">${data.inventory.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Property, Plant & Equipment (PPE)</td>
                  <td className="py-3 text-right">${data.fixedAssets.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                  <td className="py-3.5">TOTAL CONSOLIDATED ASSETS</td>
                  <td className="py-3.5 text-right text-amber-500">${data.totalAssets.toLocaleString()}</td>
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
                  <td className="py-3 text-right text-rose-400">-${data.ap.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Short-term notes / debt</td>
                  <td className="py-3 text-right">-${data.shortDebt.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Long-term leverage commitments</td>
                  <td className="py-3 text-right">-${data.longDebt.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40 bg-zinc-950/10 font-semibold text-zinc-200">
                  <td className="py-3 pl-2">Total Liabilities</td>
                  <td className="py-3 text-right text-rose-400 font-bold">${data.totalLiabilities.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-300">Shareholder capital & retained earnings</td>
                  <td className="py-3 text-right">${data.equity.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                  <td className="py-3.5">TOTAL LIABILITIES & EQUITY</td>
                  <td className="py-3.5 text-right text-amber-500">${(data.totalLiabilities + data.equity).toLocaleString()}</td>
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
