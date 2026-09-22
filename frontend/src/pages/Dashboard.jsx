import React, { useEffect, useState } from 'react';
import { ArrowRight, FileText, Flag, Gauge, Timer, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';

const PIE_COLORS = ['#7c8aa5', '#a9814c', '#5a6178', '#6b2a32'];

export default function Dashboard({ user, onNavigateToAnalyzer, onNavigateToDocuments }) {
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
        const [a, d] = await Promise.all([api.getAnalytics(days), api.getDocuments()]);
        setAnalytics(a);
        setDocuments(d.slice(0, 7));
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  useEffect(() => {
    const syncClock = () => setCurrentHour(new Date().getHours());
    syncClock();
    const interval = window.setInterval(syncClock, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const name = user?.name || user?.email?.split('@')[0] || 'Administrator';
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const k = analytics?.kpis || {};
  const processed = k.documents_processed ?? 0;
  const pending = k.pending_approval ?? 0;
  const flagged = k.high_priority ?? 0;
  const automation = k.automation_rate ?? '74%';
  const sla = k.avg_processing_time || k.avg_sla || '2.4 min';
  const status = analytics?.status_distribution || [];
  const rangeData = analytics?.over_time?.[range] || analytics?.over_time?.['30d'] || [];

  const ledgerRows = [
    { label: 'Documents Processed', value: processed, change: k.documents_change || '+18.4%', icon: FileText },
    { label: 'Pending Approval', value: pending, change: k.pending_change || '-3.2%', negative: true, icon: Timer },
    { label: 'Flagged for Risk', value: flagged, change: k.high_priority_change || '+2', icon: Flag },
    { label: 'Automation Rate', value: String(automation).includes('%') ? automation : `${automation}%`, change: k.automation_change || '+5.8%', icon: Gauge },
    { label: 'Avg. Processing SLA', value: sla, change: k.processing_time_change || '-42 sec', icon: TrendingUp }
  ];

  return (
    <div className="editorial-page ledger-dashboard">
      <section className="ledger-hero">
        <div>
          <div className="page-kicker">Welcome back</div>
          <h1 className="ledger-hero-title">{greeting}, {name}</h1>
          <p className="page-intro">Here's what's happening across your document workflows.</p>
        </div>
      </section>

      <section className="ledger-overview">
        <article className="ledger-stamp-card">
          <div>
            <div className="stamp-label">RISK REGISTER — TODAY</div>
            <div className="stamp-circle">
              <strong>{flagged}</strong>
              <span>FLAGGED</span>
            </div>
          </div>
          <p>Risk score threshold exceeded on <strong>{flagged} document{flagged === 1 ? '' : 's'}</strong>. Review the queue before the next approval cycle.</p>
        </article>

        <article className="ledger-list-card">
          {ledgerRows.map(({ label, value, change, negative, icon: Icon }) => (
            <div className="ledger-row" key={label}>
              <div className="ledger-row-label"><Icon size={15} /><span>{label}</span></div>
              <div className="ledger-row-right">
                <span className="ledger-value">{value}</span>
                <span className={`ledger-delta ${negative ? 'negative' : ''}`}>{change}</span>
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="ledger-chart-grid">
        <article className="ledger-panel">
          <div className="section-row ledger-panel-head">
            <div>
              <h2 className="card-title">Documents Processed Over Time</h2>
              <p className="card-subtitle">Volume trends across automated ingestion pipelines</p>
            </div>
            <div className="tab-row">
              {['7d', '30d', '90d'].map((item) => (
                <button key={item} className={`tab-btn ${range === item ? 'active' : ''}`} onClick={() => setRange(item)}>{item.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="ledger-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rangeData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 10, color: 'var(--ink)' }} />
                <defs><linearGradient id="ledgerArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3e5744" stopOpacity={0.22} /><stop offset="100%" stopColor="#3e5744" stopOpacity={0.01} /></linearGradient></defs>
                <Area type="monotone" dataKey="processed" stroke="#1d2233" strokeWidth={1.7} fill="url(#ledgerArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ledger-panel ledger-donut-panel">
          <h2 className="card-title">Status Breakdown</h2>
          <p className="card-subtitle">Current distribution across lifecycle states</p>
          <div className="ledger-donut-content">
            <div className="ledger-donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={status} dataKey="count" innerRadius={43} outerRadius={61} paddingAngle={2}>
                    {status.slice(0, 4).map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="ledger-donut-center"><strong>{processed}</strong><span>TOTAL</span></div>
            </div>
            <div className="ledger-tally">
              {status.slice(0, 4).map((item, idx) => (
                <div className="ledger-tally-row" key={item.name}>
                  <span><i style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} /> {item.name}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="ledger-table-panel">
        <div className="section-row">
          <div><h2 className="card-title">Recent Ingested Documents</h2><p className="card-subtitle">The latest files moving through DeepFlow AI.</p></div>
          <button className="section-link" onClick={onNavigateToDocuments}>View all <ArrowRight size={12} /></button>
        </div>
        <div className="table-wrap">
          <table className="editorial-table">
            <thead><tr><th>Document</th><th>Ingested</th><th>Risk Score</th><th>Status</th><th>Type</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6">Loading documents…</td></tr> : documents.map((doc) => {
                const risk = doc.analysis?.risk_score ?? doc.risk_score ?? '—';
                const statusClass = doc.status === 'Approved' ? 'pill-approved' : doc.status === 'Pending Approval' ? 'pill-pending' : doc.status === 'Under Review' ? 'pill-review' : 'pill-rejected';
                return (
                  <tr key={doc.id} onClick={() => onNavigateToAnalyzer(doc.id)} style={{ cursor: 'pointer' }}>
                    <td><div className="doc-name-cell"><span className="file-icon"><FileText size={13} /></span><span><span className="doc-name">{doc.original_filename || doc.filename}</span><span className="doc-meta">#{String(doc.id).slice(0, 8)}</span></span></div></td>
                    <td>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}</td>
                    <td>{risk}</td>
                    <td><span className={`pill ${statusClass}`}>{doc.status || 'Uploaded'}</span></td>
                    <td>{doc.analysis?.document_type || doc.file_type || 'General'}</td>
                    <td><ArrowRight size={13} color="var(--muted)" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ledger-lower-grid">
        <article className="ledger-note-card">
          <div className="page-kicker">AI insights</div>
          <h2 className="card-title">What needs attention</h2>
          <div className="insight-list compact">
            {(analytics?.process_insights || []).slice(0, 3).map((item) => <div className="insight-item" key={item.id}><span className="insight-label">Action required</span><strong>{item.title}</strong><p>{item.observation}</p></div>)}
            {!analytics?.process_insights?.length && <div className="insight-item"><span className="insight-label">System note</span><strong>Your document pipeline is ready.</strong><p>Upload a document to generate the first live insight.</p></div>}
          </div>
        </article>
        <article className="ledger-note-card ledger-quote">
          <div className="page-kicker">DeepFlow / editorial note</div>
          <blockquote>“Technology should feel human — clear enough to trust, powerful enough to matter.”</blockquote>
          <span>DeepFlow AI</span>
        </article>
      </section>
    </div>
  );
}
