# Campus Event Platform

A Real-Time Campus Event Platform with role-based access control, built with Node.js, Express.js, PostgreSQL, React, Tailwind CSS, and Socket.io.

## Features

- **Role-based Access Control**: Students, Organizers, and Admins with different permissions
- **Real-time Updates**: Live attendee count updates using Socket.io
- **Event Management**: Create, read, update, and delete events
- **Registration System**: Students can register for events, organizers can approve/reject
- **Modern UI**: Beautiful interface built with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, React Router, Tailwind CSS
- **Real-time**: Socket.io
- **Authentication**: JWT with bcrypt password hashing

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. **Install dependencies:**
```bash
npm run install-all
```

2. **Set up environment variables:**
```bash
# Copy the example environment files
cp server/env.example server/.env
cp client/env.example client/.env

# Edit server/.env with your database credentials
# Edit client/.env if needed (defaults should work for local development)
```

3. **Set up the database:**
```bash
cd server
npm run db:setup
npm run db:seed
```

4. **Start the development servers:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000


## Project Structure

```
├── server/                 # Backend Node.js/Express application
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   ├── database/          # Database scripts
│   └── server.js          # Main server file
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (organizer/admin only)
- `PUT /api/events/:id` - Update event (organizer/admin only)
- `DELETE /api/events/:id` - Delete event (organizer/admin only)

### Registrations
- `GET /api/registrations` - Get user's registrations
- `POST /api/registrations` - Register for an event
- `PUT /api/registrations/:id` - Update registration status (organizer/admin only)

## User Roles

- **Student**: Can view events and register for them
- **Organizer**: Can create/edit events and manage registrations for their events
- **Admin**: Full access to all events and registrations

## Environment Variables

### Server (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
