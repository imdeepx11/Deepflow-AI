import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, FileText, LogOut, Mail, Moon, Search, Sparkles, Sun, X, ArrowUpRight } from 'lucide-react';
import { api } from '../api';

const NAV = [
  ['dashboard', 'Dashboard'],
  ['documents', 'Documents'],
  ['analyzer', 'AI Analyzer'],
  ['workflows', 'Workflows'],
  ['analytics', 'Analytics'],
  ['settings', 'Settings']
];

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

  return (
    <>
      <header className="editorial-header">
        <div className="editorial-header-inner">
          <button className="brand-block" onClick={() => setCurrentPage('dashboard')} aria-label="Go to dashboard">
            <span className="brand-mark"><Sparkles size={18} /></span>
            <span className="brand-copy">
              <span className="brand-name">DeepFlow</span>
              <span className="brand-subtitle">Intelligent Documents,<br />Smarter Workflows</span>
            </span>
          </button>

          <nav className="top-nav" aria-label="Primary navigation">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`nav-link ${currentPage === id ? 'active' : ''}`}
                onClick={() => setCurrentPage(id)}
              >
                {label}
              </button>
            ))}
          </nav>

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
                  <div className="popover-item"><span style={{fontSize:10,color:'var(--muted)'}}>No matching documents.</span></div>
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            <button
              className="contact-btn"
              type="button"
              onClick={() => setContactOpen(true)}
              title="Contact us"
              aria-label="Contact us"
            >
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
                  <button className="popover-item" type="button" onClick={() => { setCurrentPage('settings'); setProfileOpen(false); }}>Profile & settings <ArrowUpRight size={13} /></button>
                  <button className="popover-item" type="button" onClick={onLogout}><span className="popover-document"><LogOut size={13}/> Sign out</span></button>
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
            <p>For product questions, feedback, partnerships, or support, start a message from your email client.</p>
            <a className="primary-btn contact-mail-link" href="mailto:contact@deepflow.ai?subject=DeepFlow%20AI%20Enquiry" onClick={() => setContactOpen(false)}>
              <Mail size={14} /> Email DeepFlow
            </a>
            <div className="contact-note">Replace <strong>contact@deepflow.ai</strong> with your real support email before production.</div>
          </div>
        </div>
      )}
    </>
  );
}
