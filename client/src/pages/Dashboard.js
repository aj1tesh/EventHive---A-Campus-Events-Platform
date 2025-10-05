import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Users, 
  Edit,
  Trash2,
  Loader2,
  Search
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';

const Dashboard = () => {
  const { 
    events, 
    registrations, 
    fetchEvents, 
    fetchRegistrations, 
    deleteEvent,
    updateRegistrationStatus,
    loading 
  } = useEvents();
  
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentEventId, setCurrentEventId] = useState(null);

  const handleCreateEvent = useCallback(() => {
    console.log('Create event functionality removed');
  }, []);

  useEffect(() => {
    fetchEvents({ limit: 50 });
    fetchRegistrations({ limit: 100 });
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    const create = urlParams.get('create');
    
    if (eventId) {
      setCurrentEventId(eventId);
      setActiveTab('registrations');
      setSearchTerm('');
      setStatusFilter('all');
    } else if (create === 'true') {
      handleCreateEvent();
    }
  }, [fetchEvents, fetchRegistrations, handleCreateEvent]);

  const handleDeleteEvent = async (eventId, eventTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    const result = await deleteEvent(eventId);
    if (result.success) {
      fetchEvents({ limit: 50 });
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId, status) => {
    const result = await updateRegistrationStatus(registrationId, status);
    if (result.success) {
      fetchRegistrations({ limit: 100 });
    }
  };


  const handleEditEvent = (event) => {
    console.log('Edit event functionality removed', event);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = !searchTerm || 
      reg.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.event_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    
    const matchesEvent = !currentEventId || reg.event_id === currentEventId;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const EventCard = ({ event }) => (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center space-x-2">
          <Link
            to={`/events/${event.id}`}
            className="btn-secondary btn-sm"
          >
            View
          </Link>
          <button
            onClick={() => handleEditEvent(event)}
            className="btn-secondary btn-sm"
            title="Edit Event"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteEvent(event.id, event.title)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            title="Delete Event"
          >
            <Trash2 className="h-4 w-4 text-gray-900" />
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {event.description || 'No description'}
      </p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(event.date)}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-2" />
          {event.current_attendees} / {event.max_attendees} attendees
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`badge ${
          event.status === 'upcoming' ? 'badge-upcoming' : 'badge-secondary'
        }`}>
          {event.status}
        </span>
        
      </div>
    </div>
  );

  const RegistrationRow = ({ registration }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {registration.user.username}
          </div>
          <div className="text-sm text-gray-500">
            {registration.user.email}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{registration.event_title}</div>
        <div className="text-sm text-gray-500">
          {formatDate(registration.event_date)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getStatusColor(registration.status)}`}>
          {registration.status}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(registration.registered_at)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          {registration.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateRegistrationStatus(registration.id, 'approved')}
                className="text-gray-600 hover:text-gray-800 text-lg"
                title="Approve"
              >
                ✓
              </button>
              <button
                onClick={() => handleUpdateRegistrationStatus(registration.id, 'rejected')}
                className="text-gray-600 hover:text-gray-800 text-lg"
                title="Reject"
              >
                ✗
              </button>
            </>
          )}
          
          {registration.status === 'approved' && (
            <button
              onClick={() => handleUpdateRegistrationStatus(registration.id, 'rejected')}
              className="text-gray-600 hover:text-gray-800 text-lg"
              title="Reject"
            >
              ✗
            </button>
          )}
          
          {registration.status === 'rejected' && (
            <button
              onClick={() => handleUpdateRegistrationStatus(registration.id, 'approved')}
              className="text-gray-600 hover:text-gray-800 text-lg"
              title="Approve"
            >
              ✓
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your events and registrations
          </p>
        </div>
        
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {events.length}
          </div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {events.filter(e => new Date(e.date) > new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Upcoming Events</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {registrations.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Registrations</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {registrations.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved Registrations</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 justify-between">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Events ({events.length})
            </button>
            
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'registrations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Registrations ({registrations.length})
            </button>
          </div>
          
          <button
            onClick={handleCreateEvent}
            className="btn-primary btn-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-6 w-6 text-primary-600" />
                <span className="text-gray-600">Loading events...</span>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events created yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first event to get started
              </p>
              <button onClick={handleCreateEvent} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Event Filter Header */}
          {currentEventId && (
            <div className="card bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Showing registrations for: {events.find(e => e.id === currentEventId)?.title || 'Event'}
                    </h3>
                    <p className="text-xs text-gray-700">
                      {filteredRegistrations.length} registration(s) found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrentEventId(null);
                    setSearchTerm('');
                    setStatusFilter('all');
                    const url = new URL(window.location);
                    url.searchParams.delete('event');
                    window.history.replaceState({}, '', url);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  View All Registrations
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Registrations Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-6 w-6 text-primary-600" />
                <span className="text-gray-600">Loading registrations...</span>
              </div>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No registrations found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No one has registered for your events yet'
                }
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRegistrations.map((registration) => (
                      <RegistrationRow key={registration.id} registration={registration} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;

