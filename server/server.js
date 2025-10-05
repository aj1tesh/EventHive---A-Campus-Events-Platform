const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection } = require('./database/connection');
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const registrationsRoutes = require('./routes/registrations');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

io.use((socket, next) => {
  const authToken = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!authToken) {
    console.warn('Socket connection attempt without token from:', socket.handshake.address);
    return next(new Error('Authentication token required'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
    socket.userId = decodedToken.userId;
    socket.userRole = decodedToken.role;
    socket.username = decodedToken.username;
    console.log(`Socket authentication successful for user: ${decodedToken.username}`);
    next();
  } catch (error) {
    console.warn('Socket authentication failed:', error.message);
    next(new Error('Invalid authentication token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.username} (${socket.userRole}) connected with socket ID: ${socket.id}`);

  socket.join(`user_${socket.userId}`);

  if (socket.userRole === 'organizer' || socket.userRole === 'admin') {
    socket.join('organizers');
  }

  socket.on('join_event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`User ${socket.username} joined event room: event_${eventId}`);
  });

  socket.on('leave_event', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`User ${socket.username} left event room: event_${eventId}`);
  });

  socket.on('registration_update', async (updateData) => {
    try {
      const { eventId, registrationId, status } = updateData;
      
      if (socket.userRole !== 'organizer' && socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Unauthorized to update registrations' });
        return;
      }

      const { query } = require('./database/connection');
      const result = await query(
        'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = $2',
        [eventId, 'approved']
      );

      const attendeeCount = parseInt(result.rows[0].count);

      io.to(`event_${eventId}`).emit('attendee_update', {
        eventId,
        attendeeCount,
        registrationId,
        status,
        updatedBy: socket.username,
        timestamp: new Date().toISOString()
      });

      console.log(`Attendee count updated for event ${eventId}: ${attendeeCount}`);

    } catch (error) {
      console.error('Error handling registration update:', error);
      socket.emit('error', { message: 'Error updating registration' });
    }
  });

  socket.on('event_created', (newEventData) => {
    io.emit('new_event', {
      event: newEventData,
      createdBy: socket.username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('new_registration', (registrationData) => {
    const { eventId, userId } = registrationData;
    
    io.to('organizers').emit('registration_notification', {
      eventId,
      userId,
      registeredBy: socket.username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', (disconnectReason) => {
    console.log(`User ${socket.username} disconnected: ${disconnectReason}`);
  });
});

const emitEventUpdate = (eventId, updateType, updateData) => {
  io.to(`event_${eventId}`).emit(updateType, {
    eventId,
    ...updateData,
    timestamp: new Date().toISOString()
  });
};

app.set('io', io);
app.set('emitEventUpdate', emitEventUpdate);

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log('EventHive Server Started');
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Socket.io server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
