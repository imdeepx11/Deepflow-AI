import React from 'react';
import { Search, Bell, Calendar, ChevronDown, Sun, Moon } from 'lucide-react';

export default function Header({ pageTitle, onOpenUpload, user, theme, onToggleTheme }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userRole = user?.role || 'Admin';
  const firstLetter = (user?.email || userName)[0].toUpperCase();

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search documents, workflows, or anything..."
          className="w-full bg-[#F1F5F9] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] placeholder:text-[#94A3B8] text-xs rounded-lg pl-9 pr-16 py-2 focus:bg-white dark:focus:bg-[#121212] focus:border-[#00A859] outline-none transition-all"
        />
        <div className="absolute right-2.5 top-2 bg-white dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#333] rounded px-1.5 py-0.5 text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-mono shadow-2xs">
          Ctrl + K
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-[#F59E0B]" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#6366F1]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00A859]" />
        </button>

        {/* Date Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#475569] dark:text-[#A1A1AA] bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#2A2A2A] px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-[#00A859]" />
          <span>{currentDate}</span>
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#2A2A2A] p-1 pr-3 rounded-lg cursor-pointer hover:border-[#CBD5E1] dark:hover:border-[#3A3A3A] transition-colors">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={userName}
              className="w-7 h-7 rounded-full object-cover border border-[#00A859]"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#00A859] text-white font-extrabold text-xs flex items-center justify-center border border-[#00A859]">
              {firstLetter}
            </div>
          )}
          <div className="text-left text-xs">
            <span className="font-bold text-[#0F172A] dark:text-[#F5F5F5] block leading-tight">{userName}</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] block leading-tight">{userRole}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-[#A1A1AA] ml-1" />
        </div>
      </div>
    </header>
  );
}
