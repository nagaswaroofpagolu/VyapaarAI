import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Edit } from 'lucide-react';

const SUPPORTED_UNITS = [
  'pieces',
  'kg',
  'bags',
  'cartons',
  'boxes',
  'dozens',
  'litres',
  'packets',
];

export default function ProductFormModal({ isOpen, product, onClose, onSubmit, loading }) {
  const isEdit = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'pieces',
    sellingPrice: '',
    costPrice: '',
    lowStockThreshold: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        quantity: product.quantity != null ? product.quantity : '',
        unit: product.unit || 'pieces',
        sellingPrice: product.sellingPrice != null ? product.sellingPrice : '',
        costPrice: product.costPrice != null ? product.costPrice : '',
        lowStockThreshold: product.lowStockThreshold != null ? product.lowStockThreshold : '',
      });
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: '',
        unit: 'pieces',
        sellingPrice: '',
        costPrice: '',
        lowStockThreshold: '',
      });
    }
    setFormErrors({});
  }, [product, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name cannot be empty';
    if (!formData.category.trim()) errors.category = 'Category cannot be empty';

    if (formData.quantity === '' || isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    if (!SUPPORTED_UNITS.includes(formData.unit)) {
      errors.unit = 'Please select a valid trade unit';
    }

    if (formData.sellingPrice === '' || isNaN(formData.sellingPrice) || Number(formData.sellingPrice) < 0) {
      errors.sellingPrice = 'Selling price cannot be negative';
    }

    if (formData.costPrice === '' || isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      errors.costPrice = 'Cost price cannot be negative';
    }

    if (formData.lowStockThreshold === '' || isNaN(formData.lowStockThreshold) || Number(formData.lowStockThreshold) < 0) {
      errors.lowStockThreshold = 'Low stock threshold cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      category: formData.category.trim(),
      quantity: Number(formData.quantity),
      unit: formData.unit,
      sellingPrice: Number(formData.sellingPrice),
      costPrice: Number(formData.costPrice),
      lowStockThreshold: Number(formData.lowStockThreshold),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            {isEdit ? <Edit size={20} color="#06b6d4" /> : <PackagePlus size={20} color="#10b981" />}
            {isEdit ? 'Edit Product Information' : 'Add New Inventory Product'}
          </div>
          <button className="btn-icon" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Basmati Rice, Sunflower Oil"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {formErrors.name}
                </span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                placeholder="e.g. Grains, Beverages, Snacks, Household"
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              {formErrors.category && (
                <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {formErrors.category}
                </span>
              )}
            </div>

            {/* Quantity and Trade Unit */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{isEdit ? 'Current Quantity *' : 'Initial Quantity *'}</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 25"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                {formErrors.quantity && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.quantity}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Trade Unit *</label>
                <select
                  className="form-control"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  {SUPPORTED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {formErrors.unit && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Prices */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Selling Price (INR) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 2500"
                  className="form-control"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
                {formErrors.sellingPrice && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.sellingPrice}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cost Price (INR) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 2200"
                  className="form-control"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
                {formErrors.costPrice && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.costPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Low Stock Threshold */}
            <div className="form-group">
              <label className="form-label">Low Stock Alert Threshold *</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 10 (triggers alert when stock falls below this)"
                className="form-control"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              />
              {formErrors.lowStockThreshold && (
                <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {formErrors.lowStockThreshold}
                </span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
