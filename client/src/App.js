import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Dashboard from './pages/Dashboard';
import StudentRegistrations from './components/StudentRegistrations';

const toastSettings = {
  duration: 4000,
  position: 'top-right',
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
};

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                
                <Route path="/events/:id" element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-registrations" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentRegistrations />
                  </ProtectedRoute>
                } />
                
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            <Toaster toastOptions={toastSettings} />
          </div>
        </Router>
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
