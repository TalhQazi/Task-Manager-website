import React, { useState, useEffect } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, ShieldAlert, CheckCircle, FileText, Filter, Plus, X, Building } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "sonner";

interface PropertyUnit {
  _id: string;
  number: string;
  property: string;
  propertyId: string;
  sqft: number;
  monthlyRent: number;
  tenantName: string;
  leaseExpires: string;
  status: "Occupied" | "Vacant" | "Maintenance";
}

const UnitsList: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [statusFilter, setStatusFilter] = useState("all");
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState<"Residential" | "Commercial" | "Industrial">("Residential");
  const [status, setStatus] = useState<"Vacant" | "Occupied" | "Under Repair" | "Reserved">("Vacant");
  const [rentalPrice, setRentalPrice] = useState("");
  const [occupantName, setOccupantName] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [sqft, setSqft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUnits, resProps] = await Promise.all([
        apiFetch<{ success: boolean; items: any[] }>("/api/atlasbook/units"),
        apiFetch<{ success: boolean; items: any[] }>("/api/atlasbook/properties")
      ]);

      setUnits(resUnits.items || []);
      setProperties(resProps.items || []);
      if (resProps.items && resProps.items.length > 0) {
        setSelectedPropertyId(resProps.items[0]._id);
      }
    } catch (error: any) {
      toast.error("Failed to load units inventory: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !unitNumber) {
      toast.error("Parent property and unit number/name are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        property: selectedPropertyId,
        unitNumber,
        type: unitType,
        status,
        rentalPrice: rentalPrice ? parseFloat(rentalPrice) : 0,
        occupantName: status === "Occupied" ? occupantName : undefined,
        leaseEndDate: status === "Occupied" && leaseEndDate ? new Date(leaseEndDate).toISOString() : undefined,
        metadata: {
          sqft: sqft || "0"
        }
      };

      await apiFetch("/api/atlasbook/units", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Rentable unit added successfully.");
      setShowAddModal(false);
      
      // Reset form
      setUnitNumber("");
      setUnitType("Residential");
      setStatus("Vacant");
      setRentalPrice("");
      setOccupantName("");
      setLeaseEndDate("");
      setSqft("");

      fetchData();
    } catch (error: any) {
      toast.error("Failed to add rentable unit: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Process data
  const mappedUnits: PropertyUnit[] = units.map(u => {
    const propName = u.property && typeof u.property === "object" ? u.property.name : "Unknown Property";
    const statusMapped = u.status === "Under Repair" ? "Maintenance" : u.status === "Reserved" ? "Occupied" : u.status;
    
    return {
      _id: u._id,
      number: u.unitNumber,
      property: propName,
      propertyId: u.property && typeof u.property === "object" ? u.property._id : u.property,
      sqft: u.metadata?.sqft ? parseInt(u.metadata.sqft) : 0,
      monthlyRent: u.rentalPrice || 0,
      tenantName: u.status === "Occupied" && u.occupantName ? u.occupantName : "--- (Vacant)",
      leaseExpires: u.status === "Occupied" && u.leaseEndDate ? new Date(u.leaseEndDate).toISOString().split('T')[0] : "N/A",
      status: statusMapped as "Occupied" | "Vacant" | "Maintenance"
    };
  });

  const totalMonthlyRent = mappedUnits.filter(u => u.status === "Occupied").reduce((sum, u) => sum + u.monthlyRent, 0);

  const filteredUnits = mappedUnits.filter(u => {
    if (statusFilter === "occupied") return u.status === "Occupied";
    if (statusFilter === "vacant") return u.status === "Vacant";
    if (statusFilter === "maintenance") return u.status === "Maintenance";
    return true;
  });

  const occupancyPercent = mappedUnits.length > 0 
    ? Math.round((mappedUnits.filter(u => u.status === "Occupied").length / mappedUnits.length) * 100)
    : 0;

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

        <div className="flex items-center space-x-3">
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

          <button
            onClick={() => {
              if (properties.length === 0) {
                toast.error("Please add a property registry first before creating rentable units.");
                return;
              }
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10 transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Unit</span>
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
            <KpiCard title="Contracted Monthly Rent" value={totalMonthlyRent} icon={Landmark} subtitle="Gross rent receipts" />
            <KpiCard title="Rentable Capacity" value={`${mappedUnits.length} Units`} icon={FileText} subtitle="Active unit index count" />
            <KpiCard title="Active Occupancy Rate" value={`${occupancyPercent}%`} icon={CheckCircle} subtitle="Percentage of units occupied" />
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
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-zinc-500">
                        No rentable units found matching this status. Click "Add Unit" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => (
                      <tr key={u._id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3 text-zinc-200 font-bold">{u.number}</td>
                        <td className="py-3 text-zinc-400">{u.property}</td>
                        <td className="py-3 text-zinc-500">{u.sqft ? `${u.sqft} sqft` : "---"}</td>
                        <td className="py-3 text-zinc-300">{u.tenantName}</td>
                        <td className="py-3 text-zinc-500">{u.leaseExpires}</td>
                        <td className="py-3 text-right font-bold text-white">${u.monthlyRent.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            u.status === "Occupied" 
                              ? "bg-emerald-500/15 text-emerald-400" 
                              : u.status === "Vacant"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {u.status}
                          </span>
                        </td>
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
                <Building className="w-4 h-4 text-amber-500" />
                <span>Add Rentable Unit</span>
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Parent Property Registry *</label>
                  <select
                    required
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.ownershipType || "Residential"})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Unit Number / Code *</label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g. Suite 400 or Villa 05"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Unit Type</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Size (SqFt)</label>
                  <input
                    type="number"
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Monthly Rent Price ($)</label>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    placeholder="e.g. 3800"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Under Repair">Maintenance / Under Repair</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>

                {status === "Occupied" && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Tenant Full Name</label>
                      <input
                        type="text"
                        required
                        value={occupantName}
                        onChange={(e) => setOccupantName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Lease End Date</label>
                      <input
                        type="date"
                        value={leaseEndDate}
                        onChange={(e) => setLeaseEndDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                  </>
                )}
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
                  {submitting ? "Adding..." : "Add Rentable Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitsList;
