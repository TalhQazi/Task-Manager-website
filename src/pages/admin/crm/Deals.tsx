import { useState, useMemo, useEffect } from 'react';
import { crmDealsApi, type CRMDeal, type CRMDealsResponse } from '@/lib/crmDealsApi';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const STAGES = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  'Qualification':   { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-400',   glow: '' },
  'Needs Analysis':  { bg: 'bg-sky-500/10',      text: 'text-sky-400',     border: 'border-sky-500/30',     dot: 'bg-sky-400',     glow: '' },
  'Proposal':        { bg: 'bg-indigo-500/10',   text: 'text-indigo-400',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400',  glow: '' },
  'Negotiation':     { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   glow: '' },
  'Closed Won':      { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  'Closed Lost':     { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400',     glow: '' },
};

const PROB_COLOR = (p: number) => {
  if (p >= 75) return 'from-emerald-500 to-teal-400';
  if (p >= 50) return 'from-sky-500 to-blue-400';
  if (p >= 25) return 'from-amber-500 to-orange-400';
  return 'from-red-500 to-rose-400';
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatCurrencyShort = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return formatCurrency(val);
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Stage Badge
function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG['Qualification'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {stage}
    </span>
  );
}

// Probability Bar
function ProbBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${PROB_COLOR(value)} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-neutral-400 tabular-nums w-8">{value}%</span>
    </div>
  );
}

// Modal
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.6)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Input field
function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

const inputCls = (hasError = false) =>
  `w-full px-3 py-2.5 bg-neutral-900 border rounded-xl text-sm text-white placeholder-neutral-600
   outline-none transition-all duration-200 focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50
   ${hasError ? 'border-red-500/50' : 'border-neutral-800 hover:border-neutral-700'}`;

export default function CRMDeals() {
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);

  const [formData, setFormData] = useState({
    name: '', company: '', value: '', stage: STAGES[0], probability: 50, closeDate: '', owner: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pipelineMetrics, setPipelineMetrics] = useState({
    totalValue: 0, weightedValue: 0, wonDeals: 0, activeDeals: 0,
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [newStage, setNewStage] = useState('');
  const [newOwner, setNewOwner] = useState('');

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await crmDealsApi.list({ page: 1, limit: 100 });
        setDeals(response.items);
        if (response.metrics) setPipelineMetrics(response.metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
    fetchCompanies();
    fetchContacts();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-company`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data.items || []);
    } catch { /* silent */ }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-contacts`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts(data.items || []);
    } catch { /* silent */ }
  };

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      deal.name.toLowerCase().includes(q) ||
      deal.company.toLowerCase().includes(q) ||
      deal.owner.toLowerCase().includes(q);
    return matchesSearch && (stageFilter === 'All' || deal.stage === stageFilter);
  }), [deals, searchQuery, stageFilter]);

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowStageModal(false);
    setShowOwnerModal(false);
    setSelectedDeal(null);
    setFormErrors({});
  };

  const openCreate = () => {
    setFormData({ name: '', company: '', value: '', stage: STAGES[0], probability: 50, closeDate: '', owner: '' });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openStageUpdate = (deal: CRMDeal) => {
    setSelectedDeal(deal);
    setNewStage(deal.stage);
    setShowStageModal(true);
  };

  const openOwnerUpdate = (deal: CRMDeal) => {
    setSelectedDeal(deal);
    setNewOwner(deal.owner);
    setShowOwnerModal(true);
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'value' || name === 'probability'
        ? value === '' ? '' : Math.max(0, Number(value))
        : value,
    }));
  };

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Deal name is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    if (!formData.value || Number(formData.value) <= 0) errors.value = 'Value must be greater than 0';
    if (!formData.closeDate) errors.closeDate = 'Close date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;
    try {
      const newDeal = await crmDealsApi.create({
        name: formData.name, company: formData.company,
        value: Number(formData.value), stage: formData.stage as any,
        probability: Number(formData.probability), closeDate: formData.closeDate, owner: formData.owner,
      });
      setDeals((prev) => [newDeal.item, ...prev]);
      closeAllModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal');
    }
  };

  const handleStageSave = async () => {
    if (!selectedDeal) return;
    try {
      const updated = await crmDealsApi.update(selectedDeal.id, { stage: newStage as any });
      setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? updated.item : d)));
      closeAllModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
    }
  };

  const handleOwnerSave = async () => {
    if (!selectedDeal) return;
    try {
      const updated = await crmDealsApi.update(selectedDeal.id, { owner: newOwner });
      setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? updated.item : d)));
      closeAllModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update owner');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAllModals(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stage counts for filter pills
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: deals.length };
    STAGES.forEach((s) => { counts[s] = deals.filter((d) => d.stage === s).length; });
    return counts;
  }, [deals]);

  return (
    <div className="min-h-screen bg-[#080b10]">
      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-violet-500 to-teal-500 z-50" />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400 text-lg">⚠</span>
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 transition-colors text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" style={{ animationDuration: '0.7s' }} />
              </div>
              <p className="text-neutral-400 text-sm font-medium">Loading deals…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/30 flex items-center justify-center text-xl">
                  💼
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Deals</h1>
                  <p className="text-neutral-500 text-xs mt-0.5">Track opportunities · Monitor pipeline · Forecast revenue</p>
                </div>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-sky-600 to-violet-600 text-white shadow-lg shadow-sky-500/20
                  hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-200 border border-sky-500/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Deal
              </button>
            </header>

            {/* ── Metrics ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Pipeline', value: formatCurrencyShort(pipelineMetrics.totalValue),
                  icon: '💰', color: 'text-white', border: 'border-neutral-800', glow: 'bg-neutral-500',
                },
                {
                  label: 'Weighted Value', value: formatCurrencyShort(pipelineMetrics.weightedValue),
                  icon: '📊', color: 'text-sky-400', border: 'border-sky-500/20', glow: 'bg-sky-500',
                },
                {
                  label: 'Active Deals', value: pipelineMetrics.activeDeals,
                  icon: '⚡', color: 'text-amber-400', border: 'border-amber-500/20', glow: 'bg-amber-500',
                },
                {
                  label: 'Won Deals', value: pipelineMetrics.wonDeals,
                  icon: '🏆', color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className={`relative overflow-hidden bg-neutral-900/70 rounded-2xl border ${m.border} p-5 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 group`}
                >
                  <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 ${m.glow} group-hover:opacity-20 transition-opacity`} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{m.icon}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-neutral-500 font-medium mt-1 uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </section>

            {/* ── Search + Filters ── */}
            <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search deals, companies, owners…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-sm text-white placeholder-neutral-600
                    outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Stage filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-600 font-medium mr-1 shrink-0">Filter:</span>
                {['All', ...STAGES].map((s) => {
                  const cfg = s !== 'All' ? STAGE_CONFIG[s] : null;
                  const isActive = stageFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStageFilter(s)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                        ${isActive
                          ? cfg
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                            : 'bg-white/10 text-white border-white/20'
                          : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400'
                        }
                      `}
                    >
                      {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                      {s}
                      <span className={`text-[10px] px-1 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/15' : 'bg-neutral-800'}`}>
                        {stageCounts[s] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Deals Table ── */}
            <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden">

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/50">
                      {['Deal', 'Company', 'Value', 'Stage', 'Probability', 'Close Date', 'Owner', ''].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">🔍</div>
                            <div>
                              <p className="text-neutral-300 font-semibold">No deals found</p>
                              <p className="text-sm text-neutral-600 mt-1">Try adjusting your search or filters</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDeals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="hover:bg-neutral-800/40 transition-colors duration-150 group"
                        >
                          {/* Deal name */}
                          <td className="px-5 py-4">
                            <span className="font-semibold text-white text-sm group-hover:text-sky-400 transition-colors">
                              {deal.name}
                            </span>
                          </td>

                          {/* Company */}
                          <td className="px-5 py-4">
                            <span className="text-sm text-neutral-400">{deal.company}</span>
                          </td>

                          {/* Value */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-emerald-400 tabular-nums">
                              {formatCurrency(deal.value)}
                            </span>
                          </td>

                          {/* Stage */}
                          <td className="px-5 py-4">
                            <StageBadge stage={deal.stage} />
                          </td>

                          {/* Probability */}
                          <td className="px-5 py-4">
                            <ProbBar value={deal.probability} />
                          </td>

                          {/* Close date */}
                          <td className="px-5 py-4">
                            <span className="text-xs text-neutral-500 font-medium">{formatDate(deal.closeDate)}</span>
                          </td>

                          {/* Owner */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                {deal.owner?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="text-xs text-neutral-400 truncate max-w-[80px]">{deal.owner || '—'}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={() => openStageUpdate(deal)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors"
                              >
                                Stage
                              </button>
                              <button
                                onClick={() => openOwnerUpdate(deal)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                              >
                                Owner
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Footer row */}
                {filteredDeals.length > 0 && (
                  <div className="px-5 py-3 border-t border-neutral-800/60 flex items-center justify-between bg-neutral-950/30">
                    <span className="text-xs text-neutral-600">
                      Showing <span className="text-neutral-400 font-medium">{filteredDeals.length}</span> of <span className="text-neutral-400 font-medium">{deals.length}</span> deals
                    </span>
                    <span className="text-xs text-neutral-600">
                      Total: <span className="text-emerald-400 font-bold">{formatCurrencyShort(filteredDeals.reduce((s, d) => s + d.value, 0))}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {filteredDeals.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">🔍</div>
                    <div>
                      <p className="text-neutral-300 font-semibold">No deals found</p>
                      <p className="text-sm text-neutral-600 mt-1">Adjust filters or create a new deal</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/60">
                    {filteredDeals.map((deal) => (
                      <div key={deal.id} className="p-4 hover:bg-neutral-800/30 transition-colors duration-150">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-base truncate">{deal.name}</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">{deal.company}</p>
                          </div>
                          <StageBadge stage={deal.stage} />
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-neutral-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Value</p>
                            <p className="text-base font-black text-emerald-400">{formatCurrencyShort(deal.value)}</p>
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Probability</p>
                            <ProbBar value={deal.probability} />
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Close Date</p>
                            <p className="text-xs font-semibold text-neutral-300">{formatDate(deal.closeDate)}</p>
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Owner</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                {deal.owner?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <p className="text-xs font-semibold text-neutral-300 truncate">{deal.owner || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => openStageUpdate(deal)}
                            className="flex-1 py-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
                          >
                            Update Stage
                          </button>
                          <button
                            onClick={() => openOwnerUpdate(deal)}
                            className="flex-1 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
                          >
                            Assign Owner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── Create Deal Modal ── */}
      {showCreateModal && (
        <ModalOverlay onClose={closeAllModals}>
          <div className="px-6 pt-6 pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/30 flex items-center justify-center text-lg">💼</div>
              <div>
                <h2 className="text-lg font-black text-white">Create New Deal</h2>
                <p className="text-xs text-neutral-500">Fill in the deal details below</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleCreateSave} className="p-6 space-y-4">
            <Field label="Deal Name *" error={formErrors.name}>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleCreateChange}
                className={inputCls(!!formErrors.name)}
                placeholder="e.g., Q3 Enterprise License"
              />
            </Field>

            <Field label="Company *" error={formErrors.company}>
              <select name="company" value={formData.company} onChange={handleCreateChange} className={inputCls(!!formErrors.company)}>
                <option value="">Select a company</option>
                {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Value ($) *" error={formErrors.value}>
                <input type="number" name="value" value={formData.value} onChange={handleCreateChange} className={inputCls(!!formErrors.value)} placeholder="0" />
              </Field>
              <Field label="Probability (%)">
                <input type="number" name="probability" value={formData.probability} onChange={handleCreateChange} min="0" max="100" className={inputCls()} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Stage">
                <select name="stage" value={formData.stage} onChange={handleCreateChange} className={inputCls()}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Close Date *" error={formErrors.closeDate}>
                <input type="date" name="closeDate" value={formData.closeDate} onChange={handleCreateChange} className={inputCls(!!formErrors.closeDate)} />
              </Field>
            </div>

            <Field label="Owner">
              <select name="owner" value={formData.owner} onChange={handleCreateChange} className={inputCls()}>
                <option value="">Unassigned</option>
                {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={closeAllModals}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl
                  bg-gradient-to-r from-sky-600 to-violet-600 border border-sky-500/30
                  hover:shadow-lg hover:shadow-sky-500/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                Create Deal
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ── Update Stage Modal ── */}
      {showStageModal && selectedDeal && (
        <ModalOverlay onClose={closeAllModals}>
          <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
            <h2 className="text-lg font-black text-white">Update Stage</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Changing stage for <span className="text-neutral-300 font-semibold">{selectedDeal.name}</span>
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              {STAGES.map((s) => {
                const cfg = STAGE_CONFIG[s];
                const isSelected = newStage === s;
                return (
                  <button
                    key={s}
                    onClick={() => setNewStage(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 text-left
                      ${isSelected ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400'}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    {s}
                    {isSelected && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={closeAllModals} className="flex-1 py-2.5 text-sm font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 hover:text-white transition-all">
                Cancel
              </button>
              <button
                onClick={handleStageSave}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-indigo-600 border border-indigo-500/40 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                Update Stage
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Assign Owner Modal ── */}
      {showOwnerModal && selectedDeal && (
        <ModalOverlay onClose={closeAllModals}>
          <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
            <h2 className="text-lg font-black text-white">Assign Owner</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Changing owner for <span className="text-neutral-300 font-semibold">{selectedDeal.name}</span>
            </p>
          </div>
          <div className="p-6 space-y-4">
            <Field label="Select Owner">
              <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className={inputCls()}>
                <option value="">Unassigned</option>
                {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            {newOwner && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {newOwner.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{newOwner}</p>
                  <p className="text-xs text-neutral-500">Will be assigned as owner</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={closeAllModals} className="flex-1 py-2.5 text-sm font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 hover:text-white transition-all">
                Cancel
              </button>
              <button
                onClick={handleOwnerSave}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-emerald-600 border border-emerald-500/40 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                Assign Owner
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}