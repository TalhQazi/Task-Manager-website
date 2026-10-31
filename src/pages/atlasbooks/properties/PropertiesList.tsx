import React, { useState, useEffect } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, Building, MapPin, DollarSign, FileDown, Plus, X, Building2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "sonner";

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
  const { activeEntity } = useAtlasBooks();
  const [filterType, setFilterType] = useState("all");
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [classification, setClassification] = useState<"Commercial" | "Residential">("Residential");
  const [valuation, setValuation] = useState("");
  const [parcelInfo, setParcelInfo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProps, resUnits, resCompanies] = await Promise.all([
        apiFetch<{ success: boolean; items: any[] }>("/api/atlasbook/properties"),
        apiFetch<{ success: boolean; items: any[] }>("/api/atlasbook/units"),
        apiFetch<{ success?: boolean; items?: any[] } | any[]>("/api/companies").catch(() => [])
      ]);

      setProperties(resProps.items || []);
      setUnits(resUnits.items || []);
      setCompanies(Array.isArray(resCompanies) ? resCompanies : (resCompanies.items || []));
    } catch (error: any) {
      toast.error("Failed to load property portfolio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      toast.error("Property name and address are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        address,
        ownershipType: classification,
        purchasePrice: valuation ? parseFloat(valuation) : 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
        status: "Active",
        company: companyId || undefined,
        metadata: {
          type: classification,
          parcelInformation: parcelInfo
        }
      };

      await apiFetch("/api/atlasbook/properties", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Property registered successfully.");
      setShowAddModal(false);
      
      // Reset form
      setName("");
      setAddress("");
      setClassification("Residential");
      setValuation("");
      setParcelInfo("");
      setPurchaseDate("");
      setCompanyId("");

      fetchData();
    } catch (error: any) {
      toast.error("Failed to register property: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Process data
  const mappedProperties: RealEstateProperty[] = properties.map(prop => {
    const propUnits = units.filter(u => {
      const uPropId = u.property && typeof u.property === "object" ? u.property._id : u.property;
      return String(uPropId) === String(prop._id);
    });
    const totalCount = propUnits.length;
    const occupiedCount = propUnits.filter(u => u.status === "Occupied").length;
    const occupancyRate = totalCount > 0 ? (occupiedCount / totalCount) * 100 : 0;

    return {
      id: prop._id,
      name: prop.name,
      location: prop.address,
      type: prop.ownershipType === "Commercial" || prop.metadata?.type === "Commercial" ? "Commercial" : "Residential",
      valuation: prop.purchasePrice || 0,
      units: totalCount,
      occupancy: occupancyRate
    };
  });

  const totalValuation = mappedProperties.reduce((sum, p) => sum + p.valuation, 0);
  const totalUnits = mappedProperties.reduce((sum, p) => sum + p.units, 0);
  const totalOccupiedUnits = units.filter(u => u.status === "Occupied").length;
  const avgOccupancy = totalUnits > 0 ? Math.round((totalOccupiedUnits / totalUnits) * 100) : 0;

  const filteredPortfolio = mappedProperties.filter(p => {
    if (filterType === "commercial") return p.type === "Commercial";
    if (filterType === "residential") return p.type === "Residential";
    return true;
  });

  // Export report helper
  const handleExportCSV = () => {
    if (filteredPortfolio.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    const headers = ["Asset Code", "Property Name", "Location", "Classification", "Rentable Units", "Occupancy Rate", "Valuation"];
    const rows = filteredPortfolio.map(p => [
      p.id,
      p.name,
      p.location,
      p.type,
      p.units,
      `${p.occupancy.toFixed(1)}%`,
      p.valuation
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `property_portfolio_${activeEntity.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10 transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-850 hover:border-amber-500/50 hover:bg-zinc-800 px-3 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-500" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
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
              <table className="w-full text-xs text-left text-zinc-400 font-mono">
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
                  {filteredPortfolio.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-zinc-500">
                        No property assets found matching this classification. Click "Add Property" to register one.
                      </td>
                    </tr>
                  ) : (
                    filteredPortfolio.map((prop) => (
                      <tr key={prop.id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3 text-zinc-500">{prop.id.slice(-6).toUpperCase()}</td>
                        <td className="py-3 text-zinc-200 font-bold">{prop.name}</td>
                        <td className="py-3 text-zinc-400">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 text-amber-500/80 mr-1 flex-shrink-0" /> 
                            <span className="truncate max-w-[200px]" title={prop.location}>{prop.location}</span>
                          </div>
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
                            <span className={`font-bold ${prop.occupancy >= 90 ? "text-emerald-400" : prop.occupancy > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                              {prop.occupancy.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-extrabold text-white">${prop.valuation.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Register Real Estate Asset</span>
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Property Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Blue Water Premium Condos"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 1420 Ocean Dr, Miami Coastal, FL"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Valuation ($)</label>
                  <input
                    type="number"
                    value={valuation}
                    onChange={(e) => setValuation(e.target.value)}
                    placeholder="e.g. 12500000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Parcel Information / Legal Description</label>
                  <input
                    type="text"
                    value={parcelInfo}
                    onChange={(e) => setParcelInfo(e.target.value)}
                    placeholder="e.g. Lot 4 Block 9, Folio 30-4202-001-0140"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Associated Company</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="">No Company Binding</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-lg font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesList;
