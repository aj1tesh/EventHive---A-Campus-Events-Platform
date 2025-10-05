// Navigation Bar component - provides main navigation and user menu
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  Shield,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for mobile menu and user menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Function to handle user logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to check if a route is currently active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Component for navigation links with active state styling
  const NavLink = ({ to, children, className = "" }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActiveRoute(to)
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      } ${className}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  // Show simple navbar for non-authenticated users
  if (!isAuthenticated()) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Campus Events
              </span>
            </Link>
            
            {/* Login and Register buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">
              Campus Events
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/">Events</NavLink>
            
            {user && (user.role === 'organizer' || user.role === 'admin') && (
              <NavLink to="/dashboard">Dashboard</NavLink>
            )}
            
            {user && user.role === 'student' && (
              <NavLink to="/my-registrations">My Registrations</NavLink>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <User className="h-5 w-5" />
                <span>{user?.username}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user?.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.role}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <NavLink to="/">Events</NavLink>
              
              {user && (user.role === 'organizer' || user.role === 'admin') && (
                <NavLink to="/dashboard">Dashboard</NavLink>
              )}
              
              {user && user.role === 'student' && (
                <NavLink to="/my-registrations">My Registrations</NavLink>
              )}
              
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-left"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{user?.username}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user?.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
