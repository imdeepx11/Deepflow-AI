import React, { useEffect, useState } from 'react';
import './App.css';
import './editorial-premium.css';
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

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deepflow_user') || 'null');
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('deepflow-editorial');
    return () => document.body.classList.remove('deepflow-editorial');
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('deepflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
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

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

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
