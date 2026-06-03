import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { DollarSign, Landmark, TrendingUp, AlertTriangle, FileDown } from "lucide-react";

interface BudgetRow {
  department: string;
  budget: number;
  actual: number;
}

const BudgetVsActual: React.FC = () => {
  const { stats, timeframe, activeEntity } = useAtlasBooks();

  const totalOpex = Math.round(stats.expensesMtd);
  const totalBudget = Math.round(totalOpex * 1.15); // Budget is slightly higher
  const netVariance = totalBudget - totalOpex;
  const burnPercent = ((totalOpex / totalBudget) * 100).toFixed(1);

  // Departmental distribution mock data based on opex
  const budgetRows: BudgetRow[] = [
    { department: "Software Engineering & Dev", budget: Math.round(totalBudget * 0.4), actual: Math.round(totalOpex * 0.42) },
    { department: "Sales & Client Acquisition", budget: Math.round(totalBudget * 0.25), actual: Math.round(totalOpex * 0.22) },
    { department: "Product Marketing Operations", budget: Math.round(totalBudget * 0.15), actual: Math.round(totalOpex * 0.16) },
    { department: "Human Resources & Recruitment", budget: Math.round(totalBudget * 0.1), actual: Math.round(totalOpex * 0.08) },
    { department: "Corporate Infrastructure & G&A", budget: Math.round(totalBudget * 0.1), actual: Math.round(totalOpex * 0.12) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Budget vs Actual Variance
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Departmental operational tracking for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
          <FileDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Export Variance Sheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Allocated Budget" value={totalBudget} icon={DollarSign} subtitle={`MTD Period`} />
        <KpiCard title="Actual Spend" value={totalOpex} icon={Landmark} subtitle={`Burn Rate: ${burnPercent}%`} />
        <KpiCard title="Net Variance" value={netVariance} icon={TrendingUp} subtitle={`${netVariance >= 0 ? "Under budget" : "Over budget"}`} />
        <KpiCard title="Integrity Score" value={`${stats.integrityScore}%`} icon={AlertTriangle} subtitle={`Financial deviation check`} />
      </div>

      {/* Budget list */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Departmental Expense Burn Meters
        </h3>
        <div className="space-y-6">
          {budgetRows.map((row, idx) => {
            const rowBurn = (row.actual / row.budget) * 100;
            const variance = row.budget - row.actual;
            const isOver = variance < 0;
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                  <span className="text-zinc-200 font-bold">{row.department}</span>
                  <div className="flex items-center space-x-4 text-[11px] text-zinc-500">
                    <span>Budget: <strong className="text-zinc-300">${row.budget.toLocaleString()}</strong></span>
                    <span>Actual: <strong className="text-zinc-350">${row.actual.toLocaleString()}</strong></span>
                    <span>Variance: <strong className={isOver ? "text-rose-400" : "text-emerald-400"}>
                      {isOver ? "-" : ""}${Math.abs(variance).toLocaleString()}
                    </strong></span>
                  </div>
                </div>

                <div className="relative w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-900/60 p-0.5">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      rowBurn > 100
                        ? "bg-rose-500 shadow-lg shadow-rose-500/20"
                        : rowBurn > 85
                          ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                          : "bg-gradient-to-r from-amber-600 to-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, rowBurn)}%` }}
                  />
                  <span className="absolute right-2 top-0.5 text-[8px] font-black text-zinc-400 font-mono">
                    {rowBurn.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetVsActual;
