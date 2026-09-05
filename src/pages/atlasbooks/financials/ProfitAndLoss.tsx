import React, { useEffect, useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../../components/atlasbooks/HighContrastChart";
import { Landmark, TrendingUp, DollarSign, Wallet, FileDown } from "lucide-react";

const ProfitAndLoss: React.FC = () => {
  const { timeframe, activeEntity } = useAtlasBooks();
  const [filterMargin, setFilterMargin] = useState("all");
  
  const [data, setData] = useState<any>({
    revenue: 0, cogs: 0, grossProfit: 0, 
    opex: 0, ebitda: 0, netIncome: 0,
    sm: 0, rd: 0, ga: 0
  });

  useEffect(() => {
    const fetchPL = async () => {
      try {
        const res = await apiFetch<any>("/api/atlasbook/reports/pl");
        const revenue = res.revenue || 0;
        
        let cogs = 0;
        let sm = 0;
        let rd = 0;
        let ga = 0;
        
        (res.breakdown?.expenses || []).forEach((e: any) => {
          const name = e.name.toLowerCase();
          const bal = Math.abs(e.balance);
          if (name.includes("cogs") || name.includes("cost of goods") || name.includes("direct")) cogs += bal;
          else if (name.includes("sales") || name.includes("marketing") || name.includes("advertising")) sm += bal;
          else if (name.includes("research") || name.includes("development") || name.includes("r&d")) rd += bal;
          else ga += bal; // everything else to G&A
        });

        const grossProfit = revenue - cogs;
        const opex = sm + rd + ga;
        const ebitda = grossProfit - opex;
        const netIncome = res.netProfit || ebitda;

        setData({ revenue, cogs, grossProfit, opex, ebitda, netIncome, sm, rd, ga });
      } catch (err) {
        console.error(err);
      }
    };
    fetchPL();
  }, []);

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
        <KpiCard title="Revenues" value={data.revenue} icon={DollarSign} subtitle={`COGS: $${data.cogs.toLocaleString()}`} />
        <KpiCard title="Gross Margin" value={`${data.revenue ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : 0}%`} icon={TrendingUp} subtitle={`Gross Profit: $${data.grossProfit.toLocaleString()}`} />
        <KpiCard title="EBITDA" value={data.ebitda} icon={Landmark} subtitle={`OpEx: $${data.opex.toLocaleString()}`} />
        <KpiCard title="Net Income" value={data.netIncome} icon={Wallet} subtitle={`Net Margin: ${data.revenue ? ((data.netIncome / data.revenue) * 100).toFixed(1) : 0}%`} />
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
                  <td className="py-3 text-right text-white font-bold">${data.revenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-zinc-500">100.0%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Cost of Goods Sold (COGS)</td>
                  <td className="py-3 text-right text-rose-400">-${data.cogs.toLocaleString()}</td>
                  <td className="py-3 text-right">{data.revenue ? ((data.cogs / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/20">
                  <td className="py-3 text-zinc-100 font-bold">Gross Profit Margin</td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${data.grossProfit.toLocaleString()}</td>
                  <td className="py-3 text-right text-amber-500 font-bold">{data.revenue ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Sales & Marketing (S&M)</td>
                  <td className="py-3 text-right">-${data.sm.toLocaleString()}</td>
                  <td className="py-3 text-right">{data.revenue ? ((data.sm / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">Research & Dev (R&D)</td>
                  <td className="py-3 text-right">-${data.rd.toLocaleString()}</td>
                  <td className="py-3 text-right">{data.revenue ? ((data.rd / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-400 pl-4">General & Admin (G&A)</td>
                  <td className="py-3 text-right">-${data.ga.toLocaleString()}</td>
                  <td className="py-3 text-right">{data.revenue ? ((data.ga / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="border-t border-zinc-800 bg-zinc-950/20">
                  <td className="py-3 text-zinc-100 font-bold">Operating Income (EBITDA)</td>
                  <td className="py-3 text-right text-amber-400 font-bold">${data.ebitda.toLocaleString()}</td>
                  <td className="py-3 text-right font-bold">{data.revenue ? ((data.ebitda / data.revenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="hover:bg-zinc-950/40 border-b border-zinc-850">
                  <td className="py-3 text-zinc-200 font-bold">Net Earnings (Profit)</td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${data.netIncome.toLocaleString()}</td>
                  <td className="py-3 text-right text-amber-400 font-bold">{data.revenue ? ((data.netIncome / data.revenue) * 100).toFixed(1) : 0}%</td>
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
