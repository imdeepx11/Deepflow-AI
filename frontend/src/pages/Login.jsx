import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, Lock, Mail, Moon, Sparkles, Sun, X, Loader2 } from 'lucide-react';
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

  // Password Recovery Modal state
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: Code & New Password, 3: Success
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

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

  const handleOpenRecovery = () => {
    setRecoveryEmail(email || '');
    setRecoveryStep(1);
    setRecoveryCode('');
    setNewPassword('');
    setRecoveryError('');
    setRecoverySuccess('');
    setRecoveryOpen(true);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    const norm = recoveryEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) {
      setRecoveryError('Please enter a valid email address.');
      return;
    }
    setRecoveryLoading(true);
    try {
      const res = await api.forgotPassword(norm);
      setRecoveryStep(2);
      if (res.code) {
        setRecoveryCode(res.code);
        setRecoverySuccess(`Verification code generated: ${res.code}`);
      }
    } catch (err) {
      setRecoveryError(err.message || 'Could not send verification code. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recoveryCode || recoveryCode.trim().length !== 6) {
      setRecoveryError('Please enter a 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setRecoveryError('New password must contain at least 6 characters.');
      return;
    }
    setRecoveryLoading(true);
    try {
      await api.resetPassword(recoveryEmail.trim().toLowerCase(), recoveryCode, newPassword);
      setRecoveryStep(3);
      setRecoverySuccess('Password reset successfully! You can now sign in with your new password.');
    } catch (err) {
      setRecoveryError(err.message || 'Password reset failed.');
    } finally {
      setRecoveryLoading(false);
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

          <div className="login-credit">Developed and Designed by <strong>Deepak Gupta</strong></div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="login-label" style={{ marginBottom: 0 }}>Password</span>
                  <button type="button" onClick={handleOpenRecovery} style={{ background: 'none', border: 'none', color: '#8e6b32', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</button>
                </div>
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

      {recoveryOpen && (
        <div className="editorial-modal-backdrop" role="presentation">
          <div className="editorial-modal" style={{ maxWidth: 440, borderRadius: 20, padding: '28px 28px 24px' }} role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="page-kicker" style={{ color: '#a9814c', letterSpacing: '0.08em', fontWeight: 700 }}>PASSWORD RECOVERY</div>
                <h2 style={{ fontSize: 24, fontFamily: 'Playfair Display, Georgia, serif', margin: '4px 0 6px', color: '#1d2233' }}>
                  {recoveryStep === 3 ? 'Password reset!' : 'Forgot your password?'}
                </h2>
              </div>
              <button className="close-btn" type="button" onClick={() => setRecoveryOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#5a6178', lineHeight: 1.5, margin: '0 0 16px' }}>
              {recoveryStep === 1 && 'Enter your account email and we will send a 6-digit verification code.'}
              {recoveryStep === 2 && 'Enter the 6-digit verification code and your new password below.'}
              {recoveryStep === 3 && 'Your password has been successfully updated. You can now close this window and sign in.'}
            </p>

            {recoveryError && (
              <div className="login-error" style={{ marginBottom: 14 }} role="alert">
                {recoveryError}
              </div>
            )}

            {recoverySuccess && recoveryStep !== 3 && (
              <div style={{ padding: '9px 12px', borderRadius: 10, background: '#eef8f2', border: '1px solid #c8e8d4', color: '#1f6b43', fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
                {recoverySuccess}
              </div>
            )}

            {recoveryStep === 1 && (
              <form onSubmit={handleRequestCode}>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span className="login-label" style={{ fontSize: 10, letterSpacing: '0.06em' }}>EMAIL ADDRESS</span>
                  <div className="login-field" style={{ marginTop: 6 }}>
                    <Mail size={15} />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </label>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={recoveryLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', background: '#1f4333', color: '#fff', borderRadius: 24 }}
                >
                  {recoveryLoading ? (
                    <><Loader2 size={15} className="animate-spin" /> Sending code…</>
                  ) : (
                    <>Send verification code <ArrowRight size={14} /></>
                  )}
                </button>
              </form>
            )}

            {recoveryStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span className="login-label" style={{ fontSize: 10, letterSpacing: '0.06em' }}>VERIFICATION CODE (6 DIGITS)</span>
                  <div className="login-field" style={{ marginTop: 6 }}>
                    <KeyRound size={15} />
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="849201"
                      required
                    />
                  </div>
                </label>

                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span className="login-label" style={{ fontSize: 10, letterSpacing: '0.06em' }}>NEW PASSWORD</span>
                  <div className="login-field" style={{ marginTop: 6 }}>
                    <Lock size={15} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </label>

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={recoveryLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', background: '#1f4333', color: '#fff', borderRadius: 24 }}
                >
                  {recoveryLoading ? (
                    <><Loader2 size={15} className="animate-spin" /> Resetting password…</>
                  ) : (
                    <>Reset password <CheckCircle2 size={14} /></>
                  )}
                </button>
              </form>
            )}

            {recoveryStep === 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => setRecoveryOpen(false)}
                  style={{ background: '#1f4333', color: '#fff', borderRadius: 24, padding: '10px 20px' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

