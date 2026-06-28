import React, { useEffect, useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { AlertTriangle, ShieldCheck, Box, Check, Landmark } from "lucide-react";

interface LienItem {
  id: string;
  property: string;
  claimant: string;
  amount: number;
  filedDate: string;
  type: "Mechanic's Lien" | "County Tax Lien";
  status: "Active" | "Contested" | "Bonded" | "Released";
}

const LienAlerts: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [liens, setLiens] = useState<LienItem[]>([]);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const res = await apiFetch<any>("/api/atlasbook/titles");
        const items = res.items || [];
        const extractedLiens: LienItem[] = [];
        
        items.forEach((title: any) => {
          (title.liens || []).forEach((l: any) => {
            extractedLiens.push({
              id: l._id || `LIEN-${Math.floor(Math.random() * 10000)}`,
              property: title.property?.name || title.parcelNumber || "Unknown Property",
              claimant: l.holder,
              amount: l.amount,
              filedDate: l.recordedDate ? new Date(l.recordedDate).toLocaleDateString() : "Unknown Date",
              type: l.description?.includes("Tax") ? "County Tax Lien" : "Mechanic's Lien",
              status: "Active"
            });
          });
        });
        
        setLiens(extractedLiens);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTitles();
  }, []);

  const handleResolve = (id: string) => {
    setLiens(prev =>
      prev.map(l => (l.id === id ? { ...l, status: "Released" } : l))
    );
  };

  const activeLiens = liens.filter(l => l.status !== "Released").length;
  const totalLienClaims = liens.filter(l => l.status !== "Released").reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
          Lien Alert Center & Title Protection
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Property encumbrance tracking for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Liens" value={`${activeLiens} Claims`} icon={AlertTriangle} subtitle="Potential clouds on title deed" />
        <KpiCard title="Total Encumbrance Value" value={totalLienClaims} icon={Landmark} subtitle="Amount required to release title" />
        <KpiCard title="Protection Status" value="Locked (Bonded)" icon={ShieldCheck} subtitle="Legal recourse locked" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Active Property Liens Registry
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-450 font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5">Claim Code</th>
                <th className="py-2.5">Property Location</th>
                <th className="py-2.5">Claimant</th>
                <th className="py-2.5">Filing Type</th>
                <th className="py-2.5">Filed Date</th>
                <th className="py-2.5 text-right">Claim Amount</th>
                <th className="py-2.5 text-right">Recourse Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {liens.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-950/40">
                  <td className="py-3 text-zinc-500">{l.id}</td>
                  <td className="py-3 text-zinc-200 font-bold">{l.property}</td>
                  <td className="py-3">{l.claimant}</td>
                  <td className="py-3">
                    <span className="text-[10px] text-zinc-450">{l.type}</span>
                  </td>
                  <td className="py-3 text-zinc-550">{l.filedDate}</td>
                  <td className="py-3 text-right font-extrabold text-white">${l.amount.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        l.status === "Released" 
                          ? "bg-emerald-500/10 text-emerald-450" 
                          : l.status === "Contested"
                            ? "bg-amber-500/10 text-amber-450"
                            : "bg-rose-500/10 text-rose-450 animate-pulse"
                      }`}>
                        {l.status}
                      </span>
                      {l.status !== "Released" && (
                        <button
                          onClick={() => handleResolve(l.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-2 py-1 rounded text-[9px] font-black transition-all cursor-pointer"
                        >
                          Clear Bond
                        </button>
                      )}
                    </div>
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

export default LienAlerts;
