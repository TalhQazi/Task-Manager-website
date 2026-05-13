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

const TABS = ['Emails', 'SMS', 'Calls', 'Notes'];
const TYPE_MAP = { Emails: 'Email', SMS: 'SMS', Calls: 'Call', Notes: 'Note' };

const STATUS_COLORS = {
  Sent: 'bg-blue-100 text-blue-800',
  Opened: 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-purple-100 text-purple-800',
  Logged: 'bg-gray-100 text-gray-800',
  Failed: 'bg-red-100 text-red-800',
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CRMCommunication() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState('Emails');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'email' | 'sms' | 'call' | 'note'
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

  const closeModal = () => {
    setShowModal(false);
    setActionType(null);
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

  // Keyboard & Click Outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
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
          <h1 className="text-2xl font-bold text-gray-900">Communication Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all customer interactions: emails, messages, calls, and internal notes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openAction('note')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors border border-gray-300">
            + Add Note
          </button>
          <button onClick={() => openAction('call')} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors border border-blue-200">
            + Log Call
          </button>
          <button onClick={() => openAction('email')} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors border border-emerald-200">
            + Send Message
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()} by sender, receiver, or content...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Time</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview / Notes</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="font-medium">No {activeTab.toLowerCase()} found</p>
                      <p className="text-sm">Log a new interaction or adjust your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(log.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{log.sender}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{log.receiver}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.content}>{log.content}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-800'}`}>
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
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {actionType === 'note' ? 'Add Internal Note' : actionType === 'call' ? 'Log Phone Call' : 'Send Message'}
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input name="sender" value={formData.sender} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.sender ? 'border-red-500' : 'border-gray-300'}`} placeholder="You / System / Agent" />
                {formErrors.sender && <p className="text-xs text-red-500 mt-1">{formErrors.sender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
                <input name="receiver" value={formData.receiver} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.receiver ? 'border-red-500' : 'border-gray-300'}`} placeholder="Client / Lead / Contact" />
                {formErrors.receiver && <p className="text-xs text-red-500 mt-1">{formErrors.receiver}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionType === 'call' ? 'Call Notes & Duration' : 'Message Content'}
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.content ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={actionType === 'call' ? 'e.g., 3m 15s - Discussed pricing, client will reply by Friday.' : 'Type your message or internal note...'}
              />
              {formErrors.content && <p className="text-xs text-red-500 mt-1">{formErrors.content}</p>}
            </div>

            {actionType !== 'note' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {actionType === 'call' && <option value="Completed">Completed</option>}
                  {actionType === 'call' && <option value="Missed">Missed</option>}
                  {(actionType === 'email' || actionType === 'sms') && <option value="Sent">Sent</option>}
                  {(actionType === 'email' || actionType === 'sms') && <option value="Delivered">Delivered</option>}
                  {(actionType === 'email' || actionType === 'sms') && <option value="Failed">Failed</option>}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              {actionType === 'note' ? 'Save Note' : actionType === 'call' ? 'Log Call' : 'Send Message'}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}