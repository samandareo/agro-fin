import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UsersProvider } from '../contexts/UsersContext';
import { DeleteRequestsProvider } from '../contexts/DeleteRequestsContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import UsersManagement from './pages/UsersManagement';
import UserDocuments from './pages/UserDocuments';
import GroupsManagement from './pages/GroupsManagement';
import DocumentsManagement from './pages/DocumentsManagement';
import DeleteRequestsManagement from './pages/DeleteRequestsManagement';
import PermissionsManagement from './pages/PermissionsManagement';
import AdminProfileManagement from './pages/AdminProfileManagement';
import MessagesManagement from './pages/MessagesManagement';
import TasksManagement from './pages/TasksManagement';

const Dashboard = () => {
  const { admin } = useAuth();

  // Get default route based on role
  const getDefaultRoute = () => {
    if (admin?.role === 'admin') {
      return '/users'; // Admin sees Users management first
    } else if (admin?.role === 'director') {
      return '/documents'; // Director sees Documents management first
    }
    return '/documents'; // Fallback
  };

  // Component to restrict access based on role
  const AdminOnlyRoute = ({ children }) => {
    if (admin?.role !== 'admin') {
      return <Navigate to={getDefaultRoute()} replace />;
    }
    return children;
  };

  return (
    <UsersProvider>
      <DeleteRequestsProvider>
        <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full z-30">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-64">
          {/* Fixed Header */}
          <div className="fixed top-0 right-0 left-64 z-20">
            <Header />
          </div>
          
          {/* Scrollable Main Content */}
          <main className="flex-1 pt-20 overflow-y-auto">
            <div className="p-6">
              <Routes>
                <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
                {/* Admin-only routes */}
                <Route path="/users" element={<AdminOnlyRoute><UsersManagement /></AdminOnlyRoute>} />
                <Route path="/users/:userId/documents" element={<AdminOnlyRoute><UserDocuments /></AdminOnlyRoute>} />
                <Route path="/groups" element={<AdminOnlyRoute><GroupsManagement /></AdminOnlyRoute>} />
                {/* Shared routes for both admin and director */}
                <Route path="/tasks" element={<TasksManagement />} />
                <Route path="/messages" element={<MessagesManagement />} />
                <Route path="/documents" element={<DocumentsManagement />} />
                <Route path="/delete-requests" element={<DeleteRequestsManagement />} />
                <Route path="/permissions" element={<PermissionsManagement />} />
                <Route path="/settings" element={<AdminProfileManagement />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
      </DeleteRequestsProvider>
    </UsersProvider>
  );
};

export default Dashboard;
