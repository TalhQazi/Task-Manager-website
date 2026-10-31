import React, { useState, useMemo, useEffect } from "react";
import { useAtlasBooks } from "../../../contexts/AtlasBooksContext";
import { apiFetch } from "../../../lib/api";
import { KpiCard } from "../../../components/atlasbooks/KpiCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, Landmark, TrendingUp, Sparkles, Sliders } from "lucide-react";

const Forecasting: React.FC = () => {
  const { activeEntity } = useAtlasBooks();
  
  const [data, setData] = useState({ cashPosition: 0, revenueMtd: 0, expensesMtd: 0, netProfit: 0 });

  // Slide settings
  const [revenueGrowth, setRevenueGrowth] = useState(8); // Monthly growth %
  const [opexScale, setOpexScale] = useState(4); // Monthly opex increase %

  useEffect(() => {
    const fetchForecastData = async () => {
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
          revenueMtd: plRes.revenue || 0,
          expensesMtd: plRes.expenses || 0,
          netProfit: plRes.netProfit || 0
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchForecastData();
  }, []);
  
  // Calculate dynamic cash runways based on sliders
  const forecastData = useMemo(() => {
    let cash = data.cashPosition;
    let rev = data.revenueMtd;
    let exp = data.expensesMtd;

    return Array.from({ length: 12 }).map((_, index) => {
      const monthIndex = index + 1;
      
      // Grow numbers
      rev = Math.round(rev * (1 + revenueGrowth / 100));
      exp = Math.round(exp * (1 + opexScale / 100));
      const profit = rev - exp;
      cash = Math.round(cash + profit);

      return {
        name: `Month ${monthIndex}`,
        Revenue: rev,
        Expenses: exp,
        Cash: cash
      };
    });
  }, [data.cashPosition, data.revenueMtd, data.expensesMtd, revenueGrowth, opexScale]);

  const endForecastCash = forecastData[11]?.Cash || data.cashPosition;
  const isHealthy = endForecastCash > data.cashPosition;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
          <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
          Financial Forecasting Sandbox
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Simulate future runway parameters for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Current Cash Position" value={data.cashPosition} icon={Landmark} subtitle="Active base index" />
        <KpiCard title="12-Month Projected Cash" value={endForecastCash} icon={DollarSign} subtitle={`Growth trajectory: ${isHealthy ? "Positive Runway" : "Net Burn Alert"}`} />
        <KpiCard title="Implied Growth Factor" value={`${revenueGrowth}% / Mo`} icon={TrendingUp} subtitle="User simulated parameters" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-5">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase flex items-center border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-amber-500 mr-1.5" />
            Simulation Parameters
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-300">Revenue Growth Rate</span>
              <span className="text-amber-400 font-bold">{revenueGrowth}% / Month</span>
            </div>
            <input 
              type="range" 
              min="-15" 
              max="30" 
              value={revenueGrowth} 
              onChange={(e) => setRevenueGrowth(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-zinc-500 font-mono">
              Adjusts month-over-month sales projections. Negative values simulate contraction.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-300">OpEx Inflation Rate</span>
              <span className="text-amber-400 font-bold">{opexScale}% / Month</span>
            </div>
            <input 
              type="range" 
              min="-5" 
              max="20" 
              value={opexScale} 
              onChange={(e) => setOpexScale(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-zinc-500 font-mono">
              Adjusts payroll and facility overhead burn expansion rates.
            </p>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850 space-y-1.5 font-mono text-[10px]">
            <div className="text-zinc-400 font-bold">SIMULATION METRICS:</div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Runway Runway:</span>
              <span className={isHealthy ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {isHealthy ? "Unlimited (>36 Mos)" : `${Math.max(1, Math.round(data.cashPosition / Math.abs(data.netProfit)))} Mos`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Burn Factor:</span>
              <span className="text-zinc-300 font-bold">
                ${forecastData.length > 0 ? Math.abs(forecastData[0].Revenue - forecastData[0].Expenses).toLocaleString() : 0} / Mo
              </span>
            </div>
          </div>
        </div>

        {/* Projection chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            12-Month Projected Cash Reserves Runway
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isHealthy ? "#10b981" : "#ef4444"} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isHealthy ? "#10b981" : "#ef4444"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} dy={8} fontFamily="Courier New" />
                <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} dx={-8} fontFamily="Courier New" />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[10px] font-mono shadow-2xl">
                          <div className="text-zinc-400 font-bold mb-1">{payload[0].payload.name}</div>
                          <div className="text-emerald-400">Cash: ${(payload[0].payload.Cash).toLocaleString()}</div>
                          <div className="text-amber-500">Rev: ${(payload[0].payload.Revenue).toLocaleString()}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="Cash" stroke={isHealthy ? "#10b981" : "#ef4444"} strokeWidth={2} fill="url(#forecastGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
