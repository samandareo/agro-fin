import React, { useState } from 'react';
import { useTasks } from '../contexts/TasksContext';
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TaskDetail from './TaskDetail';
import { formatDateToDDMMYYYY, formatDateTimeTo24Hour } from '../utils/fileUtils';

const TasksPage = () => {
  const { tasks, loading, getTaskDetail, selectedTask, setSelectedTask, loadTasks, loadArchivedTasks, pagination } = useTasks();
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

  // Get the correct pagination for the current tab
  const currentPagination = activeTab === 'active' ? pagination.activePagination : pagination.archivedPagination;

  const getStatusColor = (status) => {
    const colors = {
      'assigned': 'bg-blue-50 text-blue-700 border-blue-200',
      'in_progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'completed': 'bg-green-50 text-green-700 border-green-200',
      'pending': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'assigned': <Clock className="h-4 w-4" />,
      'in_progress': <AlertCircle className="h-4 w-4" />,
      'completed': <CheckCircle2 className="h-4 w-4" />,
      'pending': <Clock className="h-4 w-4" />
    };
    return icons[status] || icons['pending'];
  };

  const getStatusLabel = (status) => {
    const labels = {
      'assigned': t('tasks.status.assigned'),
      'in_progress': t('tasks.status.inProgress'),
      'completed': t('tasks.status.completed'),
      'pending': t('tasks.status.pending')
    };
    return labels[status] || status;
  };

  const handleTaskClick = async (task) => {
    const result = await getTaskDetail(task.id);
    if (result.success) {
      setSelectedTask(task);
      setShowDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedTask(null);
  };

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

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('tasks.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('tasks.title')}
          </h1>
          <p className="mt-2 text-gray-600">{t('tasks.description')}</p>
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
                {t('tasks.activeTasks')} ({pagination.activePagination?.totalCount || 0})
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
                {t('tasks.archivedTasks')} ({pagination.archivedPagination?.totalCount || 0})
              </div>
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'active' ? t('tasks.noTasks') : t('tasks.noArchivedTasks')}
            </h3>
            <p className="mt-2 text-gray-600">
              {activeTab === 'active' ? t('tasks.noTasksDesc') : t('tasks.noArchivedTasksDesc')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer"
                >
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {task.title}
                        </h3>
                        <div className={`ml-4 flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(task.user_status)}`}>
                          {getStatusIcon(task.user_status)}
                          {getStatusLabel(task.user_status)}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        {task.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {t('tasks.deadline')}: {formatDateTimeTo24Hour(task.deadline)}
                            </span>
                          </div>
                        )}

                        {task.status_updated_at && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              {t('tasks.updated')}: {formatDateTimeTo24Hour(task.status_updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-6 w-6 text-gray-400 ml-4 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {currentPagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-lg">
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
          </>
        )}
      </div>

      {showDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default TasksPage;
