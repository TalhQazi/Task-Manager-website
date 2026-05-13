import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Inactive'];

// Enhanced status colors for better visibility on dark background
const getStatusBadgeClasses = (status) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  switch(status) {
    case 'Active':
      return `${baseClasses} bg-emerald-900/80 text-emerald-300 border border-emerald-600 shadow-sm shadow-emerald-900/30`;
    case 'Pending':
      return `${baseClasses} bg-amber-900/80 text-amber-300 border border-amber-600 shadow-sm shadow-amber-900/30`;
    case 'Inactive':
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600 shadow-sm`;
    default:
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
  }
};

export default function CRMContacts() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', status: 'Active' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);

  // Filter & Search Logic (client-side for now, can be moved to API)
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        contact.name.toLowerCase().includes(q) ||
        contact.email.toLowerCase().includes(q) ||
        contact.phone.includes(q) ||
        contact.company.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchQuery, statusFilter]);

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${getApiBaseUrl()}/api/crm-contacts`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Fetch companies for dropdown
  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/crm-company`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data.items || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  // Load companies when modal opens
  useEffect(() => {
    if (isModalOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isModalOpen]);

  // Modal Handlers
  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', company: '', status: 'Active' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const url = editingContact 
        ? `${getApiBaseUrl()}/api/crm-contacts/${editingContact.id}`
        : `${getApiBaseUrl()}/api/crm-contacts`;
      
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthState().token || ""}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save contact');
      }

      const data = await response.json();
      
      // Update local state
      if (editingContact) {
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? data.item : c))
        );
      } else {
        setContacts((prev) => [data.item, ...prev]);
      }

      closeModal();
    } catch (err) {
      setError(err.message);
      console.error('Error saving contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => setDeleteTargetId(id);
  const handleDelete = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/crm-contacts/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      setContacts((prev) => prev.filter((c) => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting contact:', err);
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        setDeleteTargetId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header Section - Dark Theme */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Contacts</h1>
              <p className="text-neutral-400 mt-1 text-sm">External logon database. Manage, track, and update contact details.</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 border border-neutral-700 shadow-lg hover:shadow-neutral-900/50 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>

        {/* Search & Filter Section - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4 transition-all duration-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    statusFilter === opt
                      ? 'bg-neutral-700 text-white border border-neutral-600 shadow-md transform scale-105'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contacts Table - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden transition-all duration-200">
          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-neutral-400 mt-3">Loading contacts...</p>
            </div>
          )}

          {/* Desktop Table View */}
          {!loading && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="font-medium text-neutral-300">No contacts found</p>
                          <p className="text-sm text-neutral-500">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-neutral-800/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{contact.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <a href={`mailto:${contact.email}`} className="text-neutral-300 hover:text-white hover:underline transition-colors">
                            {contact.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <a href={`tel:${contact.phone}`} className="text-neutral-400 font-mono text-sm hover:text-white transition-colors">
                            {contact.phone}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-neutral-300">{contact.company}</td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadgeClasses(contact.status)}>
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="text-neutral-300 hover:text-white font-medium text-sm transition-colors hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(contact.id)}
                            className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Card View - Dark Theme */}
          {!loading && (
            <div className="md:hidden divide-y divide-neutral-800">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-neutral-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-neutral-300">No contacts found</p>
                  <p className="text-sm text-neutral-500">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="p-4 hover:bg-neutral-800/50 transition-colors duration-150">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{contact.name}</h3>
                        <p className="text-sm text-neutral-400">{contact.company}</p>
                      </div>
                      <span className={getStatusBadgeClasses(contact.status)}>
                        {contact.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${contact.email}`} className="text-neutral-300 hover:text-white transition-colors">{contact.email}</a>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${contact.phone}`} className="text-neutral-400 hover:text-white transition-colors">{contact.phone}</a>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-3 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="text-neutral-300 hover:text-white font-medium text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(contact.id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal - Dark Theme */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
            <div
              className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-neutral-800 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {['name', 'email', 'phone'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-neutral-300 mb-1 capitalize">{field}</label>
                    <input
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                        formErrors[field] ? 'border-red-700' : 'border-neutral-700'
                      }`}
                      placeholder={`Enter ${field}`}
                    />
                    {formErrors[field] && <p className="text-xs text-red-400 mt-1">{formErrors[field]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Company</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white ${
                      formErrors.company ? 'border-red-700' : 'border-neutral-700'
                    }`}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.name}>{company.name}</option>
                    ))}
                  </select>
                  {formErrors.company && <p className="text-xs text-red-400 mt-1">{formErrors.company}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 outline-none text-white"
                  >
                    {STATUS_OPTIONS.filter((s) => s !== 'All').map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeModal} disabled={saving} className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    editingContact ? 'Save Changes' : 'Add Contact'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Dark Theme */}
        {deleteTargetId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteTargetId(null)}>
            <div
              className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-center border border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-16 h-16 bg-red-950/50 rounded-full flex items-center justify-center border border-red-800">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Delete Contact?</h3>
                <p className="text-sm text-neutral-400 mt-2">This action cannot be undone. The contact will be permanently removed from the database.</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium">
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-6 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-all duration-200 border border-red-700 shadow-lg">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}