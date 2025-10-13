import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, FileText, Trash2, Bell } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
const Logo = require('../assets/logo.PNG');


const Header = () => {
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();
  
  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNotificationsClick = () => {
    navigate('/user/notifications');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src={Logo} alt="AgroFin-Hisobot" className="h-8 w-8 text-brand-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                {t('navigation.title')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => navigate('/user')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/user') 
                    ? 'bg-brand-100 text-brand-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('navigation.reports')}
              </button>
              <button
                onClick={() => navigate('/user/delete-requests')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/user/delete-requests') 
                    ? 'bg-brand-100 text-brand-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('navigation.deleteRequests')}
              </button>
            </nav>
            
            {/* Notifications Bell */}
            <button
              onClick={handleNotificationsClick}
              className={`relative inline-flex items-center p-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/user/notifications') 
                  ? 'bg-brand-100 text-brand-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={t('navigation.notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            <LanguageSwitcher />
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
