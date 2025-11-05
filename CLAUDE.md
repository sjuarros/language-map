# Multi-City Language Mapping Platform - Project Context

**Version:** 3.1
**Status:** Planning Phase
**Timeline:** 16-19 weeks (70 days)
**Developer:** Solo project

---

## 🎯 Project Overview

An independent, highly customizable multi-city platform that enables cities worldwide to document and visualize their linguistic diversity. Starting with Amsterdam, designed from day 1 to support multiple cities with deep customization capabilities.

**Key Innovation**: Cities define their own language classification systems (flexible taxonomies), customize all content (CMS), and control their branding—rather than being forced into a rigid, one-size-fits-all data model.

---

## 📚 Documentation Structure

### Core Documentation

- **prd.md** - Product requirements, features, user stories, success metrics
- **architecture.md** - Technical architecture, database schema, security, performance
- **design.md** - UI/UX specifications, component design, i18n, AI features
- **implementation-plan.md** - 70-day roadmap with day-by-day tasks

### Phase-Specific Documentation

All implementation phase documentation is organized in **`docs/implementation-phases/`**:

```
docs/implementation-phases/
├── phase-1-foundation-i18n/       # Weeks 1-3: Database, auth, i18n
├── phase-2-operator-crud/         # Weeks 4-6: Geography, taxonomies, language CRUD
├── phase-3-data-import-ai/        # Week 7: CSV import, AI generation
├── phase-4-public-map/            # Weeks 8-9: Map interface, filtering
├── phase-5-static-cms/            # Week 10: Page builder, content management
├── phase-6-multi-city-views/      # Week 11: Multi-city comparison
├── phase-7-admin-branding/        # Week 12: Admin panel, branding
├── phase-8-amsterdam-import/      # Week 13: Amsterdam data migration
└── phase-9-testing-launch/        # Weeks 14-15: Testing, polish, deployment
```

**Purpose**: Each phase folder contains:
- Technical decisions made during development
- Implementation notes and learnings
- Code snippets and examples
- Migration scripts (if applicable)
- Testing results and bug fixes
- Performance optimizations
- Deviations from the original plan

**Usage Guidelines**:
- Document decisions as you make them
- Save useful code snippets for reference
- Record problems encountered and solutions
- Note any changes to the original plan
- Keep track of dependencies between features
- Document database migrations and schema changes

---

## 🏗️ Core Architecture

### Technology Stack

```typescript
// Frontend + Backend
Next.js 15+ (App Router)    // React Server Components + Server Actions
React 18+                   // UI library
TypeScript 5+               // Type safety

// Database + Auth
Supabase                     // PostgreSQL + Auth + Storage + RLS
PostGIS                      // Geospatial extension

// UI Components
Shadcn/ui                    // Copy-paste component library (NOT Material-UI!)
Tailwind CSS                 // Utility-first CSS
Radix UI                     // Accessible primitives
Lucide Icons                 // ⚠️ ICON LIBRARY (NOT @radix-ui/react-icons!)

// Internationalization
next-intl                    // Next.js i18n routing + translations

// Maps
Mapbox GL JS v3              // Map rendering
react-map-gl v7              // React wrapper

// State Management
Zustand                      // Client state (UI)
TanStack Query v5            // Server state (data fetching, caching)

// AI Integration
openai                       // Description generation + translation
anthropic                    // Alternative AI provider

// Testing
Vitest                       // Unit tests
Playwright                   // E2E tests
```

### Key Architectural Decisions

1. **Multi-Tenancy**: Row-Level Security (RLS) in shared database, with abstraction layer for future dedicated databases
2. **i18n from Day 1**: All data translatable, UI supports multiple languages
3. **Flexible Taxonomies**: Cities define their own language classification schemes (NOT hardcoded enums)
4. **Database Abstraction**: `getDatabaseClient(citySlug)` enables future migration to per-city databases
5. **Server Components**: Leverage Next.js 15+ App Router for performance and SEO
6. **Path-based URLs**: `/[locale]/[citySlug]` structure (e.g., `/en/amsterdam`, `/nl/amsterdam`)

---

## 🗄️ Database Schema Overview

### Core Tables (35+ total)

**Localization**:
- `locales` - Supported languages (en, nl, fr, etc.)
- `*_translations` - Translation tables for all translatable content

**Geographic Hierarchy**:
- `world_regions` → `countries` → `cities` → `districts` → `neighborhoods`

**User Management** (Multi-City Access):
- `user_profiles` - Users with roles (superuser/admin/operator)
- `city_users` - Junction table (users can access multiple cities)

**Language Data**:
- `language_families` + translations
- `languages` - Core language data (endonym is NOT translated)
- `language_translations` - Translated names per locale
- `language_points` - Geographic locations where languages are spoken
- `descriptions` + translations - Community stories

**Flexible Taxonomy System**:
- `taxonomy_types` - Classification types (e.g., "Size", "Status", "Script Type")
- `taxonomy_type_translations`
- `taxonomy_values` - Values with visual styling (colors, icons, sizes)
- `taxonomy_value_translations`
- `language_taxonomies` - Assignment of values to languages

**Static Content Management**:
- `static_pages` - Custom pages (About, Methodology, etc.)
- `static_page_translations`
- `page_sections` - Page building blocks (hero, text, image, gallery, etc.)
- `page_section_translations`
- `city_assets` - Uploaded files (logos, images)

**AI Features**:
- `ai_sources` - Whitelist/blacklist per city
- `ai_generation_log` - Track AI usage and costs
- `cities.ai_translation_*` - Per-city AI translation config

**Security**:
- `audit_logs` - Track all changes
- RLS policies on all tables

### Critical Database Pattern

**All translation tables** include AI tracking:
```sql
is_ai_translated BOOLEAN NOT NULL DEFAULT false,
ai_model TEXT,
ai_translated_at TIMESTAMPTZ,
reviewed_by UUID REFERENCES user_profiles(id),
reviewed_at TIMESTAMPTZ
```

### Database Abstraction Layer (MUST USE)

```typescript
// lib/database/client.ts

// Factory function - ALL app code uses this
export function getDatabaseClient(citySlug: string)

// Server-only with service role
export function getDatabaseAdminClient(citySlug: string)

// Usage in Server Components:
const supabase = getDatabaseClient(params.citySlug)
```

**Why**: Enables future migration to per-city databases without rewriting app code.

---

## 👥 User Roles & Permissions

### Three-Tier Hierarchy

```
Superuser (platform owner)
  ├─ Create cities
  ├─ Access ALL cities
  ├─ Manage all users
  └─ Override all RLS policies

Admin (city/project leads)
  ├─ Access MULTIPLE cities (as granted via city_users)
  ├─ Manage users for their cities
  ├─ Configure city settings (branding, taxonomies, locales)
  ├─ Manage AI settings
  └─ All operator permissions

Operator (researchers, data entry)
  ├─ Access MULTIPLE cities (as granted via city_users)
  ├─ CRUD language data
  ├─ Import/export data
  ├─ Generate AI descriptions
  ├─ AI-assisted translation
  └─ Cannot manage users or settings
```

### Multi-City Access Pattern

Users are granted access via `city_users` junction table:
```sql
CREATE TABLE city_users (
  city_id UUID REFERENCES cities(id),
  user_id UUID REFERENCES user_profiles(id),
  role TEXT CHECK (role IN ('admin', 'operator')),
  PRIMARY KEY (city_id, user_id)
);
```

**Example**: Sarah can be an operator for Amsterdam, Paris, and Berlin simultaneously.

---

## 🌍 Internationalization (i18n)

### Key Principles

1. **Endonyms are universal** - Language endonym (e.g., "日本語") is the same in all UI locales
2. **Everything else is translated** - Language names, descriptions, UI text, city names, etc.
3. **Fallback to English** - If translation missing, show English version
4. **AI-assisted translation** - Per-city AI configuration for bulk translation with review workflow

### URL Structure

```
/[locale]/[citySlug]
  → /en/amsterdam      (English UI, Amsterdam data)
  → /nl/amsterdam      (Dutch UI, Amsterdam data)
  → /fr/paris          (French UI, Paris data)

/[locale]/[citySlug]/[pageSlug]
  → /en/amsterdam/about
  → /nl/amsterdam/about
```

### Translation Files

```
messages/
├── en.json
├── nl.json
└── fr.json
```

### Database Queries with i18n

```typescript
// ALWAYS query with locale
const { data: languages } = await supabase
  .from('languages')
  .select(`
    id,
    endonym,  // NOT translated
    translations:language_translations!inner(
      name    // Translated per locale
    )
  `)
  .eq('city_id', cityId)
  .eq('translations.locale', locale)  // ⚠️ CRITICAL
```

---

## 🎨 Flexible Taxonomy System

### Concept

Cities define their own language classification systems instead of hardcoded enums.

**Amsterdam might use**:
- Community Size (Small/Medium/Large)
- Endangerment Status (Safe/Vulnerable/Endangered)

**Tokyo might use**:
- Script Type (Logographic/Syllabic/Alphabetic)
- Official Status (Official/Recognized/Minority)

### How It Works

1. **Admin creates taxonomy type**: "Community Size"
   - Configuration: required, single-select, used for map styling
   - Translations: EN "Community Size", NL "Gemeenschapsgrootte"

2. **Admin creates taxonomy values**: Small, Medium, Large
   - Visual styling: colors (#FFA500, #FFD700, #FF4500), icon sizes (0.8, 1.0, 1.3)
   - Translations per value

3. **Operator assigns values to languages** via `language_taxonomies` table

4. **Map dynamically styles markers** based on taxonomy values

5. **Filters are generated dynamically** from city's taxonomies

### Database Structure

```
taxonomy_types (slug, is_required, allow_multiple, use_for_map_styling, use_for_filtering)
  ├─ taxonomy_type_translations (name, description per locale)
  ├─ taxonomy_values (slug, color_hex, icon_name, icon_size_multiplier)
  │   └─ taxonomy_value_translations (name, description per locale)
  └─ language_taxonomies (language_id, taxonomy_value_id)
```

**⚠️ CRITICAL**: Never hardcode language classifications. Always use taxonomies.

---

## 📝 Static Content Management (CMS)

### Concept

Cities can build custom pages (About, Methodology, etc.) using a section-based page builder.

### Section Types

- **hero** - Large image with title overlay
- **text** - Rich text blocks (Markdown/HTML)
- **image** - Single image with caption
- **gallery** - Multiple images in grid
- **video** - Embedded videos
- **team** - Team member cards
- **partners** - Partner logo grid
- **stats** - Statistics cards
- **cta** - Call-to-action buttons
- **accordion** - FAQ-style expandable items
- **divider** - Visual separator

### Database Structure

```
static_pages (slug, template, is_published)
  ├─ static_page_translations (title, meta_description per locale)
  └─ page_sections (section_type, display_order, config)
      └─ page_section_translations (content JSON per locale)
```

### Dynamic Rendering

```tsx
// app/[locale]/[citySlug]/[pageSlug]/page.tsx

const SECTION_COMPONENTS = {
  hero: Hero,
  text: TextBlock,
  team: TeamSection,
  // ...
}

export default async function DynamicPage({ params }) {
  const sections = await getPageSections(pageId, locale)

  return sections.map(section => {
    const Component = SECTION_COMPONENTS[section.section_type]
    return <Component content={section.content} config={section.config} />
  })
}
```

---

## 🤖 AI Features

### 1. AI Description Generation

**Per-City Configuration**:
- Provider (OpenAI, Anthropic, Custom)
- Model (gpt-4-turbo, claude-3-opus, etc.)
- API key (encrypted)
- Source whitelist/blacklist

**Workflow**:
1. Operator selects language + neighborhood
2. System builds prompt with source filtering
3. AI generates description
4. Logged to `ai_generation_log` (track costs!)
5. Operator reviews and edits
6. Flagged as `is_ai_generated = true`

### 2. AI-Assisted Translation

**Per-City Configuration**: Same as description generation

**Workflow**:
1. Operator selects content to translate (language names, descriptions, etc.)
2. AI translates from source locale to target locale
3. Flagged as `is_ai_translated = true`, includes model and timestamp
4. Operator reviews and edits (editing removes AI flag)
5. Can mark as "reviewed" to track quality

**Bulk Translation**: Translate all missing content for a locale at once

**⚠️ Cost Management**:
- Set hard API spending limits in OpenAI/Anthropic dashboard
- Cache generated content in database
- Rate limit generations per user/day
- Monitor `ai_generation_log` for cost tracking

---

## 🗺️ Map Implementation

### GeoJSON API Approach

**Do NOT use Mapbox tilesets** - Use dynamic GeoJSON for simplicity.

```typescript
// app/[locale]/[citySlug]/api/geojson/route.ts

export async function GET(request: Request, { params }) {
  const supabase = getDatabaseClient(params.citySlug)

  const { data: points } = await supabase
    .from('language_points')
    .select(`
      id, latitude, longitude,
      language:languages (
        id, endonym,
        translations:language_translations!inner(name),
        taxonomies:language_taxonomies(
          taxonomy_value:taxonomy_values(slug, color_hex, icon_size_multiplier)
        )
      )
    `)
    .eq('city_id', cityId)
    .eq('language.translations.locale', locale)

  // Convert to GeoJSON with taxonomy data in properties
  const geojson = {
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      properties: {
        languageId: point.language.id,
        languageName: point.language.translations[0].name,
        endonym: point.language.endonym,
        // Include taxonomy data for dynamic styling
        taxonomies: point.language.taxonomies.map(t => ({
          slug: t.taxonomy_value.slug,
          color: t.taxonomy_value.color_hex,
          size: t.taxonomy_value.icon_size_multiplier
        }))
      }
    }))
  }

  return Response.json(geojson, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}
```

### Dynamic Map Styling from Taxonomies

```typescript
// lib/mapbox/layer-styles.ts

export async function generateLanguagePointLayer(citySlug: string) {
  const taxonomies = await getTaxonomyTypes(citySlug, { useForMapStyling: true })

  const colorTaxonomy = taxonomies.find(t => t.use_for_map_styling)
  if (!colorTaxonomy) return defaultLayerStyle

  // Build Mapbox expressions dynamically
  const colorExpression: Expression = [
    'match',
    ['get', `taxonomy_${colorTaxonomy.slug}`],
    ...colorTaxonomy.values.flatMap(v => [v.slug, v.color_hex]),
    '#CCCCCC'  // default
  ]

  return {
    'circle-color': colorExpression,
    'circle-radius': ['*', 8, sizeExpression]
  }
}
```

---

## 🔒 Security

### Row-Level Security (RLS)

**All tables have RLS enabled** with policies that check:
1. Superuser can access everything
2. Admins/Operators can only access cities granted via `city_users` table
3. Public can read published content

**Example Policy**:
```sql
CREATE POLICY "City users can manage city languages"
  ON languages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );
```

### Testing RLS

**⚠️ CRITICAL**: Always test cross-city data access:
```typescript
// Create user with access to Amsterdam only
// Try to access Paris data
// Should return empty or error
```

### API Key Security

- AI API keys encrypted at rest in `cities.ai_translation_api_key_encrypted`
- Never exposed to client-side code
- Accessed only via Server Actions

---

## 📐 Coding Conventions

### File Structure

```
app/
├── [locale]/                    # i18n routing
│   ├── [citySlug]/             # City-specific public pages
│   │   ├── page.tsx            # Map view
│   │   ├── [pageSlug]/         # CMS pages (about, methodology)
│   │   └── api/                # API routes
│   ├── operator/[citySlug]/    # Operator dashboard
│   ├── admin/[citySlug]/       # Admin panel
│   └── superuser/              # Superuser dashboard

components/
├── map/                        # Map components
├── sections/                   # CMS page sections
├── ui/                         # Shadcn/ui components
└── forms/                      # Form components

lib/
├── database/
│   └── client.ts              # ⚠️ Database abstraction layer
├── i18n/                      # Translation utilities
├── mapbox/                    # Map styling utilities
└── ai/                        # AI integration

messages/
├── en.json                    # English translations
├── nl.json                    # Dutch translations
└── fr.json                    # French translations
```

### Component Conventions

```typescript
// Server Components (default)
export default async function CityPage({ params }: { params: { citySlug: string, locale: string } }) {
  const supabase = getDatabaseClient(params.citySlug)  // ⚠️ Use abstraction
  const locale = await getLocale()  // ⚠️ Always get locale

  const { data } = await supabase
    .from('languages')
    .select('*, translations:language_translations!inner(*)')
    .eq('translations.locale', locale)  // ⚠️ Filter by locale

  return <LanguageMap languages={data} />
}

// Client Components (when needed)
'use client'

export function InteractiveMap() {
  const [filter, setFilter] = useState('')
  // ... client-side logic
}
```

### Server Actions

```typescript
// app/actions/language.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getDatabaseClient } from '@/lib/database/client'

export async function createLanguage(citySlug: string, data: LanguageInput) {
  const supabase = getDatabaseClient(citySlug)

  const { data: language, error } = await supabase
    .from('languages')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/${citySlug}/languages`)
  return language
}
```

### TypeScript Types

```typescript
// types/database.ts

export type Database = {
  public: {
    Tables: {
      languages: {
        Row: {
          id: string
          city_id: string
          endonym: string | null
          iso_639_3_code: string | null
          // ...
        }
        Insert: {
          id?: string
          city_id: string
          endonym?: string | null
          // ...
        }
        Update: {
          id?: string
          city_id?: string
          endonym?: string | null
          // ...
        }
      }
      // ... more tables
    }
  }
}

// Generate with: npx supabase gen types typescript --project-id xxx > types/database.ts
```

---

## 📋 Coding Standards & Testing

**UI Components:** The application uses **Shadcn/ui** + **Tailwind CSS** (NOT Material-UI, NOT Fluent Design)

**Coding Standards:** All code must adhere to the comprehensive coding standards defined in **[docs/processes/coding-standards.md](./docs/processes/coding-standards.md)**

### Key Requirements

**Error Handling (Mandatory):**
- All functions must include comprehensive error handling
- Never write happy-path-only code
- Validate all inputs at function entry
- Use try-catch blocks for all async operations
- Provide meaningful error messages with context

**Code Comments (Mandatory):**
- File header comments explaining purpose
- JSDoc (TypeScript) for all functions
- Document all parameters, return values, and exceptions
- Inline comments explaining "why", not "what"

**Testing Requirements:**
- Minimum 80% code coverage for all new code
- Test happy paths, error cases, and edge cases
- Follow Arrange-Act-Assert pattern
- **Unit/Component Tests:** Co-located with source files (`*.test.tsx` next to `*.tsx`)
- **E2E Tests:** Separate `/e2e` folder (`*.spec.ts`)
- **Mocking:** Mock Next.js modules (next-intl, next/link, next/navigation) for isolation

**Testing Resources:**
- Complete testing guide: **[docs/processes/frontend-testing-guide.md](./docs/processes/frontend-testing-guide.md)**
- Coding standards: **[docs/processes/coding-standards.md](./docs/processes/coding-standards.md)**

---

## 🚀 Environment Setup & Commands

### Important: Development Server

⚠️ **CRITICAL**: The dev server is always running on port 3001
- **DO NOT** run `npm run dev` manually
- If restart needed, ask to restart it manually
- Server runs continuously in the background

### Supabase Local Instance

⚠️ **IMPORTANT**: This project uses **custom ports (54331-54336)** for Supabase to avoid conflicts with other projects.

- **API**: http://localhost:54331
- **Database**: localhost:54332
- **Studio**: http://localhost:54333

See **[docs/local-development.md](./docs/local-development.md)** for complete setup guide and port allocation.

### Starting Development (First Time Setup)

```bash
# 1. Clone repo
git clone <repo-url>
cd language-map

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Start Supabase (custom ports: 54331-54336)
npx supabase start

# 5. Run dev server
npm run dev
```

### Environment Variables

**Local Development (.env.local):**
```env
# Supabase Local (CUSTOM PORTS: 54331-54336)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgresql://postgres:postgres@localhost:54332/postgres

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# AI APIs (optional)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Production (.env):**
```env
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# AI APIs (optional)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Database Migrations

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to project
supabase link --project-ref xxx

# 3. Create migration
supabase migration new add_new_feature

# 4. Edit migration file
# migrations/xxxx_add_new_feature.sql

# 5. Apply migration
supabase db push
```

### Testing Commands

See [Coding Standards & Testing](#-coding-standards--testing) for requirements and organization.

```bash
# Unit/Component tests (Vitest)
npm run test
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E tests (Playwright)
npm run test:e2e

# Run all tests
npm run test:all

# Code quality checks
npm run type-check          # TypeScript validation
npm run lint                # ESLint validation
```

---

## ⚠️ Common Pitfalls

### 1. Forgetting Database Abstraction

❌ **Wrong**:
```typescript
const supabase = createClient()  // Hardcoded client
```

✅ **Correct**:
```typescript
const supabase = getDatabaseClient(citySlug)  // Routed client
```

### 2. Forgetting Locale in Queries

❌ **Wrong**:
```typescript
.from('languages')
.select('*, translations:language_translations(*)')
```

✅ **Correct**:
```typescript
.from('languages')
.select('*, translations:language_translations!inner(*)')
.eq('translations.locale', locale)
```

### 3. Translating Endonyms

❌ **Wrong**: Endonyms in `language_translations` table

✅ **Correct**: Endonym is a single field in `languages` table (universal, not translated)

### 4. Hardcoding Language Classifications

❌ **Wrong**:
```typescript
endangerment_status: 'endangered'  // Hardcoded enum
```

✅ **Correct**:
```typescript
// Use taxonomy_values and language_taxonomies tables
```

### 5. Not Using Shadcn/ui

❌ **Wrong**: Import from `@mui/material`

✅ **Correct**: Import from `@/components/ui` (Shadcn)

### 6. Forgetting RLS Testing

❌ **Wrong**: Assume RLS works without testing

✅ **Correct**: Write tests for cross-city data access attempts

### 7. Using Wrong Icon Library

❌ **Wrong**:
```typescript
import { CheckIcon } from "@radix-ui/react-icons"
import { ChevronDown } from "@radix-ui/react-icons"
```

✅ **Correct**:
```typescript
import { Check, ChevronDown } from "lucide-react"
```

⚠️ **Always use Lucide Icons** - See Technology Stack section. Do NOT use `@radix-ui/react-icons`!

### 8. Using Wrong Supabase Instance

❌ **Wrong**:
```bash
# Connected to supabase_db_supabase (other project's database!)
supabase start
supabase db reset
supabase link --project-ref xxx
```

✅ **Correct**:
```bash
# Connected to supabase_db_language-map (THIS project's database)
# Verify with: docker ps | grep supabase_db_language-map
supabase start
supabase db reset
supabase link --project-ref xxx
```

⚠️ **CRITICAL**: Always verify which Supabase instance you're using before running any commands!
The wrong instance can corrupt data in the other project's database. See [Supabase Local Instance](#supabase-local-instance) for details.

### 9. Authentication Not Working After `supabase db reset`

❌ **Symptom**: Magic links don't work, users redirected to login even with valid session

❌ **Wrong Diagnosis**: "Magic links are expiring too quickly"

✅ **Root Cause**: Server Components cannot access Supabase's `sb-auth-token` cookie

✅ **Quick Fix (3 Steps)**:

1. **Verify all protected layouts are Client Components:**
   ```typescript
   'use client'  // Must be first line

   // Use createAuthClient() not createServerClient()
   // Use useRouter() not redirect()
   // Use pathname parsing not await getLocale()
   ```

2. **Check `supabase/config.toml`:**
   ```toml
   [auth]
   site_url = "http://localhost:3001"
   additional_redirect_urls = ["https://localhost:3001"]
   jwt_expiry = 86400  # 24 hours for development
   ```

3. **Restart Supabase:**
   ```bash
   npx supabase stop && npx supabase start
   ```

**Files to Check:**
- `/app/[locale]/operator/layout.tsx` - Must be Client Component
- `/app/[locale]/admin/layout.tsx` - Must be Client Component
- `/app/[locale]/superuser/layout.tsx` - Must be Client Component

**See also:** `docs/processes/authentication-troubleshooting.md` for complete fix details

⚠️ **CRITICAL**: Server Components can ONLY see Next.js cookies (like `NEXT_LOCALE`), NOT external library cookies (like `sb-auth-token`). Always use Client Components for authentication checks.

---

## 🎯 Development Priorities

### MVP Must-Haves (Week 1-15)

- ✅ Database setup with i18n
- ✅ Auth with multi-city access
- ✅ Flexible taxonomy system
- ✅ Operator CRUD for all entities
- ✅ AI description generation
- ✅ AI-assisted translation
- ✅ Public map with dynamic filtering
- ✅ Static content management
- ✅ Admin panel with user management
- ✅ Amsterdam data import

### Post-MVP (Week 16+)

- ⏸️ Analytics dashboard
- ⏸️ Advanced search
- ⏸️ Public API
- ⏸️ Mobile app
- ⏸️ Community contributions
- ⏸️ Multi-database deployment (data sovereignty)

---

## 📞 Key Contacts & Resources

### Documentation

- PRD: `docs/prd.md`
- Architecture: `docs/architecture.md`
- Design: `docs/design.md`
- Implementation Plan: `docs/implementation-plan.md`

### External Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Shadcn/ui: https://ui.shadcn.com/
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
- next-intl: https://next-intl-docs.vercel.app/

### Current Phase

**Phase 1: Foundation & i18n (Weeks 1-3)**

Next milestone: Database setup complete, auth working, i18n infrastructure ready

---

## 💡 Quick Reference

### Most Common Tasks

**Add a new city**:
```sql
INSERT INTO cities (slug, name, country_id, center_lat, center_lng, default_locale)
VALUES ('paris', 'Paris', 'france-uuid', 48.8566, 2.3522, 'fr');
```

**Grant user access to city**:
```sql
INSERT INTO city_users (city_id, user_id, role)
VALUES ('paris-uuid', 'user-uuid', 'operator');
```

**Add a translation**:
```sql
INSERT INTO language_translations (language_id, locale, name)
VALUES ('lang-uuid', 'nl', 'Nederlands');
```

**Create a taxonomy**:
```sql
-- 1. Create type
INSERT INTO taxonomy_types (city_id, slug, is_required, use_for_map_styling)
VALUES ('city-uuid', 'size', true, true);

-- 2. Create values
INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex)
VALUES ('type-uuid', 'small', '#FFA500');

-- 3. Assign to language
INSERT INTO language_taxonomies (language_id, taxonomy_value_id)
VALUES ('lang-uuid', 'value-uuid');
```

---

**Last Updated**: October 29, 2025
**Version**: 3.1
**Status**: Ready for development

