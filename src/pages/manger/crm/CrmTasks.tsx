import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

/* ── Constants ───────────────────────────────────────────────────── */
const TYPE_OPTIONS     = ['All', 'Follow-up Call', 'Meeting', 'Reminder'];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent'];

const TYPE_CONFIG = {
  'Follow-up Call': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', icon: '📞' },
  'Meeting':        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: '🤝' },
  'Reminder':       { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  icon: '🔔' },
};

const PRIORITY_CONFIG = {
  Low:    { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400',  bar: 'bg-slate-300'  },
  Medium: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   bar: 'bg-blue-400'   },
  High:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',  bar: 'bg-amber-400'  },
  Urgent: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    bar: 'bg-red-500'    },
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const getTypeConfig     = (t) => TYPE_CONFIG[t]     || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', icon: '📋' };
const getPriorityConfig = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG['Low'];

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const isOverdue = (dateStr, status) =>
  status !== 'Completed' && dateStr
    ? new Date(dateStr) < new Date(new Date().toDateString())
    : false;

/* ── Shared UI atoms ─────────────────────────────────────────────── */
const TypeBadge = ({ type }) => {
  const cfg = getTypeConfig(type);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="text-[11px]">{cfg.icon}</span>
      {type || 'Other'}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = getPriorityConfig(priority);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {priority || '—'}
    </span>
  );
};

const DueDate = ({ dateStr, status }) => {
  const overdue = isOverdue(dateStr, status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
      {overdue && (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )}
      {formatDate(dateStr)}
      {overdue && <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">Overdue</span>}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Detail Modal — bottom sheet on mobile, centered dialog on desktop
──────────────────────────────────────────────────────────────────── */
const DetailModal = ({ task, onClose }) => {
  if (!task) return null;
  const typeCfg     = getTypeConfig(task.type);
  const overdue     = isOverdue(task.dueDate, task.status);

  const fields = [
    { label: 'Type',                value: <TypeBadge type={task.type} /> },
    { label: 'Priority',            value: <PriorityBadge priority={task.priority} /> },
    { label: 'Assigned To',         value: task.assignedTo || 'Unassigned' },
    { label: 'Status',              value: task.status || '—' },
    { label: 'Due Date',            value: <DueDate dateStr={task.dueDate} status={task.status} />, span: 2 },
    { label: 'Linked Contact / Deal', value: task.linkedEntity || '—', span: 2 },
    ...(task.notes ? [{ label: 'Notes', value: task.notes, span: 2 }] : []),
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
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className={`px-5 pt-4 pb-4 ${typeCfg.bg} border-b ${typeCfg.border} flex-shrink-0`}>
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center h-12 w-12 rounded-xl flex-shrink-0 ${typeCfg.bg} border ${typeCfg.border} text-2xl`}>
              {typeCfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
                {task.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Task information and assignment details.</p>
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
          {overdue && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-xs font-semibold text-red-600">This task is overdue</span>
            </div>
          )}
        </div>

        {/* Meta grid */}
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
const MobileTaskCard = ({ task, onView }) => {
  const overdue  = isOverdue(task.dueDate, task.status);
  const typeCfg  = getTypeConfig(task.type);
  const priCfg   = getPriorityConfig(task.priority);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-transform ${overdue ? 'border-red-200' : 'border-gray-200'}`}
      onClick={() => onView(task)}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 text-lg ${typeCfg.bg} border ${typeCfg.border}`}>
          {typeCfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug break-words ${overdue ? 'text-red-700' : 'text-gray-900'}`}>
            {task.title}
          </p>
          {task.assignedTo && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {task.assignedTo}
            </p>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2">
        <TypeBadge type={task.type} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${overdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(task.dueDate)}
          {overdue && <span className="ml-0.5 font-bold">· Overdue</span>}
        </span>
        {task.linkedEntity && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full truncate max-w-[160px]">
            🔗 {task.linkedEntity}
          </span>
        )}
      </div>

      {/* Priority bar */}
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${priCfg.bar} ${
          task.priority === 'Urgent' ? 'w-full' :
          task.priority === 'High'   ? 'w-3/4'  :
          task.priority === 'Medium' ? 'w-1/2'  : 'w-1/4'
        }`} />
      </div>

      {/* View button */}
      <div className="pt-1 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onView(task); }}
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
};

/* ─────────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────────────── */
export default function CRMTasks() {
  const [tasks, setTasks]                   = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [typeFilter, setTypeFilter]         = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedTask, setSelectedTask]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/crm-tasks');
      setTasks(data.items || []);
    } catch (err) {
      setError(err?.message || 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        task.title?.toLowerCase().includes(q) ||
        task.assignedTo?.toLowerCase().includes(q) ||
        task.linkedEntity?.toLowerCase().includes(q);
      const matchesType     = typeFilter     === 'All' || task.type     === typeFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [tasks, searchQuery, typeFilter, priorityFilter]);

  /* counts for chips */
  const typeCounts = useMemo(() => {
    const c = { All: tasks.length };
    tasks.forEach((t) => { c[t.type] = (c[t.type] || 0) + 1; });
    return c;
  }, [tasks]);

  const priorityCounts = useMemo(() => {
    const c = { All: tasks.length };
    tasks.forEach((t) => { c[t.priority] = (c[t.priority] || 0) + 1; });
    return c;
  }, [tasks]);

  const overdueCount = useMemo(() =>
    tasks.filter((t) => isOverdue(t.dueDate, t.status)).length, [tasks]);

  const StateBlock = ({ children }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">{children}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Tasks</h1>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  ⚠ {overdueCount} overdue
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Browse CRM task assignments and follow-up work.</p>
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
              placeholder="Search by title, assignee, or linked entity…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Type chips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Type</p>
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
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
                    {type !== 'All' && <span className="text-[11px]">{cfg.icon}</span>}
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

          {/* Priority chips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Priority</p>
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {PRIORITY_OPTIONS.map((p) => {
                const active = priorityFilter === p;
                const cfg = getPriorityConfig(p);
                return (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                      active
                        ? p === 'All'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {p !== 'All' && active && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                    {p}
                    {priorityCounts[p] !== undefined && (
                      <span className={`ml-0.5 ${active ? 'opacity-75' : 'text-gray-400'}`}>
                        ({priorityCounts[p] || 0})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <StateBlock>
            <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Loading tasks…</span>
          </StateBlock>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <StateBlock>
            <p className="text-red-500 font-medium text-center px-4">{error}</p>
            <button onClick={fetchTasks} className="text-sm text-indigo-600 hover:underline">Try again</button>
          </StateBlock>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredTasks.length === 0 && (
          <StateBlock>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No tasks found.</p>
          </StateBlock>
        )}

        {!loading && !error && filteredTasks.length > 0 && (
          <>
            {/* ══════════════════════════════════════
                MOBILE — Card list  (< md)
            ══════════════════════════════════════ */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredTasks.map((task) => (
                <MobileTaskCard
                  key={task.id || task._id}
                  task={task}
                  onView={setSelectedTask}
                />
              ))}
              <p className="text-xs text-gray-400 text-center pb-2">
                Showing {filteredTasks.length} of {tasks.length} tasks
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
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Task</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Assigned To</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Due Date</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Priority</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Linked Entity</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      return (
                        <tr
                          key={task.id || task._id}
                          className={`transition-colors cursor-pointer group ${overdue ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-indigo-50/30'}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          {/* Task title */}
                          <td className="px-5 py-3.5">
                            <div className={`font-semibold truncate max-w-[200px] group-hover:text-indigo-700 transition-colors ${overdue ? 'text-red-700' : 'text-gray-900'}`}>
                              {task.title}
                            </div>
                            {task.assignedTo && (
                              <div className="text-xs text-gray-400 mt-0.5 lg:hidden truncate max-w-[200px]">
                                👤 {task.assignedTo}
                              </div>
                            )}
                          </td>
                          {/* Type */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <TypeBadge type={task.type} />
                          </td>
                          {/* Assigned to */}
                          <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell truncate max-w-[120px]">
                            {task.assignedTo || 'Unassigned'}
                          </td>
                          {/* Due date */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <DueDate dateStr={task.dueDate} status={task.status} />
                          </td>
                          {/* Priority */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          {/* Linked entity */}
                          <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell truncate max-w-[160px]">
                            {task.linkedEntity || '—'}
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </div>
            </div>
          </>
        )}
      </div>

      <DetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}