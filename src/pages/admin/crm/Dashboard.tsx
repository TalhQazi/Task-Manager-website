import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

type DashboardMetrics = {
  contacts: number;
  companies: number;
  totalDeals: number;
  activeDeals: number;
  lostDeals: number;
  activeTasks: number;
  pipelineValue: number;
  revenue: number;
  averageDealSize: number;
};

type MonthlyDeal = {
  month: string;
  deals: number;
};

type ConversionStage = {
  stage: string;
  count: number;
  percent: number;
};

type RecentActivity = {
  id: string;
  type: 'deal' | 'task' | 'communication';
  text: string;
  user: string;
  time: string;
  avatar: string;
};

type FollowupItem = {
  id: string;
  contact: string;
  task: string;
  date: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
};

type DashboardData = {
  metrics: DashboardMetrics;
  monthlyDeals: MonthlyDeal[];
  conversionStages: ConversionStage[];
  recentActivities: RecentActivity[];
  upcomingFollowups: FollowupItem[];
};

const TYPE_CONFIG = {
  deal: {
    classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    icon: '💼',
    label: 'Deal',
  },
  task: {
    classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    icon: '✅',
    label: 'Task',
  },
  communication: {
    classes: 'bg-violet-500/10 text-violet-400 border border-violet-500/30',
    icon: '💬',
    label: 'Comm',
  },
};

const PRIORITY_CONFIG = {
  Urgent: { classes: 'text-red-300 bg-red-500/15 border-red-500/40', dot: 'bg-red-400' },
  High: { classes: 'text-orange-300 bg-orange-500/15 border-orange-500/40', dot: 'bg-orange-400' },
  Medium: { classes: 'text-amber-300 bg-amber-500/15 border-amber-500/40', dot: 'bg-amber-400' },
  Low: { classes: 'text-slate-400 bg-slate-500/10 border-slate-500/30', dot: 'bg-slate-500' },
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

// Animated counter hook
function useCountUp(target: number | string, duration = 1200) {
  const [display, setDisplay] = useState<number | string>(typeof target === 'number' ? 0 : target);

  useEffect(() => {
    if (typeof target !== 'number') {
      setDisplay(target);
      return;
    }
    let start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

// Mini sparkline bar chart
function SparkBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-end h-8 gap-0.5">
      {[0.4, 0.6, 0.5, 0.8, 0.7, pct / 100].map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-t-sm bg-current opacity-40 transition-all duration-700"
          style={{ height: `${v * 100}%` }}
        />
      ))}
    </div>
  );
}

// KPI Card
function KPICard({
  stat,
  delay = 0,
}: {
  stat: {
    id: string;
    label: string;
    value: number | string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    sparkValue?: number;
    sparkMax?: number;
  };
  delay?: number;
}) {
  const displayed = useCountUp(
    typeof stat.value === 'number' ? stat.value : stat.value === '—' ? 0 : 0,
    1000 + delay
  );

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${stat.border} bg-neutral-900/80 backdrop-blur-sm
        p-5 shadow-lg transition-all duration-300
        hover:shadow-2xl hover:-translate-y-1 hover:border-opacity-70
        group cursor-default
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${stat.glow} transition-opacity duration-300 group-hover:opacity-40`} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center text-xl shadow-inner transition-transform duration-200 group-hover:scale-110`}>
          {stat.icon}
        </div>
        {stat.sparkValue !== undefined && stat.sparkMax !== undefined && (
          <div className={`${stat.color} opacity-60`}>
            <SparkBar value={stat.sparkValue} max={stat.sparkMax} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`text-3xl font-black tracking-tight ${stat.color} mb-1 tabular-nums`}>
        {stat.value === '—' ? '—' : typeof stat.value === 'string' ? stat.value : displayed.toLocaleString()}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest">{stat.label}</p>

      {/* Live indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-neutral-600 font-medium">LIVE</span>
      </div>
    </div>
  );
}

export default function CRMDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks'>('activities');

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiGet<DashboardData>('/api/crm-dashboard')
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load dashboard');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const kpiStats = useMemo(() => {
    const m = data?.metrics;
    return [
      {
        id: 'contacts', label: 'Total Contacts',
        value: m ? m.contacts : '—',
        icon: '👥', color: 'text-sky-400', bg: 'bg-sky-500/10',
        border: 'border-sky-500/25', glow: 'bg-sky-500',
        sparkValue: m?.contacts, sparkMax: m ? m.contacts + 50 : 100,
      },
      {
        id: 'companies', label: 'Companies',
        value: m ? m.companies : '—',
        icon: '🏢', color: 'text-indigo-400', bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/25', glow: 'bg-indigo-500',
        sparkValue: m?.companies, sparkMax: m ? m.companies + 20 : 50,
      },
      {
        id: 'active_deals', label: 'Active Deals',
        value: m ? m.activeDeals : '—',
        icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/10',
        border: 'border-amber-500/25', glow: 'bg-amber-500',
        sparkValue: m?.activeDeals, sparkMax: m?.totalDeals,
      },
      {
        id: 'tasks', label: 'Open Tasks',
        value: m ? m.activeTasks : '—',
        icon: '📋', color: 'text-violet-400', bg: 'bg-violet-500/10',
        border: 'border-violet-500/25', glow: 'bg-violet-500',
        sparkValue: m?.activeTasks, sparkMax: m ? m.activeTasks + 10 : 30,
      },
      {
        id: 'pipeline', label: 'Pipeline Value',
        value: m ? formatCurrency(m.pipelineValue) : '—',
        icon: '💰', color: 'text-teal-400', bg: 'bg-teal-500/10',
        border: 'border-teal-500/25', glow: 'bg-teal-500',
      },
      {
        id: 'revenue', label: 'Closed Revenue',
        value: m ? formatCurrency(m.revenue) : '—',
        icon: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25', glow: 'bg-emerald-500',
      },
    ];
  }, [data]);

  const recentActivities = useMemo(() => data?.recentActivities ?? [], [data]);
  const upcomingFollowups = useMemo(() => data?.upcomingFollowups ?? [], [data]);
  const conversionData = useMemo(() => data?.conversionStages ?? [], [data]);

  // Win rate calculation
  const winRate = useMemo(() => {
    if (!data) return 0;
    const total = data.metrics.activeDeals + data.metrics.lostDeals;
    return total > 0 ? Math.round((data.metrics.activeDeals / total) * 100) : 0;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#080b10] font-sans">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-violet-500 to-teal-500 z-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-500/20">
                CRM
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sales Dashboard
              </h1>
            </div>
            <p className="text-neutral-500 text-sm ml-12">
              Live metrics · Contacts, Deals, Tasks & Communications
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {error && (
              <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                ⚠ {error}
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
              {isLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Syncing data…
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live · Just updated
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── KPI Grid ── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiStats.map((stat, i) => (
            <KPICard key={stat.id} stat={stat} delay={i * 80} />
          ))}
        </section>

        {/* ── Secondary stats bar ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Avg. Deal Size',
              value: data ? formatCurrency(data.metrics.averageDealSize) : '—',
              icon: '📊',
              color: 'text-white',
            },
            {
              label: 'Win Rate',
              value: data ? `${winRate}%` : '—',
              icon: '🎯',
              color: winRate >= 50 ? 'text-emerald-400' : 'text-orange-400',
              bar: winRate,
            },
            {
              label: 'Lost Deals',
              value: data ? data.metrics.lostDeals : '—',
              icon: '📉',
              color: 'text-red-400',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors duration-200"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 font-medium truncate">{item.label}</p>
                <p className={`text-xl font-black ${item.color} tabular-nums`}>{item.value}</p>
                {'bar' in item && item.bar !== undefined && (
                  <div className="mt-1.5 h-1 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ── Pipeline Funnel ── */}
        {conversionData.length > 0 && (
          <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Pipeline Funnel</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Stage-by-stage conversion</p>
              </div>
              <span className="text-xs font-medium text-neutral-500 bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-full">
                {conversionData.length} stages
              </span>
            </div>
            <div className="space-y-3">
              {conversionData.map((stage, i) => {
                const colors = [
                  'from-sky-500 to-blue-600',
                  'from-indigo-500 to-violet-600',
                  'from-violet-500 to-purple-600',
                  'from-amber-500 to-orange-600',
                  'from-emerald-500 to-teal-600',
                ];
                const color = colors[i % colors.length];
                return (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-28 sm:w-36 text-xs text-neutral-400 font-medium truncate text-right">{stage.stage}</div>
                    <div className="flex-1 h-7 bg-neutral-800 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-lg transition-all duration-1000 flex items-center justify-end pr-3`}
                        style={{ width: `${Math.max(stage.percent, 4)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white/90">{stage.count}</span>
                      </div>
                    </div>
                    <div className="w-10 text-xs font-bold text-neutral-400 tabular-nums">{stage.percent}%</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Activities + Tasks ── */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            {(['activities', 'tasks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                  ${activeTab === tab
                    ? 'text-white border-b-2 border-sky-500 bg-sky-500/5'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40'
                  }
                `}
              >
                {tab === 'activities' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activities
                    {recentActivities.length > 0 && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        {recentActivities.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upcoming Tasks
                    {upcomingFollowups.length > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        {upcomingFollowups.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="p-4 sm:p-6">
              <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700 pr-1">
                {(recentActivities.length
                  ? recentActivities
                  : [{ id: 'empty', type: 'communication' as const, text: 'No recent CRM activity', user: 'System', time: '', avatar: 'S' }]
                ).map((act) => {
                  const cfg = TYPE_CONFIG[act.type];
                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-150 group border border-transparent hover:border-neutral-700/50"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${cfg.classes}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-200 group-hover:text-white transition-colors leading-snug truncate">{act.text}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold text-neutral-400">{act.avatar}</span>
                          </div>
                          <span className="text-xs text-neutral-500">{act.user}</span>
                          {act.time && (
                            <>
                              <span className="text-xs text-neutral-700">·</span>
                              <span className="text-xs text-neutral-600">{act.time}</span>
                            </>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${cfg.classes}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="p-4 sm:p-6">
              <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700 pr-1">
                {(upcomingFollowups.length
                  ? upcomingFollowups
                  : [{ id: 'empty', contact: 'No follow-ups scheduled', task: '', date: '', time: '', priority: 'Low' as const }]
                ).map((item) => {
                  const pCfg = PRIORITY_CONFIG[item.priority];
                  const [month, day] = item.date ? item.date.split(' ') : ['', ''];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-150 border border-transparent hover:border-neutral-700/50 group"
                    >
                      {/* Date block */}
                      {month ? (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">{month}</span>
                          <span className="text-lg font-black text-white leading-none">{day}</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                          <span className="text-xl">📅</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">{item.contact}</p>
                        {item.task && <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.task}</p>}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {item.time && (
                          <span className="text-xs font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-lg">
                            {item.time}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border flex items-center gap-1 ${pCfg.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-4">
          <p className="text-xs text-neutral-700">
            CRM Dashboard · All metrics from live database
          </p>
          <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}