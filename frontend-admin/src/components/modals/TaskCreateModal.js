import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersAPI, tasksAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TaskCreateModal = ({ onClose, onTaskCreated }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: {
      date: '',
      time: '00:00',
      full: null
    },
    assignedUserIds: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userCache, setUserCache] = useState({}); // Cache user info for assigned users
  const [attachedFiles, setAttachedFiles] = useState([]); // Files to be uploaded
  const [uploadingFile, setUploadingFile] = useState(false);

  // Use useRef to store the timeout ID to prevent memory leaks
  const debounceTimerRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Search users via API (for large datasets) with proper debouncing
  const handleSearchUsers = (value) => {
    setSearchTerm(value);

    // Clear previous timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim() === '') {
      setFilteredUsers([]);
      return;
    }

    // Only search if at least 2 characters
    if (value.length < 2) {
      setFilteredUsers([]);
      return;
    }

    // Set loading state before debounce
    setLoadingUsers(true);

    // Debounce search to avoid too many API calls (800ms wait)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('Searching for users:', value);

        // Search users via the search endpoint with limit 50
        // Search by both name and telegramId
        const response = await usersAPI.search({
          name: value,
          telegramId: value,
          limit: 50
        });

        if (response.data.success) {
          const allUsers = response.data.data?.users || [];
          console.log('Search results:', allUsers.length, 'users found');
          console.log('Assigned user IDs:', formData.assignedUserIds);

          // Filter out already assigned users (convert to string for comparison)
          const assignedUserIds = formData.assignedUserIds.map(id => String(id));
          const unassignedUsers = allUsers.filter(user =>
            !assignedUserIds.includes(String(user.id))
          );
          console.log('Unassigned users:', unassignedUsers.length);
          setFilteredUsers(unassignedUsers);
        } else {
          console.log('Search failed:', response.data.message);
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error('Error searching users:', error.response?.data || error.message);
        setFilteredUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 800); // 800ms debounce delay
  };

  const handleAddUser = (userId) => {
    if (!formData.assignedUserIds.includes(userId)) {
      // Find and cache the user info
      const selectedUser = filteredUsers.find(u => u.id === userId);
      if (selectedUser) {
        setUserCache({
          ...userCache,
          [userId]: selectedUser
        });
      }

      setFormData({
        ...formData,
        assignedUserIds: [...formData.assignedUserIds, userId]
      });
    }
    setSearchTerm('');
    setFilteredUsers([]);
  };

  const handleRemoveUser = (userId) => {
    setFormData({
      ...formData,
      assignedUserIds: formData.assignedUserIds.filter(id => id !== userId)
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles([...attachedFiles, ...files]);
    }
    // Reset the input so you can select the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t('tasks.titleRequired'));
      return;
    }

    if (formData.assignedUserIds.length === 0) {
      toast.error(t('tasks.selectAtLeastOneUser'));
      return;
    }

    setSubmitting(true);
    try {
      // Format deadline properly for submission
      let deadline = null;
      if (formData.deadline?.date) {
        // Use the full ISO format with T and :00 seconds
        deadline = formData.deadline.full;
        console.log('Submitting deadline:', deadline);
      }

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: deadline,
        assignedUserIds: formData.assignedUserIds,
        attachedFiles: attachedFiles
      };

      console.log('Task data being submitted:', taskData);

      // Pass task data and files to parent component to handle creation
      // Parent will create the task and upload files
      await onTaskCreated(taskData);

      // Close modal (parent will handle success messages)
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('tasks.createNewTask')}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.title')} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('tasks.enterTaskTitle')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('tasks.enterTaskDescription')}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.deadline')}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.deadline ? formData.deadline.date : ''}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const time = formData.deadline?.time || '00:00';
                  console.log('Date changed to:', newDate);
                  setFormData({
                    ...formData,
                    deadline: {
                      date: newDate,
                      time: time,
                      full: `${newDate}T${time}:00`
                    }
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="text"
                placeholder="HH:MM"
                value={formData.deadline ? formData.deadline.time : '00:00'}
                onChange={(e) => {
                  let timeValue = e.target.value;
                  console.log('Time input change:', timeValue);

                  // Only allow valid time format
                  if (/^\d{0,2}:?\d{0,2}$/.test(timeValue) || timeValue === '') {
                    // Auto-format: add colon after 2 digits
                    if (timeValue.length === 2 && !timeValue.includes(':')) {
                      timeValue = timeValue + ':';
                    }

                    const currentDate = formData.deadline?.date || new Date().toISOString().split('T')[0];
                    console.log('Setting time:', timeValue, 'Date:', currentDate);

                    setFormData({
                      ...formData,
                      deadline: {
                        date: currentDate,
                        time: timeValue,
                        full: `${currentDate}T${timeValue}:00`
                      }
                    });
                  }
                }}
                onBlur={(e) => {
                  let timeValue = e.target.value.trim();
                  console.log('Time blur:', timeValue);

                  // Validate and fix time format on blur
                  if (timeValue === '') {
                    timeValue = '00:00';
                  } else if (!timeValue.includes(':')) {
                    // User entered like "2030", convert to "20:30"
                    const hours = timeValue.slice(0, 2);
                    const minutes = timeValue.slice(2, 4) || '00';
                    timeValue = `${hours}:${minutes}`;
                  }

                  // Validate time is within valid range (00:00 - 23:59)
                  const [hours, minutes] = timeValue.split(':');
                  const h = parseInt(hours) || 0;
                  const m = parseInt(minutes) || 0;

                  if (h > 23) {
                    timeValue = '23:59';
                    toast.error('Hour must be between 00-23');
                  } else if (m > 59) {
                    timeValue = `${hours}:59`;
                    toast.error('Minutes must be between 00-59');
                  }

                  const currentDate = formData.deadline?.date || new Date().toISOString().split('T')[0];
                  console.log('Final time:', timeValue, 'Date:', currentDate);

                  setFormData({
                    ...formData,
                    deadline: {
                      date: currentDate,
                      time: timeValue,
                      full: `${currentDate}T${timeValue}:00`
                    }
                  });
                }}
                maxLength="5"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-center font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Time in 24-hour format (example: 20:30 for 8:30 PM)</p>
            {formData.deadline?.full && (
              <p className="text-xs text-gray-600 mt-2">
                📅 Deadline: {formData.deadline.date} at {formData.deadline.time}
              </p>
            )}
          </div>

          {/* Attach Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.attachFiles') || 'Attach Files'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-brand-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {t('tasks.dragDropFiles') || 'Click to upload files'}
                </p>
              </label>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.assignUsers')} <span className="text-red-600">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Type at least 2 characters to search for users. You can assign multiple users to one task.</p>

            {/* Search Box */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder={t('tasks.searchUsers')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              {/* Dropdown */}
              {searchTerm && filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {filteredUsers
                    .filter(user => !formData.assignedUserIds.map(id => String(id)).includes(String(user.id)))
                    .map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddUser(user.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.telegram_id}</p>
                      </button>
                    ))}
                </div>
              )}

              {loadingUsers && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto"></div>
                </div>
              )}
            </div>

            {/* Selected Users */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              {formData.assignedUserIds.length === 0 ? (
                <p className="text-gray-600 text-sm">{t('tasks.noUsersSelected')}</p>
              ) : (
                formData.assignedUserIds.map(userId => {
                  const user = userCache[userId];
                  return (
                    <div key={userId} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">{user?.name || 'User #' + userId}</p>
                        <p className="text-sm text-gray-600">{user?.telegram_id || '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(userId)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || loadingUsers || uploadingFile}
              className="flex-1 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting || uploadingFile ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  {uploadingFile ? t('tasks.uploadingFiles') : t('common.creating')}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  {t('tasks.createTask')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;
