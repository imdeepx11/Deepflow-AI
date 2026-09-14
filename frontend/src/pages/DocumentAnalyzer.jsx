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
        { sender: 'ai', text: `Hello Deepak! I have analyzed **${data.original_filename}**. Ask me any question regarding its extracted fields, terms, or risk flags!` }
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
      <div className="h-96 flex flex-col items-center justify-center space-y-4 text-[#64748B]">
        <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#00A859] animate-pulse">
          <Cpu className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold tracking-wide text-[#0F172A]">AI Engine processing document structure & decision models...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center text-[#64748B]">
        <p>No document selected. Please select a document from the Documents library.</p>
      </div>
    );
  }

  const analysis = doc.analysis;
  const confidencePercent = Math.round((doc.confidence || 0.94) * 100);

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto bg-[#F8FAFC] relative">
      
      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00A859] text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#00A859] shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              {doc.original_filename}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-semibold">
                {analysis?.document_type || 'Invoice'}
              </span>
            </h1>
            <p className="text-xs text-[#64748B]">Uploaded by <strong className="text-[#0F172A]">{doc.uploaded_by}</strong> • File Size: {(doc.file_size / 1024).toFixed(1)} KB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[#00A859]" />}
            <span>{analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}</span>
          </button>

          <button
            onClick={() => handleOpenActionModal('Approve')}
            className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
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
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-2xs">
            {/* Left Header */}
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F172A]">
                <FileText className="w-4 h-4 text-[#00A859]" />
                <span>Document Preview</span>
              </div>
              <span className="text-[10px] text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded-full font-semibold">
                {doc.file_type} • 1 Page
              </span>
            </div>

            {/* Extracted Text Content */}
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-[#1E293B] leading-relaxed whitespace-pre-wrap bg-white select-text border-b border-[#E2E8F0]">
              {doc.extracted_text || "No text extracted from file."}
            </div>

            {/* Document metadata summary footer */}
            <div className="p-4 bg-[#F8FAFC] flex justify-between items-center text-xs text-[#64748B]">
              <span>Filename: <strong className="text-[#0F172A]">{doc.original_filename}</strong></span>
              <span>Status: <strong className="text-[#00A859]">{doc.status}</strong></span>
            </div>
          </div>

          {/* Interactive Document QA Chat */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00A859]" />
                <h3 className="font-extrabold text-[#0F172A] text-xs">Ask AI about this document</h3>
              </div>
              <span className="text-[10px] text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full font-semibold">Grounded Document QA</span>
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
                  className="text-[10px] bg-[#F1F5F9] hover:bg-[#DCFCE7] text-[#475569] hover:text-[#15803D] border border-[#E2E8F0] hover:border-[#BBF7D0] px-2.5 py-1 rounded-full transition-colors font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="h-44 overflow-y-auto space-y-2.5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs scroll-smooth">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[90%] ${
                    msg.sender === 'user'
                      ? 'bg-[#0F172A] text-white ml-auto font-medium'
                      : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] font-medium'
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
                className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-xl px-3 py-2.5 focus:border-[#00A859] focus:bg-white outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-[#00A859] hover:bg-[#059669] text-white p-2.5 rounded-xl transition-all font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE (7 Columns): AI Intelligence Sections */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. DOCUMENT CLASSIFICATION */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Document Classification</span>
              <div className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <span>{analysis?.document_type || 'Invoice'}</span>
                <span className="text-xs bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-[#64748B] block mb-1">AI Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-28 bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00A859] h-full" style={{ width: `${confidencePercent}%` }} />
                </div>
                <span className="font-mono font-extrabold text-[#0F172A] text-sm">{confidencePercent}%</span>
              </div>
            </div>
          </div>

          {/* 2. EXTRACTED INFORMATION GRID */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider text-[#64748B]">Extracted Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis?.extracted_fields && Object.entries(analysis.extracted_fields).map(([key, val], idx) => {
                const displayVal = (val !== null && val !== undefined && String(val).trim() !== "" && String(val).trim().toLowerCase() !== "none") 
                  ? String(val) 
                  : "Not detected";
                return (
                  <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl flex flex-col justify-between hover:border-[#00A859]/50 transition-colors">
                    <span className="text-[11px] text-[#64748B] font-medium">{key}</span>
                    <span className={`text-xs font-bold mt-1 font-mono truncate ${displayVal === "Not detected" ? "text-[#94A3B8] italic font-normal" : "text-[#0F172A]"}`}>
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
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B] uppercase tracking-wider font-extrabold">AI Risk Assessment</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  analysis?.risk_level === 'HIGH' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                  analysis?.risk_level === 'MEDIUM' ? 'bg-[#FEF3C7] text-[#92400E]' :
                  'bg-[#DCFCE7] text-[#166534]'
                }`}>
                  {analysis?.risk_level || 'MEDIUM'} RISK
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0F172A] font-mono">{analysis?.risk_score || 68}</span>
                <span className="text-xs text-[#64748B]">/ 100 Risk Score</span>
              </div>

              {/* Detected Risks list */}
              <div className="space-y-2 pt-2 text-xs border-t border-[#E2E8F0]">
                {analysis?.risks?.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[#0F172A]">
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
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] uppercase tracking-wider font-extrabold block mb-1">Priority Detection</span>
                <div className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
                  <span className={
                    doc.priority === 'CRITICAL' || doc.priority === 'Critical' ? 'text-[#DC2626]' :
                    doc.priority === 'HIGH' || doc.priority === 'High' ? 'text-[#D97706]' :
                    'text-[#00A859]'
                  }>
                    {doc.priority || 'HIGH'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-medium">
                  Reason: "{analysis?.priority_reason || 'High-value invoice requires manager approval.'}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex justify-between">
                <span>Routing Priority</span>
                <span className="font-mono text-[#00A859] font-bold">Escalated</span>
              </div>
            </div>
          </div>

          {/* 4. AI DECISION CARD (HERO CARD — PROMINENT HIGHLIGHT) */}
          <div className="bg-[#DCFCE7] border-2 border-[#00A859] p-6 rounded-2xl space-y-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#15803D] animate-pulse" />
                <h3 className="font-extrabold text-[#15803D] text-xs uppercase tracking-wider">AI DECISION — RECOMMENDED ACTION</h3>
              </div>
              <span className="text-xs font-mono text-[#166534] bg-white px-3 py-1 rounded-full border border-[#BBF7D0] font-bold">
                SLA: {analysis?.sla_hours || 24} Hours
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#15803D] tracking-tight">
                {analysis?.recommended_action || 'FINANCE MANAGER APPROVAL'}
              </h2>
              <p className="text-xs text-[#166534] mt-1 leading-relaxed font-semibold">
                Reason: "{analysis?.priority_reason || 'Invoice amount exceeds the standard ₹50,000 approval threshold.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-[#BBF7D0]">
              <div>
                <span className="text-[#166534] block">Department</span>
                <span className="font-bold text-[#0F172A]">{analysis?.department || 'Finance'}</span>
              </div>
              <div>
                <span className="text-[#166534] block">Assigned Role</span>
                <span className="font-bold text-[#0F172A]">{analysis?.assigned_role || 'Finance Manager'}</span>
              </div>
              <div>
                <span className="text-[#166534] block">Workflow Status</span>
                <span className="font-bold text-[#15803D]">{doc.status}</span>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleOpenActionModal('Approve')}
                className="flex-1 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs py-3 rounded-xl transition-all text-center shadow-md active:scale-95"
              >
                APPROVE
              </button>
              <button
                onClick={() => handleOpenActionModal('Reject')}
                className="flex-1 bg-white hover:bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] font-bold text-xs py-3 rounded-xl transition-all text-center"
              >
                REJECT
              </button>
              <button
                onClick={() => handleOpenActionModal('Request Changes')}
                className="flex-1 bg-white hover:bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] font-bold text-xs py-3 rounded-xl transition-all text-center"
              >
                REQUEST REVIEW
              </button>
            </div>
          </div>

          {/* 5. WORKFLOW VISUALIZATION (Immediately below AI Decision Card) */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider text-[#64748B]">
              DOCUMENT WORKFLOW
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              {doc.workflows?.[0]?.steps?.map((step, idx) => {
                const isCompleted = step.status === 'Completed';
                const isActive = step.status === 'Active';
                return (
                  <div key={step.id || idx} className="flex items-center justify-between relative pl-8">
                    {/* Step Dot Icon: Green = completed, Bright green = current, Dark gray = pending */}
                    <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-transform ${
                      isCompleted
                        ? 'bg-[#00A859] border-[#00A859] text-white'
                        : isActive
                        ? 'bg-[#22C55E] border-white text-white scale-110 shadow-md animate-pulse'
                        : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8]'
                    }`}>
                      {isCompleted ? '✓' : isActive ? '●' : '○'}
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold ${isActive ? 'text-[#00A859]' : isCompleted ? 'text-[#15803D]' : 'text-[#0F172A]'}`}>
                        {step.step_name} {isActive && <span className="ml-2 text-[10px] bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] px-2 py-0.5 rounded-full font-bold">CURRENT</span>}
                      </h4>
                      <p className="text-[11px] text-[#64748B]">Responsible: <strong className="text-[#0F172A]">{step.role}</strong> • Node: {step.node_type}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isCompleted ? 'bg-[#DCFCE7] text-[#15803D]' :
                      isActive ? 'bg-[#DCFCE7] text-[#15803D] border border-[#00A859]' :
                      'text-[#64748B] bg-[#F1F5F9]'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. AI Executive Summary */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider text-[#64748B]">AI Executive Summary</h3>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 text-xs text-[#00A859] hover:underline font-bold"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#00A859]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            </div>

            <ul className="space-y-2 text-xs text-[#475569] list-disc list-inside leading-relaxed font-medium">
              {analysis?.summary?.map((bullet, idx) => (
                <li key={idx} className="text-[#0F172A]">{bullet}</li>
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
