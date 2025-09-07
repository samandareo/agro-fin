import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  FileText, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { deleteRequestsAPI } from '../../services/api';
import { formatDateToDDMMYYYY } from '../../utils/fileUtils';
import { useDeleteRequests } from '../../contexts/DeleteRequestsContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const DeleteRequestsManagement = () => {
  const { t } = useTranslation();
  const { updatePendingCount } = useDeleteRequests();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });

  const [statusFilter, setStatusFilter] = useState('pending');

  const loadRequests = async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: status !== 'all' ? status : undefined
      };

      const response = await deleteRequestsAPI.getAll(params);
      
      if (response.data.success) {
        const data = response.data.data;
        setRequests(data.requests || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: pagination.limit,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error(response.data.message || 'Failed to load delete requests');
      }
    } catch (error) {
      console.error('Error loading delete requests:', error);
      toast.error('Failed to load delete requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    loadRequests(1, status);
  };

  const handlePageChange = (page) => {
    loadRequests(page, statusFilter);
  };

  const handleApproveRequest = async (request) => {
    try {
      const response = await deleteRequestsAPI.update(request.id, { status: 'approved' });
      if (response.data.success) {
        toast.success(t('deleteRequests.requestApproved'));
        updatePendingCount(-1);
        loadRequests(pagination.currentPage, statusFilter);
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t('common.error'));
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const response = await deleteRequestsAPI.update(request.id, { status: 'rejected' });
      if (response.data.success) {
        toast.success(t('deleteRequests.requestRejected'));
        updatePendingCount(-1);
        loadRequests(pagination.currentPage, statusFilter);
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('common.error'));
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trash2 className="h-8 w-8 mr-3 text-brand-600" />
            {t('deleteRequests.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('deleteRequests.statusFilter')}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            {t('deleteRequests.statusFilter')}:
          </label>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: t('deleteRequests.allStatus') },
              { value: 'pending', label: t('deleteRequests.pending') },
              { value: 'approved', label: t('deleteRequests.approved') },
              { value: 'rejected', label: t('deleteRequests.rejected') }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusFilterChange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Requests Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">{t('deleteRequests.document')}</th>
                <th className="table-header">{t('deleteRequests.requester')}</th>
                <th className="table-header">{t('deleteRequests.status')}</th>
                <th className="table-header">{t('deleteRequests.requestDate')}</th>
                <th className="table-header">{t('deleteRequests.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>
                      {t('deleteRequests.loadingRequests')}
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-8">
                    <div className="text-gray-500">
                      <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">{t('deleteRequests.noRequestsFound')}</p>
                      <p className="text-sm">
                        {t('deleteRequests.noRequestsFound')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {request.document_title || t('common.noData')}
                          </div>
                          <div className="text-sm text-gray-500">
                            Document ID: {request.document_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {request.requester_name || t('common.noData')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadge(request.status)}>
                        {getStatusIcon(request.status)}
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateToDDMMYYYY(request.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      {request.status === 'pending' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-lg hover:bg-green-50"
                            title={t('deleteRequests.approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title={t('deleteRequests.reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {request.status === 'approved' ? t('deleteRequests.approved') : t('deleteRequests.rejected')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.currentPage - 1) * pagination.limit) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'z-10 bg-brand-50 border-brand-500 text-brand-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
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

export default DeleteRequestsManagement;