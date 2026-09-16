import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, user }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    setError(null);
    const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(ext)) {
      setError(`Invalid file type (${ext}). Please upload PDF, DOCX, or TXT.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(30);
    setError(null);

    const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploaded_by', userName);

      setProgress(60);
      const res = await api.uploadDocument(formData);
      setProgress(100);
      setUploadedDocId(res.id);
      setUploading(false);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleAnalyzeNow = () => {
    if (uploadedDocId) {
      onUploadSuccess(uploadedDocId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] dark:border-[#242424] flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-base">Upload Document</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Select or drop unstructured business documents for AI analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF2F2] dark:bg-[#EF4444]/10 border border-[#FCA5A5] dark:border-[#EF4444]/30 rounded-xl flex items-center gap-2 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-[#00A859] bg-[#DCFCE7] dark:bg-[#00A859]/10'
                  : 'border-[#CBD5E1] dark:border-[#242424] hover:border-[#00A859]/50 bg-[#F8FAFC] dark:bg-[#050505]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#F5F5F5] mb-1">Drag & Drop file here, or browse</p>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Supports PDF, DOCX, TXT (Max 25MB)</p>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-[#F5F5F5] truncate">{selectedFile.name}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {!uploadedDocId && !uploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-[#64748B] dark:text-[#A1A1AA] hover:text-[#DC2626] p-1 font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(uploading || uploadedDocId) && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-[#64748B] dark:text-[#A1A1AA]">
                    <span>{uploadedDocId ? 'Upload Complete' : 'Uploading...'}</span>
                    <span className="font-mono font-bold text-[#00A859]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#E2E8F0] dark:bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00A859] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] dark:border-[#242424] bg-[#F8FAFC] dark:bg-[#141414] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#1F1F1F] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {!uploadedDocId ? (
            <button
              disabled={!selectedFile || uploading}
              onClick={handleStartUpload}
              className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload File</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleAnalyzeNow}
              className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Analyze with AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
