import React, { createContext, useContext, useState, useEffect } from 'react';
import { deleteRequestsAPI } from '../services/api';

const DeleteRequestsContext = createContext();

export const useDeleteRequests = () => {
  const context = useContext(DeleteRequestsContext);
  if (!context) {
    throw new Error('useDeleteRequests must be used within a DeleteRequestsProvider');
  }
  return context;
};

export const DeleteRequestsProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPendingCount = async () => {
    try {
      setLoading(true);
      const response = await deleteRequestsAPI.getPendingCount();
      if (response.data.success) {
        setPendingCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching pending delete requests count:', error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updatePendingCount = (change) => {
    setPendingCount(prev => Math.max(0, prev + change));
  };

  const refreshPendingCount = () => {
    fetchPendingCount();
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const value = {
    pendingCount,
    loading,
    fetchPendingCount,
    updatePendingCount,
    refreshPendingCount
  };

  return (
    <DeleteRequestsContext.Provider value={value}>
      {children}
    </DeleteRequestsContext.Provider>
  );
};

