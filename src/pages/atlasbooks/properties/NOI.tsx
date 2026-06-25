import React from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, DollarSign, Wallet, ShieldCheck } from "lucide-react";

const NOI: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();

  // NOI model calculation
  const grossRent = 0;
  const parkingFee = 0;
  const grossPotential = grossRent + parkingFee;

  const vacancyLoss = -Math.round(grossPotential * 0.08);
  const effectiveGross = grossPotential + vacancyLoss;

  const taxes = -Math.round(stats.expensesMtd * 0.22);
  const insurance = -Math.round(stats.expensesMtd * 0.08);
  const utilities = -Math.round(stats.expensesMtd * 0.15);
  const opex = taxes + insurance + utilities;

  const netOperatingIncome = effectiveGross + opex;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Net Operating Income (NOI)
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Direct yield calculations for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Gross Potential (GPR)" value={grossPotential} icon={DollarSign} subtitle="Max capability yield" />
        <KpiCard title="Effective Gross (EGI)" value={effectiveGross} icon={ShieldCheck} subtitle={`Vacancy: $${Math.abs(vacancyLoss).toLocaleString()}`} />
        <KpiCard title="Operating Expenses (OpEx)" value={Math.abs(opex)} icon={Landmark} subtitle="Tax, utility, and insurance" />
        <KpiCard title="Net Operating Income" value={netOperatingIncome} icon={Wallet} subtitle={`Cap Rate: 5.4% implied`} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          NOI Operational Worksheet
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Operational Line Item</th>
                <th className="py-2.5 text-right">Debit / Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-300">Gross Contracted Rental Income</td>
                <td className="py-3 text-right text-emerald-400 font-bold">${grossRent.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-400">Ancillary Services (Parking, Storage)</td>
                <td className="py-3 text-right">${parkingFee.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40 bg-zinc-950/20 font-semibold text-zinc-200">
                <td className="py-3">Gross Potential Revenue (GPR)</td>
                <td className="py-3 text-right">${grossPotential.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-400">Vacancy & Collection Losses</td>
                <td className="py-3 text-right text-rose-450">-${Math.abs(vacancyLoss).toLocaleString()}</td>
              </tr>
              <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-zinc-100">
                <td className="py-3.5">EFFECTIVE GROSS INCOME (EGI)</td>
                <td className="py-3.5 text-right text-amber-500">${effectiveGross.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-450 pl-4">Real Estate Property Taxes</td>
                <td className="py-3 text-right text-rose-400">-${Math.abs(taxes).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-450 pl-4">Insurance Premium Allocation</td>
                <td className="py-3 text-right text-rose-400">-${Math.abs(insurance).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="py-3 text-zinc-450 pl-4">Facility Utilities and Power</td>
                <td className="py-3 text-right text-rose-400">-${Math.abs(utilities).toLocaleString()}</td>
              </tr>
              <tr className="border-t border-zinc-800 bg-zinc-950/40 font-bold text-white">
                <td className="py-3.5">NET OPERATING INCOME (NOI)</td>
                <td className="py-3.5 text-right text-amber-500">${netOperatingIncome.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NOI;
