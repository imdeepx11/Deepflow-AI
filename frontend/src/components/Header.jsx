import React from 'react';
import { Search, Bell, Calendar, ChevronDown } from 'lucide-react';

export default function Header({ pageTitle, onOpenUpload, user, provider = 'demo' }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search documents, workflows, or anything..."
          className="w-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] text-xs rounded-lg pl-9 pr-16 py-2 focus:bg-white focus:border-[#00A859] outline-none transition-all"
        />
        <div className="absolute right-2.5 top-2 bg-white border border-[#CBD5E1] rounded px-1.5 py-0.5 text-[10px] text-[#64748B] font-mono shadow-2xs">
          Ctrl + K
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00A859]" />
        </button>

        {/* Date Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-[#00A859]" />
          <span>{currentDate}</span>
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] p-1 pr-3 rounded-lg cursor-pointer hover:border-[#CBD5E1] transition-colors">
          <img
            src={user?.avatar || '/admin_avatar.jpg'}
            alt="Deepak Gupta"
            className="w-7 h-7 rounded-full object-cover border border-[#00A859]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://ui-avatars.com/api/?name=Deepak+Gupta&background=00A859&color=fff';
            }}
          />
          <div className="text-left text-xs">
            <span className="font-bold text-[#0F172A] block leading-tight">{user?.name || 'Deepak Gupta'}</span>
            <span className="text-[10px] text-[#64748B] block leading-tight">{user?.role || 'Admin'}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] ml-1" />
        </div>
      </div>
    </header>
  );
}
