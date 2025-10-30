---
title: Local Development Setup
description: Guide for setting up and running the Multi-City Language Map project locally
category: development
tags: [development, local, supabase, environment, setup]
---

# Local Development Setup

This guide covers setting up your local development environment for the Multi-City Language Mapping Platform.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: Required for Supabase local instance
- **Git**: For version control

Check your versions:
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
docker --version
```

---

## Supabase Local Instance

This project uses a local Supabase instance with **custom ports** to avoid conflicts with other projects running Supabase locally.

### Port Allocation

⚠️ **IMPORTANT**: We use ports **54331-54336** instead of the default **54321-54324** to allow running multiple Supabase instances simultaneously.

| Service | Port | Default | URL | Description |
|---------|------|---------|-----|-------------|
| **API (PostgREST)** | 54331 | 54321 | http://localhost:54331 | REST API endpoint |
| **Database (PostgreSQL)** | 54332 | 54322 | postgresql://localhost:54332 | PostgreSQL database |
| **Studio** | 54333 | 54323 | http://localhost:54333 | Supabase Studio UI |
| **Inbucket (Email)** | 54334 | 54324 | http://localhost:54334 | Email testing UI |
| **SMTP** | 54335 | 54325 | localhost:54335 | SMTP server for emails |
| **POP3** | 54336 | 54326 | localhost:54336 | POP3 server for emails |

The port configuration is defined in `supabase/config.toml`.

### First-Time Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd language-map
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```

4. **Start Supabase** (this will download Docker images on first run):
   ```bash
   npx supabase start
   ```

   This command will:
   - Pull required Docker images (first time only)
   - Start all Supabase services
   - Run database migrations
   - Display connection credentials

5. **Verify Supabase is running**:
   ```bash
   npx supabase status
   ```

   Expected output:
   ```
   supabase local development setup is running.

         API URL: http://localhost:54331
          DB URL: postgresql://postgres:postgres@localhost:54332/postgres
      Studio URL: http://localhost:54333
    Inbucket URL: http://localhost:54334
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

6. **Update `.env.local`** with the keys from `supabase status`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase status>
   ```

7. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

8. **Open the application**:
   - Application: http://localhost:3001
   - Supabase Studio: http://localhost:54333

---

## Daily Development Workflow

### Starting Development

```bash
# 1. Check if Supabase is already running
npx supabase status

# 2. If not running, start Supabase
npx supabase start

# 3. Start Next.js dev server
npm run dev
```

⚠️ **CRITICAL**: The Next.js dev server is configured to run continuously on port 3000. **DO NOT** run `npm run dev` manually if it's already running. If you need to restart it, ask to restart it manually.

### Stopping Development

```bash
# Stop Next.js dev server
# Press Ctrl+C in the terminal running npm run dev

# Stop Supabase (optional - can leave running)
npx supabase stop
```

**Note**: You can leave Supabase running between development sessions. It will persist data in Docker volumes.

---

## Environment Variables

### Required Variables

Your `.env.local` file should contain:

```bash
# Supabase Local Instance (Custom Ports: 54331-54336)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:54332/postgres

# Supabase Studio (for reference)
SUPABASE_STUDIO_URL=http://localhost:54333

# Mapbox (optional - only needed for map features)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# AI Features (optional)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Environment Files

- **`.env.example`**: Template with all required variables (committed to git)
- **`.env.local`**: Your local environment variables (ignored by git)
- **`.env.test`**: Test environment variables (optional)

**Never commit `.env.local` to git!** It contains sensitive keys.

---

## Database Management

### Viewing Data

**Option 1: Supabase Studio (Recommended)**
- Open http://localhost:54333
- Navigate to "Table Editor" to view and edit data
- Navigate to "SQL Editor" to run queries

**Option 2: Command Line**
```bash
# Connect to PostgreSQL
npx supabase db psql

# Example queries
SELECT * FROM cities;
SELECT * FROM languages LIMIT 10;
\dt  # List all tables
\q   # Quit
```

### Running Migrations

```bash
# Check migration status
npx supabase migration list

# Apply all pending migrations
npx supabase db push

# Create a new migration
npx supabase migration new <migration_name>
```

### Resetting the Database

⚠️ **WARNING**: This will delete ALL local data!

```bash
# Reset database to initial state
npx supabase db reset

# This will:
# 1. Drop all tables
# 2. Re-run all migrations
# 3. Run seed data (if configured)
```

### Seeding Test Data

```bash
# Run seed script (if configured)
npm run db:seed

# Or manually via SQL
npx supabase db psql < ./seed.sql
```

---

## Common Development Commands

### Project Commands

```bash
# Install dependencies
npm install

# Start development server (DO NOT RUN IF ALREADY RUNNING)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint -- --fix  # Auto-fix issues

# Testing
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:e2e       # End-to-end tests

# Build
npm run build
npm start              # Run production build
```

### Supabase Commands

```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# Check status
npx supabase status

# View logs
npx supabase logs

# Reset database
npx supabase db reset

# Generate TypeScript types from database
npx supabase gen types typescript --local > lib/database.types.ts

# Access PostgreSQL shell
npx supabase db psql

# Create migration
npx supabase migration new <name>

# Apply migrations
npx supabase db push
```

### Docker Commands (Advanced)

```bash
# List Supabase containers
docker ps | grep supabase

# View container logs
docker logs supabase_db_language-map

# Stop all Supabase containers
docker stop $(docker ps -q --filter "name=supabase")

# Remove Supabase volumes (nuclear option - deletes all data)
docker volume ls | grep supabase
docker volume rm <volume_name>
```

---

## Troubleshooting

### Port Conflicts

**Problem**: "Port already in use" error when starting Supabase

**Solution**:
```bash
# Check what's using the ports
lsof -i :54331  # API
lsof -i :54332  # Database
lsof -i :54333  # Studio

# Stop other Supabase instances
cd /path/to/other/project
npx supabase stop

# Or kill the process using the port
kill -9 <PID>
```

### Supabase Won't Start

**Problem**: Supabase fails to start or shows errors

**Solutions**:
```bash
# 1. Check Docker is running
docker ps

# 2. Stop and restart Supabase
npx supabase stop
npx supabase start

# 3. Clean restart (WARNING: deletes data)
npx supabase db reset

# 4. Check logs for errors
npx supabase logs
```

### Database Connection Errors

**Problem**: Cannot connect to database from Next.js

**Solutions**:
1. Verify Supabase is running: `npx supabase status`
2. Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and keys
3. Verify URL uses port **54331** (not 54321)
4. Restart Next.js dev server

### Environment Variables Not Loaded

**Problem**: `NEXT_PUBLIC_*` variables are undefined

**Solutions**:
1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Restart Next.js dev server after changing `.env.local`
3. Clear Next.js cache: `rm -rf .next`

### Type Errors After Database Changes

**Problem**: TypeScript errors after changing database schema

**Solution**:
```bash
# Regenerate TypeScript types from database
npx supabase gen types typescript --local > lib/database.types.ts

# Run type check
npm run type-check
```

### Docker Out of Space

**Problem**: Docker runs out of disk space

**Solution**:
```bash
# Clean up unused Docker resources
docker system prune -a

# Remove old Supabase volumes
docker volume ls | grep supabase
docker volume prune
```

---

## Multiple Supabase Instances

If you're running multiple projects with Supabase locally:

### Port Allocation Strategy

| Project | API | Database | Studio | Inbucket |
|---------|-----|----------|--------|----------|
| **Project 1** | 54321 | 54322 | 54323 | 54324 |
| **Language Map** | 54331 | 54332 | 54333 | 54334 |
| **Project 3** | 54341 | 54342 | 54343 | 54344 |

### Running Multiple Instances

```bash
# Terminal 1 - Project 1
cd /path/to/project1
npx supabase start  # Uses ports 54321-54324

# Terminal 2 - Language Map
cd /path/to/language-map
npx supabase start  # Uses ports 54331-54336

# Both instances run simultaneously without conflicts
```

### Switching Between Projects

```bash
# Option 1: Leave both running (if you have resources)
# Just switch directories and both work

# Option 2: Stop/start as needed (saves resources)
cd /path/to/project1
npx supabase stop

cd /path/to/language-map
npx supabase start
```

---

## Database Schema Overview

For detailed schema documentation, see:
- **[docs/architecture.md](./architecture.md)** - Complete database schema
- **Supabase Studio**: http://localhost:54333 - Visual schema explorer

### Key Tables

- **`cities`**: Multi-city instances
- **`languages`**: Language catalog (endonyms are NOT translated)
- **`language_translations`**: Translated metadata about languages
- **`taxonomy_types`**: Flexible classification system (per city)
- **`taxonomy_values`**: Classification values
- **`user_profiles`**: User accounts
- **`city_users`**: Multi-city access junction table

### Row-Level Security (RLS)

All tables use RLS policies to enforce multi-tenancy:
- Users can only access cities they have permission for
- Superusers can access all cities
- Public users can view published content only

Test RLS policies in Supabase Studio → Authentication → Policies

---

## Performance Tips

### Development Performance

1. **Keep Supabase running**: Don't stop/start frequently to avoid Docker overhead
2. **Use Turbopack**: Next.js 15+ includes faster compilation (enabled by default)
3. **Disable unnecessary features**: Comment out unused middleware
4. **Limit hot reload scope**: Only edit one file at a time when possible

### Database Performance

1. **Use indexes**: Migrations include necessary indexes
2. **Limit query scope**: Always filter by `city_id` when possible
3. **Use Supabase client**: It handles connection pooling automatically
4. **Monitor queries**: Check "Performance" in Supabase Studio

---

## Useful Links

- **Application**: http://localhost:3001
- **Supabase Studio**: http://localhost:54333
- **Email Testing**: http://localhost:54334
- **API Docs**: http://localhost:54331/rest/v1/

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Project Documentation

- [Architecture](./architecture.md) - Technical architecture and database schema
- [Design](./design.md) - UI/UX design specifications
- [Implementation Plan](./implementation-plan.md) - Development roadmap
- [CLAUDE.md](../CLAUDE.md) - Quick reference for AI-assisted development

---

## Getting Help

### Check Status First

```bash
# Is everything running?
npx supabase status  # Supabase services
lsof -i :3000        # Next.js dev server

# Check logs
npx supabase logs    # Supabase logs
# Next.js logs appear in the terminal running npm run dev
```

### Common Issues & Solutions

1. **Port conflicts** → See [Port Conflicts](#port-conflicts) section
2. **Database errors** → See [Database Connection Errors](#database-connection-errors)
3. **Environment variables** → See [Environment Variables Not Loaded](#environment-variables-not-loaded)
4. **Docker issues** → Restart Docker Desktop

### Still Having Issues?

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review recent changes in git: `git log --oneline`
3. Try a clean restart:
   ```bash
   npx supabase stop
   rm -rf .next
   npm run dev
   npx supabase start
   ```

---

**Last Updated**: 2025-10-30
