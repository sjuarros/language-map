# Design Specifications
# Multi-City Language Mapping Platform

**Version:** 3.1
**Date:** October 29, 2025

---

## Table of Contents

1. [User Interface Architecture](#user-interface-architecture)
2. [Flexible Taxonomy System Design](#flexible-taxonomy-system-design)
3. [Static Content Management Design](#static-content-management-design)
4. [Brand Customization Design](#brand-customization-design)
5. [Internationalization (i18n) Design](#internationalization-i18n-design)
6. [AI Features Design](#ai-features-design)
7. [Map Design](#map-design)
8. [Component Structure](#component-structure)

---

## User Interface Architecture

### Three Main Interfaces + Superuser Panel

---

#### 0. **Superuser Panel** (Auth required, role: superuser)

```
┌─────────────────────────────────────────┐
│  Superuser Dashboard                    │
├─────────────────────────────────────────┤
│                                         │
│  🌍 All Cities                          │
│  ├─ Amsterdam (active)  [Manage]       │
│  ├─ Paris (active)      [Manage]       │
│  ├─ Toronto (pending)   [Manage]       │
│  └─ [+ Create New City]                │
│                                         │
│  👥 All Users (across cities)           │
│  └─ Recent activity                    │
│                                         │
│  📊 Platform Analytics                  │
│  ├─ Total cities: 3                    │
│  ├─ Total languages: 247               │
│  ├─ Total data points: 892             │
│  └─ Monthly map views: 45,234          │
│                                         │
│  ⚙️ Global Settings                     │
│  └─ Platform configuration             │
│                                         │
└─────────────────────────────────────────┘
```

**Features**:
- Create new cities
- Access any city's admin panel
- View platform-wide analytics
- Manage global settings
- Override any permission

---

#### 1. **Public Map Interface** (No auth required)

```
┌─────────────────────────────────────────┐
│  Amsterdam Language Map                 │
├─────────────────────────────────────────┤
│  [Map with language points]             │
│  - Filter by language family            │
│  - Search languages                     │
│  - Click points for details             │
│  - View community stories               │
│  - Toggle base layer styles             │
│                                         │
│  [About] [Methodology] [Data] [Login]  │
└─────────────────────────────────────────┘
```

**Features**:
- Interactive Mapbox map
- Language filtering and search
- Community story popups
- Layer style toggles (streets/satellite/dark)
- Responsive mobile design
- SEO-optimized pages
- Multi-language UI support

---

#### 2. **Operator Dashboard** (Auth required, role: operator)

```
┌─────────────────────────────────────────┐
│  Operator Dashboard - Amsterdam         │
├─────────────────────────────────────────┤
│                                         │
│  📊 Overview                            │
│  - 87 languages documented              │
│  - 344 data points                      │
│  - 23 needing descriptions              │
│  - Last updated: 2 hours ago            │
│                                         │
│  📝 Manage Data                         │
│  ├─ Languages       [+ Add Language]   │
│  │  └─ Search, filter, edit, delete    │
│  ├─ Data Points     [+ Add Point]      │
│  │  └─ Map-based adding                │
│  └─ Descriptions    [+ Add Story]      │
│     └─ Link to languages/neighborhoods │
│                                         │
│  📥 Import/Export                       │
│  ├─ Import CSV      [Upload]           │
│  ├─ Import GeoJSON  [Upload]           │
│  └─ Export Data     [Download]         │
│                                         │
│  🗺️ Preview Map                        │
│  📊 Data Quality Report                 │
│  📜 My Activity Log                     │
│                                         │
└─────────────────────────────────────────┘
```

**Features**:
- CRUD for languages, points, descriptions
- Bulk import/export (CSV, GeoJSON)
- Data validation & quality checks
- Map preview of changes before saving
- Activity log (personal)
- Search and filtering
- Keyboard shortcuts for power users

---

#### 3. **Admin Panel** (Auth required, role: admin)

```
┌─────────────────────────────────────────┐
│  Admin Panel - Amsterdam                │
├─────────────────────────────────────────┤
│                                         │
│  👥 User Management                     │
│  ├─ Operators (12)  [+ Invite User]    │
│  ├─ Admins (2)      [+ Invite Admin]   │
│  ├─ Pending Invites (1)                 │
│  └─ Role management, deactivate users   │
│                                         │
│  📊 Operator Dashboard                  │
│  └─ All operator features included     │
│                                         │
│  ⚙️ City Settings                       │
│  ├─ General                             │
│  │  └─ Name, slug, country             │
│  ├─ Map Configuration                   │
│  │  └─ Center, zoom, default style     │
│  ├─ Branding                            │
│  │  └─ Colors, logo, favicon           │
│  └─ Custom Domain (future)              │
│     └─ Point your own domain           │
│                                         │
│  📈 Analytics                           │
│  ├─ Map views: 12,345 this month        │
│  ├─ Top languages viewed                │
│  ├─ User activity                       │
│  └─ Data growth over time               │
│                                         │
│  📜 Audit Logs                          │
│  └─ All changes with who/when/what     │
│                                         │
└─────────────────────────────────────────┘
```

**Features**:
- User invitation system
- Role management (operator ↔ admin promotion)
- City configuration
- Custom branding (colors, logo)
- Analytics dashboard
- Security & audit logs
- All operator features
- Backup/restore tools (future)

---

## Flexible Taxonomy System Design

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

---

### Solution: Configurable Taxonomy System

Cities can define their own classification types and values with full translations and visual styling.

---

### Example Configuration: Amsterdam

#### Taxonomy Setup

**1. "Community Size" Taxonomy**

```sql
-- Create taxonomy type
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple, use_for_map_styling)
VALUES ('amsterdam-uuid', 'size', true, false, true);

INSERT INTO taxonomy_type_translations (taxonomy_type_id, locale, name)
VALUES
  ('size-uuid', 'en', 'Community Size'),
  ('size-uuid', 'nl', 'Gemeenschapsgrootte');

-- Values: Small, Medium, Large with colors and sizes
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
```

**2. "Endangerment Status" Taxonomy**

```sql
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple, use_for_filtering)
VALUES ('amsterdam-uuid', 'endangerment', false, false, true);

INSERT INTO taxonomy_values (taxonomy_type_id, slug, color_hex)
VALUES
  ('endangerment-uuid', 'safe', '#4CAF50'),            -- Green
  ('endangerment-uuid', 'vulnerable', '#FFC107'),      -- Yellow
  ('endangerment-uuid', 'endangered', '#FF5722');      -- Red
```

---

### Example Configuration: Tokyo

**Different taxonomies for different needs**

```sql
-- Tokyo's "Script Type" taxonomy (allows multiple - e.g., Japanese uses 3 scripts)
INSERT INTO taxonomy_types (city_id, slug, is_required, allow_multiple)
VALUES ('tokyo-uuid', 'script-type', true, true);

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

---

### Admin UI: Taxonomy Configuration

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

---

### Operator UI: Assign Taxonomies to Languages

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

---

### Map Filtering: Dynamic Filters

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

---

### Map Styling: Dynamic Colors/Icons

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

## Static Content Management Design

### Problem Statement

Cities need to customize:
- **Pages**: About, Methodology, Contact, Team, Partners
- **Content**: Hero sections, text blocks, image galleries, video embeds
- **Assets**: Logos, hero images, partner logos
- **Branding**: Colors, fonts, footer text

---

### Solution: Lightweight Page Builder

Cities can build custom pages using a section-based page builder with multiple content types.

---

### Section Types

#### 1. **Hero Section**
- Large image with title overlay
- Subtitle and CTA button
- Configurable height and overlay opacity

#### 2. **Text Section**
- Rich text blocks (Markdown/HTML)
- Configurable width (full, prose, narrow)
- Text alignment (left, center, right)

#### 3. **Image Section**
- Single image with caption
- Alt text for accessibility
- Configurable aspect ratio

#### 4. **Gallery Section**
- Multiple images in grid
- Configurable columns (2, 3, 4)
- Lightbox on click

#### 5. **Video Section**
- Embedded YouTube/Vimeo videos
- Responsive iframe

#### 6. **Team Section**
- Team member cards with photos
- Name, role, bio, contact info
- Grid or list layout

#### 7. **Partners Section**
- Partner logo grid
- Links to partner websites
- Grayscale hover effect

#### 8. **Stats Section**
- Statistics cards
- Number + label + description
- Icon support

#### 9. **CTA Section**
- Call-to-action button
- Centered or full-width
- Configurable link

#### 10. **Accordion Section**
- FAQ-style expandable items
- Q&A format

#### 11. **Divider Section**
- Visual separator between sections
- Line or spacing

---

### Admin UI: Page Editor

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

---

### Frontend Rendering: Dynamic Page Builder

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

### Example: Amsterdam About Page

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
      }
    ]
  }'
);
```

---

## Brand Customization Design

### Branding Configuration

Cities can customize their visual identity to match their brand.

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

---

### Admin UI: Branding Settings

```tsx
// app/[locale]/admin/[citySlug]/settings/branding/page.tsx

export default function BrandingSettingsPage() {
  return (
    <div>
      <h1>Brand Customization</h1>

      <section>
        <h2>Logo</h2>
        <ImageUpload
          label="Primary Logo"
          current={branding.logo_url}
          onUpload={(url) => updateBranding({ logo_url: url })}
        />
        <ImageUpload
          label="Dark Mode Logo (optional)"
          current={branding.logo_dark_url}
          onUpload={(url) => updateBranding({ logo_dark_url: url })}
        />
      </section>

      <section>
        <h2>Colors</h2>
        <ColorPicker
          label="Primary Color"
          value={branding.colors.primary}
          onChange={(color) => updateBranding({ colors: { ...branding.colors, primary: color }})}
        />
        <ColorPicker
          label="Secondary Color"
          value={branding.colors.secondary}
        />
        <ColorPicker
          label="Accent Color"
          value={branding.colors.accent}
        />
      </section>

      <section>
        <h2>Typography</h2>
        <FontSelector
          label="Heading Font"
          value={branding.fonts.heading}
          options={['Inter', 'Roboto', 'Montserrat', 'Open Sans']}
        />
        <FontSelector
          label="Body Font"
          value={branding.fonts.body}
        />
      </section>

      <section>
        <h2>Favicon & Social</h2>
        <ImageUpload label="Favicon" current={branding.favicon_url} />
        <ImageUpload label="Social Media Preview Image" current={branding.social_image_url} />
      </section>
    </div>
  )
}
```

---

### Frontend Application

```tsx
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

## Internationalization (i18n) Design

### Frontend i18n Setup

The platform uses **next-intl** for internationalization, with locale routing built into Next.js.

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'nl' }, { locale: 'fr' }]
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.Node
  params: { locale: string }
}) {
  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

---

### Translation Files

**messages/en.json**:
```json
{
  "common": {
    "language": "Language",
    "languages": "Languages",
    "city": "City",
    "cities": "Cities",
    "search": "Search",
    "filter": "Filter",
    "save": "Save",
    "cancel": "Cancel"
  },
  "map": {
    "title": "Language Map",
    "legendTitle": "Language Families",
    "clusterCount": "{count} languages"
  },
  "operator": {
    "dashboard": "Operator Dashboard",
    "addLanguage": "Add Language",
    "importData": "Import Data"
  }
}
```

**messages/nl.json**:
```json
{
  "common": {
    "language": "Taal",
    "languages": "Talen",
    "city": "Stad",
    "cities": "Steden",
    "search": "Zoeken",
    "filter": "Filteren",
    "save": "Opslaan",
    "cancel": "Annuleren"
  },
  "map": {
    "title": "Talenkaart",
    "legendTitle": "Taalfamilies",
    "clusterCount": "{count} talen"
  },
  "operator": {
    "dashboard": "Operator Dashboard",
    "addLanguage": "Taal Toevoegen",
    "importData": "Gegevens Importeren"
  }
}
```

---

### Database Query with Translation

```typescript
// app/[locale]/[city]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getLocale } from 'next-intl/server'

export default async function CityPage({ params }) {
  const locale = await getLocale()
  const supabase = createClient()

  // Query with locale-specific translations
  const { data: languages } = await supabase
    .from('languages')
    .select(`
      id,
      iso_639_3_code,
      endonym,
      translations:language_translations!inner(
        name
      )
    `)
    .eq('city_id', params.cityId)
    .eq('translations.locale', locale)

  return <LanguageMap languages={languages} />
}
```

---

### Utility Function for Translations

```typescript
// lib/i18n/getTranslation.ts
export async function getTranslation(
  table: string,
  id: string,
  locale: string,
  fallbackLocale = 'en'
) {
  const supabase = createClient()

  const { data } = await supabase
    .from(`${table}_translations`)
    .select('*')
    .eq(`${table}_id`, id)
    .eq('locale', locale)
    .single()

  // Fallback to English if translation not found
  if (!data) {
    const { data: fallback } = await supabase
      .from(`${table}_translations`)
      .select('*')
      .eq(`${table}_id`, id)
      .eq('locale', fallbackLocale)
      .single()

    return fallback
  }

  return data
}
```

---

## AI Features Design

### 1. AI Description Generation

#### Operator UI for AI Generation

```tsx
// app/operator/[city]/descriptions/generate/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateDescription } from './actions'

export default function GenerateDescriptionPage({ params }) {
  const [language, setLanguage] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await generateDescription({
      cityId: params.cityId,
      languageId: language,
      neighborhoodId: neighborhood
    })
    setLoading(false)
    // Show preview, allow edit before saving
  }

  return (
    <div>
      <h1>Generate AI Description</h1>
      {/* Language selector */}
      {/* Neighborhood selector */}
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Description'}
      </Button>
    </div>
  )
}
```

---

#### Admin UI for Source Management

```tsx
// app/admin/[city]/ai-sources/page.tsx
export default function AISourcesPage() {
  return (
    <div>
      <h1>AI Source Management</h1>

      <section>
        <h2>Whitelist (Trusted Sources)</h2>
        <ul>
          <li>wikipedia.org - General encyclopedia</li>
          <li>ethnologue.com - Language data</li>
        </ul>
        <Button>Add to Whitelist</Button>
      </section>

      <section>
        <h2>Blacklist (Avoid These Sources)</h2>
        <ul>
          <li>unreliable-blog.com - Unverified claims</li>
        </ul>
        <Button>Add to Blacklist</Button>
      </section>
    </div>
  )
}
```

---

### 2. AI-Assisted Translation

#### City Configuration for AI Translation

```tsx
// app/admin/[city]/settings/translation/page.tsx
'use client'

export default function TranslationSettingsPage({ cityId }) {
  const [enabled, setEnabled] = useState(false)
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4-turbo')
  const [apiKey, setApiKey] = useState('')

  async function handleSave() {
    await updateCityTranslationSettings({
      cityId,
      ai_translation_enabled: enabled,
      ai_translation_provider: provider,
      ai_translation_model: model,
      ai_translation_api_key: apiKey  // Will be encrypted server-side
    })
  }

  return (
    <div>
      <h1>AI Translation Settings</h1>

      <div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
        <label>Enable AI-assisted translation</label>
      </div>

      {enabled && (
        <>
          <Select value={provider} onValueChange={setProvider}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom (OpenAI-compatible)</option>
          </Select>

          <Select value={model} onValueChange={setModel}>
            {provider === 'openai' && (
              <>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (cheaper)</option>
              </>
            )}
          </Select>

          <input
            type="password"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          <p className="text-sm text-muted">
            API key will be encrypted and stored securely
          </p>
        </>
      )}

      <Button onClick={handleSave}>Save Settings</Button>
    </div>
  )
}
```

---

#### Operator UI for Translation Management

```tsx
// app/operator/[city]/languages/[id]/translations/page.tsx
export default function LanguageTranslationsPage({ params }) {
  const { language, cityLocales } = useLanguageData(params.id)

  return (
    <div>
      <h1>Translations for {language.endonym}</h1>
      <p className="text-muted">Endonym is not translated: {language.endonym}</p>

      {cityLocales.map(locale => (
        <div key={locale.code}>
          <h3>{locale.name_native}</h3>

          <TranslationField
            languageId={params.id}
            locale={locale.code}
            label="Language Name"
            field="name"
          />
        </div>
      ))}
    </div>
  )
}

function TranslationField({ languageId, locale, label, field }) {
  const [translation, setTranslation] = useState('')
  const [isAiTranslated, setIsAiTranslated] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAiTranslate() {
    setLoading(true)
    const result = await translateText({
      cityId: params.cityId,
      text: language[field],  // Original text
      sourceLocale: 'en',
      targetLocale: locale,
      context: `language_${field}`
    })
    setTranslation(result.translatedText)
    setIsAiTranslated(true)
    setLoading(false)
  }

  return (
    <div>
      <label>{label}</label>
      <textarea
        value={translation}
        onChange={(e) => {
          setTranslation(e.target.value)
          setIsAiTranslated(false)  // Manual edit removes AI flag
        }}
      />

      {isAiTranslated && (
        <div className="bg-yellow-50 p-2 text-sm">
          AI-translated - please review and edit if needed
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleAiTranslate} disabled={loading}>
          {loading ? 'Translating...' : 'AI Translate'}
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}
```

---

#### Bulk Translation Feature

```tsx
// app/operator/[city]/translations/bulk/page.tsx
export default function BulkTranslationPage() {
  const [selectedLocale, setSelectedLocale] = useState('nl')
  const [translationType, setTranslationType] = useState('language_names')

  async function handleBulkTranslate() {
    // Find all untranslated items for this locale
    const { data: untranslated } = await supabase
      .from('languages')
      .select('id, name, endonym')
      .eq('city_id', cityId)
      .not('id', 'in',
        supabase
          .from('language_translations')
          .select('language_id')
          .eq('locale', selectedLocale)
      )

    // Translate each one
    for (const language of untranslated) {
      const result = await translateText({
        cityId,
        text: language.name,
        sourceLocale: 'en',
        targetLocale: selectedLocale,
        context: 'language_name'
      })

      // Save with AI flag
      await supabase
        .from('language_translations')
        .insert({
          language_id: language.id,
          locale: selectedLocale,
          name: result.translatedText,
          is_ai_translated: true,
          ai_model: result.model,
          ai_translated_at: new Date().toISOString()
        })
    }

    alert('Bulk translation complete! Please review all translations.')
  }

  return (
    <div>
      <h1>Bulk AI Translation</h1>

      <Select value={selectedLocale} onValueChange={setSelectedLocale}>
        {cityLocales.map(locale => (
          <option key={locale.code} value={locale.code}>
            {locale.name_native}
          </option>
        ))}
      </Select>

      <Select value={translationType} onValueChange={setTranslationType}>
        <option value="language_names">Language Names</option>
        <option value="descriptions">Descriptions</option>
        <option value="neighborhood_names">Neighborhood Names</option>
      </Select>

      <Button onClick={handleBulkTranslate}>
        Start Bulk Translation
      </Button>

      <div className="text-sm text-muted mt-4">
        ⚠️ This will translate all missing items. Review carefully afterward.
      </div>
    </div>
  )
}
```

---

## Map Design

### Interactive Map Component

```typescript
// components/map/LanguageMap.tsx
'use client'

import { useState, useEffect } from 'react'
import Map, { Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export function LanguageMap({ city }: { city: string }) {
  const [geojson, setGeojson] = useState(null)

  useEffect(() => {
    fetch(`/${city}/api/geojson`)
      .then(res => res.json())
      .then(setGeojson)
  }, [city])

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: 4.9041,
        latitude: 52.3676,
        zoom: 10
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {geojson && (
        <Source id="languages" type="geojson" data={geojson} cluster clusterRadius={50}>
          {/* Clusters */}
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#1976d2',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20, 10,
                30, 50,
                40
              ]
            }}
          />

          {/* Individual points */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': '#1976d2',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />
        </Source>
      )}
    </Map>
  )
}
```

---

## Component Structure

### Recommended Component Organization

```
components/
├── map/
│   ├── LanguageMap.tsx           # Main map component
│   ├── filters/
│   │   ├── TaxonomyFilters.tsx   # Dynamic taxonomy-based filters
│   │   └── SearchFilter.tsx      # Language search
│   ├── popups/
│   │   └── LanguagePopup.tsx     # Marker click popup
│   └── layer-styles.ts           # Dynamic map styling
│
├── sections/                      # CMS page sections
│   ├── Hero.tsx
│   ├── TextBlock.tsx
│   ├── ImageSection.tsx
│   ├── Gallery.tsx
│   ├── TeamSection.tsx
│   └── PartnersGrid.tsx
│
├── ui/                            # Shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   └── ...
│
└── forms/
    ├── LanguageForm.tsx
    ├── TaxonomySelector.tsx
    └── TranslationField.tsx
```

---

**Document Status**: Complete design specification
**Next Document**: implementation-plan.md (implementation roadmap)

