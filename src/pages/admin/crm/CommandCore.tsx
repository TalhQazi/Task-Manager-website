import { useEffect, useState, useMemo } from "react";
import { getApiBaseUrl } from "@/lib/admin/apiClient";
import { getAuthState } from "@/lib/auth";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Radio,
  Sliders,
  Play,
  RotateCw,
  Search,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  FileText,
  User,
  Building,
  Mail,
  Calendar,
  ExternalLink,
  Info,
  Lock
} from "lucide-react";

// Types
type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  continuityScore: number;
  revenueGravityScore: number;
  accountValue: number;
  lastInteractionDate: string;
};

type MetricData = {
  winRate: number;
  pipelineValue: number;
  revenue: number;
  atRiskAccountsCount: number;
  highGravityCount: number;
};

type GravityOpp = {
  id: string;
  name: string;
  company: string;
  email: string;
  gravityScore: number;
  tier: string;
  accountValue: number;
};

type AtRiskContact = {
  id: string;
  name: string;
  company: string;
  email: string;
  continuityScore: number;
  tier: string;
  lastInteraction: string;
};

type TelemetryEvent = {
  id: string;
  contactId: {
    _id: string;
    name: string;
    email: string;
    company: string;
  } | null;
  eventType: "email_open" | "site_visit" | "proposal_view" | "call_duration" | "sms_reply";
  description: string;
  metadata: any;
  timestamp: string;
};

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  conditions: any;
  actions: Array<{
    actionType: "send_email" | "send_sms" | "create_task" | "assign_salesperson" | "escalate";
    params: any;
  }>;
  isActive: boolean;
};

const EVENT_TYPE_LABELS = {
  email_open: { label: "Email Open", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: "✉️" },
  site_visit: { label: "Website Visit", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: "🌐" },
  proposal_view: { label: "Proposal Click", color: "text-teal-400 bg-teal-500/10 border-teal-500/20", icon: "📄" },
  call_duration: { label: "Call duration", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "📞" },
  sms_reply: { label: "SMS Reply", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: "💬" }
};

export default function CRMCommandCore() {
  // Authentication & RBAC Access Parameters
  const auth = getAuthState();
  const userRole = auth.role || "user"; // "super-admin" | "admin" | "manager" | "developer" | "employee"
  const isAdmin = userRole === "admin" || userRole === "super-admin";
  const isManagerOrAdmin = isAdmin || userRole === "manager";

  // Database States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metrics, setMetrics] = useState<MetricData>({ winRate: 0, pipelineValue: 0, revenue: 0, atRiskAccountsCount: 0, highGravityCount: 0 });
  const [ccieDist, setCcieDist] = useState({ maintained: 0, healthy: 0, attention: 0, atRisk: 0, critical: 0 });
  const [revenueWindows, setRevenueWindows] = useState<Array<{ month: string; amount: number; opportunities: number }>>([]);
  const [gravityOpps, setGravityOpps] = useState<GravityOpp[]>([]);
  const [atRiskContacts, setAtRiskContacts] = useState<AtRiskContact[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

  // Telemetry Simulator Form
  const [selectedContactId, setSelectedContactId] = useState("");
  const [simEventType, setSimEventType] = useState<keyof typeof EVENT_TYPE_LABELS>("email_open");
  const [simMetadata, setSimMetadata] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>(["[Telemetry System Initialized] Listening on active streams..."]);

  // Add Rule Form
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("email_open");
  const [ruleConditionTag, setRuleConditionTag] = useState("");
  const [ruleActionType, setRuleActionType] = useState<"send_email" | "create_task" | "escalate">("create_task");
  const [ruleActionParam, setRuleActionParam] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCcieFilter, setSelectedCcieFilter] = useState<string | null>(null);

  // Global Page states
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = auth.token;

  // 1. Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic contacts to feed simulator
      const contactsRes = await fetch(`${getApiBaseUrl()}/api/crm-contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contactsData = await contactsRes.json();
      setContacts(contactsData.items || []);
      if (contactsData.items?.length > 0) {
        setSelectedContactId(contactsData.items[0].id);
      }

      // Fetch commandcore metrics
      const metricsRes = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);
      setCcieDist(metricsData.ccieDistribution);
      setRevenueWindows(metricsData.predictedRevenueWindows);
      setGravityOpps(metricsData.gravityOpportunities);
      setAtRiskContacts(metricsData.atRiskContacts);

      // Fetch behavioral events
      const eventsRes = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventsData = await eventsRes.json();
      setTelemetryEvents(eventsData.items || []);

      // Fetch automation rules - restricted to managers or admins in backend
      if (isManagerOrAdmin) {
        const rulesRes = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/rules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          setAutomationRules(rulesData.items || []);
        } else {
          setAutomationRules([]);
        }
      } else {
        setAutomationRules([]);
      }

    } catch (err: any) {
      setError(err.message || "Failed to sync CommandCore data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. recalculate scores manually
  const handleRecalculate = async () => {
    if (!isManagerOrAdmin) return;
    try {
      setRecalculating(true);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/run-intelligence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setSimulatedLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Dynamic Engine Score Recalculation complete across all relationship channels.`,
        ...prev
      ]);
    } catch {
      setError("Failed to run scores calculations");
    } finally {
      setRecalculating(false);
    }
  };

  // 3. trigger simulated telemetry signal
  const handleTriggerTelemetry = async () => {
    if (!selectedContactId) return;
    try {
      setSimulating(true);
      const contactName = contacts.find(c => c.id === selectedContactId)?.name || "Contact";

      const res = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contactId: selectedContactId,
          eventType: simEventType,
          description: `Simulated signal: ${EVENT_TYPE_LABELS[simEventType].label} recorded via Admin Client follow-up telemetry dashboard.`,
          metadata: simMetadata ? { custom: simMetadata } : {}
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to trigger event");

      // Log triggered actions to dashboard telemetry window
      const actionsLog = data.triggeredActions?.length > 0
        ? data.triggeredActions.map((act: string) => `↳ [AUTOMATION ACTION]: ${act}`)
        : ["↳ [AUTOMATION ACTION]: Telemetry registered successfully. No automatic conditions met."];

      setSimulatedLogs(prev => [
        `[${new Date().toLocaleTimeString()}] TELEMETRY SIGNAL RECEIVED: [${EVENT_TYPE_LABELS[simEventType].label}] triggered for ${contactName}`,
        ...actionsLog,
        ...prev
      ]);

      // Refresh dashboard info
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  // 4. save new automation workflow rule
  const handleSaveRule = async () => {
    if (!isAdmin || !ruleName) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-commandcore/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: ruleName,
          trigger: ruleTrigger,
          conditions: ruleConditionTag ? { tagPresence: ruleConditionTag } : {},
          actions: [
            {
              actionType: ruleActionType,
              params: ruleActionType === "create_task" 
                ? { titleTemplate: ruleActionParam || "Outreach [ContactName]", priority: "High" }
                : ruleActionType === "send_email"
                ? { subject: "Follow up message", body: ruleActionParam || "Hello [ContactName]..." }
                : {}
            }
          ]
        })
      });
      if (!res.ok) throw new Error("Failed to save rule");
      setIsRuleModalOpen(false);
      setRuleName("");
      setRuleConditionTag("");
      setRuleActionParam("");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter At-Risk Contacts list
  const filteredAtRiskContacts = useMemo(() => {
    return atRiskContacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCcieFilter = selectedCcieFilter ? c.tier.toLowerCase() === selectedCcieFilter.toLowerCase() : true;
      return matchesSearch && matchesCcieFilter;
    });
  }, [atRiskContacts, searchQuery, selectedCcieFilter]);

  // Overall Health calculation
  const overallHealthScore = useMemo(() => {
    if (atRiskContacts.length === 0) return 96; // fallback high health
    // calculate average continuity score
    const total = atRiskContacts.reduce((sum, c) => sum + c.continuityScore, 0);
    const avg = Math.round(total / atRiskContacts.length);
    // inverse relationship (higher at risk average means lower overall health score)
    return Math.max(0, 100 - (100 - avg) * 0.4);
  }, [atRiskContacts]);

  return (
    <div className="min-h-screen bg-[#080b10] text-white font-sans relative overflow-x-hidden">
      {/* Visual background grids */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl bg-indigo-500/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl bg-sky-500/5 pointer-events-none" />

      {/* Top accent premium gradient line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 z-50 shadow-lg shadow-sky-500/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/25">
                C²
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CommandCore®</h1>
                  <span className="text-[10px] tracking-widest font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md uppercase">
                    {userRole === "admin" || userRole === "super-admin" ? "Admin Access" : userRole === "manager" ? "Manager Access" : "User Access"}
                  </span>
                </div>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Client Continuity Intelligence Engine (CCIE) · Revenue Gravity Engine (RGE)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {error && (
              <span className="text-xs text-rose-400 bg-rose-500/15 border border-rose-500/35 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </span>
            )}

            <button
              onClick={handleRecalculate}
              disabled={recalculating || !isManagerOrAdmin}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
              title={!isManagerOrAdmin ? "Recalculation restricted to Managers & Admins" : "Trigger full relationship scores recomputation"}
            >
              <RotateCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate Scores"}
              {!isManagerOrAdmin && <Lock className="w-3 h-3 opacity-60" />}
            </button>

            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-900/30 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Sync Engine
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 font-medium">Synchronizing CommandCore Engines...</p>
          </div>
        ) : (
          <>
            {/* ── HERO METRICS GRID ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Pipeline Value", value: `$${(metrics?.pipelineValue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-sky-400 border-sky-500/20 bg-sky-500/5" },
                { label: "Closed Revenue", value: `$${(metrics?.revenue || 0).toLocaleString()}`, icon: CheckCircle, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                { label: "At-Risk Relations", value: metrics?.atRiskAccountsCount || 0, icon: ShieldAlert, color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
                { label: "High Gravity Opps", value: metrics?.highGravityCount || 0, icon: Zap, color: "text-violet-400 border-violet-500/20 bg-violet-500/5" }
              ].map((m, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${m.color} bg-neutral-900/60 backdrop-blur-sm shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all duration-300`}>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">{m.label}</span>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tight">{m.value}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <m.icon className="w-5 h-5 text-current opacity-80" />
                  </div>
                </div>
              ))}
            </section>

            {/* ── MAIN ENGINES DUAL WORKSPACE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT SIDE: CLIENT CONTINUITY ENGINE (CCIE) - 7 cols */}
              <div className="lg:col-span-7 space-y-6">

                {/* Continuity Analytics Block */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-amber-500/5" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        Client Continuity Intelligence Engine (CCIE)
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">Real-time relationship maintenance & inactivity prevention</p>
                    </div>
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full font-bold">
                      {Math.round(overallHealthScore)}% Net Health
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Ring score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                          <circle
                            cx="56" cy="56" r="48"
                            stroke="#f59e0b" strokeWidth="6" fill="transparent"
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 * (1 - overallHealthScore / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-3xl font-black tracking-tight">{Math.round(overallHealthScore)}</span>
                          <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-widest">Index</span>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Bars */}
                    <div className="md:col-span-8 space-y-3">
                      {[
                        { tier: "Fully maintained", count: ccieDist?.maintained || 0, color: "bg-emerald-500" },
                        { tier: "Healthy", count: ccieDist?.healthy || 0, color: "bg-sky-500" },
                        { tier: "Needs attention", count: ccieDist?.attention || 0, color: "bg-amber-500" },
                        { tier: "At Risk", count: ccieDist?.atRisk || 0, color: "bg-orange-500" },
                        { tier: "Critical", count: ccieDist?.critical || 0, color: "bg-rose-500" }
                      ].map((item, index) => {
                        const total = Object.values(ccieDist).reduce((s, c) => s + c, 0) || 1;
                        const percent = Math.round((item.count / total) * 100);
                        const isSelected = selectedCcieFilter?.toLowerCase() === item.tier.toLowerCase();
                        return (
                          <div
                            key={index}
                            onClick={() => setSelectedCcieFilter(isSelected ? null : item.tier)}
                            className={`space-y-1.5 cursor-pointer group p-1.5 rounded-lg hover:bg-white/[0.02] transition-all ${isSelected ? "bg-white/[0.04] border border-white/5" : "border border-transparent"}`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-neutral-400 group-hover:text-white transition-colors">{item.tier}</span>
                              <span className="font-bold text-neutral-500 block">{item.count} ({percent}%)</span>
                            </div>
                            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* At-Risk Relations details list */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Relationship Continuity Register</h3>
                      <p className="text-xs text-neutral-500">Filtered view of relationships matching maintenance limits</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-neutral-800/50 border border-white/5 rounded-lg px-2.5 py-1">
                      <Search className="w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Filter name or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-xs text-white placeholder-slate-500 outline-none w-36"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredAtRiskContacts.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <Info className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-xs text-neutral-500 font-bold">No relationship matches found.</p>
                      </div>
                    ) : (
                      filteredAtRiskContacts.map((c, idx) => {
                        const scoreColor = c.continuityScore >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : c.continuityScore >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-rose-400 bg-rose-500/10 border-rose-500/20";
                        return (
                          <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/40 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                                {c.name.slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-white block leading-snug">{c.name}</span>
                                <span className="text-[10px] text-neutral-500 block font-semibold">{c.company}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] text-neutral-500 block font-semibold">Last interaction</span>
                                <span className="text-xs text-neutral-400 font-semibold">{new Date(c.lastInteraction).toLocaleDateString()}</span>
                              </div>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-1 rounded-lg border tabular-nums ${scoreColor}`}>
                                {c.continuityScore} CCIE
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: REVENUE GRAVITY & TELEMETRY SIMULATOR - 5 cols */}
              <div className="lg:col-span-5 space-y-6">

                {/* Telemetry simulator (Interactive signals) */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-indigo-500/5" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                    <h2 className="text-base font-extrabold text-white">Live Telemetry Simulator</h2>
                  </div>
                  <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                    Trigger artificial customer behaviors to watch the continuity and gravity scores recalculate instantly and launch auto-interventions.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Select Contact</label>
                      <select
                        value={selectedContactId}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                      >
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Behavior Trigger</label>
                        <select
                          value={simEventType}
                          onChange={(e) => setSimEventType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                        >
                          {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Custom Value / metadata</label>
                        <input
                          type="text"
                          placeholder="e.g. 5m duration, pricing, etc."
                          value={simMetadata}
                          onChange={(e) => setSimMetadata(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerTelemetry}
                      disabled={simulating || !selectedContactId}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {simulating ? "Transmitting..." : "Transmit Behavior Signal"}
                    </button>
                  </div>
                </div>

                {/* Revenue Gravity Engine (RGE) Forecast list */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-400 animate-bounce" />
                      <h2 className="text-base font-extrabold text-white">Revenue Gravity opportunities</h2>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                    Predictive opportunity matrix computed dynamically by behavioral telemetry signals.
                  </p>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {gravityOpps.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <Info className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-xs text-neutral-500 font-bold">No high gravity opportunities detected yet.</p>
                      </div>
                    ) : (
                      gravityOpps.map((opp, idx) => {
                        const tierColor = opp.gravityScore >= 90 ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                          : opp.gravityScore >= 75 ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                          : opp.gravityScore >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
                        return (
                          <div key={idx} className="p-3.5 rounded-xl bg-neutral-950/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs font-extrabold text-white block leading-snug">{opp.name}</span>
                                <span className="text-[10px] text-neutral-500 block font-semibold">{opp.company}</span>
                              </div>
                              <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md border ${tierColor}`}>
                                {opp.tier}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-1">
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Account Value</span>
                              <span className="text-xs font-extrabold text-white tabular-nums">${opp.accountValue.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Gravity Score</span>
                              <span className="text-xs font-black text-indigo-400 tabular-nums">{opp.gravityScore}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── INTERACTIVE WORKFLOW AUTOMATION BUILDER ── */}
            <section className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-indigo-500/5" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    Intelligent Automated Rules Workflow Builder
                    {!isManagerOrAdmin && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest ml-2 flex items-center gap-1 shrink-0 self-start">
                        <Lock className="w-2.5 h-2.5" /> View Only
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Define trigger conditions and micro-actions for automatic intervention</p>
                </div>

                {isManagerOrAdmin && (
                  <button
                    onClick={() => setIsRuleModalOpen(true)}
                    disabled={!isAdmin}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
                    title={!isAdmin ? "Rule creation restricted to Administrators" : "Add custom trigger rule"}
                  >
                    <Plus className="w-4 h-4" /> Add Automation Workflow
                    {!isAdmin && <Lock className="w-3 h-3 opacity-60" />}
                  </button>
                )}
              </div>

              {!isManagerOrAdmin ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                  <Lock className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-bold">Automation rules visual layout is restricted to Managers & Administrators.</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">Please contact your system supervisor to review pipeline oversight.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {automationRules.length === 0 ? (
                    <div className="col-span-3 text-center py-10 border border-dashed border-white/5 rounded-xl">
                      <Sliders className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 font-bold">No active automation workflows discovered.</p>
                    </div>
                  ) : (
                    automationRules.map((rule, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-neutral-950/40 border border-white/5 hover:border-indigo-500/20 hover:bg-neutral-950/60 transition-all flex flex-col justify-between group">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black text-white leading-tight truncate mr-2">{rule.name}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${rule.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-neutral-800 text-neutral-500"}`}>
                              {rule.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>

                          {/* Interactive diagram structure */}
                          <div className="space-y-4 relative py-2 pl-4 border-l border-dashed border-white/10 ml-2">
                            {/* Trigger Block */}
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-950/80" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Trigger Event</span>
                              <span className="text-xs font-bold text-sky-400">{EVENT_TYPE_LABELS[rule.trigger as keyof typeof EVENT_TYPE_LABELS]?.label || rule.trigger}</span>
                            </div>

                            {/* Conditions Block */}
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-950/80" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Condition Matrix</span>
                              <span className="text-xs text-neutral-300 font-semibold truncate block">
                                {rule.conditions?.tagPresence ? `Tag presence: '${rule.conditions.tagPresence}'` : "Always execute (No Conditions)"}
                              </span>
                            </div>

                            {/* Actions Block */}
                            {rule.actions.map((act, actIdx) => (
                              <div key={actIdx} className="relative">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-950/80 animate-pulse" />
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Action Executed</span>
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                                  {act.actionType.replace("_", " ")}
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                                <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5 truncate italic">
                                  {act.params?.titleTemplate || act.params?.subject || "VIP alert notification to manager"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* ── DOWN SECTION: TELEMETRY SIGNAL LOGS & RECENT SIGNALS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Cyber Telemetry Terminal (6 cols) */}
              <div className="lg:col-span-6 bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                  <h2 className="text-base font-extrabold text-white">Live Telemetry Event Logs</h2>
                </div>
                
                {/* Cyber Console */}
                <div className="w-full bg-black/80 rounded-xl p-4 border border-white/5 font-mono text-[10px] leading-relaxed text-neutral-400 h-[260px] overflow-y-auto space-y-2 scrollbar-thin">
                  {simulatedLogs.map((log, idx) => {
                    const isAction = log.includes("[AUTOMATION ACTION]");
                    const color = isAction ? "text-emerald-400" : log.includes("INITIALIZED") ? "text-sky-500" : "text-neutral-300";
                    return (
                      <div key={idx} className={`${color} leading-normal`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Signals list (6 cols) */}
              <div className="lg:col-span-6 bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden">
                <h2 className="text-base font-extrabold text-white mb-4">Recent Behavioral Events</h2>
                
                <div className="space-y-2.5 h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                  {telemetryEvents.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                      <Info className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 font-bold">No telemetry signals logged yet.</p>
                    </div>
                  ) : (
                    telemetryEvents.map((evt, idx) => {
                      const cfg = EVENT_TYPE_LABELS[evt.eventType] || { label: evt.eventType, color: "text-neutral-400 bg-neutral-500/10", icon: "⚙️" };
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-neutral-950/40 border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className="text-base shrink-0">{cfg.icon}</span>
                            <div>
                              <span className="text-[11px] font-bold text-white block leading-snug">
                                {evt.contactId?.name || "System Record"}
                              </span>
                              <span className="text-[9px] text-neutral-500 block leading-tight font-semibold">
                                {evt.description}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <span className="text-[9px] text-neutral-500 font-semibold block uppercase tracking-wider">
                              {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CREATE AUTOMATION RULE MODAL ── */}
      {isRuleModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-indigo-500/10 pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <h3 className="text-base font-black text-white">Create Automation Workflow</h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Site Activity Followup"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Trigger Event</label>
                  <select
                    value={ruleTrigger}
                    onChange={(e) => setRuleTrigger(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Condition: Tag Presence (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP, Enterprise"
                    value={ruleConditionTag}
                    onChange={(e) => setRuleConditionTag(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Execute Action</label>
                  <select
                    value={ruleActionType}
                    onChange={(e) => setRuleActionType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="create_task">Create Follow-Up Task</option>
                    <option value="send_email">Send Auto Check-In Email</option>
                    <option value="escalate">Escalate Opportunity to Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Action Value / Params</label>
                  <input
                    type="text"
                    placeholder={ruleActionType === "create_task" ? "e.g. Call [ContactName]" : "e.g. Hi [ContactName]..."}
                    value={ruleActionParam}
                    onChange={(e) => setRuleActionParam(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-5 mt-6 border-t border-white/5">
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-neutral-400 bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!ruleName}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-900/30 disabled:opacity-50"
              >
                Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
