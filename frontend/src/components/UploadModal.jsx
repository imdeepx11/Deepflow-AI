import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { api } from '../api';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];

export default function UploadModal({ isOpen, onClose, onUploadSuccess, user }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const choose = (candidate) => {
    setError('');
    setUploaded(false);
    if (!candidate) return;

    const ext = `.${candidate.name.split('.').pop().toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Please choose a PDF, DOCX, DOC, or TXT file.');
      return;
    }

    if (candidate.size > 25 * 1024 * 1024) {
      setError('File size must be 25 MB or smaller.');
      return;
    }

    setFile(candidate);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('uploaded_by', user?.name || 'Admin');
      const response = await api.uploadDocument(data);
      setUploaded(true);
      setTimeout(() => {
        onUploadSuccess(response.id);
        onClose();
        setFile(null);
        setUploaded(false);
      }, 550);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="editorial-modal-backdrop" role="presentation">
      <div className="editorial-modal upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-dialog-title">
        <div className="modal-head upload-modal-head">
          <div>
            <div className="page-kicker">Document intake</div>
            <div id="upload-dialog-title" className="card-title upload-modal-title">Add a new document.</div>
          </div>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close upload dialog">
            <X size={17} />
          </button>
        </div>

        <div className="modal-body upload-modal-body">
          {error && <div className="upload-error" role="alert">{error}</div>}

          {!file ? (
            <button
              type="button"
              className="upload-dropzone"
              onClick={() => inputRef.current?.click()}
              aria-label="Choose a document to upload"
            >
              <span className="upload-dropzone-icon">
                <UploadCloud size={22} />
              </span>
              <span className="upload-dropzone-title">Drop a document here, or browse.</span>
              <span className="upload-dropzone-meta">PDF, DOCX, DOC, TXT · up to 25 MB</span>
            </button>
          ) : (
            <div className="upload-file-card">
              <div className="upload-file-main">
                <div className="file-icon"><FileText size={15} /></div>
                <div className="upload-file-copy">
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button className="close-btn" type="button" onClick={() => setFile(null)} aria-label="Remove selected file">
                <X size={15} />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="upload-file-input"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => choose(event.target.files?.[0])}
          />

          {uploading && (
            <div className="upload-status upload-status-progress">
              <Loader2 size={14} className="animate-spin" />
              <span>Uploading and extracting text…</span>
            </div>
          )}

          {uploaded && (
            <div className="upload-status upload-status-success">
              <CheckCircle2 size={14} />
              <span>Document uploaded.</span>
            </div>
          )}
        </div>

        <div className="modal-foot upload-modal-footer">
          <button className="secondary-btn" type="button" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="primary-btn" type="button" disabled={!file || uploading} onClick={upload}>
            {uploading ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      </div>
    </div>
  );
}
