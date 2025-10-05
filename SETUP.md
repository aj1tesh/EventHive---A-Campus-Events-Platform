# Setup Guide

## Prerequisites

- Node.js 16+
- PostgreSQL 12+

## Installation

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Environment Configuration

**Server:**
```bash
cp server/env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
```

**Client:**
```bash
cp client/env.example client/.env
```

Default client configuration:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Database Setup

```bash
cd server
npm run db:setup
npm run db:seed
```

### 4. Start Application

```bash
npm run dev
```

## Access

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health: http://localhost:5000/health

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campus.edu | password123 |
| Organizer | organizer1@campus.edu | password123 |
| Student | student1@campus.edu | password123 |

## Troubleshooting

**Database Issues:**
- Verify PostgreSQL is running
- Check credentials in `server/.env`
- Ensure database exists

**Port Conflicts:**
- Change PORT in `server/.env`
- Modify React port in `client/package.json`

**Dependencies:**
- Delete `node_modules` and reinstall
- Ensure Node.js 16+