# Clean Architecture Backend

A clean architecture backend built with Hono, PostgreSQL, Redis, and Prisma ORM.

## Tech Stack

- **Framework**: Hono (Fast web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Language**: TypeScript
- **Validation**: Zod

## Architecture

This project follows clean architecture principles with the following layers:

```
src/
├── domain/                 # Business logic
│   ├── entities/          # Domain entities
│   ├── repositories/      # Repository interfaces
│   └── services/          # Domain services
├── infrastructure/        # External dependencies
│   ├── database/         # Database configuration
│   ├── redis/            # Redis configuration
│   ├── repositories/     # Repository implementations
│   └── di/               # Dependency injection
├── application/          # Application logic
│   └── controllers/      # API controllers
└── index.ts             # Application entry point
```

## Setup

1. Install dependencies:

```bash
npm install
# or
bun install
```

2. Install and start PostgreSQL:

```bash
# macOS
brew install postgresql
brew services start postgresql
createdb clean_architecture_db

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb clean_architecture_db

# Windows
# Download and install PostgreSQL from postgresql.org
```

3. Install and start Redis (no password required):

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows
# Download Redis for Windows or use WSL
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
# Redis URL should be: redis://localhost:6379 (no password)
```

5. Quick database setup (auto-create and seed):

```bash
npm run db:setup
# or
bun run db:setup
```

6. Start the development server:

```bash
npm run dev
# or
bun dev
```

**Note**: The application will automatically initialize the database and seed sample data on startup if needed.

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/author/:authorId` - Get posts by author
- `POST /api/posts` - Create a post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post

### Emails

- `POST /api/emails/send` - Send custom email
- `POST /api/emails/welcome` - Send welcome email
- `POST /api/emails/password-reset` - Send password reset email
- `GET /api/emails/queue/status` - Get email queue status
- `GET /api/emails/queue/stats` - Get email queue statistics

### Documentation

- `GET /swagger` - Interactive Swagger UI
- `GET /doc` - OpenAPI JSON specification

## Database Schema

The application uses two main entities:

- **Users**: Basic user information with email and name
- **Posts**: Blog posts with title, content, and published status

## Features

- **Clean Architecture**: Separation of concerns with clear layer boundaries
- **Type Safety**: Full TypeScript support with Zod validation
- **Database**: PostgreSQL with Prisma ORM and auto-migration
- **Caching**: Redis caching for improved performance
- **Email Service**: SMTP email with background processing
- **Background Jobs**: Redis-based job queue with retry logic
- **Cron Jobs**: Scheduled tasks for maintenance and reporting
- **Error Handling**: Centralized error handling with custom error codes
- **Dependency Injection**: Simple DI container for managing dependencies
- **API Documentation**: Interactive Swagger UI with OpenAPI 3.0 specification
- **Import Aliases**: Clean imports with TypeScript path mapping

## Development

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (no migrations)
- `npm run db:reset` - Reset database and re-run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:setup` - Complete database setup (generate + push + seed)

## Database Features

### Auto-Setup on Startup

- **Database Connection**: Automatically connects and checks health
- **Schema Validation**: Ensures database schema is up to date
- **Sample Data**: Automatically seeds initial data if database is empty
- **Graceful Fallback**: App starts even if database is not ready

### Sample Data

When the database is empty, the app automatically creates:

- **Admin User**: `admin@example.com`
- **Regular User**: `user@example.com`
- **Sample Posts**: 3 example posts with different statuses

### Health Monitoring

- **Database Health**: Connection status and record counts
- **Redis Health**: Connection status and latency
- **Job Queue**: Pending, processing, completed, and failed jobs
- **Email Service**: SMTP connection status and delivery tracking
- **Cron Jobs**: Scheduled task execution status
- **Startup Logs**: Detailed initialization status

## Email Configuration

### SMTP Setup

The application supports SMTP email delivery with background processing:

```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="Clean Architecture API"
SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Admin Email for Alerts and Reports
ADMIN_EMAIL="admin@yourdomain.com"
```

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for this application
3. Use the app password in `SMTP_PASS`

### Email Templates

The application includes pre-built email templates:

- **Welcome Email**: Sent when users register
- **Password Reset**: For password recovery flows
- **Post Notifications**: When new posts are published
- **System Alerts**: Health check failures and system issues

## Background Processing

### Job Queue

- **Redis-based**: Uses Redis for job storage and processing
- **Priority Levels**: High, medium, and low priority jobs
- **Retry Logic**: Exponential backoff for failed jobs
- **Job Tracking**: Monitor job status and history

### Scheduled Tasks

- **Health Checks**: Every 5 minutes - monitors all services
- **Database Cleanup**: Daily at 2 AM - removes old job records
- **Cache Cleanup**: Every 6 hours - monitors Redis performance
- **Daily Reports**: 9 AM daily - sends system statistics
- **Weekly Maintenance**: Sunday 3 AM - extended cleanup tasks

### Cron Expressions

```javascript
// Common schedules
EVERY_MINUTE: "* * * * *";
EVERY_5_MINUTES: "*/5 * * * *";
EVERY_HOUR: "0 * * * *";
DAILY_AT_MIDNIGHT: "0 0 * * *";
WEEKLY_ON_SUNDAY: "0 0 * * 0";
```
