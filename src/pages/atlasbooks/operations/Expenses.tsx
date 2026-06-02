import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { CreditCard, FileImage, ShieldCheck, Check, AlertCircle } from "lucide-react";

interface CardExpense {
  id: string;
  employee: string;
  merchant: string;
  amount: number;
  date: string;
  hasReceipt: boolean;
  matched: boolean;
}

const Expenses: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [expenses, setExpenses] = useState<CardExpense[]>([
    { id: "EXP-801", employee: "Sarah Connor", merchant: "Amazon Web Services", amount: 1250.00, date: "2026-06-01", hasReceipt: true, matched: true },
    { id: "EXP-802", employee: "John Connor", merchant: "Shell Fuel HQ", amount: 65.40, date: "2026-06-02", hasReceipt: false, matched: false },
    { id: "EXP-803", employee: "Miles Dyson", merchant: "OpenAI API billing", amount: 840.00, date: "2026-05-30", hasReceipt: true, matched: false },
    { id: "EXP-804", employee: "Kate Brewster", merchant: "Delta Air Lines", amount: 480.00, date: "2026-05-28", hasReceipt: true, matched: true }
  ]);

  const handleMatchReceipt = (id: string) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, hasReceipt: true, matched: true } : exp))
    );
  };

  const totalOpex = stats.expensesMtd;
  const cardSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
          Corporate Expense & Receipt Matcher
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Corporate card balances and receipt captures for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Expenses MTD" value={totalOpex} icon={CreditCard} subtitle="Operational overhead total" />
        <KpiCard title="Card Ledger Audited" value={cardSpend} icon={ShieldCheck} subtitle="Reconciled ledger transactions" />
        <KpiCard title="Receipt Match rate" value={`${Math.round((expenses.filter(e => e.matched).length / expenses.length) * 100)}%`} icon={FileImage} subtitle="Match verification" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase border-b border-zinc-800 pb-3">
          Corporate Card Statement Matching Details
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Staff Employee</th>
                <th className="py-2.5">Merchant</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Card Charge</th>
                <th className="py-2.5 text-center">Receipt File</th>
                <th className="py-2.5 text-right">Match Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">{exp.employee}</td>
                  <td className="py-3">{exp.merchant}</td>
                  <td className="py-3 text-zinc-500">{exp.date}</td>
                  <td className="py-3 text-right font-bold text-white">${exp.amount.toFixed(2)}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] inline-flex items-center ${
                      exp.hasReceipt 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {exp.hasReceipt ? "Attached" : "Missing"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {exp.matched ? (
                      <span className="text-emerald-400 flex items-center justify-end text-[10px] font-bold">
                        <Check className="w-3.5 h-3.5 mr-1" /> Reconciled
                      </span>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        {!exp.hasReceipt && (
                          <button
                            onClick={() => handleMatchReceipt(exp.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-2 py-1 rounded text-[9px] font-black transition-all cursor-pointer"
                          >
                            Upload & Match
                          </button>
                        )}
                        {exp.hasReceipt && !exp.matched && (
                          <button
                            onClick={() => handleMatchReceipt(exp.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer"
                          >
                            Approve Match
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
