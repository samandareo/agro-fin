import React, { useState, useEffect } from 'react';
import { Bell, Eye, EyeOff, Check, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationsContext';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getUserNotifications({
        page: page.toString(),
        limit: '20'
      });
      if (response.data.success) {
        setNotifications(response.data.data?.notifications || []);
        setPagination(response.data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error(response.data.message || t('notifications.fetchError'));
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        toast.success(t('notifications.markedAsRead'));
        refreshUnreadCount(); // Refresh the unread count in header
      } else {
        toast.error(response.data.message || t('notifications.markReadError'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(t('notifications.markReadError'));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            is_read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        toast.success(t('notifications.allMarkedAsRead'));
        refreshUnreadCount(); // Refresh the unread count in header
      } else {
        toast.error(response.data.message || t('notifications.markAllReadError'));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error(t('notifications.markAllReadError'));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.is_read).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="h-8 w-8 mr-3 text-brand-600" />
                {t('notifications.title')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('notifications.subtitle')}
              </p>
            </div>
            
            {getUnreadCount() > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-primary flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-gray-500">{t('notifications.loadingNotifications')}</p>
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">{t('notifications.noNotificationsFound')}</p>
                <p className="text-sm">{t('notifications.noNotificationsDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications && notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t('notifications.unread')}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="flex items-center mr-4">
                            <Clock className="h-4 w-4 mr-1" />
                            {t('notifications.sentBy')} {notification.sender_name}
                          </span>
                          <span>
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        {!notification.is_read ? (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t('notifications.markAsRead')}
                          </button>
                        ) : (
                          <div className="flex items-center text-sm text-gray-500">
                            <EyeOff className="h-4 w-4 mr-1" />
                            {t('notifications.read')}
                            {notification.read_at && (
                              <span className="ml-2">
                                {formatDate(notification.read_at)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous')}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next')}
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {t('common.showing')}{' '}
                      <span className="font-medium">
                        {pagination.totalCount > 0 ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0}
                      </span>{' '}
                      {t('common.to')}{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                      </span>{' '}
                      {t('common.of')}{' '}
                      <span className="font-medium">{pagination.totalCount}</span>{' '}
                      {t('common.results')}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common.previous')}
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common.next')}
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
