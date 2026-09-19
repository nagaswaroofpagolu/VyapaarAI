import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Bell, Menu, Package, Plus, RefreshCw, Search, Sparkles, TrendingUp } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductFormModal from './components/ProductFormModal';
import StockActionModal from './components/StockActionModal';
import ProductDetailModal from './components/ProductDetailModal';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import AssistantPanel from './components/AssistantPanel';
import inventoryApi from './api/apiClient';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalMode, setStockModalMode] = useState('ADD'); // 'ADD' | 'REMOVE'
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [assistantLanguage, setAssistantLanguage] = useState(() => localStorage.getItem('vyapaarai-language') || 'en-IN');

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLanguageChange = (language) => {
    setAssistantLanguage(language);
    localStorage.setItem('vyapaarai-language', language);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, summaryData] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getSummary(),
      ]);
      setProducts(productsData || []);
      setSummary(summaryData || null);
    } catch (err) {
      showToast(err.message || 'Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Product Actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (editingProduct && editingProduct.id) {
        await inventoryApi.updateProduct(editingProduct.id, formData);
        showToast(`Updated "${formData.name}" successfully`, 'success');
      } else {
        await inventoryApi.createProduct(formData);
        showToast(`Added "${formData.name}" to inventory`, 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Stock Actions
  const handleOpenAddStock = (product) => {
    setSelectedProductForStock(product);
    setStockModalMode('ADD');
    setIsStockModalOpen(true);
  };

  const handleOpenRemoveStock = (product) => {
    setSelectedProductForStock(product);
    setStockModalMode('REMOVE');
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (payload) => {
    if (!selectedProductForStock) return;
    try {
      setActionLoading(true);
      if (stockModalMode === 'ADD') {
        const updated = await inventoryApi.addStock(selectedProductForStock.id, payload);
        showToast(
          `Added ${payload.quantity} ${payload.unit} to ${updated.name}. New stock: ${updated.quantity} ${updated.unit}.`,
          'success'
        );
      } else {
        const updated = await inventoryApi.removeStock(selectedProductForStock.id, payload);
        showToast(
          `Removed ${payload.quantity} ${payload.unit} from ${updated.name}. Available: ${updated.quantity} ${updated.unit}.`,
          'success'
        );
      }
      setIsStockModalOpen(false);
      setSelectedProductForStock(null);
      await fetchData();

      // If details modal is open for this product, update it
      if (detailProduct && detailProduct.id === selectedProductForStock.id) {
        const refreshed = await inventoryApi.getProduct(selectedProductForStock.id);
        setDetailProduct(refreshed);
      }
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssistantCommand = async (command) => {
    if (command.action === 'DELETE') {
      await inventoryApi.deleteProduct(command.productId);
      showToast(`Deleted "${command.productName}" from inventory`, 'success');
      await fetchData();
      return;
    }

    if (command.action === 'UPDATE') {
      const product = await inventoryApi.getProduct(command.productId);
      await inventoryApi.updateProduct(command.productId, {
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        unit: product.unit,
        sellingPrice: command.price,
        costPrice: product.costPrice,
        lowStockThreshold: product.lowStockThreshold,
      });
      showToast(`Updated "${command.productName}" successfully`, 'success');
      await fetchData();
      return;
    }

    const payload = {
      quantity: command.quantity,
      unit: command.unit,
      reason: 'Confirmed voice assistant command',
    };
    const updated = command.action === 'ADD'
      ? await inventoryApi.addStock(command.productId, payload)
      : await inventoryApi.removeStock(command.productId, payload);
    showToast(
      `${command.action === 'ADD' ? 'Added' : 'Removed'} ${payload.quantity} ${payload.unit} ${updated.name}. New stock: ${updated.quantity} ${updated.unit}.`,
      'success'
    );
    await fetchData();
  };

  // Delete Action
  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setActionLoading(true);
      await inventoryApi.deleteProduct(productToDelete.id);
      showToast(`Product "${productToDelete.name}" deleted from database`, 'success');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // View Details
  const handleViewDetails = (product) => {
    setDetailProduct(product);
    setIsDetailModalOpen(true);
  };

  const navigate = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    if (activeView === 'products' || activeView === 'stock') {
      return (
        <section className="page-section">
          <div className="page-heading">
            <div><span className="page-kicker">{activeView === 'stock' ? 'Operations' : 'Catalog'}</span><h1>{activeView === 'stock' ? 'Stock management' : 'Products'}</h1><p>{activeView === 'stock' ? 'Keep stock in, stock out, and low-stock actions in one place.' : 'Your product catalog, prices, and live inventory at a glance.'}</p></div>
            <button className="btn btn-primary" onClick={activeView === 'stock' ? () => products[0] && handleOpenAddStock(products[0]) : handleOpenAddProduct}><Plus size={16} />{activeView === 'stock' ? 'Update stock' : 'Add product'}</button>
          </div>
          <ProductList products={products} loading={loading} onView={handleViewDetails} onAddStock={handleOpenAddStock} onRemoveStock={handleOpenRemoveStock} onEdit={handleOpenEditProduct} onDelete={handleOpenDelete} onAddNew={handleOpenAddProduct} />
        </section>
      );
    }

    if (activeView === 'voice') {
      return <section className="page-section"><div className="page-heading"><div><span className="page-kicker">Hands-free control</span><h1>Voice assistant</h1><p>Speak naturally. Review every action before it touches inventory.</p></div></div><AssistantPanel featured language={assistantLanguage} onLanguageChange={handleLanguageChange} onConfirmCommand={confirmAssistantCommand} disabled={actionLoading} /></section>;
    }

    if (activeView === 'reports') {
      return <section className="page-section"><div className="page-heading"><div><span className="page-kicker">Live from MySQL</span><h1>Reports</h1><p>A clear view of inventory value, alerts, and recent movements.</p></div></div><div className="report-grid"><div className="report-card report-card-wide"><span>Inventory value</span><strong>{formatCurrency(summary?.totalStockValue || 0)}</strong><small>Current selling-price valuation</small><div className="report-line"><i style={{ width: '78%' }} /></div></div><div className="report-card"><span>Tracked products</span><strong>{summary?.totalProducts || 0}</strong><small>Active catalog items</small></div><div className="report-card"><span>Recent movements</span><strong>{summary?.recentTransactions?.length || 0}</strong><small>Latest database records</small></div></div><div className="card report-activity"><div className="section-title"><TrendingUp size={17} /> Recent stock activity</div><div className="activity-list">{(summary?.recentTransactions || []).slice(0, 10).map((tx) => <div className="activity-row" key={tx.id}><span className={`activity-dot ${tx.type === 'ADD' ? 'add' : 'remove'}`} /><b>{tx.productName || `Product #${tx.productId}`}</b><span>{tx.type === 'ADD' ? '+' : '-'}{tx.quantity} {tx.unit}</span><small>{tx.reason || 'Inventory movement'}</small></div>)}</div></div></section>;
    }

    if (activeView === 'insights') {
      return <section className="page-section"><div className="page-heading"><div><span className="page-kicker">Decision support</span><h1>AI insights</h1><p>Ask questions and get recommendations grounded in your inventory.</p></div></div><AssistantPanel language={assistantLanguage} onLanguageChange={handleLanguageChange} onConfirmCommand={confirmAssistantCommand} disabled={actionLoading} /><div className="insight-banner"><Sparkles size={18} /><div><strong>Your business partner is listening</strong><span>Use the assistant above for stock, reorder, and transaction questions.</span></div></div></section>;
    }

    if (activeView === 'settings') {
      return <section className="page-section"><div className="page-heading"><div><span className="page-kicker">Workspace preferences</span><h1>Settings</h1><p>Configure how VyapaarAI listens and presents your workspace.</p></div></div><div className="settings-grid"><div className="card setting-row"><div><strong>Assistant language</strong><span>Used by speech recognition and natural-language requests.</span></div><select className="form-control setting-select" value={assistantLanguage} onChange={(event) => handleLanguageChange(event.target.value)}><option value="en-IN">English</option><option value="te-IN">Telugu</option><option value="hi-IN">Hindi</option><option value="mixed">Mixed</option></select></div><div className="card setting-row"><div><strong>Data source</strong><span>Live MySQL inventory and transaction records.</span></div><span className="connected-pill">Connected</span></div></div></section>;
    }

    return <section className="page-section home-page"><div className="welcome-row"><div><span className="page-kicker">Saturday, September 19</span><h1>Good morning, Naga<span className="welcome-mark">.</span></h1><p>Just speak, and let VyapaarAI handle the rest.</p></div><button className="btn btn-primary" onClick={handleOpenAddProduct}><Plus size={16} /> Add product</button></div><AssistantPanel featured language={assistantLanguage} onLanguageChange={handleLanguageChange} onConfirmCommand={confirmAssistantCommand} disabled={actionLoading} /><div className="home-support-grid"><div className="card recent-commands-card"><div className="section-title"><TrendingUp size={17} /> Recent commands <button className="text-link" onClick={() => navigate('reports')}>View all</button></div>{(summary?.recentTransactions || []).slice(0, 4).map((tx) => <div className="command-row" key={`command-${tx.id}`}><span className={`command-icon ${tx.type === 'ADD' ? 'add' : 'remove'}`}>{tx.type === 'ADD' ? '+' : '-'}</span><div><strong>{tx.type === 'ADD' ? 'Stock added' : 'Stock removed'}</strong><span>{tx.productName || 'Inventory item'} · {tx.quantity} {tx.unit}</span></div><small>{tx.reason || 'Completed'}</small></div>)}</div><div className="partner-card"><div className="partner-orb"><Sparkles size={25} /></div><span className="page-kicker">Always on your side</span><h3>Your AI Business Partner</h3><p>Manage inventory, sales, customers and more — just by talking.</p><button className="btn btn-light" onClick={() => navigate('voice')}>Try a sample command <TrendingUp size={14} /></button></div></div><div className="quick-actions"><div className="quick-actions-heading"><div><span className="page-kicker">Move faster</span><h2>Quick actions</h2></div></div><div className="quick-action-grid"><button onClick={handleOpenAddProduct}><Plus size={18} /><span><strong>Add product</strong><small>Create a new catalog item</small></span></button><button onClick={() => products[0] && handleOpenAddStock(products[0])}><Package size={18} /><span><strong>Update stock</strong><small>Stock in or stock out</small></span></button><button onClick={() => navigate('stock')}><TrendingUp size={18} /><span><strong>View stock</strong><small>Open stock management</small></span></button><button onClick={() => navigate('reports')}><BarChart3 size={18} /><span><strong>View reports</strong><small>Review live activity</small></span></button></div></div><Dashboard summary={summary} onAddStock={handleOpenAddStock} onViewProduct={handleViewDetails} onGoToProducts={() => navigate('products')} /></section>;
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const confirmAssistantCommand = async (command) => {
    try {
      setActionLoading(true);
      await handleAssistantCommand(command);
    } catch (err) {
      showToast(err.message || 'Failed to apply assistant action', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="mobile-scrim" onClick={() => setSidebarOpen(false)} />
      <Sidebar activeView={activeView} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button className="mobile-menu btn-icon" onClick={() => setSidebarOpen(true)} title="Open navigation"><Menu size={19} /></button>
          <div className="global-search"><Search size={17} /><input placeholder="Search products, customers, or ask VyapaarAI anything..." /></div>
          <div className="topbar-actions"><button className="btn-icon notification-button" title="Notifications"><Bell size={18} /><i /></button><button className="btn-icon top-refresh" onClick={fetchData} title="Refresh data" disabled={loading}><RefreshCw size={17} className={loading ? 'spin-icon' : ''} /></button><div className="topbar-user"><div className="profile-avatar">NS</div><div><strong>Naga Stores</strong><span>Administrator</span></div></div></div>
        </header>
        <main className="main-content">{renderPage()}</main>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        loading={actionLoading}
      />

      <StockActionModal
        isOpen={isStockModalOpen}
        mode={stockModalMode}
        product={selectedProductForStock}
        onClose={() => setIsStockModalOpen(false)}
        onSubmit={handleStockSubmit}
        loading={actionLoading}
      />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        product={detailProduct}
        onClose={() => setIsDetailModalOpen(false)}
        onAddStock={handleOpenAddStock}
        onRemoveStock={handleOpenRemoveStock}
        onEdit={handleOpenEditProduct}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Product"
        message={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? All transaction records for this product will also be removed permanently.`
            : 'Are you sure you want to delete this product?'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        loading={actionLoading}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
