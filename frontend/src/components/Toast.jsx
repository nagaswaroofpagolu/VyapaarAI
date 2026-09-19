import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
          {toast.type === 'success' && <CheckCircle size={18} color="#10b981" />}
          {toast.type === 'error' && <AlertCircle size={18} color="#f43f5e" />}
          {toast.type === 'warning' && <AlertCircle size={18} color="#f59e0b" />}
          {(!toast.type || toast.type === 'info') && <Info size={18} color="#06b6d4" />}
          
          <div style={{ flex: 1, fontSize: '0.85rem' }}>{toast.message}</div>
          
          <button
            onClick={() => onClose(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
