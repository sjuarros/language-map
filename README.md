# Multi-City Language Mapping Platform

A web application that enables cities to document, visualize, and celebrate their linguistic diversity through interactive maps and comprehensive language data.

## Quick Start

### Prerequisites

- Node.js v18+
- Docker (for Supabase)
- Git

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start Supabase (uses custom ports 54331-54336)
npx supabase start

# 4. Start development server
npm run dev
```

Open http://localhost:3000

### Before Pushing Code

Run local CI checks to catch issues:

```bash
./scripts/local-ci.sh         # Full check (recommended)
./scripts/local-ci.sh --quick # Quick check (skip build)
```

**⚠️ IMPORTANT**: This project uses **custom Supabase ports (54331-54336)** to avoid conflicts with other projects. See the setup guide for details.

## Documentation

- **[Local Development Guide](./docs/local-development.md)** - Complete setup and troubleshooting
- **[CLAUDE.md](./CLAUDE.md)** - Quick reference for development
- **[Architecture](./docs/architecture.md)** - Technical architecture and database schema
- **[Design](./docs/design.md)** - UI/UX specifications
- **[Implementation Plan](./docs/implementation-plan.md)** - Development roadmap

## Technology Stack

- **Framework**: Next.js 15+ (App Router) with React 18+
- **Language**: TypeScript 5+
- **Database**: Supabase (PostgreSQL + PostGIS + Auth + RLS)
- **UI Components**: Shadcn/ui + Tailwind CSS + Radix UI
- **Maps**: Mapbox GL JS v3
- **i18n**: next-intl
- **State Management**: Zustand (UI), TanStack Query v5 (server state)
- **Testing**: Vitest (Unit/Component), Playwright (E2E)

## Key Features

- **Multi-City Support**: Each city runs an independent instance with shared infrastructure
- **Flexible Taxonomy**: Cities define their own language classification systems
- **Interactive Maps**: Visualize languages across neighborhoods and districts
- **Multilingual**: Full i18n support (endonyms preserved in original scripts)
- **AI-Powered**: Optional AI description generation and translation
- **Static Content**: Customizable page builder for educational content
- **User Roles**: Superuser, Admin, Operator, and Public access levels

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run type-check       # TypeScript validation
npm run lint             # ESLint validation

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:e2e         # End-to-end tests

# Database
npx supabase start       # Start local Supabase
npx supabase status      # Check status
npx supabase stop        # Stop Supabase
npx supabase db reset    # Reset database

# Build
npm run build            # Production build
npm start                # Run production build
```

## Supabase Local Instance

This project uses **custom ports** to allow running multiple Supabase instances:

| Service | Port | URL |
|---------|------|-----|
| API | 54331 | http://localhost:54331 |
| Database | 54332 | postgresql://localhost:54332 |
| Studio | 54333 | http://localhost:54333 |

See **[docs/local-development.md](./docs/local-development.md)** for complete port allocation and troubleshooting.

## Project Structure

```
language-map/
├── app/                          # Next.js App Router
│   └── [locale]/                 # Internationalized routes
│       └── [citySlug]/           # City-specific routes
├── components/                   # React components
├── lib/                         # Utilities and helpers
│   ├── database/                # Database client and types
│   ├── validation/              # Zod schemas
│   └── utils/                   # Utility functions
├── docs/                        # Documentation
│   ├── local-development.md     # Setup guide
│   ├── architecture.md          # Technical architecture
│   ├── design.md                # UI/UX design
│   └── implementation-plan.md   # Development roadmap
├── supabase/                    # Supabase configuration
│   ├── migrations/              # Database migrations
│   └── config.toml              # Supabase config (custom ports)
└── tests/                       # E2E tests
```

## Contributing

See [docs/processes/development-workflow.md](./docs/processes/development-workflow.md) for development guidelines.

## License

[License details to be added]
