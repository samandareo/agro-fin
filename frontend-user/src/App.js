import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { DeleteRequestProvider } from './contexts/DeleteRequestContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DeleteRequestsPage from './components/DeleteRequestsPage';
import NotificationsPage from './components/NotificationsPage';
import Header from './components/Header';
import LanguageSwitcher from './components/LanguageSwitcher';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/user/login" />;
};

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/user" element={<Dashboard />} />
          <Route path="/user/delete-requests" element={<DeleteRequestsPage />} />
          <Route path="/user/notifications" element={<NotificationsPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/user/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DocumentProvider>
                    <DeleteRequestProvider>
                      <NotificationsProvider>
                        <AppLayout />
                      </NotificationsProvider>
                    </DeleteRequestProvider>
                  </DocumentProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
