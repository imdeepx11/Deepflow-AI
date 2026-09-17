import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Moon, Sparkles, Sun } from 'lucide-react';
import { api } from '../api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address, for example name@example.com.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email: normalizedEmail, password });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const demo = async () => {
    setEmail('demo@deepflow.ai');
    setPassword('demo123');
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email: 'demo@deepflow.ai', password: 'demo123' });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-editorial">
          <button className="brand-block" type="button" aria-label="DeepFlow AI">
            <span className="brand-mark"><Sparkles size={18} /></span>
            <span className="brand-copy">
              <span className="brand-name">DeepFlow</span>
              <span className="brand-subtitle">Intelligent Documents,<br />Smarter Workflows</span>
            </span>
          </button>

          <div className="login-theme-control">
            <button className="header-icon-btn" type="button" onClick={onToggleDarkMode} aria-label="Toggle dark mode" title="Toggle dark mode">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <div className="page-kicker" style={{ marginTop: 58 }}>Document intelligence</div>
          <h1>Turn<br />documents<br /><em>into decisions.</em></h1>
          <p>Read business documents with AI, surface risk, and move every approval through a workflow that feels deliberate rather than mechanical.</p>
          <div className="login-points">
            {['PDF, DOCX and TXT extraction', 'Risk scoring and approval routing', 'Firestore-backed audit history'].map((item) => (
              <div key={item}><CheckCircle2 size={15} />{item}</div>
            ))}
          </div>
          <div className="login-credit">Developed and Designed by <strong>Deepak Gupta</strong></div>
        </section>

        <section className="login-side">
          <div className="page-kicker">Welcome back</div>
          <h2>Sign in.</h2>
          <p>Use a valid email address to enter your DeepFlow workspace.</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={submit} noValidate>
            <label>
              <span className="login-label">Email address</span>
              <div className="login-field"><Mail size={15} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            </label>
            <label>
              <span className="login-label">Password</span>
              <div className="login-field"><Lock size={15} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="current-password" minLength={6} required /></div>
            </label>
            <button className="primary-btn login-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>
          <button className="secondary-btn demo-login" type="button" onClick={demo} disabled={loading}><Sparkles size={14} /> Use demo account</button>
        </section>
      </div>
    </div>
  );
}
