import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Edit2, History, Package, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import inventoryApi from '../api/apiClient';

export default function ProductDetailModal({
  isOpen,
  product,
  onClose,
  onAddStock,
  onRemoveStock,
  onEdit,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState('');

  useEffect(() => {
    if (isOpen && product && product.id) {
      loadTransactions(product.id);
    }
  }, [isOpen, product]);

  const loadTransactions = async (productId) => {
    try {
      setLoadingTx(true);
      setTxError('');
      const data = await inventoryApi.getProductTransactions(productId);
      setTransactions(data || []);
    } catch (err) {
      setTxError(err.message || 'Failed to load transaction history');
    } finally {
      setLoadingTx(false);
    }
  };

  if (!isOpen || !product) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isLow = product.quantity <= product.lowStockThreshold;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={20} color="#06b6d4" />
            {product.name}
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Header Overview Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #131d2e, #0e1626)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Category: {product.category}
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: isLow ? '#fbbf24' : '#38bdf8' }}>
                  {product.quantity} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>{product.unit}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Low stock threshold: <strong style={{ color: '#f8fafc' }}>{product.lowStockThreshold} {product.unit}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <StatusBadge status={product.stockStatus} />
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Selling Price</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                    {formatCurrency(product.sellingPrice)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Cost: {formatCurrency(product.costPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons inside Details */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onAddStock(product);
                }}
              >
                <ArrowUpRight size={14} />
                Add Stock
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onClose();
                  onRemoveStock(product);
                }}
                disabled={product.quantity <= 0}
              >
                <ArrowDownLeft size={14} />
                Remove Stock
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
              >
                <Edit2 size={14} />
                Edit Product
              </button>
            </div>
          </div>

          {/* Transaction History Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <History size={18} color="#06b6d4" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Stock Transaction History</h4>
            </div>

            {loadingTx ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <Clock size={20} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
                <p>Loading transactions...</p>
              </div>
            ) : txError ? (
              <div style={{ color: '#f87171', padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px' }}>
                {txError}
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#0a1120', borderRadius: '8px' }}>
                <p>No inventory movements recorded yet for this product.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Quantity</th>
                      <th>Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(tx.createdAt)}
                        </td>
                        <td>
                          <StatusBadge status={tx.type} type="transaction" />
                        </td>
                        <td style={{ fontWeight: 700, color: tx.type === 'ADD' ? '#38bdf8' : '#f87171' }}>
                          {tx.type === 'ADD' ? '+' : '-'}
                          {tx.quantity} {tx.unit}
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.825rem' }}>
                          {tx.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
