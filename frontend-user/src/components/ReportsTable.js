import React, { useState, useEffect } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { useDeleteRequests } from '../contexts/DeleteRequestContext';
import { Edit, Trash2, Download, Clock } from 'lucide-react';
import { generateDownloadFileName, getFileTypeIcon, formatDateToDDMMYYYY } from '../utils/fileUtils';
import EditModal from './EditModal';
import { useTranslation } from 'react-i18next';

const ReportsTable = () => {
  const { documents, loading, pagination, changePage, deleteDocument, downloadDocument, loadDocuments, filters } = useDocuments();
  const { deleteRequests, createDeleteRequest } = useDeleteRequests();
  const [editModal, setEditModal] = useState({ isOpen: false, document: null });
  const [pendingDeletes, setPendingDeletes] = useState(new Set());
  const [paginationLoading, setPaginationLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const pendingIds = new Set();
    deleteRequests.forEach(request => {
      if (request.status === 'pending') {
        pendingIds.add(request.document_id);
      }
    });
    setPendingDeletes(pendingIds);
  }, [deleteRequests]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      formatted: formatDateToDDMMYYYY(dateString)
    };
  };

  const handleEdit = (document) => {
    setEditModal({ isOpen: true, document });
  };

  const handleDelete = async (documentId) => {
    if (window.confirm(t('documents.deleteRequestSend'))) {
      await createDeleteRequest(documentId);
    }
  };

  const handleDownload = async (document) => {
    const fileName = generateDownloadFileName(document.title, document.file_path);
    await downloadDocument(document.id, fileName);
  };

  const handlePageChange = async (page) => {
    setPaginationLoading(true);
    try {
      await changePage(page);
    } finally {
      setPaginationLoading(false);
    }
  };

  const handlePageSizeChange = async (newLimit) => {
    setPaginationLoading(true);
    try {
      const newFilters = { ...filters, limit: parseInt(newLimit), page: 1 };
      await loadDocuments(newFilters);
    } finally {
      setPaginationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('documents.loadingReports')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">{t('documents.reportName')}</th>
                <th className="table-header">{t('documents.day')}</th>
                <th className="table-header">{t('documents.month')}</th>
                <th className="table-header">{t('documents.year')}</th>
                <th className="table-header">{t('documents.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginationLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mb-2"></div>
                      <p>{t('documents.loadingReports')}</p>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📄</span>
                      </div>
                      <p className="text-lg font-medium">{t('documents.noReportsFound')}</p>
                      <p className="text-sm">{t("documents.uploadFirstReport")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((document) => {
                  const dateInfo = formatDate(document.upload_at);
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-brand-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-brand-600 font-medium text-sm">
                              {getFileTypeIcon(document.file_path)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {dateInfo.day}
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {t('months.' + dateInfo.month)}
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {dateInfo.year}
                      </td>
                      <td className="table-cell">
                          {pendingDeletes.has(String(document.id)) ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              {t('deleteRequests.pending')}
                            </span>
                          ) : (
                            <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handleDownload(document)}
                                className="text-gray-500 hover:text-brand-600 transition-colors p-2 rounded-lg hover:bg-brand-50"
                                title={t('documents.download')}
                            >
                                <Download className="h-4 w-4" />
                            </button>
                              <button
                                onClick={() => handleEdit(document)}
                                className="text-gray-500 hover:text-info-600 transition-colors p-2 rounded-lg hover:bg-info-50"
                                title={t('documents.edit')}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(document.id)}
                                className="text-gray-500 hover:text-error-600 transition-colors p-2 rounded-lg hover:bg-error-50"
                                title={t('documents.delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="relative bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            {paginationLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">{t('documents.show')}:</label>
              <select
                value={pagination.limit}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">{t('documents.perPage')}</span>
            </div>

            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('documents.previous')}
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('documents.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('documents.showing')} {' '}
                  <span className="font-medium">
                    {pagination.totalCount > 0 ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0}
                  </span>{' '}
                  {t('documents.to')} {' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  {t('documents.of')} {' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  {t('documents.results')}
                  {pagination.totalCount > 1000 && (
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      {t('documents.largeDataset')}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('documents.previous')}
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-brand-50 border-brand-500 text-brand-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('documents.next')}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, document: null })}
        document={editModal.document}
      />
    </>
  );
};

export default ReportsTable;
