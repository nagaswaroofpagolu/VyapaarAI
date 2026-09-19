import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products'
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

  return (
    <div className="app-layout">
      {/* Background Ambient Effects */}
      <div className="ambient-glow-cyan" />
      <div className="ambient-glow-emerald" />

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddProduct}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Main Content */}
      <main className="container" style={{ marginTop: '1.5rem' }}>
        <AssistantPanel
          language={assistantLanguage}
          onLanguageChange={handleLanguageChange}
          onConfirmCommand={async (command) => {
            try {
              setActionLoading(true);
              await handleAssistantCommand(command);
            } catch (err) {
              showToast(err.message || 'Failed to apply assistant stock change', 'error');
              throw err;
            } finally {
              setActionLoading(false);
            }
          }}
          disabled={actionLoading}
        />
        {activeTab === 'dashboard' ? (
          <Dashboard
            summary={summary}
            onAddStock={handleOpenAddStock}
            onViewProduct={handleViewDetails}
            onGoToProducts={() => setActiveTab('products')}
          />
        ) : (
          <ProductList
            products={products}
            loading={loading}
            onView={handleViewDetails}
            onAddStock={handleOpenAddStock}
            onRemoveStock={handleOpenRemoveStock}
            onEdit={handleOpenEditProduct}
            onDelete={handleOpenDelete}
            onAddNew={handleOpenAddProduct}
          />
        )}
      </main>

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
