import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, Users, CreditCard, Send, Check } from "lucide-react";

interface EmployeePayroll {
  id: string;
  name: string;
  department: string;
  type: "Full-Time" | "Contractor";
  salary: number;
  status: "Paid" | "Pending Approval" | "Processing";
}

const Payroll: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [payoutStatus, setPayoutStatus] = useState<string>("idle");

  const handleProcessPayroll = () => {
    setPayoutStatus("processing");
    setTimeout(() => {
      setPayoutStatus("completed");
      setTimeout(() => setPayoutStatus("idle"), 3000);
    }, 2000);
  };

  const roster: EmployeePayroll[] = [];

  const totalPayroll = roster.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Payroll Ledger Management
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Departmental payroll distributions for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        
        <button
          onClick={handleProcessPayroll}
          disabled={payoutStatus !== "idle"}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 px-4 py-2.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
        >
          {payoutStatus === "idle" && (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>DISPATCH MONTHLY PAYROLL</span>
            </>
          )}
          {payoutStatus === "processing" && (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>TRANSACTING LEDGER...</span>
            </>
          )}
          {payoutStatus === "completed" && (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>PAYROLL CLEARED & AUDITED</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Payroll Commit" value={totalPayroll} icon={Users} subtitle={`${roster.length} Staff Personnel`} />
        <KpiCard title="Processed MTD" value={Math.round(stats.expensesMtd * 0.4)} icon={Landmark} subtitle="Direct Deposit cleared" />
        <KpiCard title="Contractor Retainer" value={roster.filter(e => e.type === "Contractor").reduce((sum, e) => sum + e.salary, 0)} icon={CreditCard} subtitle="Cleared on invoice net-30 terms" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Employee & Contractor Roster Registry
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-400 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Staff ID</th>
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Department</th>
                <th className="py-2.5">Classification</th>
                <th className="py-2.5 text-right">Payout Rate</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {roster.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-500">{emp.id}</td>
                  <td className="py-3 text-zinc-200 font-bold">{emp.name}</td>
                  <td className="py-3">{emp.department}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${emp.type === "Full-Time" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                      {emp.type}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold">${emp.salary.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      emp.status === "Paid" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : emp.status === "Processing"
                          ? "bg-amber-500/15 text-amber-400 animate-pulse"
                          : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {emp.status}
                    </span>
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

export default Payroll;
