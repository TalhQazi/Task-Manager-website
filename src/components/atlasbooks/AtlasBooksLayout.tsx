import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAtlasBooks, UserRole, ChartTimeframe } from "../../contexts/AtlasBooksContext";
import { EntitySelector } from "./EntitySelector";
import { Breadcrumbs } from "./Breadcrumbs";
import { 
  Terminal, ShieldAlert, KeyRound, Sparkles, Bell, 
  ChevronRight, Settings2, ShieldCheck, 
  Menu, X, Landmark, BadgeAlert, Globe
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
        { name: "Dashboard", path: "/atlasbooks/executive-snapshot", screenId: 1 }
      ]
    },
    {
      title: "Financial Screens",
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
        { name: "Vendors", path: "/atlasbooks/operations/vendors", screenId: 9 },
        { name: "Expenses", path: "/atlasbooks/operations/expenses", screenId: 10 },
        { name: "Assets", path: "/atlasbooks/operations/assets", screenId: 11 },
        { name: "Approvals", path: "/atlasbooks/operations/approvals", screenId: 12 }
      ]
    },
    {
      title: "Property Screens",
      items: [
        { name: "Properties", path: "/atlasbooks/properties/list", screenId: 13 },
        { name: "Units", path: "/atlasbooks/properties/units", screenId: 14 },
        { name: "Occupancy", path: "/atlasbooks/properties/occupancy", screenId: 15 },
        { name: "NOI", path: "/atlasbooks/properties/noi", screenId: 16 },
        { name: "Maintenance Costs", path: "/atlasbooks/properties/maintenance", screenId: 17 },
        { name: "Title Monitoring", path: "/atlasbooks/properties/title-monitoring", screenId: 18 }
      ]
    },
    {
      title: "Monitoring Center",
      items: [
        { name: "Fraud Analytics", path: "/atlasbooks/monitoring/fraud", screenId: 19 },
        { name: "Credit Monitoring", path: "/atlasbooks/monitoring/credit", screenId: 20 },
        { name: "Title Alerts", path: "/atlasbooks/monitoring/title-alerts", screenId: 21 },
        { name: "Lien Alerts", path: "/atlasbooks/monitoring/lien-alerts", screenId: 22 },
        { name: "Cash Alerts", path: "/atlasbooks/monitoring/cash-alerts", screenId: 23 },
        { name: "Anomaly Detection", path: "/atlasbooks/monitoring/anomaly", screenId: 24 }
      ]
    },
    {
      title: "AtlasPulse Alerts",
      items: [
        { name: "Duplicate Payments", path: "/atlasbooks/pulse/duplicate-payments", screenId: 25 },
        { name: "Missing Receipts", path: "/atlasbooks/pulse/missing-receipts", screenId: 26 },
        { name: "Vendor Anomalies", path: "/atlasbooks/pulse/vendor-anomalies", screenId: 27 },
        { name: "Cash Declines", path: "/atlasbooks/pulse/cash-declines", screenId: 28 },
        { name: "Credit Changes", path: "/atlasbooks/pulse/credit-changes", screenId: 29 },
        { name: "New Liens", path: "/atlasbooks/pulse/new-liens", screenId: 30 }
      ]
    },
    {
      title: "Personal Area",
      items: [
        { name: "Personal Budget", path: "/atlasbooks/personal-budget", screenId: 31 }
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
    <div className="min-h-screen bg-[#d7e1ec] text-[#2c3e50] flex flex-col font-sans antialiased overflow-x-hidden">
      
      {/* Top Banner section containing generated luxury graphic background */}
      <div className="w-full bg-[url('/atlasbooks_header.png')] bg-cover bg-center h-48 relative flex flex-col items-center justify-center border-b-4 border-[#0e1824] shadow-lg">
        {/* Dark gold overlay for luxury blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/60" />
        
        {/* Gold Atlas Logo and Text */}
        <div className="relative z-10 text-center flex flex-col items-center select-none px-4">
          {/* SVG Atlas holding the globe */}
          <div className="w-16 h-16 mb-2 flex items-center justify-center bg-zinc-950/40 rounded-full border border-amber-500/20 backdrop-blur-sm">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#D4AF37] fill-current animate-pulse">
              <path d="M50,15 A20,20 0 1,0 50,55 A20,20 0 1,0 50,15 Z" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="3 3"/>
              <path d="M50,15 L50,55 M30,35 L70,35" stroke="#D4AF37" strokeWidth="2"/>
              <path d="M50,55 C43,65 42,75 50,90 C58,75 57,65 50,55" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
              <path d="M38,62 C34,68 38,72 45,72 C40,78 45,82 50,82 C55,82 60,78 55,72 C62,72 66,68 62,62" fill="none" stroke="#D4AF37" strokeWidth="2.5"/>
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-widest font-serif text-[#D4AF37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
            AtlasBooks®
          </h1>
          <p className="text-[10px] md:text-xs text-[#ebd382] font-mono tracking-wider font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] mt-1.5 uppercase">
            Internal Bookkeeping for Se7en Inc. and Its Global Family of Businesses
          </p>
        </div>

        {/* Small Hamburger Menu and Alert icons inside header */}
        <div className="absolute left-4 top-4 z-20 flex items-center space-x-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-black/40 border border-zinc-700/50 hover:bg-black/60 transition-all md:hidden text-zinc-300 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="absolute right-4 top-4 z-20 flex items-center space-x-3">
          {/* Alerts count */}
          <button 
            onClick={() => setIsAlertOpen(true)}
            className="relative p-2 rounded-lg bg-black/40 border border-zinc-700/50 hover:bg-black/60 transition-all text-zinc-300 hover:text-white"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-zinc-950 font-mono ring-2 ring-zinc-950 animate-bounce">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar: Deep Navy Blue Theme matching the mockup */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 w-64 border-r border-[#1a2634] bg-[#1c2a38] z-30
          flex flex-col justify-between py-4 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div className="flex-grow flex flex-col justify-between">
            
            {/* Header logo inside sidebar */}
            <div className="px-5 pb-4 border-b border-[#293d52]/60 flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg border border-blue-400/25">
                <Globe className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-wider font-mono">
                  AtlasBooks
                </span>
                <span className="text-[9px] block text-[#a5b4fc] font-mono tracking-widest -mt-0.5">
                  ENTERPRISE OS
                </span>
              </div>
            </div>

            {/* Navigation Lists */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {navigationGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#6c8299] px-3 uppercase block mb-1">
                    {group.title}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.screenId}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border-l-4 border-amber-500"
                              : "text-[#c2cfdc] hover:text-white hover:bg-[#253749] border-l-4 border-transparent"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Settings Gear Footer at Bottom */}
            <div className="px-3 pt-3 border-t border-[#293d52]/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 px-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono text-[#c2cfdc]">Role: <strong className="text-amber-400 font-bold">{activeRole}</strong></span>
              </div>
              <button 
                onClick={() => navigate("/atlasbooks/settings")}
                className="p-1.5 rounded-lg hover:bg-[#253749] text-[#c2cfdc] hover:text-white transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Layout with soft light-blue periwinkle styling */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Floating Controls Toolbar: Entity scope, role, timeframe */}
          <div className="bg-[#cbd7e3] border-b border-[#afc2d4] px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-inner z-10">
            <div className="flex items-center space-x-3">
              <Breadcrumbs />
              <EntitySelector />
            </div>

            <div className="flex items-center space-x-3">
              {/* Timeframe selector */}
              <div className="flex bg-[#bac9d7] border border-[#a4b8cc] rounded-lg p-0.5 shadow-inner">
                {(["Daily", "Monthly", "Quarterly", "Yearly"] as ChartTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => updateTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${
                      timeframe === tf
                        ? "bg-white text-zinc-950 shadow font-extrabold"
                        : "text-zinc-650 hover:text-zinc-900"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Role Toggle */}
              <div className="relative group">
                <div className="flex items-center space-x-1.5 bg-[#bac9d7] border border-[#a4b8cc] px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-white transition-colors text-zinc-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeRole}</span>
                </div>
                <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-2xl p-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  {(["Executive", "Auditor", "Accountant", "PropertyManager"] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => updateRole(role)}
                      className={`w-full text-left px-3 py-1.5 rounded text-[10px] transition-colors ${
                        activeRole === role
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Core Content Outlet Scroll Frame */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-[#b6c7d7] scrollbar-track-transparent">
            <div className="max-w-7xl mx-auto space-y-6 pb-16">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Slide-out Alerts Drawer */}
      {isAlertOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 transition-opacity" 
            onClick={() => setIsAlertOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-[#afc2d4] shadow-2xl p-6 flex flex-col justify-between z-55 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-150 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BadgeAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="font-extrabold text-sm tracking-wider uppercase font-mono text-zinc-800">
                    ATLASPULSE ALERTS
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAlertOpen(false)}
                  className="p-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => triggerMockPulseAlert()}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-zinc-950 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TRIGGER SIMULATION ALARM</span>
                </button>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
                {liveEventStream.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-xs">
                    No active system anomalies.
                  </div>
                ) : (
                  liveEventStream.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`relative border rounded-xl p-3.5 transition-all duration-300 ${
                        alert.resolved 
                          ? "bg-zinc-50 border-zinc-100 opacity-60" 
                          : alert.severity === "critical"
                            ? "bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-900"
                            : "bg-amber-50 border-amber-200 hover:border-amber-300 text-amber-900"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                          alert.resolved
                            ? "bg-zinc-200 text-zinc-500"
                            : alert.severity === "critical"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}>
                          {alert.resolved ? "Resolved" : alert.type.replace("_", " ")}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-xs font-semibold text-zinc-800 mt-2 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => handleAlertClick(alert)}>
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-zinc-500 border-t border-zinc-100 pt-2">
                        <span>{alert.entityName}</span>
                        {alert.value && <span className="font-bold text-zinc-700">{alert.value}</span>}
                      </div>

                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="mt-3 w-full py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-900 text-white text-[10px] font-bold transition-all"
                        >
                          Resolve Audit Flag
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-zinc-150 pt-4 mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center"><KeyRound className="w-3 h-3 text-zinc-400 mr-1" /> Multi-Factor Auth</span>
                <span className="text-emerald-600 font-bold">ACTIVE (MFA)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
