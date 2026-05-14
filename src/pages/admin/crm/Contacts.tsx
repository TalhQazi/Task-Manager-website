import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Inactive'];

const STATUS_CONFIG = {
  Active:   { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  Pending:  { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',       dot: 'bg-amber-400' },
  Inactive: { badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',        dot: 'bg-slate-500' },
};

const getStatusBadgeClasses = (status) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Inactive;
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`;
};

const ContactAvatar = ({ name }) => {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const colors = [
    'from-violet-600 to-violet-800',
    'from-sky-600 to-sky-800',
    'from-emerald-600 to-emerald-800',
    'from-rose-600 to-rose-800',
    'from-amber-600 to-amber-800',
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
      className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-md border border-white/8 max-h-[90vh] overflow-y-auto scrollbar-thin"
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

export default function CRMContacts() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', status: 'Active' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);

  const filteredContacts = useMemo(() => contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) || c.company.toLowerCase().includes(q)) &&
      (statusFilter === 'All' || c.status === statusFilter)
    );
  }), [contacts, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: contacts.length,
    active: contacts.filter(c => c.status === 'Active').length,
    pending: contacts.filter(c => c.status === 'Pending').length,
    inactive: contacts.filter(c => c.status === 'Inactive').length,
  }), [contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-contacts`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setContacts(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

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

  useEffect(() => { fetchContacts(); }, []);
  useEffect(() => { if (isModalOpen && companies.length === 0) fetchCompanies(); }, [isModalOpen]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { closeModal(); setDeleteTargetId(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', company: '', status: 'Active' });
    setFormErrors({}); setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setFormErrors({}); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingContact(null); setFormErrors({}); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true); setError(null);
      const url = editingContact
        ? `${getApiBaseUrl()}/api/crm-contacts/${editingContact.id}`
        : `${getApiBaseUrl()}/api/crm-contacts`;
      const res = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthState().token || ''}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || 'Failed to save'); }
      const data = await res.json();
      setContacts((p) => editingContact ? p.map((c) => c.id === editingContact.id ? data.item : c) : [data.item, ...p]);
      closeModal();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (id) => setDeleteTargetId(id);
  const handleDelete = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-contacts/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      setContacts((p) => p.filter((c) => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) { setError(err.message); }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="font-semibold text-slate-300 text-base">No contacts found</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Contacts</h1>
            <p className="text-slate-400 text-sm mt-1">Manage, track, and update your contact database</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-violet-900/40 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
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
            { label: 'Total Contacts', value: stats.total,    color: 'text-white' },
            { label: 'Active',         value: stats.active,   color: 'text-emerald-400' },
            { label: 'Pending',        value: stats.pending,  color: 'text-amber-400' },
            { label: 'Inactive',       value: stats.inactive, color: 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/3 border border-white/7 rounded-xl p-4 hover:bg-white/5 transition-colors">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div className="bg-white/3 border border-white/7 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search name, email, phone, company…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          {/* Status pill filters */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0 flex-shrink-0">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === opt
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-white/8'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table / Cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading contacts…
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/2 border border-white/7 rounded-xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/7">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.length === 0 ? (
                      <tr><td colSpan="6"><EmptyState /></td></tr>
                    ) : filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <ContactAvatar name={contact.name} />
                            <span className="font-semibold text-white">{contact.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <a href={`mailto:${contact.email}`} className="text-slate-300 hover:text-sky-400 transition-colors text-sm">
                            {contact.email}
                          </a>
                        </td>
                        <td className="px-5 py-3.5">
                          <a href={`tel:${contact.phone}`} className="text-slate-400 hover:text-white font-mono text-xs transition-colors">
                            {contact.phone}
                          </a>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{contact.company}</td>
                        <td className="px-5 py-3.5">
                          <span className={getStatusBadgeClasses(contact.status)}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[contact.status]?.dot || 'bg-slate-500'}`} />
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(contact)}
                              className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-semibold transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(contact.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all"
                            >
                              Delete
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
              {filteredContacts.length === 0 ? (
                <div className="bg-white/2 border border-white/7 rounded-xl"><EmptyState /></div>
              ) : filteredContacts.map((contact) => (
                <div key={contact.id} className="bg-white/3 border border-white/7 rounded-xl p-4 hover:border-violet-500/20 hover:bg-white/5 transition-all">
                  {/* Card Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <ContactAvatar name={contact.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-base truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{contact.company}</p>
                    </div>
                    <span className={getStatusBadgeClasses(contact.status)}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[contact.status]?.dot || 'bg-slate-500'}`} />
                      {contact.status}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 py-3 border-t border-b border-white/5 mb-3">
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-sky-400 transition-colors">
                      <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{contact.email}</span>
                    </a>
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-mono text-xs">{contact.phone}</span>
                    </a>
                  </div>

                  {/* Card Actions — always visible */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="flex-1 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-semibold transition-all text-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(contact.id)}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all text-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Add / Edit Modal ── */}
        {isModalOpen && (
          <ModalOverlay onClose={closeModal}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className={labelCls}>Name <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <input name="name" value={formData.name} onChange={handleInputChange}
                    className={inputCls(formErrors.name)} placeholder="Full name" />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls}>Email <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange}
                    className={inputCls(formErrors.email)} placeholder="email@example.com" />
                  {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelCls}>Phone <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange}
                    className={inputCls(formErrors.phone)} placeholder="+1 (555) 000-0000" />
                  {formErrors.phone && <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>}
                </div>

                {/* Company */}
                <div>
                  <label className={labelCls}>Company <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <select name="company" value={formData.company} onChange={handleInputChange}
                    className={inputCls(formErrors.company)}>
                    <option value="">Select Company</option>
                    {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {formErrors.company && <p className="text-xs text-red-400 mt-1">{formErrors.company}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}
                    className={inputCls(false)}>
                    {STATUS_OPTIONS.filter(s => s !== 'All').map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-5 mt-1 border-t border-white/7">
                <button onClick={closeModal} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving…</>
                  ) : editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* ── Delete Confirm Modal ── */}
        {deleteTargetId && (
          <ModalOverlay onClose={() => setDeleteTargetId(null)}>
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Delete this contact?</h3>
              <p className="text-sm text-slate-400 mb-6">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTargetId(null)}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/40">
                  Delete Contact
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

      </div>
    </div>
  );
}