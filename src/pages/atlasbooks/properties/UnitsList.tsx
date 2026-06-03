import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, ShieldAlert, CheckCircle, FileText, Filter } from "lucide-react";

interface PropertyUnit {
  number: string;
  property: string;
  sqft: number;
  monthlyRent: number;
  tenantName: string;
  leaseExpires: string;
  status: "Occupied" | "Vacant" | "Maintenance";
}

const UnitsList: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [statusFilter, setStatusFilter] = useState("all");

  const units: PropertyUnit[] = [
    { number: "Suite 400", property: "DTLA Center Plaza Tower", sqft: 4500, monthlyRent: 12500, tenantName: "Cyberdyne Systems", leaseExpires: "2028-12-31", status: "Occupied" },
    { number: "Unit 101", property: "Blue Water Premium Condos", sqft: 1200, monthlyRent: 3800, tenantName: "Sarah Connor", leaseExpires: "2026-10-31", status: "Occupied" },
    { number: "Unit 102", property: "Blue Water Premium Condos", sqft: 1200, monthlyRent: 3800, tenantName: "John Connor", leaseExpires: "2027-01-15", status: "Occupied" },
    { number: "Unit 201", property: "Blue Water Premium Condos", sqft: 1450, monthlyRent: 4500, tenantName: "--- (Vacant)", leaseExpires: "N/A", status: "Vacant" },
    { number: "Villa 05", property: "Sandcastle Luxury Villas", sqft: 2800, monthlyRent: 8500, tenantName: "Miles Dyson", leaseExpires: "2026-06-30", status: "Maintenance" }
  ];

  const totalMonthlyRent = units.filter(u => u.status === "Occupied").reduce((sum, u) => sum + u.monthlyRent, 0);

  const filteredUnits = units.filter(u => {
    if (statusFilter === "occupied") return u.status === "Occupied";
    if (statusFilter === "vacant") return u.status === "Vacant";
    if (statusFilter === "maintenance") return u.status === "Maintenance";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Properties Rentable Units Index
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Unit details and active leases for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
          <button onClick={() => setStatusFilter("all")} className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            All
          </button>
          <button onClick={() => setStatusFilter("occupied")} className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "occupied" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            Occupied
          </button>
          <button onClick={() => setStatusFilter("vacant")} className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "vacant" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
            Vacant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Contracted Monthly Rent" value={totalMonthlyRent} icon={Landmark} subtitle="Gross rent receipts" />
        <KpiCard title="Rentable Capacity" value={`${units.length} Units`} icon={FileText} subtitle="Active unit index count" />
        <KpiCard title="Active Occupancy Rate" value={`${Math.round((units.filter(u => u.status === "Occupied").length / units.length) * 100)}%`} icon={CheckCircle} subtitle="Percentage of units occupied" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Rentable Space Inventory Details
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Unit Number</th>
                <th className="py-2.5">Property Parent</th>
                <th className="py-2.5">Size (SqFt)</th>
                <th className="py-2.5">Active Tenant</th>
                <th className="py-2.5">Lease Expires</th>
                <th className="py-2.5 text-right">Monthly Rent</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredUnits.map((u) => (
                <tr key={u.number} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-200 font-bold">{u.number}</td>
                  <td className="py-3">{u.property}</td>
                  <td className="py-3 text-zinc-500">{u.sqft} sqft</td>
                  <td className="py-3 text-zinc-300">{u.tenantName}</td>
                  <td className="py-3 text-zinc-500">{u.leaseExpires}</td>
                  <td className="py-3 text-right font-bold text-white">${u.monthlyRent.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      u.status === "Occupied" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : u.status === "Vacant"
                          ? "bg-amber-500/15 text-amber-400 animate-pulse"
                          : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {u.status}
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

export default UnitsList;
