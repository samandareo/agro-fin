import React, { useState, useEffect } from 'react';
import { X, Folder, FolderOpen } from 'lucide-react';
import { groupsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GroupModal = ({ isOpen, onClose, group, parentId, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    parentId: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentGroups, setParentGroups] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        parentId: group.parent_id || null
      });
    } else {
      setFormData({
        name: '',
        parentId: parentId || null
      });
    }
  }, [group, parentId]);

  useEffect(() => {
    if (isOpen) {
      loadParentGroups();
    }
  }, [isOpen]);

  const loadParentGroups = async () => {
    setLoadingParents(true);
    try {
      const response = await groupsAPI.getAll();
      if (response.data.success) {
        setParentGroups(response.data.data || []);
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      console.error('Error loading parent groups:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingParents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'parentId' ? (value === 'null' ? null : parseInt(value)) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSave(formData);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      parentId: null
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-brand-600" />
            {group ? t('common.edit') : t('groups.addGroup')}
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
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.groupName')} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder={t('groups.groupNamePlaceholder')}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Parent Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.parentGroup')}
                </label>
                {loadingParents ? (
                  <div className="input-field bg-gray-100">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600 mr-2"></div>
                      {t('groups.loadingGroups')}
                    </div>
                  </div>
                ) : (
                  <select
                    name="parentId"
                    value={formData.parentId || 'null'}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isSubmitting}
                  >
                    <option value="null">{t('groups.noParent')}</option>
                    {parentGroups.map((parentGroup) => (
                      <option key={parentGroup.id} value={parentGroup.id}>
                        {parentGroup.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {t('groups.selectParentGroup')}
                </p>
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FolderOpen className="h-5 w-5 text-brand-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.name || t('groups.groupName')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.parentId === null 
                        ? t('groups.rootGroups') 
                        : `${t('groups.subgroups')} "${parentGroups.find(p => p.id === formData.parentId)?.name || t('groups.parentGroup')}"`
                      }
                    </p>
                  </div>
                </div>
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
                  {t('groups.saving')}
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

export default GroupModal;
