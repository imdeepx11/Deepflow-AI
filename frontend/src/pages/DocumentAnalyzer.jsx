import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, MessageCircle, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react';
import ApprovalModal from '../components/ApprovalModal';
import { api } from '../api';

export default function DocumentAnalyzer({ docId, onNavigateToDocuments }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  const load = async () => {
    if (!docId) { setDoc(null); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.getDocument(docId);
      setDoc(data);
      setChat([{ sender:'ai', text:`I’ve read ${data.original_filename}. Ask me about its fields, risks, dates, amounts, or routing.` }]);
    } catch (error) {
      console.error('Analyzer load error:', error);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [docId]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat, chatLoading]);

  const analyze = async () => {
    if (!doc) return;
    setAnalyzing(true);
    try { await api.analyzeDocument(doc.id); await load(); }
    catch (error) { alert(error.message || 'Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const ask = async (text) => {
    const q = text || question;
    if (!q.trim() || !doc) return;
    setChat((items) => [...items, {sender:'user', text:q}]);
    setQuestion(''); setChatLoading(true);
    try {
      const res = await api.chatWithDoc(doc.id, q);
      setChat((items) => [...items, {sender:'ai', text:res.answer}]);
    } catch { setChat((items) => [...items, {sender:'ai', text:'I could not retrieve an answer from this document right now.'}]); }
    finally { setChatLoading(false); }
  };

  if (loading) return <div className="editorial-page"><div className="paper-card card-padding">Loading document intelligence…</div></div>;
  if (!doc) return <div className="editorial-page"><div className="paper-card card-padding analyzer-empty-state"><button className="secondary-btn" onClick={onNavigateToDocuments}><ArrowLeft size={18}/> Back to documents</button><p>No document selected.</p></div></div>;

  const analysis = doc.analysis || {};
  const confidence = Math.round((doc.confidence || analysis.confidence || 0) * 100);
  const risk = analysis.risk_score ?? 0;
  const extracted = analysis.extracted_fields || {};

  return (
    <div className="editorial-page">
      <div className="page-head">
        <div><div className="page-kicker">Document intelligence</div><h1 className="page-title" style={{fontSize:'clamp(34px,4.4vw,62px)'}}>{doc.original_filename}</h1><p className="page-intro">{analysis.document_type || 'Document'} · {doc.status} · {confidence}% AI confidence</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="secondary-btn" onClick={analyze} disabled={analyzing}><RefreshCw size={13}/>{analyzing?'Analyzing…':'Re-run AI analysis'}</button><button className="primary-btn" onClick={() => setApprovalOpen(true)}><CheckCircle2 size={14}/> Approve / review</button></div>
      </div>

      <div className="analyzer-grid">
        <article className="paper-card analyzer-viewer">
          <div className="viewer-head"><span className="viewer-chip">Document preview · {doc.file_type || 'FILE'}</span><span className="viewer-chip">{Math.round((doc.file_size || 0)/1024)} KB</span></div>
          <div className="viewer-sheet">
            <h4>{analysis.document_type || 'Business Document'}</h4>
            <div className="sheet-line w70"/><div className="sheet-line w50"/><div className="sheet-block"/>
            <div className="sheet-line"/><div className="sheet-line w70"/><div className="sheet-line w50"/>
            <div className="sheet-block"/>
            <div style={{fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:270,overflow:'hidden'}}>{doc.extracted_text || 'No text extracted.'}</div>
          </div>
        </article>

        <div className="analyzer-info">
          <article className="paper-card data-card">
            <div className="section-row"><div><div className="page-kicker">Extracted fields</div><h2 className="card-title" style={{marginTop:7}}>Key information</h2></div><span className="pill pill-approved">Verified</span></div>
            <div className="field-grid">{Object.entries(extracted).length ? Object.entries(extracted).map(([key,val]) => <div className="field-item" key={key}><div className="field-key">{key}</div><div className="field-value">{val ?? 'Not detected'}</div></div>) : <div style={{gridColumn:'1 / -1',color:'#777',fontSize:11}}>No structured fields returned yet. Run analysis to extract them.</div>}</div>
          </article>

          <div className="risk-layout">
            <article className="paper-card data-card"><div className="page-kicker">AI risk assessment</div><div className="risk-score" style={{marginTop:8}}>{risk}<span style={{fontSize:11,color:'#777',fontFamily:'DM Sans'}}> / 100</span></div><div className="risk-meter"><span style={{width:`${Math.min(100,Math.max(0,risk))}%`}}/></div><p className="card-subtitle" style={{marginTop:9}}>{analysis.risk_level || 'LOW'} risk · {analysis.risks?.length || 0} flagged signals</p></article>
            <article className="paper-card data-card"><div className="page-kicker">Routing priority</div><div className="risk-score" style={{fontSize:38,marginTop:11}}>{doc.priority || 'LOW'}</div><p className="card-subtitle">{analysis.priority_reason || 'Priority calculated from the document context.'}</p><div style={{marginTop:12,fontSize:10,color:'#315d48',fontWeight:700}}>{analysis.assigned_role || 'Manager'} · SLA {analysis.sla_hours || 24}h</div></article>
          </div>

          <article className="action-card paper-card">
            <div className="page-kicker" style={{color:'#42624e'}}>Recommended action</div>
            <h3>{analysis.recommended_action || 'Review'}</h3>
            <p style={{margin:0,color:'#5e6a60',fontSize:11,lineHeight:1.6}}>{analysis.summary?.[0] || 'DeepFlow has prepared the document for your next workflow decision.'}</p>
          </article>

          <article className="paper-card data-card">
            <div className="section-row"><div><div className="page-kicker">Grounded document Q&A</div><h2 className="card-title" style={{marginTop:7}}>Ask the document</h2></div><MessageCircle size={17} color="#214b3a"/></div>
            <div ref={chatRef} style={{height:150,overflow:'auto',marginTop:14,padding:12,background:'#f6f0e5',border:'1px solid #e7ded2',borderRadius:14,display:'grid',gap:8,alignContent:'start'}}>
              {chat.map((item,index)=><div key={index} style={{maxWidth:'90%',justifySelf:item.sender==='user'?'end':'start',padding:'9px 11px',borderRadius:12,background:item.sender==='user'?'#214b3a':'#fffdf8',color:item.sender==='user'?'#fff':'#354038',fontSize:10,lineHeight:1.55}}>{item.text}</div>)}
              {chatLoading && <div style={{fontSize:10,color:'#6f756f'}}>Reading document…</div>}
            </div>
            <div style={{display:'flex',gap:8,marginTop:10}}><input className="editorial-input" value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="What is the total amount?"/><button className="primary-btn" onClick={()=>ask()}><Send size={13}/></button></div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:9}}>{['Total amount?','Payment due date?','What are the risks?','Who approves this?'].map(q=><button className="tab-btn" key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
          </article>
        </div>
      </div>

      <ApprovalModal isOpen={approvalOpen} onClose={() => setApprovalOpen(false)} document={doc} initialAction="Approve" onDecisionSuccess={() => load()} />
    </div>
  );
}
