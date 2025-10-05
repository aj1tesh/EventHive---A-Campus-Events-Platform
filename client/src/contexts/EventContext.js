// Event Context - manages event data and event-related operations
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventsAPI, registrationsAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Create the event context
const EventContext = createContext();

// Custom hook to use event context
export const useEvents = () => {
  const eventContext = useContext(EventContext);
  if (!eventContext) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return eventContext;
};

// Event provider component that wraps the app
export const EventProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State variables for events and registrations
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Set up real-time event updates using socket connections
  useEffect(() => {
    // Handle when attendee count changes for an event
    const handleAttendeeUpdate = (updateData) => {
      console.log('Attendee update received:', updateData);
      
      // Update events list with new attendee count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === updateData.eventId 
            ? { 
                ...event, 
                current_attendees: updateData.attendeeCount,
                is_full: updateData.attendeeCount >= event.max_attendees
              }
            : event
        )
      );
      
      // Update current event if it's the one being updated
      setCurrentEvent(prevEvent => 
        prevEvent && prevEvent.id === updateData.eventId 
          ? { 
              ...prevEvent, 
              current_attendees: updateData.attendeeCount,
              is_full: updateData.attendeeCount >= prevEvent.max_attendees
            }
          : prevEvent
      );
      
      console.log(`Event ${updateData.eventId} attendee count updated to ${updateData.attendeeCount}`);
    };

    // Handle when a new event is created
    const handleNewEvent = (newEventData) => {
      setEvents(prevEvents => [newEventData.event, ...prevEvents]);
      toast.success(`New event: ${newEventData.event.title}`);
    };

    // Handle registration notifications for organizers
    const handleRegistrationNotification = (registrationData) => {
      // Refresh registrations if on dashboard page
      if (window.location.pathname.includes('/dashboard')) {
        fetchRegistrations();
      }
      toast.success(`New registration for event ${registrationData.eventId}`);
    };

    // Set up socket event listeners
    socketService.onAttendeeUpdate(handleAttendeeUpdate);
    socketService.onNewEvent(handleNewEvent);
    socketService.onRegistrationNotification(handleRegistrationNotification);

    // Clean up listeners when component unmounts
    return () => {
      socketService.removeListener('attendee_update', handleAttendeeUpdate);
      socketService.removeListener('new_event', handleNewEvent);
      socketService.removeListener('registration_notification', handleRegistrationNotification);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to get all events from the server
  const fetchEvents = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll(searchParams);
      
      if (response.data.success) {
        setEvents(response.data.data.events);
        setPagination(response.data.data.pagination);
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch events');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch events';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to get a specific event by its ID
  const fetchEvent = useCallback(async (eventId) => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(eventId);
      
      if (response.data.success) {
        setCurrentEvent(response.data.data.event);
        
        // Join the event room for real-time updates
        socketService.joinEvent(eventId);
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch event');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to create a new event
  const createEvent = useCallback(async (newEventData) => {
    try {
      setLoading(true);
      const response = await eventsAPI.create(newEventData);
      
      if (response.data.success) {
        const newEvent = response.data.data.event;
        setEvents(prevEvents => [newEvent, ...prevEvents]);
        
        // Notify other users about the new event
        socketService.emitEventCreated(newEvent);
        
        toast.success('Event created successfully');
        return { success: true, data: newEvent };
      } else {
        throw new Error(response.data.message || 'Failed to create event');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to update an existing event
  const updateEvent = useCallback(async (eventId, eventUpdateData) => {
    try {
      setLoading(true);
      const response = await eventsAPI.update(eventId, eventUpdateData);
      
      if (response.data.success) {
        const updatedEvent = response.data.data.event;
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId ? updatedEvent : event
          )
        );
        
        // Update current event if it's the one being updated
        if (currentEvent && currentEvent.id === eventId) {
          setCurrentEvent(updatedEvent);
        }
        
        toast.success('Event updated successfully');
        return { success: true, data: updatedEvent };
      } else {
        throw new Error(response.data.message || 'Failed to update event');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // Function to delete an event
  const deleteEvent = useCallback(async (eventId) => {
    try {
      setLoading(true);
      const response = await eventsAPI.delete(eventId);
      
      if (response.data.success) {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        
        // Clear current event if it's the one being deleted
        if (currentEvent && currentEvent.id === eventId) {
          setCurrentEvent(null);
        }
        
        toast.success('Event deleted successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to delete event');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // Function to register for an event
  const registerForEvent = useCallback(async (eventId) => {
    try {
      setLoading(true);
      const response = await registrationsAPI.create(eventId);
      
      if (response.data.success) {
        // Notify organizers about the new registration
        socketService.emitNewRegistration(eventId, response.data.data.registration.user_id);
        
        toast.success('Successfully registered for the event');
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to register for event');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register for event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to cancel a registration
  const cancelRegistration = useCallback(async (registrationId) => {
    try {
      setLoading(true);
      const response = await registrationsAPI.cancel(registrationId);
      
      if (response.data.success) {
        setRegistrations(prevRegistrations => 
          prevRegistrations.filter(registration => registration.id !== registrationId)
        );
        
        toast.success('Registration cancelled successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to cancel registration');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel registration';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to get user registrations (different for students vs organizers)
  const fetchRegistrations = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      
      // Use different API endpoints based on user role
      let response;
      if (user?.role === 'organizer' || user?.role === 'admin') {
        // For organizers/admins, get registrations for events they manage
        response = await registrationsAPI.getManage(searchParams);
      } else {
        // For students, get their own registrations
        response = await registrationsAPI.getAll(searchParams);
      }
      
      if (response.data.success) {
        setRegistrations(response.data.data.registrations || []);
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch registrations');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch registrations';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // Function to update registration status (organizers and admins only)
  const updateRegistrationStatus = useCallback(async (registrationId, newStatus) => {
    try {
      setLoading(true);
      const response = await registrationsAPI.updateStatus(registrationId, newStatus);
      
      if (response.data.success) {
        // Send real-time update notification
        const registration = registrations.find(reg => reg.id === registrationId);
        if (registration) {
          socketService.emitRegistrationUpdate(registration.event_id, registrationId, newStatus);
        }
        
        setRegistrations(prevRegistrations => 
          prevRegistrations.map(registration => 
            registration.id === registrationId 
              ? { ...registration, status: newStatus }
              : registration
          )
        );
        
        toast.success(`Registration ${newStatus} successfully`);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to update registration status');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update registration status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [registrations]);

  // Function to leave an event room (for real-time updates)
  const leaveEventRoom = useCallback((eventId) => {
    socketService.leaveEvent(eventId);
  }, []);

  // All values to provide to components
  const contextValue = {
    events,
    currentEvent,
    registrations,
    loading,
    pagination,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    fetchRegistrations,
    updateRegistrationStatus,
    leaveEventRoom,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};
