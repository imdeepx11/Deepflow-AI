import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Moon, Sparkles, Sun, User as UserIcon } from 'lucide-react';
import { api } from '../api';
import { isGoogleAuthConfigured, signInWithGoogle, getGoogleRedirectResult } from '../firebase-client';
import GoogleMark from '../components/GoogleMark';
import PasswordRecoveryModal from '../components/PasswordRecoveryModal';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }) {
  const [authMode, setAuthMode] = useState('signin');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery state
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('reset_token');
    if (tokenParam) {
      setRecoveryToken(tokenParam);
      setRecoveryOpen(true);
      setRecoveryStep(2);
      window.history.replaceState({}, document.title, window.location.pathname);
      api.verifyResetToken(tokenParam)
        .then((res) => { if (res.email) setRecoveryEmail(res.email); })
        .catch((err) => setRecoveryError(err.message || 'Password reset link is invalid or expired.'));
    }

    // Silently check for Google redirect sign-in result on mount
    getGoogleRedirectResult()
      .then(async (result) => {
        if (result) {
          setGoogleLoading(true);
          try {
            const res = await api.loginWithGoogle(result.idToken);
            onLoginSuccess(res.user);
          } catch (err) {
            setError(err.message || 'Google sign-in failed');
          } finally {
            setGoogleLoading(false);
          }
        }
      })
      .catch(() => {
        // Silently ignore background initialization errors on initial page load
      });
  }, []);

  const resetState = () => { setError(''); };
  const switchMode = (m) => { setAuthMode(m); resetState(); };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError('');
    const norm = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Password must contain at least 6 characters.');
    if (authMode === 'signup' && !name.trim()) return setError('Please enter your full name.');

    setLoading(true);
    try {
      const res = authMode === 'signup'
        ? await api.register({ name: name.trim(), email: norm, password })
        : await api.login({ email: norm, password });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || (authMode === 'signup' ? 'Registration failed' : 'Sign in failed'));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError('');
    if (!isGoogleAuthConfigured()) return setError('Google sign-in is not connected yet.');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result && result.idToken) {
        const res = await api.loginWithGoogle(result.idToken);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain') || msg.includes('Illegal url') || msg.includes('unauthorized domain')) {
        setError('Authorized domain missing: Please add "nexora-ai-imdeepx11.vercel.app" in Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (code === 'auth/api-key-not-valid' || msg.includes('api-key-not-valid')) {
        setError('Firebase API Key is invalid or restricted. Please verify VITE_FIREBASE_API_KEY in Vercel environment variables.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed popup, clear loading state cleanly
      } else {
        setError(msg || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const demo = async () => {
    setEmail('demo@deepflow.ai'); setPassword('demo123'); setError(''); setLoading(true);
    try {
      const res = await api.login({ email: 'demo@nexora.ai', password: 'demo123' });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecovery = () => {
    setRecoveryEmail(email || ''); setRecoveryStep(1); setRecoveryCode(''); setRecoveryToken('');
    setGeneratedResetLink(''); setEmailSent(true); setNewPassword(''); setRecoveryError(''); setRecoverySuccess('');
    setRecoveryOpen(true);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault(); setRecoveryError('');
    const norm = recoveryEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) return setRecoveryError('Please enter a valid email address.');
    setRecoveryLoading(true);
    try {
      const res = await api.forgotPassword(norm);
      setRecoveryStep(2); setRecoveryCode(''); setRecoveryToken(res.reset_token || '');
      setGeneratedResetLink(res.reset_link || ''); setEmailSent(res.email_sent !== false);
      setRecoverySuccess(res.message || `Password reset link generated for ${norm}.`);
    } catch (err) {
      setRecoveryError(err.message || 'Could not send verification code.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setRecoveryError('');
    if (!newPassword || newPassword.length < 6) return setRecoveryError('Password must contain at least 6 characters.');
    if (!recoveryToken && (!recoveryCode || recoveryCode.trim().length !== 6)) return setRecoveryError('Please enter a 6-digit verification code.');
    setRecoveryLoading(true);
    try {
      if (recoveryToken) {
        await api.resetPasswordWithToken(recoveryToken, newPassword);
      } else {
        await api.resetPassword(recoveryEmail.trim().toLowerCase(), recoveryCode.trim(), newPassword);
      }
      setRecoveryStep(3); setRecoverySuccess('Password reset successfully!');
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
            <button className="brand-block login-brand" type="button" aria-label="NEXORA AI">
              <span className="brand-mark"><Sparkles size={18} /></span>
              <span className="brand-copy">
                <span className="brand-name">NEXORA</span>
                <span className="brand-subtitle">Intelligent Documents,<br />Smarter Workflows</span>
              </span>
            </button>
            <button className="header-icon-btn login-theme-button" type="button" onClick={onToggleDarkMode} aria-label="Toggle dark mode">
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
            <div className="page-kicker">{authMode === 'signin' ? 'WELCOME BACK' : 'CREATE AN ACCOUNT'}</div>
            <h2>{authMode === 'signin' ? 'Sign in.' : 'Register.'}</h2>
            <p>{authMode === 'signin' ? 'Use your email or continue with Google.' : 'Create your account to start managing document workflows.'}</p>

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="google-login" type="button" onClick={googleLogin} disabled={busy}>
              <GoogleMark />
              <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>

            <div className="login-divider">
              <span>{authMode === 'signin' ? 'or continue with email' : 'or sign up with email'}</span>
            </div>

            <form className="login-form" onSubmit={handleSubmitEmail} noValidate>
              {authMode === 'signup' && (
                <label>
                  <span className="login-label">Full Name</span>
                  <div className="login-field"><UserIcon size={15} /><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Deepak Gupta" required /></div>
                </label>
              )}
              <label>
                <span className="login-label">Email address</span>
                <div className="login-field"><Mail size={15} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="login-label" style={{ marginBottom: 0 }}>Password</span>
                  {authMode === 'signin' && (
                    <button type="button" onClick={handleOpenRecovery} style={{ background: 'none', border: 'none', color: '#8e6b32', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="login-field"><Lock size={15} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required /></div>
              </label>

              <button className="primary-btn login-submit" type="submit" disabled={busy}>
                <span>{loading ? (authMode === 'signin' ? 'Signing in…' : 'Creating account…') : (authMode === 'signin' ? 'Sign in' : 'Create Account')}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="login-toggle-footer">
              {authMode === 'signin' ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode('signup')}>Create Account</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in</button></>
              )}
            </div>

            <button className="demo-link" type="button" onClick={demo} disabled={busy}>
              <Sparkles size={13} /> Use demo account
            </button>
          </div>
        </section>
      </div>

      <PasswordRecoveryModal
        isOpen={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        recoveryStep={recoveryStep}
        setRecoveryStep={setRecoveryStep}
        recoveryEmail={recoveryEmail}
        setRecoveryEmail={setRecoveryEmail}
        recoveryCode={recoveryCode}
        setRecoveryCode={setRecoveryCode}
        recoveryToken={recoveryToken}
        setRecoveryToken={setRecoveryToken}
        generatedResetLink={generatedResetLink}
        emailSent={emailSent}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        recoveryLoading={recoveryLoading}
        recoveryError={recoveryError}
        recoverySuccess={recoverySuccess}
        onRequestCode={handleRequestCode}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
