import React from 'react';
import { Package, LayoutDashboard, Boxes, Plus, RefreshCw } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenAddModal, onRefresh, loading }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <Package size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">VyapaarAI</div>
            <span className="brand-tagline">Your AI partner for smarter stock.</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Boxes size={16} />
              Products
            </button>
          </div>

          <button
            className="btn-icon"
            onClick={onRefresh}
            title="Refresh data from database"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spin-icon' : ''} />
          </button>

          <button className="btn btn-primary" onClick={onOpenAddModal}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>
    </header>
  );
}
