import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const TYPE_OPTIONS = ['All', 'Follow-up Call', 'Meeting', 'Reminder'];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent'];

const TYPE_CONFIG = {
  'Follow-up Call': { badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
  'Meeting':        { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  'Reminder':       { badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30', dot: 'bg-violet-400' },
};

const PRIORITY_CONFIG = {
  Low:    { badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',   dot: 'bg-slate-400' },
  Medium: { badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',         dot: 'bg-sky-400' },
  High:   { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400' },
  Urgent: { badge: 'bg-red-500/15 text-red-300 border-red-500/30',         dot: 'bg-red-400' },
};

const getTypeBadgeClasses = (type) => {
  const cfg = TYPE_CONFIG[type] || { badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`;
};

const getPriorityBadgeClasses = (priority) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const isOverdue = (dateStr, status) =>
  status !== 'Completed' && new Date(dateStr) < new Date(new Date().toDateString());

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

export default function CRMTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [targetTaskId, setTargetTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '', type: 'Follow-up Call', assignedTo: '', dueDate: '', priority: 'Medium', linkedEntity: '', status: 'Pending',
  });
  const [formErrors, setFormErrors] = useState({});
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-tasks`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error?.message || 'Failed to load tasks'); }
      const data = await res.json();
      setTasks(data.items || []);
    } catch (err) { setError(err?.message || 'Failed to load tasks'); }
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

  useEffect(() => { fetchTasks(); fetchContacts(); fetchDeals(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModals(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.title.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q) || t.linkedEntity.toLowerCase().includes(q)) &&
      (typeFilter === 'All' || t.type === typeFilter) &&
      (priorityFilter === 'All' || t.priority === priorityFilter) &&
      (assigneeFilter === 'All' || t.assignedTo === assigneeFilter)
    );
  }), [tasks, searchQuery, typeFilter, priorityFilter, assigneeFilter]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, highPriority, rate };
  }, [tasks]);

  const openCreateModal = () => {
    setTargetTaskId(null);
    setFormData({ title: '', type: 'Follow-up Call', assignedTo: '', dueDate: '', priority: 'Medium', linkedEntity: '', status: 'Pending' });
    setFormErrors({}); setShowFormModal(true);
  };

  const openEditModal = (task) => {
    setTargetTaskId(task.id);
    setFormData({ ...task });
    setFormErrors({}); setShowFormModal(true);
  };

  const openDetailsModal = (task) => { setSelectedTask(task); setShowDetailsModal(true); };

  const confirmDelete = (id) => { setTargetTaskId(id); setShowDeleteModal(true); };

  const closeModals = () => {
    setShowFormModal(false); setShowDeleteModal(false); setShowDetailsModal(false);
    setTargetTaskId(null); setSelectedTask(null); setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Task title is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true); setError(null);
      const url = targetTaskId ? `${getApiBaseUrl()}/api/crm-tasks/${encodeURIComponent(targetTaskId)}` : `${getApiBaseUrl()}/api/crm-tasks`;
      const res = await fetch(url, {
        method: targetTaskId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthState().token || ''}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error?.message || 'Failed to save task'); }
      const data = await res.json();
      if (targetTaskId) {
        setTasks((p) => p.map((t) => t.id === targetTaskId ? data.item : t));
        if (selectedTask?.id === targetTaskId) setSelectedTask(data.item);
      } else {
        setTasks((p) => [data.item, ...p]);
      }
      closeModals();
    } catch (err) { setError(err?.message || 'Failed to save task'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/crm-tasks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthState().token || ''}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const data = await res.json();
      setTasks((p) => p.map((t) => t.id === id ? data.item : t));
      if (selectedTask?.id === id) setSelectedTask(data.item);
    } catch (err) { setError(err?.message || 'Failed to update status'); }
  };

  const handleDeleteConfirm = async () => {
    if (!targetTaskId) return;
    try {
      setSaving(true); setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/crm-tasks/${encodeURIComponent(targetTaskId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthState().token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks((p) => p.filter((t) => t.id !== targetTaskId));
    } catch (err) { setError(err?.message || 'Failed to delete task'); }
    finally { setSaving(false); closeModals(); }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <p className="font-semibold text-slate-300 text-base">No tasks found</p>
      <p className="text-sm text-slate-500 mt-1">Adjust filters or create a new task</p>
    </div>
  );

  // ── Task Card (Grid view) ──
  const TaskCard = ({ task }) => {
    const overdue = isOverdue(task.dueDate, task.status);
    const isCompleted = task.status === 'Completed';
    const typeCfg = TYPE_CONFIG[task.type] || {};
    const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;

    return (
      <div
        className={`bg-white/3 border rounded-xl p-4 cursor-pointer group transition-all duration-200 hover:bg-white/5 ${
          isCompleted ? 'border-white/5 opacity-65' : 'border-white/7 hover:border-violet-500/25'
        }`}
        onClick={() => openDetailsModal(task)}
      >
        {/* Card Header */}
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => { e.stopPropagation(); toggleStatus(task.id); }}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500 cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm leading-snug ${isCompleted ? 'line-through text-slate-500' : 'text-white group-hover:text-violet-300 transition-colors'}`}>
              {task.title}
            </p>
            {task.linkedEntity && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{task.linkedEntity}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3 pl-7">
          <span className={getTypeBadgeClasses(task.type)}>
            <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot || 'bg-slate-400'}`} />
            {task.type}
          </span>
          <span className={getPriorityBadgeClasses(task.priority)}>
            <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
            {task.priority}
          </span>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 mb-3 pl-7">
          <div className="bg-white/3 border border-white/5 rounded-lg px-2.5 py-2">
            <p className="text-xs text-slate-500 mb-0.5">Assigned</p>
            <p className="text-xs font-medium text-white truncate">{task.assignedTo || '—'}</p>
          </div>
          <div className="bg-white/3 border border-white/5 rounded-lg px-2.5 py-2">
            <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
            <p className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-white'}`}>
              {formatDate(task.dueDate)}{overdue && ' ⚠'}
            </p>
          </div>
        </div>

        {/* Actions — always visible */}
        <div className="flex gap-2 pl-7 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(task)}
            className="flex-1 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-semibold transition-all text-center"
          >
            Edit
          </button>
          <button
            onClick={() => confirmDelete(task.id)}
            className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all text-center"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width:4px; height:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
        select option { background:#0f1117; color:#fff; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
        input[type="checkbox"] { accent-color: #7c3aed; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Tasks</h1>
            <p className="text-slate-400 text-sm mt-1">Manage follow-ups, meetings, and reminders</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-violet-900/40 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total',       value: taskStats.total,       color: 'text-white' },
            { label: 'Pending',     value: taskStats.pending,     color: 'text-amber-400' },
            { label: 'Completed',   value: taskStats.completed,   color: 'text-emerald-400' },
            { label: 'Overdue',     value: taskStats.overdue,     color: 'text-red-400' },
            { label: 'High Priority', value: taskStats.highPriority, color: 'text-orange-400' },
            { label: 'Done Rate',   value: `${taskStats.rate}%`,  color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/3 border border-white/7 rounded-xl p-3 sm:p-4 hover:bg-white/5 transition-colors">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 leading-tight">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white/3 border border-white/7 rounded-xl p-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks, assignees, linked entities…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-white outline-none focus:border-violet-500/50 transition-all flex-1 min-w-[130px]">
              {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Types' : o}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-white outline-none focus:border-violet-500/50 transition-all flex-1 min-w-[130px]">
              {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Priorities' : o}</option>)}
            </select>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-white outline-none focus:border-violet-500/50 transition-all flex-1 min-w-[140px]">
              <option value="All">All Assignees</option>
              {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {/* View toggle */}
            <div className="flex bg-white/5 border border-white/8 rounded-lg p-1 gap-1 flex-shrink-0">
              {[
                { mode: 'table', path: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                { mode: 'grid',  path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              ].map(({ mode, path }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-all ${viewMode === mode ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tasks Display ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading tasks…
          </div>
        ) : viewMode === 'table' ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/2 border border-white/7 rounded-xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/7">
                      <th className="px-4 py-3.5 w-10"></th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Task</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Linked</th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr><td colSpan="8"><EmptyState /></td></tr>
                    ) : filteredTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      const isCompleted = task.status === 'Completed';
                      const typeCfg = TYPE_CONFIG[task.type] || {};
                      const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                      return (
                        <tr
                          key={task.id}
                          className={`border-b border-white/4 hover:bg-white/3 transition-colors cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
                          onClick={() => openDetailsModal(task)}
                        >
                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={isCompleted} onChange={() => toggleStatus(task.id)}
                              className="h-4 w-4 rounded cursor-pointer" />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                              {task.title}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={getTypeBadgeClasses(task.type)}>
                              <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot || 'bg-slate-400'}`} />
                              {task.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 text-sm">{task.assignedTo || '—'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`text-sm font-medium ${overdue ? 'text-red-400' : 'text-slate-300'}`}>
                              {formatDate(task.dueDate)}{overdue && ' ⚠'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={getPriorityBadgeClasses(task.priority)}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-sm truncate max-w-[160px] hidden lg:table-cell">
                            {task.linkedEntity || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-2">
                              <button onClick={() => openEditModal(task)}
                                className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-xs font-semibold transition-all">
                                Edit
                              </button>
                              <button onClick={() => confirmDelete(task.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards (table mode on small screens) */}
            <div className="md:hidden space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="bg-white/2 border border-white/7 rounded-xl"><EmptyState /></div>
              ) : filteredTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const isCompleted = task.status === 'Completed';
                const typeCfg = TYPE_CONFIG[task.type] || {};
                const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                return (
                  <div key={task.id}
                    className={`bg-white/3 border border-white/7 rounded-xl p-4 transition-all ${isCompleted ? 'opacity-60' : 'hover:border-violet-500/20'}`}
                    onClick={() => openDetailsModal(task)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <input type="checkbox" checked={isCompleted}
                        onChange={(e) => { e.stopPropagation(); toggleStatus(task.id); }}
                        className="mt-0.5 h-4 w-4 rounded cursor-pointer flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
                        {task.linkedEntity && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.linkedEntity}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 pl-7">
                      <span className={getTypeBadgeClasses(task.type)}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot || 'bg-slate-400'}`} />{task.type}
                      </span>
                      <span className={getPriorityBadgeClasses(task.priority)}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />{task.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3 pl-7">
                      <div className="bg-white/3 border border-white/5 rounded-lg px-2.5 py-2">
                        <p className="text-xs text-slate-500">Assigned</p>
                        <p className="text-xs font-medium text-white truncate">{task.assignedTo || '—'}</p>
                      </div>
                      <div className="bg-white/3 border border-white/5 rounded-lg px-2.5 py-2">
                        <p className="text-xs text-slate-500">Due</p>
                        <p className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-white'}`}>{formatDate(task.dueDate)}{overdue && ' ⚠'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pl-7 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(task)}
                        className="flex-1 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-xs font-semibold transition-all text-center">
                        Edit
                      </button>
                      <button onClick={() => confirmDelete(task.id)}
                        className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all text-center">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full bg-white/2 border border-white/7 rounded-xl"><EmptyState /></div>
            ) : filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}

        {/* ── Create / Edit Modal ── */}
        {showFormModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">{targetTaskId ? 'Edit Task' : 'Create New Task'}</h2>
                <button onClick={closeModals} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                {/* Title */}
                <div>
                  <label className={labelCls}>Task Title <span className="text-red-400 normal-case tracking-normal">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                    className={inputCls(formErrors.title)} placeholder="e.g., Follow up on proposal" />
                  {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className={inputCls(false)}>
                      {TYPE_OPTIONS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleInputChange} className={inputCls(false)}>
                      {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Due Date <span className="text-red-400 normal-case tracking-normal">*</span></label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange}
                      className={inputCls(formErrors.dueDate)} />
                    {formErrors.dueDate && <p className="text-xs text-red-400 mt-1">{formErrors.dueDate}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputCls(false)}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Assigned To</label>
                  <select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} className={inputCls(false)}>
                    <option value="">Unassigned</option>
                    {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Linked Deal</label>
                  <select name="linkedEntity" value={formData.linkedEntity} onChange={handleInputChange} className={inputCls(false)}>
                    <option value="">No linked deal</option>
                    {deals.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/7">
                  <button type="button" onClick={closeModals} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving…</>
                    ) : targetTaskId ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}

        {/* ── Task Details Modal ── */}
        {showDetailsModal && selectedTask && (() => {
          const overdue = isOverdue(selectedTask.dueDate, selectedTask.status);
          const isCompleted = selectedTask.status === 'Completed';
          const typeCfg = TYPE_CONFIG[selectedTask.type] || {};
          const priCfg = PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Medium;
          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModals}>
              <div className="bg-[#0f1117] rounded-2xl shadow-2xl w-full max-w-lg border border-white/8 overflow-hidden"
                style={{ animation: 'modalIn 0.18s ease' }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/7">
                  <h2 className="text-lg font-bold text-white">Task Details</h2>
                  <button onClick={closeModals} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Task title + checkbox */}
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isCompleted} onChange={() => toggleStatus(selectedTask.id)}
                      className="mt-1 h-4 w-4 rounded cursor-pointer flex-shrink-0" />
                    <div className="flex-1">
                      <p className={`text-lg font-bold leading-snug ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {selectedTask.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={getTypeBadgeClasses(selectedTask.type)}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot || 'bg-slate-400'}`} />{selectedTask.type}
                        </span>
                        <span className={getPriorityBadgeClasses(selectedTask.priority)}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />{selectedTask.priority}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isCompleted ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
                          {selectedTask.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Assigned To', value: selectedTask.assignedTo || '—', color: 'text-white' },
                      { label: 'Due Date',    value: `${formatDate(selectedTask.dueDate)}${overdue ? ' ⚠' : ''}`, color: overdue ? 'text-red-400' : 'text-white' },
                      { label: 'Linked Deal', value: selectedTask.linkedEntity || '—', color: 'text-white' },
                      { label: 'Type',        value: selectedTask.type, color: 'text-white' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
                        <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={closeModals}
                    className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">
                    Close
                  </button>
                  <button onClick={() => { closeModals(); openEditModal(selectedTask); }}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40">
                    Edit Task
                  </button>
                  <button onClick={() => { closeModals(); confirmDelete(selectedTask.id); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-sm font-semibold transition-all">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Delete Confirm Modal ── */}
        {showDeleteModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Delete this task?</h3>
              <p className="text-sm text-slate-400 mb-6">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={closeModals}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/8 border border-white/8 text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/40 disabled:opacity-50">
                  {saving ? 'Deleting…' : 'Delete Task'}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

      </div>
    </div>
  );
}