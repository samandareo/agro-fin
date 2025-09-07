import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const UsersContext = createContext();

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    name: '',
    telegramId: '',
    groupId: '',
    status: ''
  });

  const loadUsers = async (page = 1, limit = 20, searchFilters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...searchFilters
      };

      const response = await usersAPI.getAll(params);
      
      if (response.data.success) {
        const usersData = response.data.data;
        if (Array.isArray(usersData)) {
          setUsers(usersData);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: usersData.length,
            limit: 20,
            hasNext: false,
            hasPrev: false
          });
        } else {
          setUsers(usersData.users || []);
          setPagination(usersData.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 20,
            hasNext: false,
            hasPrev: false
          });
        }
      } else {
        toast.error(response.data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: pagination.limit,
        ...searchFilters
      };

      const response = await usersAPI.search(params);
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false
        });
        setFilters(searchFilters);
      } else {
        toast.error(response.data.message || 'Failed to search users');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await usersAPI.create(userData);
      
      if (response.data.success) {
        toast.success('User created successfully');
        loadUsers(pagination.currentPage, pagination.limit, filters);
        return { success: true };
      } else {
        toast.error(response.data.message || 'Failed to create user');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await usersAPI.update(userId, userData);
      
      if (response.data.success) {
        toast.success('User updated successfully');
        loadUsers(pagination.currentPage, pagination.limit, filters);
        return { success: true };
      } else {
        toast.error(response.data.message || 'Failed to update user');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
      return { success: false, message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await usersAPI.delete(userId);
      
      if (response.data.success) {
        toast.success('User deleted successfully');
        loadUsers(pagination.currentPage, pagination.limit, filters);
        return { success: true };
      } else {
        toast.error(response.data.message || 'Failed to delete user');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePage = (page) => {
    loadUsers(page, pagination.limit, filters);
  };

  const changePageSize = (newLimit) => {
    loadUsers(1, parseInt(newLimit), filters);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      telegramId: '',
      groupId: '',
      status: ''
    });
    loadUsers(1, pagination.limit);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const value = {
    users,
    loading,
    pagination,
    filters,
    loadUsers,
    searchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePage,
    changePageSize,
    clearFilters
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};
