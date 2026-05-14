import { useState, useMemo, useEffect } from 'react';
import { apiGet } from '@/lib/admin/apiClient';

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
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('Emails');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const filteredLogs = useMemo(() => {
    const type = TYPE_MAP[activeTab];
    return logs.filter((log) => {
      const matchesType = log.type === type;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        log.sender?.toLowerCase().includes(q) ||
        log.receiver?.toLowerCase().includes(q) ||
        log.content?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [logs, activeTab, searchQuery]);

  const tabCounts = useMemo(() => ({
    Emails: logs.filter((log) => log.type === 'Email').length,
    SMS: logs.filter((log) => log.type === 'SMS').length,
    Calls: logs.filter((log) => log.type === 'Call').length,
    Notes: logs.filter((log) => log.type === 'Note').length,
  }), [logs]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all customer interactions: emails, messages, calls, and internal notes.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 border border-gray-200">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          Read-only view
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold">An error occurred</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab}
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">{tabCounts[tab] || 0}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communications..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading communication logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No communication logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id || log._id} className="hover:bg-gray-50 transition-colors">
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
    </div>
  );
}
