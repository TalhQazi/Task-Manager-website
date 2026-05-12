import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_DEALS = [
  { id: 1, name: 'Enterprise SaaS License', company: 'TechCorp Solutions', value: 45000, stage: 'Proposal', probability: 60, closeDate: '2026-08-15', owner: 'Alice Johnson' },
  { id: 2, name: 'Cloud Migration Project', company: 'GreenLeaf Finance', value: 120000, stage: 'Negotiation', probability: 80, closeDate: '2026-07-30', owner: 'Bob Smith' },
  { id: 3, name: 'Annual Support Renewal', company: 'HealthFirst Clinics', value: 15000, stage: 'Closed Won', probability: 100, closeDate: '2026-06-01', owner: 'Carol White' },
  { id: 4, name: 'Fleet Telematics Upgrade', company: 'SwiftLogix', value: 78000, stage: 'Needs Analysis', probability: 40, closeDate: '2026-09-20', owner: 'Alice Johnson' },
];

const STAGES = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const OWNERS = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Unassigned'];

// Enhanced stage colors for dark theme
const getStageBadgeClasses = (stage) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  switch(stage) {
    case 'Qualification':
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
    case 'Needs Analysis':
      return `${baseClasses} bg-blue-900/80 text-blue-300 border border-blue-600 shadow-sm`;
    case 'Proposal':
      return `${baseClasses} bg-indigo-900/80 text-indigo-300 border border-indigo-600 shadow-sm`;
    case 'Negotiation':
      return `${baseClasses} bg-amber-900/80 text-amber-300 border border-amber-600 shadow-sm`;
    case 'Closed Won':
      return `${baseClasses} bg-emerald-900/80 text-emerald-300 border border-emerald-600 shadow-sm`;
    case 'Closed Lost':
      return `${baseClasses} bg-red-900/80 text-red-300 border border-red-600 shadow-sm`;
    default:
      return `${baseClasses} bg-gray-800 text-gray-300 border border-gray-600`;
  }
};

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function CRMDeals() {
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', company: '', value: '', stage: STAGES[0], probability: 50, closeDate: '', owner: OWNERS[0]
  });
  const [formErrors, setFormErrors] = useState({});

  // Filter & Search Logic
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        deal.name.toLowerCase().includes(q) ||
        deal.company.toLowerCase().includes(q) ||
        deal.owner.toLowerCase().includes(q);
      const matchesStage = stageFilter === 'All' || deal.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [deals, searchQuery, stageFilter]);

  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
    const wonDeals = deals.filter(deal => deal.stage === 'Closed Won').length;
    const activeDeals = deals.filter(deal => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length;
    return { totalValue, weightedValue, wonDeals, activeDeals };
  }, [deals]);

  // Modal Handlers
  const openCreate = () => {
    setFormData({ name: '', company: '', value: '', stage: STAGES[0], probability: 50, closeDate: '', owner: OWNERS[0] });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openStageUpdate = (deal) => {
    setSelectedDeal(deal);
    setShowStageModal(true);
  };

  const openOwnerUpdate = (deal) => {
    setSelectedDeal(deal);
    setShowOwnerModal(true);
  };

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowStageModal(false);
    setShowOwnerModal(false);
    setSelectedDeal(null);
    setFormErrors({});
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' || name === 'probability' ? (value === '' ? '' : Math.max(0, Number(value))) : value
    }));
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Deal name is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    if (!formData.value || formData.value <= 0) errors.value = 'Value must be greater than 0';
    if (!formData.closeDate) errors.closeDate = 'Close date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSave = (e) => {
    e.preventDefault(); // Prevent form submission reload
    if (!validateCreateForm()) return;
    const newId = Math.max(...deals.map(d => d.id), 0) + 1;
    setDeals(prev => [...prev, { ...formData, value: Number(formData.value), probability: Number(formData.probability), id: newId }]);
    closeAllModals();
  };

  const handleStageSave = () => {
    const stageSelect = document.getElementById('stageSelect');
    if (stageSelect && selectedDeal) {
      const newStage = stageSelect.value;
      setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, stage: newStage } : d));
      closeAllModals();
    }
  };

  const handleOwnerSave = () => {
    const ownerSelect = document.getElementById('ownerSelect');
    if (ownerSelect && selectedDeal) {
      const newOwner = ownerSelect.value;
      setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, owner: newOwner } : d));
      closeAllModals();
    }
  };

  // Keyboard & Click Outside Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAllModals();
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
        {/* Header Section - Dark Theme */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Deals</h1>
              <p className="text-neutral-400 mt-1 text-sm">Track business opportunities, monitor sales stages, and forecast revenue.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 border border-neutral-700 shadow-lg hover:shadow-neutral-900/50 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Deal
            </button>
          </div>
        </div>

        {/* Metrics Cards - Dark Theme */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg p-4 transition-all duration-200 hover:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400 font-medium">Total Pipeline</p>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(pipelineMetrics.totalValue)}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg p-4 transition-all duration-200 hover:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400 font-medium">Weighted Pipeline</p>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-blue-300 mt-2">{formatCurrency(pipelineMetrics.weightedValue)}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg p-4 transition-all duration-200 hover:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400 font-medium">Active Deals</p>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{pipelineMetrics.activeDeals}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg p-4 transition-all duration-200 hover:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400 font-medium">Won Deals</p>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{pipelineMetrics.wonDeals}</p>
          </div>
        </div>

        {/* Search & Filter - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4 transition-all duration-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search deals, companies, or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none text-white min-w-[180px]"
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Deals Table - Dark Theme */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden transition-all duration-200">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-950 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Deal Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center">Probability</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Close Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-neutral-300">No deals found</p>
                        <p className="text-sm text-neutral-500">Adjust filters or create a new deal to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-neutral-800/50 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-white">{deal.name}</td>
                      <td className="px-6 py-4 text-neutral-300">{deal.company}</td>
                      <td className="px-6 py-4 font-medium text-emerald-400">{formatCurrency(deal.value)}</td>
                      <td className="px-6 py-4">
                        <span className={getStageBadgeClasses(deal.stage)}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-neutral-800 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${deal.probability}%` }}></div>
                          </div>
                          <span className="text-blue-300 text-xs font-semibold">{deal.probability}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-400 text-sm">{formatDate(deal.closeDate)}</td>
                      <td className="px-6 py-4 text-neutral-300 text-sm">{deal.owner}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openStageUpdate(deal)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                          title="Update Stage"
                        >
                          Stage
                        </button>
                        <button
                          onClick={() => openOwnerUpdate(deal)}
                          className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                          title="Assign Owner"
                        >
                          Owner
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Dark Theme */}
          <div className="md:hidden divide-y divide-neutral-800">
            {filteredDeals.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-neutral-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-neutral-300">No deals found</p>
                <p className="text-sm text-neutral-500">Adjust filters or create a new deal to get started.</p>
              </div>
            ) : (
              filteredDeals.map((deal) => (
                <div key={deal.id} className="p-4 hover:bg-neutral-800/50 transition-colors duration-150">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{deal.name}</h3>
                      <p className="text-sm text-neutral-400">{deal.company}</p>
                    </div>
                    <span className={getStageBadgeClasses(deal.stage)}>
                      {deal.stage}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <p className="text-xs text-neutral-400">Value</p>
                      <p className="text-base font-bold text-emerald-400">{formatCurrency(deal.value)}</p>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <p className="text-xs text-neutral-400">Probability</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-neutral-700 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${deal.probability}%` }}></div>
                        </div>
                        <span className="text-blue-300 text-xs font-semibold">{deal.probability}%</span>
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <p className="text-xs text-neutral-400">Close Date</p>
                      <p className="text-sm text-white font-medium">{formatDate(deal.closeDate)}</p>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <p className="text-xs text-neutral-400">Owner</p>
                      <p className="text-sm text-white font-medium truncate">{deal.owner}</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => openStageUpdate(deal)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                    >
                      Update Stage
                    </button>
                    <button
                      onClick={() => openOwnerUpdate(deal)}
                      className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                    >
                      Assign Owner
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Deal Modal - Dark Theme - Fixed with onSubmit prevention */}
        {showCreateModal && (
          <ModalOverlay onClose={closeAllModals}>
            <form onSubmit={handleCreateSave}>
              <h2 className="text-2xl font-bold text-white mb-4">Create New Deal</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Deal Name *</label>
                  <input 
                    type="text"
                    name="name" 
                    value={formData.name} 
                    onChange={handleCreateChange} 
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.name ? 'border-red-700' : 'border-neutral-700'
                    }`} 
                    placeholder="e.g., Q3 Enterprise License" 
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Company *</label>
                  <input 
                    type="text"
                    name="company" 
                    value={formData.company} 
                    onChange={handleCreateChange} 
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.company ? 'border-red-700' : 'border-neutral-700'
                    }`} 
                    placeholder="Company name" 
                  />
                  {formErrors.company && <p className="text-xs text-red-400 mt-1">{formErrors.company}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Value ($) *</label>
                    <input 
                      type="number" 
                      name="value" 
                      value={formData.value} 
                      onChange={handleCreateChange} 
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white ${
                        formErrors.value ? 'border-red-700' : 'border-neutral-700'
                      }`} 
                      placeholder="0" 
                    />
                    {formErrors.value && <p className="text-xs text-red-400 mt-1">{formErrors.value}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Probability (%)</label>
                    <input 
                      type="number" 
                      name="probability" 
                      value={formData.probability} 
                      onChange={handleCreateChange} 
                      min="0" 
                      max="100" 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Stage</label>
                    <select 
                      name="stage" 
                      value={formData.stage} 
                      onChange={handleCreateChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Close Date *</label>
                    <input 
                      type="date" 
                      name="closeDate" 
                      value={formData.closeDate} 
                      onChange={handleCreateChange} 
                      className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white ${
                        formErrors.closeDate ? 'border-red-700' : 'border-neutral-700'
                      }`} 
                    />
                    {formErrors.closeDate && <p className="text-xs text-red-400 mt-1">{formErrors.closeDate}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Owner</label>
                  <select 
                    name="owner" 
                    value={formData.owner} 
                    onChange={handleCreateChange} 
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                  >
                    {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
                <button 
                  type="button"
                  onClick={closeAllModals} 
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* Update Stage Modal - Dark Theme */}
        {showStageModal && selectedDeal && (
          <ModalOverlay onClose={closeAllModals}>
            <h2 className="text-2xl font-bold text-white mb-4">Update Stage</h2>
            <p className="text-sm text-neutral-400 -mt-2 mb-4">Changing stage for: <span className="font-medium text-white">{selectedDeal.name}</span></p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-300 mb-1">New Stage</label>
              <select
                id="stageSelect"
                defaultValue={selectedDeal.stage}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
              <button 
                onClick={closeAllModals} 
                className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleStageSave} 
                className="px-6 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-semibold rounded-lg transition-all duration-200 border border-indigo-700 shadow-lg"
              >
                Update Stage
              </button>
            </div>
          </ModalOverlay>
        )}

        {/* Assign Owner Modal - Dark Theme */}
        {showOwnerModal && selectedDeal && (
          <ModalOverlay onClose={closeAllModals}>
            <h2 className="text-2xl font-bold text-white mb-4">Assign Owner</h2>
            <p className="text-sm text-neutral-400 -mt-2 mb-4">Changing owner for: <span className="font-medium text-white">{selectedDeal.name}</span></p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-300 mb-1">New Owner</label>
              <select
                id="ownerSelect"
                defaultValue={selectedDeal.owner}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
              >
                {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
              <button 
                onClick={closeAllModals} 
                className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleOwnerSave} 
                className="px-6 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold rounded-lg transition-all duration-200 border border-emerald-700 shadow-lg"
              >
                Assign Owner
              </button>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}