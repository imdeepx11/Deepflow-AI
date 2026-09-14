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

export default function Documents({ onNavigateToAnalyzer, onOpenUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    loadDocuments();
  }, [search, docTypeFilter, statusFilter, priorityFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments({
        search: search || undefined,
        doc_type: docTypeFilter !== 'All' ? docTypeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
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
        loadDocuments();
      } catch (err) {
        alert("Failed to delete document");
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
          <p className="text-xs text-[#86EFAC]">Manage and analyze your organization's business documents.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-[#00C853] hover:bg-[#22C55E] text-black font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,200,83,0.3)]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-[#0D0D0D] border border-[#242424] p-4 rounded-xl space-y-3 md:space-y-0 md:flex md:items-center justify-between gap-4 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name or keyword..."
            className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#00C853] outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="bg-[#121212] border border-[#242424] text-white rounded-lg px-3 py-2 focus:border-[#00C853] outline-none"
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
            className="bg-[#121212] border border-[#242424] text-white rounded-lg px-3 py-2 focus:border-[#00C853] outline-none"
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
            className="bg-[#121212] border border-[#242424] text-white rounded-lg px-3 py-2 focus:border-[#00C853] outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A1A1AA]">
            <thead className="bg-[#121212] text-[#A1A1AA] uppercase tracking-wider font-semibold border-b border-[#242424]">
              <tr>
                <th className="p-4">Document File</th>
                <th className="p-4">Type</th>
                <th className="p-4">Size</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {documents.map((doc) => {
                const confPercent = Math.round((doc.confidence || 0.94) * 100);
                return (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigateToAnalyzer(doc.id)}
                    className="hover:bg-[#121212] cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-white font-semibold block truncate max-w-xs group-hover:text-[#86EFAC] transition-colors">
                          {doc.original_filename}
                        </span>
                        <span className="text-[10px] text-[#A1A1AA]">ID: #{doc.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#121212] border border-[#242424] text-white px-2.5 py-1 rounded text-[11px] font-mono">
                        {doc.analysis?.document_type || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#A1A1AA]">{(doc.file_size / 1024).toFixed(1)} KB</td>
                    <td className="p-4 text-white font-medium">{doc.uploaded_by}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-mono text-white">
                        <div className="w-12 bg-[#121212] rounded-full h-1.5 border border-[#242424] overflow-hidden">
                          <div className="bg-[#00C853] h-full" style={{ width: `${confPercent}%` }} />
                        </div>
                        <span className="font-bold">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                        doc.priority === 'CRITICAL' || doc.priority === 'Critical' ? 'bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444]' :
                        doc.priority === 'HIGH' || doc.priority === 'High' ? 'bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B]' :
                        'bg-[#00C853]/20 border border-[#00C853]/40 text-[#86EFAC]'
                      }`}>
                        {doc.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        doc.status === 'Approved' ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30' :
                        doc.status === 'Pending Approval' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' :
                        doc.status === 'Under Review' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        doc.status === 'Rejected' ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' :
                        'bg-[#121212] text-[#A1A1AA] border border-[#242424]'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToAnalyzer(doc.id); }}
                          className="bg-[#121212] hover:bg-[#00C853] hover:text-black border border-[#00C853]/40 text-[#86EFAC] font-bold px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>AI Analyze</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(doc.id, doc.original_filename, e)}
                          className="p-1 text-[#A1A1AA] hover:text-[#EF4444] hover:bg-[#121212] rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
