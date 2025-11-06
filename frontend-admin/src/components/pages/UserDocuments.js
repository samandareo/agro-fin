import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, User, Folder } from 'lucide-react';
import { documentsAPI } from '../../services/api';
import { formatDateToDDMMYYYY } from '../../utils/fileUtils';
import { handleContextError } from '../../utils/apiErrorHelper';
import toast from 'react-hot-toast';

const UserDocuments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });


  const loadUserDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const response = await documentsAPI.getByUploaderId(userId, { 
        page, 
        limit: pagination.limit 
      });
      
      if (response.data.success) {
        const documentsData = response.data.data;
        if (Array.isArray(documentsData)) {
          setDocuments(documentsData);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: documentsData.length,
            limit: 20,
            hasNext: false,
            hasPrev: false
          });
        } else {
          setDocuments(documentsData.documents || []);
          setPagination(documentsData.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 20,
            hasNext: false,
            hasPrev: false
          });
        }
      } else {
        toast.error(response.data.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      handleContextError(error, 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const response = await documentsAPI.getById(userId);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentsAPI.download(document.id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.title}.${document.file_path.split('.').pop()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      handleContextError(error, 'Failed to download document');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      formatted: formatDateToDDMMYYYY(dateString)
    };
  };

  const getFileTypeIcon = (filePath) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📈';
      case 'txt': return '📜';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📁';
    }
  };

  const handlePageChange = (page) => {
    loadUserDocuments(page);
  };

  useEffect(() => {
    if (userId) {
      loadUserDocuments();
      loadUserInfo();
    }
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Documents</h1>
            <p className="mt-2 text-gray-600">
              Documents uploaded by this user
            </p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="card p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">Username: {user.telegram_id}</p>
              <p className="text-sm text-gray-500">Status: {user.status ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">This user hasn't uploaded any documents yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Document</th>
                  <th className="table-header">Group</th>
                  <th className="table-header">Day</th>
                  <th className="table-header">Month</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => {
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
                            <div className="text-sm text-gray-500">
                              {document.file_path.split('.').pop()?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm text-gray-900">
                          <Folder className="h-4 w-4 mr-2 text-gray-400" />
                          {document.group_name || 'No Group'}
                        </div>
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {dateInfo.day}
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {dateInfo.month}
                      </td>
                      <td className="table-cell text-sm text-gray-900" title={dateInfo.formatted}>
                        {dateInfo.year}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDownload(document)}
                          className="text-gray-500 hover:text-brand-600 transition-colors p-2 rounded-lg hover:bg-brand-50"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
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
                    {pagination.totalCount > 0 ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0}
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
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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

export default UserDocuments;
