import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManageEvents, isAdmin } = useAuth();
  const { 
    currentEvent, 
    fetchEvent, 
    deleteEvent, 
    registerForEvent, 
    loading,
    leaveEventRoom 
  } = useEvents();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
    
    return () => {
      if (id) {
        leaveEventRoom(id);
      }
    };
  }, [id, fetchEvent, leaveEventRoom]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getEventStatus = () => {
    if (!currentEvent) return null;
    
    const now = new Date();
    const eventDate = new Date(currentEvent.date);
    
    if (eventDate <= now) {
      return { status: 'Past Event', color: 'badge-secondary' };
    }
    
    if (currentEvent.is_full) {
      return { status: 'Full', color: 'badge-danger' };
    }
    
    if (currentEvent.current_attendees >= currentEvent.max_attendees * 0.8) {
      return { status: 'Almost Full', color: 'badge-warning' };
    }
    
    return { status: 'Available', color: 'badge-secondary' };
  };

  const handleRegister = async () => {
    if (!currentEvent) return;
    
    setIsRegistering(true);
    try {
      const result = await registerForEvent(currentEvent.id);
      if (result.success) {
        fetchEvent(currentEvent.id);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEvent || !canManageEvents()) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteEvent(currentEvent.id);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = () => {
    if (!currentEvent || !canManageEvents()) return false;
    return isAdmin() || currentEvent.created_by === user.id;
  };

  const canDelete = canEdit;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-primary-600" />
          <span className="text-gray-600">Loading event details...</span>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Event not found
        </h3>
        <p className="text-gray-600 mb-4">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const { date, time } = formatDate(currentEvent.date);
  const isPastEvent = new Date(currentEvent.date) <= new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center text-primary-600">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentEvent.title}
                </h1>
                <div className="flex items-center space-x-4">
                  {eventStatus && (
                    <span className={`badge ${eventStatus.color}`}>
                      {eventStatus.status}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Created by {currentEvent.created_by_username}
                  </span>
                </div>
              </div>
              
              {canEdit() && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/dashboard?edit=${currentEvent.id}`)}
                    className="btn-secondary btn-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  
                  {canDelete() && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isDeleting ? (
                        <Loader2 className="animate-spin h-4 w-4 mr-1" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {currentEvent.description && (
              <p className="text-gray-700 leading-relaxed">
                {currentEvent.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date and Time */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Event Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">{date}</div>
                  <div className="text-sm text-gray-600">{time}</div>
                </div>
              </div>
              
              {currentEvent.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="font-medium text-gray-900">Location</div>
                    <div className="text-sm text-gray-600">{currentEvent.location}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Attendees</div>
                  <div className="text-sm text-gray-600">
                    {currentEvent.current_attendees} of {currentEvent.max_attendees} registered
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (currentEvent.current_attendees / currentEvent.max_attendees) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Event ID</div>
                  <div className="text-sm text-gray-600">#{currentEvent.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Panel */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Registration
            </h2>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {currentEvent.current_attendees}
                </div>
                <div className="text-sm text-gray-600">
                  of {currentEvent.max_attendees} spots filled
                </div>
              </div>
              
              {!isPastEvent && !currentEvent.is_full && user.role === 'student' && (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="btn-primary w-full"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600 text-lg">✓</span>
                      <span className="ml-2">Register for Event</span>
                    </>
                  )}
                </button>
              )}
              
              {isPastEvent && (
                <div className="text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>This event has already passed</p>
                </div>
              )}
              
              {currentEvent.is_full && !isPastEvent && (
                <div className="text-center text-gray-500">
                  <span className="text-gray-600 text-3xl mb-2 block">✗</span>
                  <p>This event is full</p>
                </div>
              )}
              
              {user.role !== 'student' && (
                <div className="text-center text-gray-500">
                  <p>Only students can register for events</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Organizer Info */}
          {canManageEvents() && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">
                Management
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event ID:</span>
                  <span className="font-mono">{currentEvent.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>
                    {new Date(currentEvent.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>
                    {new Date(currentEvent.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

