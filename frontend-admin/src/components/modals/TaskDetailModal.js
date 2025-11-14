import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Plus, Trash2, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tasksAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDateToDDMMYYYY, formatDateTimeTo24Hour } from '../../utils/fileUtils';

const TaskDetailModal = ({ task, onClose, onTaskUpdated, isCompact = false }) => {
  const { t } = useTranslation();

  // Helper function to parse deadline from ISO format to structured object
  const parseDeadline = (isoString) => {
    if (!isoString) {
      return { date: '', time: '00:00', full: '' };
    }
    try {
      // Parse ISO string like "2025-11-02T20:30:00"
      const parts = isoString.split('T');
      const date = parts[0];
      const time = parts[1] ? parts[1].slice(0, 5) : '00:00';
      return { date, time, full: isoString };
    } catch (e) {
      return { date: '', time: '00:00', full: '' };
    }
  };

  // Helper function to translate user assignment status
  const getAssignmentStatusLabel = (status) => {
    const labels = {
      'assigned': t('tasks.status.assigned'),
      'in_progress': t('tasks.status.inProgress'),
      'completed': t('tasks.status.completed'),
      'pending': t('tasks.status.pending')
    };
    return labels[status] || status;
  };

  // Helper function to get color for user assignment status
  const getAssignmentStatusColor = (status) => {
    const colors = {
      'assigned': 'bg-blue-100 text-blue-800 border border-blue-300',
      'in_progress': 'bg-amber-100 text-amber-800 border border-amber-300',
      'completed': 'bg-green-100 text-green-800 border border-green-300',
      'pending': 'bg-gray-100 text-gray-800 border border-gray-300'
    };
    return colors[status] || colors['assigned'];
  };

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    deadline: parseDeadline(task.deadline),
    status: task.status
  });
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [files, setFiles] = useState(task.files || []);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadTaskDetails = async () => {
    try {
      console.log('Loading task details for task:', task.id);

      // Fetch complete task details including files
      const taskDetailsResponse = await tasksAPI.getDetail(task.id);
      console.log('Task details response:', taskDetailsResponse);

      if (taskDetailsResponse.data.success) {
        const taskData = taskDetailsResponse.data.data;
        console.log('Task details loaded:', taskData);

        // Update files from the detailed task response
        if (taskData.files) {
          console.log('Files loaded:', taskData.files);
          setFiles(taskData.files);
        } else {
          console.log('No files in response');
          setFiles([]);
        }

        // Update assigned users from the detailed task response
        if (taskData.assignedUsers) {
          console.log('Assigned users loaded:', taskData.assignedUsers);
          setAssignedUsers(taskData.assignedUsers);
        } else {
          console.log('No assigned users in response');
        }
      } else {
        console.error('Task details response not successful:', taskDetailsResponse.data.message);
        toast.error(taskDetailsResponse.data.message || 'Failed to load task details');
        return;
      }

      // Load all available users with a reasonable limit
      try {
        console.log('Loading available users...');
        const allUsersResponse = await usersAPI.getAll({ limit: 100, page: 1 });
        console.log('Available users response:', allUsersResponse);

        if (allUsersResponse.data.success) {
          // Handle both array and object response structures
          let users = allUsersResponse.data.data || [];
          if (Array.isArray(users)) {
            console.log('Available users loaded (array):', users.length);
            setAvailableUsers(users);
          } else if (users.users && Array.isArray(users.users)) {
            console.log('Available users loaded (object.users):', users.users.length);
            setAvailableUsers(users.users);
          } else {
            console.log('Unexpected user response structure:', users);
            setAvailableUsers([]);
          }
        } else {
          console.error('Failed to load available users:', allUsersResponse.data.message);
          setAvailableUsers([]);
        }
      } catch (usersError) {
        console.error('Error loading available users:', usersError);
        console.error('User error response:', usersError.response?.data);
        // Don't fail the whole task detail load if users fail
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load task details');
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      const response = await tasksAPI.assignUser(task.id, userId);
      if (response.data.success) {
        toast.success(t('tasks.userAssigned'));
        setAssignedUsers(response.data.data.assignedUsers || []);
        if (onTaskUpdated) onTaskUpdated();
      } else {
        toast.error(response.data.message || 'Failed to assign user');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign user');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm(t('tasks.confirmRemoveUser'))) {
      try {
        const response = await tasksAPI.removeUser(task.id, userId);
        if (response.data.success) {
          toast.success(t('tasks.userRemoved'));
          setAssignedUsers(response.data.data.assignedUsers || []);
          if (onTaskUpdated) onTaskUpdated();
        } else {
          toast.error(response.data.message || 'Failed to remove user');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove user');
      }
    }
  };

  const handleUploadFileForUser = async (e, userId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(userId || 'admin');
    try {
      console.log(`Uploading file: ${file.name} for user: ${userId || 'admin'}`);
      const formData = new FormData();
      formData.append('file', file);

      const response = await tasksAPI.uploadFile(task.id, formData);
      console.log('Upload response:', response.data);

      if (response.data.success) {
        toast.success(t('tasks.fileUploaded'));
        // The response.data.data contains the complete task details with files
        const taskData = response.data.data;
        console.log('Task data after upload:', taskData);

        if (taskData.files) {
          console.log('Updating files state:', taskData.files);
          setFiles(taskData.files);
        }

        // Clear the file input
        e.target.value = '';
        if (onTaskUpdated) onTaskUpdated();
      } else {
        toast.error(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Legacy function - keeping for backward compatibility
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log(`Uploading file: ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);

      const response = await tasksAPI.uploadFile(task.id, formData);
      console.log('Upload response:', response.data);

      if (response.data.success) {
        toast.success(t('tasks.fileUploaded'));
        // The response.data.data contains the complete task details with files
        const taskData = response.data.data;
        console.log('Task data after upload:', taskData);

        if (taskData.files) {
          console.log('Updating files state:', taskData.files);
          setFiles(taskData.files);
        }

        setSelectedFile(null);
        if (onTaskUpdated) onTaskUpdated();
      } else {
        toast.error(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      console.log(`Downloading file: ${fileName}, fileId: ${fileId}`);
      const response = await tasksAPI.downloadFile(fileId);

      console.log('Download response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data size:', response.data?.size || 'unknown');

      // Check if response is actually a blob or file content
      if (!response.data || (typeof response.data === 'string' && response.data.startsWith('{'))) {
        console.error('Response is not a file blob, it might be an error:', response.data);
        const errorMsg = response.data?.message || 'Response is not a valid file';
        toast.error(errorMsg);
        return;
      }

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      console.log('Created blob:', blob);

      const url = window.URL.createObjectURL(blob);
      console.log('Created blob URL:', url);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);

      console.log('Triggering download click...');
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`File ${fileName} downloaded successfully`);
      toast.success(`${fileName} downloaded`);
    } catch (error) {
      console.error(`Failed to download ${fileName}:`, error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || error.message || `Failed to download ${fileName}`);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm(t('tasks.confirmDeleteFile'))) {
      try {
        const response = await tasksAPI.deleteFile(fileId);
        if (response.data.success) {
          toast.success(t('tasks.fileDeleted'));
          setFiles(files.filter(f => f.id !== fileId));
          if (onTaskUpdated) onTaskUpdated();
        } else {
          toast.error(response.data.message || 'Failed to delete file');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Convert deadline object to ISO string for the API
      const submitData = {
        ...formData,
        deadline: formData.deadline?.full || formData.deadline?.date + 'T' + (formData.deadline?.time || '00:00') + ':00'
      };

      const response = await tasksAPI.update(task.id, submitData);
      if (response.data.success) {
        toast.success(t('tasks.taskUpdated'));
        if (onTaskUpdated) onTaskUpdated();
        if (onClose) onClose();
      } else {
        toast.error(response.data.message || 'Failed to update task');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const unassignedUsers = availableUsers.filter(
    user => !assignedUsers.some(au => au.user_id === user.id)
  );

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  if (isCompact) {
    return (
      <div className="space-y-6">
        {/* Enhanced Assigned Users with File Management */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('tasks.assignedUsers')} ({assignedUsers.length})
          </h4>
          
          {assignedUsers.length === 0 ? (
            <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg">{t('tasks.noAssignedUsers')}</p>
          ) : (
            <div className="space-y-4">
              {assignedUsers.map(userAssignment => {
                // Filter files uploaded by this user only
                const userFiles = files.filter(file =>
                  file.uploaded_by === userAssignment.user_id
                );

                // Admin files: uploaded by someone with admin or director role (shown for all users)
                const adminFiles = files.filter(file =>
                  file.uploader_role === 'admin' || file.uploader_role === 'director'
                );

                return (
                  <div key={userAssignment.user_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* User Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-brand-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{userAssignment.name}</p>
                              <p className="text-sm text-gray-600">{userAssignment.telegram_id}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAssignmentStatusColor(userAssignment.status)}`}>
                            {getAssignmentStatusLabel(userAssignment.status)}
                          </span>
                          {userAssignment.updated_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(userAssignment.updated_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* User Files Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('tasks.userFiles')} ({userFiles.length + adminFiles.length})
                        </h5>
                        
                        {/* File Upload for this user */}
                        <div>
                          <input
                            type="file"
                            onChange={(e) => handleUploadFileForUser(e, userAssignment.user_id)}
                            disabled={uploading}
                            className="hidden"
                            id={`file-input-user-${userAssignment.user_id}`}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
                          />
                          <label
                            htmlFor={`file-input-user-${userAssignment.user_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            {uploading === userAssignment.user_id ? t('tasks.uploading') : t('tasks.uploadFile')}
                          </label>
                        </div>
                      </div>

                      {/* Files List */}
                      <div className="space-y-2">
                        {userFiles.length === 0 && adminFiles.length === 0 ? (
                          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">{t('tasks.noUserFiles')}</p>
                          </div>
                        ) : (
                          <>
                            {/* User's own files */}
                            {userFiles.map(file => (
                              <div key={file.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-blue-900 truncate">{file.file_name}</p>
                                      <div className="flex items-center gap-3 text-xs text-blue-700 mt-1">
                                        <span>{t('tasks.uploadedBy')}: {file.uploader_name || t('tasks.unknown')}</span>
                                        <span>{new Date(file.uploaded_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title={t('tasks.download')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title={t('tasks.deleteFile')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Admin files (shown for all users) */}
                            {adminFiles.map(file => (
                              <div key={file.id} className="flex items-center justify-between bg-purple-50 border border-purple-200 p-3 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-purple-900 truncate">{file.file_name}</p>
                                      <div className="flex items-center gap-3 text-xs text-purple-700 mt-1">
                                        <span className="bg-purple-200 px-2 py-1 rounded text-xs font-medium">
                                          {t('tasks.adminFile')} - {file.uploader_name || t('tasks.unknown')}
                                        </span>
                                        <span>{new Date(file.uploaded_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                                    className="p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                                    title={t('tasks.download')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title={t('tasks.deleteFile')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* General Admin Files Upload */}
        <div className="border-t pt-6">
          <div className="bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-lg p-4">
            <h5 className="font-medium text-brand-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('tasks.adminFileUpload')}
            </h5>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleUploadFileForUser(e, null)} // null means admin upload
                disabled={uploading}
                className="hidden"
                id={`admin-file-input-${task.id}`}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
              />
              <label
                htmlFor={`admin-file-input-${task.id}`}
                className="block w-full px-4 py-3 border-2 border-dashed border-brand-300 rounded-lg text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors"
              >
                {uploading === 'admin' ? (
                  <span className="text-brand-700 flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin"></div>
                    {t('tasks.uploading')}
                  </span>
                ) : (
                  <span className="text-brand-700 flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />
                    {t('tasks.uploadAdminFile')}
                  </span>
                )}
              </label>
              <p className="text-xs text-brand-600 mt-2 text-center">
                {t('tasks.adminFileDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold">{task.title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-brand-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleUpdateTask} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tasks.title')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tasks.description')}
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tasks.deadline')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.deadline?.date || ''}
                    onChange={(e) => {
                      const currentTime = formData.deadline?.time || '00:00';
                      setFormData({
                        ...formData,
                        deadline: {
                          date: e.target.value,
                          time: currentTime,
                          full: `${e.target.value}T${currentTime}:00`
                        }
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={formData.deadline?.time || '00:00'}
                    onChange={(e) => {
                      const timeValue = e.target.value;
                      // Only allow valid time format HH:MM
                      if (/^\d{0,2}:?\d{0,2}$/.test(timeValue) || timeValue === '') {
                        const currentDate = formData.deadline?.date || new Date().toISOString().split('T')[0];
                        // Auto-format as user types (add colon after 2 digits)
                        let formatted = timeValue;
                        if (timeValue.length === 2 && !timeValue.includes(':')) {
                          formatted = timeValue + ':';
                        }
                        setFormData({
                          ...formData,
                          deadline: {
                            date: currentDate,
                            time: formatted,
                            full: `${currentDate}T${formatted}:00`
                          }
                        });
                      }
                    }}
                    onBlur={(e) => {
                      const timeValue = e.target.value.trim();
                      if (timeValue && !timeValue.includes(':')) {
                        // If user enters time without colon, add it
                        const hours = timeValue.slice(0, 2);
                        const minutes = timeValue.slice(2, 4) || '00';
                        const currentDate = formData.deadline?.date || new Date().toISOString().split('T')[0];
                        setFormData({
                          ...formData,
                          deadline: {
                            date: currentDate,
                            time: `${hours}:${minutes}`,
                            full: `${currentDate}T${hours}:${minutes}:00`
                          }
                        });
                      }
                    }}
                    maxLength="5"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-center font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Time in 24-hour format (example: 20:30 for 8:30 PM)</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tasks.statusLabel')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="open">{t('tasks.status.open')}</option>
                  <option value="in_progress">{t('tasks.status.inProgress')}</option>
                  <option value="completed">{t('tasks.status.completed')}</option>
                  <option value="closed">{t('tasks.status.closed')}</option>
                </select>
              </div>
            </div>

            {/* Assigned Users */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('tasks.assignedUsers')} ({assignedUsers.length})
              </h3>

              <div className="space-y-3 mb-4">
                {assignedUsers.length === 0 ? (
                  <p className="text-gray-600 text-sm">{t('tasks.noAssignedUsers')}</p>
                ) : (
                  assignedUsers.map(userAssignment => (
                    <div key={userAssignment.user_id} className="flex items-center justify-between bg-gray-50 p-4 rounded border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{userAssignment.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{userAssignment.telegram_id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAssignmentStatusColor(userAssignment.status)}`}>
                            {getAssignmentStatusLabel(userAssignment.status)}
                          </span>
                          {userAssignment.updated_at && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(userAssignment.updated_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(userAssignment.user_id)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {unassignedUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tasks.addMoreUsers')}
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignUser(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">{t('tasks.selectUser')}</option>
                    {unassignedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.telegram_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t pt-6 flex gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('common.close')}
                </button>
              )}
              <button
                type="submit"
                disabled={updating}
                className="flex-1 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {updating ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
