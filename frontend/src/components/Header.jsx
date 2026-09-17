import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, FileText, LogOut, Mail, Search, Sparkles, X, ArrowUpRight } from 'lucide-react';
import { api } from '../api';

const NAV = [
  ['dashboard', 'Home'],
  ['documents', 'Documents'],
  ['analyzer', 'AI Analyzer'],
  ['workflows', 'Workflows'],
  ['analytics', 'Analytics'],
  ['settings', 'Settings']
];

export default function Header({ currentPage, setCurrentPage, onOpenUpload, user, onNavigateToAnalyzer, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
    <header className="editorial-header">
      <div className="editorial-header-inner">
        <button className="brand-block" onClick={() => setCurrentPage('dashboard')} aria-label="Go to dashboard">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>
            <span className="brand-name">DeepFlow AI</span>
            <span className="brand-subtitle">Documents. Intelligence. Impact.</span>
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
            placeholder="Search documents, workflows..."
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
                <button
                  key={doc.id}
                  className="popover-item"
                  type="button"
                  onClick={() => {
                    onNavigateToAnalyzer(doc.id);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span style={{display:'flex',alignItems:'center',gap:10,minWidth:0,textAlign:'left'}}>
                    <FileText size={15} color="#214b3a" />
                    <span style={{minWidth:0}}>
                      <strong style={{display:'block',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{doc.original_filename || 'Document'}</strong>
                      <span style={{display:'block',fontSize:9,color:'#7b807a',marginTop:3}}>{doc.status || 'Uploaded'}</span>
                    </span>
                  </span>
                  <ArrowUpRight size={14} color="#8f7650" />
                </button>
              )) : (
                <div className="popover-item"><span style={{fontSize:10,color:'#777'}}>No matching documents.</span></div>
              )}
            </div>
          )}
        </div>

        <div className="header-actions">
          <button className="header-icon-btn" type="button" onClick={onOpenUpload} title="Upload document"><span style={{fontSize:17}}>＋</span></button>
          <div style={{position:'relative'}}>
            <button className="header-icon-btn" type="button" onClick={() => setNotificationsOpen(v => !v)} title="Notifications">
              <Bell size={16} />
              <span style={{position:'absolute',right:5,top:5,width:6,height:6,borderRadius:'50%',background:'#aa7a24'}} />
            </button>
            {notificationsOpen && (
              <div className="notification-popover">
                <div className="popover-head">Notifications</div>
                <div className="popover-item"><span><strong style={{fontSize:11}}>Invoice analysis complete</strong><small style={{display:'block',marginTop:3,color:'#777',fontSize:9}}>AI extraction is ready for review.</small></span></div>
                <div className="popover-item"><span><strong style={{fontSize:11}}>Workflow waiting</strong><small style={{display:'block',marginTop:3,color:'#777',fontSize:9}}>A finance approval needs attention.</small></span></div>
                <div className="popover-item"><span><strong style={{fontSize:11}}>Audit snapshot saved</strong><small style={{display:'block',marginTop:3,color:'#777',fontSize:9}}>Compliance trail updated.</small></span></div>
              </div>
            )}
          </div>

          <div ref={profileRef} style={{position:'relative'}}>
            <button className="header-user-btn" type="button" onClick={() => setProfileOpen(v => !v)}>
              <span className="avatar">{initials}</span>
              <span className="user-copy"><strong>{userName}</strong><span>{user?.role || 'Admin'}</span></span>
              <ChevronDown size={13} />
            </button>
            {profileOpen && (
              <div className="notification-popover" style={{width:190}}>
                <button className="popover-item" type="button" onClick={() => setCurrentPage('settings')}>Profile & settings <ArrowUpRight size={13}/></button>
                <button className="popover-item" type="button" onClick={onLogout}><span style={{display:'flex',alignItems:'center',gap:8}}><LogOut size={13}/> Sign out</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
