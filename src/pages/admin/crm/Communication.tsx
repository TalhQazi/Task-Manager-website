import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_LOGS = [
  { id: 1, type: 'Email', date: '2026-05-12T10:30:00', sender: 'alice@company.com', receiver: 'contact@techcorp.com', content: 'Q3 Proposal & Pricing Update', status: 'Sent' },
  { id: 2, type: 'Email', date: '2026-05-11T09:15:00', sender: 'bob@company.com', receiver: 'lead@startup.io', content: 'Follow-up on demo request', status: 'Opened' },
  { id: 3, type: 'SMS', date: '2026-05-12T14:00:00', sender: '+1 555 0100', receiver: '+1 555 0201', content: 'Meeting confirmed for tomorrow at 2 PM.', status: 'Delivered' },
  { id: 4, type: 'Call', date: '2026-05-10T11:45:00', sender: 'Carol White', receiver: 'John Doe', content: '5m 20s - Discussed contract terms & next steps', status: 'Completed' },
  { id: 5, type: 'Note', date: '2026-05-09T16:30:00', sender: 'David Lee', receiver: 'Internal CRM', content: 'Client prefers email communication. Budget approval pending until June.', status: 'Logged' },
  { id: 6, type: 'Email', date: '2026-05-08T08:00:00', sender: 'alice@company.com', receiver: 'procurement@enterprise.com', content: 'Invoice #4921 & Payment Terms', status: 'Failed' },
];

const TABS = [
  { id: 'Emails', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'blue' },
  { id: 'SMS', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'green' },
  { id: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'purple' },
  { id: 'Notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'amber' }
];
const TYPE_MAP = { Emails: 'Email', SMS: 'SMS', Calls: 'Call', Notes: 'Note' };

// Enhanced status colors for dark theme
const getStatusBadgeClasses = (status) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  switch(status) {
    case 'Sent':
      return `${baseClasses} bg-blue-900/80 text-blue-300 border border-blue-600`;
    case 'Opened':
      return `${baseClasses} bg-indigo-900/80 text-indigo-300 border border-indigo-600`;
    case 'Delivered':
      return `${baseClasses} bg-emerald-900/80 text-emerald-300 border border-emerald-600`;
    case 'Completed':
      return `${baseClasses} bg-purple-900/80 text-purple-300 border border-purple-600`;
    case 'Logged':
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
    case 'Failed':
      return `${baseClasses} bg-red-900/80 text-red-300 border border-red-600 animate-pulse`;
    default:
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
  }
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CRMCommunication() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState('Emails');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [formData, setFormData] = useState({ sender: '', receiver: '', content: '', status: '' });
  const [formErrors, setFormErrors] = useState({});

  // Filter & Search Logic
  const filteredLogs = useMemo(() => {
    const type = TYPE_MAP[activeTab];
    return logs.filter((log) => {
      const matchesType = log.type === type;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        log.sender.toLowerCase().includes(q) || 
        log.receiver.toLowerCase().includes(q) || 
        log.content.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [logs, activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts = { Emails: 0, SMS: 0, Calls: 0, Notes: 0 };
    logs.forEach(log => {
      if (log.type === 'Email') counts.Emails++;
      else if (log.type === 'SMS') counts.SMS++;
      else if (log.type === 'Call') counts.Calls++;
      else if (log.type === 'Note') counts.Notes++;
    });
    return counts;
  }, [logs]);

  // Communication Statistics
  const commStats = useMemo(() => {
    const totalInteractions = logs.length;
    const successfulDelivery = logs.filter(l => !['Failed', 'Missed'].includes(l.status)).length;
    const successRate = totalInteractions > 0 ? (successfulDelivery / totalInteractions) * 100 : 0;
    const recentActivity = logs.filter(l => new Date(l.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    return { totalInteractions, successfulDelivery, successRate: Math.round(successRate), recentActivity };
  }, [logs]);

  // Modal Handlers
  const openAction = (type) => {
    setActionType(type);
    const defaults = {
      email: { sender: '', receiver: '', content: '', status: 'Sent' },
      sms: { sender: '', receiver: '', content: '', status: 'Sent' },
      call: { sender: '', receiver: '', content: '', status: 'Completed' },
      note: { sender: '', receiver: 'Internal CRM', content: '', status: 'Logged' },
    };
    setFormData(defaults[type] || defaults.note);
    setFormErrors({});
    setShowModal(true);
  };

  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetailsModal(false);
    setActionType(null);
    setSelectedLog(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sender.trim()) errors.sender = 'Sender is required';
    if (!formData.receiver.trim()) errors.receiver = 'Receiver/Target is required';
    if (!formData.content.trim()) errors.content = 'Content/Notes are required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const typeMap = { email: 'Email', sms: 'SMS', call: 'Call', note: 'Note' };
    const newId = Math.max(...logs.map(l => l.id), 0) + 1;
    const newLog = {
      id: newId,
      type: typeMap[actionType],
      date: new Date().toISOString(),
      ...formData
    };
    setLogs(prev => [newLog, ...prev]);
    closeModal();
  };

  // Get action button config
  const getActionConfig = (type) => {
    switch(type) {
      case 'note':
        return { label: 'Add Note', color: 'bg-gray-800 hover:bg-gray-700 border-gray-700', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' };
      case 'call':
        return { label: 'Log Call', color: 'bg-purple-900/80 hover:bg-purple-800 border-purple-700', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' };
      default:
        return { label: 'Send Message', color: 'bg-blue-900/80 hover:bg-blue-800 border-blue-700', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' };
    }
  };

  // Keyboard Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
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

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Communication Log</h1>
              <p className="text-neutral-400 mt-1 text-sm">Track all customer interactions: emails, messages, calls, and internal notes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => openAction('note')} 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-neutral-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Add Note
              </button>
              <button 
                onClick={() => openAction('call')} 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-sm font-medium rounded-xl transition-all duration-200 border border-purple-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Log Call
              </button>
              <button 
                onClick={() => openAction('email')} 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 text-sm font-medium rounded-xl transition-all duration-200 border border-blue-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Interactions</p>
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{commStats.totalInteractions}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Success Rate</p>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{commStats.successRate}%</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Successful</p>
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-1">{commStats.successfulDelivery}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Last 7 Days</p>
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-1">{commStats.recentActivity}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-800">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? `border-${tab.color}-500 text-${tab.color}-400`
                      : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <svg className={`w-4 h-4 ${isActive ? `text-${tab.color}-400` : 'text-neutral-500 group-hover:text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.id}
                  <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                    isActive ? `bg-${tab.color}-950/50 text-${tab.color}-400 border border-${tab.color}-800` : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search Bar */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by sender, receiver, or content...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500 text-sm"
            />
          </div>
        </div>

        {/* Communication Log Display */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-950 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date / Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sender</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Receiver</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Preview / Notes</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="font-medium text-neutral-300">No {activeTab.toLowerCase()} found</p>
                        <p className="text-sm text-neutral-500">Log a new interaction or adjust your search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-neutral-800/50 transition-colors duration-150 cursor-pointer" 
                      onClick={() => openDetailsModal(log)}
                    >
                      <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{formatDate(log.date)}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{log.sender}</td>
                      <td className="px-6 py-4 text-sm text-neutral-300">{log.receiver}</td>
                      <td className="px-6 py-4 text-sm text-neutral-400 max-w-md truncate" title={log.content}>{log.content}</td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadgeClasses(log.status)}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Communication Log Modal */}
        {showModal && (
          <ModalOverlay onClose={closeModal}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <h2 className="text-2xl font-bold text-white capitalize mb-4">
                {actionType === 'note' ? 'Add Internal Note' : actionType === 'call' ? 'Log Phone Call' : 'Send Message'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Sender *</label>
                    <input 
                      type="text"
                      name="sender" 
                      value={formData.sender} 
                      onChange={handleInputChange} 
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                        formErrors.sender ? 'border-red-700' : 'border-neutral-700'
                      }`} 
                      placeholder="You / System / Agent" 
                    />
                    {formErrors.sender && <p className="text-xs text-red-400 mt-1">{formErrors.sender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Receiver *</label>
                    <input 
                      type="text"
                      name="receiver" 
                      value={formData.receiver} 
                      onChange={handleInputChange} 
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                        formErrors.receiver ? 'border-red-700' : 'border-neutral-700'
                      }`} 
                      placeholder="Client / Lead / Contact" 
                    />
                    {formErrors.receiver && <p className="text-xs text-red-400 mt-1">{formErrors.receiver}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    {actionType === 'call' ? 'Call Notes & Duration *' : 'Message Content *'}
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.content ? 'border-red-700' : 'border-neutral-700'
                    }`}
                    placeholder={actionType === 'call' ? 'e.g., 3m 15s - Discussed pricing, client will reply by Friday.' : 'Type your message or internal note...'}
                  />
                  {formErrors.content && <p className="text-xs text-red-400 mt-1">{formErrors.content}</p>}
                </div>

                {actionType !== 'note' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Delivery Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {actionType === 'call' && <option value="Completed">Completed</option>}
                      {actionType === 'call' && <option value="Missed">Missed</option>}
                      {(actionType === 'email' || actionType === 'sms') && <option value="Sent">Sent</option>}
                      {(actionType === 'email' || actionType === 'sms') && <option value="Delivered">Delivered</option>}
                      {(actionType === 'email' || actionType === 'sms') && <option value="Failed">Failed</option>}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
                <button 
                  type="button"
                  onClick={closeModal} 
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-neutral-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg"
                >
                  {actionType === 'note' ? 'Save Note' : actionType === 'call' ? 'Log Call' : 'Send Message'}
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white capitalize">Communication Details</h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round"strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-neutral-500">Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedLog.type === 'Email' && <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      {selectedLog.type === 'SMS' && <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                      {selectedLog.type === 'Call' && <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                      {selectedLog.type === 'Note' && <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                      <span className="font-medium text-white">{selectedLog.type}</span>
                    </div>
                  </div>
                  <span className={getStatusBadgeClasses(selectedLog.status)}>
                    {selectedLog.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Date & Time</p>
                    <p className="text-sm text-white font-medium mt-0.5">{formatDate(selectedLog.date)}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Sender</p>
                    <p className="text-sm text-white font-medium mt-0.5 break-all">{selectedLog.sender}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Receiver</p>
                    <p className="text-sm text-white font-medium mt-0.5 break-all">{selectedLog.receiver}</p>
                  </div>
                </div>

                <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                  <p className="text-xs text-neutral-500">Content / Notes</p>
                  <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{selectedLog.content}</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}