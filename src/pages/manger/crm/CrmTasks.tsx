import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_TASKS = [
  { id: 1, title: 'Follow-up on Q3 proposal', type: 'Follow-up Call', assignedTo: 'Alice Johnson', dueDate: '2026-05-18', priority: 'High', linkedEntity: 'TechCorp Solutions (Deal)', status: 'Pending' },
  { id: 2, title: 'Quarterly review meeting', type: 'Meeting', assignedTo: 'Bob Smith', dueDate: '2026-05-14', priority: 'Medium', linkedEntity: 'GreenLeaf Finance', status: 'Pending' },
  { id: 3, title: 'Send contract renewal reminder', type: 'Reminder', assignedTo: 'Carol White', dueDate: '2026-05-10', priority: 'Low', linkedEntity: 'HealthFirst Clinics', status: 'Pending' },
  { id: 4, title: 'Demo for SwiftLogix team', type: 'Meeting', assignedTo: 'David Lee', dueDate: '2026-05-20', priority: 'High', linkedEntity: 'SwiftLogix', status: 'Pending' },
  { id: 5, title: 'Check in with new lead', type: 'Follow-up Call', assignedTo: 'Alice Johnson', dueDate: '2026-05-05', priority: 'Medium', linkedEntity: 'QuickMart', status: 'Completed' },
];

const TYPE_OPTIONS = ['All', 'Follow-up Call', 'Meeting', 'Reminder'];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const ASSIGNEE_OPTIONS = ['Unassigned', 'Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee'];

const TYPE_COLORS = {
  'Follow-up Call': 'bg-indigo-100 text-indigo-800',
  Meeting: 'bg-emerald-100 text-emerald-800',
  Reminder: 'bg-purple-100 text-purple-800',
};

const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-800',
  High: 'bg-amber-100 text-amber-800',
  Urgent: 'bg-red-100 text-red-800',
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const isOverdue = (dateStr, status) => status !== 'Completed' && new Date(dateStr) < new Date(new Date().toDateString());

export default function CRMTasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetTaskId, setTargetTaskId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', type: 'Follow-up Call', assignedTo: 'Unassigned', dueDate: '', priority: 'Medium', linkedEntity: '', status: 'Pending'
  });
  const [formErrors, setFormErrors] = useState({});

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        task.assignedTo.toLowerCase().includes(q) ||
        task.linkedEntity.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || task.type === typeFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [tasks, searchQuery, typeFilter, priorityFilter]);

  // Modal Handlers
  const openCreateModal = () => {
    setFormData({ title: '', type: 'Follow-up Call', assignedTo: 'Unassigned', dueDate: '', priority: 'Medium', linkedEntity: '', status: 'Pending' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (task) => {
    setFormData({ ...task });
    setFormErrors({});
    setShowFormModal(true);
  };

  const confirmDelete = (id) => {
    setTargetTaskId(id);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowFormModal(false);
    setShowDeleteModal(false);
    setTargetTaskId(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Task title is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    if (targetTaskId) {
      // Edit existing
      setTasks(prev => prev.map(t => t.id === targetTaskId ? { ...formData, id: targetTaskId } : t));
    } else {
      // Create new
      const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
      setTasks(prev => [...prev, { ...formData, id: newId }]);
    }
    closeModals();
  };

  const toggleStatus = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' };
    }));
  };

  const handleDeleteConfirm = () => {
    setTasks(prev => prev.filter(t => t.id !== targetTaskId));
    closeModals();
  };

  // Keyboard & Click Outside Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ModalOverlay = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage follow-ups, meetings, and reminders linked to your CRM contacts and deals.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + Create Task
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks, assignees, or linked entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[180px]"
          >
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[180px]"
          >
            {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Title</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Contact/Deal</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="font-medium">No tasks found</p>
                      <p className="text-sm">Adjust filters or create a new task to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isCompleted = task.status === 'Completed';
                  return (
                    <tr key={task.id} className={`hover:bg-gray-50 transition-colors ${isCompleted ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleStatus(task.id)}
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                        />
                      </td>
                      <td className={`px-6 py-4 font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[task.type]}`}>
                          {task.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{task.assignedTo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(task.dueDate)}
                          {overdue && <span className="ml-1.5 text-xs">(Overdue)</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm truncate max-w-[200px]" title={task.linkedEntity}>
                        {task.linkedEntity || '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => { setTargetTaskId(task.id); openEditModal(task); }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(task.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showFormModal && (
        <ModalOverlay onClose={closeModals}>
          <h2 className="text-xl font-semibold text-gray-900">
            {targetTaskId ? 'Edit Task' : 'Create New Task'}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input name="title" value={formData.title} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., Follow up on proposal" />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {TYPE_OPTIONS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.dueDate ? 'border-red-500' : 'border-gray-300'}`} />
                {formErrors.dueDate && <p className="text-xs text-red-500 mt-1">{formErrors.dueDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {ASSIGNEE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Contact / Deal</label>
              <input name="linkedEntity" value={formData.linkedEntity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Company Name or Deal Reference" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              {targetTaskId ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay onClose={closeModals}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Delete Task?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The task will be permanently removed.</p>
            <div className="flex justify-center gap-3">
              <button onClick={closeModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">Delete Task</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}