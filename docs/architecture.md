---
title: Technical Architecture
description: Technical architecture, database schema, security, and performance considerations for the Multi-City Language Mapping Platform
category: architecture
tags: [architecture, database, security, performance, technical-specs]
---

# Technical Architecture

**Version:** 3.1
**Date:** October 29, 2025

---

## Table of Contents

1. [**⚠️ CRITICAL: Database Instance Configuration**](#-critical-database-instance-configuration)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [**Working with Supabase CLI**](#working-with-supabase-cli)
5. [Multi-Database Strategy](#multi-database-strategy)
6. [Database Schema](#database-schema)
7. [Row-Level Security (RLS)](#row-level-security-rls)
8. [Database Indexes](#database-indexes)
9. [URL Structure](#url-structure)
10. [Authentication & Authorization](#authentication--authorization)
11. [Performance Optimization](#performance-optimization)
12. [Security Considerations](#security-considerations)

---

## ⚠️ CRITICAL: Database Instance Configuration

### Supabase Instance Information

**Container Name**: `supabase_db_language-map`
**Instance Type**: Custom local development instance
**Ports**: 54331-54336 (NON-STANDARD PORTS)

### Port Configuration

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 54331 | http://localhost:54331 |
| PostgreSQL | 54332 | localhost:54332 |
| Studio (DB UI) | 54333 | http://localhost:54333 |
| Inbucket (Email) | 54334 | http://localhost:54334 |
| PostgREST | 54335 | http://localhost:54335 |
| Realtime | 54336 | ws://localhost:54336 |

### ⚠️ CRITICAL WARNING

**DO NOT USE** the default Supabase instance (`supabase_db_supabase`):
- Default instance runs on ports 54321-54324
- Belongs to a different project
- **Using the wrong instance can corrupt the other project's database!**

### Verifying Correct Instance

```bash
# Check if the correct instance is running
docker ps | grep supabase_db_language-map

# Should show something like:
# CONTAINER ID   IMAGE                  COMMAND                  PORTS
# abc123def456   supabase/postgres      "docker-entrypoint.s…"   0.0.0.0:54332->5432/tcp
#                                       0.0.0.0:54331->54321/tcp
```

### Environment Variables

**⚠️ IMPORTANT**: All environment variables must point to the correct ports:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:postgres@localhost:54332/postgres
```

**DO NOT USE**: URLs with ports 54321-54324 (wrong instance!)

---

## Technology Stack

### Core Stack

```typescript
// Frontend + Backend Framework
Next.js 15+ (App Router) // React Server Components + Server Actions
React 18+                // UI library
TypeScript 5+            // Type safety

// Database + Backend Services
Supabase                // PostgreSQL + Auth + Storage + Edge Functions
PostGIS                 // PostgreSQL extension for geospatial data
Prisma (optional)       // ORM for complex queries

// UI Components (NOT Material-UI!)
Shadcn/ui              // Modern component library (copy components)
Tailwind CSS           // Utility-first CSS
Radix UI               // Headless UI primitives (accessible)
Lucide Icons           // Icon library

// Internationalization (i18n)
next-intl              // Next.js i18n library
@formatjs/intl-locale  // Locale data

// Forms & Validation
React Hook Form        // Form management
Zod                    // Schema validation (runtime + TypeScript)

// Maps
Mapbox GL JS v3        // Map rendering
react-map-gl v7        // React wrapper
@mapbox/mapbox-gl-draw // Drawing tools for adding points

// State Management
Zustand                // Lightweight client state (UI state)
TanStack Query v5      // Server state (data fetching, caching)

// Data Tables (for admin UI)
TanStack Table v8      // Headless table component
@tanstack/react-table  // React bindings

// AI Integration
openai                 // OpenAI API for description generation
anthropic              // Alternative: Claude API

// Testing
Vitest                 // Unit tests (Vite-powered Jest alternative)
Playwright             // E2E tests
@testing-library/react // Component testing

// DevOps & Monitoring
Vercel                 // Hosting (recommended)
GitHub Actions         // CI/CD
Sentry                 // Error tracking
Vercel Analytics       // Web analytics (optional)
```

### Why This Stack?

**Next.js 15+ App Router**:
- ✅ Server Components (faster, better SEO)
- ✅ Server Actions (no separate API routes needed)
- ✅ Streaming (progressive loading)
- ✅ Built-in optimizations (code splitting, image optimization)
- ✅ File-based routing (intuitive structure)

**Supabase**:
- ✅ PostgreSQL with PostGIS (powerful geospatial queries)
- ✅ Built-in Auth + RLS (security by default)
- ✅ Real-time subscriptions (live updates)
- ✅ Edge Functions (serverless backend logic)
- ✅ Storage for images/assets
- ✅ Auto-generated REST & GraphQL APIs
- ✅ Free tier: 500MB DB, 50K MAUs, 2GB file storage

**Shadcn/ui over Material-UI**:
- ✅ Lightweight (copy components, not entire library)
- ✅ Works perfectly with Server Components
- ✅ Fully customizable with Tailwind
- ✅ Modern, beautiful defaults
- ✅ Accessible (built on Radix UI)
- ✅ No "framework lock-in"
- ❌ Material-UI: heavyweight, React Server Component issues, dated design

**TanStack Query v5**:
- ✅ Best-in-class data fetching
- ✅ Automatic caching & background updates
- ✅ Optimistic updates
- ✅ SSR support with hydration

---

## Database Architecture

> ⚠️ **IMPORTANT**: Before working with the database, read the [Database Instance Configuration](#-critical-database-instance-configuration) section above to ensure you're using the correct Supabase instance (`supabase_db_language-map`).

### Multi-Tenancy Model

The platform uses **Row-Level Security (RLS)** for multi-city isolation in a shared database, with abstraction layer support for future dedicated databases.

**Current Architecture** (MVP):
```
┌─────────────────────────────────────┐
│   Single Supabase Project           │
│                                      │
│  ├─ Amsterdam data (RLS isolation)  │
│  ├─ Paris data (RLS isolation)      │
│  └─ Berlin data (RLS isolation)     │
└─────────────────────────────────────┘
```

**Future Architecture** (Optional):
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Supabase EU      │  │ Supabase US      │  │ Supabase Asia    │
│ Amsterdam, Paris │  │ NYC, Toronto     │  │ Tokyo (dedicated)│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Working with Supabase CLI

### ⚠️ CRITICAL: Verify Instance Before Running Commands

**Before running ANY Supabase CLI command**, verify you're using the correct instance:

```bash
# ✅ CORRECT: Check for supabase_db_language-map
docker ps | grep supabase_db_language-map

# ❌ WRONG: If you see supabase_db_supabase, you're on the wrong instance!
docker ps | grep supabase_db_supabase
```

### Common Commands

#### Start Supabase
```bash
# ✅ Start the correct instance (supabase_db_language-map)
npx supabase start

# ⚠️ This will start containers on ports 54331-54336
# Verify with: docker ps | grep 5433
```

#### Check Status
```bash
# Shows which instance is running and on which ports
npx supabase status

# Expected output should show ports 54331-54336, NOT 54321-54324
# API URL: http://127.0.0.1:54331
# DB URL: postgresql://postgres:postgres@127.0.0.1:54332
# Studio URL: http://127.0.0.1:54333
```

#### Link Project
```bash
# ⚠️ CRITICAL: Verify you're linking the correct instance
npx supabase link --project-ref your-project-ref

# The project-ref should be for supabase_db_language-map
# Never link to the project that belongs to supabase_db_supabase
```

#### Reset Database
```bash
# ⚠️ DANGER: This will reset the database
# Only run this if you're sure you're on the correct instance!
npx supabase db reset

# Always verify first with: docker ps | grep supabase_db_language-map
```

#### Run Migrations
```bash
# ⚠️ CRITICAL: Verify instance before running migrations
# Wrong instance = corrupted data in the other project!

# Create migration
npx supabase migration new your_migration_name

# Apply migration
npx supabase db push

# ⚠️ Always verify with: npx supabase status
```

### Environment Setup

**Before starting development, ensure your `.env.local` contains:**

```env
# ⚠️ CRITICAL: Verify these point to ports 54331-54332
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
DATABASE_URL=postgresql://postgres:postgres@localhost:54332
```

**Never use these (wrong instance):**
```env
# ❌ WRONG: These point to the default instance (supabase_db_supabase)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
DATABASE_URL=postgresql://postgres:postgres@localhost:54322
```

### Troubleshooting

**Problem**: "Database connection refused"
**Solution**: Check if supabase_db_language-map is running
```bash
docker ps | grep supabase_db_language-map
# If not running: npx supabase start
```

**Problem**: "Migration failed on wrong database"
**Solution**: You probably ran commands on the wrong instance!
```bash
# Always verify before running destructive commands
docker ps | grep supabase
# Check the container name and ports carefully!
```

---

## Multi-Database Strategy

### The Problem

**Current plan**: Single shared Supabase database with RLS policies
- All cities' data in one database
- RLS policies ensure data isolation
- **Concern**: Cities don't control their data infrastructure

**City concerns**:
1. **Data sovereignty** - "Our data must stay in our country"
2. **Control** - "We want full database access for our own analytics"
3. **Compliance** - "GDPR requires data in EU datacenters"
4. **Trust** - "We don't want to share infrastructure with other cities"
5. **Exit strategy** - "What if we want to self-host later?"

### Architecture Options

#### **Option 1: Single Shared Database (Current Plan)**

```
┌─────────────────────────────────────┐
│   Single Supabase Project           │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  PostgreSQL Database           │ │
│  │                                │ │
│  │  ├─ Amsterdam data (RLS)      │ │
│  │  ├─ Paris data (RLS)          │ │
│  │  ├─ Berlin data (RLS)         │ │
│  │  └─ Tokyo data (RLS)          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Simplest to implement
- ✅ Lowest cost (one Supabase project)
- ✅ Easy user management across cities
- ✅ Platform-wide analytics easy
- ✅ Centralized backups

**Cons**:
- ❌ All data in one place
- ❌ No data sovereignty
- ❌ Cities can't self-host
- ❌ Single point of failure
- ❌ One datacenter location

---

#### **Option 2: Database-Per-City (Full Isolation)**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Supabase EU-1    │  │ Supabase US-1    │  │ Supabase Asia-1  │
│                  │  │                  │  │                  │
│ Amsterdam DB     │  │ Toronto DB       │  │ Tokyo DB         │
│ Paris DB         │  │ NYC DB           │  │ Seoul DB         │
│ Berlin DB        │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Pros**:
- ✅ Full data sovereignty per city
- ✅ Geographic data residency
- ✅ Each city can self-host or export
- ✅ Failure isolation (one city down doesn't affect others)
- ✅ Independent scaling per city

**Cons**:
- ❌ Complex to manage (N databases)
- ❌ Higher costs (N Supabase projects)
- ❌ User management nightmare (cross-city users)
- ❌ Platform analytics requires federation
- ❌ Schema migrations need N deployments

---

#### **Option 3: Database-Per-Region (Grouped Isolation)**

```
┌────────────────────────────┐  ┌────────────────────────────┐
│ Supabase Europe            │  │ Supabase North America     │
│                            │  │                            │
│  ├─ Amsterdam              │  │  ├─ Toronto                │
│  ├─ Paris                  │  │  ├─ NYC                    │
│  ├─ Berlin                 │  │  └─ SF                     │
│  └─ London                 │  │                            │
└────────────────────────────┘  └────────────────────────────┘
```

**Pros**:
- ✅ Better data sovereignty than Option 1
- ✅ Regional compliance (GDPR in EU)
- ✅ Fewer databases than Option 2
- ✅ Regional performance optimization

**Cons**:
- ❌ Still complex (3-5 databases)
- ❌ Cities in same region share DB
- ❌ User management still complex
- ❌ Not as flexible as Option 2

---

#### **Option 4: Hybrid (Smart Routing)**

```
┌─────────────────────────────────────┐
│   Platform Configuration            │
│                                      │
│   City Database Assignments:        │
│   ├─ Amsterdam → EU Shared DB       │
│   ├─ Paris → EU Shared DB           │
│   ├─ Tokyo → Dedicated DB (paid)    │
│   ├─ NYC → Dedicated DB (paid)      │
│   └─ Berlin → Self-hosted           │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Flexible per-city choice
- ✅ Small cities share (cheaper)
- ✅ Large cities get dedicated (sovereignty)
- ✅ Self-hosting possible
- ✅ Future-proof

**Cons**:
- ❌ Most complex to implement
- ❌ Multiple code paths
- ❌ Testing complexity

---

### Recommendation

#### **Phase 1 (MVP - Weeks 1-14)**: Single Shared Database ✅

**Benefits**:
- ✅ Fast MVP launch (12-14 weeks)
- ✅ Lower initial costs ($25/month base)
- ✅ Simpler development and debugging
- ✅ Centralized user management
- ✅ Easy platform-wide analytics

#### **Phase 9 (Post-MVP - Optional)**: Multi-Database Support ✅

**Benefits**:
- ✅ Data sovereignty per city/region
- ✅ GDPR compliance (data residency)
- ✅ Exit strategy (cities can export/self-host)
- ✅ Failure isolation
- ✅ Premium revenue opportunity

---

### Database Abstraction Layer (Critical!)

To enable future migration without rewriting app code, implement routing layer from day 1:

```typescript
// lib/database/client.ts

import { createClient } from '@supabase/supabase-js'

// Database configuration per city (environment-based)
interface DatabaseConfig {
  url: string
  anonKey: string
  region?: string
}

const cityDatabaseConfig: Record<string, DatabaseConfig> = {
  amsterdam: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    region: 'eu-west-1',
  },
  paris: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    region: 'eu-west-1',
  },
  tokyo: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    region: 'eu-west-1',
  },
  // Future: Point to different databases
  // tokyo: {
  //   url: process.env.SUPABASE_ASIA_URL!,
  //   anonKey: process.env.SUPABASE_ASIA_ANON_KEY!,
  //   region: 'ap-northeast-1',
  // },
}

// Factory function - all app code uses this
export function getDatabaseClient(citySlug: string) {
  const config = cityDatabaseConfig[citySlug]

  if (!config) {
    throw new Error(`No database configuration for city: ${citySlug}`)
  }

  return createClient(config.url, config.anonKey)
}

// Server-only client with service role (for admin operations)
export function getDatabaseAdminClient(citySlug: string) {
  const config = cityDatabaseConfig[citySlug]

  if (!config) {
    throw new Error(`No database configuration for city: ${citySlug}`)
  }

  return createClient(
    config.url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Usage in app code** (works with both shared and separate databases):

```typescript
// app/[locale]/[city]/api/languages/route.ts
import { getDatabaseClient } from '@/lib/database/client'

export async function GET(
  request: Request,
  { params }: { params: { city: string; locale: string } }
) {
  // Router determines correct database
  const supabase = getDatabaseClient(params.city)

  const { data, error } = await supabase
    .from('languages')
    .select(`
      id, endonym,
      translations:language_translations!inner(name)
    `)
    .eq('city_id', cityId)  // Shared DB: filters by city
    .eq('translations.locale', params.locale)

  // Future with separate DBs: Remove city_id filter
  // (entire database is one city)

  return Response.json(data)
}
```

---

### Cost Analysis

#### **Single Shared Database**
```
1 Supabase Pro project: $25/month
Database size: 8GB (all cities)
Total: $25/month base + usage
```

#### **Database-Per-Region (3 regions)**
```
3 Supabase Pro projects: $75/month
Database sizes: 3GB + 3GB + 2GB
Total: $75/month base + usage
```

#### **Database-Per-City (10 cities)**
```
10 Supabase Pro projects: $250/month
Or: 5 Free tier + 5 Pro = $125/month
Total: $125-250/month base + usage
```

#### **Hybrid (Small cities share, large cities dedicated)**
```
1 Shared DB (5 small cities): $25/month
3 Dedicated DBs (Tokyo, NYC, London): $75/month
Total: $100/month base + usage
```

---

### Monetization Opportunity

- **Free/Basic**: Shared database (up to 3 cities)
- **Pro ($99/mo)**: Regional database (GDPR compliant)
- **Enterprise ($499/mo)**: Dedicated database or self-hosted option

---

### Migration Path

When a city demands a dedicated database:

1. Spin up new Supabase project
2. Run schema migrations on new database
3. Export city data from shared database
4. Import to dedicated database
5. Update `cityDatabaseConfig` environment variables
6. Zero-downtime switchover via routing change
7. Monitor for 24h, then clean up old data

---

## Database Schema

### Core Tables with i18n Support

```sql
-- ============================================
-- LOCALIZATION TABLES
-- ============================================

-- Supported locales for the platform
CREATE TABLE locales (
  code TEXT PRIMARY KEY,                   -- 'en', 'nl', 'fr', 'de', 'es', etc.
  name_english TEXT NOT NULL,              -- 'English', 'Dutch', 'French'
  name_native TEXT NOT NULL,               -- 'English', 'Nederlands', 'Français'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default locales
INSERT INTO locales (code, name_english, name_native) VALUES
  ('en', 'English', 'English'),
  ('nl', 'Dutch', 'Nederlands'),
  ('fr', 'French', 'Français'),
  ('de', 'German', 'Deutsch'),
  ('es', 'Spanish', 'Español');

-- ============================================
-- GEOGRAPHIC HIERARCHY
-- ============================================

-- World Regions (continents/macro-regions)
CREATE TABLE world_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,               -- 'europe', 'asia', 'africa', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- World Region Translations
CREATE TABLE world_region_translations (
  world_region_id UUID NOT NULL REFERENCES world_regions(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (world_region_id, locale)
);

-- Countries
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_region_id UUID NOT NULL REFERENCES world_regions(id),
  iso_code_2 TEXT UNIQUE NOT NULL,         -- 'NL', 'FR', 'US', etc. (ISO 3166-1 alpha-2)
  iso_code_3 TEXT UNIQUE NOT NULL,         -- 'NLD', 'FRA', 'USA', etc. (ISO 3166-1 alpha-3)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Country Translations
CREATE TABLE country_translations (
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (country_id, locale)
);

-- Cities (tenants)
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id),
  slug TEXT UNIQUE NOT NULL,               -- 'amsterdam', 'paris', etc.
  default_locale TEXT NOT NULL REFERENCES locales(code),

  -- Map configuration
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  default_zoom INTEGER NOT NULL DEFAULT 10,
  mapbox_style TEXT NOT NULL,

  -- Customization
  primary_color TEXT NOT NULL DEFAULT '#1976d2',
  secondary_color TEXT,
  logo_url TEXT,
  custom_domain TEXT,

  -- AI Translation Configuration
  ai_translation_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_translation_provider TEXT CHECK (ai_translation_provider IN ('openai', 'anthropic', 'custom')),
  ai_translation_model TEXT,               -- 'gpt-4', 'claude-3-opus', etc.
  ai_translation_api_key_encrypted TEXT,   -- Encrypted API key

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id)
);

-- City Locales (which locales are available per city)
CREATE TABLE city_locales (
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city_id, locale)
);

-- City Translations
CREATE TABLE city_translations (
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  description TEXT,                        -- Optional city description

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (city_id, locale)
);

-- Districts (within cities)
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city_id, slug)
);

-- District Translations
CREATE TABLE district_translations (
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (district_id, locale)
);

-- Neighborhoods (within districts)
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(district_id, slug)
);

-- Neighborhood Translations
CREATE TABLE neighborhood_translations (
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (neighborhood_id, locale)
);

-- ============================================
-- USER MANAGEMENT (MULTI-CITY ACCESS)
-- ============================================

-- Users (with three-tier hierarchy)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superuser', 'admin', 'operator')),
  preferred_locale TEXT REFERENCES locales(code) DEFAULT 'en',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Many-to-many: Users can access multiple cities
CREATE TABLE city_users (
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES user_profiles(id),
  PRIMARY KEY (city_id, user_id)
);

-- ============================================
-- LANGUAGE DATA
-- ============================================

-- Language Families
CREATE TABLE language_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Language Family Translations
CREATE TABLE language_family_translations (
  family_id UUID NOT NULL REFERENCES language_families(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (family_id, locale)
);

-- Languages
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,

  iso_639_3_code TEXT,                     -- ISO 639-3 code (3 letters)
  endonym TEXT,                            -- Native name (NOT translated - same in all locales)
  language_family_id UUID REFERENCES language_families(id),
  country_of_origin_id UUID REFERENCES countries(id),

  -- Classification via flexible taxonomy system (no hardcoded fields)
  -- Use language_taxonomies table to assign Size, Status, etc.
  speaker_count INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Language Translations (name only - endonym is not translated!)
CREATE TABLE language_translations (
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,                      -- Translated language name (e.g., EN: "Japanese", NL: "Japans", FR: "Japonais")

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,                           -- Model used for translation
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (language_id, locale)
);

-- Language Data Points (locations where language is spoken)
CREATE TABLE language_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id),

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  postal_code TEXT,

  -- Details
  community_name TEXT,
  -- Size classification moved to language_taxonomies (flexible per city)
  notes TEXT,

  -- Geometry (for PostGIS spatial queries)
  geom GEOMETRY(Point, 4326),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  -- Ensure coordinates are valid
  CONSTRAINT valid_coordinates CHECK (
    latitude BETWEEN -90 AND 90 AND
    longitude BETWEEN -180 AND 180
  )
);

-- ============================================
-- DESCRIPTIONS (MULTI-LINGUAL)
-- ============================================

-- Descriptions (community stories)
CREATE TABLE descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id),

  -- AI generation tracking
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,                           -- 'gpt-4', 'claude-3-opus', etc.
  ai_generated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Description Translations
CREATE TABLE description_translations (
  description_id UUID NOT NULL REFERENCES descriptions(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  text TEXT NOT NULL,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (description_id, locale)
);

-- ============================================
-- AI DESCRIPTION GENERATION
-- ============================================

-- AI Source Lists (whitelist/blacklist per city)
CREATE TABLE ai_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                       -- Domain or full URL
  list_type TEXT NOT NULL CHECK (list_type IN ('whitelist', 'blacklist')),
  notes TEXT,                              -- Why whitelisted/blacklisted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  UNIQUE(city_id, url, list_type)
);

-- AI Generation Log
CREATE TABLE ai_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  description_id UUID REFERENCES descriptions(id),

  model TEXT NOT NULL,                     -- 'gpt-4-turbo', 'claude-3-opus'
  prompt TEXT NOT NULL,
  sources_used TEXT[],                     -- Array of URLs used
  token_count INTEGER,
  cost_usd DECIMAL(10, 4),

  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'rejected')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- ============================================
-- FLEXIBLE TAXONOMY SYSTEM
-- ============================================

-- Taxonomy Types (e.g., "Size", "Status", "Script Type")
CREATE TABLE taxonomy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- 'size', 'status', 'script-type'

  is_required BOOLEAN NOT NULL DEFAULT false,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  use_for_filtering BOOLEAN NOT NULL DEFAULT true,
  use_for_map_styling BOOLEAN NOT NULL DEFAULT false,

  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(city_id, slug)
);

-- Taxonomy Type Translations
CREATE TABLE taxonomy_type_translations (
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  description TEXT,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (taxonomy_type_id, locale)
);

-- Taxonomy Values
CREATE TABLE taxonomy_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,

  -- Visual styling
  color_hex TEXT,
  icon_name TEXT,
  icon_size_multiplier DECIMAL(3,2) DEFAULT 1.0,

  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(taxonomy_type_id, slug)
);

-- Taxonomy Value Translations
CREATE TABLE taxonomy_value_translations (
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  description TEXT,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (taxonomy_value_id, locale)
);

-- Language to Taxonomy Assignment
CREATE TABLE language_taxonomies (
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,

  notes TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id),

  PRIMARY KEY (language_id, taxonomy_value_id)
);

CREATE INDEX idx_language_taxonomies_value ON language_taxonomies(taxonomy_value_id);
CREATE INDEX idx_language_taxonomies_language ON language_taxonomies(language_id);

-- ============================================
-- STATIC CONTENT MANAGEMENT SYSTEM
-- ============================================

-- Static Pages
CREATE TABLE static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- 'about', 'methodology', 'team'
  template TEXT NOT NULL DEFAULT 'default',

  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  meta_image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  UNIQUE(city_id, slug)
);

-- Static Page Translations
CREATE TABLE static_page_translations (
  static_page_id UUID NOT NULL REFERENCES static_pages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),

  title TEXT NOT NULL,
  meta_description TEXT,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (static_page_id, locale)
);

-- Page Sections
CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  static_page_id UUID NOT NULL REFERENCES static_pages(id) ON DELETE CASCADE,

  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero', 'text', 'image', 'gallery', 'video',
    'team', 'partners', 'stats', 'cta', 'accordion', 'divider'
  )),

  display_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page Section Translations
CREATE TABLE page_section_translations (
  page_section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),

  content JSONB NOT NULL DEFAULT '{}',

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (page_section_id, locale)
);

-- City Assets
CREATE TABLE city_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,

  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'logo', 'hero_image', 'page_image', 'partner_logo', 'team_photo', 'icon', 'document'
  )),

  storage_bucket TEXT NOT NULL DEFAULT 'city-assets',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_city_assets_city ON city_assets(city_id);
CREATE INDEX idx_city_assets_type ON city_assets(city_id, asset_type);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  action TEXT NOT NULL,                    -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EXTENSIONS & TRIGGERS
-- ============================================

-- Create PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Trigger to automatically populate geom from lat/lng
CREATE OR REPLACE FUNCTION update_geom_from_coords()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER language_points_geom_trigger
  BEFORE INSERT OR UPDATE ON language_points
  FOR EACH ROW
  EXECUTE FUNCTION update_geom_from_coords();
```

---

## Row-Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### Cities Table Policies

```sql
-- Public can read active cities
CREATE POLICY "Anyone can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

-- Superusers can do anything with cities
CREATE POLICY "Superusers can manage cities"
  ON cities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );
```

### User Profiles Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Superusers can view and manage all users
CREATE POLICY "Superusers can manage all users"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Admins can view and manage users in their cities
CREATE POLICY "Admins can manage users in their cities"
  ON user_profiles FOR SELECT
  USING (
    id IN (
      SELECT cu.user_id
      FROM city_users cu
      WHERE cu.city_id IN (
        SELECT city_id FROM city_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
```

### City Users Table Policies (Multi-City Access)

```sql
-- Users can view their own city access
CREATE POLICY "Users can view own city access"
  ON city_users FOR SELECT
  USING (user_id = auth.uid());

-- Superusers can manage all city access
CREATE POLICY "Superusers can manage city access"
  ON city_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Admins can manage access for their cities
CREATE POLICY "Admins can manage their city access"
  ON city_users FOR ALL
  USING (
    city_id IN (
      SELECT city_id FROM city_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Languages Table Policies

```sql
-- Public can read all languages (for map display)
CREATE POLICY "Anyone can view languages"
  ON languages FOR SELECT
  USING (true);

-- Users can manage languages in cities they have access to
CREATE POLICY "City users can manage city languages"
  ON languages FOR ALL
  USING (
    -- Superusers can manage all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    -- Users with city access can manage
    city_id IN (
      SELECT city_id FROM city_users WHERE user_id = auth.uid()
    )
  );
```

### Language Points Table Policies

```sql
-- Public can read all language points (for map display)
CREATE POLICY "Anyone can view language points"
  ON language_points FOR SELECT
  USING (true);

-- Users can manage points in cities they have access to
CREATE POLICY "City users can manage city points"
  ON language_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    city_id IN (
      SELECT city_id FROM city_users WHERE user_id = auth.uid()
    )
  );
```

### Descriptions Table Policies

```sql
-- Public can read all descriptions
CREATE POLICY "Anyone can view descriptions"
  ON descriptions FOR SELECT
  USING (true);

-- Users can manage descriptions in cities they have access to
CREATE POLICY "City users can manage city descriptions"
  ON descriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    city_id IN (
      SELECT city_id FROM city_users WHERE user_id = auth.uid()
    )
  );
```

### AI Sources Table Policies

```sql
-- Admins can view AI sources for their cities
CREATE POLICY "Admins can view city AI sources"
  ON ai_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    city_id IN (
      SELECT city_id FROM city_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage AI sources for their cities
CREATE POLICY "Admins can manage city AI sources"
  ON ai_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    city_id IN (
      SELECT city_id FROM city_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Audit Logs Table Policies

```sql
-- Users can view logs related to their actions
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all logs for their cities
CREATE POLICY "Admins can view city audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
    OR
    city_id IN (
      SELECT city_id FROM city_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only system can insert audit logs (via trigger)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
```

---

## Database Indexes

### Geospatial Indexes

```sql
-- CRITICAL for map performance!
CREATE INDEX idx_language_points_geom ON language_points USING GIST (geom);
```

### Translation Indexes (i18n lookups)

```sql
CREATE INDEX idx_world_region_translations_locale ON world_region_translations(locale);
CREATE INDEX idx_country_translations_locale ON country_translations(locale);
CREATE INDEX idx_city_translations_locale ON city_translations(locale);
CREATE INDEX idx_district_translations_locale ON district_translations(locale);
CREATE INDEX idx_neighborhood_translations_locale ON neighborhood_translations(locale);
CREATE INDEX idx_language_translations_locale ON language_translations(locale);
CREATE INDEX idx_language_family_translations_locale ON language_family_translations(locale);
CREATE INDEX idx_description_translations_locale ON description_translations(locale);

-- AI translation tracking indexes
CREATE INDEX idx_world_region_translations_ai ON world_region_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_country_translations_ai ON country_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_city_translations_ai ON city_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_district_translations_ai ON district_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_neighborhood_translations_ai ON neighborhood_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_language_translations_ai ON language_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_language_family_translations_ai ON language_family_translations(is_ai_translated) WHERE is_ai_translated = true;
CREATE INDEX idx_description_translations_ai ON description_translations(is_ai_translated) WHERE is_ai_translated = true;

-- Translation review status indexes
CREATE INDEX idx_language_translations_review ON language_translations(reviewed_by, reviewed_at);
CREATE INDEX idx_description_translations_review ON description_translations(reviewed_by, reviewed_at);

-- City locale configuration
CREATE INDEX idx_city_locales_city ON city_locales(city_id);
CREATE INDEX idx_city_locales_enabled ON city_locales(is_enabled) WHERE is_enabled = true;

-- Full-text search on translated language names
CREATE INDEX idx_language_translations_name_search ON language_translations
  USING GIN (to_tsvector('english', name));
```

### Geographic Hierarchy Indexes

```sql
CREATE INDEX idx_countries_world_region ON countries(world_region_id);
CREATE INDEX idx_cities_country ON cities(country_id);
CREATE INDEX idx_districts_city ON districts(city_id);
CREATE INDEX idx_neighborhoods_district ON neighborhoods(district_id);
CREATE INDEX idx_language_points_neighborhood ON language_points(neighborhood_id);
```

### City-Based Queries

```sql
CREATE INDEX idx_languages_city ON languages(city_id);
CREATE INDEX idx_language_points_city ON language_points(city_id);
CREATE INDEX idx_descriptions_city ON descriptions(city_id);
CREATE INDEX idx_ai_sources_city ON ai_sources(city_id);
CREATE INDEX idx_ai_generation_log_city ON ai_generation_log(city_id);
```

### Language Lookups

```sql
CREATE INDEX idx_language_points_language ON language_points(language_id);
CREATE INDEX idx_descriptions_language ON descriptions(language_id);
CREATE INDEX idx_languages_family ON languages(language_family_id);
CREATE INDEX idx_languages_country_origin ON languages(country_of_origin_id);
```

### User & Permissions

```sql
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_city_users_city ON city_users(city_id);
CREATE INDEX idx_city_users_user ON city_users(user_id);
CREATE INDEX idx_city_users_role ON city_users(role);

-- Composite index for permission checks
CREATE INDEX idx_city_users_user_city ON city_users(user_id, city_id);
```

### AI Generation

```sql
CREATE INDEX idx_descriptions_ai_generated ON descriptions(is_ai_generated);
CREATE INDEX idx_descriptions_reviewed ON descriptions(reviewed_by, reviewed_at);
CREATE INDEX idx_ai_generation_log_language ON ai_generation_log(language_id);
CREATE INDEX idx_ai_generation_log_status ON ai_generation_log(status);
CREATE INDEX idx_ai_sources_list_type ON ai_sources(list_type);
```

### Audit Logs

```sql
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_city ON audit_logs(city_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
```

### Lookup Performance

```sql
-- ISO codes for language/country lookups
CREATE INDEX idx_languages_iso_code ON languages(iso_639_3_code);
CREATE INDEX idx_countries_iso_2 ON countries(iso_code_2);
CREATE INDEX idx_countries_iso_3 ON countries(iso_code_3);
```

---

## URL Structure

### Multi-City Support with i18n

The platform supports both **single-city** and **multi-city** views using path-based routing with locale prefixes.

#### **Option A: Path-based** (Recommended)

**Single City Views**:
```
language-map.org/en/amsterdam              → Amsterdam (English UI)
language-map.org/nl/amsterdam              → Amsterdam (Dutch UI)
language-map.org/fr/paris                  → Paris (French UI)
language-map.org/en/operator/amsterdam     → Amsterdam operator dashboard (English)
language-map.org/en/admin/amsterdam        → Amsterdam admin panel (English)
language-map.org/en/superuser              → Superuser global dashboard
```

**Multi-City Views** (query parameters):
```
language-map.org/en/map?cities=amsterdam,paris
  → Combined map showing both Amsterdam and Paris data (English UI)

language-map.org/nl/map?cities=amsterdam,paris,berlin
  → Combined map showing three cities (Dutch UI)

language-map.org/en/amsterdam?compare=paris
  → Amsterdam map with Paris comparison overlay

language-map.org/en/europe?region=western-europe
  → All cities in Western Europe (requires region metadata)
```

**Static Pages**:
```
language-map.org/en/amsterdam/about        → About page (English)
language-map.org/nl/amsterdam/about        → About page (Dutch)
language-map.org/fr/paris/methodology      → Methodology page (French)
```

**Pros**:
- ✅ Simpler DNS setup (one domain)
- ✅ Easier to develop locally
- ✅ Single deployment
- ✅ Multi-city views via query params
- ✅ i18n with locale prefix
- ✅ SEO-friendly
- ❌ Slightly longer URLs

#### **Option B: Subdomain**

```
amsterdam.language-map.org              → Amsterdam public map
en.amsterdam.language-map.org           → Amsterdam (English UI)
nl.amsterdam.language-map.org           → Amsterdam (Dutch UI)
paris.language-map.org                  → Paris public map
map.language-map.org?cities=amsterdam,paris → Multi-city view
```

**Pros**:
- ✅ Cleaner separation
- ✅ Easier for custom domains later
- ❌ More complex DNS setup
- ❌ Subdomain wildcard SSL certificate needed
- ❌ More complex multi-city routing
- ❌ More complex i18n routing

**Recommendation**: Start with **Option A (path-based)** with locale prefix. Much simpler for solo development and more flexible.

---

## Authentication & Authorization

### Three-Tier User Hierarchy with Multi-City Access

```
Superuser (platform owner)
  ├─ Can create cities
  ├─ Can access ALL cities (platform-wide)
  ├─ Can grant/revoke access to any city for any user
  ├─ Can promote/demote any user
  ├─ Platform-wide configuration
  └─ Override all RLS policies

City Admin
  ├─ Can access MULTIPLE cities (as granted)
  ├─ Can invite/manage users for their assigned cities
  ├─ Can configure city settings for their cities
  ├─ Can manage city branding
  ├─ Can manage AI source lists for their cities
  ├─ View city analytics
  └─ Has all operator permissions for their cities

Operator
  ├─ Can access MULTIPLE cities (as granted)
  ├─ Can CRUD language data for their assigned cities
  ├─ Can import/export data
  ├─ Can preview map
  ├─ View own activity log
  └─ Cannot manage users or settings
```

### Authentication Flow

```
1. Superuser creates city in panel
2. Superuser or Admin invites user via email, grants city access
3. User receives magic link
4. User signs up with Supabase Auth
5. Profile created with role (no city_id - multi-city!)
6. city_users junction table stores city access grants
7. RLS policies check city_users table for permissions
```

### Middleware Implementation

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  // Protect all /operator, /admin, /superuser routes
  if (request.nextUrl.pathname.match(/^\/(operator|admin|superuser)/)) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, city_id, cities(slug)')
      .eq('id', session.user.id)
      .single()

    // Check role permissions
    const path = request.nextUrl.pathname
    const citySlug = path.match(/\/(operator|admin)\/([^\/]+)/)?[2]

    // Superuser can access everything
    if (profile.role === 'superuser') {
      return response
    }

    // Admin can access their city's operator and admin panels
    if (profile.role === 'admin') {
      if (path.startsWith('/superuser')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      if (citySlug && profile.cities.slug !== citySlug) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      return response
    }

    // Operator can only access their city's operator panel
    if (profile.role === 'operator') {
      if (path.startsWith('/admin') || path.startsWith('/superuser')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      if (citySlug && profile.cities.slug !== citySlug) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      return response
    }
  }

  return response
}
```

---

## Performance Optimization

### Caching Strategy

```
Layer 1 (Browser): React Query cache (5 min)
Layer 2 (Edge): Vercel Edge cache (5 min, stale-while-revalidate)
Layer 3 (Database): Supabase connection pooling
Layer 4 (CDN): Mapbox tile cache (automatic)
```

### Next.js Optimizations

```typescript
// app/[city]/page.tsx - Static generation for city pages
export async function generateStaticParams() {
  const supabase = createClient()
  const { data: cities } = await supabase
    .from('cities')
    .select('slug')
    .eq('is_active', true)

  return cities.map(city => ({ city: city.slug }))
}

// Revalidate every hour
export const revalidate = 3600
```

### Map Performance

**Dynamic GeoJSON Approach** (no custom tilesets needed):

```typescript
// app/[city]/api/geojson/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { city: string } }
) {
  const supabase = createClient()

  // Query points with language data
  const { data: points, error } = await supabase
    .from('language_points')
    .select(`
      id,
      latitude,
      longitude,
      neighborhood,
      community_name,
      size,
      language:languages (
        id,
        name,
        endonym,
        language_family,
        endangerment_status
      )
    `)
    .eq('cities.slug', params.city)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Convert to GeoJSON
  const geojson = {
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      id: point.id,
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      },
      properties: {
        languageId: point.language.id,
        languageName: point.language.name,
        endonym: point.language.endonym,
        family: point.language.language_family,
        status: point.language.endangerment_status,
        neighborhood: point.neighborhood,
        communityName: point.community_name,
        size: point.size,
      }
    }))
  }

  // Cache for 5 minutes
  return Response.json(geojson, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
```

---

## Security Considerations

### Shared Database (RLS)
- RLS policies prevent cross-city access
- **Risk**: Policy bug could leak data
- **Mitigation**: Extensive RLS testing

### Separate Databases
- Physical isolation (no policy bugs possible)
- **Risk**: More attack surface (N databases)
- **Mitigation**: Centralized monitoring

### API Key Security
- AI API keys encrypted at rest
- Never exposed to client-side code
- Stored in Supabase with encryption
- Accessed only via server-side functions

### Input Validation
- Zod schema validation on all forms
- Server-side validation in Server Actions
- SQL injection protection via Supabase parameterized queries
- XSS protection via React's automatic escaping

### CORS & CSP
- Configure Content Security Policy headers
- Restrict API access to authorized domains
- Rate limiting on sensitive endpoints

---

**Document Status**: Complete technical architecture specification
**Next Document**: design.md (UI/UX design specifications)

