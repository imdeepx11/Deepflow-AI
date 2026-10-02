import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Moon, Sparkles, Sun, User as UserIcon } from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  signInWithGoogle,
  sendFirebasePasswordReset,
  sendFirebaseEmailVerification,
  firebaseSignOut,
} from '../firebase-client';
import { api } from '../api';
import GoogleMark from '../components/GoogleMark';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }) {
  const [authMode, setAuthMode] = useState('signin');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Reset states
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const resetState = () => setError('');
  const switchMode = (m) => { setAuthMode(m); resetState(); };

  /**
   * Helper: after Firebase auth, sync user to backend and call onLoginSuccess
   */
  const syncWithBackend = async ({ idToken, displayName, email: userEmail }) => {
    const res = await api.loginWithGoogle(idToken, displayName, userEmail);
    onLoginSuccess(res.user);
  };

  /**
   * Email + Password Register
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const norm = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Password must contain at least 6 characters.');
    if (!name.trim()) return setError('Please enter your full name.');

    setLoading(true);
    try {
      const result = await registerWithEmail(name.trim(), norm, password);
      await sendFirebaseEmailVerification();
      await firebaseSignOut();
      setPassword('');
      setError('Account created. Please verify your email from the verification link we sent before signing in.');
      setAuthMode('signin');
      return;
    } catch (err) {
      const msg = err.message?.includes('already') || err.message?.includes('Password')
        ? err.message
        : (firebaseErrorMessage(err) || 'Registration failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Email + Password Sign In
   */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const norm = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Password must contain at least 6 characters.');

    setLoading(true);
    try {
      const result = await loginWithEmail(norm, password);
      if (!result.user.emailVerified) {
        await firebaseSignOut();
        setError('Please verify your email address before signing in. Check your inbox for the verification link.');
        return;
      }
      await syncWithBackend(result);
      return;
    } catch (err) {
      const msg = err.message?.includes('Invalid') || err.message?.includes('password') || err.message?.includes('Account')
        ? err.message
        : (firebaseErrorMessage(err) || 'Invalid email or password. Please check your credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign In
   */
  const googleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        await syncWithBackend(result);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      const msg = firebaseErrorMessage(err) || err.message;
      setError(msg || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Firebase Password Reset Email
   */
  const handleSendReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const norm = resetEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(norm)) return setResetError('Please enter a valid email address.');

    setResetLoading(true);
    try {
      await sendFirebasePasswordReset(norm);
      setResetSuccess(`Password reset link sent to ${norm}. Please check your inbox (and spam folder).`);
    } catch (err) {
      const msg = firebaseErrorMessage(err);
      setResetError(msg || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOpenReset = () => {
    setResetEmail(email || '');
    setResetError('');
    setResetSuccess('');
    setResetOpen(true);
  };

  const busy = loading || googleLoading;

  return (
    <div className="login-page">
      <div className="login-shell premium-login-shell">
        {/* Left editorial panel */}
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
              {['PDF, DOCX and TXT extraction', 'Risk scoring and approval routing', 'Firebase-backed audit history'].map((item) => (
                <div key={item}><CheckCircle2 size={15} /><span>{item}</span></div>
              ))}
            </div>
          </div>

          <div className="login-credit">Developed and Designed by <strong>Deepak Gupta</strong></div>
        </section>

        {/* Right auth panel */}
        <section className="login-side premium-login-side">
          <div className="login-form-shell">
            <div className="page-kicker">{authMode === 'signin' ? 'WELCOME BACK' : 'CREATE AN ACCOUNT'}</div>
            <h2>{authMode === 'signin' ? 'Sign in.' : 'Register.'}</h2>
            <p>{authMode === 'signin' ? 'Use your email or continue with Google.' : 'Create your account to start managing document workflows.'}</p>

            {error && <div className="login-error" role="alert">{error}</div>}

            {/* Google & Demo Sign In */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="google-login" type="button" onClick={googleLogin} disabled={busy}>
                <GoogleMark />
                <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>

            </div>

            <div className="login-divider">
              <span>{authMode === 'signin' ? 'or continue with email' : 'or sign up with email'}</span>
            </div>

            {/* Email / Password form */}
            <form className="login-form" onSubmit={authMode === 'signup' ? handleRegister : handleSignIn} noValidate>
              {authMode === 'signup' && (
                <label>
                  <span className="login-label">Full Name</span>
                  <div className="login-field">
                    <UserIcon size={15} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Deepak Gupta"
                      required
                    />
                  </div>
                </label>
              )}
              <label>
                <span className="login-label">Email address</span>
                <div className="login-field">
                  <Mail size={15} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="login-label" style={{ marginBottom: 0 }}>Password</span>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleOpenReset}
                      style={{ background: 'none', border: 'none', color: '#8e6b32', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="login-field password-field">
                  <Lock size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button className="primary-btn login-submit" type="submit" disabled={busy}>
                <span>{loading ? (authMode === 'signin' ? 'Signing in…' : 'Creating account…') : (authMode === 'signin' ? 'Sign in' : 'Create Account')}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="login-toggle-footer">
              {authMode === 'signin' ? (
                <>Don&apos;t have an account? <button type="button" onClick={() => switchMode('signup')}>Create Account</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in</button></>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Password Reset Modal */}
      {resetOpen && (
        <div className="editorial-modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setResetOpen(false); }}>
          <div className="editorial-modal" style={{ maxWidth: 420, borderRadius: 20, padding: '28px 28px 24px' }} role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="page-kicker" style={{ color: '#a9814c', letterSpacing: '0.08em', fontWeight: 700 }}>PASSWORD RECOVERY</div>
                <h2 style={{ fontSize: 22, margin: '4px 0 6px', color: '#1d2233' }}>Forgot your password?</h2>
              </div>
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#666' }}
                aria-label="Close"
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: '#5a6178', lineHeight: 1.5, margin: '0 0 16px' }}>
              Enter your account email and we&apos;ll send a password reset link to your inbox.
            </p>

            {resetError && <div className="login-error" style={{ marginBottom: 14 }} role="alert">{resetError}</div>}

            {resetSuccess ? (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#eef8f2', border: '1px solid #c8e8d4', color: '#1f6b43', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                ✓ {resetSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendReset}>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span className="login-label" style={{ fontSize: 10, letterSpacing: '0.06em' }}>EMAIL ADDRESS</span>
                  <div className="login-field" style={{ marginTop: 6 }}>
                    <Mail size={15} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </label>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={resetLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', background: '#1f4333', color: '#fff', borderRadius: 24 }}
                >
                  {resetLoading ? 'Sending…' : <><span>Send reset link</span> <ArrowRight size={14} /></>}
                </button>
              </form>
            )}

            {resetSuccess && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => setResetOpen(false)}
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

/**
 * Convert Firebase Auth error codes to human-friendly messages.
 */
function firebaseErrorMessage(err) {
  const code = err?.code || '';
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/popup-blocked': 'Google sign-in popup was blocked. Please allow popups or allow the popup and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Console.',
    'auth/operation-not-allowed': 'Google Sign-In is disabled in Firebase Console.',
    'auth/api-key-not-valid': 'Firebase API key is invalid. Please check configuration.',
  };
  if (err?.message && err.message.includes('api-key-not-valid')) {
    return 'Firebase API key is invalid. Please check configuration.';
  }
  return messages[code] || err?.message || null;
}
