# Phase 1: Foundation & i18n

**Timeline:** Weeks 1-3 (Days 1-16)
**Status:** Not Started

## Overview

This phase establishes the foundational infrastructure for the multi-city language mapping platform, including database setup, authentication, internationalization, and basic layouts.

## Key Deliverables

- ✅ Multi-city infrastructure with i18n support
- ✅ Users can sign up and access multiple cities
- ✅ Database abstraction layer for future multi-database support
- ✅ Row-Level Security (RLS) policies for multi-city access
- ✅ Locale routing and translation infrastructure

## Weekly Breakdown

### Week 1 - Database & i18n Setup
- Next.js 15+ + TypeScript + next-intl setup
- Supabase configuration and core schema
- Database abstraction layer (`getDatabaseClient(citySlug)`)
- Translation tables with AI tracking fields
- Geographic hierarchy (districts, neighborhoods)
- Reference data seeding (regions, countries, Amsterdam)

### Week 2 - Auth & Multi-City Permissions
- RLS policies for multi-city access
- Security testing with multiple scenarios
- Supabase Auth setup (magic link)
- User invitation system with city_users junction
- Route protection middleware

### Week 3 - Layouts & City Management
- i18n-aware layouts and locale routing
- Translation message files (en.json, nl.json, fr.json)
- Superuser panel - city creation with translations
- Admin panel - city selector for multi-city users
- Operator panel - city selector
- End-to-end testing of auth flows and i18n

## Critical Components

### Database Tables Created
- `locales`
- `world_regions`, `countries`, `cities`
- `city_locales`, `city_translations`
- `districts`, `neighborhoods` (with translations)
- `user_profiles`, `city_users`
- All translation tables with AI tracking fields

### Key Features Implemented
- Database abstraction layer
- Multi-city user access via junction table
- Locale routing (`/[locale]/[citySlug]`)
- Role-based access control (superuser/admin/operator)

## Documentation

Keep track of:
- Database schema decisions and migrations
- RLS policy implementations
- Authentication flow diagrams
- i18n routing patterns
- Multi-city access control logic
- Lessons learned and gotchas

## Dependencies

- Next.js 15+
- Supabase (PostgreSQL + Auth)
- next-intl
- TypeScript 5+

## Next Phase

Phase 2 will build on this foundation to add geographic hierarchy management, flexible taxonomies, and language data CRUD operations.
