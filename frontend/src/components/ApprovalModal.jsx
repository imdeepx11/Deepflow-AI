import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { api } from '../api';

export default function ApprovalModal({ isOpen, onClose, document, initialAction='Approve', onDecisionSuccess, user }) {
  const [action, setAction] = useState(initialAction);
  const [role, setRole] = useState('Finance Manager');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isOpen) { setAction(initialAction); setRole(document?.analysis?.assigned_role || 'Finance Manager'); setComments(''); setError(''); } }, [isOpen, initialAction, document]);
  if (!isOpen || !document) return null;

  const submit = async () => {
    setSubmitting(true); setError('');
    const approverName = user?.name || 'System User';
    const actionText = action === 'Approve' ? 'Approved' : action === 'Reject' ? 'Rejected' : 'Requested Review';
    try {
      await api.approveDocument(document.id, {action, approver_name: approverName, approver_role:role, comments:comments || `${actionText} by ${role}.`});
      onDecisionSuccess?.(`${document.original_filename} ${actionText.toLowerCase()} successfully.`);
      onClose();
    } catch (err) { setError(err.message || 'Decision could not be saved.'); }
    finally { setSubmitting(false); }
  };

  return <div className="editorial-modal-backdrop"><div className="editorial-modal">
    <div className="modal-head"><div><div className="page-kicker">Formal decision</div><div className="card-title" style={{marginTop:6}}>{action==='Approve'?'Approve this document?':action==='Reject'?'Reject this document?':'Request a review?'}</div><div className="card-subtitle">The choice is written to the Firestore audit trail.</div></div><button className="close-btn" onClick={onClose}><X size={17}/></button></div>
    <div className="modal-body">
      {error && <div style={{padding:10,borderRadius:12,background:'#f4dfda',border:'1px solid #e4c4bd',color:'#7b3c34',fontSize:10,marginBottom:12}}>{error}</div>}
      <div className="paper-card" style={{padding:15,background:'#faf6ee'}}><div style={{display:'grid',gap:8,fontSize:10}}><div><span style={{color:'#777'}}>Document</span><strong style={{float:'right',maxWidth:330,textAlign:'right'}}>{document.original_filename}</strong></div><div><span style={{color:'#777'}}>Type</span><strong style={{float:'right'}}>{document.analysis?.document_type || 'Document'}</strong></div><div><span style={{color:'#777'}}>Priority</span><strong style={{float:'right'}}>{document.priority || 'MEDIUM'}</strong></div></div></div>
      <div style={{marginTop:15}}><div className="page-kicker">Action</div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginTop:8}}>{[['Approve',CheckCircle2],['Reject',XCircle],['Request Changes',AlertTriangle]].map(([item,Icon])=><button key={item} onClick={()=>setAction(item)} className={`tab-btn ${action===item?'active':''}`} style={{border:'1px solid #d9d1c3',padding:'11px 8px'}}><Icon size={14}/>{item==='Request Changes'?' Review':` ${item}`}</button>)}</div></div>
      <label style={{display:'block',marginTop:15}}><span className="page-kicker">Approver role</span><select className="editorial-select" style={{width:'100%',marginTop:8}} value={role} onChange={e=>setRole(e.target.value)}><option>Finance Manager</option><option>Operations Manager</option><option>Legal Counsel</option><option>Administrator</option></select></label>
      <label style={{display:'block',marginTop:15}}><span className="page-kicker">Audit notes</span><textarea className="editorial-input" style={{marginTop:8,minHeight:90,resize:'vertical'}} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Add a concise decision note…"/></label>
    </div>
    <div className="modal-foot"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={submit} disabled={submitting}>{submitting?<><Loader2 size={14}/> Saving…</>:<>Confirm {action}</>}</button></div>
  </div></div>;
}
