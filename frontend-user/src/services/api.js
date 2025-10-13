import axios from 'axios';

const API_BASE_URL = 'http://fin.agrobank.uz/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/user/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
};

export const documentsAPI = {
  getUserDocuments: (filters = {}) => api.get('/documents/user/filter', { params: filters }),
  
  getUserFilterOptions: () => api.get('/documents/user/filter-options'),
  
  getDocument: (documentId) => api.get(`/documents/${documentId}`),
  
  createDocument: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateDocument: (documentId, formData) => api.put(`/documents/${documentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteDocument: (documentId) => api.delete(`/documents/${documentId}`),
  
  downloadDocument: (documentId) => api.get(`/documents/${documentId}/download`, {
    responseType: 'blob'
  }),
  
  getDocumentInfo: (documentId) => api.get(`/documents/${documentId}/info`),
};

export const deleteRequestsAPI = {
  getUserDeleteRequests: () => api.get('/delete-requests/user/requests'),
  
  createDeleteRequest: (documentId) => api.post(`/delete-requests/user/${documentId}`),
};

export const notificationsAPI = {
  getUserNotifications: (params) => api.get('/notifications/user/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/user/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/user/mark-read/${notificationId}`),
  markAllAsRead: () => api.put('/notifications/user/mark-all-read'),
};

export default api;
