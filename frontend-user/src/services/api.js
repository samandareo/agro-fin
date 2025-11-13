import axios from 'axios';
import { getErrorMessage, logErrorForDebug, isSilentError } from '../utils/errorHandler';

const API_BASE_URL = 'https://agro-fin.onrender.com/api/v1';
// const API_BASE_URL = 'http://localhost:5000/api/v1';
// const API_BASE_URL = 'http://fin.agrobank.uz/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if data is not FormData
    // FormData will automatically set the correct Content-Type with boundary
    if (!(config.data instanceof FormData)) {
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else {
      // Delete Content-Type for FormData so axios can set it with the boundary
      delete config.headers['Content-Type'];
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
        window.location.href = '/login';
      }
    }
    
    // Log error for debugging in development
    logErrorForDebug(error, 'API Request');
    
    // Convert error to user-friendly message (or SilentError for 403)
    const userMessage = getErrorMessage(error);
    
    // Check if this is a silent error (403 Forbidden) - don't show to user
    if (isSilentError(userMessage)) {
      logErrorForDebug(error, 'SILENT_ERROR_403');
      // Return a silent error that won't trigger error toasts
      return Promise.reject(userMessage);
    }
    
    // Create a new error object with user-friendly message
    const customError = new Error(userMessage);
    customError.response = error.response;
    customError.request = error.request;
    customError.originalError = error;
    
    return Promise.reject(customError);
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

export const tasksAPI = {
  getMyTasks: () => api.get('/tasks/user/my-tasks'),

  getTaskDetail: (taskId) => api.get(`/tasks/user/${taskId}`),

  updateTaskStatus: (taskId, status) => api.put(`/tasks/user/${taskId}/status`, { status }),

  uploadFile: (taskId, formData) => api.post(`/tasks/user/${taskId}/upload-file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  downloadFile: (fileId) => api.get(`/tasks/file/${fileId}/download`, {
    responseType: 'blob'
  }),
};

export default api;
