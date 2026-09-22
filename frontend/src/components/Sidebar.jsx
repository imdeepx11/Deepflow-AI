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
  Sparkles
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

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userRole = user?.role || 'Admin';
  const firstLetter = (user?.email || userName || 'U')[0]?.toUpperCase() || 'U';

  return (
    <aside className="w-64 bg-white dark:bg-[#0D0D0D] border-r border-[#E2E8F0] dark:border-[#242424] flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-sm z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E2E8F0] dark:border-[#242424] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A859] flex items-center justify-center text-white shadow-md shrink-0">
          <Sparkles className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-[#0F172A] dark:text-[#F5F5F5] tracking-tight flex items-center gap-1">
            DeepFlow <span className="text-[#00A859]">AI</span>
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-medium leading-tight">Intelligent Documents. Smarter Workflows.</p>
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80]'
                  : 'text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#15803D] dark:text-[#4ADE80]' : 'text-[#64748B] dark:text-[#A1A1AA]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-[#E2E8F0] dark:border-[#242424] bg-[#F8FAFC] dark:bg-[#121212]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border border-[#00A859] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#00A859] text-white font-extrabold text-sm flex items-center justify-center border border-[#00A859] shrink-0">
                {firstLetter}
              </div>
            )}
            <div className="truncate">
              <div className="text-xs font-bold text-[#0F172A] dark:text-[#F5F5F5] truncate">{userName}</div>
              <div className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-medium">{userRole}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#EF4444] dark:hover:text-[#EF4444] hover:bg-[#E2E8F0] dark:hover:bg-[#242424] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
