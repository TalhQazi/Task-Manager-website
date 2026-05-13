import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_COMPANIES = [
  { id: 1, name: 'TechCorp Solutions', industry: 'Technology', contactCount: 24, activeDeals: 3, status: 'Active', website: 'techcorp.com', location: 'San Francisco, CA', description: 'Leading SaaS provider for enterprise workflow automation.' },
  { id: 2, name: 'GreenLeaf Finance', industry: 'Finance', contactCount: 12, activeDeals: 1, status: 'Prospect', website: 'greenleaf.finance', location: 'New York, NY', description: 'Sustainable investment banking and advisory services.' },
  { id: 3, name: 'HealthFirst Clinics', industry: 'Healthcare', contactCount: 8, activeDeals: 0, status: 'Inactive', website: 'healthfirst.org', location: 'Chicago, IL', description: 'Network of outpatient clinics focusing on primary care.' },
  { id: 4, name: 'SwiftLogix', industry: 'Logistics', contactCount: 19, activeDeals: 5, status: 'Active', website: 'swiftlogix.co', location: 'Austin, TX', description: 'AI-driven supply chain optimization and fleet management.' },
];

const STATUS_OPTIONS = ['All', 'Active', 'Prospect', 'Inactive'];
const INDUSTRY_OPTIONS = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Other'];
const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-800',
  Prospect: 'bg-blue-100 text-blue-800',
  Inactive: 'bg-gray-100 text-gray-800',
};

export default function ManagerCRMCompanies() {
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', industry: '', contactCount: 0, activeDeals: 0, status: 'Active',
    website: '', location: '', description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Filter & Search Logic
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        company.name.toLowerCase().includes(q) ||
        company.industry.toLowerCase().includes(q) ||
        company.website?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || company.status === statusFilter;
      const matchesIndustry = industryFilter === 'All' || company.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [companies, searchQuery, statusFilter, industryFilter]);

  // Modal Handlers
  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', industry: '', contactCount: 0, activeDeals: 0, status: 'Active', website: '', location: '', description: '' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({ ...company });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openDetailsModal = (company) => {
    setViewingCompany(company);
    setIsDetailsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCompany(null);
    setFormErrors({});
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingCompany(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'contactCount' || name === 'activeDeals' ? Math.max(0, Number(value)) : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Company name is required';
    if (!formData.industry) errors.industry = 'Industry is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingCompany) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === editingCompany.id ? { ...formData, id: c.id } : c))
      );
    } else {
      const newId = Math.max(...companies.map((c) => c.id), 0) + 1;
      setCompanies((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeFormModal();
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFormModal();
        closeDetailsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">External companies database. Track organizations, relationships, and deal pipelines.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + Add Company
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
            placeholder="Search by company, industry, or website..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[160px]"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[160px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Contact Count</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Active Deals</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="font-medium">No companies found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">{company.website}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{company.industry}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md">
                        {company.contactCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-md">
                        {company.activeDeals}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[company.status] || 'bg-gray-100 text-gray-800'}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openDetailsModal(company)}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(company)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        title="Edit Company"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={closeFormModal}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900">
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['name', 'industry'].map((field) => (
                <div key={field} className={field === 'industry' ? 'md:col-span-1' : 'md:col-span-1'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  {field === 'industry' ? (
                    <select
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[field] ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRY_OPTIONS.filter(i => i !== 'All').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[field] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder={`Enter ${field}`}
                    />
                  )}
                  {formErrors[field] && <p className="text-xs text-red-500 mt-1">{formErrors[field]}</p>}
                </div>
              ))}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="website" value={formData.website} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input name="location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="City, Country" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief company overview..." />
              </div>

              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacts</label>
                  <input type="number" name="contactCount" value={formData.contactCount} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deals</label>
                  <input type="number" name="activeDeals" value={formData.activeDeals} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {STATUS_OPTIONS.filter(s => s !== 'All').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeFormModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                {editingCompany ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isDetailsModalOpen && viewingCompany && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={closeDetailsModal}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>
              <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-xl font-bold text-gray-900">{viewingCompany.name}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[viewingCompany.status]}`}>
                  {viewingCompany.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Industry</p>
                  <p className="font-medium text-gray-900">{viewingCompany.industry}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{viewingCompany.location || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Contacts</p>
                  <p className="font-medium text-gray-900">{viewingCompany.contactCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Active Deals</p>
                  <p className="font-medium text-gray-900">{viewingCompany.activeDeals}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Website</p>
                <a href={`https://${viewingCompany.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  {viewingCompany.website || 'Not provided'}
                </a>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{viewingCompany.description || 'No description available.'}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeDetailsModal} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
              <button onClick={() => { closeDetailsModal(); openEditModal(viewingCompany); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Edit Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}