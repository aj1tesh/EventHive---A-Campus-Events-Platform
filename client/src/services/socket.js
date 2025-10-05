import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  connect(authToken) {
    if (this.socket && this.socket.connected) {
      this.disconnect();
    }

    if (!authToken) {
      console.warn('No token provided for socket connection');
      return null;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn('Max connection attempts reached, skipping socket connection');
      return null;
    }

    this.connectionAttempts++;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: authToken
      },
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id || 'unknown');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', (disconnectReason) => {
      console.log('Disconnected from server:', disconnectReason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (connectionError) => {
      console.error('Socket connection error:', connectionError.message || connectionError);
      this.isConnected = false;
      
      // Log specific error types for debugging
      if (connectionError.type === 'TransportError') {
        console.warn('Transport error - will retry with fallback transport');
      } else if (connectionError.type === 'UnauthorizedError') {
        console.error('Authentication failed - check token validity');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.socket.on('reconnect_error', (reconnectError) => {
      console.error('Reconnection error:', reconnectError);
    });

    // Listen for transport upgrades
    this.socket.on('upgrade', () => {
      console.log('Socket transport upgraded to:', this.socket.io.engine.transport.name);
    });

    this.socket.on('upgradeError', (upgradeError) => {
      console.warn('Transport upgrade failed:', upgradeError);
    });

    return this.socket;
  }

  // Disconnect from the socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reset connection attempts (useful after successful authentication)
  resetConnectionAttempts() {
    this.connectionAttempts = 0;
  }

  // Event listeners for real-time updates
  onAttendeeUpdate(callback) {
    if (this.socket) {
      this.socket.on('attendee_update', callback);
    }
  }

  onNewEvent(callback) {
    if (this.socket) {
      this.socket.on('new_event', callback);
    }
  }

  onRegistrationNotification(callback) {
    if (this.socket) {
      this.socket.on('registration_notification', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Event emitters for sending data to server
  joinEvent(eventId) {
    if (this.socket) {
      this.socket.emit('join_event', eventId);
    }
  }

  leaveEvent(eventId) {
    if (this.socket) {
      this.socket.emit('leave_event', eventId);
    }
  }

  emitRegistrationUpdate(eventId, registrationId, newStatus) {
    if (this.socket) {
      this.socket.emit('registration_update', {
        eventId,
        registrationId,
        status: newStatus
      });
    }
  }

  emitEventCreated(newEventData) {
    if (this.socket) {
      this.socket.emit('event_created', newEventData);
    }
  }

  emitNewRegistration(eventId, userId) {
    if (this.socket) {
      this.socket.emit('new_registration', {
        eventId,
        userId
      });
    }
  }

  // Remove event listeners
  removeListener(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance for use throughout the application
const socketService = new SocketService();

export default socketService;
