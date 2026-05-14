import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

const STAGES = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Qualification':  { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-400' },
  'Needs Analysis': { bg: 'bg-sky-500/10',      text: 'text-sky-400',     border: 'border-sky-500/30',     dot: 'bg-sky-400' },
  'Proposal':       { bg: 'bg-indigo-500/10',   text: 'text-indigo-400',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400' },
  'Negotiation':    { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  'Closed Won':     { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  'Closed Lost':    { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400' },
};

const PROB_GRADIENT = (p: number) => {
  if (p >= 75) return 'from-emerald-500 to-teal-400';
  if (p >= 50) return 'from-sky-500 to-blue-400';
  if (p >= 25) return 'from-amber-500 to-orange-400';
  return 'from-red-500 to-rose-400';
};

const formatCurrency = (val: number) => {
  if (!val) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG['Qualification'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {stage || 'Unknown'}
    </span>
  );
}

function ProbBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${PROB_GRADIENT(value)} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-neutral-400 tabular-nums">{value}%</span>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-[#0f1117] rounded-2xl w-full max-w-lg border border-neutral-800 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function CRMDealsReadOnly() {
  const [deals, setDeals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet('/api/crm-deals')
      .then((data: any) => setDeals(data.items || []))
      .catch((err: any) => setError(err?.message || 'Unable to load deals'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedDeal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      deal.name?.toLowerCase().includes(q) ||
      deal.company?.toLowerCase().includes(q) ||
      deal.owner?.toLowerCase().includes(q);
    return matchesSearch && (stageFilter === 'All' || deal.stage === stageFilter);
  }), [deals, searchQuery, stageFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: deals.length };
    STAGES.forEach((s) => { counts[s] = deals.filter((d) => d.stage === s).length; });
    return counts;
  }, [deals]);

  const totalFilteredValue = useMemo(
    () => filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0),
    [filteredDeals]
  );

  return (
    <div className="min-h-screen bg-[#080b10]">
      {/* Top accent */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-violet-500 to-teal-500 z-50" />

      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/30 flex items-center justify-center text-xl">
              💼
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Deals</h1>
              <p className="text-neutral-500 text-xs mt-0.5">Review pipeline deals · Read-only manager view</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Read-only view
          </div>
        </header>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400">⚠</span>
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Search + Filters ── */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, companies, owners…"
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-sm text-white placeholder-neutral-600
                outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Stage pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-600 font-medium mr-1 shrink-0">Stage:</span>
            {['All', ...STAGES].map((s) => {
              const cfg = s !== 'All' ? STAGE_CONFIG[s] : null;
              const isActive = stageFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                    ${isActive
                      ? cfg ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400'
                    }`}
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

        {/* ── Table/Cards ── */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 animate-spin" />
              </div>
              <p className="text-neutral-500 text-sm">Loading deals…</p>
            </div>
          )}

          {/* ── Desktop Table ── */}
          {!loading && (
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
                            <p className="text-sm text-neutral-600 mt-1">Try adjusting your search or stage filter</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => (
                      <tr key={deal.id || deal._id} className="hover:bg-neutral-800/40 transition-colors duration-150 group">
                        {/* Deal name */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-sm text-white group-hover:text-sky-400 transition-colors">
                            {deal.name}
                          </span>
                        </td>

                        {/* Company */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {deal.company && (
                              <div className="w-5 h-5 rounded-md bg-neutral-700 border border-neutral-600 flex items-center justify-center text-[9px] font-bold text-neutral-400 shrink-0">
                                {deal.company.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm text-neutral-400">{deal.company || '—'}</span>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(deal.value)}</span>
                        </td>

                        {/* Stage */}
                        <td className="px-5 py-4">
                          <StageBadge stage={deal.stage} />
                        </td>

                        {/* Probability */}
                        <td className="px-5 py-4">
                          {deal.probability != null ? <ProbBar value={deal.probability} /> : <span className="text-neutral-600 text-sm">—</span>}
                        </td>

                        {/* Close Date */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-neutral-500 font-medium">{formatDate(deal.closeDate)}</span>
                        </td>

                        {/* Owner */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {deal.owner && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                {deal.owner.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-neutral-400 truncate max-w-[80px]">{deal.owner || '—'}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedDeal(deal)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Footer */}
              {filteredDeals.length > 0 && (
                <div className="px-5 py-3 border-t border-neutral-800/60 bg-neutral-950/30 flex items-center justify-between">
                  <span className="text-xs text-neutral-600">
                    Showing <span className="text-neutral-400 font-medium">{filteredDeals.length}</span> of{' '}
                    <span className="text-neutral-400 font-medium">{deals.length}</span> deals
                  </span>
                  <span className="text-xs text-neutral-600">
                    Total: <span className="text-emerald-400 font-bold">{formatCurrency(totalFilteredValue)}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Mobile Cards ── */}
          {!loading && (
            <div className="md:hidden">
              {filteredDeals.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">🔍</div>
                  <div className="text-center">
                    <p className="text-neutral-300 font-semibold">No deals found</p>
                    <p className="text-sm text-neutral-600 mt-1">Try adjusting your search or filter</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-neutral-800/60">
                    {filteredDeals.map((deal) => (
                      <div key={deal.id || deal._id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-sm leading-snug">{deal.name}</h3>
                            {deal.company && (
                              <p className="text-xs text-neutral-500 mt-0.5">{deal.company}</p>
                            )}
                          </div>
                          <StageBadge stage={deal.stage} />
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-neutral-800/50 rounded-xl p-2.5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Value</p>
                            <p className="text-sm font-black text-emerald-400 tabular-nums">{formatCurrency(deal.value)}</p>
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-2.5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1.5">Probability</p>
                            {deal.probability != null
                              ? <ProbBar value={deal.probability} />
                              : <span className="text-sm text-neutral-600">—</span>
                            }
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-2.5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Close Date</p>
                            <p className="text-xs font-semibold text-neutral-300">{formatDate(deal.closeDate)}</p>
                          </div>
                          <div className="bg-neutral-800/50 rounded-xl p-2.5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Owner</p>
                            <div className="flex items-center gap-1.5">
                              {deal.owner && (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                  {deal.owner.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p className="text-xs font-semibold text-neutral-300 truncate">{deal.owner || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {/* View button */}
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          className="w-full py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Mobile footer */}
                  <div className="px-4 py-3 border-t border-neutral-800/60 bg-neutral-950/30 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">
                      <span className="text-neutral-400 font-medium">{filteredDeals.length}</span> deals
                    </span>
                    <span className="text-xs text-neutral-600">
                      Total: <span className="text-emerald-400 font-bold">{formatCurrency(totalFilteredValue)}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Deal Detail Modal ── */}
      {selectedDeal && (
        <ModalOverlay onClose={() => setSelectedDeal(null)}>
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-neutral-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/30 flex items-center justify-center text-xl shrink-0">
                  💼
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-snug">{selectedDeal.name}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Deal summary & pipeline info</p>
                  <div className="mt-2">
                    <StageBadge stage={selectedDeal.stage} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3">
            {/* Value highlight */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Deal Value</span>
              </div>
              <span className="text-xl font-black text-emerald-400 tabular-nums">{formatCurrency(selectedDeal.value)}</span>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Company',      value: selectedDeal.company,     icon: '🏢' },
                { label: 'Owner',        value: selectedDeal.owner,        icon: '👤' },
                { label: 'Close Date',   value: formatDate(selectedDeal.closeDate), icon: '📅' },
                { label: 'Probability',  value: selectedDeal.probability != null ? `${selectedDeal.probability}%` : '—', icon: '🎯', isProb: true, probVal: selectedDeal.probability },
              ].map((field) => (
                <div key={field.label} className="p-3 bg-neutral-800/30 border border-neutral-800/60 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{field.icon}</span>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">{field.label}</p>
                  </div>
                  {field.isProb && field.probVal != null ? (
                    <ProbBar value={field.probVal} />
                  ) : (
                    <p className="text-sm font-semibold text-neutral-200">{field.value || '—'}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDeal(null)}
              className="w-full py-2.5 text-sm font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 hover:text-white transition-all duration-200"
            >
              Close
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}