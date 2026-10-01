import React, { useEffect, useState } from 'react';
import './App.css';
import './ledger-overrides.css';
import './dark-mode.css';
import './search-dark.css';
import './desktop-density.css';
import './workspace-sidebar.css';
import './contact-modal-fix.css';
import './login-premium.css';
import Header from './components/Header';
import { pingBackendRoot } from './api';
import UploadModal from './components/UploadModal';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentAnalyzer from './pages/DocumentAnalyzer';
import Workflows from './pages/Workflows';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

const PAGE_TITLES = {
  dashboard: 'Overview',
  documents: 'Documents',
  analyzer: 'AI Document Analyzer',
  workflows: 'Workflows',
  analytics: 'Analytics',
  audit: 'Audit Trail',
  settings: 'Settings'
};

const SESSION_USER_KEY = 'nexora_user_session';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      localStorage.removeItem('nexora_user');
      localStorage.removeItem('deepflow_user');
      return JSON.parse(sessionStorage.getItem(SESSION_USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('nexora_theme') || localStorage.getItem('deepflow_theme')) === 'dark');
  const [serverReady, setServerReady] = useState(false);

  // Pre-warm the backend the moment the app loads.
  // Polls every 5 s until the server returns 200 OK (up to 90 s).
  // Only then sets serverReady=true so sign-in buttons are safe to use.
  useEffect(() => {
    let cancelled = false;
    async function warmUp() {
      const MAX_ATTEMPTS = 18; // 18 × 5s = 90 seconds max
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        const ok = await pingBackendRoot();
        if (ok) {
          if (!cancelled) setServerReady(true);
          return;
        }
        // Wait 5 seconds before next attempt
        await new Promise((r) => setTimeout(r, 5000));
      }
      // After 90s give up waiting and let user try anyway
      if (!cancelled) setServerReady(true);
    }
    warmUp();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.add('nexora-editorial');
    localStorage.setItem('nexora_theme', darkMode ? 'dark' : 'light');
    return () => document.body.classList.remove('nexora-editorial');
  }, [darkMode]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem('deepflow_user');
  };

  const navigateToAnalyzer = (docId) => {
    setSelectedDocId(docId);
    setCurrentPage('analyzer');
  };

  const handleUploadSuccess = (docId) => {
    setSelectedDocId(docId);
    setCurrentPage('analyzer');
  };

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(v => !v)} serverReady={serverReady} />;

  return (
    <div className="editorial-app">
      <Header
        pageTitle={PAGE_TITLES[currentPage] || 'NEXORA AI'}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenUpload={() => setUploadModalOpen(true)}
        user={user}
        onNavigateToAnalyzer={navigateToAnalyzer}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(v => !v)}
      />

      <main className="editorial-main">
        {currentPage === 'dashboard' && (
          <Dashboard
            user={user}
            onNavigateToAnalyzer={navigateToAnalyzer}
            onNavigateToDocuments={() => setCurrentPage('documents')}
            onOpenUpload={() => setUploadModalOpen(true)}
          />
        )}
        {currentPage === 'documents' && (
          <Documents
            user={user}
            onNavigateToAnalyzer={navigateToAnalyzer}
            onOpenUpload={() => setUploadModalOpen(true)}
          />
        )}
        {currentPage === 'analyzer' && (
          <DocumentAnalyzer
            docId={selectedDocId}
            onNavigateToDocuments={() => setCurrentPage('documents')}
          />
        )}
        {currentPage === 'workflows' && <Workflows />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'audit' && <AuditLogs />}
        {currentPage === 'settings' && <Settings user={user} />}
      </main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        user={user}
      />
    </div>
  );
}
