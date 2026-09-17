import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { api } from '../api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, user }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const choose = (candidate) => {
    setError(''); setUploaded(false);
    if (!candidate) return;
    const ext = `.${candidate.name.split('.').pop().toLowerCase()}`;
    if (!['.pdf','.docx','.doc','.txt'].includes(ext)) { setError('Please choose a PDF, DOCX, DOC, or TXT file.'); return; }
    setFile(candidate);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('uploaded_by', user?.name || 'Admin');
      const response = await api.uploadDocument(data);
      setUploaded(true);
      setTimeout(() => { onUploadSuccess(response.id); onClose(); setFile(null); setUploaded(false); }, 550);
    } catch (err) { setError(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return <div className="editorial-modal-backdrop">
    <div className="editorial-modal">
      <div className="modal-head"><div><div className="page-kicker">Document intake</div><div className="card-title" style={{marginTop:6}}>Add a new document.</div></div><button className="close-btn" onClick={onClose}><X size={17}/></button></div>
      <div className="modal-body">
        {error && <div style={{padding:10,borderRadius:12,background:'#f4dfda',border:'1px solid #e4c4bd',color:'#7b3c34',fontSize:10,marginBottom:12}}>{error}</div>}
        {!file ? <button type="button" onClick={()=>inputRef.current?.click()} style={{width:'100%',padding:'44px 20px',border:'1px dashed #b9ae9e',borderRadius:18,background:'#faf6ee',textAlign:'center'}}><div className="file-icon" style={{margin:'0 auto 12px',width:44,height:44,borderRadius:14}}><UploadCloud size={20}/></div><strong style={{display:'block',fontSize:12}}>Drop a document here, or browse.</strong><span style={{display:'block',marginTop:6,fontSize:9,color:'#777'}}>PDF, DOCX, DOC, TXT · up to 25 MB</span></button> : <div style={{padding:15,borderRadius:16,border:'1px solid #e2d9cb',background:'#faf6ee',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}><div style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}><div className="file-icon"><FileText size={15}/></div><div style={{minWidth:0}}><strong style={{display:'block',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{file.name}</strong><span style={{display:'block',fontSize:9,color:'#777',marginTop:3}}>{(file.size/1024).toFixed(1)} KB</span></div></div><button className="close-btn" onClick={()=>setFile(null)}><X size={15}/></button></div>}
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{display:'none'}} onChange={e=>choose(e.target.files?.[0])}/>
        {uploading && <div style={{marginTop:12,fontSize:10,color:'#315d48',display:'flex',alignItems:'center',gap:7}}><Loader2 size={14} className="animate-spin"/>Uploading and extracting text…</div>}
        {uploaded && <div style={{marginTop:12,fontSize:10,color:'#315d48',display:'flex',alignItems:'center',gap:7}}><CheckCircle2 size={14}/>Document uploaded.</div>}
      </div>
      <div className="modal-foot"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={!file || uploading} onClick={upload}>{uploading?'Uploading…':'Upload document'}</button></div>
    </div>
  </div>;
}
