import React, { createContext, useContext, useState, useEffect } from 'react';
import { deleteRequestsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { formatDateToDDMMYYYY } from '../utils/fileUtils';
import toast from 'react-hot-toast';

const DeleteRequestContext = createContext();

export const useDeleteRequests = () => {
  const context = useContext(DeleteRequestContext);
  if (!context) {
    throw new Error('useDeleteRequests must be used within a DeleteRequestProvider');
  }
  return context;
};

export const DeleteRequestProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDeleteRequests = async () => {
    setLoading(true);
    try {
      const response = await deleteRequestsAPI.getUserDeleteRequests();
      setDeleteRequests(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load delete requests');
      console.error('Error loading delete requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDeleteRequest = async (documentId) => {
    try {
      const response = await deleteRequestsAPI.createDeleteRequest(documentId);
      toast.success('Delete request sent to admin');
      loadDeleteRequests();
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create delete request');
      return { success: false, message: error.response?.data?.message };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      formatted: formatDateToDDMMYYYY(dateString)
    };
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDeleteRequests();
    } else {
      setDeleteRequests([]);
    }
  }, [isAuthenticated]);

  const value = {
    deleteRequests,
    loading,
    loadDeleteRequests,
    createDeleteRequest,
    getStatusColor,
    getStatusIcon,
    formatDate,
  };

  return (
    <DeleteRequestContext.Provider value={value}>
      {children}
    </DeleteRequestContext.Provider>
  );
};
