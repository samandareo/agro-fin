import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Trash2, Users, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../services/api';

const MessagesManagement = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState({ title: '', message: '' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });

  // Fetch messages
  const fetchMessages = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: '10'
      };

      if (search) {
        params.title = search;
        params.message = search;
      }

      const response = await notificationsAPI.getAll(params);
      if (response.data.success) {
        setMessages(response.data.data?.notifications || []);
        setPagination(response.data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 10,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error(response.data.message || t('messages.fetchError'));
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Send new message
  const sendMessage = async () => {
    if (!newMessage.title.trim() || !newMessage.message.trim()) {
      toast.error(t('messages.fillAllFields'));
      return;
    }

    try {
      setSending(true);
      const response = await notificationsAPI.sendNotification(newMessage);
      if (response.data.success) {
        toast.success(t('messages.sentSuccessfully'));
        setNewMessage({ title: '', message: '' });
        fetchMessages(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.data.message || t('messages.sendError'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || t('messages.sendError');
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm(t('messages.deleteConfirm'))) {
      return;
    }

    try {
      const response = await notificationsAPI.delete(messageId);
      if (response.data.success) {
        toast.success(t('messages.deletedSuccessfully'));
        fetchMessages(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.data.message || t('messages.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      const errorMessage = error.response?.data?.message || t('messages.deleteError');
      toast.error(errorMessage);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchMessages(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchMessages(page, searchTerm);
  };

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-brand-600" />
            {t('messages.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('messages.subtitle')}
          </p>
        </div>
      </div>

      {/* Send Message Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('messages.sendNewMessage')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('messages.messageTitle')}
            </label>
            <input
              type="text"
              value={newMessage.title}
              onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
              placeholder={t('messages.titlePlaceholder')}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('messages.messageText')}
            </label>
            <textarea
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              placeholder={t('messages.messagePlaceholder')}
              rows={4}
              className="input-field resize-none"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={sending}
            className="btn-primary flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? t('messages.sending') : t('messages.sendMessage')}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('messages.searchPlaceholder')}
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center">
            <Search className="h-4 w-4 mr-2" />
            {t('common.search')}
          </button>
        </form>
      </div>

      {/* Messages Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('messages.sentMessages')}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-500">{t('messages.loadingMessages')}</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">{t('messages.noMessagesFound')}</p>
            <p className="text-sm">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">{t('messages.title')}</th>
                  <th className="table-header">{t('messages.message')}</th>
                  <th className="table-header">{t('messages.recipients')}</th>
                  <th className="table-header">{t('messages.readCount')}</th>
                  <th className="table-header">{t('messages.sentDate')}</th>
                  <th className="table-header">{t('messages.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages && messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {message.title}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {message.message}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1" />
                        {message.total_recipients || 0}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-900">
                        <Eye className="h-4 w-4 mr-1" />
                        {message.read_count || 0}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title={t('messages.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  );
};

export default MessagesManagement;
