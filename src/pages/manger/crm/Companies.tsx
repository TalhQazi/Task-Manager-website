import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

/* ── Constants ───────────────────────────────────────────────────── */
const STATUS_OPTIONS   = ['All', 'Active', 'Prospect', 'Inactive'];
const INDUSTRY_OPTIONS = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Other'];

const STATUS_CONFIG = {
  Active:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Prospect: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  Inactive: { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};

const INDUSTRY_ICONS = {
  Technology:    '💻',
  Finance:       '💰',
  Healthcare:    '🏥',
  Retail:        '🛍️',
  Manufacturing: '🏭',
  Logistics:     '🚚',
  Other:         '🏢',
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Inactive'];
const getIndustryIcon = (industry) => INDUSTRY_ICONS[industry] || '🏢';

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

/* Avatar colours cycle through a palette */
const AVATAR_PALETTES = [
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[h];
};

/* ── Shared UI atoms ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status || 'Unknown'}
    </span>
  );
};

const CompanyAvatar = ({ name, size = 'md' }) => {
  const palette = avatarColor(name);
  const sz = size === 'lg' ? 'h-12 w-12 text-lg rounded-xl' : 'h-9 w-9 text-sm rounded-lg';
  return (
    <div className={`flex items-center justify-center flex-shrink-0 font-bold ${sz} ${palette}`}>
      {getInitials(name) || '?'}
    </div>
  );
};

const CountPill = ({ value, variant = 'gray' }) => {
  const styles = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
  };
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-semibold ${styles[variant]}`}>
      {value ?? '—'}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Detail Modal — bottom sheet on mobile, centered dialog on desktop
──────────────────────────────────────────────────────────────────── */
const DetailModal = ({ company, onClose }) => {
  if (!company) return null;
  const cfg = getStatusConfig(company.status);

  const fields = [
    { label: 'Industry',      value: company.industry || '—' },
    { label: 'Entity Type',   value: company.entityType || '—' },
    { label: 'Status',        value: <StatusBadge status={company.status} /> },
    { label: 'Website',       value: company.website
        ? <a href={`https://${company.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all">{company.website}</a>
        : '—' },
    { label: 'Location',      value: company.location || '—' },
    { label: 'Contacts',      value: <CountPill value={company.contactCount} /> },
    { label: 'Active Deals',  value: <CountPill value={company.activeDeals} variant="blue" /> },
    { label: 'Description',   value: company.description || 'No description available.', span: 2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className={`px-5 pt-4 pb-4 ${cfg.bg} border-b ${cfg.border} flex-shrink-0`}>
          <div className="flex items-start gap-3">
            <CompanyAvatar name={company.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
                {company.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span>{getIndustryIcon(company.industry)}</span>
                {company.industry || 'Company details and CRM relationship summary.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 transition-colors border border-gray-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta grid — scrollable */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {fields.map(({ label, value, span }, i) => (
              <div key={i} className={span === 2 ? 'col-span-2' : 'col-span-1'}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <div className="text-sm font-medium text-gray-800 break-words">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Mobile Card
──────────────────────────────────────────────────────────────────── */
const MobileCompanyCard = ({ company, onView }) => (
  <div
    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-transform"
    onClick={() => onView(company)}
  >
    {/* Top row */}
    <div className="flex items-start gap-3">
      <CompanyAvatar name={company.name} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-snug break-words">
          {company.name}
        </p>
        {company.website && (
          <p className="text-xs text-indigo-500 mt-0.5 truncate">{company.website}</p>
        )}
      </div>
      <StatusBadge status={company.status} />
    </div>

    {/* Industry + counts row */}
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
      {company.industry && (
        <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 font-medium text-gray-600">
          <span>{getIndustryIcon(company.industry)}</span>
          {company.industry}
        </span>
      )}
      <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2.5 py-1 font-semibold text-gray-700">
        👤 {company.contactCount ?? '—'} contacts
      </span>
      <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 font-semibold text-blue-700">
        🤝 {company.activeDeals ?? '—'} deals
      </span>
    </div>

    {/* View button */}
    <div className="pt-1 border-t border-gray-100">
      <button
        onClick={(e) => { e.stopPropagation(); onView(company); }}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────────────── */
export default function ManagerCRMCompanies() {
  const [companies, setCompanies]         = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [viewingCompany, setViewingCompany] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/crm-company');
      setCompanies(data.items || []);
    } catch (err) {
      setError(err?.message || 'Unable to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.website?.toLowerCase().includes(q);
      const matchesStatus   = statusFilter   === 'All' || c.status   === statusFilter;
      const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [companies, searchQuery, statusFilter, industryFilter]);

  /* counts for filter chips */
  const statusCounts = useMemo(() => {
    const counts = { All: companies.length };
    companies.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [companies]);

  const StateBlock = ({ children }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">{children}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Companies</h1>
            <p className="text-sm text-gray-500 mt-0.5">View organization details and relationship metrics.</p>
          </div>
          <div className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Read-only view
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, industry, or website…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Two filter rows — status chips + industry select */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status chips — scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 flex-1" style={{ scrollbarWidth: 'none' }}>
              {STATUS_OPTIONS.map((s) => {
                const active = statusFilter === s;
                const cfg = getStatusConfig(s);
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                      active
                        ? s === 'All'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {s !== 'All' && active && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                    {s}
                    {statusCounts[s] !== undefined && (
                      <span className={`ml-0.5 ${active ? 'opacity-75' : 'text-gray-400'}`}>
                        ({statusCounts[s] || 0})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Industry dropdown */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="flex-shrink-0 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition sm:w-44"
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <StateBlock>
            <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Loading companies…</span>
          </StateBlock>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <StateBlock>
            <p className="text-red-500 font-medium text-center px-4">{error}</p>
            <button onClick={fetchCompanies} className="text-sm text-indigo-600 hover:underline">Try again</button>
          </StateBlock>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredCompanies.length === 0 && (
          <StateBlock>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm">No companies found.</p>
          </StateBlock>
        )}

        {!loading && !error && filteredCompanies.length > 0 && (
          <>
            {/* ══════════════════════════════════════
                MOBILE — Card list  (< md)
            ══════════════════════════════════════ */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredCompanies.map((company) => (
                <MobileCompanyCard
                  key={company.id || company._id}
                  company={company}
                  onView={setViewingCompany}
                />
              ))}
              <p className="text-xs text-gray-400 text-center pb-2">
                Showing {filteredCompanies.length} of {companies.length} companies
              </p>
            </div>

            {/* ══════════════════════════════════════
                DESKTOP — Table  (≥ md)
            ══════════════════════════════════════ */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Company</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Industry</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Contacts</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Active Deals</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCompanies.map((company) => (
                      <tr
                        key={company.id || company._id}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                        onClick={() => setViewingCompany(company)}
                      >
                        {/* Company */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CompanyAvatar name={company.name} />
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate max-w-[180px] group-hover:text-indigo-700 transition-colors">
                                {company.name}
                              </div>
                              {company.website && (
                                <div className="text-xs text-indigo-400 truncate max-w-[180px]">
                                  {company.website}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {company.industry ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-600 text-sm">
                              <span>{getIndustryIcon(company.industry)}</span>
                              {company.industry}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Contacts */}
                        <td className="px-5 py-3.5 text-center">
                          <CountPill value={company.contactCount} />
                        </td>

                        {/* Active Deals */}
                        <td className="px-5 py-3.5 text-center">
                          <CountPill value={company.activeDeals} variant="blue" />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge status={company.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingCompany(company); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Results count */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                Showing {filteredCompanies.length} of {companies.length} companies
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal company={viewingCompany} onClose={() => setViewingCompany(null)} />
    </div>
  );
}