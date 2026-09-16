import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Cpu, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../api';

export default function Documents({ user, onNavigateToAnalyzer, onOpenUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : undefined);

  useEffect(() => {
    loadDocuments();
  }, [search, docTypeFilter, statusFilter, priorityFilter, user]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments({
        search: search || undefined,
        doc_type: docTypeFilter !== 'All' ? docTypeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        uploaded_by: userName
      });
      setDocuments(data);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (err) {
        alert("Failed to delete document");
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] dark:bg-[#050505] min-h-screen transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">Documents Library</h1>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Manage, analyze, and delete your organization's business documents.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl space-y-3 md:space-y-0 md:flex md:items-center justify-between gap-4 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name or keyword..."
            className="w-full bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] text-xs rounded-lg pl-10 pr-3.5 py-2.5 focus:border-[#00A859] outline-none transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] rounded-lg px-3 py-2 focus:border-[#00A859] outline-none"
          >
            <option value="All">All Types</option>
            <option value="Invoice">Invoice</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Contract">Contract</option>
            <option value="Resume">Resume</option>
            <option value="Loan Application">Loan Application</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] rounded-lg px-3 py-2 focus:border-[#00A859] outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
            <option value="Processed">Processed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] rounded-lg px-3 py-2 focus:border-[#00A859] outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Documents Table with Delete Option */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] dark:bg-[#121212] border-b border-[#E2E8F0] dark:border-[#242424] text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="p-4 pl-6">Document File</th>
                <th className="p-4">Type</th>
                <th className="p-4">Size</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#242424]">
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const confPercent = Math.round((doc.confidence || doc.ai_confidence || 0.94) * 100);
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onNavigateToAnalyzer(doc.id)}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#141414] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 pl-6 font-bold text-[#0F172A] dark:text-[#F5F5F5] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] shrink-0">
                          <FileText className="w-4 h-4 text-[#00A859]" />
                        </div>
                        <div>
                          <span className="text-[#0F172A] dark:text-[#F5F5F5] font-bold block truncate max-w-xs group-hover:text-[#00A859] transition-colors">
                            {doc.original_filename || doc.name}
                          </span>
                          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">ID: #{doc.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#475569] dark:text-[#A1A1AA] px-2.5 py-1 rounded text-[11px] font-semibold">
                          {doc.type || doc.analysis?.document_type || 'General'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[#64748B] dark:text-[#A1A1AA]">{(doc.file_size ? (doc.file_size / 1024).toFixed(1) : 48)} KB</td>
                      <td className="p-4 text-[#0F172A] dark:text-[#F5F5F5] font-medium">{doc.uploaded_by || 'User'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold text-[#0F172A] dark:text-[#F5F5F5]">
                          <span>{confPercent}%</span>
                          <div className="w-12 bg-[#E2E8F0] dark:bg-[#262626] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#00A859] h-full" style={{ width: `${confPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                          doc.priority === 'CRITICAL' || doc.priority === 'Critical' || doc.priority === 'HIGH' || doc.priority === 'High'
                            ? 'bg-[#FEE2E2] dark:bg-[#991B1B]/30 text-[#991B1B] dark:text-[#F87171]'
                            : doc.priority === 'MEDIUM' || doc.priority === 'Medium'
                            ? 'bg-[#FEF3C7] dark:bg-[#92400E]/30 text-[#92400E] dark:text-[#FBBF24]'
                            : 'bg-[#DCFCE7] dark:bg-[#166534]/30 text-[#166534] dark:text-[#4ADE80]'
                        }`}>
                          {doc.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          doc.status === 'Approved' ? 'bg-[#DCFCE7] dark:bg-[#15803D]/20 text-[#15803D] dark:text-[#4ADE80]' :
                          doc.status === 'Pending Approval' ? 'bg-[#FEF9C3] dark:bg-[#854D0E]/20 text-[#854D0E] dark:text-[#FACC15]' :
                          doc.status === 'Under Review' ? 'bg-[#E0F2FE] dark:bg-[#075985]/20 text-[#075985] dark:text-[#38BDF8]' :
                          doc.status === 'Processed' ? 'bg-[#DCFCE7] dark:bg-[#166534]/20 text-[#166534] dark:text-[#4ADE80]' :
                          'bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#475569] dark:text-[#A1A1AA]'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onNavigateToAnalyzer(doc.id); }}
                            className="bg-white dark:bg-[#1E1E1E] hover:bg-[#F1F5F9] dark:hover:bg-[#2A2A2A] border border-[#CBD5E1] dark:border-[#333] text-[#0F172A] dark:text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Cpu className="w-3 h-3 text-[#00A859]" />
                            <span>AI Analyze</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, doc.original_filename || doc.name, e)}
                            title="Delete Document"
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] dark:text-[#A1A1AA] dark:hover:text-[#EF4444] hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
                    No documents found. Click <strong>Upload Document</strong> to add your files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Attribution Note */}
      <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#242424] text-[10px] text-[#94A3B8] dark:text-[#64748B] font-medium">
        Developed by Deepak Gupta
      </div>
    </div>
  );
}
