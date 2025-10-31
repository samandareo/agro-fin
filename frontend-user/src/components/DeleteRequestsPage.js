import React from 'react';
import { useDeleteRequests } from '../contexts/DeleteRequestContext';
import { Trash2, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../utils/fileUtils';
import { useTranslation } from 'react-i18next';

const DeleteRequestsPage = () => {
  const { deleteRequests, loading, getStatusColor, getStatusIcon, formatDate } = useDeleteRequests();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('deleteRequests.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Trash2 className="h-8 w-8 text-error-600" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-gray-900">{t('deleteRequests.title')}</h1>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('deleteRequests.document')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('deleteRequests.requestDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('deleteRequests.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('deleteRequests.group')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deleteRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium">{t('deleteRequests.noDeleteReqFound')}</p>
                          <p className="text-sm">{t('deleteRequests.noDeleteReqFoundDesc')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    deleteRequests.map((request) => {
                      const requestDate = formatDate(request.created_at);
                      const documentDate = formatDate(request.document_upload_at);
                      
                      return (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-error-100 rounded-lg flex items-center justify-center mr-4">
                                <FileText className="h-5 w-5 text-error-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {request.document_title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {t('deleteRequests.orgUploaded')}: {documentDate.day} {documentDate.month} {documentDate.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" title={requestDate.formatted}>
                            <div className="text-sm text-gray-900">
                              {requestDate.day} {t('months.' + requestDate.month)} {requestDate.year}
                            </div>
                            <div className="text-sm text-gray-500">
                              {requestDate.time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              <span className="mr-1">{getStatusIcon(request.status)}</span>
                              {t('deleteRequests.' + request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.group_name || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-0 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-3">
                  <span className="mr-1">⏳</span>
                  {t('deleteRequests.pending')}
                </span>
                <span className="text-sm text-gray-600">{t('deleteRequests.pendingDesc')}</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                  <span className="mr-1">✅</span>
                  {t('deleteRequests.approved')}
                </span>
                <span className="text-sm text-gray-600">{t('deleteRequests.approvedDesc')}</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
                  <span className="mr-1">❌</span>
                  {t('deleteRequests.rejected')}
                </span>
                <span className="text-sm text-gray-600">{t('deleteRequests.rejectedDesc')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRequestsPage;
