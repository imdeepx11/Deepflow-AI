import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { api } from '../api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadLogs();
  }, [search, userFilter, statusFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        search: search || undefined,
        user_name: userFilter !== 'All' ? userFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error("Audit logs load error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
        <p className="text-xs text-[#A1A1AA]">Immutable enterprise compliance trail for every document action, AI decision, and user signoff.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0D0D0D] border border-[#242424] p-4 rounded-xl space-y-3 md:space-y-0 md:flex md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by document, user, or details..."
            className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#00C853] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="bg-[#121212] border border-[#242424] text-white rounded-lg px-3 py-2 focus:border-[#00C853] outline-none"
          >
            <option value="All">All Actors</option>
            <option value="Admin">Admin</option>
            <option value="AI Engine">AI Engine</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Deepak Gupta">Deepak Gupta</option>
            <option value="Priya Nair">Priya Nair</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#242424] text-white rounded-lg px-3 py-2 focus:border-[#00C853] outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A1A1AA]">
            <thead className="bg-[#121212] text-[#A1A1AA] uppercase tracking-wider font-semibold border-b border-[#242424]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor / User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Document</th>
                <th className="p-4">Workflow</th>
                <th className="p-4">Status</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#121212]/50 transition-colors">
                  <td className="p-4 font-mono text-[#A1A1AA] whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-4">
                    <span className={`font-semibold ${log.user === 'AI Engine' ? 'text-[#00C853]' : 'text-white'}`}>
                      {log.user}
                    </span>
                    <span className="text-[10px] text-[#A1A1AA] block font-mono">{log.role}</span>
                  </td>
                  <td className="p-4 font-semibold text-white">{log.action}</td>
                  <td className="p-4">
                    <span className="bg-[#121212] border border-[#242424] text-[#F5F5F5] px-2 py-0.5 rounded text-[11px]">
                      {log.document}
                    </span>
                  </td>
                  <td className="p-4 text-[#A1A1AA]">{log.workflow}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'Success' ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30' :
                      log.status === 'Warning' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' :
                      'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#A1A1AA] max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
