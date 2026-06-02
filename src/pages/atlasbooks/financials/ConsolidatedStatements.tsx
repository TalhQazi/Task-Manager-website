import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { DollarSign, Landmark, TrendingUp, Sparkles, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const ConsolidatedStatements: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();

  // Consolidation totals
  const totalRev = stats.revenueMtd;
  const techRev = Math.round(totalRev * 0.62);
  const propRev = Math.round(totalRev * 0.44);
  const eliminations = -(techRev + propRev - totalRev);

  // Group columns for consolidated tables
  const statementRows = [
    { label: "Revenues", tech: techRev, prop: propRev, elim: eliminations, total: totalRev },
    { label: "Cost of Goods (COGS)", tech: -Math.round(techRev * 0.3), prop: -Math.round(propRev * 0.4), elim: -Math.round(eliminations * 0.35), total: -Math.round(totalRev * 0.35) },
    { label: "Gross Operating Profit", tech: Math.round(techRev * 0.7), prop: Math.round(propRev * 0.6), elim: Math.round(eliminations * 0.65), total: Math.round(totalRev * 0.65) },
    { label: "Operating Expenses (OpEx)", tech: -Math.round(techRev * 0.4), prop: -Math.round(propRev * 0.32), elim: -Math.round(eliminations * 0.38), total: -Math.round(totalRev * 0.45) },
    { label: "Net Profit / Yield", tech: Math.round(techRev * 0.3), prop: Math.round(propRev * 0.28), elim: Math.round(eliminations * 0.27), total: stats.netProfit }
  ];

  const shareData = [
    { name: "Atlas Tech", Revenue: techRev, Profit: Math.round(techRev * 0.3) },
    { name: "Atlas Properties", Revenue: propRev, Profit: Math.round(propRev * 0.28) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
            Consolidated Financial Statements
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Group roll-ups for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
          <FileDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Export Consolidated Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Tech Gross Share" value={techRev} icon={DollarSign} subtitle="62.0% Contribution" />
        <KpiCard title="Property Gross Share" value={propRev} icon={Landmark} subtitle="44.0% Contribution" />
        <KpiCard title="Intercompany Eliminations" value={eliminations} icon={TrendingUp} subtitle="Contra-revenue adjustment" />
        <KpiCard title="Consolidated Net Profit" value={stats.netProfit} icon={Landmark} subtitle="Combined Group Yield" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table sheet */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Consolidated Income Statement Worksheet
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-450 font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-[9px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5">Statement Line Item</th>
                  <th className="py-2.5 text-right">Atlas Tech</th>
                  <th className="py-2.5 text-right">Atlas Prop</th>
                  <th className="py-2.5 text-right">Eliminations</th>
                  <th className="py-2.5 text-right text-amber-500 font-bold">Consolidated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {statementRows.map((row, index) => {
                  const isTotal = row.label.includes("TOTAL") || row.label.includes("Net") || row.label.includes("Gross Operating");
                  return (
                    <tr key={index} className={`hover:bg-zinc-950/40 ${isTotal ? "bg-zinc-950/20 font-bold text-zinc-200 border-t border-zinc-850" : ""}`}>
                      <td className="py-3 pr-2">{row.label}</td>
                      <td className="py-3 text-right text-zinc-400">${row.tech.toLocaleString()}</td>
                      <td className="py-3 text-right text-zinc-400">${row.prop.toLocaleString()}</td>
                      <td className="py-3 text-right text-rose-400">${row.elim.toLocaleString()}</td>
                      <td className={`py-3 text-right font-extrabold ${isTotal ? "text-amber-500" : "text-zinc-100"}`}>
                        ${row.total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consolidated Share chart */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Share Breakdown Matrix
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} dy={8} fontFamily="Courier New" />
                <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} dx={-8} fontFamily="Courier New" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                  itemStyle={{ fontSize: "10px", fontFamily: "Courier New" }}
                />
                <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "Courier New" }} />
                <Bar dataKey="Revenue" fill="#D4AF37" name="Revenues" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#ef4444" name="Net Yield" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedStatements;
