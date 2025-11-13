import React, { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TasksContext';
import { X, FileText, Download, Clock, User, CheckCircle2, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateToDDMMYYYY, formatDateTimeTo24Hour } from '../utils/fileUtils';
import toast from 'react-hot-toast';

const TaskDetail = ({ task, onClose }) => {
  const { taskDetails, updateTaskStatus, downloadFile, uploadFile, getTaskDetail, loading: contextLoading } = useTasks();
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState(task.user_status);
  const [updating, setUpdating] = useState(false);
  const [details, setDetails] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (taskDetails) {
      setDetails(taskDetails);
      setSelectedStatus(taskDetails.user_status);
    }
  }, [taskDetails]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === selectedStatus) return;

    setUpdating(true);
    try {
      const result = await updateTaskStatus(task.id, newStatus);
      if (result.success) {
        setSelectedStatus(newStatus);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadFile = (file) => {
    downloadFile(file.id, file.file_name);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error(t('tasks.selectFileFirst'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const result = await uploadFile(task.id, formData);
      if (result.success) {
        toast.success(t('tasks.fileUploadedSuccessfully'));
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
        // Refresh task details
        await getTaskDetail(task.id);
      } else {
        toast.error(result.message || t('tasks.fileUploadFailed'));
      }
    } catch (error) {
      toast.error(t('tasks.fileUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-upload-input');
    if (fileInput) fileInput.value = '';
  };

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

  const displayData = details || task;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{displayData.title}</h2>
            <p className="text-brand-100 mt-1 text-sm">{t('tasks.taskDetails')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Description Section */}
          {displayData.description && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('tasks.taskDescription')}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{displayData.description}</p>
            </div>
          )}

          {/* Status and Deadline Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('tasks.statusInfo')}</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Current Status */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">{t('tasks.currentStatus')}</label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border w-fit ${getStatusColor(selectedStatus)}`}>
                  {getStatusIcon(selectedStatus)}
                  <span className="font-medium">{getStatusLabel(selectedStatus)}</span>
                </div>
              </div>

              {/* Deadline */}
              {displayData.deadline && (
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">{t('tasks.deadline')}</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 w-fit">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      {formatDateTimeTo24Hour(displayData.deadline)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Update Time */}
            {displayData.status_updated_at && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{t('tasks.lastUpdated')}</span>
                {': '}
                {new Date(displayData.status_updated_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Task Metadata */}
          {(displayData.created_by_name || displayData.task_status) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('tasks.details')}</h3>
              <div className="space-y-2">
                {displayData.created_by_name && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{t('tasks.createdBy')}</span>: {displayData.created_by_name}
                    </span>
                  </div>
                )}
                {displayData.created_at && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{t('tasks.createdAt')}</span>: {new Date(displayData.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change Status Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('tasks.updateStatus')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {['in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating || selectedStatus === status}
                  className={`
                    py-2 px-3 rounded-lg border transition-colors text-sm font-medium
                    ${selectedStatus === status
                      ? 'bg-brand-100 border-brand-300 text-brand-700 cursor-default'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                    }
                    ${updating && selectedStatus !== status ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {updating && selectedStatus !== status ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-3 w-3 rounded-full border-2 border-gray-300 border-t-brand-600 animate-spin"></div>
                      {getStatusLabel(status)}
                    </span>
                  ) : (
                    getStatusLabel(status)
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('tasks.uploadFile')}
            </h3>
            
            <div className="space-y-3">
              {/* File Input */}
              <div>
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-brand-50 file:text-brand-700
                    hover:file:bg-brand-100
                    file:cursor-pointer cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('tasks.supportedFormats')}: PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX, PPT, PPTX
                </p>
              </div>

              {/* Selected File Preview */}
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-xs text-blue-700">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveSelectedFile}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-colors
                  ${!selectedFile || uploading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                  }
                `}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    {t('tasks.uploading')}
                  </span>
                ) : (
                  t('tasks.uploadFile')
                )}
              </button>
            </div>
          </div>

          {/* Files Section */}
          {displayData.files && displayData.files.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('tasks.attachedFiles')} ({displayData.files.length})
              </h3>
              <div className="space-y-2">
                {displayData.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-brand-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('tasks.uploadedAt')}: {new Date(file.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="ml-2 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0"
                      title={t('tasks.download')}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!displayData.files || displayData.files.length === 0) && (
            <div className="px-6 py-4 text-center text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">{t('tasks.noFiles')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full btn-secondary"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
