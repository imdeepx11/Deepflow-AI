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
    <div className="p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] dark:bg-[#050505] min-h-screen text-[#0F172A] dark:text-[#F5F5F5] transition-colors">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">Audit Logs</h1>
        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Immutable enterprise compliance trail for every document action, AI decision, and user signoff.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl space-y-3 md:space-y-0 md:flex md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by document, user, or details..."
            className="w-full bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#00A859] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg px-3 py-2 focus:border-[#00A859] outline-none"
          >
            <option value="All">All Actors</option>
            <option value="Admin">Admin</option>
            <option value="AI Engine">AI Engine</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Alex Morgan">Alex Morgan</option>
            <option value="Sarah Chen">Sarah Chen</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg px-3 py-2 focus:border-[#00A859] outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#64748B] dark:text-[#A1A1AA]">
            <thead className="bg-[#F8FAFC] dark:bg-[#121212] text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-bold border-b border-[#E2E8F0] dark:border-[#242424] text-[10px]">
              <tr>
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Actor / User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Document</th>
                <th className="p-4">Workflow</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#242424]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#121212]/50 transition-colors">
                    <td className="p-4 pl-6 font-mono text-[#64748B] dark:text-[#A1A1AA] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <span className={`font-bold ${log.user === 'AI Engine' ? 'text-[#00A859]' : 'text-[#0F172A] dark:text-white'}`}>
                        {log.user}
                      </span>
                      <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] block font-mono">{log.role}</span>
                    </td>
                    <td className="p-4 font-bold text-[#0F172A] dark:text-white">{log.action}</td>
                    <td className="p-4">
                      <span className="bg-[#F1F5F9] dark:bg-[#121212] border border-[#CBD5E1] dark:border-[#242424] text-[#0F172A] dark:text-[#F5F5F5] px-2 py-0.5 rounded text-[11px] font-medium">
                        {log.document}
                      </span>
                    </td>
                    <td className="p-4 text-[#64748B] dark:text-[#A1A1AA]">{log.workflow}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'Success' ? 'bg-[#DCFCE7] dark:bg-[#00A859]/15 text-[#15803D] dark:text-[#00A859] border border-[#86EFAC] dark:border-[#00A859]/30' :
                        log.status === 'Warning' ? 'bg-[#FEF3C7] dark:bg-[#F59E0B]/15 text-[#92400E] dark:text-[#F59E0B] border border-[#FCD34D] dark:border-[#F59E0B]/30' :
                        'bg-[#FEE2E2] dark:bg-[#EF4444]/15 text-[#991B1B] dark:text-[#EF4444] border border-[#FCA5A5] dark:border-[#EF4444]/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-[#64748B] dark:text-[#A1A1AA] max-w-xs truncate">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
                    No audit records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
