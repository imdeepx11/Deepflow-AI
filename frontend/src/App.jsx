import React, { useEffect, useState } from 'react';
import './App.css';
import './ledger-overrides.css';
import './dark-mode.css';
import './search-dark.css';
import './desktop-density.css';
import './workspace-sidebar.css';
import './contact-modal-fix.css';
import Header from './components/Header';
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

const SESSION_USER_KEY = 'deepflow_user_session';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      // The old implementation persisted login in localStorage, which caused
      // the app to bypass the login screen on later visits. Remove that legacy
      // value and keep authentication only for the current browser tab/session.
      localStorage.removeItem('deepflow_user');
      return JSON.parse(sessionStorage.getItem(SESSION_USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('deepflow_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.add('deepflow-editorial');
    localStorage.setItem('deepflow_theme', darkMode ? 'dark' : 'light');
    return () => document.body.classList.remove('deepflow-editorial');
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

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(v => !v)} />;

  return (
    <div className="editorial-app">
      <Header
        pageTitle={PAGE_TITLES[currentPage] || 'DeepFlow AI'}
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
