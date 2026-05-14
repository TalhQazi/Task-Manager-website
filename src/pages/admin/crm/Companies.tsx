import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const STATUS_OPTIONS = ['All', 'Active', 'Prospect', 'Inactive'];
const INDUSTRY_OPTIONS = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Other'];

const COUNTRIES = [
  'USA/US', 'United Kingdom/UK', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Pakistan',
  'United Arab Emirates', 'Saudi Arabia', 'Singapore', 'Japan', 'China', 'South Korea', 'Brazil',
  'Mexico', 'Argentina', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Belgium', 'Austria', 'Poland', 'Czech Republic', 'Russia', 'Turkey', 'Egypt', 'South Africa',
  'Nigeria', 'Kenya', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Malaysia', 'Bangladesh',
  'Sri Lanka', 'Nepal', 'New Zealand', 'Ireland', 'Portugal', 'Greece', 'Finland', 'Ukraine'
];

const STATUS_CONFIG = {
  Active:   { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  Prospect: { badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',             dot: 'bg-sky-400' },
  Inactive: { badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',        dot: 'bg-slate-500' },
};

const getStatusBadgeClasses = (status) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Inactive;
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`;
};

const CompanyAvatar = ({ name }) => {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const colors = [
    'from-violet-600 to-violet-800',
    'from-sky-600 to-sky-800',
    'from-emerald-600 to-emerald-800',
    'from-amber-600 to-amber-800',
    'from-rose-600 to-rose-800',
    'from-indigo-600 to-indigo-800',
  ];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
};

const ModalOverlay = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div
      className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-2xl border border-white/8 max-h-[90vh] overflow-y-auto scrollbar-thin"
      style={{ animation: 'modalIn 0.18s ease' }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all ${err ? 'border-red-500/40' : 'border-white/10'}`;

const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

export default function CRMCompanies() {
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);

  const [formData, setFormData] = useState({
    name: '', industry: '', contactCount: '', activeDeals: '',
    status: 'Active', website: '', location: '', description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const filteredCompanies = useMemo(() => companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.website?.toLowerCase().includes(q)) &&
      (statusFilter === 'All' || c.status === statusFilter) &&
      (industryFilter === 'All' || c.industry === industryFilter)
    );
  }), [companies, searchQuery, statusFilter, industryFilter]);

  const stats = useMemo(() => ({
    total: companies.length,
    active: companies.filter(c => c.status === 'Active').length,
    prospect: companies.filter(c => c.status === 'Prospect').length,
    totalDeals: companies.reduce((s, c) => s + (Number(c.activeDeals) || 0), 0),
  }), [companies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-company`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { closeFormModal(); closeDetailsModal(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#country-container')) setShowCountryDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', industry: '', contactCount: '', activeDeals: '', status: 'Active', website: '', location: '', description: '' });
    setFormErrors({}); setCountrySearch(''); setShowCountryDropdown(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({ ...company, contactCount: company.contactCount?.toString() || '', activeDeals: company.activeDeals?.toString() || '' });
    setFormErrors({}); setCountrySearch(company.location || ''); setShowCountryDropdown(false);
    setIsFormModalOpen(true);
  };

  const openDetailsModal = (company) => { setViewingCompany(company); setIsDetailsModalOpen(true); };
  const closeFormModal = () => { setIsFormModalOpen(false); setEditingCompany(null); setFormErrors({}); };
  const closeDetailsModal = () => { setIsDetailsModalOpen(false); setViewingCompany(null); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCountrySelect = (country) => {
    setFormData((p) => ({ ...p, location: country }));
    setCountrySearch(country); setShowCountryDropdown(false);
  };

  const filteredCountries = useMemo(() =>
    !countrySearch ? COUNTRIES : COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Company name is required';
    if (!formData.industry) errors.industry = 'Industry is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true); setError(null);
      const payload = {
        ...formData,
        contactCount: formData.contactCount ? parseInt(formData.contactCount, 10) : 0,
        activeDeals: formData.activeDeals ? parseInt(formData.activeDeals, 10) : 0,
      };
      const url = editingCompany ? `${getApiBaseUrl()}/api/crm-company/${editingCompany.id}` : `${getApiBaseUrl()}/api/crm-company`;
      const res = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthState().token || ''}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || 'Failed to save'); }
      const data = await res.json();
      setCompanies((p) => editingCompany ? p.map((c) => c.id === editingCompany.id ? data.item : c) : [data.item, ...p]);
      closeFormModal();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p className="font-semibold text-slate-300 text-base">No companies found</p>
      <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width:4px; height:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
        select option { background:#0f1117; color:#fff; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Companies</h1>
            <p className="text-slate-400 text-sm mt-1">Track organizations, relationships, and deal pipelines</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-violet-900/40 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Company
          </button>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Companies', value: stats.total, color: 'text-white' },
            { label: 'Active', value: stats.active, color: 'text-emerald-400' },
            { label: 'Prospects', value: stats.prospect, color: 'text-sky-400' },
            { label: 'Total Deals', value: stats.totalDeals, color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/3 border border-white/7 rounded-xl p-4 hover:bg-white/5 transition-colors">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white/3 border border-white/7 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search company, industry, website…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all min-w-[130px]"
            >
              {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all min-w-[110px]"
            >
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading companies…
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/2 border border-white/7 rounded-xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/7">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Industry</th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacts</th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Deals</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr><td colSpan="6"><EmptyState /></td></tr>
                    ) : filteredCompanies.map((company) => (
                      <tr key={company.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CompanyAvatar name={company.name} />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-[180px]">{company.name}</p>
                              {company.website && (
                                <p className="text-xs text-slate-500 truncate max-w-[180px]">{company.website}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{company.industry}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-9 h-7 bg-white/5 border border-white/8 text-slate-300 text-xs font-semibold rounded-lg">
                            {company.contactCount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-9 h-7 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold rounded-lg">
                            {company.activeDeals}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={getStatusBadgeClasses(company.status)}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[company.status]?.dot || 'bg-slate-500'}`} />
                            {company.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openDetailsModal(company)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(company)}
                              className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-semibold transition-all"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredCompanies.length === 0 ? (
                <div className="bg-white/2 border border-white/7 rounded-xl"><EmptyState /></div>
              ) : filteredCompanies.map((company) => (
                <div key={company.id} className="bg-white/3 border border-white/7 rounded-xl p-4 hover:border-violet-500/20 hover:bg-white/5 transition-all">
                  {/* Card Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <CompanyAvatar name={company.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-base truncate">{company.name}</p>
                      {company.website && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{company.website}</p>
                      )}
                    </div>
                    <span className={getStatusBadgeClasses(company.status)}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[company.status]?.dot || 'bg-slate-500'}`} />
                      {company.status}
                    </span>
                  </div>

                  {/* Card Meta Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Industry</p>
                      <p className="text-sm font-medium text-white truncate">{company.industry}</p>
                    </div>
                    <div className="bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-white truncate">{company.location || '—'}</p>
                    </div>
                    <div className="bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Contacts</p>
                      <p className="text-sm font-semibold text-white">{company.contactCount}</p>
                    </div>
                    <div className="bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Active Deals</p>
                      <p className="text-sm font-semibold text-violet-300">{company.activeDeals}</p>
                    </div>
                  </div>

                  {/* Card Actions — always visible */}
                  <div className="flex gap-2 pt-3 border-t border-white/6">
                    <button
                      onClick={() => openDetailsModal(company)}
                      className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white text-xs font-semibold transition-all text-center"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openEditModal(company)}
                      className="flex-1 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-semibold transition-all text-center"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Add / Edit Modal ── */}
        {isFormModalOpen && (
          <ModalOverlay onClose={closeFormModal}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
                <button onClick={closeFormModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className={labelCls}>Company Name <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <input name="name" value={formData.name} onChange={handleInputChange}
                    className={inputCls(formErrors.name)} placeholder="Enter company name" />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Industry */}
                  <div>
                    <label className={labelCls}>Industry <span className="text-red-400 normal-case tracking-normal">*</span></label>
                    <select name="industry" value={formData.industry} onChange={handleInputChange}
                      className={inputCls(formErrors.industry)}>
                      <option value="">Select Industry</option>
                      {INDUSTRY_OPTIONS.filter(i => i !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {formErrors.industry && <p className="text-xs text-red-400 mt-1">{formErrors.industry}</p>}
                  </div>

                  {/* Website */}
                  <div>
                    <label className={labelCls}>Website</label>
                    <input name="website" value={formData.website} onChange={handleInputChange}
                      className={inputCls(false)} placeholder="example.com" />
                  </div>
                </div>

                {/* Country */}
                <div id="country-container" className="relative">
                  <label className={labelCls}>Country</label>
                  <input
                    value={countrySearch}
                    onChange={(e) => { setCountrySearch(e.target.value); setFormData(p => ({ ...p, location: e.target.value })); setShowCountryDropdown(true); }}
                    onFocus={() => setShowCountryDropdown(true)}
                    className={inputCls(false)}
                    placeholder="Search country…"
                  />
                  {showCountryDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl max-h-44 overflow-y-auto scrollbar-thin">
                      {filteredCountries.length === 0 ? (
                        <div className="px-3 py-2 text-slate-400 text-sm">No countries found</div>
                      ) : filteredCountries.map((c) => (
                        <div key={c} onClick={() => handleCountrySelect(c)}
                          className="px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3}
                    className={inputCls(false)} placeholder="Brief company overview…" style={{ resize: 'vertical' }} />
                </div>

                {/* Contacts / Deals / Status */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Contacts</label>
                    <input type="number" name="contactCount" value={formData.contactCount} onChange={handleInputChange}
                      min="0" placeholder="0" className={inputCls(false)} />
                  </div>
                  <div>
                    <label className={labelCls}>Deals</label>
                    <input type="number" name="activeDeals" value={formData.activeDeals} onChange={handleInputChange}
                      min="0" placeholder="0" className={inputCls(false)} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputCls(false)}>
                      {STATUS_OPTIONS.filter(s => s !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-5 mt-1 border-t border-white/7">
                <button onClick={closeFormModal} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving…</>
                  ) : editingCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* ── Details Modal ── */}
        {isDetailsModalOpen && viewingCompany && (
          <ModalOverlay onClose={closeDetailsModal}>
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/7">
                <h2 className="text-lg font-bold text-white">Company Details</h2>
                <button onClick={closeDetailsModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Company Identity */}
                <div className="flex items-center gap-4">
                  <CompanyAvatar name={viewingCompany.name} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{viewingCompany.name}</h3>
                    {viewingCompany.website && (
                      <a href={`https://${viewingCompany.website}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-sky-400 hover:text-sky-300 transition-colors truncate block">
                        {viewingCompany.website}
                      </a>
                    )}
                  </div>
                  <span className={getStatusBadgeClasses(viewingCompany.status)}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[viewingCompany.status]?.dot || 'bg-slate-500'}`} />
                    {viewingCompany.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Industry', value: viewingCompany.industry, color: 'text-white' },
                    { label: 'Location', value: viewingCompany.location || '—', color: 'text-white' },
                    { label: 'Contacts', value: viewingCompany.contactCount, color: 'text-white' },
                    { label: 'Active Deals', value: viewingCompany.activeDeals, color: 'text-violet-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {viewingCompany.description && (
                  <div className="bg-white/2 border border-white/6 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{viewingCompany.description}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={closeDetailsModal}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">
                  Close
                </button>
                <button onClick={() => { closeDetailsModal(); openEditModal(viewingCompany); }}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40">
                  Edit Company
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

      </div>
    </div>
  );
}