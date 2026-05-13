import { useState, useMemo } from 'react';

// ─── Mock Data (replace with API endpoints) ───
const KPI_STATS = [
  { id: 'contacts', label: 'Total Contacts', value: 1248, icon: '👥', trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'companies', label: 'Total Companies', value: 86, icon: '🏢', trend: '+4%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'active_deals', label: 'Active Deals', value: 42, icon: '⚡', trend: '+8%', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'won_deals', label: 'Won Deals', value: 28, icon: '🏆', trend: '+15%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'lost_deals', label: 'Lost Deals', value: 14, icon: '📉', trend: '-5%', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'tasks', label: 'Upcoming Tasks', value: 37, icon: '📝', trend: '3 high priority', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'pipeline', label: 'Revenue Pipeline', value: '$2.4M', icon: '💰', trend: '+$340K', color: 'text-teal-600', bg: 'bg-teal-50' },
];

const MONTHLY_DEALS = [
  { month: 'Jan', deals: 18 }, { month: 'Feb', deals: 24 }, { month: 'Mar', deals: 22 },
  { month: 'Apr', deals: 31 }, { month: 'May', deals: 28 }, { month: 'Jun', deals: 35 },
];

const CONVERSION_DATA = [
  { stage: 'Leads', count: 450, percent: 100 },
  { stage: 'Qualified', count: 180, percent: 40 },
  { stage: 'Proposal', count: 95, percent: 21 },
  { stage: 'Won', count: 42, percent: 9.3 },
];

const RECENT_ACTIVITIES = [
  { id: 1, type: 'deal', text: 'Closed Enterprise SaaS License', user: 'Alice Johnson', time: '2 hours ago' },
  { id: 2, type: 'contact', text: 'Added 3 new contacts from TechCorp', user: 'Bob Smith', time: '4 hours ago' },
  { id: 3, type: 'task', text: 'Completed follow-up call with HealthFirst', user: 'Carol White', time: 'Yesterday' },
  { id: 4, type: 'campaign', text: 'Launched Q3 Email Blast campaign', user: 'David Lee', time: '2 days ago' },
  { id: 5, type: 'deal', text: 'Moved Fleet Upgrade to Negotiation', user: 'Alice Johnson', time: '3 days ago' },
];

const UPCOMING_FOLLOWUPS = [
  { id: 1, contact: 'John Doe (TechCorp)', task: 'Review contract terms', date: 'May 14', time: '10:00 AM', priority: 'High' },
  { id: 2, contact: 'Jane Smith (GreenLeaf)', task: 'Demo scheduling', date: 'May 15', time: '02:00 PM', priority: 'Medium' },
  { id: 3, contact: 'Alex Chen (HealthFirst)', task: 'Send renewal invoice', date: 'May 16', time: '09:30 AM', priority: 'Low' },
  { id: 4, contact: 'Maria Lopez (SwiftLogix)', task: 'Quarterly check-in', date: 'May 18', time: '11:00 AM', priority: 'High' },
];

const TYPE_COLORS = {
  deal: 'bg-blue-100 text-blue-700',
  contact: 'bg-indigo-100 text-indigo-700',
  task: 'bg-emerald-100 text-emerald-700',
  campaign: 'bg-amber-100 text-amber-700',
};

const PRIORITY_COLORS = { High: 'text-red-600 bg-red-50', Medium: 'text-amber-600 bg-amber-50', Low: 'text-gray-600 bg-gray-50' };

export default function CRMDashboard() {
  const maxDeals = Math.max(...MONTHLY_DEALS.map(d => d.deals), 1);

  // SVG Path Calculation for Conversion Line Chart
  const svgWidth = 500; const svgHeight = 120;
  const points = CONVERSION_DATA.map((d, i) => {
    const x = (i / (CONVERSION_DATA.length - 1)) * svgWidth;
    const y = svgHeight - (d.percent / 100) * svgHeight;
    return `${x},${y}`;
  }).join(' ');
  const fillPath = `0,${svgHeight} ${points} ${svgWidth},${svgHeight}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">High-level overview of pipeline health, team performance, and customer relationships.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Last synced: Just now
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat, idx) => (
          <div key={stat.id} className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${idx >= 4 ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center text-lg`}>{stat.icon}</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Deals Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Deals</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>This Quarter</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-3 h-40 px-2">
            {MONTHLY_DEALS.map((m, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center">
                  <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {m.deals} deals
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${(m.deals / maxDeals) * 100}%` }}
                  />
                </div>
                <span className="mt-2 text-xs text-gray-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Graph */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel & Conversion</h2>
          <div className="flex items-end justify-between gap-4 mb-4">
            {CONVERSION_DATA.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gradient-to-t from-blue-100 to-blue-50 rounded-lg p-2 text-center hover:shadow-sm transition-shadow">
                  <p className="text-lg font-bold text-gray-900">{d.count}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">{d.stage}</p>
                </div>
                {i < CONVERSION_DATA.length - 1 && (
                  <div className="text-xs text-gray-400 mt-1">↓ {(CONVERSION_DATA[i].percent - CONVERSION_DATA[i+1].percent).toFixed(1)}%</div>
                )}
              </div>
            ))}
          </div>
          {/* SVG Conversion Trend Line */}
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-20 mt-2">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={fillPath} fill="url(#grad)" />
            <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" />
            {CONVERSION_DATA.map((d, i) => {
              const x = (i / (CONVERSION_DATA.length - 1)) * svgWidth;
              const y = svgHeight - (d.percent / 100) * svgHeight;
              return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />;
            })}
          </svg>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${TYPE_COLORS[act.type]}`}>
                  {act.type[0].toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">{act.text}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{act.user}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View All Activity Log
          </button>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Follow-ups</h2>
          <div className="space-y-3">
            {UPCOMING_FOLLOWUPS.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                    <span className="text-[10px] text-gray-500 uppercase">{item.date.split(' ')[0]}</span>
                    <span>{item.date.split(' ')[1]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.contact}</p>
                    <p className="text-xs text-gray-500">{item.task}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">{item.time}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View Full Task Calendar
          </button>
        </div>
      </div>
    </div>
  );
}