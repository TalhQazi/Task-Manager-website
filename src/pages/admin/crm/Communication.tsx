import { useState, useMemo, useEffect } from 'react';
import { apiFetch, apiGet } from '@/lib/admin/apiClient';

const TYPE_MAP = { Emails: 'Email', SMS: 'SMS', Calls: 'Call', Notes: 'Note' };
const STATUS_COLORS = {
  Sent: 'bg-blue-900/80 text-blue-300 border border-blue-600',
  Opened: 'bg-indigo-900/80 text-indigo-300 border border-indigo-600',
  Delivered: 'bg-emerald-900/80 text-emerald-300 border border-emerald-600',
  Completed: 'bg-purple-900/80 text-purple-300 border border-purple-600',
  Logged: 'bg-gray-800 text-gray-300 border border-gray-600',
  Failed: 'bg-red-900/80 text-red-300 border border-red-600 animate-pulse',
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CRMCommunication() {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('Emails');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [formData, setFormData] = useState({ sender: '', receiver: '', content: '', status: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/crm-communication');
      setLogs(data.items || []);
    } catch (err) {
      setError(err?.message || 'Unable to load communication logs');
      console.error('Error loading CRM communication logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openAction = (type) => {
    const defaults = {
      email: { sender: '', receiver: '', content: '', status: 'Sent' },
      sms: { sender: '', receiver: '', content: '', status: 'Sent' },
      call: { sender: '', receiver: '', content: '', status: 'Completed' },
      note: { sender: '', receiver: 'Internal CRM', content: '', status: 'Logged' },
    };
    setActionType(type);
    setFormData(defaults[type]);
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetailsModal(false);
    setSelectedLog(null);
    setActionType(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sender.trim()) errors.sender = 'Sender is required';
    if (!formData.receiver.trim()) errors.receiver = 'Receiver is required';
    if (!formData.content.trim()) errors.content = 'Content is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        type: actionType === 'email' ? 'Email' : actionType === 'sms' ? 'SMS' : actionType === 'call' ? 'Call' : 'Note',
        sender: formData.sender,
        receiver: formData.receiver,
        content: formData.content,
        status: formData.status,
      };
      const data = await apiFetch('/api/crm-communication', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setLogs((prev) => [{ ...data.item, id: data.item.id }, ...prev]);
      closeModal();
    } catch (err) {
      setError(err?.message || 'Failed to save communication');
      console.error('Error saving communication log:', err);
    } finally {
      setSaving(false);
    }
  };

  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

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
    return {
      Emails: logs.filter((log) => log.type === 'Email').length,
      SMS: logs.filter((log) => log.type === 'SMS').length,
      Calls: logs.filter((log) => log.type === 'Call').length,
      Notes: logs.filter((log) => log.type === 'Note').length,
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Communication Log</h1>
              <p className="text-neutral-400 mt-1 text-sm">Track all customer interactions: emails, messages, calls, and internal notes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openAction('note')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-neutral-700">
                Add Note
              </button>
              <button onClick={() => openAction('call')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-sm font-medium rounded-xl transition-all duration-200 border border-purple-700">
                Log Call
              </button>
              <button onClick={() => openAction('email')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 text-sm font-medium rounded-xl transition-all duration-200 border border-blue-700">
                Send Message
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-red-200">
            <p className="font-semibold">An error occurred</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Interactions</p>
            <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Sent / Completed</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{logs.filter((log) => !['Failed', 'Missed'].includes(log.status)).length}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Open / Delivered</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{logs.filter((log) => ['Opened', 'Delivered'].includes(log.status)).length}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Recent (7d)</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{logs.filter((log) => new Date(log.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search logs by sender, receiver, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <div className="flex gap-2">
              {['Emails', 'SMS', 'Calls', 'Notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-neutral-400">Loading communication logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sender</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Receiver</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Preview</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                        No communication logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id || log._id} className="hover:bg-neutral-800/50 transition-colors duration-150 cursor-pointer" onClick={() => openDetailsModal(log)}>
                        <td className="px-6 py-4 text-sm text-neutral-300 whitespace-nowrap">{formatDate(log.date)}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{log.sender}</td>
                        <td className="px-6 py-4 text-sm text-neutral-300">{log.receiver}</td>
                        <td className="px-6 py-4 text-sm text-neutral-400 max-w-[28rem] truncate" title={log.content}>{log.content}</td>
                        <td className="px-6 py-4">
                          <span className={`${STATUS_COLORS[log.status] || 'bg-neutral-800 text-neutral-300 border border-neutral-700'} inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-neutral-800" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white capitalize">
                {actionType === 'note' ? 'Add Internal Note' : actionType === 'call' ? 'Log Phone Call' : 'Send Message'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Sender</label>
                    <input
                      name="sender"
                      value={formData.sender}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sender: e.target.value }))}
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${formErrors.sender ? 'border-red-700' : 'border-neutral-700'}`}
                    />
                    {formErrors.sender && <p className="text-xs text-red-400 mt-1">{formErrors.sender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Receiver</label>
                    <input
                      name="receiver"
                      value={formData.receiver}
                      onChange={(e) => setFormData((prev) => ({ ...prev, receiver: e.target.value }))}
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${formErrors.receiver ? 'border-red-700' : 'border-neutral-700'}`}
                    />
                    {formErrors.receiver && <p className="text-xs text-red-400 mt-1">{formErrors.receiver}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Content</label>
                  <textarea
                    name="content"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${formErrors.content ? 'border-red-700' : 'border-neutral-700'}`}
                  />
                  {formErrors.content && <p className="text-xs text-red-400 mt-1">{formErrors.content}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                  >
                    {actionType === 'call' ? (
                      <>
                        <option value="Completed">Completed</option>
                        <option value="Missed">Missed</option>
                      </>
                    ) : (
                      <>
                        <option value="Sent">Sent</option>
                        <option value="Opened">Opened</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Failed">Failed</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-300 rounded-lg border border-neutral-700 hover:bg-neutral-800">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-60">
                  {saving ? 'Saving...' : actionType === 'note' ? 'Save Note' : actionType === 'call' ? 'Log Call' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Communication Details</h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Type</p>
                    <p className="mt-2 text-white font-medium">{selectedLog.type}</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Status</p>
                    <span className={`${STATUS_COLORS[selectedLog.status] || 'bg-neutral-800 text-neutral-300 border border-neutral-700'} inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-2`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Sender</p>
                    <p className="mt-2 text-white font-medium break-all">{selectedLog.sender}</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Receiver</p>
                    <p className="mt-2 text-white font-medium break-all">{selectedLog.receiver}</p>
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                  <p className="text-xs text-neutral-500">Date</p>
                  <p className="mt-2 text-white font-medium">{formatDate(selectedLog.date)}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
                  <p className="text-xs text-neutral-500">Content</p>
                  <p className="mt-2 text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedLog.content}</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 text-right">
                <button onClick={closeModal} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all duration-200">
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
