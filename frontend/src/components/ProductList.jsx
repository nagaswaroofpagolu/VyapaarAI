import React, { useState } from 'react';
import { Search, LayoutGrid, Table as TableIcon, ArrowUpRight, ArrowDownLeft, Eye, Edit2, Trash2, Plus } from 'lucide-react';
import ProductCard from './ProductCard';
import StatusBadge from './StatusBadge';

export default function ProductList({
  products = [],
  loading = false,
  onView,
  onAddStock,
  onRemoveStock,
  onEdit,
  onDelete,
  onAddNew,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Extract unique categories
  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_STOCK' && p.stockStatus === 'IN STOCK') ||
      (statusFilter === 'LOW_STOCK' && p.stockStatus === 'LOW STOCK') ||
      (statusFilter === 'OUT_OF_STOCK' && p.stockStatus === 'OUT OF STOCK');

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="products-view">
      {/* Controls Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px', flex: 1 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search products or categories..."
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: '#0a1120', padding: '2px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ background: viewMode === 'grid' ? '#1e293b' : 'transparent', border: 'none' }}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              style={{ background: viewMode === 'table' ? '#1e293b' : 'transparent', border: 'none' }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Display */}
      {loading ? (
        <div className="card empty-state">
          <p>Loading inventory from database...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card empty-state">
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
            No products found
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'Try changing your search or filter criteria.'
              : 'Your inventory catalog is currently empty.'}
          </p>
          <button className="btn btn-primary" onClick={onAddNew}>
            <Plus size={16} /> Add First Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={onView}
              onAddStock={onAddStock}
              onRemoveStock={onRemoveStock}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Selling Price</th>
                <th>Cost Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{p.category}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: p.quantity <= p.lowStockThreshold ? '#fbbf24' : '#38bdf8' }}>
                    {p.quantity} {p.unit}
                  </td>
                  <td style={{ color: '#64748b' }}>
                    {p.lowStockThreshold} {p.unit}
                  </td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>{formatCurrency(p.sellingPrice)}</td>
                  <td style={{ color: '#94a3b8' }}>{formatCurrency(p.costPrice)}</td>
                  <td>
                    <StatusBadge status={p.stockStatus} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onAddStock(p)}
                        title="Add Stock"
                      >
                        <ArrowUpRight size={13} />
                        Add
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onRemoveStock(p)}
                        disabled={p.quantity <= 0}
                        title="Remove Stock"
                      >
                        <ArrowDownLeft size={13} />
                        Remove
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onView(p)}
                        title="Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onEdit(p)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onDelete(p)}
                        title="Delete"
                        style={{ color: '#f43f5e' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
