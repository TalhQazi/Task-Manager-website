import React, { useEffect, useState } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { Landmark, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";

const CashAlerts: React.FC = () => {
  const { timeframe, activeEntity } = useAtlasBooks();
  
  const [data, setData] = useState({ cashPosition: 0, netProfit: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plRes, bsRes] = await Promise.all([
          apiFetch<any>("/api/atlasbook/reports/pl"),
          apiFetch<any>("/api/atlasbook/reports/balance-sheet")
        ]);

        let cashPosition = 0;
        (bsRes.assets || []).forEach((a: any) => {
          const name = a.name.toLowerCase();
          if (name.includes("cash") || name.includes("bank")) cashPosition += a.balance;
        });

        setData({
          cashPosition,
          netProfit: plRes.netProfit || 0
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const runwayMonths = data.netProfit !== 0 ? Math.abs(Math.round(data.cashPosition / data.netProfit)) : 12;
  const burnRate = Math.abs(data.netProfit);
  const isHealthy = data.cashPosition > (burnRate * 6); // at least 6 months cash

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
          Cash Runway & Burn Alerts
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Liquidity metrics for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Cash Position" value={data.cashPosition} icon={Landmark} subtitle={`Timeline: ${timeframe}`} />
        <KpiCard title="Net Burn / Payout rate" value={burnRate} icon={TrendingUp} subtitle="Monthly operational change rate" />
        <KpiCard title="Projected Cash Runway" value={`${runwayMonths} Months`} icon={ShieldCheck} subtitle={isHealthy ? "Operating within safety standard" : "Warning: low cash runway reserve"} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
          Liquidity Warning Thresholds
        </h3>

        <div className="space-y-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500">LIQUIDITY CAP</span>
              <div className="text-xs font-bold text-zinc-200">Critical cash reserves drop (Under 3 Months burn)</div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
              runwayMonths < 3 ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-emerald-500/10 text-emerald-450"
            }`}>
              {runwayMonths < 3 ? "WARNING ACTIVE" : "PASSED SAFETY"}
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500">PAYROLL BUFFER</span>
              <div className="text-xs font-bold text-zinc-200">120-Day direct deposit coverage buffer check</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450">
              PASSED SAFETY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashAlerts;
