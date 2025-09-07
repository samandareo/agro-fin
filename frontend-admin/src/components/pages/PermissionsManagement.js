import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Minus,
  FileText,
  Trash2,
  Download,
  Edit,
  Eye,
  Upload,
  AlertCircle
} from 'lucide-react';
import { permissionsAPI, rolePermissionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PermissionsManagement = () => {
  const { t } = useTranslation();
  const [allPermissions, setAllPermissions] = useState([]);
  const [userRolePermissions, setUserRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [revoking, setRevoking] = useState(false);

  
  const filteredPermissions = allPermissions.filter(permission => 
    permission.name.startsWith('document:') || permission.name.startsWith('delete-request:create')
  );

  
  const documentPermissions = filteredPermissions.filter(p => p.name.startsWith('document:'));
  const deleteRequestPermissions = filteredPermissions.filter(p => p.name.startsWith('delete-request:'));

  
  const loadAllPermissions = async () => {
    try {
      const response = await permissionsAPI.getAll();
      if (response.data.success) {
        setAllPermissions(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load permissions');
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    }
  };

  
  const loadUserRolePermissions = async () => {
    try {
      const response = await rolePermissionsAPI.getByRole(2);
      if (response.data.success) {
        setUserRolePermissions(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load user role permissions');
      }
    } catch (error) {
      console.error('Error loading user role permissions:', error);
      toast.error('Failed to load user role permissions');
    }
  };

  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadAllPermissions(),
        loadUserRolePermissions()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  
  const handleAssignPermission = async (permissionId) => {
    setAssigning(true);
    try {
      const response = await rolePermissionsAPI.assign({
        roleId: 2,
        permissionId: parseInt(permissionId)
      });
      
      if (response.data.success) {
        toast.success(t('permissions.permissionAssigned'));
        await loadUserRolePermissions();
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error assigning permission:', error);
      toast.error(t('common.error'));
    } finally {
      setAssigning(false);
    }
  };

  
  const handleRevokePermission = async (permissionId) => {
    setRevoking(true);
    try {
      const response = await rolePermissionsAPI.revoke({
        roleId: 2,
        permissionId: parseInt(permissionId)
      });
      
      if (response.data.success) {
        toast.success(t('permissions.permissionRevoked'));
        await loadUserRolePermissions();
      } else {
        toast.error(response.data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast.error(t('common.error'));
    } finally {
      setRevoking(false);
    }
  };

  
  const getPermissionIcon = (permissionName) => {
    if (permissionName.includes('create') || permissionName.includes('upload')) {
      return <Upload className="h-4 w-4" />;
    } else if (permissionName.includes('read') || permissionName.includes('view')) {
      return <Eye className="h-4 w-4" />;
    } else if (permissionName.includes('update') || permissionName.includes('edit')) {
      return <Edit className="h-4 w-4" />;
    } else if (permissionName.includes('delete')) {
      return <Trash2 className="h-4 w-4" />;
    } else if (permissionName.includes('download')) {
      return <Download className="h-4 w-4" />;
    } else {
      return <Key className="h-4 w-4" />;
    }
  };

  
  const getPermissionColor = (permissionName) => {
    if (permissionName.includes('create') || permissionName.includes('upload')) {
      return 'text-brand-600 bg-brand-100';
    } else if (permissionName.includes('read') || permissionName.includes('view')) {
      return 'text-info-600 bg-info-100';
    } else if (permissionName.includes('update') || permissionName.includes('edit')) {
      return 'text-warning-600 bg-warning-100';
    } else if (permissionName.includes('delete')) {
      return 'text-error-600 bg-error-100';
    } else if (permissionName.includes('download')) {
      return 'text-primary-600 bg-primary-100';
    } else {
      return 'text-gray-600 bg-gray-100';
    }
  };

  
  const isPermissionAssigned = (permissionId) => {
    return userRolePermissions.some(permission => permission.id === permissionId);
  };

  
  const PermissionCard = ({ permission, isAssigned, onToggle }) => (
    <div className={`card p-4 transition-all duration-200 ${
      isAssigned 
        ? 'border-brand-200 bg-brand-50' 
        : 'border-gray-200 hover:border-brand-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getPermissionColor(permission.name)}`}>
            {getPermissionIcon(permission.name)}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {permission.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {permission.description}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onToggle(permission.id)}
          disabled={assigning || revoking}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAssigned
              ? 'text-error-600 bg-error-100 hover:bg-error-200'
              : 'text-brand-600 bg-brand-100 hover:bg-brand-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAssigned ? (
            <>
              <Minus className="h-4 w-4" />
              <span>{t('permissions.revokePermission')}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{t('permissions.assignPermission')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
          <span className="text-gray-600">{t('permissions.loadingPermissions')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Key className="h-8 w-8 mr-3 text-brand-600" />
            {t('permissions.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('permissions.userRole')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Role: User</span>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-info-100 rounded-lg">
              <FileText className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('permissions.documentPermissions')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentPermissions.filter(p => isPermissionAssigned(p.id)).length} / {documentPermissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-error-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('permissions.deleteRequestPermissions')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {deleteRequestPermissions.filter(p => isPermissionAssigned(p.id)).length} / {deleteRequestPermissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-info-600" />
            {t('permissions.documentPermissions')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('permissions.documentPermissions')}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentPermissions.map((permission) => (
              <PermissionCard
                key={permission.id}
                permission={permission}
                isAssigned={isPermissionAssigned(permission.id)}
                onToggle={isPermissionAssigned(permission.id) ? handleRevokePermission : handleAssignPermission}
              />
            ))}
          </div>
        </div>
      </div>

      
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trash2 className="h-5 w-5 mr-2 text-error-600" />
            {t('permissions.deleteRequestPermissions')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('permissions.deleteRequestPermissionsDescription')}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deleteRequestPermissions.map((permission) => (
              <PermissionCard
                key={permission.id}
                permission={permission}
                isAssigned={isPermissionAssigned(permission.id)}
                onToggle={isPermissionAssigned(permission.id) ? handleRevokePermission : handleAssignPermission}
              />
            ))}
          </div>
        </div>
      </div>

      
        <div className="card p-6 bg-info-50 border-info-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-info-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-info-900">
                {t('permissions.permissionManagementInfo')}
              </h3>
              <div className="mt-2 text-sm text-info-700">
              <ul className="list-disc list-inside space-y-1">
                <li>{t('permissions.permissionManagementInfoDescription')}</li>
                <li>{t('permissions.permissionManagementInfoDescription2')}</li>
                <li>{t('permissions.permissionManagementInfoDescription3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;