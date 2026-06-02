import React, { useState } from "react";
import { useAtlasBooks } from "../../contexts/AtlasBooksContext";
import { KpiCard } from "../../components/atlasbooks/KpiCard";
import { HighContrastChart } from "../../components/atlasbooks/HighContrastChart";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  ShieldAlert, Activity, FileDown, Eye, Filter, Sparkles
} from "lucide-react";

const CommandCenter: React.FC = () => {
  const { stats, timeframe, activeRole, activeEntity, triggerMockPulseAlert } = useAtlasBooks();
  const [filterType, setFilterType] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Executive financial report compiled & exported successfully (PDF/CSV).");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Quick Operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-white font-mono flex items-center">
            <Activity className="w-5 h-5 text-amber-500 mr-2 animate-pulse" />
            Executive Command Center
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Real-time financial status scoping for <span className="text-amber-400 font-bold">{activeEntity.name}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Controls */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button 
              onClick={() => setFilterType("all")} 
              className={`px-3 py-1.5 rounded-md transition-all ${filterType === "all" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}
            >
              All Assets
            </button>
            <button 
              onClick={() => setFilterType("core")} 
              className={`px-3 py-1.5 rounded-md transition-all ${filterType === "core" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400"}`}
            >
              Core
            </button>
          </div>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-850 hover:border-amber-500/50 hover:bg-zinc-800 px-3.5 py-2 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-500" />
            <span>{isExporting ? "Compiling..." : "Export"}</span>
          </button>
        </div>
      </div>

      {/* Role Notice alert bar */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
            <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200">
              AtlasPulse Integrity Check: <span className="text-emerald-400">PASSED</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Secure Ledger Audit Trail active. Role permissions applied: <span className="text-amber-400 font-semibold">{activeRole}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-zinc-500 font-mono flex items-center bg-zinc-950 px-3 py-1.5 rounded border border-zinc-850">
          <Eye className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
          Audit Visibility: Full Ledger Access
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Revenue Today"
          value={stats.revenueToday}
          trend={{ value: "+4.2%", isPositive: true }}
          icon={DollarSign}
          subtitle={`Timeline: ${timeframe}`}
        />
        <KpiCard
          title="Revenue MTD"
          value={stats.revenueMtd}
          trend={{ value: "+12.8%", isPositive: true }}
          icon={TrendingUp}
          subtitle={`Timeline: ${timeframe}`}
        />
        <KpiCard
          title="Net Profit"
          value={stats.netProfit}
          trend={{ value: "-1.5%", isPositive: false }}
          icon={Wallet}
          subtitle={`Integrity Level: ${stats.integrityScore}%`}
        />
        <KpiCard
          title="Cash Position"
          value={stats.cashPosition}
          trend={{ value: "+0.8%", isPositive: true }}
          icon={Landmark}
          subtitle={`D&B Score: ${stats.creditScore}`}
        />
      </div>

      {/* Row 2: Charts and recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Box */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
                Holding Cash Performance Roll-Up
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Consolidated flows based on selected {timeframe} interval
              </p>
            </div>
            
            <div className="flex items-center space-x-1.5 text-[9px] font-mono text-zinc-500 bg-zinc-950 p-1 border border-zinc-850 rounded">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span className="text-zinc-400 font-bold uppercase">Net Runway</span>
            </div>
          </div>
          <div className="h-72">
            <HighContrastChart type="area" metricType="revenue" height={280} />
          </div>
        </div>

        {/* Action Panel / Recent activity */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
                Active Operations Queue
              </h3>
              <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded font-bold">
                Live
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              <div className="flex justify-between items-center text-xs p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-400">MFA Validation Status</span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold">SECURE</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-400">Approval Actions Pending</span>
                <span className="text-amber-500 font-mono text-[10px] font-bold">4 Requests</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-400">Credit Health Index</span>
                <span className="text-zinc-300 font-mono text-[10px] font-bold">{stats.creditScore} (AAA)</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Quick Actions Panel
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
              <button onClick={() => triggerMockPulseAlert()} className="py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-500 border border-zinc-800 hover:border-amber-500/30 rounded text-center cursor-pointer transition-all">
                TRIGGER PULSE
              </button>
              <button onClick={handleExport} className="py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-amber-500/30 rounded text-center cursor-pointer transition-all">
                RUN REPORT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
