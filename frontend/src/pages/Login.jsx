import React, { useState } from 'react';
import { Sparkles, Shield, Cpu, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('demo@deepflow.ai');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
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
    try {
      const res = await api.login({ email: 'demo@deepflow.ai', password: 'demo123' });
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Grids & Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00C853]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00C853]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-[#0D0D0D] border border-[#242424] rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-2 relative z-10">
        
        {/* Left Side - Branding & Features */}
        <div className="p-10 bg-gradient-to-br from-[#0D0D0D] via-[#121212] to-[#050505] border-r border-[#242424] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#00C853]/15 border border-[#00C853]/40 flex items-center justify-center text-[#00C853] shadow-[0_0_20px_rgba(0,200,83,0.3)]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">DeepFlow <span className="text-[#00C853]">AI</span></h1>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Enterprise Automation</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Intelligent Documents. <span className="text-[#00C853]">Smarter Workflows.</span>
              </h2>
              <p className="text-xs text-[#86EFAC] font-semibold leading-relaxed">
                AI-powered document intelligence and workflow automation for modern enterprises.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-xs text-[#F5F5F5]">
                <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                <span>Automated PDF, DOCX, and TXT Extraction</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F5F5F5]">
                <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                <span>AI Risk Assessment & SLA Priority Scoring</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F5F5F5]">
                <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                <span>Rule-Based Workflow Signoff & Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#242424]/60 text-[11px] text-[#A1A1AA]">
            Designed for Enterprise Architecture Benchmark • Built with FastAPI & React
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="p-10 flex flex-col justify-center bg-[#0D0D0D]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Sign In to Dashboard</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">Enter your enterprise credentials or use Demo Account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@deepflow.ai"
                  className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#00C853] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#00C853] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 text-[#A1A1AA] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-[#242424] bg-[#121212] text-[#00C853] focus:ring-0" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[#00C853] hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00C853] hover:bg-[#22C55E] text-black font-bold text-xs py-3 rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(0,200,83,0.3)] flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign In Button */}
          <div className="mt-6 pt-6 border-t border-[#242424] text-center">
            <p className="text-xs text-[#A1A1AA] mb-3">Testing without backend infrastructure?</p>
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full bg-[#121212] hover:bg-[#242424] border border-[#00C853]/40 text-[#00C853] font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-[#00C853]" />
              <span>Use Demo Account (demo@deepflow.ai)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
