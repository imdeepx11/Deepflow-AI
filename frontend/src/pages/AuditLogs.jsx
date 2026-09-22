import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  useEffect(() => { api.getAuditLogs({search:search||undefined,status:status==='All'?undefined:status}).then(setLogs).catch(console.error); }, [search,status]);
  return <div className="editorial-page">
    <div className="page-head"><div><div className="page-kicker">Governance</div><h1 className="page-title">Audit trail.</h1><p className="page-intro">A chronological record of document actions, AI decisions, workflow changes, and approval events.</p></div><ShieldCheck size={28} color="#8e6b32"/></div>
    <div className="paper-card toolbar-card"><div className="filter-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search actors, documents, actions…"/></div><select className="editorial-select" value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Success</option><option>Warning</option><option>Error</option></select></div>
    <section className="paper-card" style={{marginTop:16,overflow:'hidden'}}><div className="table-wrap"><table className="editorial-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Document</th><th>Workflow</th><th>Status</th><th>Details</th></tr></thead><tbody>{logs.length?logs.map(log=><tr key={log.id}><td>{log.timestamp || '—'}</td><td><strong>{log.user || log.user_name || 'System'}</strong><div className="doc-meta">{log.role || log.user_role || '—'}</div></td><td>{log.action}</td><td>{log.document || log.document_name || '—'}</td><td>{log.workflow || log.workflow_name || '—'}</td><td><span className={`pill ${log.status==='Success'?'pill-approved':log.status==='Warning'?'pill-pending':'pill-rejected'}`}>{log.status || 'Success'}</span></td><td style={{maxWidth:300}}>{log.details || '—'}</td></tr>):<tr><td colSpan="7" style={{padding:32,textAlign:'center',color:'#777'}}>No audit events match the current view.</td></tr>}</tbody></table></div></section>
  </div>;
}
