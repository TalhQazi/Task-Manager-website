import React, { useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, Building, MapPin, DollarSign, FileDown } from "lucide-react";

interface RealEstateProperty {
  id: string;
  name: string;
  location: string;
  type: "Commercial" | "Residential";
  valuation: number;
  units: number;
  occupancy: number; // percentage
}

const PropertiesList: React.FC = () => {
  const { stats, activeEntity } = useAtlasBooks();
  const [filterType, setFilterType] = useState("all");

  const portfolio: RealEstateProperty[] = [
    { id: "PROP-01", name: "Blue Water Premium Condos", location: "Miami Coastal", type: "Residential", valuation: 12500000, units: 120, occupancy: 94.2 },
    { id: "PROP-02", name: "Sandcastle Luxury Villas", location: "Miami Key", type: "Residential", valuation: 8400000, units: 48, occupancy: 87.5 },
    { id: "PROP-03", name: "DTLA Center Plaza Tower", location: "Los Angeles", type: "Commercial", valuation: 22000000, units: 14, occupancy: 100.0 },
    { id: "PROP-04", name: "Silicon Office Tech Hub", location: "San Francisco", type: "Commercial", valuation: 15400000, units: 8, occupancy: 75.0 }
  ];

  const totalValuation = portfolio.reduce((sum, p) => sum + p.valuation, 0);
  const totalUnits = portfolio.reduce((sum, p) => sum + p.units, 0);
  const avgOccupancy = Math.round(portfolio.reduce((sum, p) => sum + p.occupancy, 0) / portfolio.length);

  const filteredPortfolio = portfolio.filter(p => {
    if (filterType === "commercial") return p.type === "Commercial";
    if (filterType === "residential") return p.type === "Residential";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono">
            Properties Portfolio Registry
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Real Estate holdings and active assets for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-md transition-all ${filterType === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
              All Assets
            </button>
            <button onClick={() => setFilterType("commercial")} className={`px-3 py-1.5 rounded-md transition-all ${filterType === "commercial" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
              Commercial
            </button>
            <button onClick={() => setFilterType("residential")} className={`px-3 py-1.5 rounded-md transition-all ${filterType === "residential" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}>
              Residential
            </button>
          </div>

          <button className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-850 hover:border-amber-500/50 hover:bg-zinc-800 px-3 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer">
            <FileDown className="w-3.5 h-3.5 text-amber-500" />
            <span>Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Portfolio Value" value={totalValuation} icon={DollarSign} subtitle="Fair market valuation index" />
        <KpiCard title="Total Inventory" value={`${totalUnits} Units`} icon={Building} subtitle="Rentable inventory spaces" />
        <KpiCard title="Avg Occupancy Rate" value={`${avgOccupancy}%`} icon={Landmark} subtitle="Leased occupancy ratio" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Real Estate Assets Directory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Asset Code</th>
                <th className="py-2.5">Property Name</th>
                <th className="py-2.5">Location</th>
                <th className="py-2.5">Classification</th>
                <th className="py-2.5 text-right">Rentable Units</th>
                <th className="py-2.5 text-right">Occupancy Rate</th>
                <th className="py-2.5 text-right text-amber-500 font-bold">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredPortfolio.map((prop) => (
                <tr key={prop.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-500">{prop.id}</td>
                  <td className="py-3 text-zinc-200 font-bold">{prop.name}</td>
                  <td className="py-3 text-zinc-450 flex items-center mt-1">
                    <MapPin className="w-3 h-3 text-amber-500/80 mr-1" /> {prop.location}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      prop.type === "Commercial" ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"
                    }`}>
                      {prop.type}
                    </span>
                  </td>
                  <td className="py-3 text-right">{prop.units}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <span className={`font-bold ${prop.occupancy >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                        {prop.occupancy.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-extrabold text-white">${prop.valuation.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropertiesList;
