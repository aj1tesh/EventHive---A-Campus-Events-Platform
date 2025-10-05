# Setup Guide

This guide will help you set up the Campus Event Platform on your local machine.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

## Manual Setup Steps

### 1. Install Dependencies

```bash
npm run install-all
```

This will install dependencies for both the root project, server, and client.

### 2. Set Up Environment Variables

#### Server Environment (.env)
```bash
# Copy the example file
cp server/env.example server/.env
```

Then edit `server/.env` with your database credentials:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration - UPDATE THESE
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# JWT Configuration - CHANGE THIS IN PRODUCTION
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Client Environment (.env)
```bash
# Copy the example file
cp client/env.example client/.env
```

The client `.env` file should work with defaults for local development:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Set Up Database

Make sure PostgreSQL is running and accessible with the credentials you specified in `server/.env`.

```bash
cd server
npm run db:setup
npm run db:seed
```

This will:
- Create the necessary database tables
- Insert sample data (users, events, registrations)

### 4. Start the Application

```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend client (port 3000).

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Default Login Credentials

After running the seed script, you can log in with:

- **Admin**: admin@campus.edu / password123
- **Organizer**: organizer1@campus.edu / password123
- **Student**: student1@campus.edu / password123

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Verify the credentials in `server/.env`
- Check if the database `campus_events` exists
- Ensure the user has proper permissions

### Port Already in Use
- Change the PORT in `server/.env` if 5000 is taken
- Change the React port in `client/package.json` if 3000 is taken

### Dependencies Issues
- Delete `node_modules` folders and run `npm run install-all` again
- Make sure you have Node.js v16 or higher


## Next Steps

1. Log in with one of the default accounts
2. Create your own user account
3. Explore the different features based on your role
4. Create events (organizer/admin) or register for events (student)

Happy coding! 🚀
