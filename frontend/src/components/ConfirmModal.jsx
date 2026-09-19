import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: '#fda4af' }}>
            <AlertTriangle size={20} color="#f43f5e" />
            {title}
          </div>
        </div>
        <div className="modal-body" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
          {message}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
