import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, CheckCircle2, Cpu, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('demo@deepflow.ai');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValidEmail = (emailStr) => {
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden transition-colors">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00A859]/5 dark:bg-[#00A859]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00A859]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl overflow-hidden shadow-xl grid md:grid-cols-2 relative z-10">
        
        {/* Left Side - Enterprise Branding */}
        <div className="p-10 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#DCFCE7]/30 dark:from-[#0D0D0D] dark:via-[#121212] dark:to-[#00A859]/10 border-r border-[#E2E8F0] dark:border-[#242424] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#00A859] flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">
                  DeepFlow <span className="text-[#00A859]">AI</span>
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">Enterprise Automation</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <h2 className="text-3xl font-extrabold text-[#0F172A] dark:text-white leading-tight">
                Intelligent Documents. <br />
                <span className="text-[#00A859]">Smarter Workflows.</span>
              </h2>
              <p className="text-sm text-[#475569] dark:text-[#A1A1AA] font-medium leading-relaxed">
                AI-powered document intelligence and workflow automation for modern enterprises.
              </p>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155] dark:text-[#E2E8F0]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                </div>
                <span>Automated PDF, DOCX, and TXT Extraction</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155] dark:text-[#E2E8F0]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                </div>
                <span>AI Risk Assessment & SLA Priority Scoring</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#334155] dark:text-[#E2E8F0]">
                <div className="w-5 h-5 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                </div>
                <span>Rule-Based Workflow Signoff & Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E2E8F0] dark:border-[#242424] text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-medium">
            DeepFlow AI • Fast, Secure & Multi-Modal Document Extraction
          </div>
        </div>

        {/* Right Side - Login Form Card */}
        <div className="p-10 flex flex-col justify-center bg-white dark:bg-[#0D0D0D]">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5]">Sign In to Dashboard</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 font-medium">Enter your enterprise credentials or use the demo account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] dark:bg-[#EF4444]/10 border border-[#FCA5A5] dark:border-[#EF4444]/30 rounded-xl text-xs text-[#DC2626] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#A1A1AA] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@deepflow.ai"
                  className="w-full bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#CBD5E1] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] placeholder:text-[#94A3B8] text-xs rounded-lg pl-10 pr-3.5 py-2.5 focus:bg-white dark:focus:bg-[#141414] focus:border-[#00A859] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#A1A1AA] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#CBD5E1] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] placeholder:text-[#94A3B8] text-xs rounded-lg pl-10 pr-10 py-2.5 focus:bg-white dark:focus:bg-[#141414] focus:border-[#00A859] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 text-[#64748B] dark:text-[#A1A1AA] cursor-pointer font-medium">
                <input type="checkbox" defaultChecked className="rounded border-[#CBD5E1] text-[#00A859] focus:ring-0" />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                onClick={() => alert("For demo access, click 'Use Demo Account' or use password 'demo123'.")}
                className="text-[#00A859] font-semibold hover:underline bg-transparent p-0 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs py-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign In Button */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0] dark:border-[#242424] text-center">
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-medium mb-3">Instant Demo Access</p>
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full bg-[#DCFCE7] dark:bg-[#00A859]/20 hover:bg-[#BBF7D0] dark:hover:bg-[#00A859]/30 border border-[#86EFAC] dark:border-[#00A859]/40 text-[#15803D] dark:text-[#4ADE80] font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Cpu className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80]" />
              <span>Use Demo Account (demo@deepflow.ai)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
