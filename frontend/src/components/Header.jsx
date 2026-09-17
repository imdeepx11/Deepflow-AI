import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, FileText, LogOut, Mail, Moon, Phone, Search, Sparkles, Sun, X, ArrowUpRight, LayoutDashboard, Files, ScanSearch, Workflow, ChartNoAxesCombined, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../api';

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['documents', 'Documents', Files],
  ['analyzer', 'AI Analyzer', ScanSearch],
  ['workflows', 'Workflows', Workflow],
  ['analytics', 'Analytics', ChartNoAxesCombined],
  ['settings', 'Settings', SettingsIcon]
];

const CONTACT_EMAIL = 'mrdeepak.g11@gmail.com';
const CONTACT_PHONE = '9458777101';

export default function Header({ currentPage, setCurrentPage, onOpenUpload, user, onNavigateToAnalyzer, onLogout, darkMode, onToggleDarkMode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const docs = await api.getDocuments({ search: searchQuery });
        setSearchResults(docs.slice(0, 6));
        setSearchOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const userName = user?.name || user?.email?.split('@')[0] || 'Administrator';
  const initials = userName.slice(0, 1).toUpperCase();
  const currentLabel = NAV.find(([id]) => id === currentPage)?.[1] || 'DeepFlow AI';

  return (
    <>
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <button className="sidebar-brand" type="button" onClick={() => setCurrentPage('dashboard')} aria-label="Go to dashboard">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span className="sidebar-brand-copy">
            <span className="brand-name">DeepFlow</span>
            <span className="brand-subtitle">Intelligent Documents,<br />Smarter Workflows</span>
          </span>
        </button>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={`sidebar-nav-link ${currentPage === id ? 'active' : ''}`}
              onClick={() => setCurrentPage(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-credit" aria-label="Project credit">
            Designed &amp; Developed by <strong>Deepak Gupta</strong>
          </div>
        </div>
      </aside>

      <header className="editorial-header">
        <div className="editorial-header-inner">
          <div className="topbar-page-context" aria-label="Current page">
            <span className="topbar-kicker">DeepFlow AI</span>
            <span className="topbar-current">{currentLabel}</span>
          </div>

          <div className="header-search" ref={searchRef}>
            <Search size={15} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => searchQuery && setSearchOpen(true)}
              placeholder="Search documents..."
              aria-label="Search documents"
            />
            {searchQuery && (
              <button className="clear-btn" type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
            {searchOpen && (
              <div className="search-popover">
                <div className="popover-head">Search results · {searchResults.length}</div>
                {searchResults.length ? searchResults.map((doc) => (
                  <button key={doc.id} className="popover-item" type="button" onClick={() => {
                    onNavigateToAnalyzer(doc.id);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}>
                    <span className="popover-document">
                      <FileText size={15} />
                      <span>
                        <strong>{doc.original_filename || 'Document'}</strong>
                        <small>{doc.status || 'Uploaded'}</small>
                      </span>
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                )) : (
                  <div className="popover-item"><span style={{ fontSize: 10, color: 'var(--muted)' }}>No matching documents.</span></div>
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            <button className="header-icon-btn" type="button" onClick={() => setContactOpen(true)} title="Contact us" aria-label="Contact us">
              <Mail size={16} />
            </button>

            <button className="header-icon-btn" type="button" onClick={onToggleDarkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button className="header-icon-btn" type="button" onClick={onOpenUpload} title="Upload document" aria-label="Upload document">
              <span className="plus-glyph">＋</span>
            </button>

            <div className="header-relative">
              <button className="header-icon-btn" type="button" onClick={() => setNotificationsOpen(v => !v)} title="Notifications" aria-label="Notifications">
                <Bell size={16} />
                <span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-head">Notifications</div>
                  <div className="popover-item"><span><strong>Invoice analysis complete</strong><small>AI extraction is ready for review.</small></span></div>
                  <div className="popover-item"><span><strong>Workflow waiting</strong><small>A finance approval needs attention.</small></span></div>
                  <div className="popover-item"><span><strong>Audit snapshot saved</strong><small>Compliance trail updated.</small></span></div>
                </div>
              )}
            </div>

            <div ref={profileRef} className="header-relative">
              <button className="header-user-btn" type="button" onClick={() => setProfileOpen(v => !v)}>
                <span className="avatar">{initials}</span>
                <span className="user-copy"><strong>{userName}</strong><span>{user?.role || 'Admin'}</span></span>
                <ChevronDown size={13} />
              </button>
              {profileOpen && (
                <div className="notification-popover profile-menu">
                  <button className="popover-item" type="button" onClick={() => { setCurrentPage('settings'); setProfileOpen(false); }}>Profile &amp; settings <ArrowUpRight size={13} /></button>
                  <button className="popover-item" type="button" onClick={onLogout}><span className="popover-document"><LogOut size={13} /> Sign out</span></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {contactOpen && (
        <div className="contact-backdrop" role="dialog" aria-modal="true" aria-label="Contact DeepFlow">
          <div className="contact-modal">
            <div className="contact-modal-head">
              <div>
                <div className="page-kicker">Contact us</div>
                <h2>Let's talk.</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setContactOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <p>For product questions, feedback, partnerships, or support, contact DeepFlow directly by email or phone.</p>
            <div className="contact-actions">
              <a className="primary-btn contact-mail-link" href={`mailto:${CONTACT_EMAIL}?subject=DeepFlow%20AI%20Enquiry`} onClick={() => setContactOpen(false)}>
                <Mail size={14} /> Email DeepFlow
              </a>
              <a className="secondary-btn contact-phone-link" href={`tel:${CONTACT_PHONE}`} onClick={() => setContactOpen(false)}>
                <Phone size={14} /> Call {CONTACT_PHONE}
              </a>
            </div>
            <div className="contact-note">Email: <strong>{CONTACT_EMAIL}</strong><br />Phone: <strong>{CONTACT_PHONE}</strong></div>
          </div>
        </div>
      )}
    </>
  );
}
