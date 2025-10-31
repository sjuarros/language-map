---
title: Implementation Plan
description: 70-day development roadmap with day-by-day tasks organized into 9 implementation phases
category: product
tags: [implementation, roadmap, planning, development, timeline]
---

# Implementation Plan

**Version:** 3.1
**Date:** October 29, 2025
**Timeline:** 16-19 weeks (70 days)

---

## Table of Contents

1. [Overview](#overview)
2. [Development Phases](#development-phases)
3. [Data Import Strategy](#data-import-strategy)
4. [Testing Strategy](#testing-strategy)
5. [Deployment Plan](#deployment-plan)
6. [Risk Mitigation](#risk-mitigation)
7. [Solo Development Optimizations](#solo-development-optimizations)
8. [Next Steps](#next-steps)

---

## Overview

### Timeline Summary

- **Total Duration**: 16-19 weeks (70 days)
- **Developer**: Solo (one person)
- **Launch Target**: Amsterdam as pilot city
- **Key Milestones**:
  - Week 3: Foundation complete
  - Week 6: Operator CRUD complete
  - Week 9: Public map complete
  - Week 12: Admin features complete
  - Week 15: Amsterdam data imported
  - Week 16-19: Testing & launch

### Adjusted Timeline Rationale

**Extended from 8-10 weeks to 16-19 weeks because**:
- Added full i18n infrastructure (database + frontend)
- Added flexible taxonomy system (replaces hardcoded enums)
- Added static content management system (page builder)
- Added AI description generation with source management
- Added AI-assisted translation with review workflow
- Added geographic hierarchy (districts, neighborhoods)
- Added multi-city views and comparison features
- Solo development (no team parallelization)

---

## Development Phases

### **Phase 1: Foundation & i18n (Weeks 1-3)**

**Goal**: Database, auth, i18n infrastructure, basic layouts

#### **Week 1 - Database & i18n Setup**

- [x] **Day 1**: Set up Next.js 15+ + TypeScript + next-intl ✅
  - Initialize project with App Router
  - Configure TypeScript
  - Install and configure next-intl
  - Set up basic folder structure
  - **Completed:** October 30, 2025

- [x] **Day 2**: Configure Supabase, create core database schema ✅
  - Create Supabase project
  - Create locales table and seed data (en, nl, fr)
  - Create world_regions, countries, cities tables
  - Create city_locales, city_translations tables
  - **Completed:** October 30, 2025
  - **Files:**
    - `supabase/migrations/20251030000000_create_core_schema.sql`
    - `supabase/seed.sql`

- [x] **Day 3**: **Build database abstraction layer** ✅
  - Create `lib/database/client.ts`
  - Implement `getDatabaseClient(citySlug)` factory function
  - Implement `getDatabaseAdminClient(citySlug)` for admin operations
  - Test abstraction layer with multiple cities
  - **Completed:** October 30, 2025
  - **Files:**
    - `lib/database/client.ts` (abstraction layer with caching)
    - `lib/database/client.test.ts` (22 tests)
    - `scripts/test-db-setup.ts` (database verification)

- [x] **Day 4**: Create translation tables ✅
  - Create world_region_translations
  - Create country_translations
  - Create city_translations
  - Add AI tracking fields to all translation tables
  - **Completed:** October 30, 2025
  - **Features:**
    - All translation tables created in initial schema
    - AI tracking fields: is_ai_translated, ai_model, ai_translated_at
    - Review workflow: reviewed_by, reviewed_at
    - Indexes for performance

- [x] **Day 5**: Create geographic hierarchy ✅
  - Create districts table and district_translations
  - Create neighborhoods table and neighborhood_translations
  - Add foreign key relationships
  - **Completed:** October 30, 2025
  - **Files:**
    - `supabase/migrations/20251030000001_create_geographic_hierarchy.sql`
    - All tables include AI tracking and translation support
    - RLS policies enabled

- [x] **Day 6**: Seed reference data ✅
  - Seed world regions (Europe, Asia, Africa, etc.) in EN/NL/FR
  - Seed countries with ISO codes in EN/NL/FR (France, Germany, US added)
  - Create Amsterdam city record with translations (completed)
  - Create Amsterdam districts and neighborhoods
  - **Completed:** October 30, 2025
  - **Files:**
    - `supabase/seed-geographic.sql`
    - **Amsterdam Districts:** 7 districts (Centrum, West, Nieuw-West, Zuid, Oost, Noord, Zuidoost)
    - **Amsterdam Neighborhoods:** 5 neighborhoods (Jordaan, De Pijp, Vondelpark, Oostelijk Havengebied, Amsterdam-Noord)
    - **Translations:** All districts and neighborhoods in EN/NL/FR

#### **Week 2 - Auth & Multi-City Permissions**

- [x] **Day 7**: Implement RLS policies for multi-city access ✅
  - Enable RLS on all tables
  - Create policies for cities table
  - Create policies for user_profiles table
  - Create policies for city_users table (multi-city access)
  - **Completed:** October 30, 2025
  - **Files:**
    - `supabase/migrations/20251030000002_create_user_management.sql`
    - `supabase/seed-users.sql`
  - **Features:**
    - User profiles with role-based access (superuser/admin/operator)
    - City_users junction table for multi-city access
    - Helper functions: is_superuser(), has_city_access(), is_city_admin()
    - Comprehensive RLS policies for all tables
    - Automatic user profile creation on signup
    - **Test Users:** 4 test users created with different access levels

- [x] **Day 7.5**: Initialize and Start Supabase Database ⭐ **CRITICAL STEP**
  - Start Supabase local instance on custom ports (54331-54336)
  - Apply all database migrations (20251030000000, 20251030000001, 20251030000002)
  - Load seed data (seed.sql, seed-geographic.sql, seed-users.sql)
  - Update `.env.local` with Supabase credentials
  - Verify database is running and accessible
  - **Completed:** October 30, 2025
  - **Commands:**
    - `npx supabase start`
    - `npx supabase db push`
    - `npx supabase db seed`
    - `npx supabase status`

- [x] **Day 8**: Test RLS security with multiple scenarios ✅
  - Test superuser access
  - Test admin access to single city
  - Test admin access to multiple cities
  - Test operator access
  - Test cross-city data isolation
  - **Completed:** October 30, 2025
  - **Files:**
    - `__tests__/security/rls.test.ts` (28 comprehensive tests)
    - `.env.local` (test environment configuration)
    - `vitest.config.ts` (updated with dotenv)
  - **Features:**
    - Helper function tests (is_superuser, has_city_access, is_city_admin)
    - User profile and role verification
    - City access grants validation
    - Geographic hierarchy structure verification
    - Public access pattern testing
    - AI translation tracking verification
    - Database constraint validation
    - **Test Coverage:** All RLS policies and user roles

- [ ] **Day 9**: Set up Supabase Auth, create auth pages
  - Configure Supabase Auth (magic link)
  - Create login page (/login)
  - Create signup page (/signup)
  - Create logout functionality

- [ ] **Day 10**: User invitation system with city_users junction table
  - Create invitation email templates
  - Create invite user functionality
  - Implement user-to-city access grants
  - Test multi-city user creation

- [ ] **Day 11**: Middleware for route protection + multi-city checks
  - Create middleware.ts
  - Protect /operator, /admin, /superuser routes
  - Implement role-based access control
  - Test authorization flows

#### **Week 3 - Layouts & City Management**

- [ ] **Day 12**: Create i18n-aware layouts (locale routing)
  - Create app/[locale]/layout.tsx
  - Implement locale switching
  - Create translation message files (en.json, nl.json, fr.json)
  - Test locale routing

- [ ] **Day 13**: Superuser panel - city creation with translations
  - Create superuser dashboard
  - Create city creation form
  - Implement city translations (name, description)
  - Test city creation flow

- [ ] **Day 14**: Admin panel - city selector for multi-city users
  - Create admin dashboard layout
  - Implement city selector dropdown
  - Show user's accessible cities
  - Test multi-city navigation

- [ ] **Day 15**: Operator panel - city selector
  - Create operator dashboard layout
  - Implement city selector
  - Create overview stats
  - Test operator access

- [ ] **Day 16**: Test all authentication flows + i18n switching
  - End-to-end auth testing
  - Test locale switching
  - Test translation fallbacks
  - Fix any bugs

**Deliverable**: ✅ Multi-city infrastructure with i18n support, users can sign up and access multiple cities

---

### **Phase 2: Reference Data & Operator CRUD (Weeks 4-6)**

**Goal**: Geographic hierarchy, flexible taxonomies, and language data management

#### **Week 4 - Districts, Neighborhoods & Taxonomies**

- [ ] **Day 17-18**: District management UI (CRUD with translations)
  - Create district list page
  - Create district form (add/edit)
  - Implement district translations
  - Test district CRUD operations

- [ ] **Day 19**: Neighborhood management UI (CRUD with translations)
  - Create neighborhood list page
  - Create neighborhood form (add/edit, linked to districts)
  - Implement neighborhood translations
  - Test neighborhood CRUD operations

- [ ] **Day 20**: **Taxonomy types management**
  - Create taxonomy types list page
  - Create taxonomy type form (slug, config flags)
  - Implement taxonomy type translations
  - Test taxonomy type creation (e.g., "Size", "Status")

- [ ] **Day 21**: **Taxonomy values management**
  - Create taxonomy values list page (per type)
  - Create taxonomy value form (slug, color, icon, size multiplier)
  - Implement taxonomy value translations
  - Test taxonomy value creation with visual styling

#### **Week 5 - Languages with Flexible Classification**

- [ ] **Day 22**: Language family management (CRUD with translations)
  - Create language families list
  - Create language family form
  - Implement language family translations
  - Test language family CRUD

- [ ] **Day 23**: Language management - basic CRUD with taxonomy assignment UI
  - Create languages list page
  - Create language form (endonym, ISO code, family, origin)
  - Add taxonomy selector component (multi-select based on city's taxonomies)
  - Test language creation with taxonomy assignment

- [ ] **Day 24**: Language translations UI (add/edit names/endonyms per locale)
  - Create language translations page
  - Note: Endonym is NOT translated (universal field)
  - Implement translated name fields per locale
  - Test translation creation

- [ ] **Day 25**: Language points management (table view with neighborhood picker)
  - Create language points list
  - Create language point form (coordinates, neighborhood, community name)
  - Implement neighborhood picker
  - Test language point CRUD

- [ ] **Day 26**: **Test taxonomy filtering and map styling**
  - Test that taxonomies are properly assigned to languages
  - Verify taxonomy data is available for filtering
  - Verify taxonomy visual styling data is correct
  - Test queries for map rendering

#### **Week 6 - Descriptions**

- [ ] **Day 27**: Descriptions management (CRUD with translations)
  - Create descriptions list
  - Create description form (linked to language, neighborhood)
  - Test description creation

- [ ] **Day 28**: Description translations UI (multi-language text editor)
  - Create description translations editor
  - Implement rich text editor
  - Support multiple locales
  - Test translation creation

- [ ] **Day 29**: Test all operator CRUD flows
  - End-to-end testing of all CRUD operations
  - Test data validation
  - Test error handling
  - Fix bugs

**Deliverable**: ✅ Operators can manage geography, define custom taxonomies, and manage multilingual language data

---

### **Phase 3: Data Import & AI Generation (Week 7)**

**Goal**: CSV import and AI description generation

#### **Week 7**

- [ ] **Day 30-31**: CSV import (parse, validate, preview, import with taxonomy mapping)
  - Create CSV import page
  - Implement CSV parser
  - Implement data validation
  - Show preview table
  - Map CSV columns to taxonomy values
  - Implement bulk import
  - Test with sample data

- [ ] **Day 32**: AI sources management (whitelist/blacklist UI)
  - Create AI sources list page
  - Create AI source form (URL, list type, notes)
  - Test whitelist/blacklist management

- [ ] **Day 33**: AI description generation (OpenAI integration)
  - Implement OpenAI API integration
  - Create description generation form
  - Build prompt with source filtering
  - Log AI generation to ai_generation_log table
  - Test generation

- [ ] **Day 34**: AI review workflow (review, edit, approve AI descriptions)
  - Create AI-generated content review page
  - Show AI flag on descriptions
  - Allow editing of AI-generated content
  - Implement approval workflow
  - Test review process

**Deliverable**: ✅ Operators can import data and generate AI descriptions

---

### **Phase 4: Public Map with Translations (Weeks 8-9)**

**Goal**: User-facing multilingual map interface with dynamic taxonomy filtering

#### **Week 8 - Map Foundation**

- [ ] **Day 35**: **Reuse: Copy map assets from Amsterdam app**
  - Copy `/icons` folder to `/public/map-icons/` (6 SVG files)
  - Create map config file with Amsterdam constants:
    - Coordinates: `{ latitude: 52.3676, longitude: 4.9041 }`
    - Initial zoom: `11`, point zoom: `13`
    - Metro bounds: `[[4.728, 52.278], [5.079, 52.431]]`
  - Copy `useWindowResize` utility hook from reusable-code
  - Reference Amsterdam Mapbox custom styles (with Noto Sans fonts)

- [ ] **Day 36**: Mapbox integration, basic map display
  - Set up Mapbox account and token
  - Integrate react-map-gl v7
  - Create basic map component
  - Load city center and zoom settings from config
  - Test map rendering with Amsterdam bounds

- [ ] **Day 37**: Load language points from i18n-aware API
  - Create GeoJSON API endpoint (reference: `reusable-code/hooks-reference/hooks.tsx`)
  - Query language points with translations
  - Include taxonomy data in properties
  - Test data loading

- [ ] **Day 38**: **Reuse: Copy Mapbox icon/text configuration**
  - Copy icon sizing step function from `config.points.ts`
  - Copy text label configuration (font, sizing, anchoring)
  - Copy icon defaults and style overrides
  - Test icon rendering at various zoom levels

- [ ] **Day 39**: Clustering for performance
  - Enable Mapbox clustering (reference: map event handlers in reusable code)
  - Style cluster circles
  - Show cluster count
  - Implement cluster click-to-zoom
  - Test with large datasets

#### **Week 9 - Map Features & Dynamic Filters**

- [ ] **Day 40**: **Dynamic taxonomy filtering**
  - Fetch city's taxonomies
  - Generate filter UI dynamically (reference: `hooks.points.ts` createLayerStyles pattern)
  - Implement filter state management (use Zustand, not Context)
  - Apply filters to map data
  - Test filtering

- [ ] **Day 41**: **Map styling from taxonomies**
  - Generate Mapbox expressions from taxonomy colors
  - Generate size expressions from taxonomy size multipliers
  - Apply dynamic styling to map layers
  - Test visual styling

- [ ] **Day 42**: Search functionality (multi-language search)
  - Create search input
  - Implement search API (searches translated names)
  - Filter map by search results
  - Test search

- [ ] **Day 43**: **Reuse: Detail popups with translated descriptions**
  - Reference popup component structure from `MapPopup.tsx` pattern
  - Create popup component
  - Implement click handlers (reference: map interaction patterns)
  - Load language details on click
  - Show translated name, endonym, descriptions
  - Add hover cursor change (reference: onMouseEnter/Leave pattern)
  - Test popups

- [ ] **Day 44**: Language switcher and base layer toggle
  - Create locale switcher component
  - Implement locale change handler
  - Copy base layer toggle logic pattern (dark/light/none styles)
  - Use Amsterdam custom Mapbox styles with Noto Sans fonts
  - Test locale switching

- [ ] **Day 45**: Mobile responsive design
  - Implement responsive layout
  - Use `useWindowResize` hook for dynamic sizing
  - Use `isTouchEnabled()` for mobile optimizations
  - Test on mobile browsers
  - Fix mobile-specific issues

**Deliverable**: ✅ Public can explore multilingual map with city-specific filtering

**Reusable Code Used**:
- ✅ Map icons (6 SVG files)
- ✅ Amsterdam map constants (coordinates, zoom, bounds)
- ✅ Mapbox icon sizing configuration (step functions)
- ✅ Text label configuration
- ✅ Utility hooks (useWindowResize, isTouchEnabled)
- ✅ Map interaction patterns (click, hover, clustering)
- ✅ Custom Mapbox styles (dark/light/none with Noto Sans)

---

### **Phase 5: Static Content Management (Week 10)**

**Goal**: Built-in CMS for city-specific pages and content

#### **Week 10 - Page Builder**

- [ ] **Day 46-47**: Static pages management (create About, Methodology pages)
  - Create static pages list
  - Create static page form (slug, template, published status)
  - Implement page translations (title, meta description)
  - Test page creation

- [ ] **Day 48**: **Page section builder** (hero, text, image, gallery sections)
  - Create section types
  - Create section editor UI
  - Implement section reordering (drag & drop)
  - Add section, delete section functionality
  - Test section management

- [ ] **Day 49**: Page section translations UI
  - Create section translation editor
  - Different fields based on section type
  - Support JSON content structure
  - Test section translations

- [ ] **Day 50**: **Asset management** (upload logos, images to Supabase Storage)
  - Create asset upload component
  - Integrate with Supabase Storage
  - Store asset metadata in city_assets table
  - Create asset browser
  - Test uploads

- [ ] **Day 51**: Dynamic page rendering (render sections from database)
  - Create dynamic page route
  - Fetch page sections
  - Render sections using appropriate components
  - Test page rendering

**Deliverable**: ✅ Cities can customize About/Methodology pages with rich content

---

### **Phase 6: Multi-City Views & Comparison (Week 11)**

**Goal**: Support for viewing multiple cities simultaneously

#### **Week 11**

- [ ] **Day 52-53**: Multi-city query param parsing (?cities=amsterdam,paris)
  - Implement query param parsing
  - Validate city slugs
  - Load data from multiple cities
  - Test multi-city data loading

- [ ] **Day 54**: Combined map rendering with city color coding
  - Assign colors to cities
  - Render points with city-specific styling
  - Add city legend
  - Test combined rendering

- [ ] **Day 55**: Multi-city filters and legend
  - Implement multi-city filter UI
  - Show taxonomies from all cities
  - Combine filters intelligently
  - Test filtering across cities

- [ ] **Day 56**: City comparison mode (side-by-side stats)
  - Create comparison view
  - Show stats for each city
  - Highlight differences
  - Test comparison

- [ ] **Day 57**: SEO optimization (metadata, structured data, sitemap)
  - Add meta tags
  - Implement Open Graph tags
  - Generate sitemap.xml
  - Add structured data (JSON-LD)
  - Test SEO

**Deliverable**: ✅ Users can view and compare multiple cities

---

### **Phase 7: Admin Features & Branding (Week 12)**

**Goal**: Admin panel completion, branding, and multi-city user management

#### **Week 12**

- [ ] **Day 58-59**: Admin panel - multi-city user management UI
  - Create user list page
  - Create user invitation form
  - Implement city access grants (multi-select cities)
  - Show user's accessible cities
  - Test user management

- [ ] **Day 60**: City settings (name, coordinates, colors, default locale)
  - Create city settings page
  - General settings (name, country, slug)
  - Map settings (center, zoom, style)
  - Locale settings (default locale, enabled locales)
  - Test settings updates

- [ ] **Day 61**: **Advanced branding customization** (logo, colors, fonts, theme)
  - Create branding settings page
  - Logo upload (light & dark)
  - Color pickers (primary, secondary, accent)
  - Font selectors
  - Favicon upload
  - Test branding application

- [ ] **Day 62**: Grant/revoke city access for users
  - Implement grant access functionality
  - Implement revoke access functionality
  - Update city_users table
  - Test access management

- [ ] **Day 63**: Test all administrative functions
  - End-to-end admin testing
  - Test all CRUD operations
  - Test permissions
  - Fix bugs

**Deliverable**: ✅ Admins can fully configure cities, branding, and manage users

---

### **Phase 8: Amsterdam Data Import (Week 13)**

**Goal**: Import existing Amsterdam data with translations and taxonomies

#### **Week 13**

- [ ] **Day 64-65**: **Set up Amsterdam taxonomies**
  - Create "Size" taxonomy (Small/Medium/Large)
  - Add translations (EN/NL)
  - Set colors (#FFA500, #FFD700, #FF4500)
  - Set as required, map styling enabled
  - Create "Status" taxonomy (Endangered/Stable)
  - Add translations
  - Set colors (traffic light colors)
  - Test taxonomies

- [ ] **Day 66-67**: Import Amsterdam districts, neighborhoods, language data from Airtable
  - Write import script (scripts/import-amsterdam.ts)
  - Connect to Airtable API
  - Import districts and neighborhoods
  - Import language families
  - Import languages
  - Import language points
  - Import descriptions
  - Test import

- [ ] **Day 68**: **Assign taxonomy values** to all imported languages
  - Map Airtable "Size" field to taxonomy values
  - Map Airtable "Status" field to taxonomy values
  - Bulk assign taxonomies via language_taxonomies table
  - Verify all assignments
  - Test map rendering with taxonomies

- [ ] **Day 69**: Create English translations for all Amsterdam data
  - Generate English translations for all content
  - Districts, neighborhoods
  - Language names
  - Descriptions
  - Test English UI

- [ ] **Day 70**: Create Dutch translations for Amsterdam data (AI-assisted)
  - Configure Amsterdam AI translation settings
  - Bulk translate districts/neighborhoods to Dutch
  - Bulk translate language names to Dutch
  - Bulk translate descriptions to Dutch
  - Test Dutch UI

- [ ] **Day 71**: Manual review and corrections
  - Review AI-generated Dutch translations
  - Correct any errors or awkward translations
  - Mark translations as reviewed
  - Final verification

**Deliverable**: ✅ Amsterdam data fully imported with EN/NL translations and custom taxonomies

---

### **Phase 9: Testing, Polish & Launch (Weeks 14-15)**

**Goal**: Production-ready launch

#### **Week 14 - Testing**

- [ ] **Day 72-73**: E2E testing (Playwright) - all user flows + i18n + taxonomies
  - Write E2E tests for public map
  - Write E2E tests for operator flows
  - Write E2E tests for admin flows
  - Write E2E tests for superuser flows
  - Test i18n switching
  - Test taxonomy filtering
  - Test multi-city views
  - Run all tests and fix bugs

- [ ] **Day 74**: Performance optimization (Lighthouse audit)
  - Run Lighthouse audits
  - Optimize images
  - Optimize bundle size
  - Implement lazy loading
  - Improve caching
  - Test performance

- [ ] **Day 75**: Security audit (RLS policies, XSS, CSRF, i18n injection)
  - Review all RLS policies
  - Test cross-city data access
  - Test XSS vulnerabilities
  - Test CSRF protection
  - Test i18n injection attacks
  - Fix security issues

- [ ] **Day 76**: Error monitoring setup (Sentry)
  - Set up Sentry account
  - Integrate Sentry SDK
  - Test error reporting
  - Configure alerts

#### **Week 15 - Launch**

- [ ] **Day 77-78**: Documentation (user guides in EN/NL/FR, admin docs for taxonomies/CMS)
  - Write operator user guide
  - Write admin user guide
  - Write taxonomy system documentation
  - Write CMS documentation
  - Translate guides to NL/FR
  - Create video tutorials (optional)

- [ ] **Day 79**: Deploy to production (Vercel)
  - Configure production environment variables
  - Set up custom domain
  - Deploy to Vercel
  - Test production deployment
  - Monitor logs

- [ ] **Day 80-81**: Final testing with real users
  - Invite Amsterdam team to test
  - Gather feedback
  - Fix critical bugs
  - Make UI adjustments

- [ ] **Day 82**: Soft launch announcement
  - Announce to Amsterdam community
  - Share on social media
  - Send email to stakeholders
  - Monitor traffic

- [ ] **Day 83-84**: **Create Amsterdam About page** using CMS
  - Create About page with hero section
  - Add text sections with project description
  - Add team section with photos
  - Add partners section
  - Test page rendering
  - Publish page

- [ ] **Day 85-86**: Monitor feedback, bug fixes
  - Monitor Sentry for errors
  - Gather user feedback
  - Fix bugs
  - Make improvements
  - Celebrate launch! 🎉

**Deliverable**: ✅ Amsterdam live on new platform with full customization!

---

## Data Import Strategy

### From Amsterdam Airtable

```typescript
// scripts/import-amsterdam.ts
import Airtable from 'airtable'
import { createClient } from '@supabase/supabase-js'

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
const supabase = createClient(url, key)

async function importAmsterdam() {
  console.log('🚀 Starting Amsterdam data import...\n')

  // 1. Create city
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .insert({
      slug: 'amsterdam',
      name: 'Amsterdam',
      country: 'Netherlands',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      mapbox_style: 'mapbox://styles/mapbox/streets-v12',
      primary_color: '#1976d2',
    })
    .select()
    .single()

  console.log('✅ City created:', city.slug)

  // 2. Import languages
  const airtableLanguages = await airtable
    .base(AMSTERDAM_BASE_ID)('Language')
    .select()
    .all()

  const languages = airtableLanguages.map(record => ({
    city_id: city.id,
    name: record.get('Language'),
    endonym: record.get('Endonym'),
    iso_639_3_code: record.get('ISO Code'),
    language_family: record.get('Language Family'),
    world_region: record.get('World Region'),
    speaker_count: record.get('Size'),
  }))

  const { data: insertedLanguages } = await supabase
    .from('languages')
    .insert(languages)
    .select()

  console.log(`✅ Imported ${insertedLanguages.length} languages`)

  // 3. Import data points
  const airtableData = await airtable
    .base(AMSTERDAM_BASE_ID)('Data')
    .select()
    .all()

  const points = airtableData.map(record => ({
    city_id: city.id,
    language_id: findLanguageId(
      insertedLanguages,
      record.get('Language')
    ),
    latitude: record.get('Latitude'),
    longitude: record.get('Longitude'),
    neighborhood: record.get('Neighborhood'),
    district: record.get('County'),
    community_name: record.get('Community Name'),
    notes: record.get('Notes'),
  }))

  const { data: insertedPoints } = await supabase
    .from('language_points')
    .insert(points)
    .select()

  console.log(`✅ Imported ${insertedPoints.length} data points`)

  // 4. Import descriptions
  const airtableDescriptions = await airtable
    .base(AMSTERDAM_BASE_ID)('Descriptions')
    .select()
    .all()

  const descriptions = airtableDescriptions.map(record => ({
    city_id: city.id,
    language_id: findLanguageId(
      insertedLanguages,
      record.get('Language')
    ),
    neighborhood: record.get('Neighborhood'),
    district: record.get('District'),
    description: record.get('Description'),
  }))

  const { data: insertedDescriptions } = await supabase
    .from('descriptions')
    .insert(descriptions)
    .select()

  console.log(`✅ Imported ${insertedDescriptions.length} descriptions`)

  console.log('\n🎉 Amsterdam import complete!')
  console.log(`
    Summary:
    - 1 city created
    - ${insertedLanguages.length} languages
    - ${insertedPoints.length} data points
    - ${insertedDescriptions.length} descriptions
  `)
}

importAmsterdam()
```

### CSV Import for New Cities

```typescript
// app/operator/[city]/import/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { parseCSV, validateLanguageData } from '@/lib/import'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)

    // Parse CSV
    const parsed = await parseCSV(file)

    // Validate
    const { valid, errors } = validateLanguageData(parsed)

    setPreview(parsed.slice(0, 10)) // Show first 10 rows
    setErrors(errors)
  }

  async function handleImport() {
    // Server action to import data
    await importLanguageData(file)
    router.push('/operator/amsterdam/languages')
  }

  return (
    <div>
      <h1>Import Language Data</h1>

      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {preview.length > 0 && (
        <>
          <h2>Preview (first 10 rows)</h2>
          <table>
            {/* Display preview */}
          </table>

          {errors.length > 0 && (
            <div className="errors">
              <h3>Validation Errors</h3>
              <ul>
                {errors.map(error => <li>{error}</li>)}
              </ul>
            </div>
          )}

          {errors.length === 0 && (
            <Button onClick={handleImport}>
              Import {preview.length} languages
            </Button>
          )}
        </>
      )}
    </div>
  )
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// __tests__/lib/database/client.test.ts
import { describe, it, expect } from 'vitest'
import { getDatabaseClient } from '@/lib/database/client'

describe('getDatabaseClient', () => {
  it('should return a client for a valid city', () => {
    const client = getDatabaseClient('amsterdam')
    expect(client).toBeDefined()
  })

  it('should throw an error for an invalid city', () => {
    expect(() => getDatabaseClient('invalid-city')).toThrow()
  })
})
```

### E2E Tests (Playwright)

```typescript
// e2e/public-map.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Public Map', () => {
  test('should display the map', async ({ page }) => {
    await page.goto('/en/amsterdam')

    // Wait for map to load
    await page.waitForSelector('.mapboxgl-map')

    // Check that map is visible
    const map = await page.locator('.mapboxgl-map')
    await expect(map).toBeVisible()
  })

  test('should filter languages by taxonomy', async ({ page }) => {
    await page.goto('/en/amsterdam')

    // Click on "Small" filter
    await page.click('text=Small Community')

    // Verify that only small communities are shown
    // (implementation depends on your data)
  })

  test('should switch languages', async ({ page }) => {
    await page.goto('/en/amsterdam')

    // Click on language switcher
    await page.click('[aria-label="Language"]')
    await page.click('text=Nederlands')

    // Verify that URL changed to /nl/amsterdam
    await expect(page).toHaveURL('/nl/amsterdam')

    // Verify that UI is in Dutch
    await expect(page.locator('text=Talenkaart')).toBeVisible()
  })
})
```

### Security Testing

```typescript
// __tests__/security/rls.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Row-Level Security', () => {
  it('should prevent cross-city data access', async () => {
    // Create a user with access to Amsterdam only
    const user = await createTestUser({ cities: ['amsterdam'] })
    const client = createAuthenticatedClient(user)

    // Try to access Paris data
    const { data, error } = await client
      .from('languages')
      .select('*')
      .eq('city_id', 'paris-uuid')

    // Should return empty or error
    expect(data).toHaveLength(0)
  })

  it('should allow superuser to access all cities', async () => {
    const superuser = await createTestUser({ role: 'superuser' })
    const client = createAuthenticatedClient(superuser)

    // Access Amsterdam data
    const { data: amsterdamData } = await client
      .from('languages')
      .select('*')
      .eq('city_id', 'amsterdam-uuid')

    // Access Paris data
    const { data: parisData } = await client
      .from('languages')
      .select('*')
      .eq('city_id', 'paris-uuid')

    expect(amsterdamData).toBeDefined()
    expect(parisData).toBeDefined()
  })
})
```

---

## Deployment Plan

### Vercel Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link project to Vercel
vercel link

# 3. Set environment variables
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN production
vercel env add OPENAI_API_KEY production

# 4. Deploy to production
vercel --prod
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# AI APIs
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Application
NEXT_PUBLIC_APP_URL=https://language-map.org
```

### Custom Domain Setup

1. Add domain to Vercel project
2. Configure DNS records (A/CNAME)
3. Enable SSL certificate (automatic)
4. Test deployment

### Monitoring Setup

```bash
# 1. Install Sentry SDK
npm install @sentry/nextjs

# 2. Initialize Sentry
npx @sentry/wizard -i nextjs

# 3. Configure in next.config.js
```

---

## Risk Mitigation

### High Risk Issues

#### **1. Time Underestimation**

**Risk**: Solo development takes longer than planned (70 days is ambitious)

**Mitigation**:
- Realistic 70-day timeline with buffer
- Use AI tools (Cursor, Copilot, v0.dev) aggressively
- Copy-paste components (Shadcn/ui)
- Start with 2 locales (EN + NL), add FR later
- Use AI to generate initial Dutch translations
- Deploy incrementally, not big bang

#### **2. i18n Complexity**

**Risk**: Translation management becomes overwhelming

**Mitigation**:
- Start with minimal UI translations (key terms only)
- Use fallback to English everywhere
- Automate translation file generation where possible
- Focus on Amsterdam data first (EN/NL only)
- Add more languages incrementally post-launch

#### **3. AI Generation Costs**

**Risk**: OpenAI API costs spiral out of control

**Mitigation**:
- Set hard API spending limits in OpenAI dashboard
- Cache generated descriptions in database
- Rate limit generations per user/day
- Monitor costs with ai_generation_log table
- Consider cheaper models (GPT-3.5) for drafts

#### **4. Data Migration with Translations**

**Risk**: Amsterdam import loses data or translation relationships break

**Mitigation**:
- Test import script on Airtable copy
- Manual verification of critical records
- Keep Airtable as backup during transition
- Import incrementally (geography → languages → points → descriptions)
- Verify translation links after each step

### Medium Risk Issues

#### **5. Scope Creep**

**Risk**: Keep adding "just one more locale/feature"

**Mitigation**:
- Strict MVP definition: EN/NL/FR only
- "Future enhancements" list for later
- Resist perfectionism
- Ship and iterate

#### **6. Burnout**

**Risk**: 16-19 weeks solo is very intense

**Mitigation**:
- Take weekends off (critical!)
- Celebrate small wins (each phase complete)
- Don't work nights consistently
- Week 7 = mid-project break (2-3 days rest)
- Ask for feedback from trusted people

#### **7. Multi-Tenancy Security**

**Risk**: RLS policy bug allows cross-city data access

**Mitigation**:
- Write RLS tests for each policy
- Manual security testing with multiple test users
- Supabase community review before launch
- Penetration testing (hire contractor if budget allows)
- Bug bounty program (post-launch)

#### **8. Translation Consistency**

**Risk**: Inconsistent terminology across locales

**Mitigation**:
- Create glossary document (EN/NL/FR)
- Use consistent terminology in UI
- Review all AI-generated translations
- Native speaker review before launch (hire if needed)

---

## Solo Development Optimizations

### Work Efficiency Tips

1. **Use Shadcn/ui** - Copy-paste components, don't build from scratch
2. **Server Actions** - Skip API route boilerplate
3. **Supabase Studio** - Visual database editor
4. **v0.dev** (optional) - AI-generated UI components
5. **Cursor/Copilot** - AI coding assistance
6. **Small commits** - Deploy often, test incrementally

### Minimum Viable Features (launch faster)

- ✅ Core CRUD operations
- ✅ Map visualization
- ✅ User management
- ✅ CSV import
- ⏸️ Skip analytics dashboard (add later)
- ⏸️ Skip audit logs UI (data is logged, UI later)
- ⏸️ Skip advanced search (basic search first)

### AI Coding Assistants (Highly Recommended)

- **Cursor**: AI-powered IDE (fork of VS Code)
- **GitHub Copilot**: Code completion
- **v0.dev**: Generate UI components from text prompts
- **ChatGPT/Claude**: Architecture discussions, debugging

### Time Management

- **Pomodoro Technique**: 25 min work, 5 min break
- **Time blocking**: Dedicate specific hours to coding
- **Weekly reviews**: Track progress, adjust plan

---

## Next Steps

### Immediate (This Week)

1. ✅ **Review and approve this plan**
2. ⏸️ **Decide URL structure** (path-based vs subdomain)
   - *Recommendation*: Path-based for simplicity
3. ⏸️ **Set up accounts**:
   - GitHub repo
   - Supabase project
   - Vercel account
   - Mapbox account
4. ⏸️ **Choose project name** (independent branding)

### Next Week (Phase 1 Start)

1. Initialize Next.js 15+ repository
2. Configure Supabase project
3. Create database schema
4. Implement RLS policies
5. Basic auth setup

---

## Future Enhancements (Post-MVP)

### Phase 10: Multi-Database Support (Optional)

**Goal**: Enable per-city or per-region database deployment for data sovereignty

**Estimated Timeline**: 2-3 weeks

**Tasks**:
- Test database abstraction layer with multiple database configs
- Implement database routing based on city configuration
- Set up Supabase projects for pilot cities
- Data migration scripts for moving cities to dedicated databases
- User authentication federation

**Business Case**: Charge premium ($500/mo) for dedicated databases

### Phase 11: Analytics & Insights (Optional)

- Dashboard with charts (language distribution, world region breakdown)
- Map view heatmaps and density visualization
- User activity tracking and engagement metrics
- Data quality metrics and completeness reports
- Translation coverage metrics per language
- AI generation cost tracking

### Phase 12: Advanced Features (Optional)

- Public API for developers (REST + GraphQL)
- Embed widgets for other websites
- Mobile app (React Native + Expo)
- Advanced search (fuzzy matching, filters by multiple criteria)
- Audio pronunciation guides for endonyms
- Historical data tracking (language spread over time)
- Census data overlays (if city provides data)
- Community contributions (public submissions with moderation)
- Advanced CMS features (version history, A/B testing, preview mode)

### Phase 13: Monetization (If Decided)

- **Starter** ($50/mo): Shared database, basic customization, 1 city
- **Professional** ($150/mo): Shared database, full customization (taxonomies + CMS), 3 cities, AI features
- **Enterprise** ($500/mo): Dedicated database, unlimited cities, white label, API access, priority support

---

## Summary of Changes from Previous Versions

### ✅ Added in v3.1:

- Hierarchical geography (districts, neighborhoods)
- Structured world data (regions, countries)
- Full i18n infrastructure (database + frontend)
- Multi-city user access (city_users junction table)
- Multi-city views and comparison
- AI description generation with source management
- AI-assisted translation with review workflow
- Per-city AI configuration
- Configurable locales per city
- Flexible taxonomy system (replaces hardcoded enums)
- Static content management system (page builder)
- Brand customization per city
- Database abstraction layer (multi-database ready)

### ✅ Removed from MVP:

- Census data overlays
- Material-UI (switched to Shadcn/ui)
- Team collaboration features (solo-optimized)
- Advanced analytics dashboard (simplified for MVP)

### ✅ Timeline Extended:

- **Before**: 8-10 weeks (50 days)
- **After**: 16-19 weeks (70 days)
- **Reason**: Added i18n, AI features, flexible taxonomies, CMS, geographic hierarchy, multi-city views

---

**Document Status**: Complete implementation plan
**Ready to Begin**: Phase 1 - Foundation & i18n (Week 1)

**Next Action**: Review plan, approve, and set up development accounts

