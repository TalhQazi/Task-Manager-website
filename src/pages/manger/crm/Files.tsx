import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_FILES = [
  { id: 1, fileName: 'Q3_Service_Agreement.pdf', type: 'Contract', linkedContact: 'John Doe', linkedDeal: 'Enterprise SaaS License', uploadedBy: 'Alice Johnson', date: '2026-05-10T14:30:00', fileUrl: '#' },
  { id: 2, fileName: 'TechCorp_Proposal_v2.pdf', type: 'Proposal', linkedContact: 'Jane Smith', linkedDeal: 'Cloud Migration Project', uploadedBy: 'Bob Williams', date: '2026-05-08T09:15:00', fileUrl: '#' },
  { id: 3, fileName: 'INV-2026-045.pdf', type: 'Invoice', linkedContact: 'Alex Chen', linkedDeal: 'Annual Support Renewal', uploadedBy: 'Carol Davis', date: '2026-05-12T11:00:00', fileUrl: '#' },
  { id: 4, fileName: 'Onboarding_Checklist.pdf', type: 'Other', linkedContact: 'Maria Lopez', linkedDeal: '', uploadedBy: 'David Lee', date: '2026-05-05T16:45:00', fileUrl: '#' },
];

const TYPE_OPTIONS = ['All', 'Contract', 'Proposal', 'Invoice', 'Other'];
const TYPE_COLORS = {
  Contract: 'bg-red-100 text-red-800',
  Proposal: 'bg-blue-100 text-blue-800',
  Invoice: 'bg-emerald-100 text-emerald-800',
  Other: 'bg-gray-100 text-gray-800',
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const FileIcon = ({ type }) => {
  const icons = {
    Contract: <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Proposal: <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Invoice: <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Other: <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  };
  return icons[type] || icons.Other;
};

export default function CRMFiles() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetFileId, setTargetFileId] = useState(null);
  
  const [formData, setFormData] = useState({
    fileName: '', type: 'Contract', linkedContact: '', linkedDeal: '', uploadedBy: 'Current User', date: new Date().toISOString().slice(0, 10), fileUrl: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter & Search Logic
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        file.fileName.toLowerCase().includes(q) ||
        file.linkedContact.toLowerCase().includes(q) ||
        file.linkedDeal.toLowerCase().includes(q) ||
        file.uploadedBy.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || file.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, typeFilter]);

  // Modal Handlers
  const openUpload = () => {
    setFormData({ fileName: '', type: 'Contract', linkedContact: '', linkedDeal: '', uploadedBy: 'Current User', date: new Date().toISOString().slice(0, 10), fileUrl: '' });
    setFormErrors({});
    setShowUploadModal(true);
  };

  const openPreview = (file) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const confirmDelete = (id) => {
    setTargetFileId(id);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowUploadModal(false);
    setShowPreviewModal(false);
    setShowDeleteModal(false);
    setTargetFileId(null);
    setSelectedFile(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fileName.trim()) errors.fileName = 'File name is required';
    if (!formData.linkedContact.trim() && !formData.linkedDeal.trim()) {
      errors.linkedContact = 'Link to at least a Contact or a Deal';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUploadSave = () => {
    if (!validateForm()) return;
    const newId = Math.max(...files.map(f => f.id), 0) + 1;
    setFiles(prev => [{ ...formData, id: newId, date: new Date(formData.date).toISOString() }, ...prev]);
    closeModals();
  };

  const handleDownload = (file) => {
    // In production: window.open(file.fileUrl, '_blank') or trigger backend download endpoint
    alert(`Downloading: ${file.fileName}\n(Connect to backend file storage in production)`);
  };

  const handleDeleteConfirm = () => {
    setFiles(prev => prev.filter(f => f.id !== targetFileId));
    closeModals();
  };

  // Keyboard & Click Outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModals();
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
          <h1 className="text-2xl font-bold text-gray-900">Client Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Securely store and manage contracts, proposals, invoices, and client attachments.</p>
        </div>
        <button
          onClick={openUpload}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + Upload File
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
            placeholder="Search files, contacts, deals, or uploaders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[180px]"
        >
          {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Contact</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Deal</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="font-medium">No files found</p>
                      <p className="text-sm">Adjust filters or upload a new document.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.type} />
                        <span className="font-medium text-gray-900 truncate max-w-[200px]" title={file.fileName}>{file.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[file.type] || TYPE_COLORS.Other}`}>
                        {file.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{file.linkedContact || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{file.linkedDeal || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{file.uploadedBy}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(file.date)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openPreview(file)} className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors" title="Preview File">Preview</button>
                      <button onClick={() => handleDownload(file)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors" title="Download File">Download</button>
                      <button onClick={() => confirmDelete(file.id)} className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors" title="Delete File">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ModalOverlay onClose={closeModals}>
          <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" /></svg>
                <p className="text-sm text-gray-600">Click to select or drag file here</p>
                <p className="text-xs text-gray-400">{formData.fileName || 'PDF, DOCX, XLSX, PNG'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <input name="fileName" value={formData.fileName} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.fileName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Auto-filled or edit manually" />
              {formErrors.fileName && <p className="text-xs text-red-500 mt-1">{formErrors.fileName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {TYPE_OPTIONS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Contact</label>
              <input name="linkedContact" value={formData.linkedContact} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.linkedContact ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Deal</label>
              <input name="linkedDeal" value={formData.linkedDeal} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Q3 Enterprise License" />
              {formErrors.linkedContact && <p className="text-xs text-red-500 mt-1">{formErrors.linkedContact}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
              <input name="uploadedBy" value={formData.uploadedBy} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Current user" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">Cancel</button>
            <button onClick={handleUploadSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Upload File</button>
          </div>
        </ModalOverlay>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedFile && (
        <ModalOverlay onClose={closeModals}>
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-900">File Preview</h2>
            <button onClick={() => handleDownload(selectedFile)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Download</button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
            <FileIcon type={selectedFile.type} />
            <div className="w-full h-32 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
              Document preview will render here
            </div>
            <p className="font-medium text-gray-800">{selectedFile.fileName}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded"><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedFile.type}</span></div>
            <div className="bg-gray-50 p-2 rounded"><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedFile.linkedContact || '—'}</span></div>
            <div className="bg-gray-50 p-2 rounded"><span className="text-gray-500">Deal:</span> <span className="font-medium">{selectedFile.linkedDeal || '—'}</span></div>
            <div className="bg-gray-50 p-2 rounded"><span className="text-gray-500">Uploaded:</span> <span className="font-medium">{formatDate(selectedFile.date)}</span></div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={closeModals} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay onClose={closeModals}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Delete File?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The document will be permanently removed from storage.</p>
            <div className="flex justify-center gap-3">
              <button onClick={closeModals} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">Delete File</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}