import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Folder, FolderOpen, Edit, Trash2, ChevronRight } from 'lucide-react';
import { groupsAPI } from '../../services/api';
import GroupModal from '../modals/GroupModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GroupsManagement = () => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentParentId, setCurrentParentId] = useState(0);
  const [groupModal, setGroupModal] = useState({ isOpen: false, group: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const loadGroups = async (parentId = 0) => {
    setLoading(true);
    try {
      const response = await groupsAPI.getSubgroups(parentId);
      if (response.data.success) {
        setGroups(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load groups');
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    loadGroups(currentParentId);
  }, [currentParentId]);

  
  const handleGroupClick = (group) => {
    setCurrentPath([...currentPath, group]);
    setCurrentParentId(group.id);
  };

  
  const handleBackClick = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      const newParentId = newPath.length > 0 ? newPath[newPath.length - 1].id : 0;
      setCurrentPath(newPath);
      setCurrentParentId(newParentId);
    }
  };

  
  const handleAddGroup = () => {
    setGroupModal({ isOpen: true, group: null });
  };

  
  const handleEditGroup = (group, e) => {
    e.stopPropagation();
    setGroupModal({ isOpen: true, group });
  };

  
  const handleDeleteGroup = (group, e) => {
    e.stopPropagation();
    setDeleteConfirm(group);
  };

  
  const handleSaveGroup = async (groupData) => {
    try {
      if (groupModal.group) {
        const response = await groupsAPI.update(groupModal.group.id, groupData);
        if (response.data.success) {
          toast.success('Group updated successfully');
          loadGroups(currentParentId);
          return { success: true };
        } else {
          toast.error(response.data.message || 'Failed to update group');
          return { success: false };
        }
      } else {
        const response = await groupsAPI.create(groupData);
        if (response.data.success) {
          toast.success('Group created successfully');
          loadGroups(currentParentId);
          return { success: true };
        } else {
          toast.error(response.data.message || 'Failed to create group');
          return { success: false };
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(t('common.error'));
      return { success: false };
    }
  };

  
  const handleDeleteConfirm = async (group) => {
    setIsDeleting(true);
    try {
      const response = await groupsAPI.delete(group.id);
      if (response.data.success) {
        toast.success(t('groups.groupDeleted'));
        loadGroups(currentParentId);
        setDeleteConfirm(null);
      } else {
        toast.error(response.data.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  
  const getPageTitle = () => {
    if (currentPath.length === 0) {
      return t('groups.rootGroups');
    }
    return currentPath[currentPath.length - 1].name;
  };

  
  const getBreadcrumbPath = () => {
    if (currentPath.length === 0) {
      return [t('groups.rootGroups')];
    }
    return [t('groups.rootGroups'), ...currentPath.map(group => group.name)];
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          {currentPath.length > 0 && (
            <button
              onClick={handleBackClick}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </button>
          )}
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="mt-2 text-gray-600">
              {currentPath.length === 0 
                ? t('groups.title')
                : `${t('groups.subgroups')} "${currentPath[currentPath.length - 1].name}"`
              }
            </p>
            
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 mt-1">
              {getBreadcrumbPath().map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-sm text-gray-500">{item}</span>
                  {index < getBreadcrumbPath().length - 1 && (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleAddGroup}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('groups.addGroup')}
        </button>
      </div>

      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span className="ml-3 text-gray-600">{t('groups.loadingGroups')}</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">{t('groups.noGroupsFound')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {currentPath.length === 0 
                ? t('groups.addGroup')
                : t('groups.subgroupsCount')
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className="group card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-brand-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center mr-3">
                      <FolderOpen className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-700">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500">{t('groups.title')}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditGroup(group, e)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteGroup(group, e)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('groups.subgroups')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      
      <GroupModal
        isOpen={groupModal.isOpen}
        onClose={() => setGroupModal({ isOpen: false, group: null })}
        group={groupModal.group}
        parentId={currentParentId}
        onSave={handleSaveGroup}
      />

      
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        item={deleteConfirm}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default GroupsManagement;
