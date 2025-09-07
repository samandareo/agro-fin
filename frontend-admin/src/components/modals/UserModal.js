import React, { useState, useEffect } from 'react';
import { X, User, Key, Shield } from 'lucide-react';
import RecursiveGroupSelector from '../RecursiveGroupSelector';
import { useTranslation } from 'react-i18next';

const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    telegramId: '',
    password: '',
    status: true,
    groupId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        telegramId: user.telegram_id || '',
        password: '',
        status: user.status !== undefined ? user.status : true,
        groupId: user.group_id || ''
      });
    } else {
      setFormData({
        name: '',
        telegramId: '',
        password: '',
        status: true,
        groupId: ''
      });
    }
  }, [user]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await onSave(formData);
    
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
      groupId: ''
    });
    onClose();
  };

  if (!isOpen) return null;

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
                {t('users.userName')} *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                placeholder={t('users.userNamePlaceholder')}
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

            {/* Group */}
            <RecursiveGroupSelector
              value={formData.groupId}
              onChange={(groupId) => setFormData({ ...formData, groupId })}
              disabled={isSubmitting}
            />

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
