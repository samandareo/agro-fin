import React, { createContext, useContext, useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DocumentContext = createContext();

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    title: '',
    year: '',
    month: '',
    date: '',
    startDate: '',
    endDate: '',
    groupId: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    groups: []
  });

  const loadFilterOptions = async () => {
    try {
      const response = await documentsAPI.getUserFilterOptions();
      setFilterOptions(response.data.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadDocuments = async (newFilters = {}) => {
    setLoading(true);
    try {
      const mergedFilters = { ...filters, ...newFilters };
      const response = await documentsAPI.getUserDocuments(mergedFilters);
      
      if (response.data.data.documents) {
        setDocuments(response.data.data.documents);
      }
      if (response.data.data.pagination) {
        setPagination(response.data.data.pagination);
      }
      setFilters(mergedFilters);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load documents');
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (formData) => {
    try {
      const response = await documentsAPI.createDocument(formData);
      toast.success('Document uploaded successfully');
      loadDocuments();
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
      return { success: false, message: error.response?.data?.message };
    }
  };

  const updateDocument = async (documentId, formData) => {
    try {
      const response = await documentsAPI.updateDocument(documentId, formData);
      toast.success('Document updated successfully');
      loadDocuments();
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update document');
      return { success: false, message: error.response?.data?.message };
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await documentsAPI.deleteDocument(documentId);
      toast.success('Delete request sent to admin');
      loadDocuments();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send delete request');
      return { success: false, message: error.response?.data?.message };
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const response = await documentsAPI.downloadDocument(documentId);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download document');
    }
  };

  const applyFilters = (newFilters) => {
    if (newFilters.title !== undefined) {
      clearTimeout(applyFilters.timeoutId);
      applyFilters.timeoutId = setTimeout(() => {
        loadDocuments({ ...newFilters, page: 1 });
      }, 500);
    } else {
      loadDocuments({ ...newFilters, page: 1 });
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      title: '',
      year: '',
      month: '',
      date: '',
      startDate: '',
      endDate: '',
      groupId: '',
      page: 1,
      limit: 10
    };
    loadDocuments(clearedFilters);
  };

  const changePage = (page) => {
    loadDocuments({ ...filters, page });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFilterOptions();
      loadDocuments();
    } else {
      setDocuments([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20,
        hasNext: false,
        hasPrev: false
      });
    }
  }, [isAuthenticated]);

  const value = {
    documents,
    loading,
    filters,
    pagination,
    filterOptions,
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    applyFilters,
    clearFilters,
    changePage,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};
