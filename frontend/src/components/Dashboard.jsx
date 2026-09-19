import React from 'react';
import { Package, AlertTriangle, XCircle, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Dashboard({ summary, onAddStock, onViewProduct, onGoToProducts }) {
  if (!summary) {
    return (
      <div className="card empty-state" style={{ marginTop: '2rem' }}>
        <p>Loading dashboard summary from database...</p>
      </div>
    );
  }

  const {
    totalProducts = 0,
    totalLowStockProducts = 0,
    totalOutOfStockProducts = 0,
    totalStockValue = 0,
    lowStockProducts = [],
    recentTransactions = [],
  } = summary;

  const outOfStockProducts = lowStockProducts.filter((product) => product.quantity <= 0);
  const reorderRecommendations = lowStockProducts.filter(
    (product) => product.quantity <= product.lowStockThreshold
  );

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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="dashboard-view">
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box metric-icon-cyan">
            <Package size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Products</span>
            <span className="metric-value">{totalProducts}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-amber">
            <AlertTriangle size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Low Stock Alerts</span>
            <span className="metric-value" style={{ color: totalLowStockProducts > 0 ? '#fbbf24' : 'inherit' }}>
              {totalLowStockProducts}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-rose">
            <XCircle size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Out of Stock</span>
            <span className="metric-value" style={{ color: totalOutOfStockProducts > 0 ? '#f87171' : 'inherit' }}>
              {totalOutOfStockProducts}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-emerald">
            <TrendingUp size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Inventory Valuation</span>
            <span className="metric-value">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Watchlist */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Low Stock Watchlist</h3>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onGoToProducts}>
              View All Products
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <p>Great news! All products are adequately stocked.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.category}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: p.quantity === 0 ? '#f87171' : '#fbbf24' }}>
                        {p.quantity} {p.unit}
                      </td>
                      <td style={{ color: '#94a3b8' }}>
                        {p.lowStockThreshold} {p.unit}
                      </td>
                      <td>
                        <StatusBadge status={p.stockStatus} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onAddStock(p)}
                        >
                          <ArrowUpRight size={14} />
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <div className="card dashboard-alert-snapshot">
                  <div className="dashboard-alert-heading">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Stock Signals</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Recommendations calculated from each product's live threshold.</p>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={onGoToProducts}>Manage inventory</button>
                  </div>
                  <div className="dashboard-alert-grid">
                    <div className="dashboard-alert-column">
                      <div className="dashboard-alert-label" style={{ color: '#fbbf24' }}>Low stock</div>
                      {reorderRecommendations.filter((product) => product.quantity > 0).length === 0 ? (
                        <p className="dashboard-alert-empty">No low-stock products.</p>
                      ) : reorderRecommendations.filter((product) => product.quantity > 0).map((product) => (
                        <div className="dashboard-alert-item" key={`low-${product.id}`}>
                          <span>{product.name}</span><strong>{product.quantity} / {product.lowStockThreshold} {product.unit}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="dashboard-alert-column">
                      <div className="dashboard-alert-label" style={{ color: '#f87171' }}>Out of stock</div>
                      {outOfStockProducts.length === 0 ? (
                        <p className="dashboard-alert-empty">No out-of-stock products.</p>
                      ) : outOfStockProducts.map((product) => (
                        <div className="dashboard-alert-item" key={`out-${product.id}`}>
                          <span>{product.name}</span><strong>{product.unit}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="dashboard-alert-column">
                      <div className="dashboard-alert-label" style={{ color: '#34d399' }}>Reorder today</div>
                      {reorderRecommendations.length === 0 ? (
                        <p className="dashboard-alert-empty">No reorder recommendations.</p>
                      ) : reorderRecommendations.map((product) => (
                        <div className="dashboard-alert-item" key={`reorder-${product.id}`}>
                          <span>{product.name}</span><strong>Target {product.lowStockThreshold} {product.unit}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Clock size={20} color="#06b6d4" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Stock Activity</h3>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <p>No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.slice(0, 6).map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <StatusBadge status={tx.type} type="transaction" />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.productName || `Product #${tx.productId}`}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {tx.type === 'ADD' ? '+' : '-'}
                        {tx.quantity} {tx.unit}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                        {tx.reason || '-'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
