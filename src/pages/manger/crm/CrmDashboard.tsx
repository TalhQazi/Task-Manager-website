import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

const STAT_CARD_CONFIG = [
  { key: 'contacts',     label: 'Total Contacts',  icon: '👥', color: 'text-sky-400',     border: 'border-sky-500/20',     glow: 'bg-sky-500',     bg: 'bg-sky-500/10' },
  { key: 'companies',    label: 'Companies',        icon: '🏢', color: 'text-indigo-400',  border: 'border-indigo-500/20',  glow: 'bg-indigo-500',  bg: 'bg-indigo-500/10' },
  { key: 'activeDeals',  label: 'Active Deals',     icon: '⚡', color: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'bg-amber-500',   bg: 'bg-amber-500/10' },
  { key: 'wonDeals',     label: 'Won Deals',        icon: '🏆', color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'lostDeals',    label: 'Lost Deals',       icon: '📉', color: 'text-red-400',     border: 'border-red-500/20',     glow: 'bg-red-500',     bg: 'bg-red-500/10' },
  { key: 'activeTasks',  label: 'Pending Tasks',    icon: '📋', color: 'text-violet-400',  border: 'border-violet-500/20',  glow: 'bg-violet-500',  bg: 'bg-violet-500/10' },
  { key: 'pipelineValue',label: 'Pipeline Value',   icon: '💰', color: 'text-teal-400',    border: 'border-teal-500/20',    glow: 'bg-teal-500',    bg: 'bg-teal-500/10', wide: true },
  { key: 'revenue',      label: 'Closed Revenue',   icon: '📈', color: 'text-emerald-300', border: 'border-emerald-400/20', glow: 'bg-emerald-400', bg: 'bg-emerald-400/10', wide: true },
];

const STAGE_CONFIG: Record<string, { bar: string; dot: string; text: string }> = {
  Leads:     { bar: 'from-sky-500 to-blue-400',      dot: 'bg-sky-400',     text: 'text-sky-400' },
  Qualified: { bar: 'from-indigo-500 to-violet-400', dot: 'bg-indigo-400',  text: 'text-indigo-400' },
  Proposal:  { bar: 'from-amber-500 to-orange-400',  dot: 'bg-amber-400',   text: 'text-amber-400' },
  Won:       { bar: 'from-emerald-500 to-teal-400',  dot: 'bg-emerald-400', text: 'text-emerald-400' },
};

const TYPE_CONFIG: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  deal:          { icon: '💼', bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  task:          { icon: '✅', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  communication: { icon: '💬', bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
};

const PRIORITY_CONFIG: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  Urgent: { dot: 'bg-red-400',    text: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/25' },
  High:   { dot: 'bg-orange-400', text: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  Medium: { dot: 'bg-amber-400',  text: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' },
  Low:    { dot: 'bg-slate-500',  text: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/25' },
};

const formatCurrency = (value: number) => {
  if (!value) return '$0';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

// Animated counter
function CountUp({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{count.toLocaleString()}</>;
}

export default function CRMDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'activity' | 'followups'>('activity');

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet('/api/crm-dashboard')
      .then((res: any) => setData(res))
      .catch((err: any) => setError(err?.message || 'Unable to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const monthlyDeals   = useMemo(() => data?.monthlyDeals     || [], [data]);
  const conversionStages = useMemo(() => data?.conversionStages || [], [data]);
  const recentActivities = useMemo(() => data?.recentActivities || [], [data]);
  const upcomingFollowups = useMemo(() => data?.upcomingFollowups || [], [data]);
  const metrics = data?.metrics || {};

  const maxDeals = Math.max(...monthlyDeals.map((d: any) => d.deals || 0), 1);

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
              📊
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CRM Dashboard</h1>
              <p className="text-neutral-500 text-xs mt-0.5">High-level summary of CRM activity, pipeline health & follow-ups</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl self-start sm:self-auto">
            {loading ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Syncing…</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Read-only · Live</>
            )}
          </div>
        </header>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400">⚠</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Stat Cards ── */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {STAT_CARD_CONFIG.map((card, i) => {
                const raw = metrics[card.key] ?? 0;
                const isCurrency = card.key === 'pipelineValue' || card.key === 'revenue';
                return (
                  <div
                    key={card.key}
                    className={`
                      relative overflow-hidden rounded-2xl border ${card.border} bg-neutral-900/70 p-5
                      hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 group cursor-default
                      ${card.wide ? 'col-span-2 sm:col-span-3 lg:col-span-3' : ''}
                    `}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 ${card.glow} group-hover:opacity-20 transition-opacity`} />
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200`}>
                        {card.icon}
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${card.color}`}>
                      {isCurrency ? formatCurrency(raw) : <CountUp target={raw} duration={800 + i * 60} />}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1 uppercase tracking-widest">{card.label}</p>
                  </div>
                );
              })}
            </section>

            {/* ── Charts Row ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Monthly Deals Bar Chart */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white">Monthly Deals</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Closed & expected deal volume</p>
                  </div>
                  <span className="text-xs text-neutral-600 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg font-medium">
                    {monthlyDeals.length} months
                  </span>
                </div>

                {monthlyDeals.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-neutral-600 text-sm">No data available</div>
                ) : (
                  <div className="flex items-end gap-2 h-40">
                    {monthlyDeals.map((item: any, i: number) => {
                      const pct = Math.max((item.deals || 0) / maxDeals * 100, 4);
                      const isMax = item.deals === maxDeals;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className={`text-[10px] font-bold tabular-nums transition-all ${isMax ? 'text-sky-400' : 'text-neutral-700 group-hover:text-neutral-500'}`}>
                            {item.deals || 0}
                          </span>
                          <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${pct * 1.3}px` }}>
                            <div
                              className={`absolute inset-0 rounded-t-lg transition-all duration-700 ${isMax
                                ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                                : 'bg-gradient-to-t from-neutral-700 to-neutral-600 group-hover:from-sky-700 group-hover:to-sky-500'
                              }`}
                            />
                          </div>
                          <span className="text-[9px] text-neutral-600 uppercase tracking-wide group-hover:text-neutral-500 transition-colors">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conversion Stages */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white">Conversion Stages</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Stage-by-stage pipeline breakdown</p>
                  </div>
                </div>

                {conversionStages.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-neutral-600 text-sm">No stage data</div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {conversionStages.map((stage: any) => {
                        const cfg = STAGE_CONFIG[stage.stage] || { bar: 'from-neutral-600 to-neutral-500', dot: 'bg-neutral-500', text: 'text-neutral-400' };
                        return (
                          <div key={stage.stage} className="flex items-center gap-3">
                            <div className="w-20 sm:w-24 text-right">
                              <span className={`text-xs font-semibold ${cfg.text}`}>{stage.stage}</span>
                            </div>
                            <div className="flex-1 h-6 bg-neutral-800 rounded-lg overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${cfg.bar} rounded-lg flex items-center justify-end pr-2 transition-all duration-1000`}
                                style={{ width: `${Math.max(stage.percent, 5)}%` }}
                              >
                                <span className="text-[9px] font-bold text-white/80">{stage.count}</span>
                              </div>
                            </div>
                            <span className="w-10 text-xs font-bold text-neutral-500 tabular-nums text-right">{stage.percent}%</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* SVG trend line */}
                    {conversionStages.length > 1 && (
                      <div className="rounded-xl overflow-hidden bg-neutral-800/30 border border-neutral-800/60 p-3">
                        <p className="text-[9px] text-neutral-600 uppercase tracking-wider mb-2 font-medium">Trend</p>
                        <svg viewBox="0 0 500 80" className="w-full h-14">
                          <defs>
                            <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polygon
                            points={`0,80 ${conversionStages.map((s: any, i: number) => {
                              const x = (i / (conversionStages.length - 1)) * 500;
                              const y = 80 - (s.percent / 100) * 80;
                              return `${x},${y}`;
                            }).join(' ')} 500,80`}
                            fill="url(#trendGrad)"
                          />
                          <polyline
                            points={conversionStages.map((s: any, i: number) => {
                              const x = (i / (conversionStages.length - 1)) * 500;
                              const y = 80 - (s.percent / 100) * 80;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {conversionStages.map((s: any, i: number) => {
                            const x = (i / (conversionStages.length - 1)) * 500;
                            const y = 80 - (s.percent / 100) * 80;
                            return (
                              <circle key={s.stage} cx={x} cy={y} r="4" fill="#0f1117" stroke="#38bdf8" strokeWidth="2" />
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* ── Activity + Follow-ups (tabbed) ── */}
            <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-neutral-800">
                {(['activity', 'followups'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePanel(tab)}
                    className={`flex-1 px-6 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
                      ${activePanel === tab
                        ? 'text-white border-b-2 border-sky-500 bg-sky-500/5'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40'
                      }`}
                  >
                    {tab === 'activity' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent Activity
                        {recentActivities.length > 0 && (
                          <span className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/25 px-1.5 py-0.5 rounded-full font-bold">
                            {recentActivities.length}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upcoming Follow-ups
                        {upcomingFollowups.length > 0 && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full font-bold">
                            {upcomingFollowups.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* Activity Panel */}
              {activePanel === 'activity' && (
                <div className="p-4 sm:p-6">
                  {recentActivities.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">📭</div>
                      <p className="text-neutral-500 text-sm">No recent activity available</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {recentActivities.map((item: any) => {
                        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.communication;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/40 transition-all duration-150 group"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${cfg.bg} ${cfg.border}`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-200 group-hover:text-white transition-colors leading-snug">{item.text}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                  {item.avatar || item.user?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="text-xs text-neutral-500">{item.user}</span>
                                {item.time && (
                                  <>
                                    <span className="text-neutral-700">·</span>
                                    <span className="text-xs text-neutral-600">{item.time}</span>
                                  </>
                                )}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  {item.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Follow-ups Panel */}
              {activePanel === 'followups' && (
                <div className="p-4 sm:p-6">
                  {upcomingFollowups.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">📅</div>
                      <p className="text-neutral-500 text-sm">No follow-ups scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {upcomingFollowups.map((item: any) => {
                        const pCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.Low;
                        const [month, day] = item.date ? item.date.split(' ') : ['', ''];
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/40 transition-all duration-150 group"
                          >
                            {/* Date block */}
                            {month ? (
                              <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">{month}</span>
                                <span className="text-lg font-black text-white leading-none">{day}</span>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-xl">📅</div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">{item.contact}</p>
                              {item.task && <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.task}</p>}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              {item.time && (
                                <span className="text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-lg font-medium">
                                  {item.time}
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-bold border ${pCfg.text} ${pCfg.bg} ${pCfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Footer legend ── */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 pb-4">
              <p className="text-xs text-neutral-700">CRM Dashboard · Read-only view · Data refreshes on page load</p>
              <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                {[
                  { label: 'Contacts', color: 'bg-sky-500' },
                  { label: 'Deals', color: 'bg-amber-500' },
                  { label: 'Tasks', color: 'bg-violet-500' },
                  { label: 'Revenue', color: 'bg-emerald-500' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-xs text-neutral-600">{l.label}</span>
                  </div>
                ))}
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}