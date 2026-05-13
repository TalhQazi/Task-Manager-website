import { useState, useMemo } from 'react';

// ─── Mock Data (replace with API endpoints) ───
const KPI_STATS = [
  { id: 'contacts', label: 'Total Contacts', value: 1248, icon: '👥', trend: '+12%', color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-800' },
  { id: 'companies', label: 'Total Companies', value: 86, icon: '🏢', trend: '+4%', color: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-800' },
  { id: 'active_deals', label: 'Active Deals', value: 42, icon: '⚡', trend: '+8%', color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-800' },
  { id: 'won_deals', label: 'Won Deals', value: 28, icon: '🏆', trend: '+15%', color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-800' },
  { id: 'lost_deals', label: 'Lost Deals', value: 14, icon: '📉', trend: '-5%', color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-800' },
  { id: 'tasks', label: 'Upcoming Tasks', value: 37, icon: '📝', trend: '3 high priority', color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-800' },
  { id: 'pipeline', label: 'Revenue Pipeline', value: '$2.4M', icon: '💰', trend: '+$340K', color: 'text-teal-400', bg: 'bg-teal-950/30', border: 'border-teal-800' },
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
  { id: 1, type: 'deal', text: 'Closed Enterprise SaaS License', user: 'Alice Johnson', time: '2 hours ago', avatar: 'AJ' },
  { id: 2, type: 'contact', text: 'Added 3 new contacts from TechCorp', user: 'Bob Smith', time: '4 hours ago', avatar: 'BS' },
  { id: 3, type: 'task', text: 'Completed follow-up call with HealthFirst', user: 'Carol White', time: 'Yesterday', avatar: 'CW' },
  { id: 4, type: 'campaign', text: 'Launched Q3 Email Blast campaign', user: 'David Lee', time: '2 days ago', avatar: 'DL' },
  { id: 5, type: 'deal', text: 'Moved Fleet Upgrade to Negotiation', user: 'Alice Johnson', time: '3 days ago', avatar: 'AJ' },
];

const UPCOMING_FOLLOWUPS = [
  { id: 1, contact: 'John Doe (TechCorp)', task: 'Review contract terms', date: 'May 14', time: '10:00 AM', priority: 'High' },
  { id: 2, contact: 'Jane Smith (GreenLeaf)', task: 'Demo scheduling', date: 'May 15', time: '02:00 PM', priority: 'Medium' },
  { id: 3, contact: 'Alex Chen (HealthFirst)', task: 'Send renewal invoice', date: 'May 16', time: '09:30 AM', priority: 'Low' },
  { id: 4, contact: 'Maria Lopez (SwiftLogix)', task: 'Quarterly check-in', date: 'May 18', time: '11:00 AM', priority: 'High' },
];

const TYPE_COLORS = {
  deal: 'bg-blue-950/50 text-blue-400 border border-blue-800',
  contact: 'bg-indigo-950/50 text-indigo-400 border border-indigo-800',
  task: 'bg-emerald-950/50 text-emerald-400 border border-emerald-800',
  campaign: 'bg-amber-950/50 text-amber-400 border border-amber-800',
};

const PRIORITY_COLORS = { 
  High: 'text-red-400 bg-red-950/50 border-red-800', 
  Medium: 'text-amber-400 bg-amber-950/50 border-amber-800', 
  Low: 'text-gray-400 bg-neutral-800 border-neutral-700' 
};

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
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">CRM Dashboard</h1>
              <p className="text-neutral-400 mt-1 text-sm">High-level overview of pipeline health, team performance, and customer relationships.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400 bg-neutral-800/50 px-4 py-2 rounded-xl border border-neutral-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Last synced: Just now
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {KPI_STATS.map((stat, idx) => (
            <div 
              key={stat.id} 
              className={`bg-neutral-900 p-5 rounded-xl border ${stat.border} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group ${idx >= 4 ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200`}>
                  {stat.icon}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.bg} ${stat.color} border ${stat.border}`}>
                  {stat.trend}
                </span>
              </div>
              <h3 className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</h3>
              <p className="text-sm text-neutral-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Deals Chart */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-950/30 to-neutral-900 px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Monthly Deals</h2>
                <select className="text-sm bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>This Quarter</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between gap-3 h-52 px-2">
                {MONTHLY_DEALS.map((m, i) => {
                  const heightPercent = (m.deals / maxDeals) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full flex justify-center">
                        <div className="absolute -top-10 bg-neutral-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-neutral-700">
                          {m.deals} deals
                        </div>
                        <div
                          className="w-full max-w-[50px] bg-gradient-to-t from-blue-600 to-blue-500 rounded-lg transition-all duration-300 hover:from-blue-500 hover:to-blue-400 shadow-lg"
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className="mt-2 text-xs text-neutral-500 font-medium">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Conversion Graph */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-950/30 to-neutral-900 px-6 py-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">Sales Funnel & Conversion</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Lead to customer conversion tracking</p>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between gap-4 mb-6">
                {CONVERSION_DATA.map((d, i) => {
                  let gradientColor = '';
                  if (i === 0) gradientColor = 'from-blue-600 to-blue-500';
                  else if (i === 1) gradientColor = 'from-indigo-600 to-indigo-500';
                  else if (i === 2) gradientColor = 'from-purple-600 to-purple-500';
                  else gradientColor = 'from-emerald-600 to-emerald-500';
                  
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className={`w-full bg-gradient-to-t ${gradientColor} rounded-xl p-3 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                        <p className="text-xl font-bold text-white">{d.count}</p>
                        <p className="text-[10px] text-white/80 uppercase tracking-wide font-semibold">{d.stage}</p>
                      </div>
                      {i < CONVERSION_DATA.length - 1 && (
                        <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {(CONVERSION_DATA[i].percent - CONVERSION_DATA[i+1].percent).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* SVG Conversion Trend Line */}
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 mt-4">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={fillPath} fill="url(#grad)" />
                <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                {CONVERSION_DATA.map((d, i) => {
                  const x = (i / (CONVERSION_DATA.length - 1)) * svgWidth;
                  const y = svgHeight - (d.percent / 100) * svgHeight;
                  return (
                    <circle key={i} cx={x} cy={y} r="5" fill="#1f1f1f" stroke="#8b5cf6" strokeWidth="3" />
                  );
                })}
              </svg>
              
              <div className="flex justify-between mt-3 text-xs text-neutral-500">
                <span>Leads</span>
                <span>Qualified</span>
                <span>Proposal</span>
                <span>Won</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-950/30 to-neutral-900 px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Activities</h2>
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {RECENT_ACTIVITIES.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 pb-4 border-b border-neutral-800 last:border-0 last:pb-0 group hover:bg-neutral-800/30 rounded-lg p-2 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${TYPE_COLORS[act.type]}`}>
                      {act.type[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">{act.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-neutral-400">{act.avatar}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{act.user}</span>
                        <span className="text-xs text-neutral-700">•</span>
                        <span className="text-xs text-neutral-600">{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-blue-400 hover:text-blue-300 font-medium py-2.5 border border-dashed border-neutral-700 rounded-xl hover:bg-neutral-800 transition-all duration-200">
                View All Activity Log
              </button>
            </div>
          </div>

          {/* Upcoming Follow-ups */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-950/30 to-neutral-900 px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Upcoming Follow-ups</h2>
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {UPCOMING_FOLLOWUPS.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl hover:bg-neutral-800/50 transition-all duration-200 group border border-neutral-800/50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex flex-col items-center justify-center text-xs font-bold text-white shadow-sm">
                        <span className="text-[9px] text-neutral-500 uppercase">{item.date.split(' ')[0]}</span>
                        <span className="text-sm font-bold">{item.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{item.contact}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.task}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-400 bg-neutral-800 px-2 py-1 rounded-md">{item.time}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[item.priority]}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-blue-400 hover:text-blue-300 font-medium py-2.5 border border-dashed border-neutral-700 rounded-xl hover:bg-neutral-800 transition-all duration-200">
                View Full Task Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-500">Avg. Deal Size</p>
            <p className="text-xl font-bold text-white mt-1">$42.5K</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-500">Avg. Sales Cycle</p>
            <p className="text-xl font-bold text-white mt-1">24 days</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-500">Active Contacts</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">892</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-500">Team Members</p>
            <p className="text-xl font-bold text-blue-400 mt-1">12</p>
          </div>
        </div>
      </div>
    </div>
  );
}