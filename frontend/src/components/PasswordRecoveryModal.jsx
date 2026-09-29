import React from 'react';
import { ArrowRight, CheckCircle2, KeyRound, Lock, Mail, Sparkles, X, Loader2, ExternalLink } from 'lucide-react';

export default function PasswordRecoveryModal({
  isOpen,
  onClose,
  recoveryStep,
  setRecoveryStep,
  recoveryEmail,
  setRecoveryEmail,
  recoveryCode,
  setRecoveryCode,
  recoveryToken,
  setRecoveryToken,
  generatedResetLink,
  emailSent,
  newPassword,
  setNewPassword,
  recoveryLoading,
  recoveryError,
  recoverySuccess,
  onRequestCode,
  onResetPassword
}) {
  if (!isOpen) return null;

  return (
    <div className="editorial-modal-backdrop" role="presentation">
      <div className="editorial-modal" style={{ maxWidth: 440, borderRadius: 20, padding: '28px 28px 24px' }} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="page-kicker" style={{ color: '#a9814c', letterSpacing: '0.08em', fontWeight: 700 }}>PASSWORD RECOVERY</div>
            <h2 style={{ fontSize: 24, fontFamily: "'Eurostile', 'Eurostile Extended', 'Microgramma', 'Square 721', 'Exo 2', 'Orbitron', 'Rajdhani', sans-serif", margin: '4px 0 6px', color: '#1d2233' }}>
              {recoveryStep === 3 ? 'Password reset!' : 'Forgot your password?'}
            </h2>
          </div>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#5a6178', lineHeight: 1.5, margin: '0 0 16px' }}>
          {recoveryStep === 1 && 'Enter your account email to receive a password reset link and verification code.'}
          {recoveryStep === 2 && (recoveryToken ? 'Set a new password for your account using your verified reset link.' : 'Enter your 6-digit verification code or click your reset link below.')}
          {recoveryStep === 3 && 'Your password has been successfully updated. You can now close this window and sign in.'}
        </p>

        {recoveryError && <div className="login-error" style={{ marginBottom: 14 }} role="alert">{recoveryError}</div>}

        {recoverySuccess && recoveryStep !== 3 && (
          <div style={{ padding: '9px 12px', borderRadius: 10, background: '#eef8f2', border: '1px solid #c8e8d4', color: '#1f6b43', fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
            {recoverySuccess}
          </div>
        )}

        {recoveryStep === 1 && (
          <form onSubmit={onRequestCode}>
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
                <><Loader2 size={15} className="animate-spin" /> Generating link…</>
              ) : (
                <>Send reset link <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        )}

        {recoveryStep === 2 && (
          <form onSubmit={onResetPassword}>
            {generatedResetLink && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: '#fdf8ec', border: '1px solid #f3e6c8', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8e6b32', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Sparkles size={13} /> Direct Reset Link Available
                </div>
                <p style={{ fontSize: 11, color: '#665027', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {!emailSent
                    ? "Email delivery API is currently unconfigured or rate-limited. You can click below to reset your password directly using your generated reset link:"
                    : "A reset link has been dispatched to your email. You can also use the direct link button below to reset immediately:"}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const tokenFromUrl = generatedResetLink.split('reset_token=')[1];
                      setRecoveryToken(tokenFromUrl || recoveryToken);
                    }}
                    style={{
                      background: recoveryToken ? '#1f6b43' : '#1f4333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 16,
                      padding: '7px 14px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {recoveryToken ? '✓ Reset Link Active' : 'Use Direct Reset Link'}
                  </button>
                  <a
                    href={generatedResetLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#8e6b32', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Open Link in Tab <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {!recoveryToken && (
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span className="login-label" style={{ fontSize: 10, letterSpacing: '0.06em' }}>VERIFICATION CODE (6 DIGITS)</span>
                <div className="login-field" style={{ marginTop: 6 }}>
                  <KeyRound size={15} />
                  <input
                    type="text"
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                  />
                </div>
              </label>
            )}

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
              onClick={onClose}
              style={{ background: '#1f4333', color: '#fff', borderRadius: 24, padding: '10px 20px' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
