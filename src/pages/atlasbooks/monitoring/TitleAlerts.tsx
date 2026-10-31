import React, { useEffect, useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, Check } from "lucide-react";

interface TitleAlertItem {
  id: string;
  date: string;
  property: string;
  alertType: "Deed Modification" | "Boundary Dispute" | "Easement Recording";
  severity: "Critical" | "Warning";
  status: "Active" | "Investigating" | "Resolved";
}

const TitleAlerts: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  const [alerts, setAlerts] = useState<TitleAlertItem[]>([]);
  const [totalMonitored, setTotalMonitored] = useState(0);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const res = await apiFetch<any>("/api/atlasbook/titles");
        const items = res.items || [];
        
        setTotalMonitored(items.length);

        const extractedAlerts: TitleAlertItem[] = [];
        items.forEach((title: any) => {
          if (title.status === "Encumbered" || title.status === "Under Review") {
            extractedAlerts.push({
              id: title._id || `ALRT-${Math.floor(Math.random() * 10000)}`,
              date: title.updatedAt ? new Date(title.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
              property: title.property?.name || title.parcelNumber || "Unknown Property",
              alertType: "Boundary Dispute",
              severity: title.status === "Encumbered" ? "Critical" : "Warning",
              status: "Active"
            });
          }
        });
        
        setAlerts(extractedAlerts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTitles();
  }, []);

  const handleResolve = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: "Resolved" } : a))
    );
  };

  const activeAlerts = alerts.filter(a => a.status !== "Resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <ShieldAlert className="w-5 h-5 text-amber-500 mr-2 animate-pulse" />
          Title Alert Registry
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          County recording notifications and alerts for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Title Alerts" value={`${activeAlerts} Alerts`} icon={ShieldAlert} subtitle="Requiring legal deed check" />
        <KpiCard title="Monitored Properties" value={`${totalMonitored} Properties`} icon={ShieldCheck} subtitle="Registry sweep checked" />
        <KpiCard title="Security Level" value="Level 3 Locked" icon={KeyRound} subtitle="Automatic block triggers" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          County Recording & Title Notifications
        </h3>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    {alert.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                    alert.severity === "Critical" ? "bg-rose-500/10 text-rose-450" : "bg-amber-500/10 text-amber-450"
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-200 font-bold">{alert.alertType} detected at {alert.property}</p>
                <span className="text-[10px] text-zinc-500 font-mono block">Registered date: {alert.date}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold mr-2 ${
                  alert.status === "Resolved" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : alert.status === "Investigating"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                }`}>
                  {alert.status}
                </span>

                {alert.status !== "Resolved" && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shadow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>RESOLVE</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TitleAlerts;
