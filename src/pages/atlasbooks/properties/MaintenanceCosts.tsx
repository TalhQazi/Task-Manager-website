import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, AlertTriangle, ShieldCheck, Box } from "lucide-react";

interface MaintenanceTicket {
  id: string;
  description: string;
  property: string;
  cost: number;
  priority: "Low" | "Medium" | "High";
  status: "Completed" | "In Progress" | "Scheduled";
}

const MaintenanceCosts: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [priorityFilter, setPriorityFilter] = useState("all");

  const tickets: MaintenanceTicket[] = [];

  const totalMaintenance = tickets.reduce((sum, t) => sum + t.cost, 0);
  const activeCount = tickets.filter(t => t.status !== "Completed").length;

  const filteredTickets = tickets.filter(t => {
    if (priorityFilter === "high") return t.priority === "High";
    if (priorityFilter === "medium") return t.priority === "Medium";
    if (priorityFilter === "low") return t.priority === "Low";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Property Maintenance & CapEx
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Maintenance ledger and ticket parameters for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
          <button onClick={() => setPriorityFilter("all")} className={`px-3 py-1.5 rounded-md transition-all ${priorityFilter === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            All Priority
          </button>
          <button onClick={() => setPriorityFilter("high")} className={`px-3 py-1.5 rounded-md transition-all ${priorityFilter === "high" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            High Priority
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Total Maintenance Spend" value={totalMaintenance} icon={Box} subtitle="MTD Repairs aggregate" />
        <KpiCard title="Active Work Tickets" value={`${activeCount} Tickets`} icon={AlertTriangle} subtitle="In progress or scheduled" />
        <KpiCard title="Capital Improvement (CapEx)" value={Math.round(totalMaintenance * 0.72)} icon={Landmark} subtitle="Amortizable asset investments" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Active Maintenance & Repair Tickets Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-455 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Ticket ID</th>
                <th className="py-2.5">Description</th>
                <th className="py-2.5">Location</th>
                <th className="py-2.5 text-right">Job Cost</th>
                <th className="py-2.5 text-center">Priority</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-500">{t.id}</td>
                  <td className="py-3 text-zinc-200 font-bold">{t.description}</td>
                  <td className="py-3">{t.property}</td>
                  <td className="py-3 text-right font-bold text-white">${t.cost.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      t.priority === "High" 
                        ? "bg-rose-500/10 text-rose-400" 
                        : t.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      t.status === "Completed" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : t.status === "In Progress"
                          ? "bg-amber-500/15 text-amber-400 animate-pulse"
                          : "bg-zinc-800 text-zinc-450"
                    }`}>
                      {t.status}
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

export default MaintenanceCosts;
