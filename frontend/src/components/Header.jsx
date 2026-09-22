import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Calendar, 
  Sun, 
  Moon, 
  CheckCheck, 
  FileText, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Mail, 
  Send, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../api';

export default function Header({ pageTitle, onOpenUpload, user, theme, onToggleTheme, onNavigateToAnalyzer }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Contact form state
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

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
    }
  ]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const docs = await api.getDocuments({ search: searchQuery });
        setSearchResults(docs);
        setSearchOpen(true);
      } catch (err) {
        console.error("Header search error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactLoading(true);
    
    // Construct mailto link fallback & trigger confirmation
    const mailtoUrl = `mailto:support@deepflow.ai?subject=${encodeURIComponent(contactSubject || 'DeepFlow AI Query')}&body=${encodeURIComponent(contactMessage)}`;
    window.open(mailtoUrl, '_blank');
    
    setTimeout(() => {
      setContactLoading(false);
      setContactSent(true);
      setTimeout(() => {
        setContactSent(false);
        setContactOpen(false);
        setContactSubject('');
        setContactMessage('');
      }, 2000);
    }, 500);
  };

  return (
    <header className="h-16 border-b border-[#E2E8F0] dark:border-[#242424] bg-white/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Search Input Bar with Working Overlay Dropdown */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setSearchOpen(true)}
          placeholder="Search documents, workflows, or keywords..."
          className="w-full bg-[#F1F5F9] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] placeholder:text-[#94A3B8] text-xs rounded-lg pl-9 pr-8 py-2 focus:bg-white dark:focus:bg-[#121212] focus:border-[#00A859] outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
            className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Search Results Floating Dropdown */}
        {searchOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#E2E8F0] dark:border-[#242424] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase">
                Search Results ({searchResults.length})
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#242424]">
              {searchResults.length > 0 ? (
                searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (onNavigateToAnalyzer) onNavigateToAnalyzer(doc.id);
                      setSearchOpen(false);
                    }}
                    className="p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#181818] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#00A859] shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-[#0F172A] dark:text-[#F5F5F5] block truncate">
                          {doc.original_filename || doc.name}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">
                          {doc.type || 'Document'} • Status: {doc.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#00A859] bg-[#DCFCE7] dark:bg-[#00A859]/20 px-2 py-0.5 rounded">
                      Analyze
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
                  No matching documents found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Contact Us Button */}
        <button
          onClick={() => setContactOpen(true)}
          title="Contact Support"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#00A859] bg-[#DCFCE7] dark:bg-[#00A859]/20 border border-[#86EFAC] dark:border-[#00A859]/40 rounded-lg hover:bg-[#BBF7D0] transition-colors cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Contact Us</span>
        </button>

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

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-2xl shadow-2xl z-50 overflow-hidden">
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
                      className="p-3.5 flex items-start gap-3 transition-colors cursor-pointer bg-white dark:bg-[#121212] hover:bg-[#F8FAFC] dark:hover:bg-[#181818]"
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Date Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#475569] dark:text-[#A1A1AA] bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#2A2A2A] px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-[#00A859]" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Contact Us Modal (directing queries to support@deepflow.ai) */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#242424] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859]">
                  <Mail className="w-5 h-5 text-[#00A859]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F5F5F5]">Contact Support</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Direct support queries to <strong className="text-[#00A859]">support@deepflow.ai</strong></p>
                </div>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-[#DCFCE7] dark:bg-[#00A859]/20 rounded-full flex items-center justify-center text-[#00A859] mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-[#00A859]" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0F172A] dark:text-[#F5F5F5]">Message Sent!</h4>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Your query has been dispatched to <strong>support@deepflow.ai</strong>.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#334155] dark:text-[#A1A1AA] mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="E.g., Query regarding invoice workflow..."
                    className="w-full bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#00A859]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] dark:text-[#A1A1AA] mb-1">Your Message / Query</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] text-xs rounded-lg p-3 outline-none focus:border-[#00A859] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#64748B] dark:text-[#A1A1AA] hover:bg-[#F1F5F9] dark:hover:bg-[#242424] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactLoading ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
