import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Calendar, ChevronDown, Sun, Moon, CheckCheck, FileText, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export default function Header({ pageTitle, onOpenUpload, user, theme, onToggleTheme }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Invoice INV-3337 Analyzed',
      description: 'AI extracted $93.50 total. Low risk detected.',
      time: '10m ago',
      unread: true,
      icon: Cpu,
      iconBg: 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#00A859]/20 dark:text-[#4ADE80]'
    },
    {
      id: 2,
      title: 'Workflow Signoff Required',
      description: 'Purchase Order PO-9021 awaiting approval.',
      time: '45m ago',
      unread: true,
      icon: FileText,
      iconBg: 'bg-[#FEF9C3] text-[#854D0E] dark:bg-[#FACC15]/20 dark:text-[#FACC15]'
    },
    {
      id: 3,
      title: 'Security Compliance Audit',
      description: 'Automated audit log backup completed.',
      time: '2h ago',
      unread: true,
      icon: ShieldAlert,
      iconBg: 'bg-[#E0F2FE] text-[#075985] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]'
    },
    {
      id: 4,
      title: 'System Initialized',
      description: 'DeepFlow AI enterprise engine online.',
      time: '1d ago',
      unread: false,
      icon: Sparkles,
      iconBg: 'bg-[#F1F5F9] text-[#475569] dark:bg-[#262626] dark:text-[#A1A1AA]'
    }
  ]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userRole = user?.role || 'Admin';
  const firstLetter = (user?.email || userName)[0].toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const markSingleAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id && n.unread) {
          setUnreadCount(c => Math.max(0, c - 1));
          return { ...n, unread: false };
        }
        return n;
      })
    );
  };

  return (
    <header className="h-16 border-b border-[#E2E8F0] dark:border-[#242424] bg-white/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
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
          className="p-2 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            className="relative p-2 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00A859] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D0D0D]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Floating Dropdown Menu */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-[#E2E8F0] dark:border-[#242424] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#181818]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00A859]" />
                  <h3 className="font-extrabold text-sm text-[#0F172A] dark:text-[#F5F5F5]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-[#00A859] hover:text-[#059669] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#242424]">
                {notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => markSingleAsRead(item.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        item.unread
                          ? 'bg-[#F8FAFC] dark:bg-[#161616] hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F]'
                          : 'bg-white dark:bg-[#121212] hover:bg-[#F8FAFC] dark:hover:bg-[#181818] opacity-75'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F5F5F5] truncate">{item.title}</h4>
                          <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B] shrink-0 font-medium">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#00A859] shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 border-t border-[#E2E8F0] dark:border-[#242424] bg-[#F8FAFC] dark:bg-[#181818] text-center">
                <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-medium">
                  DeepFlow AI System Alert Dispatcher
                </span>
              </div>
            </div>
          )}
        </div>

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
