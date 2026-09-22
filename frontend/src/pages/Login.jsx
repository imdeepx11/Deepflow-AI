import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Moon, Sparkles, Sun } from 'lucide-react';
import { api } from '../api';
import { isGoogleAuthConfigured, signInWithGoogle } from '../firebase-client';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.27c0-.67-.06-1.3-.18-1.91H12v3.61h5.24a4.47 4.47 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.19 2.91-7.08Z" />
      <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.55 0-4.71-1.72-5.49-4.03H3.27v2.52A9.73 9.73 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" d="M6.51 13.71A5.85 5.85 0 0 1 6.2 12c0-.59.11-1.16.31-1.71V7.77H3.27A9.6 9.6 0 0 0 2.4 12c0 1.53.37 2.98.87 4.23l3.24-2.52Z" />
      <path fill="#EA4335" d="M12 6.26c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.39 14.62 2.4 12 2.4a9.73 9.73 0 0 0-8.73 5.37l3.24 2.52C7.29 7.98 9.45 6.26 12 6.26Z" />
    </svg>
  );
}

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const googleLogin = async () => {
    setError('');
    if (!isGoogleAuthConfigured()) {
      setError('Google sign-in is not connected yet. Firebase web app settings are required in Vercel.');
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const res = await api.loginWithGoogle(result.idToken);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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

  const busy = loading || googleLoading;

  return (
    <div className="login-page">
      <div className="login-shell premium-login-shell">
        <section className="login-editorial">
          <div className="login-topline">
            <button className="brand-block login-brand" type="button" aria-label="DeepFlow AI">
              <span className="brand-mark"><Sparkles size={18} /></span>
              <span className="brand-copy">
                <span className="brand-name">DeepFlow</span>
                <span className="brand-subtitle">Intelligent Documents,<br />Smarter Workflows</span>
              </span>
            </button>
            <button className="header-icon-btn login-theme-button" type="button" onClick={onToggleDarkMode} aria-label="Toggle dark mode" title="Toggle dark mode">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <div className="login-editorial-copy">
            <div className="page-kicker">Document intelligence</div>
            <h1>Turn<br />documents<br /><em>into decisions.</em></h1>
            <p>Read business documents with AI, surface risk, and move every approval through a workflow that feels deliberate rather than mechanical.</p>
            <div className="login-points">
              {['PDF, DOCX and TXT extraction', 'Risk scoring and approval routing', 'Firestore-backed audit history'].map((item) => (
                <div key={item}><CheckCircle2 size={15} /><span>{item}</span></div>
              ))}
            </div>
          </div>

          <div className="login-credit">DeepFlow AI Enterprise Platform</div>
        </section>

        <section className="login-side premium-login-side">
          <div className="login-form-shell">
            <div className="page-kicker">Welcome back</div>
            <h2>Sign in.</h2>
            <p>Use your work email or continue securely with Google.</p>

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="google-login" type="button" onClick={googleLogin} disabled={busy}>
              <GoogleMark />
              <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>

            <div className="login-divider"><span>or continue with email</span></div>

            <form className="login-form" onSubmit={submit} noValidate>
              <label>
                <span className="login-label">Email address</span>
                <div className="login-field"><Mail size={15} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
              </label>
              <label>
                <span className="login-label">Password</span>
                <div className="login-field"><Lock size={15} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="current-password" minLength={6} required /></div>
              </label>
              <button className="primary-btn login-submit" type="submit" disabled={busy}>
                <span>{loading ? 'Signing in…' : 'Sign in'}</span><ArrowRight size={14} />
              </button>
            </form>

            <button className="demo-link" type="button" onClick={demo} disabled={busy}>
              <Sparkles size={13} /> Use demo account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
