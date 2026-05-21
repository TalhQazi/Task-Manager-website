import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Inactive'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Active:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  Pending:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25',   dot: 'bg-amber-400' },
  Inactive: { bg: 'bg-neutral-500/10', text: 'text-neutral-400', border: 'border-neutral-500/25', dot: 'bg-neutral-500' },
  Unknown:  { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/25',   dot: 'bg-slate-500' },
};

// Generate a consistent avatar color from name
const AVATAR_GRADIENTS = [
  'from-sky-600 to-blue-700',
  'from-violet-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];
const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name?.length || 0; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status || 'Unknown'}
    </span>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const gradient = getAvatarGradient(name);
  const sizeClasses = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-14 h-14 text-lg' };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

// Modal
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-[#0f1117] rounded-2xl w-full max-w-md border border-neutral-800 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function CRMContacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewingContact, setViewingContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet('/api/crm-contacts')
      .then((data: any) => setContacts(data.items || []))
      .catch((err: any) => setError(err?.message || 'Unable to load contacts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewingContact(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredContacts = useMemo(() => contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'All' || c.status === statusFilter);
  }), [contacts, searchQuery, statusFilter]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: contacts.length };
    STATUS_OPTIONS.slice(1).forEach((s) => { counts[s] = contacts.filter((c) => c.status === s).length; });
    return counts;
  }, [contacts]);

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              👥
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Contacts</h1>
              <p className="text-muted-foreground text-xs mt-0.5">View CRM contacts and associated companies · Read-only</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/5 border border-border/10 px-4 py-2 rounded-xl self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Read-only view
          </div>
        </header>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400">⚠</span>
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 transition-colors text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Search + Filter ── */}
        <section className="bg-background/60 border border-border/10 rounded-2xl p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone or company…"
              className="w-full pl-10 pr-10 py-2.5 bg-background/5 border border-border/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground
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

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium mr-1 shrink-0">Status:</span>
            {STATUS_OPTIONS.map((s) => {
              const cfg = s !== 'All' ? STATUS_CONFIG[s] : null;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                    ${isActive
                      ? cfg ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400'
                    }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {s}
                  <span className={`text-[10px] px-1 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/15' : 'bg-neutral-800'}`}>
                    {statusCounts[s] ?? 0}
                  </span>
                </button>
              );
            })}

            {/* Result count */}
            {(searchQuery || statusFilter !== 'All') && (
              <span className="ml-auto text-xs text-neutral-600">
                <span className="text-neutral-400 font-medium">{filteredContacts.length}</span> result{filteredContacts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </section>

        {/* ── Table ── */}
        <section className="bg-background/60 border border-border/10 rounded-2xl overflow-hidden">

          {/* Loading */}
          {loading && (
              <div className="flex items-center justify-center py-20 gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-border/10" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 animate-spin" />
              </div>
              <p className="text-muted-foreground text-sm">Loading contacts…</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/10 bg-background/5">
                    {['Contact', 'Email', 'Phone', 'Company', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredContacts.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-background/5 border border-border/10 flex items-center justify-center text-2xl">🔍</div>
                            <div>
                              <p className="text-muted-foreground font-semibold">No contacts found</p>
                              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr
                        key={contact.id || contact._id}
                        className="hover:bg-neutral-800/40 transition-colors duration-150 group"
                      >
                        {/* Name + Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={contact.name} size="sm" />
                            <span className="font-semibold text-sm text-white group-hover:text-sky-400 transition-colors">
                              {contact.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-sm text-neutral-400 hover:text-sky-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.email}
                          </a>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-400">{contact.phone || '—'}</span>
                        </td>

                        {/* Company */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {contact.company && (
                              <div className="w-5 h-5 rounded-md bg-neutral-700 border border-neutral-600 flex items-center justify-center text-[9px] font-bold text-neutral-400 shrink-0">
                                {contact.company.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm text-neutral-400">{contact.company || '—'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={contact.status} />
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setViewingContact(contact)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Footer */}
              {filteredContacts.length > 0 && (
                <div className="px-5 py-3 border-t border-neutral-800/60 bg-neutral-950/30 flex items-center justify-between">
                  <span className="text-xs text-neutral-600">
                    Showing <span className="text-neutral-400 font-medium">{filteredContacts.length}</span> of{' '}
                    <span className="text-neutral-400 font-medium">{contacts.length}</span> contacts
                  </span>
                  <div className="flex items-center gap-3">
                    {Object.entries(statusCounts).filter(([k, v]) => k !== 'All' && v > 0).map(([status, count]) => {
                      const cfg = STATUS_CONFIG[status];
                      if (!cfg || !count) return null;
                      return (
                        <span key={status} className="flex items-center gap-1 text-xs text-neutral-600">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {count} {status}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && (
            <div className="md:hidden">
              {filteredContacts.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">🔍</div>
                  <div className="text-center">
                    <p className="text-neutral-300 font-semibold">No contacts found</p>
                    <p className="text-sm text-neutral-600 mt-1">Try adjusting your search or filter</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id || contact._id}
                      className="p-4 hover:bg-neutral-800/30 transition-colors duration-150"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar name={contact.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-white text-sm">{contact.name}</h3>
                            <StatusBadge status={contact.status} />
                          </div>
                          {contact.company && (
                            <p className="text-xs text-neutral-500 mt-0.5">{contact.company}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-neutral-800/50 rounded-xl p-2.5">
                          <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Email</p>
                          <p className="text-xs text-neutral-300 truncate">{contact.email || '—'}</p>
                        </div>
                        <div className="bg-neutral-800/50 rounded-xl p-2.5">
                          <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Phone</p>
                          <p className="text-xs text-neutral-300">{contact.phone || '—'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingContact(contact)}
                        className="w-full py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Contact Detail Modal ── */}
      {viewingContact && (
        <ModalOverlay onClose={() => setViewingContact(null)}>
          {/* Modal Header */}
          <div className="px-6 pt-6 pb-5 border-b border-neutral-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={viewingContact.name} size="lg" />
                <div>
                  <h2 className="text-lg font-black text-white">{viewingContact.name}</h2>
                  {viewingContact.company && (
                    <p className="text-xs text-neutral-500 mt-0.5">{viewingContact.company}</p>
                  )}
                  <div className="mt-2">
                    <StatusBadge status={viewingContact.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingContact(null)}
                className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-3">
            {[
              { label: 'Email Address', value: viewingContact.email, icon: '✉️', href: `mailto:${viewingContact.email}` },
              { label: 'Phone Number', value: viewingContact.phone, icon: '📞', href: `tel:${viewingContact.phone}` },
              { label: 'Company', value: viewingContact.company, icon: '🏢' },
              { label: 'Status', value: viewingContact.status, icon: '🔖', isStatus: true },
            ].map((field) => (
              <div
                key={field.label}
                className="flex items-start gap-3 p-3 bg-neutral-800/30 border border-neutral-800/60 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm shrink-0">
                  {field.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium mb-0.5">{field.label}</p>
                  {field.isStatus ? (
                    <StatusBadge status={field.value} />
                  ) : field.href && field.value ? (
                    <a href={field.href} className="text-sm text-sky-400 hover:text-sky-300 transition-colors truncate block">
                      {field.value || '—'}
                    </a>
                  ) : (
                    <p className="text-sm text-neutral-200">{field.value || '—'}</p>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => setViewingContact(null)}
              className="w-full mt-2 py-2.5 text-sm font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 hover:text-white transition-all duration-200"
            >
              Close
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}