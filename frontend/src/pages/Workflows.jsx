import React, { useEffect, useState } from 'react';
import { GitBranch, Play, Plus, Save, Trash2, Zap } from 'lucide-react';
import { api } from '../api';

export default function Workflows() {
  const [templates, setTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [tab, setTab] = useState('overview');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([
    { step_name:'Document ingestion', node_type:'Start', role:'System' },
    { step_name:'AI extraction & risk scan', node_type:'AI Analysis', role:'AI Engine' },
    { step_name:'Finance manager signoff', node_type:'Approval', role:'Finance Manager' },
    { step_name:'Archive & sync', node_type:'End', role:'System' }
  ]);

  const load = async () => {
    try { const [t,w] = await Promise.all([api.getWorkflowTemplates(), api.getWorkflows()]); setTemplates(t); setWorkflows(w); }
    catch (error) { console.error('Workflow load error:', error); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return alert('Add a workflow name first.');
    try { await api.createWorkflow({name, description, steps}); setName(''); setDescription(''); setTab('overview'); load(); }
    catch (error) { alert(error.message || 'Could not create workflow'); }
  };

  const addStep = () => setSteps((items) => [...items, {step_name:'Validation step',node_type:'Approval',role:'Manager'}]);
  const removeStep = (index) => setSteps((items) => items.filter((_,i)=>i!==index));
  const updateStep = (index,key,value) => setSteps((items) => items.map((item,i)=>i===index?{...item,[key]:value}:item));

  return (
    <div className="editorial-page">
      <div className="page-head"><div><div className="page-kicker">Automation studio</div><h1 className="page-title">Workflows.</h1><p className="page-intro">Design routing logic that moves a document from ingestion to approval without losing context.</p></div><button className="primary-btn" onClick={()=>setTab(tab==='overview'?'builder':'overview')}><Plus size={14}/>{tab==='overview'?' Create workflow':' View workflows'}</button></div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
        {[['Active workflows',workflows.filter(x=>x.status==='Active').length || 0],['Live documents',workflows.length],['Rules to enforce',3],['Automation coverage','74%']].map(([label,val])=><div className="paper-card kpi-card" key={label}><div className="kpi-label">{label}</div><div className="kpi-value">{val}</div><div className="kpi-meta"><span className="kpi-change">● live</span><span>updated from Firestore</span></div></div>)}
      </div>

      {tab==='overview' ? <>
        <div className="workflow-grid">
          <article className="paper-card card-padding"><div className="page-kicker">Templates</div><h2 className="card-title" style={{marginTop:7}}>Start with a proven flow.</h2><div className="workflow-list">{templates.map((item)=><div className="workflow-item" key={item.id}><div className="workflow-icon"><GitBranch size={17}/></div><div><strong style={{fontSize:12}}>{item.name}</strong><div className="card-subtitle">{item.description}</div><div className="step-strip"><span className="step-chip">{item.active_count} active</span><span className="step-chip">{item.completion_rate}</span><span className="step-chip">{item.avg_time}</span></div></div><Zap size={15} color="#aa7a24"/></div>)}</div></article>
          <article className="paper-card builder-card"><div className="page-kicker">Live routing stream</div><h2 className="card-title" style={{marginTop:7}}>What is moving now?</h2><div className="workflow-list">{workflows.slice(0,6).map((wf)=><div className="workflow-item" key={wf.id}><div className="workflow-icon"><Play size={15}/></div><div><strong style={{fontSize:11}}>{wf.name}</strong><div className="card-subtitle">{wf.document_name}</div></div><span className={`pill ${wf.status==='Completed'?'pill-approved':wf.status==='Failed'?'pill-rejected':'pill-pending'}`}>{wf.status}</span></div>)}{!workflows.length&&<div style={{fontSize:11,color:'#777'}}>No active workflow instances yet.</div>}</div></article>
        </div>
      </> : <article className="paper-card builder-card">
        <div className="page-kicker">Workflow builder</div><h2 className="card-title" style={{marginTop:7}}>Create a routing path.</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:17}}><input className="editorial-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Workflow name"/><input className="editorial-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description"/></div>
        <div className="section-row" style={{marginTop:22}}><div><div className="page-kicker">Sequential nodes</div><div className="card-subtitle">Each step is saved as a Firestore workflow step.</div></div><button className="secondary-btn" onClick={addStep}><Plus size={13}/> Add node</button></div>
        <div style={{marginTop:10}}>{steps.map((step,index)=><div className="builder-row" key={index}><div className="avatar" style={{width:30,height:30,fontSize:10,background:'#214b3a'}}>{index+1}</div><input className="editorial-input" value={step.step_name} onChange={e=>updateStep(index,'step_name',e.target.value)}/><select className="editorial-select" value={step.node_type} onChange={e=>updateStep(index,'node_type',e.target.value)}><option>Start</option><option>AI Analysis</option><option>Document Validation</option><option>Approval</option><option>Condition</option><option>Notification</option><option>End</option></select><input className="editorial-input" value={step.role} onChange={e=>updateStep(index,'role',e.target.value)}/><button className="header-icon-btn" onClick={()=>removeStep(index)} aria-label="Remove node"><Trash2 size={13}/></button></div>)}</div>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}><button className="primary-btn" onClick={save}><Save size={14}/> Save workflow</button></div>
      </article>}
    </div>
  );
}
