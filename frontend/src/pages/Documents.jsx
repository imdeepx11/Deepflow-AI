import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, Filter, Search, Trash2, Upload } from 'lucide-react';
import { api } from '../api';

const STATUS_TABS = ['All', 'Pending Approval', 'Approved', 'Under Review', 'Rejected'];

export default function Documents({ user, onNavigateToAnalyzer, onOpenUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [type, setType] = useState('All');
  const [priority, setPriority] = useState('All');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getDocuments({
          search: search || undefined,
          status: status !== 'All' ? status : undefined,
          doc_type: type !== 'All' ? type : undefined,
          priority: priority !== 'All' ? priority : undefined,
        });

        setDocuments(data);
      } catch (error) {
        console.error('Documents load error:', error);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 180);
    return () => clearTimeout(timer);
  }, [search, status, type, priority, user]);

  const types = useMemo(() => ['All', ...new Set(documents.map((d) => d.analysis?.document_type).filter(Boolean))], [documents]);

  const remove = async (event, id, name) => {
    event.stopPropagation();
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await api.deleteDocument(id);
      setDocuments((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  return (
    <div className="editorial-page">
      <div className="page-head">
        <div><div className="page-kicker">Document library</div><h1 className="page-title">Your documents.</h1><p className="page-intro">Search, filter, review, and route every file through a single calm workspace.</p></div>
        <button className="primary-btn" onClick={onOpenUpload}><Upload size={14}/> Upload document</button>
      </div>

      <div className="paper-card toolbar-card">
        <div className="filter-search"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filenames or keywords…" /></div>
        <div className="tab-row">{STATUS_TABS.map((item) => <button key={item} className={`tab-btn ${status === item ? 'active' : ''}`} onClick={() => setStatus(item)}>{item === 'Pending Approval' ? 'Pending' : item}</button>)}</div>
        <select className="editorial-select" value={type} onChange={(e) => setType(e.target.value)}><option>All</option>{types.filter((x) => x !== 'All').map((x) => <option key={x}>{x}</option>)}</select>
        <select className="editorial-select" value={priority} onChange={(e) => setPriority(e.target.value)}><option>All</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
        <button className="ghost-btn" type="button"><Filter size={14}/></button>
      </div>

      <section className="paper-card" style={{marginTop:16, overflow:'hidden'}}>
        <div className="section-row card-padding" style={{paddingBottom:12}}><div><div className="card-title">All files</div><div className="card-subtitle">{loading ? 'Loading…' : `${documents.length} documents in this view.`}</div></div><span style={{fontSize:10,color:'#7c7c75'}}>Firestore-backed library</span></div>
        <div className="table-wrap">
          <table className="editorial-table"><thead><tr><th>Name</th><th>Type</th><th>Uploaded by</th><th>Confidence</th><th>Priority</th><th>Status</th><th>Date</th><th/></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={{padding:30}}>Loading documents…</td></tr> : documents.length ? documents.map((doc) => {
                const confidence = Math.round((doc.confidence || 0) * 100);
                return <tr key={doc.id} onClick={() => onNavigateToAnalyzer(doc.id)} style={{cursor:'pointer'}}>
                  <td><div className="doc-name-cell"><span className="file-icon"><FileText size={14}/></span><span><span className="doc-name">{doc.original_filename || doc.filename}</span><span className="doc-meta">#{String(doc.id).slice(0,10)} · {doc.file_type || 'FILE'}</span></span></div></td>
                  <td>{doc.analysis?.document_type || 'General'}</td>
                  <td>{doc.uploaded_by || 'Admin'}</td>
                  <td>{confidence ? `${confidence}%` : '—'}</td>
                  <td><span className={`pill ${String(doc.priority).toUpperCase() === 'HIGH' || String(doc.priority).toUpperCase() === 'CRITICAL' ? 'pill-high' : String(doc.priority).toUpperCase() === 'MEDIUM' ? 'pill-medium' : 'pill-low'}`}>{doc.priority || 'LOW'}</span></td>
                  <td><span className={`pill ${doc.status==='Approved'?'pill-approved':doc.status==='Pending Approval'?'pill-pending':doc.status==='Under Review'?'pill-review':'pill-rejected'}`}>{doc.status}</span></td>
                  <td>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}</td>
                  <td><button className="ghost-btn" style={{width:34,height:34,padding:0,border:'0'}} onClick={(event) => remove(event, doc.id, doc.original_filename || 'document')} title="Delete"><Trash2 size={13}/></button></td>
                </tr>;
              }) : <tr><td colSpan="8" style={{padding:34,textAlign:'center',color:'#777'}}>No documents match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><button className="section-link" onClick={onOpenUpload}>Need to add another file? <ArrowRight size={12}/></button></div>
    </div>
  );
}
