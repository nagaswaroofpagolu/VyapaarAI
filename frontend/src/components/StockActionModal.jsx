import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export default function StockActionModal({
  isOpen,
  mode = 'ADD', // 'ADD' | 'REMOVE'
  product,
  onClose,
  onSubmit,
  loading,
}) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isAdd = mode === 'ADD';

  useEffect(() => {
    setQuantity('');
    setError('');
    setReason(isAdd ? 'New stock received' : 'Stock sold');
  }, [product, mode, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.quantity || 0;
  const unit = product.unit || 'units';

  const quickReasons = isAdd
    ? ['New stock received', 'Supplier Restock', 'Bulk purchase delivery', 'Inventory recount correction']
    : ['Stock sold', 'Customer walk-in sale', 'Damaged/Expired goods', 'Sample/Demonstration'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than zero');
      return;
    }

    if (!isAdd && qty > currentStock) {
      setError(`Insufficient stock. Available: ${currentStock} ${unit}.`);
      return;
    }

    onSubmit({
      quantity: qty,
      unit: product.unit,
      reason: reason.trim() || (isAdd ? 'Stock added' : 'Stock removed'),
    });
  };

  const calculatedNewStock = () => {
    const qty = Number(quantity) || 0;
    if (isAdd) return currentStock + qty;
    return Math.max(0, currentStock - qty);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: isAdd ? '#38bdf8' : '#fda4af' }}>
            {isAdd ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
            {isAdd ? `Add Stock – ${product.name}` : `Remove Stock – ${product.name}`}
          </div>
          <button className="btn-icon" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Current Stock Banner */}
            <div
              style={{
                background: '#0a1120',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                border: '1px solid #1e293b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Current In-Stock</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  {currentStock} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{unit}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Projected Stock</span>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isAdd ? '#34d399' : Number(quantity) > currentStock ? '#f87171' : '#38bdf8',
                  }}
                >
                  {calculatedNewStock()} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{unit}</span>
                </div>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="form-group">
              <label className="form-label">
                Quantity to {isAdd ? 'Add' : 'Remove'} ({unit}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder={`Enter quantity in ${unit}`}
                className="form-control"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                autoFocus
              />
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">Transaction Reason / Note</label>
              <input
                type="text"
                placeholder="e.g. Stock sold, Customer walk-in, Supplier delivery"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              {/* Quick Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                {quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setReason(qr)}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#fda4af',
                  fontSize: '0.825rem',
                  marginTop: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className={isAdd ? 'btn btn-primary' : 'btn btn-danger'}
              disabled={loading}
            >
              {loading ? 'Processing...' : isAdd ? `+ Add ${quantity || 0} ${unit}` : `- Remove ${quantity || 0} ${unit}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
