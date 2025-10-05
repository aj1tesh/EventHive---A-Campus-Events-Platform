import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Plus,
  Loader2
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { events, fetchEvents, loading, pagination } = useEvents();
  const { canManageEvents } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    const searchParams = {
      page: currentPage,
      limit: 9,
      search: searchTerm || undefined,
      upcoming: upcomingOnly,
    };
    
    fetchEvents(searchParams);
  }, [currentPage, searchTerm, upcomingOnly, fetchEvents]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleUpcomingFilter = () => {
    setUpcomingOnly(!upcomingOnly);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const eventDate = new Date(dateString);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate <= now) {
      return { status: 'past', color: 'badge-secondary' };
    }
    
    if (event.is_full) {
      return { status: 'Full', color: 'badge-danger' };
    }
    
    if (event.current_attendees >= event.max_attendees * 0.8) {
      return { status: 'Almost Full', color: 'badge-warning' };
    }
    
    return { status: null, color: null };
  };
  const EventCard = ({ event }) => {
    const eventStatus = getEventStatus(event);
    
    return (
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {event.title}
          </h3>
          {eventStatus.status && (
            <span className={`badge ${eventStatus.color} ml-2`}>
              {eventStatus.status}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description || 'No description available'}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.date)}
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-2" />
              {event.location}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            {event.current_attendees} / {event.max_attendees} attendees
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-xs text-gray-400 mr-2">by</span>
            {event.created_by_username}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link
            to={`/events/${event.id}`}
            className="btn-primary btn-sm"
          >
            View Details
          </Link>
          
          {canManageEvents() && (
            <span className="text-xs text-gray-400">
              ID: {event.id}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <img 
          src="/pics/home.jpg" 
          alt="EventHive Hero" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
              EventHive
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-white drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
              Discover and register for exciting campus events
            </p>
          </div>
        </div>
      </div>

      {/* Content Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold" style={{color: '#1a1a1a'}}>
            Upcoming Events
          </h2>
          <p className="text-gray-600 mt-1">
            Explore what's happening on campus
          </p>
        </div>
        {canManageEvents() && (
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Manage Events</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>
          
          <button
            onClick={toggleUpcomingFilter}
            className={`btn flex items-center space-x-2 ${
              upcomingOnly ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <span>{upcomingOnly ? 'Upcoming Only' : 'All Events'}</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
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
            No events found
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Check back later for new events'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      {!loading && events.length > 0 && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {pagination.total}
              </div>
              <div className="text-sm text-gray-600">
                Total Events
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => new Date(e.date) > new Date()).length}
              </div>
              <div className="text-sm text-gray-600">
                Upcoming
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {events.reduce((sum, e) => sum + e.current_attendees, 0)}
              </div>
              <div className="text-sm text-gray-600">
                Total Attendees
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
