import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  Folder,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { documentsAPI, groupsAPI } from '../../services/api';
import { formatDateToDDMMYYYY, generateDownloadFileName, getFileTypeIcon, getFileExtension } from '../../utils/fileUtils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const DocumentsManagement = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    groupId: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    groups: []
  });

  const loadDocuments = async (page = 1, searchFilters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...searchFilters
      };

      const response = await documentsAPI.getFiltered(params);
      
      if (response.data.success) {
        const data = response.data.data;
        setDocuments(data.documents || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: pagination.limit,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error(response.data.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const groupsResponse = await groupsAPI.getAll();

      if (groupsResponse.data.success) {
        const nonRootGroups = groupsResponse.data.data.filter(group => group.parent_id !== null);
        setFilterOptions(prev => ({
          ...prev,
          groups: nonRootGroups || []
        }));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || Object.values(filters).some(f => f !== '')) {
        const searchFilters = {
          title: searchTerm || undefined,
          uploaderName: searchTerm || undefined,
          date: filters.date || undefined,
          groupId: filters.groupId || undefined
        };
        loadDocuments(1, searchFilters);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);


  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      date: '',
      groupId: ''
    });
    loadDocuments();
  };

  const handlePageChange = (page) => {
    const searchFilters = {
      title: searchTerm || undefined,
      uploaderName: searchTerm || undefined,
      year: filters.year || undefined,
      month: filters.month || undefined,
                date: filters.date || undefined,
      groupId: filters.groupId || undefined
    };
    loadDocuments(page, searchFilters);
  };

  // rename parameter to avoid shadowing global `document` and request binary response
  const handleDownloadDocument = async (doc) => {
    try {
      const response = await documentsAPI.download(doc.id, { responseType: 'blob' }); // or 'arraybuffer'
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = generateDownloadFileName(doc.title, doc.file_path);
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('documents.download'));
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteDocument = async (document) => {
    if (window.confirm(t('documents.deleteConfirm'))) {
      try {
        const response = await documentsAPI.delete(document.id);
        if (response.data.success) {
          toast.success(t('documents.documentDeleted'));
          loadDocuments(pagination.currentPage);
        } else {
          toast.error(response.data.message || t('common.error'));
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error(t('common.error'));
      }
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-brand-600" />
            {t('documents.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('documents.searchDocuments')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="space-y-4">
                     {/* Search Input */}
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder={t('documents.searchPlaceholder')}
                   className="input-field pl-10"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
             </div>
             <button 
               type="button" 
               onClick={handleClearFilters}
               className="btn-secondary flex items-center"
             >
               {t('common.clear')}
             </button>
           </div>

                     {/* Filters */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* Date Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 {t('documents.date')}
               </label>
               <input
                 type="date"
                 value={filters.date}
                 onChange={(e) => handleFilterChange('date', e.target.value)}
                 className="input-field"
               />
             </div>

             {/* Group Filter */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 {t('documents.group')}
               </label>
               <select
                 value={filters.groupId}
                 onChange={(e) => handleFilterChange('groupId', e.target.value)}
                 className="input-field"
               >
                 <option value="">{t('documents.allGroups')}</option>
                 {filterOptions.groups.map(group => (
                   <option key={group.id} value={group.id}>
                     {group.name}
                   </option>
                 ))}
               </select>
             </div>
           </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">{t('documents.document')}</th>
                <th className="table-header">{t('documents.uploader')}</th>
                <th className="table-header">{t('documents.group')}</th>
                <th className="table-header">{t('documents.date')}</th>
                <th className="table-header">{t('documents.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>
                      {t('documents.loadingDocuments')}
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-8">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">{t('documents.noDocumentsFound')}</p>
                      <p className="text-sm">{t('common.tryAgain')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                                         <td className="table-cell">
                       <div className="flex items-center">
                         <div className="flex-shrink-0">
                           {getFileTypeIcon(document.file_path)}
                         </div>
                         <div className="ml-3">
                           <div className="text-sm font-medium text-gray-900">
                             {document.title}
                           </div>
                           <div className="text-sm text-gray-500">
                             {getFileExtension(document.file_path).toUpperCase() || 'UNKNOWN'}
                           </div>
                         </div>
                       </div>
                     </td>
                    <td className="table-cell text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {document.uploader_name || t('common.noData')}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-2 text-gray-400" />
                        {document.group_name || t('common.noData')}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateToDDMMYYYY(document.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-gray-500 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50"
                          title={t('documents.download')}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document)}
                          className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title={t('documents.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                    {((pagination.currentPage - 1) * pagination.limit) + 1}
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

export default DocumentsManagement;