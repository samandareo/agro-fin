import axios from 'axios';

const api = axios.create({
  baseURL: 'http://fin.agrobank.uz/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
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
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/admins/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('admin_access_token', accessToken);
          localStorage.setItem('admin_refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const adminAuthAPI = {
  login: (credentials) => api.post('/admins/login', credentials),
  register: (adminData) => api.post('/admins/register', adminData),
  refreshToken: (refreshToken) => api.post('/admins/refresh', { refreshToken }),
};

export const adminProfileAPI = {
  getProfile: () => api.get('/admins'),
  updateProfile: (profileData) => api.put('/admins', profileData),
};

export const usersAPI = {
  getAll: (params) => api.get('/admins/users', { params }),
  getById: (userId) => api.get(`/admins/users/${userId}`),
  create: (userData) => api.post('/admins/users', userData),
  update: (userId, userData) => api.put(`/admins/users/${userId}`, userData),
  delete: (userId) => api.delete(`/admins/users/${userId}`),
  search: (params) => api.get('/admins/search/users', { params }),
};

export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (groupId) => api.get(`/groups/${groupId}`),
  create: (groupData) => api.post('/groups', groupData),
  update: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  delete: (groupId) => api.delete(`/groups/${groupId}`),
  getSubgroups: (parentId) => api.get(`/groups/subgroups/${parentId}`),
  getRootGroups: () => api.get('/groups/subgroups/0'),
};

export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (documentId) => api.get(`/documents/${documentId}`),
  getInfo: (documentId) => api.get(`/documents/${documentId}/info`),
  download: (documentId) => api.get(`/documents/${documentId}/download`, { responseType: 'blob' }),
  update: (documentId, formData) => api.put(`/documents/${documentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (documentId) => api.delete(`/documents/${documentId}`),
  getFiltered: (params) => api.get('/documents/admin/filter', { params }),
  getFilterOptions: () => api.get('/documents/admin/filter-options'),
  search: (params) => api.get('/admins/search/documents', { params }),
  getByUploaderId: (uploaderId, params = {}) => api.get(`/documents/uploaded/${uploaderId}`, { params }),
};

export const deleteRequestsAPI = {
  getAll: (params) => api.get('/delete-requests', { params }),
  getById: (requestId) => api.get(`/delete-requests/${requestId}`),
  update: (requestId, data) => api.put(`/delete-requests/${requestId}`, data),
  getByStatus: (status) => api.get(`/delete-requests/status/${status}`),
  getPendingCount: () => api.get('/delete-requests/admin/pending-count'),
};


export const permissionsAPI = {
  getAll: () => api.get('/permissions'),
  getById: (permissionId) => api.get(`/permissions/${permissionId}`),
  create: (permissionData) => api.post('/permissions', permissionData),
  update: (permissionId, permissionData) => api.put(`/permissions/${permissionId}`, permissionData),
  delete: (permissionId) => api.delete(`/permissions/${permissionId}`),
};

export const rolePermissionsAPI = {
  getByRole: (roleId) => api.get(`/role-permissions/${roleId}`),
  assign: (data) => api.post('/role-permissions', data),
  revoke: (data) => api.delete('/role-permissions', { data }),
};

export const notificationsAPI = {
  sendNotification: (messageData) => api.post('/notifications/admin/send', messageData),
  getAll: (params) => api.get('/notifications/admin/all', { params }),
  delete: (notificationId) => api.delete(`/notifications/admin/${notificationId}`),
};

export default api;
