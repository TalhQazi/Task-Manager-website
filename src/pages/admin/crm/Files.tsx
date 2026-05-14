import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const TYPE_OPTIONS = ['All', 'Contract', 'Proposal', 'Invoice', 'Other'];

const formatFileSize = (sizeInBytes) => {
  if (typeof sizeInBytes !== 'number' || isNaN(sizeInBytes)) return '0 MB';
  const size = sizeInBytes / 1024 / 1024;
  return size < 1 ? `${(sizeInBytes / 1024).toFixed(1)} KB` : `${size.toFixed(1)} MB`;
};

const TYPE_CONFIG = {
  Contract: {
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    icon: 'text-violet-400',
    dot: 'bg-violet-400',
  },
  Proposal: {
    badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    icon: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  Invoice: {
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    icon: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  Other: {
    badge: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    icon: 'text-slate-400',
    dot: 'bg-slate-400',
  },
};

const getTypeBadgeClasses = (type) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Other;
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const FileIcon = ({ type, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Other;

  const paths = {
    Contract: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    Proposal: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    Invoice: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    Other: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  };

  return (
    <svg className={`${sizeClass} ${cfg.icon} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[type] || paths.Other} />
    </svg>
  );
};

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onClick={onClose}
  >
    <div
      className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-md border border-white/8 max-h-[90vh] overflow-y-auto"
      style={{ animation: 'modalIn 0.18s ease' }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export default function CRMFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetFileId, setTargetFileId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'Contract', linkedContact: '', linkedDeal: '',
    date: new Date().toISOString().slice(0, 10), fileName: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const fetchFiles = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-files`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error?.message || 'Failed to load files'); }
      const data = await res.json();
      setFiles((data.items || []).map((item) => ({ ...item, fileSize: formatFileSize(item.size) })));
    } catch (err) { setError(err?.message || 'Failed to load files'); }
    finally { setLoading(false); }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-contacts`, { headers: { Authorization: `Bearer ${getAuthState().token || ''}` } });
      if (!res.ok) throw new Error();
      const data = await res.json(); setContacts(data.items || []);
    } catch { /* silent */ }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-deals`, { headers: { Authorization: `Bearer ${getAuthState().token || ''}` } });
      if (!res.ok) throw new Error();
      const data = await res.json(); setDeals(data.items || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchFiles(); fetchContacts(); fetchDeals(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModals(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openUpload = () => {
    setFormData({ type: 'Contract', linkedContact: '', linkedDeal: '', date: new Date().toISOString().slice(0, 10), fileName: '' });
    setSelectedFiles([]); setFormErrors({}); setShowUploadModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileInputChange = (e) => {
    const arr = Array.from(e.target.files || []);
    setSelectedFiles(arr);
    if (arr.length > 0) setFormData((p) => ({ ...p, fileName: arr[0].name }));
  };

  const validateForm = () => {
    const errors = {};
    if (selectedFiles.length === 0) errors.file = 'Please select at least one file';
    if (!formData.linkedContact.trim() && !formData.linkedDeal.trim()) errors.linkedContact = 'Link to at least a contact or deal';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUploadSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true); setError(null);
      const payload = new FormData();
      selectedFiles.forEach((f) => payload.append('files', f));
      payload.append('linkedContact', formData.linkedContact);
      payload.append('linkedDeal', formData.linkedDeal);
      payload.append('type', formData.type);
      payload.append('date', formData.date);
      if (formData.fileName) payload.append('fileName', formData.fileName);

      const res = await fetch(`${getApiBaseUrl()}/api/crm-files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
        body: payload,
      });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error?.message || 'Upload failed'); }
      const data = await res.json();
      setFiles((p) => [...data.items.map((i) => ({ ...i, fileSize: formatFileSize(i.size) })), ...p]);
      closeModals();
    } catch (err) { setError(err?.message || 'Failed to upload'); }
    finally { setSaving(false); }
  };

  const handleDownload = async (file) => {
    try {
      const fileId = file.id || file._id;
      const res = await fetch(`${getApiBaseUrl()}/api/crm-files/${encodeURIComponent(fileId)}/download`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.originalName || file.fileName;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { setError(err?.message || 'Download failed'); }
  };

  const handleDeleteConfirm = async () => {
    if (!targetFileId) return;
    try {
      setSaving(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-files/${encodeURIComponent(targetFileId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error?.message || 'Delete failed'); }
      setFiles((p) => p.filter((f) => f.id !== targetFileId));
      setTargetFileId(null); closeModals();
    } catch (err) { setError(err?.message || 'Delete failed'); }
    finally { setSaving(false); }
  };

  const openPreview = (file) => { setSelectedFile(file); setShowPreviewModal(true); };
  const confirmDelete = (id) => { setTargetFileId(id); setShowDeleteModal(true); };
  const closeModals = () => {
    setShowUploadModal(false); setShowPreviewModal(false); setShowDeleteModal(false);
    setTargetFileId(null); setSelectedFile(null); setFormErrors([]); setSelectedFiles([]);
    setFormData((p) => ({ ...p, fileName: '' }));
  };

  const filteredFiles = useMemo(() => files.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = f.fileName.toLowerCase().includes(q) || f.linkedContact.toLowerCase().includes(q) ||
      f.linkedDeal.toLowerCase().includes(q) || f.uploadedBy.toLowerCase().includes(q);
    return matchSearch && (typeFilter === 'All' || f.type === typeFilter);
  }), [files, searchQuery, typeFilter]);

  const fileStats = useMemo(() => ({
    totalFiles: files.length,
    totalSize: formatFileSize(files.reduce((s, f) => s + (typeof f.size === 'number' ? f.size : 0), 0)),
    contractsCount: files.filter((f) => f.type === 'Contract').length,
    proposalsCount: files.filter((f) => f.type === 'Proposal').length,
    invoicesCount: files.filter((f) => f.type === 'Invoice').length,
  }), [files]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-slate-300 text-base">No files found</p>
      <p className="text-sm text-slate-500 mt-1">Adjust your filters or upload a new document</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .file-row:hover .file-row-actions { opacity: 1; }
        .file-row-actions { opacity: 0; transition: opacity 0.15s; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
        @media (max-width: 640px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Client Documents</h1>
            <p className="text-slate-400 text-sm mt-1">Securely manage contracts, proposals & invoices</p>
          </div>
          <button
            onClick={openUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-violet-900/40 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
            </svg>
            Upload File
          </button>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Files', value: fileStats.totalFiles, color: 'text-white' },
            { label: 'Total Size', value: fileStats.totalSize, color: 'text-sky-400' },
            { label: 'Contracts', value: fileStats.contractsCount, color: 'text-violet-400' },
            { label: 'Proposals', value: fileStats.proposalsCount, color: 'text-sky-400' },
            { label: 'Invoices', value: fileStats.invoicesCount, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/3 border border-white/7 rounded-xl p-4 hover:bg-white/5 transition-colors">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white/3 border border-white/7 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search files, contacts, deals…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all min-w-[140px]"
            >
              {TYPE_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0f1117]">{o}</option>)}
            </select>
            <div className="flex bg-white/5 border border-white/8 rounded-lg p-1 gap-1">
              {[
                { mode: 'table', path: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                { mode: 'grid', path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              ].map(({ mode, path }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-all ${viewMode === mode ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Files Display ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading documents…
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white/2 border border-white/7 rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/7">
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">File Name</th>
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Contact</th>
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Deal</th>
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Date</th>
                    <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Size</th>
                    <th className="px-4 sm:px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.length === 0 ? (
                    <tr><td colSpan="7"><EmptyState /></td></tr>
                  ) : filteredFiles.map((file) => (
                    <tr
                      key={file.id || file._id}
                      className="file-row border-b border-white/4 hover:bg-white/3 transition-colors cursor-pointer group"
                      onClick={() => openPreview(file)}
                    >
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <FileIcon type={file.type} size="sm" />
                          <span className="font-medium text-white truncate max-w-[140px] sm:max-w-[200px]" title={file.fileName}>{file.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className={getTypeBadgeClasses(file.type)}>
                          <span className={`w-1.5 h-1.5 rounded-full ${TYPE_CONFIG[file.type]?.dot || 'bg-slate-400'}`} />
                          {file.type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-slate-300 hidden md:table-cell truncate max-w-[160px]">{file.linkedContact || '—'}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-slate-300 hidden lg:table-cell truncate max-w-[160px]">{file.linkedDeal || '—'}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-slate-400 whitespace-nowrap hidden sm:table-cell">{formatDate(file.date)}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-slate-400 hidden sm:table-cell">{file.fileSize || '—'}</td>
                      <td className="px-4 sm:px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="file-row-actions inline-flex items-center gap-3">
                          <button onClick={() => handleDownload(file)} className="text-sky-400 hover:text-sky-300 font-medium text-xs transition-colors">Download</button>
                          <button onClick={() => confirmDelete(file.id)} className="text-red-400 hover:text-red-300 font-medium text-xs transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.length === 0 ? (
              <div className="col-span-full bg-white/2 border border-white/7 rounded-xl"><EmptyState /></div>
            ) : filteredFiles.map((file) => (
              <div
                key={file.id || file._id}
                className="bg-white/3 border border-white/7 rounded-xl p-4 hover:border-violet-500/30 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                onClick={() => openPreview(file)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_CONFIG[file.type]?.badge || 'bg-slate-500/15'}`}>
                    <FileIcon type={file.type} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate group-hover:text-violet-300 transition-colors">{file.fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{file.fileSize}</p>
                  </div>
                  <span className={getTypeBadgeClasses(file.type)}>
                    <span className={`w-1.5 h-1.5 rounded-full ${TYPE_CONFIG[file.type]?.dot || 'bg-slate-400'}`} />
                    {file.type}
                  </span>
                </div>
                <div className="space-y-1.5 py-3 border-t border-b border-white/5 mb-3">
                  {file.linkedContact && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{file.linkedContact}</span>
                    </div>
                  )}
                  {file.linkedDeal && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{file.linkedDeal}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(file.date)}
                  </div>
                </div>
                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDownload(file)} className="flex-1 text-center py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold transition-all">Download</button>
                  <button onClick={() => confirmDelete(file.id)} className="flex-1 text-center py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Upload Modal ── */}
        {showUploadModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Upload Document</h2>
                <button onClick={closeModals} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUploadSave(); }} className="space-y-4">
                {/* Drop Zone */}
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center hover:bg-white/3 transition-colors ${formErrors.file ? 'border-red-500/40 bg-red-500/5' : 'border-white/12 bg-white/2'}`}>
                  <input type="file" multiple onChange={handleFileInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <svg className="mx-auto w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
                  </svg>
                  <p className="text-sm text-slate-400">Click to select or drag files here</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'PDF, DOCX, XLSX, PNG, JPG'}</p>
                </div>
                {formErrors.file && <p className="text-xs text-red-400">{formErrors.file}</p>}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">File Name</label>
                  <input type="text" name="fileName" value={formData.fileName} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    placeholder="Auto-filled from selected file" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
                      {TYPE_OPTIONS.filter((t) => t !== 'All').map((t) => <option key={t} value={t} className="bg-[#0f1117]">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Linked Contact</label>
                  <select name="linkedContact" value={formData.linkedContact} onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all ${formErrors.linkedContact ? 'border-red-500/40' : 'border-white/10'}`}>
                    <option value="" className="bg-[#0f1117]">Select a contact</option>
                    {contacts.map((c) => <option key={c.id} value={c.name} className="bg-[#0f1117]">{c.name}</option>)}
                  </select>
                  {formErrors.linkedContact && <p className="text-xs text-red-400 mt-1">{formErrors.linkedContact}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Linked Deal</label>
                  <select name="linkedDeal" value={formData.linkedDeal} onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
                    <option value="" className="bg-[#0f1117]">Select a deal</option>
                    {deals.map((d) => <option key={d.id} value={d.name} className="bg-[#0f1117]">{d.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModals}
                    className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 disabled:opacity-50">
                    {saving ? 'Uploading…' : 'Upload File'}
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}

        {/* ── Preview Modal ── */}
        {showPreviewModal && selectedFile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModals}>
            <div
              className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-lg border border-white/8 overflow-hidden"
              style={{ animation: 'modalIn 0.18s ease' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview Top — File Visual + Actions */}
              <div className={`relative p-8 flex flex-col items-center gap-4 ${TYPE_CONFIG[selectedFile.type]?.badge?.replace('text-', 'border-') || ''}`}
                style={{ background: 'linear-gradient(160deg, rgba(139,92,246,0.08) 0%, rgba(15,17,23,0) 60%)' }}>
                {/* Close button */}
                <button
                  onClick={closeModals}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* File icon + download button sitting on top */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${TYPE_CONFIG[selectedFile.type]?.badge || 'bg-slate-500/15'}`}>
                    <FileIcon type={selectedFile.type} size="lg" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white text-base">{selectedFile.fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedFile.fileSize || '0 MB'}</p>
                  </div>
                  {/* Download button directly under file info */}
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 text-sm font-semibold transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download File
                  </button>
                </div>
              </div>

              {/* Meta grid */}
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Type', value: selectedFile.type },
                  { label: 'Uploaded', value: formatDate(selectedFile.date) },
                  { label: 'Contact', value: selectedFile.linkedContact || '—' },
                  { label: 'Deal', value: selectedFile.linkedDeal || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={closeModals}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => { closeModals(); confirmDelete(selectedFile.id); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-sm font-semibold transition-all"
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm Modal ── */}
        {showDeleteModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Delete this file?</h3>
              <p className="text-sm text-slate-400 mb-6">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={closeModals} className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/40 disabled:opacity-50">
                  {saving ? 'Deleting…' : 'Delete File'}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}