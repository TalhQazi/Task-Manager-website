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
const STAGE_COLORS = {
  Qualification: 'bg-gray-100 text-gray-700',
  'Needs Analysis': 'bg-blue-100 text-blue-700',
  Proposal: 'bg-indigo-100 text-indigo-700',
  Negotiation: 'bg-amber-100 text-amber-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Closed Lost': 'bg-red-100 text-red-700',
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
      [name]: name === 'value' || name === 'probability' ? Math.max(0, Number(value)) : value
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

  const handleCreateSave = () => {
    if (!validateCreateForm()) return;
    const newId = Math.max(...deals.map(d => d.id), 0) + 1;
    setDeals(prev => [...prev, { ...formData, value: Number(formData.value), probability: Number(formData.probability), id: newId }]);
    closeAllModals();
  };

  const handleStageSave = (newStage) => {
    setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, stage: newStage } : d));
    closeAllModals();
  };

  const handleOwnerSave = (newOwner) => {
    setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, owner: newOwner } : d));
    closeAllModals();
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-1">Track business opportunities, monitor sales stages, and forecast revenue.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + Create Deal
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search deals, companies, or owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[180px]"
        >
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Probability</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Close Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium">No deals found</p>
                      <p className="text-sm">Adjust filters or create a new deal to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{deal.name}</td>
                    <td className="px-6 py-4 text-gray-600">{deal.company}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(deal.value)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-gray-100 text-gray-800'}`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-6 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                        {deal.probability}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(deal.closeDate)}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openStageUpdate(deal)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                        title="Update Stage"
                      >
                        Update Stage
                      </button>
                      <button
                        onClick={() => openOwnerUpdate(deal)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors"
                        title="Assign Owner"
                      >
                        Assign Owner
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <ModalOverlay onClose={closeAllModals}>
          <h2 className="text-xl font-semibold text-gray-900">Create New Deal</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
              <input name="name" value={formData.name} onChange={handleCreateChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., Q3 Enterprise License" />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input name="company" value={formData.company} onChange={handleCreateChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.company ? 'border-red-500' : 'border-gray-300'}`} placeholder="Company name" />
              {formErrors.company && <p className="text-xs text-red-500 mt-1">{formErrors.company}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
                <input type="number" name="value" value={formData.value} onChange={handleCreateChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.value ? 'border-red-500' : 'border-gray-300'}`} placeholder="0" />
                {formErrors.value && <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
                <input type="number" name="probability" value={formData.probability} onChange={handleCreateChange} min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select name="stage" value={formData.stage} onChange={handleCreateChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                <input type="date" name="closeDate" value={formData.closeDate} onChange={handleCreateChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.closeDate ? 'border-red-500' : 'border-gray-300'}`} />
                {formErrors.closeDate && <p className="text-xs text-red-500 mt-1">{formErrors.closeDate}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select name="owner" value={formData.owner} onChange={handleCreateChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeAllModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreateSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Create Deal</button>
          </div>
        </ModalOverlay>
      )}

      {/* Update Stage Modal */}
      {showStageModal && selectedDeal && (
        <ModalOverlay onClose={closeAllModals}>
          <h2 className="text-xl font-semibold text-gray-900">Update Stage</h2>
          <p className="text-sm text-gray-500 mb-2">Changing stage for: <span className="font-medium text-gray-900">{selectedDeal.name}</span></p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Stage</label>
            <select
              id="stageSelect"
              defaultValue={selectedDeal.stage}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeAllModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => handleStageSave(document.getElementById('stageSelect').value)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">Update Stage</button>
          </div>
        </ModalOverlay>
      )}

      {/* Assign Owner Modal */}
      {showOwnerModal && selectedDeal && (
        <ModalOverlay onClose={closeAllModals}>
          <h2 className="text-xl font-semibold text-gray-900">Assign Owner</h2>
          <p className="text-sm text-gray-500 mb-2">Changing owner for: <span className="font-medium text-gray-900">{selectedDeal.name}</span></p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Owner</label>
            <select
              id="ownerSelect"
              defaultValue={selectedDeal.owner}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeAllModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => handleOwnerSave(document.getElementById('ownerSelect').value)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">Assign Owner</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}