import { useState, useMemo, useEffect } from 'react';

// Initial mock data (replace with API fetch later)
const INITIAL_FILES = [
  { id: 1, fileName: 'Q3_Service_Agreement.pdf', type: 'Contract', linkedContact: 'John Doe', linkedDeal: 'Enterprise SaaS License', uploadedBy: 'Alice Johnson', date: '2026-05-10T14:30:00', fileSize: '2.4 MB', fileUrl: '#' },
  { id: 2, fileName: 'TechCorp_Proposal_v2.pdf', type: 'Proposal', linkedContact: 'Jane Smith', linkedDeal: 'Cloud Migration Project', uploadedBy: 'Bob Williams', date: '2026-05-08T09:15:00', fileSize: '1.8 MB', fileUrl: '#' },
  { id: 3, fileName: 'INV-2026-045.pdf', type: 'Invoice', linkedContact: 'Alex Chen', linkedDeal: 'Annual Support Renewal', uploadedBy: 'Carol Davis', date: '2026-05-12T11:00:00', fileSize: '856 KB', fileUrl: '#' },
  { id: 4, fileName: 'Onboarding_Checklist.pdf', type: 'Other', linkedContact: 'Maria Lopez', linkedDeal: '', uploadedBy: 'David Lee', date: '2026-05-05T16:45:00', fileSize: '1.2 MB', fileUrl: '#' },
];

const TYPE_OPTIONS = ['All', 'Contract', 'Proposal', 'Invoice', 'Other'];

// Enhanced type colors for dark theme
const getTypeBadgeClasses = (type) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium";
  switch(type) {
    case 'Contract':
      return `${baseClasses} bg-red-950/50 text-red-300 border border-red-800`;
    case 'Proposal':
      return `${baseClasses} bg-blue-950/50 text-blue-300 border border-blue-800`;
    case 'Invoice':
      return `${baseClasses} bg-emerald-950/50 text-emerald-300 border border-emerald-800`;
    default:
      return `${baseClasses} bg-neutral-800 text-neutral-300 border border-neutral-700`;
  }
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const FileIcon = ({ type, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const icons = {
    Contract: (
      <svg className={`${sizeClasses} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Proposal: (
      <svg className={`${sizeClasses} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Invoice: (
      <svg className={`${sizeClasses} text-emerald-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Other: (
      <svg className={`${sizeClasses} text-neutral-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[type] || icons.Other;
};

export default function CRMFiles() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
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

  // File Statistics
  const fileStats = useMemo(() => {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => {
      const size = parseFloat(f.fileSize) || 0;
      return sum + size;
    }, 0);
    const contractsCount = files.filter(f => f.type === 'Contract').length;
    const proposalsCount = files.filter(f => f.type === 'Proposal').length;
    const invoicesCount = files.filter(f => f.type === 'Invoice').length;
    return { totalFiles, totalSize: totalSize.toFixed(1), contractsCount, proposalsCount, invoicesCount };
  }, [files]);

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
      const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setFormData(prev => ({ 
        ...prev, 
        fileName: file.name, 
        fileUrl: URL.createObjectURL(file),
        fileSize: fileSize
      }));
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
    setFiles(prev => [{ 
      ...formData, 
      id: newId, 
      date: new Date(formData.date).toISOString(),
      fileSize: formData.fileSize || '0 MB'
    }, ...prev]);
    closeModals();
  };

  const handleDownload = (file) => {
    alert(`Downloading: ${file.fileName}\n(Connect to backend file storage in production)`);
  };

  const handleDeleteConfirm = () => {
    setFiles(prev => prev.filter(f => f.id !== targetFileId));
    closeModals();
  };

  // Keyboard Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModals();
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

  const FileCard = ({ file }) => (
    <div 
      className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 hover:border-neutral-700 transition-all duration-200 hover:shadow-xl cursor-pointer group"
      onClick={() => openPreview(file)}
    >
      <div className="flex items-start gap-3 mb-3">
        <FileIcon type={file.type} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors truncate">
            {file.fileName}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">{file.fileSize}</p>
        </div>
        <span className={getTypeBadgeClasses(file.type)}>
          {file.type}
        </span>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-neutral-400">{file.uploadedBy}</span>
        </div>
        {file.linkedContact && (
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-neutral-400 truncate">{file.linkedContact}</span>
          </div>
        )}
        {file.linkedDeal && (
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neutral-400 truncate">{file.linkedDeal}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
          className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
        >
          Download
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); confirmDelete(file.id); }}
          className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
        >
          Delete
        </button>
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
              <h1 className="text-3xl font-bold text-white tracking-tight">Client Documents</h1>
              <p className="text-neutral-400 mt-1 text-sm">Securely store and manage contracts, proposals, invoices, and client attachments.</p>
            </div>
            <button
              onClick={openUpload}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 border border-neutral-700 shadow-lg hover:shadow-neutral-900/50 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
              </svg>
              Upload File
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Files</p>
            <p className="text-2xl font-bold text-white mt-1">{fileStats.totalFiles}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Size</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{fileStats.totalSize} MB</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Contracts</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{fileStats.contractsCount}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Proposals</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{fileStats.proposalsCount}</p>
          </div>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Invoices</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{fileStats.invoicesCount}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files, contacts, deals, or uploaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 outline-none transition-all duration-200 text-white placeholder-neutral-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-600 outline-none text-white min-w-[180px]"
              >
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'table' ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Files Display */}
        {viewMode === 'table' ? (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Linked Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Linked Deal</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Uploaded By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <p className="font-medium text-neutral-300">No files found</p>
                          <p className="text-sm text-neutral-500">Adjust filters or upload a new document.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-neutral-800/50 transition-colors duration-150 cursor-pointer" onClick={() => openPreview(file)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon type={file.type} size="sm" />
                            <span className="font-medium text-white truncate max-w-[200px]" title={file.fileName}>{file.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getTypeBadgeClasses(file.type)}>
                            {file.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-300">{file.linkedContact || '—'}</td>
                        <td className="px-6 py-4 text-neutral-300">{file.linkedDeal || '—'}</td>
                        <td className="px-6 py-4 text-neutral-300">{file.uploadedBy}</td>
                        <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{formatDate(file.date)}</td>
                        <td className="px-6 py-4 text-sm text-neutral-400">{file.fileSize || '—'}</td>
                        <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleDownload(file)} 
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                            title="Download File"
                          >
                            Download
                          </button>
                          <button 
                            onClick={() => confirmDelete(file.id)} 
                            className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                            title="Delete File"
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFiles.length === 0 ? (
              <div className="col-span-full bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
                <svg className="w-12 h-12 text-neutral-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="font-medium text-neutral-300">No files found</p>
                <p className="text-sm text-neutral-500">Adjust filters or upload a new document.</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ModalOverlay onClose={closeModals}>
            <form onSubmit={(e) => { e.preventDefault(); handleUploadSave(); }}>
              <h2 className="text-2xl font-bold text-white mb-4">Upload Document</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-neutral-700 rounded-lg p-4 text-center hover:bg-neutral-800 transition-colors relative bg-neutral-800/30">
                  <input
                    type="file"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="mx-auto h-10 w-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
                    </svg>
                    <p className="text-sm text-neutral-400">Click to select or drag file here</p>
                    <p className="text-xs text-neutral-500">{formData.fileName || 'PDF, DOCX, XLSX, PNG, JPG'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">File Name *</label>
                  <input 
                    type="text"
                    name="fileName" 
                    value={formData.fileName} 
                    onChange={handleInputChange} 
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.fileName ? 'border-red-700' : 'border-neutral-700'
                    }`} 
                    placeholder="Auto-filled or edit manually" 
                  />
                  {formErrors.fileName && <p className="text-xs text-red-400 mt-1">{formErrors.fileName}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Type</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white"
                    >
                      {TYPE_OPTIONS.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Upload Date</label>
                    <input 
                      type="date" 
                      name="date" 
                      value={formData.date} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Linked Contact</label>
                  <input 
                    type="text"
                    name="linkedContact" 
                    value={formData.linkedContact} 
                    onChange={handleInputChange} 
                    className={`w-full px-3 py-2.5 bg-neutral-800 border rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500 ${
                      formErrors.linkedContact ? 'border-red-700' : 'border-neutral-700'
                    }`} 
                    placeholder="e.g., John Doe" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Linked Deal</label>
                  <input 
                    type="text"
                    name="linkedDeal" 
                    value={formData.linkedDeal} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500" 
                    placeholder="e.g., Q3 Enterprise License" 
                  />
                  {formErrors.linkedContact && <p className="text-xs text-red-400 mt-1">{formErrors.linkedContact}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Uploaded By</label>
                  <input 
                    type="text"
                    name="uploadedBy" 
                    value={formData.uploadedBy} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-neutral-600 text-white placeholder-neutral-500" 
                    placeholder="Current user" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
                <button 
                  type="button"
                  onClick={closeModals} 
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-neutral-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-200 border border-neutral-700 shadow-lg"
                >
                  Upload File
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedFile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModals}>
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">File Preview</h2>
                <button 
                  onClick={() => handleDownload(selectedFile)} 
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Download
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <FileIcon type={selectedFile.type} />
                  <div className="w-full h-32 bg-neutral-950 border border-dashed border-neutral-700 rounded flex items-center justify-center text-neutral-500 text-sm">
                    Document preview will render here
                  </div>
                  <p className="font-medium text-white">{selectedFile.fileName}</p>
                  <p className="text-xs text-neutral-500">{selectedFile.fileSize || '0 MB'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Type</p>
                    <p className="font-medium text-white mt-0.5">{selectedFile.type}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Uploaded</p>
                    <p className="font-medium text-white mt-0.5">{formatDate(selectedFile.date)}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Contact</p>
                    <p className="font-medium text-white mt-0.5">{selectedFile.linkedContact || '—'}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-500">Deal</p>
                    <p className="font-medium text-white mt-0.5">{selectedFile.linkedDeal || '—'}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800 col-span-2">
                    <p className="text-xs text-neutral-500">Uploaded By</p>
                    <p className="font-medium text-white mt-0.5">{selectedFile.uploadedBy}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => { closeModals(); confirmDelete(selectedFile.id); }}
                  className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-all duration-200 border border-red-700"
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <ModalOverlay onClose={closeModals}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-950/50 border border-red-800 mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Delete File?</h3>
              <p className="text-sm text-neutral-400 mb-6">This action cannot be undone. The document will be permanently removed from storage.</p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={closeModals} 
                  className="px-5 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-neutral-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm} 
                  className="px-5 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-all duration-200 border border-red-700 shadow-lg"
                >
                  Delete File
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}