import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  Copy, 
  Check, 
  Zap, 
  ArrowRight, 
  UserCheck, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  XCircle,
  FileCheck
} from 'lucide-react';
import { api } from '../api';
import ApprovalModal from '../components/ApprovalModal';

export default function DocumentAnalyzer({ docId }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  
  // Approval modal state & Toast
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [initialAction, setInitialAction] = useState('Approve');
  const [toastMessage, setToastMessage] = useState(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (docId) {
      loadDocumentDetails(docId);
    }
  }, [docId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const loadDocumentDetails = async (id) => {
    setLoading(true);
    try {
      const data = await api.getDocument(id);
      setDoc(data);
      setChatMessages([
        { sender: 'ai', text: `Hello! I have analyzed **${data.original_filename}**. Ask me any question regarding its extracted fields, terms, or risk flags!` }
      ]);
    } catch (err) {
      console.error("Load doc analyzer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!doc) return;
    setAnalyzing(true);
    try {
      await api.analyzeDocument(doc.id);
      await loadDocumentDetails(doc.id);
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (doc?.analysis?.summary) {
      navigator.clipboard.writeText(doc.analysis.summary.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const handleOpenActionModal = (actionType) => {
    setInitialAction(actionType);
    setApprovalModalOpen(true);
  };

  const handleDecisionSuccess = (message) => {
    setToastMessage(message || `${doc?.original_filename} decision processed successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
    loadDocumentDetails(doc.id);
  };

  const handleSendChat = async (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || !doc) return;

    const userMsg = { sender: 'user', text: q };
    setChatMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setChatLoading(true);

    try {
      const res = await api.chatWithDoc(doc.id, q);
      setChatMessages(prev => [...prev, { sender: 'ai', text: res.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "I couldn't find this information in the document." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 text-[#64748B] dark:text-[#A1A1AA]">
        <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] animate-pulse">
          <Cpu className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold tracking-wide text-[#0F172A] dark:text-[#F5F5F5]">AI Engine processing document structure & decision models...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center text-[#64748B] dark:text-[#A1A1AA]">
        <p>No document selected. Please select a document from the Documents library.</p>
      </div>
    );
  }

  const analysis = doc.analysis;
  const confidencePercent = Math.round((doc.confidence || 0.94) * 100);

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto bg-[#F8FAFC] dark:bg-[#050505] min-h-screen transition-colors relative">
      
      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00A859] text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] shrink-0 shadow-2xs">
            <Cpu className="w-5 h-5 text-[#00A859]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#F5F5F5] flex items-center gap-2">
              {doc.original_filename}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80] font-semibold">
                {analysis?.document_type || 'Invoice'}
              </span>
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Uploaded by <strong className="text-[#0F172A] dark:text-[#F5F5F5]">{doc.uploaded_by || 'User'}</strong> • File Size: {(doc.file_size ? (doc.file_size / 1024).toFixed(1) : 48)} KB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 bg-[#F1F5F9] dark:bg-[#1E1E1E] hover:bg-[#E2E8F0] dark:hover:bg-[#2A2A2A] border border-[#CBD5E1] dark:border-[#333] text-[#0F172A] dark:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[#00A859]" />}
            <span>{analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}</span>
          </button>

          <button
            onClick={() => handleOpenActionModal('Approve')}
            className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Document</span>
          </button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE (5 Columns): Document Preview & Extracted Text */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-2xs">
            {/* Left Header */}
            <div className="p-4 border-b border-[#E2E8F0] dark:border-[#242424] bg-[#F8FAFC] dark:bg-[#141414] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F172A] dark:text-[#F5F5F5]">
                <FileText className="w-4 h-4 text-[#00A859]" />
                <span>Document Preview</span>
              </div>
              <span className="text-[10px] text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#00A859]/20 border border-[#BBF7D0] dark:border-[#00A859]/40 px-2 py-0.5 rounded-full font-semibold">
                {doc.file_type} • 1 Page
              </span>
            </div>

            {/* Extracted Text Content */}
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed whitespace-pre-wrap bg-white dark:bg-[#0F0F0F] select-text border-b border-[#E2E8F0] dark:border-[#242424]">
              {doc.extracted_text || "No text extracted from file."}
            </div>

            {/* Document metadata summary footer */}
            <div className="p-4 bg-[#F8FAFC] dark:bg-[#141414] flex justify-between items-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
              <span>Filename: <strong className="text-[#0F172A] dark:text-[#F5F5F5]">{doc.original_filename}</strong></span>
              <span>Status: <strong className="text-[#00A859]">{doc.status}</strong></span>
            </div>
          </div>

          {/* Interactive Document QA Chat */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00A859]" />
                <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-xs">Ask AI about this document</h3>
              </div>
              <span className="text-[10px] text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#00A859]/20 px-2 py-0.5 rounded-full font-semibold">Grounded Document QA</span>
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "What is the total amount?",
                "When is the payment due?",
                "What are the risks?",
                "Who needs to approve this?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(chip)}
                  className="text-[10px] bg-[#F1F5F9] dark:bg-[#1A1A1A] hover:bg-[#DCFCE7] dark:hover:bg-[#00A859]/20 text-[#475569] dark:text-[#A1A1AA] hover:text-[#15803D] dark:hover:text-[#4ADE80] border border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#BBF7D0] px-2.5 py-1 rounded-full transition-colors font-medium cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="h-44 overflow-y-auto space-y-2.5 p-3 bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#242424] rounded-xl text-xs scroll-smooth">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[90%] ${
                    msg.sender === 'user'
                      ? 'bg-[#0F172A] dark:bg-[#00A859] text-white ml-auto font-medium'
                      : 'bg-[#DCFCE7] dark:bg-[#1A1A1A] text-[#166534] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#2A2A2A] font-medium'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-[11px] text-[#00A859]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reading document content...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Type a question about this document..."
                className="flex-1 bg-[#F1F5F9] dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#0F172A] dark:text-[#F5F5F5] text-xs rounded-xl px-3 py-2.5 focus:border-[#00A859] outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-[#00A859] hover:bg-[#059669] text-white p-2.5 rounded-xl transition-all font-bold cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE (7 Columns): AI Intelligence Sections */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. DOCUMENT CLASSIFICATION */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Document Classification</span>
              <div className="text-xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] flex items-center gap-2">
                <span>{analysis?.document_type || 'Invoice'}</span>
                <span className="text-xs bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80] px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mb-1">AI Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-28 bg-[#E2E8F0] dark:bg-[#262626] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00A859] h-full" style={{ width: `${confidencePercent}%` }} />
                </div>
                <span className="font-mono font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-sm">{confidencePercent}%</span>
              </div>
            </div>
          </div>

          {/* 2. EXTRACTED INFORMATION GRID */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#A1A1AA]">Extracted Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis?.extracted_fields && Object.entries(analysis.extracted_fields).map(([key, val], idx) => {
                const displayVal = (val !== null && val !== undefined && String(val).trim() !== "" && String(val).trim().toLowerCase() !== "none") 
                  ? String(val) 
                  : "Not detected";
                return (
                  <div key={idx} className="bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#242424] p-3.5 rounded-xl flex flex-col justify-between hover:border-[#00A859]/50 transition-colors">
                    <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-medium">{key}</span>
                    <span className={`text-xs font-bold mt-1 font-mono truncate ${displayVal === "Not detected" ? "text-[#94A3B8] dark:text-[#64748B] italic font-normal" : "text-[#0F172A] dark:text-[#F5F5F5]"}`}>
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. AI RISK ASSESSMENT & PRIORITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Risk Assessment Box */}
            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-extrabold">AI Risk Assessment</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  analysis?.risk_level === 'HIGH' ? 'bg-[#FEE2E2] dark:bg-[#991B1B]/30 text-[#991B1B] dark:text-[#F87171]' :
                  analysis?.risk_level === 'MEDIUM' ? 'bg-[#FEF3C7] dark:bg-[#92400E]/30 text-[#92400E] dark:text-[#FBBF24]' :
                  'bg-[#DCFCE7] dark:bg-[#166534]/30 text-[#166534] dark:text-[#4ADE80]'
                }`}>
                  {analysis?.risk_level || 'MEDIUM'} RISK
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0F172A] dark:text-[#F5F5F5] font-mono">{analysis?.risk_score || 68}</span>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA]">/ 100 Risk Score</span>
              </div>

              {/* Detected Risks list */}
              <div className="space-y-2 pt-2 text-xs border-t border-[#E2E8F0] dark:border-[#242424]">
                {analysis?.risks?.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[#0F172A] dark:text-[#F5F5F5]">
                    {r.type === 'WARNING' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00A859] shrink-0 mt-0.5" />
                    )}
                    <span className="leading-tight font-medium">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Detection Box */}
            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-extrabold block mb-1">Priority Detection</span>
                <div className="text-2xl font-black text-[#0F172A] dark:text-[#F5F5F5] flex items-center gap-2">
                  <span className={
                    doc.priority === 'CRITICAL' || doc.priority === 'Critical' ? 'text-[#DC2626]' :
                    doc.priority === 'HIGH' || doc.priority === 'High' ? 'text-[#D97706]' :
                    'text-[#00A859]'
                  }>
                    {doc.priority || 'HIGH'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-2 leading-relaxed font-medium">
                  Reason: "{analysis?.priority_reason || 'High-value invoice requires manager approval.'}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#242424] text-[11px] text-[#64748B] dark:text-[#A1A1AA] flex justify-between">
                <span>Routing Priority</span>
                <span className="font-mono text-[#00A859] font-bold">Escalated</span>
              </div>
            </div>
          </div>

          {/* 4. AI DECISION CARD */}
          <div className="bg-[#DCFCE7] dark:bg-[#00A859]/15 border-2 border-[#00A859] dark:border-[#00A859]/50 p-6 rounded-2xl space-y-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#15803D] dark:text-[#4ADE80] animate-pulse" />
                <h3 className="font-extrabold text-[#15803D] dark:text-[#4ADE80] text-xs uppercase tracking-wider">AI DECISION — RECOMMENDED ACTION</h3>
              </div>
              <span className="text-xs font-mono text-[#166534] dark:text-[#86EFAC] bg-white dark:bg-[#141414] px-3 py-1 rounded-full border border-[#BBF7D0] dark:border-[#00A859]/30 font-bold">
                SLA: {analysis?.sla_hours || 24} Hours
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#15803D] dark:text-[#4ADE80] tracking-tight">
                {analysis?.recommended_action || 'FINANCE MANAGER APPROVAL'}
              </h2>
              <p className="text-xs text-[#166534] dark:text-[#86EFAC] mt-1 leading-relaxed font-semibold">
                Reason: "{analysis?.priority_reason || 'Invoice amount exceeds the standard ₹50,000 approval threshold.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-[#BBF7D0] dark:border-[#00A859]/30">
              <div>
                <span className="text-[#166534] dark:text-[#86EFAC] block">Department</span>
                <span className="font-bold text-[#0F172A] dark:text-[#F5F5F5]">{analysis?.department || 'Finance'}</span>
              </div>
              <div>
                <span className="text-[#166534] dark:text-[#86EFAC] block">Assigned Role</span>
                <span className="font-bold text-[#0F172A] dark:text-[#F5F5F5]">{analysis?.assigned_role || 'Finance Manager'}</span>
              </div>
              <div>
                <span className="text-[#166534] dark:text-[#86EFAC] block">Workflow Status</span>
                <span className="font-bold text-[#15803D] dark:text-[#4ADE80]">{doc.status}</span>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleOpenActionModal('Approve')}
                className="flex-1 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs py-3 rounded-xl transition-all text-center shadow-md active:scale-95 cursor-pointer"
              >
                APPROVE
              </button>
              <button
                onClick={() => handleOpenActionModal('Reject')}
                className="flex-1 bg-white dark:bg-[#1E1E1E] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#991B1B]/50 text-[#991B1B] dark:text-[#F87171] font-bold text-xs py-3 rounded-xl transition-all text-center cursor-pointer"
              >
                REJECT
              </button>
              <button
                onClick={() => handleOpenActionModal('Request Changes')}
                className="flex-1 bg-white dark:bg-[#1E1E1E] hover:bg-[#FEF3C7] dark:hover:bg-[#92400E]/40 border border-[#FCD34D] dark:border-[#92400E]/50 text-[#92400E] dark:text-[#FBBF24] font-bold text-xs py-3 rounded-xl transition-all text-center cursor-pointer"
              >
                REQUEST REVIEW
              </button>
            </div>
          </div>

          {/* 5. WORKFLOW VISUALIZATION */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-xs uppercase tracking-wider text-[#64748B] dark:text-[#A1A1AA]">
              DOCUMENT WORKFLOW
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-[#242424]">
              {doc.workflows?.[0]?.steps?.map((step, idx) => {
                const isCompleted = step.status === 'Completed';
                const isActive = step.status === 'Active';
                return (
                  <div key={step.id || idx} className="flex items-center justify-between relative pl-8">
                    <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-transform ${
                      isCompleted
                        ? 'bg-[#00A859] border-[#00A859] text-white'
                        : isActive
                        ? 'bg-[#22C55E] border-white text-white scale-110 shadow-md animate-pulse'
                        : 'bg-[#F1F5F9] dark:bg-[#1A1A1A] border-[#CBD5E1] dark:border-[#333] text-[#94A3B8]'
                    }`}>
                      {isCompleted ? '✓' : isActive ? '●' : '○'}
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold ${isActive ? 'text-[#00A859]' : isCompleted ? 'text-[#15803D] dark:text-[#4ADE80]' : 'text-[#0F172A] dark:text-[#F5F5F5]'}`}>
                        {step.step_name} {isActive && <span className="ml-2 text-[10px] bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#00A859]/30 px-2 py-0.5 rounded-full font-bold">CURRENT</span>}
                      </h4>
                      <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">Responsible: <strong className="text-[#0F172A] dark:text-[#F5F5F5]">{step.role}</strong> • Node: {step.node_type}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isCompleted ? 'bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80]' :
                      isActive ? 'bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#15803D] dark:text-[#4ADE80] border border-[#00A859]' :
                      'text-[#64748B] dark:text-[#A1A1AA] bg-[#F1F5F9] dark:bg-[#1E1E1E]'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. AI Executive Summary */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-5 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#A1A1AA]">AI Executive Summary</h3>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 text-xs text-[#00A859] hover:underline font-bold cursor-pointer"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#00A859]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            </div>

            <ul className="space-y-2 text-xs text-[#475569] dark:text-[#A1A1AA] list-disc list-inside leading-relaxed font-medium">
              {analysis?.summary?.map((bullet, idx) => (
                <li key={idx} className="text-[#0F172A] dark:text-[#F5F5F5]">{bullet}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Approval Modal Component */}
      <ApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        document={doc}
        initialAction={initialAction}
        onDecisionSuccess={handleDecisionSuccess}
      />
    </div>
  );
}
