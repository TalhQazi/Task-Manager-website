import { useState, useMemo, useEffect } from 'react';
import { getAuthState } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/admin/apiClient';

const STATUS_OPTIONS = ['All', 'Active', 'Prospect', 'Inactive'];
const INDUSTRY_OPTIONS = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Other'];

const COUNTRIES = [
  'USA/US', 'United Kingdom/UK', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Pakistan',
  'United Arab Emirates', 'Saudi Arabia', 'Singapore', 'Japan', 'China', 'South Korea', 'Brazil',
  'Mexico', 'Argentina', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Belgium', 'Austria', 'Poland', 'Czech Republic', 'Russia', 'Turkey', 'Egypt', 'South Africa',
  'Nigeria', 'Kenya', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Malaysia', 'Bangladesh',
  'Sri Lanka', 'Nepal', 'New Zealand', 'Ireland', 'Portugal', 'Greece', 'Finland', 'Ukraine'
];

// Enhanced status colors for dark theme
const getStatusBadgeClasses = (status) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  switch(status) {
    case 'Active':
      return `${baseClasses} bg-emerald-900/80 text-emerald-300 border border-emerald-600 shadow-sm`;
    case 'Prospect':
      return `${baseClasses} bg-blue-900/80 text-blue-300 border border-blue-600 shadow-sm`;
    case 'Inactive':
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600 shadow-sm`;
    default:
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
  }
};

export default function CRMCompanies() {
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    industry: string;
    contactCount: string;
    activeDeals: string;
    status: string;
    website: string;
    location: string;
    description: string;
  }>({
    name: '', industry: '', contactCount: '', activeDeals: '', status: 'Active',
    website: '', location: '', description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Filter & Search Logic (client-side for now, can be moved to API)
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

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${getApiBaseUrl()}/api/crm-company`, {
        headers: { Authorization: `Bearer ${getAuthState().token || ""}` },
      });
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Modal Handlers
  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', industry: '', contactCount: '', activeDeals: '', status: 'Active', website: '', location: '', description: '' });
    setFormErrors({});
    setCountrySearch('');
    setShowCountryDropdown(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({ 
      ...company, 
      contactCount: company.contactCount?.toString() || '', 
      activeDeals: company.activeDeals?.toString() || '' 
    });
    setFormErrors({});
    setCountrySearch(company.location || '');
    setShowCountryDropdown(false);
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
      [name]: value
    }));
  };

  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, location: country }));
    setCountrySearch(country);
    setShowCountryDropdown(false);
  };

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES;
    return COUNTRIES.filter(country =>
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Company name is required';
    if (!formData.industry) errors.industry = 'Industry is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        contactCount: formData.contactCount ? parseInt(formData.contactCount, 10) : 0,
        activeDeals: formData.activeDeals ? parseInt(formData.activeDeals, 10) : 0,
      };

      const url = editingCompany 
        ? `${getApiBaseUrl()}/api/crm-company/${editingCompany.id}`
        : `${getApiBaseUrl()}/api/crm-company`;
      
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthState().token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save company');
      }

      const data = await response.json();
      
      // Update local state
      if (editingCompany) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? data.item : c))
        );
      } else {
        setCompanies((prev) => [data.item, ...prev]);
      }

      closeFormModal();
    } catch (err) {
      setError(err.message);
      console.error('Error saving company:', err);
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-3xl font-bold text-white tracking-tight">Companies</h1>
              <p className="text-neutral-400 mt-1 text-sm">External companies database. Track organizations, relationships, and deal pipelines.</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 border border-neutral-700 shadow-lg hover:shadow-neutral-900/50 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Company
            </button>
          </div>
        </div>

        {/* Search & Filters - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4 transition-all duration-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by company, industry, or website..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none text-white min-w-[160px]"
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none text-white min-w-[160px]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Companies Table - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden transition-all duration-200">
          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-neutral-400 mt-3">Loading companies...</p>
            </div>
          )}

          {/* Desktop Table View */}
          {!loading && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center">Contact Count</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center">Active Deals</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="font-medium text-neutral-300">No companies found</p>
                          <p className="text-sm text-neutral-500">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-neutral-800/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{company.name}</div>
                          <div className="text-xs text-neutral-400 truncate max-w-[180px]">{company.website}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-300">{company.industry}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-md border border-neutral-700">
                            {company.contactCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-950/50 text-blue-300 text-sm font-medium rounded-md border border-blue-800">
                            {company.activeDeals}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadgeClasses(company.status)}>
                            {company.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openDetailsModal(company)}
                            className="text-neutral-300 hover:text-white font-medium text-sm transition-colors"
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(company)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
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
          )}

          {/* Mobile Card View - Dark Theme */}
          {!loading && (
            <div className="md:hidden divide-y divide-neutral-800">
              {filteredCompanies.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-neutral-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="font-medium text-neutral-300">No companies found</p>
                  <p className="text-sm text-neutral-500">Try adjusting your search or filters.</p>
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <div key={company.id} className="p-4 hover:bg-neutral-800/50 transition-colors duration-150">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{company.name}</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{company.website}</p>
                      </div>
                      <span className={getStatusBadgeClasses(company.status)}>
                        {company.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-neutral-800/50 rounded-lg p-2">
                        <p className="text-xs text-neutral-400">Industry</p>
                        <p className="text-sm text-white font-medium">{company.industry}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-lg p-2">
                        <p className="text-xs text-neutral-400">Location</p>
                        <p className="text-sm text-white font-medium truncate">{company.location || 'N/A'}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-lg p-2">
                        <p className="text-xs text-neutral-400">Contacts</p>
                        <p className="text-sm text-white font-medium">{company.contactCount}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-lg p-2">
                        <p className="text-xs text-neutral-400">Active Deals</p>
                        <p className="text-sm text-blue-300 font-medium">{company.activeDeals}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => openDetailsModal(company)}
                        className="text-neutral-300 hover:text-white font-medium text-sm transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openEditModal(company)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal - Dark Theme */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeFormModal}>
            <div
              className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 border border-neutral-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Company Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.name ? 'border-red-700' : 'border-neutral-700'
                    }`}
                    placeholder="Enter company name"
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Industry *</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${
                      formErrors.industry ? 'border-red-700' : 'border-neutral-700'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    {INDUSTRY_OPTIONS.filter(i => i !== 'All').map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {formErrors.industry && <p className="text-xs text-red-400 mt-1">{formErrors.industry}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Website</label>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500"
                    placeholder="example.com"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Country</label>
                  <input
                    name="location"
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setFormData(prev => ({ ...prev, location: e.target.value }));
                      setShowCountryDropdown(true);
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500"
                    placeholder="Search country..."
                  />
                  {showCountryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredCountries.length === 0 ? (
                        <div className="px-3 py-2 text-neutral-400 text-sm">No countries found</div>
                      ) : (
                        filteredCountries.map((country) => (
                          <div
                            key={country}
                            onClick={() => handleCountrySelect(country)}
                            className="px-3 py-2 text-white hover:bg-neutral-700 cursor-pointer text-sm"
                          >
                            {country}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500"
                    placeholder="Brief company overview..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Contacts</label>
                    <input
                      type="number"
                      name="contactCount"
                      value={formData.contactCount}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Deals</label>
                    <input
                      type="number"
                      name="activeDeals"
                      value={formData.activeDeals}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {STATUS_OPTIONS.filter(s => s !== 'All').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  onClick={closeFormModal}
                  disabled={saving}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                    editingCompany ? 'Save Changes' : 'Add Company'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal - Dark Theme */}
        {isDetailsModalOpen && viewingCompany && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeDetailsModal}>
            <div
              className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Company Details</h2>
                <button onClick={closeDetailsModal} className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-xl font-bold text-white">{viewingCompany.name}</h3>
                  <span className={getStatusBadgeClasses(viewingCompany.status)}>
                    {viewingCompany.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Industry</p>
                    <p className="font-medium text-white">{viewingCompany.industry}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Location</p>
                    <p className="font-medium text-white">{viewingCompany.location || 'N/A'}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Contacts</p>
                    <p className="font-medium text-white">{viewingCompany.contactCount}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Active Deals</p>
                    <p className="font-medium text-blue-300">{viewingCompany.activeDeals}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 mb-1">Website</p>
                  <a
                    href={`https://${viewingCompany.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                  >
                    {viewingCompany.website || 'Not provided'}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 mb-1">Description</p>
                  <p className="text-sm text-neutral-300 leading-relaxed">{viewingCompany.description || 'No description available.'}</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => { closeDetailsModal(); openEditModal(viewingCompany); }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg"
                >
                  Edit Company
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}