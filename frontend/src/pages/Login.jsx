import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, CheckCircle2, Cpu } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('demo@deepflow.ai');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValidEmail = (emailStr) => {
    // Regex for standard email format username@domain.extension (e.g. user@gmail.com, name@company.org)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g., name@gmail.com or name@company.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email: cleanEmail, password });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleUseDemo = async () => {
    setEmail('demo@deepflow.ai');
    setPassword('demo123');
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email: 'demo@deepflow.ai', password: 'demo123' });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00A859]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00A859]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xl grid md:grid-cols-2 relative z-10">
        
        {/* Left Side - Enterprise Branding */}
        <div className="p-10 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#DCFCE7]/30 border-r border-[#E2E8F0] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#00A859] flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  DeepFlow <span className="text-[#00A859]">AI</span>
                </h1>
                <p className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Enterprise Automation</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <h2 className="text-3xl font-extrabold text-[#0F172A] leading-tight">
                Intelligent Documents. <br />
                <span className="text-[#00A859]">Smarter Workflows.</span>
              </h2>
              <p className="text-sm text-[#475569] font-medium leading-relaxed">
                AI-powered document intelligence and workflow automation for modern enterprises.
              </p>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                </div>
                <span>Automated PDF, DOCX, and TXT Extraction</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                </div>
                <span>AI Risk Assessment & SLA Priority Scoring</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                </div>
                <span>Rule-Based Workflow Signoff & Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E2E8F0] text-[11px] text-[#64748B] font-medium">
            DeepFlow AI • Built with FastAPI & React Enterprise Architecture
          </div>
        </div>

        {/* Right Side - Login Form Card */}
        <div className="p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-[#0F172A]">Sign In to Dashboard</h3>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Enter your enterprise credentials or use the demo account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#DC2626] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@deepflow.ai"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] text-xs rounded-lg pl-10 pr-3.5 py-2.5 focus:bg-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] text-xs rounded-lg pl-10 pr-3.5 py-2.5 focus:bg-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 text-[#64748B] cursor-pointer font-medium">
                <input type="checkbox" defaultChecked className="rounded border-[#CBD5E1] text-[#00A859] focus:ring-0" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[#00A859] font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A859] hover:bg-[#009650] text-white font-bold text-xs py-3 rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign In Button */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B] font-medium mb-3">Instant Demo Access</p>
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-[#15803D] font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Cpu className="w-4 h-4 text-[#15803D]" />
              <span>Use Demo Account (demo@deepflow.ai)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
