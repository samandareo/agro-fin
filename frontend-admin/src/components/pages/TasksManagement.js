import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tasksAPI, usersAPI } from '../../services/api';
import { Plus, Trash2, Users, FileText, Download, Clock, Edit2, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { handleContextError } from '../../utils/apiErrorHelper';
import TaskCreateModal from '../modals/TaskCreateModal';
import TaskDetailModal from '../modals/TaskDetailModal';
import { formatDateToDDMMYYYY, formatDateTimeTo24Hour } from '../../utils/fileUtils';

const TasksManagement = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
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

  const currentPagination = activeTab === 'active' ? activePagination : archivedPagination;

  // Refs to hold the latest pagination limits so callbacks don't need to depend on pagination state
  const activeLimitRef = useRef(activePagination.limit || 20);
  const archivedLimitRef = useRef(archivedPagination.limit || 20);

  useEffect(() => {
    activeLimitRef.current = activePagination.limit || 20;
  }, [activePagination.limit]);

  useEffect(() => {
    archivedLimitRef.current = archivedPagination.limit || 20;
  }, [archivedPagination.limit]);

  const loadTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const limit = activeLimitRef.current || 20;
      const response = await tasksAPI.getActiveAdmin({ page, limit });
      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
        setActivePagination(prev => response.data.data.pagination || prev);
      } else {
        toast.error(response.data.message || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      handleContextError(error, 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArchivedTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const limit = archivedLimitRef.current || 20;
      const response = await tasksAPI.getArchivedAdmin({ page, limit });
      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
        setArchivedPagination(prev => response.data.data.pagination || prev);
      } else {
        toast.error(response.data.message || 'Failed to load archived tasks');
      }
    } catch (error) {
      console.error('Error loading archived tasks:', error);
      handleContextError(error, 'Failed to load archived tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'active') {
      loadTasks(1);
    } else {
      loadArchivedTasks(1);
    }
  };

  const handlePagination = (page) => {
    if (activeTab === 'active') {
      loadTasks(page);
    } else {
      loadArchivedTasks(page);
    }
  };

  const handleCreateTask = async (newTask) => {
    try {
      // Extract files from the task data
      const { attachedFiles, ...taskData } = newTask;

      console.log('=== Creating Task ===');
      console.log('Task data:', taskData);
      console.log('Deadline:', taskData.deadline);
      console.log('Deadline type:', typeof taskData.deadline);

      // Create the task
      const response = await tasksAPI.create(taskData);
      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to create task');
        return;
      }

      const createdTaskId = response.data.data?.id;
      if (!createdTaskId) {
        toast.error('Task created but ID not received');
        return;
      }

      // Upload files if any are provided
      if (attachedFiles && attachedFiles.length > 0) {
        let filesUploaded = 0;
        let filesFailed = 0;

        console.log(`Starting file upload for ${attachedFiles.length} file(s) to task ${createdTaskId}`);

        for (const file of attachedFiles) {
          try {
            console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);

            const formData = new FormData();
            formData.append('file', file);

            // Log FormData contents for debugging
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
              console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size}b)` : value);
            }

            const response = await tasksAPI.uploadFile(createdTaskId, formData);
            console.log(`File ${file.name} uploaded successfully:`, response.data);
            filesUploaded++;
            toast.success(`File ${file.name} uploaded`);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error.response?.data || error.message);
            filesFailed++;
            toast.error(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`);
          }
        }

        if (filesUploaded > 0) {
          toast.success(`Task created and ${filesUploaded} file(s) uploaded`);
        } else if (filesFailed > 0) {
          toast.warning(`Task created but ${filesFailed} file(s) failed to upload`);
        }
      } else {
        toast.success(t('tasks.taskCreatedSuccessfully'));
      }

      setShowCreateModal(false);
      loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm(t('tasks.confirmDelete'))) {
      try {
        const response = await tasksAPI.delete(taskId);
        if (response.data.success) {
          toast.success('Task deleted successfully');
          loadTasks();
        } else {
          toast.error(response.data.message || 'Failed to delete task');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleToggleExpand = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800 border border-blue-300',
      'in_progress': 'bg-amber-100 text-amber-800 border border-amber-300',
      'completed': 'bg-green-100 text-green-800 border border-green-300',
      'closed': 'bg-red-100 text-red-800 border border-red-300'
    };
    return colors[status] || colors['open'];
  };

  const getStatusLabel = (status) => {
    const labels = {
      'open': t('tasks.status.open'),
      'in_progress': t('tasks.status.inProgress'),
      'completed': t('tasks.status.completed'),
      'closed': t('tasks.status.closed')
    };
    return labels[status] || status;
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('tasks.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tasks.management')}</h1>
          <p className="text-gray-600 mt-1">{t('tasks.manageTasksDescription')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {t('tasks.createTask')}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => handleTabChange('active')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('tasks.activeTasks')} ({activePagination?.totalCount || 0})
            </div>
          </button>
          <button
            onClick={() => handleTabChange('archived')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'archived'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              {t('tasks.archivedTasks')} ({archivedPagination?.totalCount || 0})
            </div>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('tasks.totalTasks')}</p>
              <p className="text-2xl font-bold text-gray-900">{currentPagination.totalCount}</p>
            </div>
            <FileText className="h-10 w-10 text-brand-600" />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('tasks.noTasks')}</h3>
          <p className="text-gray-600 mt-2">{t('tasks.createFirstTask')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">{t('tasks.title')}</th>
                  <th className="table-header">{t('tasks.statusLabel')}</th>
                  <th className="table-header">{t('tasks.assignedUsers')}</th>
                  <th className="table-header">{t('tasks.attachedFiles')}</th>
                  <th className="table-header">{t('tasks.deadline')}</th>
                  <th className="table-header">{t('tasks.createdBy')}</th>
                  <th className="table-header text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTaskClick(task)}
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900 hover:text-brand-600">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-gray-600 text-sm line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {task.assigned_users_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {task.files_count || 0}
                          </span>
                          {(task.files_count || 0) > 0 && (
                            <span className="text-xs text-gray-500">
                              {t('tasks.filesCount')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.deadline ? formatDateTimeTo24Hour(task.deadline) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.created_by_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleTaskClick(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleExpand(task.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {expandedTaskId === task.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row - Task Details & Users */}
                    {expandedTaskId === task.id && (
                      <tr className="bg-gray-50 border-t border-b border-gray-200">
                        <td colSpan="7" className="px-6 py-4">
                          <TaskDetailModal
                            task={task}
                            onTaskUpdated={() => handleTabChange(activeTab)}
                            isCompact={true}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {currentPagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {t('common.page')} {currentPagination.currentPage} {t('common.of')} {currentPagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePagination(currentPagination.currentPage - 1)}
                  disabled={!currentPagination.hasPrev || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => handlePagination(currentPagination.currentPage + 1)}
                  disabled={!currentPagination.hasNext || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TaskCreateModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleCreateTask}
        />
      )}

      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowDetailModal(false)}
          onTaskUpdated={() => handleTabChange(activeTab)}
        />
      )}
    </div>
  );
};

export default TasksManagement;
