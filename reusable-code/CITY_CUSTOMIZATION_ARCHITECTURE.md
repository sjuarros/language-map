# City Customization Architecture

## Overview

Cities require deep customization capabilities beyond just data isolation. This document describes the architecture for:

1. **Flexible Taxonomy System**: Cities define their own language classification schemes
2. **Static Content Management**: Cities customize all static pages, images, and content
3. **Brand Customization**: Logos, colors, fonts per city

This transforms the platform from "multi-tenant SaaS with shared data model" to "**multi-instance platform with configurable content and taxonomies**".

---

## 1. Flexible Taxonomy System

### Problem Statement

**Current Limitation**: Hardcoded language classifications
```sql
-- Current approach (too rigid)
CREATE TABLE languages (
  endangerment_status TEXT CHECK (endangerment_status IN ('safe', 'vulnerable', 'extinct')),
  size TEXT CHECK (size IN ('small', 'medium', 'large'))
);
```

**Issue**: Different cities need different classification systems:
- **Amsterdam**: Community Size (Small/Medium/Large), Endangerment Status (Safe/Vulnerable/Endangered)
- **Tokyo**: Script Type (Logographic/Syllabic/Alphabetic), Official Status (Official/Recognized/Minority)
- **Mexico City**: Historical Period (Pre-Hispanic/Colonial/Modern), Geographic Origin (Local/Migrant)

### Solution: Configurable Taxonomy System

#### Database Schema

```sql
-- ============================================
-- FLEXIBLE TAXONOMY SYSTEM
-- ============================================

-- Taxonomy Types (e.g., "Size", "Status", "Script Type")
CREATE TABLE taxonomy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- 'size', 'status', 'script-type', 'official-status'

  -- Configuration
  is_required BOOLEAN NOT NULL DEFAULT false,     -- Must all languages have this?
  allow_multiple BOOLEAN NOT NULL DEFAULT false,  -- Can language have multiple values?
  use_for_filtering BOOLEAN NOT NULL DEFAULT true,  -- Show in filter UI?
  use_for_map_styling BOOLEAN NOT NULL DEFAULT false, -- Use for marker colors/icons?

  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(city_id, slug)
);

-- Taxonomy Type Translations
CREATE TABLE taxonomy_type_translations (
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,                     -- EN: "Community Size", NL: "Gemeenschapsgrootte"
  description TEXT,                       -- Help text for operators

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (taxonomy_type_id, locale)
);

-- Taxonomy Values (the actual options)
CREATE TABLE taxonomy_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- 'small', 'medium', 'large'

  -- Visual styling (for map markers and UI)
  color_hex TEXT,                         -- '#FF5733' for red, '#33FF57' for green
  icon_name TEXT,                         -- 'circle', 'square', 'triangle', 'star'
  icon_size_multiplier DECIMAL(3,2) DEFAULT 1.0,  -- Make markers bigger/smaller

  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(taxonomy_type_id, slug)
);

-- Taxonomy Value Translations
CREATE TABLE taxonomy_value_translations (
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,                     -- EN: "Small Community", NL: "Kleine Gemeenschap"
  description TEXT,                       -- "Fewer than 500 speakers"

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (taxonomy_value_id, locale)
);

-- Language to Taxonomy Assignment (many-to-many)
CREATE TABLE language_taxonomies (
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,

  notes TEXT,                             -- Optional context for this assignment
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id),

  PRIMARY KEY (language_id, taxonomy_value_id)
);

-- Index for filtering languages by taxonomy
CREATE INDEX idx_language_taxonomies_value ON language_taxonomies(taxonomy_value_id);
CREATE INDEX idx_language_taxonomies_language ON language_taxonomies(language_id);
```

#### Example Configuration: Amsterdam

```sql
-- Amsterdam's "Community Size" taxonomy
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple, use_for_map_styling)
VALUES ('amsterdam-uuid', 'size', true, false, true);

INSERT INTO taxonomy_type_translations (taxonomy_type_id, locale, name)
VALUES
  ('size-uuid', 'en', 'Community Size'),
  ('size-uuid', 'nl', 'Gemeenschapsgrootte');

-- Values: Small, Medium, Large
INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex, icon_size_multiplier)
VALUES
  ('size-uuid', 'small', '#FFA500', 0.8),   -- Orange, 80% size
  ('size-uuid', 'medium', '#FFD700', 1.0),  -- Gold, normal size
  ('size-uuid', 'large', '#FF4500', 1.3);   -- Red-Orange, 130% size

INSERT INTO taxonomy_value_translations (taxonomy_value_id, locale, name, description)
VALUES
  ('small-uuid', 'en', 'Small Community', 'Fewer than 500 speakers'),
  ('small-uuid', 'nl', 'Kleine Gemeenschap', 'Minder dan 500 sprekers'),
  ('medium-uuid', 'en', 'Medium Community', '500-2,000 speakers'),
  ('large-uuid', 'en', 'Large Community', 'More than 2,000 speakers');

-- Amsterdam's "Endangerment Status" taxonomy
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple, use_for_filtering)
VALUES ('amsterdam-uuid', 'endangerment', false, false, true);

INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex)
VALUES
  ('endangerment-uuid', 'safe', '#4CAF50'),            -- Green
  ('endangerment-uuid', 'vulnerable', '#FFC107'),      -- Yellow
  ('endangerment-uuid', 'endangered', '#FF5722');      -- Red
```

#### Example Configuration: Tokyo

```sql
-- Tokyo's "Script Type" taxonomy (different from Amsterdam!)
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple)
VALUES ('tokyo-uuid', 'script-type', true, true);  -- Allow multiple (e.g., Japanese uses 3 scripts)

INSERT INTO taxonomy_type_translations (taxonomy_type_id, locale, name)
VALUES
  ('script-uuid', 'en', 'Writing System'),
  ('script-uuid', 'ja', '文字体系');

INSERT INTO taxonomy_values (taxonomy_type_id, slug, icon_name)
VALUES
  ('script-uuid', 'logographic', 'book'),
  ('script-uuid', 'syllabic', 'circle'),
  ('script-uuid', 'alphabetic', 'square');

-- Tokyo's "Official Status" taxonomy
INSERT INTO taxonomy_types (city_id, slug, is_required, use_for_map_styling)
VALUES ('tokyo-uuid', 'official-status', true, true);

INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex)
VALUES
  ('status-uuid', 'official', '#1976D2'),      -- Blue
  ('status-uuid', 'recognized', '#7B1FA2'),    -- Purple
  ('status-uuid', 'minority', '#616161');      -- Gray
```

### Frontend Implementation

#### Admin UI: Taxonomy Configuration

```tsx
// app/[locale]/admin/[citySlug]/taxonomies/page.tsx

export default async function TaxonomiesPage({ params }: { params: { citySlug: string } }) {
  const taxonomies = await getTaxonomyTypes(params.citySlug)

  return (
    <div>
      <h1>Language Classification System</h1>
      <p>Define how languages are categorized in {params.citySlug}</p>

      <TaxonomyList taxonomies={taxonomies} />
      <Button onClick={() => createNewTaxonomy()}>
        + Add Classification Type
      </Button>
    </div>
  )
}
```

#### Operator UI: Assign Taxonomies to Languages

```tsx
// app/[locale]/[citySlug]/languages/[id]/edit/page.tsx

export default async function EditLanguagePage({ params }) {
  const language = await getLanguage(params.id)
  const taxonomies = await getTaxonomyTypes(params.citySlug)

  return (
    <Form>
      <h2>Classify {language.endonym}</h2>

      {taxonomies.map(taxonomy => (
        <TaxonomySelector
          key={taxonomy.id}
          taxonomy={taxonomy}
          currentValues={language.taxonomies.filter(t => t.type_id === taxonomy.id)}
          required={taxonomy.is_required}
          multiple={taxonomy.allow_multiple}
        />
      ))}
    </Form>
  )
}
```

#### Map Filtering: Dynamic Filters

```tsx
// components/map/filters/TaxonomyFilters.tsx

export function TaxonomyFilters({ citySlug }: { citySlug: string }) {
  const taxonomies = useTaxonomies(citySlug, { useForFiltering: true })

  return (
    <div>
      {taxonomies.map(taxonomy => (
        <FilterSection key={taxonomy.id} title={taxonomy.name}>
          {taxonomy.values.map(value => (
            <Checkbox
              key={value.id}
              label={value.name}
              color={value.color_hex}
              onCheckedChange={(checked) => toggleFilter(taxonomy.id, value.id, checked)}
            />
          ))}
        </FilterSection>
      ))}
    </div>
  )
}
```

#### Map Styling: Dynamic Colors/Icons

```typescript
// lib/mapbox/layer-styles.ts

export async function generateLanguagePointLayer(citySlug: string) {
  const taxonomies = await getTaxonomyTypes(citySlug, { useForMapStyling: true })

  // Use first styling taxonomy for colors (e.g., "size" or "status")
  const colorTaxonomy = taxonomies.find(t => t.use_for_map_styling)

  if (!colorTaxonomy) {
    return defaultLayerStyle
  }

  // Build Mapbox expression dynamically
  const colorExpression: Expression = [
    'match',
    ['get', `taxonomy_${colorTaxonomy.slug}`],  // Property from GeoJSON
    ...colorTaxonomy.values.flatMap(v => [v.slug, v.color_hex]),
    '#CCCCCC'  // default gray
  ]

  const sizeExpression: Expression = [
    'match',
    ['get', `taxonomy_${colorTaxonomy.slug}`],
    ...colorTaxonomy.values.flatMap(v => [v.slug, v.icon_size_multiplier || 1.0]),
    1.0
  ]

  return {
    'circle-color': colorExpression,
    'circle-radius': ['*', 8, sizeExpression],
  }
}
```

---

## 2. Static Content Management System

### Problem Statement

Cities need to customize:
- **Pages**: About, Methodology, Contact, Team, Partners
- **Content**: Hero sections, text blocks, image galleries, video embeds
- **Assets**: Logos, hero images, partner logos
- **Branding**: Colors, fonts, footer text

### Solution: Lightweight Page Builder

#### Database Schema

```sql
-- ============================================
-- STATIC CONTENT MANAGEMENT
-- ============================================

-- Static Pages (About, Methodology, etc.)
CREATE TABLE static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- 'about', 'methodology', 'team', 'contact'
  template TEXT NOT NULL DEFAULT 'default', -- Which layout template to use

  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,

  -- SEO
  meta_image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  UNIQUE(city_id, slug)
);

-- Static Page Translations (title, meta description)
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

-- Page Sections (building blocks)
CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  static_page_id UUID NOT NULL REFERENCES static_pages(id) ON DELETE CASCADE,

  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero',           -- Large image with title overlay
    'text',           -- Rich text block
    'image',          -- Single image with caption
    'gallery',        -- Multiple images
    'video',          -- Embedded video
    'team',           -- Team member cards
    'partners',       -- Partner logos grid
    'stats',          -- Statistics cards
    'cta',            -- Call-to-action button
    'accordion',      -- FAQ-style expandable items
    'divider'         -- Visual separator
  )),

  display_order INTEGER NOT NULL DEFAULT 0,

  -- Section-specific configuration (JSON for flexibility)
  config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  --   hero: { "image_url": "...", "height": "large", "overlay_opacity": 0.5 }
  --   text: { "max_width": "prose", "alignment": "center" }
  --   gallery: { "columns": 3, "aspect_ratio": "16:9" }
  --   team: { "layout": "grid", "columns": 4 }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page Section Translations (localized content)
CREATE TABLE page_section_translations (
  page_section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),

  -- Content (structure varies by section_type)
  content JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  --   hero: { "title": "...", "subtitle": "...", "cta_text": "..." }
  --   text: { "body": "..." }  -- Markdown/HTML
  --   image: { "url": "...", "caption": "...", "alt": "..." }
  --   team: { "members": [{ "name": "...", "role": "...", "bio": "...", "photo_url": "..." }] }

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  PRIMARY KEY (page_section_id, locale)
);

-- Asset Storage (for Supabase Storage references)
CREATE TABLE city_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,

  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'logo', 'hero_image', 'page_image', 'partner_logo', 'team_photo', 'icon', 'document'
  )),

  -- Supabase Storage path
  storage_bucket TEXT NOT NULL DEFAULT 'city-assets',
  storage_path TEXT NOT NULL,             -- 'amsterdam/logos/main.svg'

  -- Metadata
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
```

#### Example: Amsterdam About Page

```sql
-- Create About page
INSERT INTO static_pages (city_id, slug, is_published)
VALUES ('amsterdam-uuid', 'about', true);

INSERT INTO static_page_translations (static_page_id, locale, title, meta_description)
VALUES
  ('about-uuid', 'en', 'About Amsterdam Language Map', 'Learn about our mission to document Amsterdam''s linguistic diversity'),
  ('about-uuid', 'nl', 'Over de Amsterdam Talenkaart', 'Lees over onze missie om de taalkundige diversiteit van Amsterdam te documenteren');

-- Section 1: Hero
INSERT INTO page_sections (static_page_id, section_type, display_order, config)
VALUES ('about-uuid', 'hero', 0, '{"height": "large", "overlay_opacity": 0.6}');

INSERT INTO page_section_translations (page_section_id, locale, content)
VALUES (
  'hero-section-uuid',
  'en',
  '{
    "title": "Celebrating Amsterdam''s 200+ Languages",
    "subtitle": "A collaborative map documenting the city''s incredible linguistic diversity",
    "image_url": "https://example.com/hero.jpg"
  }'
),
(
  'hero-section-uuid',
  'nl',
  '{
    "title": "Vieren van de 200+ talen van Amsterdam",
    "subtitle": "Een collaboratieve kaart die de ongelooflijke taalkundige diversiteit van de stad documenteert",
    "image_url": "https://example.com/hero.jpg"
  }'
);

-- Section 2: Text Introduction
INSERT INTO page_sections (static_page_id, section_type, display_order, config)
VALUES ('about-uuid', 'text', 1, '{"max_width": "prose", "alignment": "center"}');

INSERT INTO page_section_translations (page_section_id, locale, content)
VALUES (
  'text-section-uuid',
  'en',
  '{
    "body": "## Our Mission\n\nAmsterdam is home to over 200 languages, reflecting centuries of migration..."
  }'
);

-- Section 3: Team
INSERT INTO page_sections (static_page_id, section_type, display_order, config)
VALUES ('about-uuid', 'team', 2, '{"columns": 3, "layout": "grid"}');

INSERT INTO page_section_translations (page_section_id, locale, content)
VALUES (
  'team-section-uuid',
  'en',
  '{
    "members": [
      {
        "name": "Dr. Jane Smith",
        "role": "Project Lead",
        "bio": "Linguist specializing in urban multilingualism",
        "photo_url": "https://example.com/jane.jpg",
        "email": "jane@example.com"
      },
      {
        "name": "Ahmed Hassan",
        "role": "Community Coordinator",
        "bio": "Connecting with language communities across Amsterdam",
        "photo_url": "https://example.com/ahmed.jpg"
      }
    ]
  }'
);
```

#### Admin UI: Page Editor

```tsx
// app/[locale]/admin/[citySlug]/pages/[slug]/edit/page.tsx

export default async function EditPagePage({ params }) {
  const page = await getStaticPage(params.citySlug, params.slug)
  const sections = await getPageSections(page.id)

  return (
    <PageEditor>
      <PageHeader page={page} />

      <SectionList sections={sections}>
        {sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            onMoveUp={() => moveSectionUp(section.id)}
            onMoveDown={() => moveSectionDown(section.id)}
            onDelete={() => deleteSection(section.id)}
          />
        ))}
      </SectionList>

      <AddSectionMenu>
        <Button onClick={() => addSection('hero')}>+ Hero Section</Button>
        <Button onClick={() => addSection('text')}>+ Text Block</Button>
        <Button onClick={() => addSection('image')}>+ Image</Button>
        <Button onClick={() => addSection('team')}>+ Team Section</Button>
        <Button onClick={() => addSection('partners')}>+ Partners Grid</Button>
      </AddSectionMenu>
    </PageEditor>
  )
}
```

#### Frontend Rendering: Dynamic Page Builder

```tsx
// app/[locale]/[citySlug]/[pageSlug]/page.tsx

import { Hero, TextBlock, ImageSection, TeamSection, PartnersGrid } from '@/components/sections'

const SECTION_COMPONENTS = {
  hero: Hero,
  text: TextBlock,
  image: ImageSection,
  team: TeamSection,
  partners: PartnersGrid,
  // ... more section types
}

export default async function DynamicPage({ params }) {
  const page = await getStaticPage(params.citySlug, params.pageSlug, params.locale)
  const sections = await getPageSections(page.id, params.locale)

  return (
    <div>
      <Head>
        <title>{page.title}</title>
        <meta name="description" content={page.meta_description} />
      </Head>

      {sections.map((section) => {
        const Component = SECTION_COMPONENTS[section.section_type]
        return (
          <Component
            key={section.id}
            content={section.content}
            config={section.config}
          />
        )
      })}
    </div>
  )
}
```

---

## 3. Brand Customization

### Database Schema Extension

```sql
-- Add branding fields to cities table
ALTER TABLE cities ADD COLUMN branding JSONB DEFAULT '{
  "colors": {
    "primary": "#1976D2",
    "secondary": "#FFA726",
    "accent": "#7B1FA2"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "logo_url": "",
  "logo_dark_url": "",
  "favicon_url": "",
  "social_image_url": ""
}';
```

### Frontend Implementation

```tsx
// lib/branding.ts

export async function getCityBranding(citySlug: string) {
  const city = await getCity(citySlug)
  return city.branding
}

// app/[locale]/[citySlug]/layout.tsx

export default async function CityLayout({ params, children }) {
  const branding = await getCityBranding(params.citySlug)

  return (
    <html>
      <head>
        <link rel="icon" href={branding.favicon_url} />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${branding.colors.primary};
              --color-secondary: ${branding.colors.secondary};
              --color-accent: ${branding.colors.accent};
              --font-heading: ${branding.fonts.heading};
              --font-body: ${branding.fonts.body};
            }
          `
        }} />
      </head>
      <body>
        <Header logo={branding.logo_url} />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

---

## 4. Impact on Architecture

### Complexity Analysis

| Feature | MVP Without Customization | MVP With Customization | Difference |
|---------|---------------------------|------------------------|------------|
| Database Tables | 26 | 35 (+9) | +35% |
| Admin UI Screens | 12 | 18 (+6) | +50% |
| Development Time | 12-14 weeks | 16-19 weeks | +4-5 weeks |

### Per-City Database Decision

This customization architecture **significantly strengthens the case for per-city databases**:

#### Why Per-City Databases Make More Sense Now:

1. **Deep Customization = Less Shared Code**: With custom taxonomies and content, cities become more like separate instances
2. **Data Sovereignty**: Cities with custom content want full control and portability
3. **Performance**: Smaller databases query faster (no city_id filtering needed)
4. **Pricing Opportunity**: Charge premium for dedicated databases with full customization

#### Recommended Strategy:

**Phase 1 (MVP - Weeks 1-8)**:
- Build with shared database
- Implement database abstraction layer
- Support basic taxonomy customization

**Phase 2 (Post-MVP - Weeks 9-12)**:
- Test with 2-3 pilot cities
- Validate customization UX
- Identify shared vs. unique patterns

**Phase 3 (Scale - Week 13+)**:
- Offer tiered pricing:
  - **Starter**: Shared database, basic customization ($50/month)
  - **Professional**: Shared database, full customization ($150/month)
  - **Enterprise**: Dedicated database, full control ($500/month)

---

## 5. Implementation Priorities

### Must-Have for MVP (Weeks 1-8)

✅ **Flexible Taxonomy System**: Core to every city's needs
✅ **Basic Static Pages**: About, Methodology (using simple text sections)
✅ **Logo Upload**: City branding basics
✅ **Database Abstraction Layer**: Future-proof architecture

### Should-Have for Launch (Weeks 9-12)

✅ **Full Page Builder**: All section types
✅ **Asset Management**: Image uploads and organization
✅ **Brand Customization**: Colors, fonts, themes

### Nice-to-Have Post-Launch (Week 13+)

⏸️ **Advanced Sections**: Interactive maps, data visualizations
⏸️ **Version History**: Track page changes over time
⏸️ **A/B Testing**: Test different page variants

---

## 6. Code Reusability

### From Current Amsterdam App

**Nothing directly reusable** - current app has:
- Hardcoded language classifications
- Material-UI static pages
- No CMS functionality

**Reference patterns**:
- Filter UI patterns → Adapt for dynamic taxonomies
- Admin table views → Adapt for taxonomy management

---

## 7. Migration Path for Existing Cities

If Amsterdam wants to migrate to the new platform:

```sql
-- Step 1: Create taxonomy types matching current schema
INSERT INTO taxonomy_types (city_id, slug, is_required)
VALUES
  ('amsterdam-uuid', 'size', true),
  ('amsterdam-uuid', 'endangerment', false);

-- Step 2: Create taxonomy values
INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex)
VALUES
  ('size-type-uuid', 'small', '#FFA500'),
  ('size-type-uuid', 'medium', '#FFD700'),
  ('size-type-uuid', 'large', '#FF4500');

-- Step 3: Migrate existing language data
INSERT INTO language_taxonomies (language_id, taxonomy_value_id)
SELECT
  l.id,
  tv.id
FROM languages l
JOIN taxonomy_values tv ON tv.slug = l.size  -- Old hardcoded field
WHERE l.city_id = 'amsterdam-uuid';

-- Step 4: Drop old columns (after verification)
ALTER TABLE languages DROP COLUMN size;
ALTER TABLE languages DROP COLUMN endangerment_status;
```

---

## Summary

The flexible taxonomy and static content systems transform the platform from a rigid multi-tenant SaaS to a **highly customizable multi-instance platform**. This aligns with the goal of empowering cities to fully control their language mapping initiatives while sharing infrastructure.

**Key Tradeoffs**:
- ✅ **Pro**: Cities get deep customization they need
- ✅ **Pro**: Differentiates from competitors (if any exist)
- ✅ **Pro**: Higher pricing potential (custom = premium)
- ⚠️ **Con**: +4-5 weeks to MVP timeline
- ⚠️ **Con**: More complex admin UI
- ⚠️ **Con**: Harder to push shared updates to cities

**Recommendation**: Build this from day 1. It's fundamental to the product vision and retrofitting later would be much more expensive.
