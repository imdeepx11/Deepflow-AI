import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function ApprovalModal({ isOpen, onClose, document, initialAction = 'Approve', onDecisionSuccess, user }) {
  const [action, setAction] = useState(initialAction); // Approve, Reject, Request Changes
  const [role, setRole] = useState(document?.analysis?.assigned_role || 'Finance Manager');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !document) return null;

  const approverName = user?.name || 'System User';

  const ACTION_LABELS = {
    'Approve': 'Approved',
    'Reject': 'Rejected',
    'Request Changes': 'Changes Requested'
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.approveDocument(document.id, {
        action: action,
        approver_name: approverName,
        approver_role: role,
        comments: comments || `${ACTION_LABELS[action] || action} by ${role} — ${approverName}.`
      });
      setSubmitting(false);
      onDecisionSuccess(`${document.original_filename} ${ACTION_LABELS[action] || action} successfully.`);
      onClose();
    } catch (err) {
      setError(err.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h3 className="font-extrabold text-[#0F172A] text-base">
              {action === 'Approve' ? 'Approve this document?' : action === 'Reject' ? 'Reject this document?' : 'Request Review for this document?'}
            </h3>
            <p className="text-xs text-[#64748B]">Submit formal signoff decision for enterprise audit trail</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#E2E8F0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B]">
              {error}
            </div>
          )}

          {/* Document Summary Card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Document</span>
              <span className="font-bold text-[#0F172A]">{document.original_filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Action</span>
              <span className="font-bold text-[#15803D]">{role} {action}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Priority / Type</span>
              <span className="font-mono font-bold text-[#00A859]">{document.priority} • {document.analysis?.document_type || 'Invoice'}</span>
            </div>
          </div>

          {/* Decision Action Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B]">Action Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('Approve')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  action === 'Approve'
                    ? 'bg-[#DCFCE7] border-[#00A859] text-[#15803D]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('Reject')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  action === 'Reject'
                    ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('Request Changes')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  action === 'Request Changes'
                    ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Review</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B]">Audit Log Notes (Optional)</label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Invoice amount verified against purchase order PO-2026..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs rounded-xl p-2.5 focus:border-[#00A859] focus:bg-white outline-none resize-none placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#E2E8F0]"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`flex items-center gap-2 font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md ${
              action === 'Approve'
                ? 'bg-[#00A859] hover:bg-[#059669] text-white'
                : action === 'Reject'
                ? 'bg-[#DC2626] hover:bg-red-700 text-white'
                : 'bg-[#D97706] hover:bg-amber-700 text-white'
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm {action}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
