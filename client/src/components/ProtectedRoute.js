// Protected Route component - wraps routes that require authentication
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role to access this page
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required roles: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has the right role, show the page
  return children;
};

export default ProtectedRoute;
