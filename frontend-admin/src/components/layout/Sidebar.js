import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  FolderTree,
  FileText,
  Trash2,
  Key,
  Settings,
  MessageSquare,
  CheckSquare
} from 'lucide-react';
import Logo from '../../assets/logo.PNG';
import { useDeleteRequests } from '../../contexts/DeleteRequestsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { pendingCount } = useDeleteRequests();
  const { admin } = useAuth();
  const { t } = useTranslation();

  // Define navigation based on role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Delete Requests', href: '/delete-requests', icon: Trash2, badge: pendingCount },
      { name: 'Permissions', href: '/permissions', icon: Key },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    // Only admin can see Users, Groups management, and Messages
    if (admin?.role === 'admin') {
      return [
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Groups', href: '/groups', icon: FolderTree },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        ...baseNavigation
      ];
    }

    // Director can only see Documents, Delete Requests, Permissions, and Settings
    return baseNavigation;
  };

  const navigation = getNavigation();

  return (
    <div className="w-64 h-full bg-white shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center">
          <div className="h-8 w-8rounded-lg flex items-center justify-center">
            <img src={Logo} alt="AgroFin-Hisobot" className="h-8 w-8 text-brand-600" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900 ">{t('sidebar.adminPanel')}</h1>
            <p className="text-xs text-gray-500">{t('sidebar.managementPanel')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.${item.name}`)}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-500 text-center">
          <p>{t('sidebar.managementPanel')}</p>
          <p>{t('sidebar.version')}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
