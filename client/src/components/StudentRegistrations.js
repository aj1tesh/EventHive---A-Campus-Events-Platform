/**
 * StudentRegistrations component
 * Shows a student's registration history
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';

const StudentRegistrations = () => {
  const { registrations, fetchRegistrations, loading } = useEvents();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRegistrations({ limit: 50 });
  }, [fetchRegistrations]);

  const filteredRegistrations = registrations.filter(reg => {
    if (statusFilter === 'all') return true;
    return reg.status === statusFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading your registrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Registrations</h2>
          <p className="text-gray-600">Track your event registrations and their status</p>
        </div>
        
        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No registrations yet' : `No ${statusFilter} registrations`}
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? 'Start browsing events and register for ones you\'re interested in!'
              : `You don't have any ${statusFilter} registrations.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations.map((registration) => (
            <div key={registration.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {registration.event_title}
                    </h3>
                    <span className={`badge ${getStatusColor(registration.status)}`}>
                      {getStatusIcon(registration.status)}
                      <span className="ml-1 capitalize">{registration.status}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {registration.event_description}
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(registration.event_date)}
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {registration.event_location}
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {registration.event_attendees || 0} / {registration.max_attendees} attendees
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-500">
                  <div>Registered:</div>
                  <div>{formatDate(registration.registered_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentRegistrations;
