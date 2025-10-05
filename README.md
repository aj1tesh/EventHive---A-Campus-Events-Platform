# EventHive

A real-time campus event platform with role-based access control.

## Features

- Role-based access control (Student, Organizer, Admin)
- Real-time updates with Socket.io
- Event management and registration system
- Modern UI with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, Tailwind CSS
- **Real-time**: Socket.io
- **Authentication**: JWT

## Quick Start

### Docker (Recommended)

```bash
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

See [DOCKER.md](DOCKER.md) for detailed setup.

### Manual Installation

**Prerequisites**: Node.js 16+, PostgreSQL 12+

```bash
npm run install-all
cp server/env.example server/.env
cp client/env.example client/.env
# Edit server/.env with database credentials
cd server && npm run db:setup && npm run db:seed
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizer/admin)
- `PUT /api/events/:id` - Update event (organizer/admin)
- `DELETE /api/events/:id` - Delete event (organizer/admin)

### Registrations
- `GET /api/registrations` - Get user registrations
- `POST /api/registrations` - Register for event
- `PUT /api/registrations/:id` - Update registration status

## User Roles

- **Student**: View and register for events
- **Organizer**: Create/edit events, manage registrations
- **Admin**: Full system access

## Environment Variables

### Server
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
```

### Client
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
├── server/          # Backend API
├── client/          # Frontend React app
├── docker-compose.yml
└── DOCKER.md
```

## License

MIT