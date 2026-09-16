import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(1);
  const [theme, setTheme] = useState(localStorage.getItem('deepflow_theme') || localStorage.getItem('intelliflow_theme') || 'dark');

  // Initialize user as null so visitors always land on the Login page first


  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('deepflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('deepflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('deepflow_user');
    localStorage.removeItem('intelliflow_user');
  };

  const handleNavigateToAnalyzer = (docId) => {
    if (docId) setSelectedDocId(docId);
    setCurrentPage('analyzer');
  };

  const handleUploadSuccess = (newDocId) => {
    setSelectedDocId(newDocId);
    setCurrentPage('analyzer');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const pageTitles = {
    dashboard: 'Enterprise Dashboard',
    documents: 'Document Library',
    analyzer: 'AI Document Analyzer',
    workflows: 'Workflow Automation & Rules',
    analytics: 'Analytics & Process Intelligence',
    audit: 'Audit & Compliance Logs',
    settings: 'Settings & AI Configurations'
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-[#0F172A] dark:text-[#F5F5F5] transition-colors">
      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pageTitle={pageTitles[currentPage] || 'Dashboard'}
          onOpenUpload={() => setUploadModalOpen(true)}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              user={user}
              onNavigateToAnalyzer={handleNavigateToAnalyzer}
              onNavigateToDocuments={() => setCurrentPage('documents')}
              onOpenUpload={() => setUploadModalOpen(true)}
            />
          )}

          {currentPage === 'documents' && (
            <Documents
              onNavigateToAnalyzer={handleNavigateToAnalyzer}
              onOpenUpload={() => setUploadModalOpen(true)}
            />
          )}

          {currentPage === 'analyzer' && (
            <DocumentAnalyzer
              docId={selectedDocId}
            />
          )}

          {currentPage === 'workflows' && <Workflows />}

          {currentPage === 'analytics' && <Analytics />}

          {currentPage === 'audit' && <AuditLogs />}

          {currentPage === 'settings' && <Settings />}
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        user={user}
      />
    </div>
  );
}
