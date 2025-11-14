import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import api, { tasksAPI } from '../services/api';

const TasksContext = createContext();

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

export const TasksProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [activeTasksCount, setActiveTasksCount] = useState(0);

  // Separate pagination states for active and archived tasks
  const [activePagination, setActivePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });

  const [archivedPagination, setArchivedPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });

  // Return the appropriate pagination based on current context
  const pagination = {
    currentPage: activePagination.currentPage,
    totalPages: activePagination.totalPages,
    totalCount: activePagination.totalCount,
    limit: activePagination.limit,
    hasNext: activePagination.hasNext,
    hasPrev: activePagination.hasPrev,
    setActivePagination,
    setArchivedPagination,
    activePagination,
    archivedPagination
  };

  const loadTasks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/user/active-tasks', {
        params: { page, limit: 20 }
      });
      setTasks(response.data.data.tasks || []);
      setActivePagination(response.data.data.pagination || activePagination);
      // Update the active tasks count
      setActiveTasksCount(response.data.data.pagination?.totalCount || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load tasks');
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedTasks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/user/archived-tasks', {
        params: { page, limit: 20 }
      });
      setTasks(response.data.data.tasks || []);
      setArchivedPagination(response.data.data.pagination || archivedPagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load archived tasks');
      console.error('Error loading archived tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskDetail = async (taskId) => {
    try {
      const response = await api.get(`/tasks/user/${taskId}`);
      setTaskDetails(response.data.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load task details');
      console.error('Error loading task details:', error);
      return { success: false, message: error.response?.data?.message };
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await api.put(`/tasks/user/${taskId}/status`, { status });

      // Determine the appropriate success message
      let successMessage = 'Vazifa holati muvaffaqiyatli yangilandi';
      if (status === 'completed') {
        successMessage = 'Vazifa bajarildi va arxivlandi!';
      }
      toast.success(successMessage);

      // Update in local state - only update user_status
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            user_status: status
          };
        }
        return task;
      }));

      // Update task details if viewing - only update user_status
      if (taskDetails && taskDetails.id === taskId) {
        setTaskDetails({
          ...taskDetails,
          user_status: status,
          status_updated_at: response.data.data.updated_at
        });
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
      return { success: false, message: error.response?.data?.message };
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await api.get(`/tasks/file/${fileId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download file');
    }
  };

  const uploadFile = async (taskId, formData) => {
    try {
      const response = await api.post(`/tasks/user/${taskId}/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update task details with the new file
      if (taskDetails && taskDetails.id === parseInt(taskId)) {
        setTaskDetails(response.data.data);
      }
      
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to upload file' 
      };
    }
  };

  const deleteFile = async (fileId) => {
    try {
      const response = await tasksAPI.deleteFile(fileId);
      
      // Update task details by removing the deleted file
      if (taskDetails && response.data.data) {
        setTaskDetails(response.data.data);
      }
      
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Delete file error:', error);
      const errorMessage = error.response?.data?.message || 'Не удалось удалить файл';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      setTasks([]);
      setTaskDetails(null);
    }
  }, [isAuthenticated]);

  const value = {
    tasks,
    loading,
    taskDetails,
    selectedTask,
    setSelectedTask,
    loadTasks,
    loadArchivedTasks,
    getTaskDetail,
    updateTaskStatus,
    downloadFile,
    uploadFile,
    deleteFile,
    pagination,
    activeTasksCount
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
