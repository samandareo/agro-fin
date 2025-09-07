import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell, Settings } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  
  const handleLogout = () => {
    logout();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('header.adminDashboard')}
            </h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Settings */}
            <button 
              onClick={handleSettings}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={t('navigation.settings')}
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-500 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('navigation.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
