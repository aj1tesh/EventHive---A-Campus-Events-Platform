/**
 * Profile Page component
 * Allows users to view and edit their profile information
 */

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  Edit3, 
  Key,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, loading } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      return;
    }

    const result = await updateProfile(profileData);
    if (result.success) {
      setIsEditingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    
    if (result.success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'organizer': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-primary-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and settings
        </p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h2>
          
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn-secondary btn-sm"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.username}
                </h3>
                <span className={`badge ${getRoleColor(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="text-gray-900">{user?.username}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="text-gray-900 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-400" />
                  {user?.role}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                className={`input ${errors.username ? 'input-error' : ''}`}
                required
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileData({
                    username: user?.username || '',
                    email: user?.email || '',
                  });
                  setErrors({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Change Password
          </h2>
          
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn-secondary btn-sm"
            >
              <Key className="h-4 w-4 mr-1" />
              Change
            </button>
          )}
        </div>

        {!isChangingPassword ? (
          <div className="text-gray-600">
            <p>Last updated: Never</p>
            <p className="text-sm mt-1">
              Click "Change" to update your password
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setErrors({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">User ID</span>
            <span className="text-sm text-gray-900 font-mono">{user?.id}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <span className={`badge ${getRoleColor(user?.role)}`}>
              {user?.role}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Account Created</span>
            <span className="text-sm text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Last Updated</span>
            <span className="text-sm text-gray-900">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
