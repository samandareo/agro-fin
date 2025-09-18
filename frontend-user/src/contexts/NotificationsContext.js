import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data?.unreadCount || 0);
      } else {
        console.error('Error fetching unread count:', response.data.message);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Refresh unread count
  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  // Load unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    unreadCount,
    loading,
    refreshUnreadCount,
    fetchUnreadCount
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
