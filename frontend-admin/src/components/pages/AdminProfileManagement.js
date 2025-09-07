import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Save, 
  Eye, 
  EyeOff,
  Lock,
  UserCheck,
  AtSign
} from 'lucide-react';
import { adminProfileAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminProfileManagement = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    telegram_id: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileAPI.getProfile();
      if (response.data.success) {
        const adminData = response.data.data;
        setProfile({
          name: adminData.name || '',
          telegram_id: adminData.telegram_id || '',
          password: '',
        });
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  
  const validateForm = () => {
    const newErrors = {};

    if (!profile.name.trim()) {
      newErrors.name = t('adminProfile.nameRequired');
    }

    if (!profile.telegram_id.trim()) {
      newErrors.telegram_id = t('adminProfile.telegramIdRequired');
    }

    if (profile.password && profile.password.length < 6) {
      newErrors.password = t('adminProfile.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: profile.name.trim(),
        telegramId: profile.telegram_id.trim()
      };

      const response = await adminProfileAPI.updateProfile(updateData);
      
      if (response.data.success) {
        toast.success(t('adminProfile.profileUpdated'));
        
        setProfile(prev => ({
          ...prev,
          password: '',
        }));
        
        await loadProfile();
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
          <span className="text-gray-600">{t('adminProfile.loadingProfile')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 mr-3 text-brand-600" />
            {t('adminProfile.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('adminProfile.subtitle')}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              {t('adminProfile.name')}
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder={t('adminProfile.namePlaceholder')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AtSign className="h-4 w-4 inline mr-2" />
              {t('adminProfile.telegramId')}
            </label>
            <input
              type="text"
              name="telegram_id"
              value={profile.telegram_id}
              onChange={handleInputChange}
              className={`input-field ${errors.telegram_id ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder={t('adminProfile.telegramIdPlaceholder')}
            />
            {errors.telegram_id && (
              <p className="mt-1 text-sm text-red-600">{errors.telegram_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="h-4 w-4 inline mr-2" />
              {t('adminProfile.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={profile.password}
                onChange={handleInputChange}
                className={`input-field pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('adminProfile.newPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('adminProfile.newPasswordHelp')}
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('adminProfile.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('adminProfile.saveChanges')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              {t('adminProfile.securityNotice')}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>{t('adminProfile.securityNotice1')}</li>
                <li>{t('adminProfile.securityNotice2')}</li>
                <li>{t('adminProfile.securityNotice3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileManagement;
