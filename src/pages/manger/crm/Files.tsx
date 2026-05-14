import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

/* ── Constants ───────────────────────────────────────────────────── */
const TYPE_OPTIONS = ['All', 'Contract', 'Proposal', 'Invoice', 'Other'];

const TYPE_CONFIG = {
  Contract: { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    icon: '📄', iconBg: 'bg-rose-100'    },
  Proposal: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    icon: '📋', iconBg: 'bg-blue-100'    },
  Invoice:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: '🧾', iconBg: 'bg-emerald-100' },
  Other:    { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400',   icon: '📁', iconBg: 'bg-slate-100'   },
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG['Other'];

const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes || isNaN(sizeInBytes)) return '0 MB';
  const mb = sizeInBytes / 1024 / 1024;
  return mb < 1 ? `${(sizeInBytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
};

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const handleDownload = (file, e) => {
  e?.stopPropagation();
  if (file.fileUrl || file.url) {
    const a = document.createElement('a');
    a.href = file.fileUrl || file.url;
    a.download = file.fileName || file.originalName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const fileId = file.id || file._id;
  if (fileId) {
    const a = document.createElement('a');
    a.href = `/api/crm-files/${fileId}/download`;
    a.download = file.fileName || file.originalName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

/* ── Shared UI atoms ─────────────────────────────────────────────── */
const TypeBadge = ({ type }) => {
  const cfg = getTypeConfig(type);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {type || 'Other'}
    </span>
  );
};

const FileIcon = ({ type, size = 'md' }) => {
  const cfg = getTypeConfig(type);
  const sz = size === 'lg' ? 'h-12 w-12 text-xl rounded-xl' : 'h-9 w-9 text-sm rounded-lg';
  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${sz} ${cfg.iconBg}`}>
      {cfg.icon}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Preview / Detail Modal
   – Bottom sheet on mobile, centered dialog on desktop
──────────────────────────────────────────────────────────────────── */
const PreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const cfg = getTypeConfig(file.type);

  const fields = [
    { label: 'File Name',      value: file.fileName || file.originalName || '—', span: 2 },
    { label: 'Type',           value: <TypeBadge type={file.type} /> },
    { label: 'Size',           value: file.fileSize },
    { label: 'Upload Date',    value: formatDate(file.date) },
    { label: 'Uploaded By',    value: file.uploadedBy || '—' },
    { label: 'Linked Contact', value: file.linkedContact || '—', span: 2 },
    { label: 'Linked Deal',    value: file.linkedDeal || '—', span: 2 },
    ...(file.description ? [{ label: 'Description', value: file.description, span: 2 }] : []),
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

        {/* Coloured header */}
        <div className={`px-5 pt-4 pb-4 ${cfg.bg} border-b ${cfg.border} flex-shrink-0`}>
          <div className="flex items-start gap-3">
            <FileIcon type={file.type} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
                {file.fileName || file.originalName || 'File Details'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{file.description || 'CRM document'}</p>
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

        {/* Footer — stacked on mobile, row on sm+ */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={(e) => handleDownload(file, e)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download File
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Mobile Card — one card per file (shown only below md breakpoint)
──────────────────────────────────────────────────────────────────── */
const MobileFileCard = ({ file, onView, onDownload }) => (
  <div
    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-transform"
    onClick={() => onView(file)}
  >
    {/* Top row: icon + name + badge */}
    <div className="flex items-start gap-3">
      <FileIcon type={file.type} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-snug break-words">
          {file.fileName || file.originalName || 'Unknown file'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {file.description || 'CRM document'}
        </p>
      </div>
      <div className="flex-shrink-0">
        <TypeBadge type={file.type} />
      </div>
    </div>

    {/* Meta row */}
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-gray-500">
      {file.linkedContact && (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {file.linkedContact}
        </span>
      )}
      {file.linkedDeal && (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
          </svg>
          {file.linkedDeal}
        </span>
      )}
      <span className="flex items-center gap-1">
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(file.date)}
      </span>
      <span className="flex items-center gap-1">
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h7" />
        </svg>
        {file.fileSize}
      </span>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 pt-1 border-t border-gray-100">
      <button
        onClick={(e) => { e.stopPropagation(); onView(file); }}
        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details
      </button>
      <button
        onClick={(e) => onDownload(file, e)}
        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────────────── */
export default function CRMFiles() {
  const [files, setFiles]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/crm-files');
      setFiles(
        (data.items || []).map((item) => ({
          ...item,
          fileSize: formatFileSize(item.size),
        }))
      );
    } catch (err) {
      setError(err?.message || 'Unable to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        file.fileName?.toLowerCase().includes(q) ||
        file.linkedContact?.toLowerCase().includes(q) ||
        file.linkedDeal?.toLowerCase().includes(q) ||
        file.uploadedBy?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || file.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts = { All: files.length };
    files.forEach((f) => { const t = f.type || 'Other'; counts[t] = (counts[t] || 0) + 1; });
    return counts;
  }, [files]);

  const StateBlock = ({ children }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">{children}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">File Manager</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse and download uploaded CRM documents.</p>
          </div>
          <div className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Read-only view
          </div>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search files, contacts, deals…"
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

          {/* Type filter chips — scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {TYPE_OPTIONS.map((type) => {
              const active = typeFilter === type;
              const cfg = getTypeConfig(type);
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    active
                      ? type === 'All'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {type !== 'All' && active && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                  {type}
                  {typeCounts[type] !== undefined && (
                    <span className={`ml-0.5 ${active ? 'opacity-75' : 'text-gray-400'}`}>
                      ({typeCounts[type] || 0})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <StateBlock>
            <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Loading files…</span>
          </StateBlock>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <StateBlock>
            <p className="text-red-500 font-medium text-center px-4">{error}</p>
            <button onClick={fetchFiles} className="text-sm text-indigo-600 hover:underline">Try again</button>
          </StateBlock>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredFiles.length === 0 && (
          <StateBlock>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <p className="text-sm">No files match your search.</p>
          </StateBlock>
        )}

        {!loading && !error && filteredFiles.length > 0 && (
          <>
            {/* ══════════════════════════════════════
                MOBILE — Card list  (< md)
            ══════════════════════════════════════ */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredFiles.map((file) => (
                <MobileFileCard
                  key={file.id || file._id}
                  file={file}
                  onView={setSelectedFile}
                  onDownload={handleDownload}
                />
              ))}
              <p className="text-xs text-gray-400 text-center pb-2">
                Showing {filteredFiles.length} of {files.length} files
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
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">File</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Contact</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Deal</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Uploaded By</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Size</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id || file._id}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedFile(file)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <FileIcon type={file.type} />
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate max-w-[160px] group-hover:text-indigo-700 transition-colors">
                                {file.fileName || file.originalName || 'Unknown file'}
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-[160px]">
                                {file.description || 'CRM document'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <TypeBadge type={file.type} />
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell max-w-[120px] truncate">
                          {file.linkedContact || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell max-w-[120px] truncate">
                          {file.linkedDeal || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-[100px] truncate">
                          {file.uploadedBy || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDate(file.date)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {file.fileSize}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedFile(file); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={(e) => handleDownload(file, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                              </svg>
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                Showing {filteredFiles.length} of {files.length} files
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
    </div>
  );
}