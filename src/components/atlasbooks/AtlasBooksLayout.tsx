import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAtlasBooks, UserRole, ChartTimeframe } from "../../contexts/AtlasBooksContext";
import { EntitySelector } from "./EntitySelector";
import { Breadcrumbs } from "./Breadcrumbs";
import { 
  Terminal, ShieldAlert, KeyRound, Sparkles, Bell, 
  ChevronRight, Calendar, Landmark, Settings2, ShieldCheck, 
  Menu, X, TrendingUp, AlertTriangle, BadgeAlert
} from "lucide-react";

export const AtlasBooksLayout: React.FC = () => {
  const { 
    activeRole, updateRole, 
    timeframe, updateTimeframe, 
    liveEventStream, triggerMockPulseAlert, resolveAlert,
    stats
  } = useAtlasBooks();

  const location = useLocation();
  const navigate = useNavigate();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Group the 30 screens into logical sections matching the specification
  const navigationGroups = [
    {
      title: "Core Operations",
      items: [
        { name: "Executive Command Center", path: "/atlasbooks/executive-snapshot", screenId: 1 }
      ]
    },
    {
      title: "Financial Operating Screens",
      items: [
        { name: "Profit & Loss (P&L)", path: "/atlasbooks/financials/p-and-l", screenId: 2 },
        { name: "Balance Sheet", path: "/atlasbooks/financials/balance-sheet", screenId: 3 },
        { name: "Cash Flow", path: "/atlasbooks/financials/cash-flow", screenId: 4 },
        { name: "Budget vs Actual", path: "/atlasbooks/financials/budget-vs-actual", screenId: 5 },
        { name: "Forecasting Sandbox", path: "/atlasbooks/financials/forecasting", screenId: 6 },
        { name: "Consolidated Statements", path: "/atlasbooks/financials/consolidated-statements", screenId: 7 }
      ]
    },
    {
      title: "Operations Screens",
      items: [
        { name: "Payroll Ledger", path: "/atlasbooks/operations/payroll", screenId: 8 },
        { name: "Vendor Ledger", path: "/atlasbooks/operations/vendors", screenId: 9 },
        { name: "Expenses Hub", path: "/atlasbooks/operations/expenses", screenId: 10 },
        { name: "Assets Register", path: "/atlasbooks/operations/assets", screenId: 11 },
        { name: "Approval Chains", path: "/atlasbooks/operations/approvals", screenId: 12 }
      ]
    },
    {
      title: "Property & Real Estate",
      items: [
        { name: "Properties Directory", path: "/atlasbooks/properties/list", screenId: 13 },
        { name: "Units Index", path: "/atlasbooks/properties/units", screenId: 14 },
        { name: "Occupancy & Leases", path: "/atlasbooks/properties/occupancy", screenId: 15 },
        { name: "Net Operating Income (NOI)", path: "/atlasbooks/properties/noi", screenId: 16 },
        { name: "Maintenance Costs", path: "/atlasbooks/properties/maintenance", screenId: 17 },
        { name: "Title Deed Monitoring", path: "/atlasbooks/properties/title-monitoring", screenId: 18 }
      ]
    },
    {
      title: "Monitoring & Security Center",
      items: [
        { name: "Fraud Analytics", path: "/atlasbooks/monitoring/fraud", screenId: 19 },
        { name: "Credit Line Monitoring", path: "/atlasbooks/monitoring/credit", screenId: 20 },
        { name: "Title Alert Registry", path: "/atlasbooks/monitoring/title-alerts", screenId: 21 },
        { name: "Lien Alert Center", path: "/atlasbooks/monitoring/lien-alerts", screenId: 22 },
        { name: "Cash Alert Runway", path: "/atlasbooks/monitoring/cash-alerts", screenId: 23 },
        { name: "Anomaly Machine Learning", path: "/atlasbooks/monitoring/anomaly", screenId: 24 }
      ]
    },
    {
      title: "AtlasPulse Pulse Feeds",
      items: [
        { name: "Duplicate Payments", path: "/atlasbooks/pulse/duplicate-payments", screenId: 25 },
        { name: "Missing Receipts Queue", path: "/atlasbooks/pulse/missing-receipts", screenId: 26 },
        { name: "Vendor Invoice Anomalies", path: "/atlasbooks/pulse/vendor-anomalies", screenId: 27 },
        { name: "Cash Burn Declines", path: "/atlasbooks/pulse/cash-declines", screenId: 28 },
        { name: "Credit Changes Index", path: "/atlasbooks/pulse/credit-changes", screenId: 29 },
        { name: "New Property Liens", path: "/atlasbooks/pulse/new-liens", screenId: 30 }
      ]
    }
  ];

  const activeAlertsCount = liveEventStream.filter(a => !a.resolved).length;

  const handleAlertClick = (alert: any) => {
    setIsAlertOpen(false);
    switch (alert.type) {
      case "duplicate_payment":
        navigate("/atlasbooks/pulse/duplicate-payments");
        break;
      case "missing_receipt":
        navigate("/atlasbooks/pulse/missing-receipts");
        break;
      case "vendor_anomaly":
        navigate("/atlasbooks/pulse/vendor-anomalies");
        break;
      case "cash_decline":
        navigate("/atlasbooks/pulse/cash-declines");
        break;
      case "credit_change":
        navigate("/atlasbooks/pulse/credit-changes");
        break;
      case "new_lien":
        navigate("/atlasbooks/pulse/new-liens");
        break;
      default:
        navigate("/atlasbooks/executive-snapshot");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-400">
      
      {/* Global Real-Time Event Shimmer Indicator (Flashes when updates tick) */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 animate-pulse z-55" />

      {/* Header Bar */}
      <header className="sticky top-0 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/80 h-16 px-4 md:px-6 flex items-center justify-between z-40">
        
        {/* Navigation & Logo */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 transition-all md:hidden text-zinc-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/10 border border-amber-400/25">
              <Landmark className="w-5 h-5 text-zinc-950 stroke-[2]" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-black tracking-widest uppercase font-mono bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                ATLASBOOKS
              </span>
              <span className="text-[9px] block text-zinc-500 uppercase tracking-widest font-bold -mt-1 font-mono">
                FINANCIAL OS
              </span>
            </div>
          </div>

          <div className="hidden lg:block h-6 w-[1px] bg-zinc-800" />
          
          {/* Breadcrumbs for tracking screen location */}
          <div className="hidden lg:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Global Operations Controls */}
        <div className="flex items-center space-x-4">
          
          {/* Entity Scoping drop-down */}
          <EntitySelector />

          {/* Timeframe selector (instant widget refresh binding) */}
          <div className="hidden md:flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
            {(["Daily", "Monthly", "Quarterly", "Yearly"] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => updateTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${
                  timeframe === tf
                    ? "bg-amber-500 text-zinc-950 shadow font-extrabold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Role switcher preview for role-aware security UX */}
          <div className="relative group hidden xl:block">
            <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs hover:border-amber-500/30 transition-all cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-zinc-400">Role:</span>
              <span className="text-amber-400 font-bold font-mono">{activeRole}</span>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <div className="px-3 py-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-900 mb-1">
                Select Simulation Role
              </div>
              {(["Executive", "Auditor", "Accountant", "PropertyManager"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => updateRole(role)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    activeRole === role
                      ? "bg-amber-500/10 text-amber-400 font-bold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Live Alert Hub Toggle Button */}
          <button 
            onClick={() => setIsAlertOpen(true)}
            className="relative p-2 rounded-lg border border-zinc-800/80 hover:border-amber-500/50 bg-zinc-900 hover:bg-zinc-900/80 transition-all text-zinc-400 hover:text-white"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-zinc-950 font-mono ring-2 ring-[#09090b] animate-bounce">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Navigation Sidebar (Collapsible on Desktop/Mobile) */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 w-64 border-r border-zinc-800/60 bg-[#09090b]/95 md:bg-zinc-950/40 z-30
          flex flex-col justify-between py-4 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div className="flex-1 overflow-y-auto px-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <h4 className="text-[10px] font-mono tracking-widest font-black uppercase text-zinc-600 px-3 py-1">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.screenId}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[9px] font-bold font-mono text-zinc-700 bg-zinc-900 group-hover:text-zinc-400 group-hover:bg-zinc-800 px-1 py-0.5 rounded ml-2">
                          #{item.screenId}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Operations Stats */}
          <div className="px-4 pt-4 border-t border-zinc-900 space-y-3">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-bold font-mono uppercase text-zinc-500">
                <span>Integrity Score</span>
                <span className="text-emerald-400 font-bold">{stats.integrityScore}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.integrityScore}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 px-1">
              <span>Performance:</span>
              <span className="text-amber-500/90 font-bold">Sub-2s Loads</span>
            </div>
          </div>
        </aside>

        {/* Content Outlet Frame */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0c0c0e] to-[#09090b] p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Slide-out AtlasPulse Drawer Panel */}
      {isAlertOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
            onClick={() => setIsAlertOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950 border-l border-zinc-800/80 shadow-2xl p-6 flex flex-col justify-between z-55 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BadgeAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="font-extrabold text-sm tracking-wider uppercase font-mono bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                    ATLASPULSE ALERTS
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAlertOpen(false)}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert Actions Bar */}
              <div className="mb-4">
                <button
                  onClick={() => triggerMockPulseAlert()}
                  className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/5 hover:from-amber-500/25 hover:to-amber-600/10 border border-amber-500/25 text-amber-400 hover:text-white rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TRIGGER SIMULATION ALARM</span>
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-3.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
                {liveEventStream.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 text-xs">
                    No active system anomalies identified.
                  </div>
                ) : (
                  liveEventStream.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`relative border rounded-xl p-3.5 transition-all duration-300 ${
                        alert.resolved 
                          ? "bg-zinc-900/40 border-zinc-900 opacity-60" 
                          : alert.severity === "critical"
                            ? "bg-rose-950/15 border-rose-500/20 hover:border-rose-500/40"
                            : "bg-amber-950/10 border-amber-500/20 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                          alert.resolved
                            ? "bg-zinc-800 text-zinc-500"
                            : alert.severity === "critical"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {alert.resolved ? "Resolved" : alert.type.replace("_", " ")}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs font-semibold text-zinc-200 mt-2 hover:text-amber-400 cursor-pointer transition-colors" onClick={() => handleAlertClick(alert)}>
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-2.5">
                        <span>{alert.entityName}</span>
                        {alert.value && <span className="font-bold text-zinc-300">{alert.value}</span>}
                      </div>

                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="mt-3 w-full py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-zinc-300 hover:text-white transition-all"
                        >
                          Resolve & Close Audit Flag
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Security UX indicators */}
            <div className="border-t border-zinc-900 pt-4 mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center"><KeyRound className="w-3 h-3 text-amber-500 mr-1" /> Multi-Factor Auth</span>
                <span className="text-emerald-400 font-bold font-mono">ACTIVE (MFA)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center"><Settings2 className="w-3 h-3 text-amber-500 mr-1" /> Active Approval Chain</span>
                <span className="text-zinc-300">Level 2 Signed</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
