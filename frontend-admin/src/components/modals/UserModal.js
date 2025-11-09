import React, { useState, useEffect } from 'react';
import { X, User, Key, Shield } from 'lucide-react';
import RecursiveGroupSelector from '../RecursiveGroupSelector';
import { useTranslation } from 'react-i18next';
import { groupsAPI } from '../../services/api';

const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    telegramId: '',
    password: '',
    status: true,
    groupId: '',
    groupIds: [],
    roleId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        telegramId: user.telegram_id || '',
        password: '',
        status: user.status !== undefined ? user.status : true,
        groupId: user.group_id || '',
        groupIds: user.group_ids || [],
        roleId: user.role_id || ''
      });
      // Load group names for display
      if (user.groups) {
        setSelectedGroupNames(user.groups.map(g => g.name));
      }
    } else {
      setFormData({
        name: '',
        telegramId: '',
        password: '',
        status: true,
        groupId: '',
        groupIds: [],
        roleId: ''
      });
      setSelectedGroupNames([]);
    }
  }, [user]);

  useEffect(() => {
    loadAllGroups();
  }, []);

  const loadAllGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      if (response.data.success) {
        setAllGroups(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsGroupActive(name === 'roleId' && (value === '2' || value === '3'));
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'roleId' && { groupId: '', groupIds: [] })
    });
    setSelectedGroupNames([]);
  };

  // For regular users and admins - single group
  const handleSingleGroupChange = (groupId) => {
    setFormData({
      ...formData,
      groupId: groupId
    });
    // Find and set the group name
    const groupName = allGroups.find(g => g.id === groupId)?.name;
    setSelectedGroupNames(groupName ? [groupName] : []);
  };

  // For directors - multiple groups
  const handleMultipleGroupsChange = (groupId) => {
    setFormData(prev => {
      const currentIds = prev.groupIds || [];
      let newIds;

      if (currentIds.includes(groupId)) {
        newIds = currentIds.filter(id => id !== groupId);
      } else {
        newIds = [...currentIds, groupId];
      }

      // Update selected group names
      const names = newIds.map(id => allGroups.find(g => g.id === id)?.name).filter(Boolean);
      setSelectedGroupNames(names);

      return {
        ...prev,
        groupIds: newIds
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate group selection
    const isDirector = formData.roleId === '3';
    if (isDirector && formData.groupIds.length === 0) {
      alert(t('users.selectAtLeastOneGroup') || 'Please select at least one group');
      return;
    }
    if (!isDirector && !formData.groupId && (formData.roleId === '2' || formData.roleId === '3')) {
      alert(t('users.selectGroup') || 'Please select a group');
      return;
    }

    setIsSubmitting(true);

    // Prepare data to send
    const submitData = {
      name: formData.name,
      telegramId: formData.telegramId,
      password: formData.password,
      roleId: formData.roleId,
      status: formData.status,
      ...(isDirector ? { groupIds: formData.groupIds } : { groupId: formData.groupId })
    };

    const result = await onSave(submitData);

    if (result.success) {
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      telegramId: '',
      password: '',
      status: true,
      groupId: '',
      groupIds: [],
      roleId: ''
    });
    setSelectedGroupNames([]);
    onClose();
  };

  if (!isOpen) return null;

  const isDirector = formData.roleId === '3';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-brand-600" />
            {user ? t('users.editUser') : t('users.createUser')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder={t('users.namePlaceholder')}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Telegram ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.telegramId')} *
                </label>
                <input
                  type="text"
                  name="telegramId"
                  required
                  className="input-field"
                  placeholder={t('users.telegramIdPlaceholder')}
                  value={formData.telegramId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.password')} {user ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!user}
                  className="input-field"
                  placeholder={t('users.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.userType')} *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId || ''}
                  onChange={handleChange}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="" disabled>
                    {t('users.selectUserType')}
                  </option>
                  <option value="1">{t('users.admin')}</option>
                  <option value="3">{t('users.director')}</option>
                  <option value="2">{t('users.regularUser')}</option>
                </select>
              </div>

              {/* Group Selection */}
              {(isGroupActive || formData.roleId === '2' || formData.roleId === '3') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isDirector ? t('users.selectGroups') + ' *' : t('users.selectGroup') + ' *'}
                  </label>

                  {/* Group Selector with Checkboxes */}
                  <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-64 overflow-y-auto">
                    <RecursiveGroupSelector
                      value={formData.groupId}
                      onChange={isDirector ? handleMultipleGroupsChange : handleSingleGroupChange}
                      disabled={isSubmitting}
                      isMultiple={isDirector}
                      selectedGroups={formData.groupIds}
                    />
                  </div>

                  {/* Display Selected Groups */}
                  {selectedGroupNames.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-2">
                        {t('users.selectedGroups') || 'Selected Groups'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroupNames.map((name, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('users.activeStatus')}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('users.saving')}
                </div>
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
