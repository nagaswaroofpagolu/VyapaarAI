import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Eye, Edit2, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ProductCard({
  product,
  onView,
  onAddStock,
  onRemoveStock,
  onEdit,
  onDelete,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isLow = product.quantity <= product.lowStockThreshold;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {product.category}
            </span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px', color: '#f8fafc' }}>
              {product.name}
            </h4>
          </div>
          <StatusBadge status={product.stockStatus} />
        </div>

        {/* Stock Level Display */}
        <div style={{ background: '#0d1524', padding: '1rem', borderRadius: '8px', margin: '0.75rem 0 1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Available Stock</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isLow ? '#fbbf24' : '#38bdf8' }}>
              {product.quantity} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>{product.unit}</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            <span>Threshold: {product.lowStockThreshold} {product.unit}</span>
            <span>Cost: {formatCurrency(product.costPrice)}</span>
          </div>
        </div>

        {/* Price Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Selling Price:</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
            {formatCurrency(product.sellingPrice)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAddStock(product)}
            title="Add stock to this product"
          >
            <ArrowUpRight size={14} />
            Add Stock
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onRemoveStock(product)}
            disabled={product.quantity <= 0}
            title="Remove stock from this product"
          >
            <ArrowDownLeft size={14} />
            Remove Stock
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline btn-sm"
            style={{ flex: 1 }}
            onClick={() => onView(product)}
          >
            <Eye size={14} />
            Details & History
          </button>
          
          <button
            className="btn-icon"
            onClick={() => onEdit(product)}
            title="Edit product"
          >
            <Edit2 size={14} />
          </button>
          
          <button
            className="btn-icon"
            onClick={() => onDelete(product)}
            title="Delete product"
            style={{ color: '#f43f5e' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
