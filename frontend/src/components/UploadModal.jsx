import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
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

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploaded_by', 'Admin');

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#242424] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Upload Document</h3>
            <p className="text-xs text-[#A1A1AA]">Select or drop unstructured business documents for AI analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#121212] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-center gap-2 text-xs text-[#EF4444]">
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
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-[#00C853] bg-[#00C853]/5'
                  : 'border-[#242424] hover:border-[#00C853]/50 bg-[#050505]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Drag & Drop file here, or browse</p>
              <p className="text-xs text-[#A1A1AA]">Supports PDF, DOCX, TXT (Max 25MB)</p>
            </div>
          ) : (
            <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-[#A1A1AA]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {!uploadedDocId && !uploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-[#A1A1AA] hover:text-[#EF4444] p-1"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(uploading || uploadedDocId) && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>{uploadedDocId ? 'Upload Complete' : 'Uploading...'}</span>
                    <span className="font-mono text-[#00C853]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#050505] rounded-full overflow-hidden border border-[#242424]">
                    <div
                      className="h-full bg-gradient-to-r from-[#00C853] to-[#22C55E] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#242424] bg-[#050505]/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#121212] transition-colors"
          >
            Cancel
          </button>

          {!uploadedDocId ? (
            <button
              disabled={!selectedFile || uploading}
              onClick={handleStartUpload}
              className="flex items-center gap-2 bg-[#00C853] hover:bg-[#22C55E] disabled:opacity-50 text-black font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,200,83,0.3)]"
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
              className="flex items-center gap-2 bg-[#00C853] hover:bg-[#22C55E] text-black font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(0,200,83,0.4)]"
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
