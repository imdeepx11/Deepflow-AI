import React, { useEffect, useState } from 'react';
import { ArrowRight, FileText, Flag, Gauge, Play, Plus, Shield, Sparkles, Timer, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';

const PIE_COLORS = ['#2e6450', '#5b8a73', '#b08a48', '#b9685e', '#9a9b8f'];

export default function Dashboard({ user, onNavigateToAnalyzer, onNavigateToDocuments, onOpenUpload }) {
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
        const [a, d] = await Promise.all([api.getAnalytics(days), api.getDocuments()]);
        setAnalytics(a);
        setDocuments(d.slice(0, 6));
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const name = user?.name || user?.email?.split('@')[0] || 'Administrator';
  const firstName = name.split(' ')[0];
  const k = analytics?.kpis || {};
  const processed = k.documents_processed ?? 0;
  const pending = k.pending_approval ?? 0;
  const high = k.high_priority ?? 0;
  const automation = k.automation_rate ?? '74%';
  const sla = k.avg_processing_time || k.avg_sla || '2.4 min';
  const status = analytics?.status_distribution || [];
  const rangeData = analytics?.over_time?.[range] || analytics?.over_time?.['30d'] || [];

  const cards = [
    { label: 'Total Documents', value: processed, change: k.documents_change || '+18.4%', icon: FileText },
    { label: 'Pending Approval', value: pending, change: k.pending_change || '-3.2%', icon: Timer },
    { label: 'Flagged for Risk', value: high, change: k.high_priority_change || '+2', icon: Flag },
    { label: 'Automation Rate', value: String(automation).includes('%') ? automation : `${automation}%`, change: k.automation_change || '+5.8%', icon: Gauge }
  ];

  return (
    <div className="editorial-page">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="page-kicker">Welcome back</div>
          <h1 className="hero-title">Turn documents<br />into decisions.</h1>
          <p className="hero-text">AI-powered document intelligence for faster workflows, clearer decisions, and less manual work across the enterprise.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={onOpenUpload}><Plus size={14} />&nbsp; Upload Document</button>
            <button className="secondary-btn" onClick={onNavigateToDocuments}>Browse documents <ArrowRight size={13} /></button>
          </div>
        </div>
        <div className="editorial-hero-art">
          <div className="hero-art-copy">
            <div className="page-kicker">DeepFlow editorial</div>
            <h2>Automate.<br />Understand.<br /><em>Move forward.</em></h2>
            <p>Smarter document workflows for teams who care about speed, control, and context.</p>
          </div>
          <div className="hero-art-list">AI<br />Workflows<br />Analytics<br />Security</div>
          <div className="hero-art-shape" />
          <div className="hero-art-rule" />
        </div>
      </section>

      <section className="kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="paper-card kpi-card" key={card.label}>
              <div className="section-row"><Icon size={17} color="#8e6b32" /><span className="kpi-label">{card.label}</span></div>
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-meta"><span className="kpi-change">↗ {card.change}</span><span>vs prior period</span></div>
            </article>
          );
        })}
        <article className="paper-card kpi-card">
          <div className="section-row"><TrendingUp size={17} color="#8e6b32" /><span className="kpi-label">Avg processing SLA</span></div>
          <div className="kpi-value">{sla}</div>
          <div className="kpi-meta"><span className="kpi-change">↘ {k.processing_time_change || '-42 sec'}</span><span>turnaround time</span></div>
        </article>
      </section>

      <section className="bento-grid">
        <article className="paper-card chart-card bento-wide">
          <div className="section-row">
            <div><h2 className="card-title">Processing volume</h2><p className="card-subtitle">Documents moving through automated ingestion pipelines.</p></div>
            <div className="tab-row">
              {['7d','30d','90d'].map((item) => <button className={`tab-btn ${range===item?'active':''}`} key={item} onClick={() => setRange(item)}>{item.toUpperCase()}</button>)}
            </div>
          </div>
          <div style={{height:255, marginTop:10}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rangeData} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}>
                <defs><linearGradient id="editorialFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2e6450" stopOpacity={0.32}/><stop offset="100%" stopColor="#2e6450" stopOpacity={0.02}/></linearGradient></defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill:'#8a8c84' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill:'#8a8c84' }} />
                <Tooltip contentStyle={{ background:'#fffdf8', border:'1px solid #d9d1c3', borderRadius:12, fontSize:10 }} />
                <Area type="monotone" dataKey="processed" stroke="#2e6450" strokeWidth={2.5} fill="url(#editorialFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="status-card paper-card">
          <div className="section-row"><div><h2 className="card-title">Document status</h2><p className="card-subtitle">Latest lifecycle distribution.</p></div><Shield size={18} color="#d4b875" /></div>
          <div className="status-visual">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={status} dataKey="count" innerRadius={47} outerRadius={68} paddingAngle={3}>{status.map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{processed}</strong><span>Total</span></div>
            </div>
            <div className="legend-list">
              {status.slice(0,4).map((item, idx) => <div className="legend-item" key={item.name}><span className="legend-main"><span className="legend-dot" style={{background:PIE_COLORS[idx % PIE_COLORS.length]}} />{item.name}</span><strong>{item.count}</strong></div>)}
            </div>
          </div>
        </article>

        <article className="paper-card docs-card bento-wide card-padding">
          <div className="section-row" style={{marginBottom:10}}>
            <div><h2 className="card-title">Recent documents</h2><p className="card-subtitle">The latest files moving through DeepFlow.</p></div>
            <button className="section-link" onClick={onNavigateToDocuments}>View all <ArrowRight size={12} /></button>
          </div>
          <div className="table-wrap">
            <table className="editorial-table"><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Risk</th><th>Uploaded</th><th /></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6">Loading documents…</td></tr> : documents.map((doc) => (
                  <tr key={doc.id} onClick={() => onNavigateToAnalyzer(doc.id)} style={{cursor:'pointer'}}>
                    <td><div className="doc-name-cell"><span className="file-icon"><FileText size={13}/></span><span><span className="doc-name">{doc.original_filename || doc.filename}</span><span className="doc-meta">#{String(doc.id).slice(0,8)}</span></span></div></td>
                    <td>{doc.analysis?.document_type || 'General'}</td>
                    <td><span className={`pill ${doc.status === 'Approved' ? 'pill-approved' : doc.status === 'Pending Approval' ? 'pill-pending' : doc.status === 'Under Review' ? 'pill-review' : 'pill-rejected'}`}>{doc.status}</span></td>
                    <td><span className={`pill ${String(doc.priority).toUpperCase()==='HIGH' ? 'pill-high' : String(doc.priority).toUpperCase()==='MEDIUM' ? 'pill-medium' : 'pill-low'}`}>{doc.priority || 'LOW'}</span></td>
                    <td>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}</td>
                    <td><ArrowRight size={13} color="#8c867b" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="paper-card insight-card">
          <div className="page-kicker">AI insights</div>
          <h2 className="card-title" style={{marginTop:7}}>What needs attention</h2>
          <div className="insight-list">
            {(analytics?.process_insights || []).slice(0,3).map((item) => <div className="insight-item" key={item.id}><span className="insight-label">Action required</span><strong>{item.title}</strong><p>{item.observation}</p></div>)}
            {!analytics?.process_insights?.length && <div className="insight-item"><span className="insight-label">System note</span><strong>Your document pipeline is ready.</strong><p>Upload a document to generate the first live insight.</p></div>}
          </div>
          <button className="secondary-btn" style={{marginTop:18}}>View insights <ArrowRight size={12} /></button>
        </article>

        <article className="quote-card paper-card">
          <div className="page-kicker" style={{color:'#51493e'}}>DeepFlow / editorial note</div>
          <blockquote>“Technology should feel human — clear enough to trust, powerful enough to matter.”</blockquote>
          <span className="quote-credit">DeepFlow AI</span>
          <span className="quote-note">Intelligence for a brighter tomorrow.</span>
        </article>

        <article className="upgrade-card paper-card">
          <div><strong>Upgrade to Pro</strong><p>Unlock advanced AI models, richer workflow controls, and priority support.</p></div>
          <button className="upgrade-cta"><Sparkles size={13} />&nbsp; View plans <ArrowRight size={12} /></button>
        </article>
      </section>
    </div>
  );
}
