import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('demo@deepflow.ai');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      onLoginSuccess(res.user);
    } catch (err) { setError(err.message || 'Sign in failed'); }
    finally { setLoading(false); }
  };

  const demo = async () => {
    setEmail('demo@deepflow.ai'); setPassword('demo123'); setError(''); setLoading(true);
    try { const res = await api.login({email:'demo@deepflow.ai',password:'demo123'}); onLoginSuccess(res.user); }
    catch (err) { setError(err.message || 'Demo sign in failed'); }
    finally { setLoading(false); }
  };

  return <div className="login-page">
    <div className="login-shell">
      <section className="login-editorial">
        <div className="brand-block"><span className="brand-mark"><Sparkles size={19}/></span><span><span className="brand-name">DeepFlow AI</span><span className="brand-subtitle">Documents. Intelligence. Impact.</span></span></div>
        <div className="page-kicker" style={{marginTop:54}}>Document intelligence</div>
        <h1>Turn documents<br/>into decisions.</h1>
        <p>Read business documents with AI, surface risk, and move every approval through a workflow that feels deliberate rather than mechanical.</p>
        <div style={{display:'grid',gap:12,marginTop:30}}>{['PDF, DOCX and TXT extraction','Risk scoring and approval routing','Firestore-backed audit history'].map(item=><div key={item} style={{display:'flex',alignItems:'center',gap:9,fontSize:11,fontWeight:700,color:'#4f594f'}}><CheckCircle2 size={15} color="#315d48"/>{item}</div>)}</div>
        <div style={{position:'absolute',left:56,bottom:34,fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'#70695e'}}>DeepFlow AI · Enterprise workspace</div>
      </section>
      <section className="login-side">
        <div className="page-kicker">Welcome back</div>
        <h2 style={{marginTop:8}}>Sign in.</h2>
        <p>Use your workspace credentials, or enter the demo account to explore the product.</p>
        {error && <div style={{marginTop:14,padding:11,borderRadius:12,background:'#f4dfda',border:'1px solid #e4c4bd',color:'#7b3c34',fontSize:10}}>{error}</div>}
        <form className="login-form" onSubmit={submit}>
          <label><span className="login-label">Email address</span><div className="login-field"><Mail size={15}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label>
          <label><span className="login-label">Password</span><div className="login-field"><Lock size={15}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div></label>
          <button className="primary-btn" type="submit" disabled={loading} style={{justifyContent:'center'}}>{loading?'Signing in…':'Sign in'}<ArrowRight size={14}/></button>
        </form>
        <div className="login-demo"><div style={{fontSize:9,color:'#7a7e77',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:8}}>Quick access</div><button className="secondary-btn" style={{width:'100%',justifyContent:'center'}} onClick={demo}><Sparkles size={14}/> Use demo account</button></div>
      </section>
    </div>
  </div>;
}
