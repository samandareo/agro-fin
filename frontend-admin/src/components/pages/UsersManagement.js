import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../contexts/UsersContext';
import { Users, Plus, Search, Edit, Trash2, FileText, User } from 'lucide-react';
import UserModal from '../modals/UserModal';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const UsersManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    users, 
    loading, 
    pagination, 
    filters, 
    searchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    changePage, 
    changePageSize, 
    clearFilters 
  } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [userModal, setUserModal] = useState({ isOpen: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    const searchFilters = {
      name: searchTerm || undefined,
      telegramId: searchTerm || undefined,
      status: value !== 'all' ? value === 'active' : undefined
    };
    searchUsers(searchFilters);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || statusFilter !== 'all') {
        const searchFilters = {
          name: searchTerm || undefined,
          telegramId: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter === 'active' : undefined
        };
        searchUsers(searchFilters);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchFilters = {
      name: searchTerm || undefined,
      telegramId: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter === 'active' : undefined
    };
    searchUsers(searchFilters);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    clearFilters();
  };

  const handleCreateUser = () => {
    setUserModal({ isOpen: true, user: null });
  };

  const handleEditUser = (user) => {
    setUserModal({ isOpen: true, user });
  };

  const handleDeleteUser = async (user) => {
    const result = await deleteUser(user.id);
    if (result.success) {
      setDeleteConfirm(null);
    }
  };

  const handleViewDocuments = (user) => {
    navigate(`/users/${user.id}/documents`);
  };

  const handleSaveUser = async (userData) => {
    if (userModal.user) {
      const result = await updateUser(userModal.user.id, userData);
      if (result.success) {
        toast.success(t('users.userUpdated'));
        setUserModal({ isOpen: false, user: null });
      }
      return result;
    } else {
      const result = await createUser(userData);
      if (result.success) {
        toast.success(t('users.userCreated'));
        setUserModal({ isOpen: false, user: null });
      }
      return result;
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('users.title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('users.searchUsers')}
          </p>
        </div>
        <button 
          onClick={handleCreateUser}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('users.addUser')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="input-field"
            >
              <option value="all">{t('users.allStatus')}</option>
              <option value="active">{t('users.active')}</option>
              <option value="inactive">{t('users.inactive')}</option>
            </select>
            <button type="submit" className="btn-primary flex items-center">
              <Search className="h-4 w-4 mr-2" />
              {t('common.search')}
            </button>
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="btn-secondary flex items-center"
            >
              {t('common.clear')}
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('users.title')}</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-500">{t('users.loadingUsers')}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">{t('users.noUsersFound')}</p>
            <p className="text-sm">{t('users.addUser')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">{t('users.name')}</th>
                  <th className="table-header">{t('users.telegramId')}</th>
                  <th className="table-header">{t('users.status')}</th>
                  <th className="table-header">{t('users.groups')}</th>
                  <th className="table-header">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-brand-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-gray-900">
                        {user.telegram_id}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status ? t('users.active') : t('users.inactive')}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-900">
                        {user.group_name || t('common.noData')}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDocuments(user)}
                            className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                            title={t('users.viewDocuments')}
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-500 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50"
                            title={t('users.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title={t('users.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => changePage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => changePage(pagination.currentPage + 1)}
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
                    onClick={() => changePage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous')}
                  </button>
                  <button
                    onClick={() => changePage(pagination.currentPage + 1)}
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

      {/* User Modal */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={() => setUserModal({ isOpen: false, user: null })}
        user={userModal.user}
        onSave={handleSaveUser}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('users.deleteConfirm')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('users.deleteConfirmDesc')}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="btn-danger"
                >
                  {t('users.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
