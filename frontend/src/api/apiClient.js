import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'An unexpected error occurred.';
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export const inventoryApi = {
  // Product CRUD
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Stock Management
  addStock: (id, payload) => api.post(`/products/${id}/stock/add`, payload),
  removeStock: (id, payload) => api.post(`/products/${id}/stock/remove`, payload),

  // Transactions & Summary
  getProductTransactions: (id) => api.get(`/products/${id}/transactions`),
  getSummary: () => api.get('/inventory/summary'),

  // Voice interpretation and inventory assistant
  interpretVoiceCommand: (data) => api.post('/assistant/interpret', data),
  askAssistant: (data) => api.post('/assistant/ask', data),
};

export default inventoryApi;
