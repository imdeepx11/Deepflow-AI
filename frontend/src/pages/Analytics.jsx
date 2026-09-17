import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock, Lightbulb, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.getAnalytics(30).then(setData).catch(console.error); }, []);
  const k = data?.kpis || {};
  const typeData = data?.type_breakdown || [];
  const insights = data?.process_insights || [];

  const metrics = [
    ['Processed', k.documents_processed ?? 0, BarChart3, k.documents_change || '+18.4%'],
    ['Automation rate', k.automation_rate || '74%', Zap, k.automation_change || '+5.8%'],
    ['Avg process time', k.avg_processing_time || '2.4 min', Clock, k.processing_time_change || '-42 sec'],
    ['Approval rate', k.approval_rate || '89.5%', CheckCircle2, '+2.1%'],
    ['SLA compliance', k.sla_compliance || '94.2%', ShieldCheck, '+1.4%'],
    ['AI accuracy', k.ai_accuracy || '96.8%', Sparkles, '+0.8%']
  ];

  return <div className="editorial-page">
    <div className="page-head"><div><div className="page-kicker">Process intelligence</div><h1 className="page-title">Analytics.</h1><p className="page-intro">A clear editorial view of throughput, automation, approvals, and the places where human attention still matters.</p></div></div>

    <div className="kpi-grid" style={{gridTemplateColumns:'repeat(6,minmax(0,1fr))'}}>{metrics.map(([label,value,Icon,change])=><article className="paper-card kpi-card" key={label}><div className="section-row"><Icon size={16} color="#8e6b32"/><span className="kpi-label">{label}</span></div><div className="kpi-value" style={{fontSize:28}}>{value}</div><div className="kpi-meta"><span className="kpi-change">{change}</span><span>vs prior</span></div></article>)}</div>

    <div className="analytics-grid">
      <article className="paper-card chart-card"><div className="page-kicker">Document mix</div><h2 className="card-title" style={{marginTop:7}}>Ingestion by category</h2><p className="card-subtitle">Which document types are moving through the pipeline.</p><div className="chart-block"><ResponsiveContainer width="100%" height="100%"><BarChart data={typeData} margin={{top:15,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e0d6"/><XAxis dataKey="type" axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#7c7f78'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#7c7f78'}}/><Tooltip contentStyle={{background:'#fffdf8',border:'1px solid #d9d1c3',borderRadius:12,fontSize:10}}/><Bar dataKey="count" fill="#2e6450" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></article>
      <article className="paper-card chart-card"><div className="page-kicker">Executive snapshot</div><h2 className="card-title" style={{marginTop:7}}>Signal, not noise.</h2><div style={{display:'grid',gap:16,marginTop:20}}>{[['AI accuracy','96.8%'],['Straight-through rate',k.automation_rate || '74%'],['SLA compliance',k.sla_compliance || '94.2%']].map(([label,val])=><div key={label}><div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span>{label}</span><strong>{val}</strong></div><div className="risk-meter"><span style={{width:val}}/></div></div>)}</div><div style={{marginTop:22,paddingTop:17,borderTop:'1px solid #e9e1d6',fontSize:10,lineHeight:1.6,color:'#6f756f'}}>Your strongest control point is the AI classification layer. Bottlenecks remain concentrated in human approval steps.</div></article>
    </div>

    <article className="paper-card chart-card" style={{marginTop:16}}><div className="section-row"><div><div className="page-kicker">AI process intelligence</div><h2 className="card-title" style={{marginTop:7}}>Where the workflow slows down.</h2></div><Lightbulb size={18} color="#aa7a24"/></div><div className="insight-grid" style={{marginTop:18}}>{insights.map(item=><div className="insight-panel paper-card" key={item.id}><span className="insight-label">Observed</span><h3 className="display-serif" style={{fontSize:20,margin:'8px 0'}}>{item.title}</h3><p className="card-subtitle">{item.observation}</p><div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #e9e1d6',fontSize:10,color:'#315d48',lineHeight:1.5}}><strong>Suggested:</strong> {item.recommendation}</div></div>)}</div></article>
  </div>;
}
