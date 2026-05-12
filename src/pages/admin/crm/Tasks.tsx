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

// Enhanced type colors for dark theme
const getTypeBadgeClasses = (type) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium";
  switch(type) {
    case 'Follow-up Call':
      return `${baseClasses} bg-indigo-950/50 text-indigo-300 border border-indigo-800`;
    case 'Meeting':
      return `${baseClasses} bg-emerald-950/50 text-emerald-300 border border-emerald-800`;
    case 'Reminder':
      return `${baseClasses} bg-purple-950/50 text-purple-300 border border-purple-800`;
    default:
      return `${baseClasses} bg-neutral-800 text-neutral-300 border border-neutral-700`;
  }
};

// Enhanced priority colors for dark theme
const getPriorityBadgeClasses = (priority) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium";
  switch(priority) {
    case 'Low':
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
    case 'Medium':
      return `${baseClasses} bg-blue-950/50 text-blue-300 border border-blue-800`;
    case 'High':
      return `${baseClasses} bg-amber-950/50 text-amber-300 border border-amber-800`;
    case 'Urgent':
      return `${baseClasses} bg-red-950/50 text-red-300 border border-red-800 animate-pulse`;
    default:
      return `${baseClasses} bg-neutral-800 text-neutral-300 border border-neutral-700`;
  }
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const isOverdue = (dateStr, status) => status !== 'Completed' && new Date(dateStr) < new Date(new Date().toDateString());

export default function CRMTasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [targetTaskId, setTargetTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
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
      const matchesAssignee = assigneeFilter === 'All' || task.assignedTo === assigneeFilter;
      return matchesSearch && matchesType && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, typeFilter, priorityFilter, assigneeFilter]);

  // Task Statistics
  const taskStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { totalTasks, completedTasks, pendingTasks, overdueTasks, highPriorityTasks, completionRate: Math.round(completionRate) };
  }, [tasks]);

  // Modal Handlers
  const openCreateModal = () => {
    setTargetTaskId(null);
    setFormData({ title: '', type: 'Follow-up Call', assignedTo: 'Unassigned', dueDate: '', priority: 'Medium', linkedEntity: '', status: 'Pending' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (task) => {
    setTargetTaskId(task.id);
    setFormData({ ...task });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const confirmDelete = (id) => {
    setTargetTaskId(id);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowFormModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
    setTargetTaskId(null);
    setSelectedTask(null);
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
      setTasks(prev => prev.map(t => t.id === targetTaskId ? { ...formData, id: targetTaskId } : t));
    } else {
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

  // Keyboard Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ModalOverlay = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-neutral-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  const TaskCard = ({ task }) => {
    const overdue = isOverdue(task.dueDate, task.status);
    const isCompleted = task.status === 'Completed';
    
    return (
      <div 
        className={`bg-neutral-900 rounded-xl border transition-all duration-200 hover:shadow-xl cursor-pointer group ${
          isCompleted ? 'border-neutral-800 opacity-75' : 'border-neutral-800 hover:border-neutral-700'
        }`}
        onClick={() => openDetailsModal(task)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => { e.stopPropagation(); toggleStatus(task.id); }}
              className="mt-1 h-5 w-5 text-emerald-500 rounded border-neutral-700 bg-neutral-800 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1">
              <h3 className={`font-semibold text-base ${isCompleted ? 'line-through text-neutral-500' : 'text-white group-hover:text-blue-400'} transition-colors`}>
                {task.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{task.linkedEntity || 'No linked entity'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3 ml-8">
            <span className={getTypeBadgeClasses(task.type)}>{task.type}</span>
            <span className={getPriorityBadgeClasses(task.priority)}>{task.priority}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 ml-8">
            <div className="bg-neutral-800/50 rounded-lg p-2">
              <p className="text-xs text-neutral-500">Assigned To</p>
              <div className="flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm text-white font-medium">{task.assignedTo}</p>
              </div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-2">
              <p className="text-xs text-neutral-500">Due Date</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-400' : 'text-white'}`}>
                {formatDate(task.dueDate)}
                {overdue && <span className="ml-1 text-xs text-red-400">(Overdue)</span>}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 ml-8 pt-2 border-t border-neutral-800">
            <button
              onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirmDelete(task.id); }}
              className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Tasks</h1>
              <p className="text-neutral-400 mt-1 text-sm">Manage follow-ups, meetings, and reminders linked to your CRM contacts and deals.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 border border-neutral-700 shadow-lg hover:shadow-neutral-900/50 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-bold text-white mt-1">{taskStats.totalTasks}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{taskStats.pendingTasks}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{taskStats.completedTasks}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Overdue</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{taskStats.overdueTasks}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{taskStats.highPriorityTasks}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{taskStats.completionRate}%</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks, assignees, or linked entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 outline-none text-white min-w-[150px]"
              >
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 outline-none text-white min-w-[150px]"
              >
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 outline-none text-white min-w-[150px]"
              >
                <option value="All">All Assignees</option>
                {ASSIGNEE_OPTIONS.filter(a => a !== 'All').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'table' ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        {viewMode === 'table' ? (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Task Title</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Linked Entity</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <p className="font-medium text-neutral-300">No tasks found</p>
                          <p className="text-sm text-neutral-500">Adjust filters or create a new task to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      const isCompleted = task.status === 'Completed';
                      return (
                        <tr key={task.id} className={`hover:bg-neutral-800/50 transition-colors duration-150 cursor-pointer ${isCompleted ? 'bg-neutral-900/50' : ''}`} onClick={() => openDetailsModal(task)}>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleStatus(task.id)}
                              className="h-5 w-5 text-emerald-500 rounded border-neutral-700 bg-neutral-800 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className={`px-6 py-4 font-medium ${isCompleted ? 'line-through text-neutral-500' : 'text-white'}`}>
                            {task.title}
                          </td>
                          <td className="px-6 py-4">
                            <span className={getTypeBadgeClasses(task.type)}>
                              {task.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-300">{task.assignedTo}</td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${overdue ? 'text-red-400' : 'text-neutral-300'}`}>
                              {formatDate(task.dueDate)}
                              {overdue && <span className="ml-1.5 text-xs text-red-400">(Overdue)</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={getPriorityBadgeClasses(task.priority)}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-400 text-sm truncate max-w-[200px]" title={task.linkedEntity}>
                            {task.linkedEntity || '—'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditModal(task)}
                              className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(task.id)}
                              className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
                <svg className="w-12 h-12 text-neutral-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="font-medium text-neutral-300">No tasks found</p>
                <p className="text-sm text-neutral-500">Adjust filters or create a new task to get started.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showFormModal && (
          <ModalOverlay onClose={closeModals}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <h2 className="text-2xl font-bold text-white mb-4">
                {targetTaskId ? 'Edit Task' : 'Create New Task'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Task Title *</label>
                  <input 
                    type="text"
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.title ? 'border-red-700' : 'border-neutral-700'
                    }`} 
                    placeholder="e.g., Follow up on proposal" 
                  />
                  {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Type</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {TYPE_OPTIONS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Priority</label>
                    <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Due Date *</label>
                    <input 
                      type="date" 
                      name="dueDate" 
                      value={formData.dueDate} 
                      onChange={handleInputChange} 
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${
                        formErrors.dueDate ? 'border-red-700' : 'border-neutral-700'
                      }`} 
                    />
                    {formErrors.dueDate && <p className="text-xs text-red-400 mt-1">{formErrors.dueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Assigned To</label>
                    <select 
                      name="assignedTo" 
                      value={formData.assignedTo} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {ASSIGNEE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Linked Entity</label>
                  <input 
                    type="text"
                    name="linkedEntity" 
                    value={formData.linkedEntity} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500" 
                    placeholder="e.g., Company Name or Deal Reference" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
                <button 
                  type="button"
                  onClick={closeModals} 
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg"
                >
                  {targetTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* Task Details Modal */}
        {showDetailsModal && selectedTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModals}>
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Task Details</h2>
                <button onClick={closeModals} className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTask.status === 'Completed'}
                    onChange={() => { toggleStatus(selectedTask.id); setSelectedTask({ ...selectedTask, status: selectedTask.status === 'Completed' ? 'Pending' : 'Completed' }); }}
                    className="mt-1 h-5 w-5 text-emerald-500 rounded border-neutral-700 bg-neutral-800 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${selectedTask.status === 'Completed' ? 'line-through text-neutral-500' : 'text-white'}`}>
                      {selectedTask.title}
                    </h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Type</p>
                    <p className="font-medium text-white mt-0.5">{selectedTask.type}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Priority</p>
                    <p className="font-medium text-white mt-0.5">{selectedTask.priority}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Assigned To</p>
                    <p className="font-medium text-white mt-0.5">{selectedTask.assignedTo}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Due Date</p>
                    <p className={`font-medium mt-0.5 ${isOverdue(selectedTask.dueDate, selectedTask.status) ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(selectedTask.dueDate)}
                      {isOverdue(selectedTask.dueDate, selectedTask.status) && <span className="ml-1 text-xs text-red-400">(Overdue)</span>}
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                  <p className="text-xs text-neutral-400">Linked Entity</p>
                  <p className="text-sm text-white mt-0.5">{selectedTask.linkedEntity || '—'}</p>
                </div>

                <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                  <p className="text-xs text-neutral-400">Status</p>
                  <span className={selectedTask.status === 'Completed' ? 'text-emerald-400 text-sm font-medium' : 'text-amber-400 text-sm font-medium'}>
                    {selectedTask.status}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => { closeModals(); openEditModal(selectedTask); }}
                  className="px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-semibold rounded-lg transition-all duration-200 border border-blue-700"
                >
                  Edit Task
                </button>
                <button
                  onClick={() => { closeModals(); confirmDelete(selectedTask.id); }}
                  className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-all duration-200 border border-red-700"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-950/50 border border-red-800 mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Delete Task?</h3>
              <p className="text-sm text-neutral-400 mb-6">This action cannot be undone. The task will be permanently removed.</p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={closeModals} 
                  className="px-5 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-neutral-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm} 
                  className="px-5 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-all duration-200 border border-red-700 shadow-lg"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}