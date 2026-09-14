import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  GitMerge, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Sparkles,
  Lightbulb
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analyzer', label: 'AI Analyzer', icon: Cpu },
    { id: 'workflows', label: 'Workflows', icon: GitMerge },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-sm z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A859] flex items-center justify-center text-white shadow-md shrink-0">
          <Sparkles className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-[#0F172A] tracking-tight flex items-center gap-1">
            DeepFlow <span className="text-[#00A859]">AI</span>
          </h1>
          <p className="text-[11px] text-[#64748B] font-medium leading-tight">Intelligent Documents. Smarter Workflows.</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#15803D]' : 'text-[#64748B]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile & Promo Card */}
      <div className="p-4 space-y-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        {/* User Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || '/admin_avatar.jpg'}
              alt="Deepak Gupta"
              className="w-9 h-9 rounded-full object-cover border border-[#00A859] shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=Deepak+Gupta&background=00A859&color=fff';
              }}
            />
            <div className="truncate">
              <div className="text-xs font-bold text-[#0F172A] truncate">{user?.name || 'Deepak Gupta'}</div>
              <div className="text-[10px] text-[#64748B] font-medium">{user?.role || 'Admin'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#E2E8F0] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Green Promo Banner Card */}
        <div className="bg-[#DCFCE7] p-3 rounded-xl border border-[#BBF7D0] flex items-start gap-2.5">
          <Lightbulb className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#15803D]">AI-Powered Automation</h4>
            <p className="text-[10px] text-[#166534] leading-relaxed mt-0.5">
              Smarter documents. Faster decisions. Greater impact.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
