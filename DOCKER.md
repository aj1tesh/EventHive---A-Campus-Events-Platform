# Docker Setup

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

```bash
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend | 5000 | Node.js API server |
| Database | 5432 | PostgreSQL database |

## Environment Variables

```env
POSTGRES_DB=eventhive
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
JWT_SECRET=your-secret-key
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose build

# Database access
docker-compose exec postgres psql -U postgres -d eventhive

# Backend shell
docker-compose exec backend sh
```

## Database

The database initializes automatically with the schema from `server/database/init.sql`.

To seed with sample data:
```bash
docker-compose exec backend npm run db:seed
```

## Troubleshooting

**Port conflicts**: Change ports in `docker-compose.yml`

**Database issues**: Check `docker-compose logs postgres`

**Build issues**: Run `docker-compose build --no-cache`