import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return authContext;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    toast.success('Logged out successfully');
  }, []);

  useEffect(() => {
    const checkExistingLogin = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser && savedUser !== 'undefined') {
          setToken(savedToken);
          try {
            setUser(JSON.parse(savedUser));
          } catch (parseError) {
            console.warn('Invalid user data in localStorage, clearing...');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return;
          }
          
          try {
            const response = await authAPI.getProfile();
            if (response.data.success) {
              setUser(response.data.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
              socketService.resetConnectionAttempts();
              socketService.connect(savedToken);
            } else {
              throw new Error('Invalid token');
            }
          } catch (error) {
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkExistingLogin();
  }, [logout]);

  const login = useCallback(async (loginCredentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(loginCredentials);
      
      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;
        
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        socketService.resetConnectionAttempts();
        socketService.connect(authToken);
        
        toast.success(`Welcome back, ${userData.username}!`);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (newUserData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(newUserData);
      
      if (response.data.success) {
        const { user: newUser, token: authToken } = response.data.data;
        
        setUser(newUser);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        socketService.resetConnectionAttempts();
        socketService.connect(authToken);
        
        toast.success(`Welcome to Campus Events, ${newUser.username}!`);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);


  const updateProfile = useCallback(async (profileUpdateData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(profileUpdateData);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (passwordChangeData) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword(passwordChangeData);
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = () => !!user && !!token;
  
  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.role === requiredRole;
  };
  
  const hasAnyRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = () => hasRole('admin');
  const isOrganizer = () => hasRole('organizer');
  const isStudent = () => hasRole('student');
  const canManageEvents = () => hasAnyRole(['organizer', 'admin']);

  const contextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isAdmin,
    isOrganizer,
    isStudent,
    canManageEvents,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
