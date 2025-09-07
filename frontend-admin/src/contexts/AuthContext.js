import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        setIsAuthenticated(true);
        setAdmin({ role: 'admin' });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await adminAuthAPI.login(credentials);
      
      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;
        
        localStorage.setItem('admin_access_token', accessToken);
        localStorage.setItem('admin_refresh_token', refreshToken);
        
        setIsAuthenticated(true);
        setAdmin({ role: 'admin' });
        
        toast.success(t('login.loginSuccess'));
        return { success: true };
      } else {
        toast.error(response.data.message || t('login.loginError'));
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || t('login.loginError');
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    setIsAuthenticated(false);
    setAdmin(null);
    toast.success(t('login.logoutSuccess'));
  };

  const value = {
    isAuthenticated,
    admin,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
