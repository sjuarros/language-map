# Multi-City Language Mapping Platform - Strategic Plan
## UPDATED BASED ON KEY DECISIONS

## Executive Summary

**Vision**: Build an independent, highly customizable multi-city platform that enables cities worldwide to document and visualize their linguistic diversity. Starting with Amsterdam, the platform is designed from day 1 to support multiple cities with deep customization capabilities.

**Approach**: Build completely new application using modern architecture, designed for multi-instance deployment with flexible taxonomies, static content management, and per-city branding.

**Timeline**: 16-19 weeks for MVP (Minimum Viable Product) - includes i18n, AI generation, multi-city support, flexible taxonomies, and content management

**Key Innovation**:
- **Flexible Classification System**: Cities define their own language taxonomies (e.g., Amsterdam: Size/Status; Tokyo: Script Type/Official Status)
- **Static Content Management**: Built-in CMS for About pages, methodology, team sections, and custom content
- **Per-City Branding**: Custom logos, colors, and themes
- **Multi-Database Ready**: Abstraction layer enables future data sovereignty options

**Architecture**: Multi-instance platform where each city can deeply customize their language classification, content, and branding while sharing infrastructure. See `docs/CITY_CUSTOMIZATION_ARCHITECTURE.md` for detailed customization capabilities.

---

## 🎯 Key Decisions Made

### Strategic Decisions ✅
- **Branding**: Independent platform (not tied to ELA)
- **Multi-City**: Build for multiple cities from day 1
- **Target Cities**: Flexible - any city can be onboarded
- **Business Model**: To be determined (options left open)
- **Development**: Solo project (timeline adjusted accordingly)

### Technical Decisions ✅
- **Census Overlays**: Skipped for MVP (simplifies scope significantly)
- **User Roles**: Superuser + Admin + Operator (three-tier hierarchy)
- **Launch Deadline**: Flexible, no hard deadline
- **i18n Support**: Built-in from day 1 (database + frontend)
- **Geographic Hierarchy**: Structured cities → districts → neighborhoods
- **World Data**: Structured world regions and countries tables
- **Multi-City Access**: Users can have permissions for multiple cities
- **Multi-City Views**: Single URL can display data from multiple cities
- **AI Descriptions**: Support for AI-generated descriptions with source management
- **Flexible Taxonomies**: Cities define custom language classification systems (replaces hardcoded enums)
- **Static Content CMS**: Built-in page builder for About, Methodology, and custom pages
- **Per-City Branding**: Custom logos, colors, fonts configurable per city
- **Database Abstraction**: Abstraction layer from day 1 for future multi-database support

### Pending Decisions ⏸️
- **URL Structure**: Subdomain vs path-based (recommend deciding before Phase 1)
- **Monetization Strategy**: Can be decided post-launch
- **Default Languages**: Which UI languages to support initially (suggest: English, Dutch, French)

---

## 🏗️ Enhanced Architecture with i18n and Geographic Hierarchy

### Database Schema Design

#### Core Tables with i18n Support

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
-- See docs/CITY_CUSTOMIZATION_ARCHITECTURE.md for detailed explanation

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
-- See docs/CITY_CUSTOMIZATION_ARCHITECTURE.md for detailed explanation

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

#### Row-Level Security Policies (Updated for Multi-City Access)

```sql
-- Enable RLS on all tables
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

-- ============================================
-- CITIES TABLE POLICIES
-- ============================================

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

-- ============================================
-- USER_PROFILES TABLE POLICIES
-- ============================================

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

-- ============================================
-- CITY_USERS TABLE POLICIES (Multi-City Access)
-- ============================================

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

-- ============================================
-- LANGUAGES TABLE POLICIES
-- ============================================

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

-- ============================================
-- LANGUAGE_POINTS TABLE POLICIES
-- ============================================

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

-- ============================================
-- DESCRIPTIONS TABLE POLICIES
-- ============================================

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

-- ============================================
-- AI_SOURCES TABLE POLICIES
-- ============================================

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

-- ============================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================

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

#### Database Indexes (Critical for Performance)

```sql
-- ============================================
-- GEOSPATIAL INDEXES
-- ============================================

-- CRITICAL for map performance!
CREATE INDEX idx_language_points_geom ON language_points USING GIST (geom);

-- ============================================
-- TRANSLATION INDEXES (i18n lookups)
-- ============================================

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

-- ============================================
-- GEOGRAPHIC HIERARCHY INDEXES
-- ============================================

CREATE INDEX idx_countries_world_region ON countries(world_region_id);
CREATE INDEX idx_cities_country ON cities(country_id);
CREATE INDEX idx_districts_city ON districts(city_id);
CREATE INDEX idx_neighborhoods_district ON neighborhoods(district_id);
CREATE INDEX idx_language_points_neighborhood ON language_points(neighborhood_id);

-- ============================================
-- CITY-BASED QUERIES
-- ============================================

CREATE INDEX idx_languages_city ON languages(city_id);
CREATE INDEX idx_language_points_city ON language_points(city_id);
CREATE INDEX idx_descriptions_city ON descriptions(city_id);
CREATE INDEX idx_ai_sources_city ON ai_sources(city_id);
CREATE INDEX idx_ai_generation_log_city ON ai_generation_log(city_id);

-- ============================================
-- LANGUAGE LOOKUPS
-- ============================================

CREATE INDEX idx_language_points_language ON language_points(language_id);
CREATE INDEX idx_descriptions_language ON descriptions(language_id);
CREATE INDEX idx_languages_family ON languages(language_family_id);
CREATE INDEX idx_languages_country_origin ON languages(country_of_origin_id);

-- ============================================
-- USER & PERMISSIONS
-- ============================================

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_city_users_city ON city_users(city_id);
CREATE INDEX idx_city_users_user ON city_users(user_id);
CREATE INDEX idx_city_users_role ON city_users(role);

-- Composite index for permission checks
CREATE INDEX idx_city_users_user_city ON city_users(user_id, city_id);

-- ============================================
-- AI GENERATION
-- ============================================

CREATE INDEX idx_descriptions_ai_generated ON descriptions(is_ai_generated);
CREATE INDEX idx_descriptions_reviewed ON descriptions(reviewed_by, reviewed_at);
CREATE INDEX idx_ai_generation_log_language ON ai_generation_log(language_id);
CREATE INDEX idx_ai_generation_log_status ON ai_generation_log(status);
CREATE INDEX idx_ai_sources_list_type ON ai_sources(list_type);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_city ON audit_logs(city_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);

-- ============================================
-- LOOKUP PERFORMANCE
-- ============================================

-- ISO codes for language/country lookups
CREATE INDEX idx_languages_iso_code ON languages(iso_639_3_code);
CREATE INDEX idx_countries_iso_2 ON countries(iso_code_2);
CREATE INDEX idx_countries_iso_3 ON countries(iso_code_3);
```

---

## 🎨 User Interface Architecture

### Three Main Interfaces + Superuser Panel

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
- Multi-language UI support (future)

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

## 🛠️ Technology Stack (Confirmed)

### **Core Stack**

```typescript
// Frontend + Backend Framework
Next.js 14 (App Router)  // React Server Components + Server Actions
React 18                 // UI library
TypeScript 5            // Type safety

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

### **Why This Stack?**

**Next.js 14 App Router**:
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

## 📐 Implementation Considerations (Updated)

### **1. Database Architecture: Shared vs Multi-Database Strategy**

**Context**: Cities may have data sovereignty concerns:
- "Our data must stay in our country" (GDPR compliance)
- "We want full database access for our own analytics"
- "What if we want to self-host later?"

**Chosen Approach**: **Two-Phase Strategy with Abstraction Layer**

#### **Phase 1 (MVP - Weeks 1-14)**: Single Shared Database ✅

```
┌─────────────────────────────────────┐
│   Single Supabase Project           │
│                                      │
│  ├─ Amsterdam data (RLS isolation)  │
│  ├─ Paris data (RLS isolation)      │
│  └─ Berlin data (RLS isolation)     │
└─────────────────────────────────────┘
```

**Benefits**:
- ✅ Fast MVP launch (12-14 weeks)
- ✅ Lower initial costs ($25/month base)
- ✅ Simpler development and debugging
- ✅ Centralized user management
- ✅ Easy platform-wide analytics

#### **Phase 9 (Post-MVP - Optional)**: Multi-Database Support ✅

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Supabase EU      │  │ Supabase US      │  │ Supabase Asia    │
│ Amsterdam, Paris │  │ NYC, Toronto     │  │ Tokyo (dedicated)│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Benefits**:
- ✅ Data sovereignty per city/region
- ✅ GDPR compliance (data residency)
- ✅ Exit strategy (cities can export/self-host)
- ✅ Failure isolation
- ✅ Premium revenue opportunity

#### **Critical: Database Abstraction Layer (Build Day 1)** 🎯

To enable future migration without rewriting app code, implement routing layer from the start:

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

**Migration Path** (When city demands dedicated database):

1. Spin up new Supabase project
2. Run schema migrations on new database
3. Export city data from shared database
4. Import to dedicated database
5. Update `cityDatabaseConfig` environment variables
6. Zero-downtime switchover via routing change
7. Monitor for 24h, then clean up old data

**Monetization Opportunity**:
- **Free/Basic**: Shared database (up to 3 cities)
- **Pro ($99/mo)**: Regional database (GDPR compliant)
- **Enterprise ($499/mo)**: Dedicated database or self-hosted option

**Complexity Impact**:
- Lines of code: ~200-300 (routing layer)
- Timeline impact: +0 weeks (build correctly from day 1)
- Future migration: +3-4 weeks when needed

📚 **Detailed analysis**: See `docs/MULTI_DATABASE_ARCHITECTURE.md` for:
- Complete architecture comparison (4 options)
- Cost analysis per approach
- User authentication federation strategy
- Schema migration management
- Monitoring and observability
- Decision matrix

---

### **2. Multi-Tenancy Model (Multi-City from Day 1)**

**URL Structure with Multi-City Support**:

The platform supports both **single-city** and **multi-city** views in URLs using query parameters.

**Option A: Path-based** (Recommended for solo dev - simpler to start)

**Single City Views**:
```
language-map.org/amsterdam              → Amsterdam only
language-map.org/paris                  → Paris only
language-map.org/operator/amsterdam     → Amsterdam operator dashboard
language-map.org/admin/amsterdam        → Amsterdam admin panel
language-map.org/superuser              → Superuser global dashboard
```

**Multi-City Views** (query parameters):
```
language-map.org/map?cities=amsterdam,paris
  → Combined map showing both Amsterdam and Paris data

language-map.org/map?cities=amsterdam,paris,berlin
  → Combined map showing three cities

language-map.org/amsterdam?compare=paris
  → Amsterdam map with Paris comparison overlay

language-map.org/europe?region=western-europe
  → All cities in Western Europe (requires region metadata)
```

**With i18n Support**:
```
language-map.org/en/amsterdam           → English UI
language-map.org/nl/amsterdam           → Dutch UI
language-map.org/fr/paris               → French UI
```

✅ Simpler DNS setup (one domain)
✅ Easier to develop locally
✅ Single deployment
✅ Multi-city views via query params
✅ i18n with locale prefix
❌ Slightly longer URLs

**Option B: Subdomain**
```
amsterdam.language-map.org              → Amsterdam public map
paris.language-map.org                  → Paris public map
map.language-map.org?cities=amsterdam,paris → Multi-city view
en.amsterdam.language-map.org           → English UI for Amsterdam
```
✅ Cleaner separation
✅ Easier for custom domains later
❌ More complex DNS setup
❌ Subdomain wildcard SSL certificate needed
❌ More complex multi-city routing

**Recommendation**: Start with **Option A (path-based)** with i18n locale prefix and multi-city query params. Much simpler for solo development and more flexible.

### **2. Three-Tier User Hierarchy with Multi-City Access**

**User Roles**:
```
Superuser (you)
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

**Multi-City Access Example**:
```
User: sarah@example.com
Role: Operator
Cities: Amsterdam, Paris, Berlin

→ Sarah can edit language data for all three cities
→ Sarah sees unified dashboard with city selector
→ Sarah's changes are tracked per city in audit logs
```

**Authentication Flow**:
```
1. Superuser creates city in panel
2. Superuser or Admin invites user via email, grants city access
3. User receives magic link
4. User signs up with Supabase Auth
5. Profile created with role (no city_id - multi-city!)
6. city_users junction table stores city access grants
7. RLS policies check city_users table for permissions
```

**Implementation**:
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

### **3. Data Import Strategy**

**From Amsterdam Airtable**:
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
    endangerment_status: mapEndangermentStatus(record.get('Status')),
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
    size: record.get('Size')?.toLowerCase(),
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

**CSV Import for New Cities** (in operator UI):
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

### **4. Map Tile Strategy (Simplified)**

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

**Map Component**:
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

### **5. Performance Optimization**

**Database Indexes** (already included above):
```sql
CREATE INDEX idx_language_points_geom ON language_points USING GIST (geom);
CREATE INDEX idx_languages_city ON languages(city_id);
-- etc.
```

**Caching Strategy**:
```
Layer 1 (Browser): React Query cache (5 min)
Layer 2 (Edge): Vercel Edge cache (5 min, stale-while-revalidate)
Layer 3 (Database): Supabase connection pooling
Layer 4 (CDN): Mapbox tile cache (automatic)
```

**Next.js Optimizations**:
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

### **6. Internationalization (i18n) Implementation**

**Frontend i18n Setup**:

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

**Translation Files** (`messages/en.json`, `messages/nl.json`, etc.):
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

**Database Query with Translation** (Server Component):
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
      endangerment_status,
      translations:language_translations!inner(
        name,
        endonym
      )
    `)
    .eq('city_id', params.cityId)
    .eq('translations.locale', locale)

  return <LanguageMap languages={languages} />
}
```

**Utility Function for Translations**:
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

**Technology Stack Addition**:
```typescript
// Internationalization
next-intl              // Next.js i18n library
@formatjs/intl-locale  // Locale data
```

### **7. AI Description Generation Implementation**

**Operator UI for AI Generation**:
```typescript
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

**Server Action for AI Generation**:
```typescript
// app/operator/[city]/descriptions/generate/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

export async function generateDescription({
  cityId,
  languageId,
  neighborhoodId
}: {
  cityId: string
  languageId: string
  neighborhoodId?: string
}) {
  const supabase = createClient()

  // Get AI source whitelist/blacklist for this city
  const { data: sources } = await supabase
    .from('ai_sources')
    .select('url, list_type')
    .eq('city_id', cityId)

  const whitelist = sources
    ?.filter(s => s.list_type === 'whitelist')
    .map(s => s.url)

  const blacklist = sources
    ?.filter(s => s.list_type === 'blacklist')
    .map(s => s.url)

  // Get language and neighborhood info
  const { data: language } = await supabase
    .from('languages')
    .select('*, translations:language_translations(*)')
    .eq('id', languageId)
    .single()

  // Build prompt
  const prompt = `Generate a community description for ${language.translations[0].name} speakers...

  Sources to use: ${whitelist?.join(', ') || 'any reliable sources'}
  Sources to avoid: ${blacklist?.join(', ') || 'none'}

  ...`

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are a linguist writing community descriptions.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  })

  const generatedText = response.choices[0].message.content

  // Log the generation
  await supabase.from('ai_generation_log').insert({
    city_id: cityId,
    language_id: languageId,
    model: 'gpt-4-turbo',
    prompt,
    sources_used: whitelist,
    token_count: response.usage?.total_tokens,
    status: 'success'
  })

  return { text: generatedText }
}
```

**Admin UI for Source Management**:
```typescript
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

### **8. AI-Assisted Translation Implementation**

**City Configuration for AI Translation**:

Cities can configure AI translation settings independently in their admin panel.

```typescript
// app/admin/[city]/settings/translation/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'

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
            {provider === 'anthropic' && (
              <>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
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

**City Locale Configuration**:

Admins can enable/disable specific locales for their city.

```typescript
// app/admin/[city]/settings/locales/page.tsx
export default async function LocaleSettingsPage({ params }) {
  const supabase = createClient()

  // Get all available locales
  const { data: allLocales } = await supabase
    .from('locales')
    .select('*')
    .eq('is_active', true)

  // Get enabled locales for this city
  const { data: cityLocales } = await supabase
    .from('city_locales')
    .select('locale, is_enabled')
    .eq('city_id', params.cityId)

  return (
    <div>
      <h1>Available Languages</h1>

      {allLocales.map(locale => {
        const isEnabled = cityLocales?.find(cl => cl.locale === locale.code)?.is_enabled

        return (
          <div key={locale.code}>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => toggleLocale(locale.code, checked)}
            />
            <label>{locale.name_native} ({locale.name_english})</label>
          </div>
        )
      })}
    </div>
  )
}
```

**AI Translation Server Action**:

```typescript
// lib/ai/translate.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'

export async function translateText({
  cityId,
  text,
  sourceLocale,
  targetLocale,
  context
}: {
  cityId: string
  text: string
  sourceLocale: string
  targetLocale: string
  context?: string  // e.g., "language_name", "city_description", etc.
}) {
  const supabase = createClient()

  // Get city AI translation settings
  const { data: city } = await supabase
    .from('cities')
    .select('ai_translation_enabled, ai_translation_provider, ai_translation_model, ai_translation_api_key_encrypted')
    .eq('id', cityId)
    .single()

  if (!city?.ai_translation_enabled) {
    throw new Error('AI translation not enabled for this city')
  }

  // Decrypt API key
  const apiKey = decrypt(city.ai_translation_api_key_encrypted)

  // Build prompt based on context
  const systemPrompt = context === 'language_name'
    ? 'You are a linguist translating language names. Provide only the translated name, no explanations.'
    : 'You are a professional translator. Provide accurate, natural translations.'

  const userPrompt = `Translate the following text from ${sourceLocale} to ${targetLocale}:\n\n${text}`

  let translatedText: string

  // Call appropriate AI provider
  if (city.ai_translation_provider === 'openai') {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: city.ai_translation_model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3  // Lower temperature for more consistent translations
    })
    translatedText = response.choices[0].message.content
  } else if (city.ai_translation_provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: city.ai_translation_model,
      max_tokens: 1024,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ]
    })
    translatedText = response.content[0].text
  }

  return {
    translatedText,
    model: city.ai_translation_model,
    sourceLocale,
    targetLocale
  }
}
```

**Operator UI for Translation Management**:

```typescript
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

  async function handleSave() {
    await supabase
      .from('language_translations')
      .upsert({
        language_id: languageId,
        locale,
        [field]: translation,
        is_ai_translated: isAiTranslated,
        ai_model: isAiTranslated ? result.model : null,
        ai_translated_at: isAiTranslated ? new Date().toISOString() : null
      })
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

**Bulk Translation Feature**:

```typescript
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

### **9. Solo Development Optimizations**

**Adjusted Timeline** (realistic for solo with i18n and AI):
- Week 1-2: Database + Auth + i18n setup
- Week 3-4: Operator dashboard (CRUD operations)
- Week 5-6: Public map with translations
- Week 7-8: Admin panel + AI generation
- Week 9-10: Multi-city views + testing
- Week 11-12: Amsterdam import + polish

**Work Efficiency Tips**:
1. **Use Shadcn/ui** - Copy-paste components, don't build from scratch
2. **Server Actions** - Skip API route boilerplate
3. **Supabase Studio** - Visual database editor
4. **v0.dev** (optional) - AI-generated UI components
5. **Cursor/Copilot** - AI coding assistance
6. **Small commits** - Deploy often, test incrementally

**Minimum Viable Features** (launch faster):
- ✅ Core CRUD operations
- ✅ Map visualization
- ✅ User management
- ✅ CSV import
- ⏸️ Skip analytics dashboard (add later)
- ⏸️ Skip audit logs UI (data is logged, UI later)
- ⏸️ Skip advanced search (basic search first)

---

## 🚀 Development Phases (Updated for i18n + AI + Multi-City)

### **Phase 1: Foundation & i18n (Weeks 1-3)**

**Goal**: Database, auth, i18n infrastructure, basic layouts

**Week 1 - Database & i18n Setup**:
- [ ] Day 1: Set up Next.js 14 + TypeScript + next-intl
- [ ] Day 2: Configure Supabase, create core database schema
- [ ] Day 3: **Build database abstraction layer** (`lib/database/client.ts` with `getDatabaseClient()`)
- [ ] Day 4: Create translation tables (locales, world regions, countries, cities)
- [ ] Day 5: Create geographic hierarchy (districts, neighborhoods)
- [ ] Day 6: Seed reference data (world regions, countries in EN/NL/FR)

**Week 2 - Auth & Multi-City Permissions**:
- [ ] Day 6: Implement RLS policies for multi-city access
- [ ] Day 7: Test RLS security with multiple scenarios
- [ ] Day 8: Set up Supabase Auth, create auth pages (login, signup)
- [ ] Day 9: User invitation system with city_users junction table
- [ ] Day 10: Middleware for route protection + multi-city checks

**Week 3 - Layouts & City Management**:
- [ ] Day 11: Create i18n-aware layouts (locale routing)
- [ ] Day 12: Superuser panel - city creation with translations
- [ ] Day 13: Admin panel - city selector for multi-city users
- [ ] Day 14: Operator panel - city selector
- [ ] Day 15: Test all authentication flows + i18n switching

**Deliverable**: ✅ Multi-city infrastructure with i18n support, users can sign up and access multiple cities

---

### **Phase 2: Reference Data & Operator CRUD (Weeks 4-6)**

**Goal**: Geographic hierarchy, flexible taxonomies, and language data management

**Week 4 - Districts, Neighborhoods & Taxonomies**:
- [ ] Day 16-17: District management UI (CRUD with translations)
- [ ] Day 18: Neighborhood management UI (CRUD with translations)
- [ ] Day 19: **Taxonomy types management** (create Size, Status, etc. with translations)
- [ ] Day 20: **Taxonomy values management** (define values with colors/icons)

**Week 5 - Languages with Flexible Classification**:
- [ ] Day 21: Language family management (CRUD with translations)
- [ ] Day 22: Language management - basic CRUD with taxonomy assignment UI
- [ ] Day 23: Language translations UI (add/edit names/endonyms per locale)
- [ ] Day 24: Language points management (table view with neighborhood picker)
- [ ] Day 25: **Test taxonomy filtering and map styling**

**Week 6 - Descriptions**:
- [ ] Day 26: Descriptions management (CRUD with translations)
- [ ] Day 27: Description translations UI (multi-language text editor)
- [ ] Day 28: Test all operator CRUD flows

**Deliverable**: ✅ Operators can manage geography, define custom taxonomies, and manage multilingual language data

---

### **Phase 3: Data Import & AI Generation (Week 7)**

**Goal**: CSV import and AI description generation

**Week 7**:
- [ ] Day 29-30: CSV import (parse, validate, preview, import with taxonomy mapping)
- [ ] Day 31: AI sources management (whitelist/blacklist UI)
- [ ] Day 32: AI description generation (OpenAI integration)
- [ ] Day 33: AI review workflow (review, edit, approve AI descriptions)

**Deliverable**: ✅ Operators can import data and generate AI descriptions

---

### **Phase 4: Public Map with Translations (Weeks 8-9)**

**Goal**: User-facing multilingual map interface with dynamic taxonomy filtering

**Week 8 - Map Foundation**:
- [ ] Day 34-35: Mapbox integration, basic map display
- [ ] Day 36: Load language points from i18n-aware API
- [ ] Day 37: Interactive features (zoom, pan, click)
- [ ] Day 38: Clustering for performance

**Week 9 - Map Features & Dynamic Filters**:
- [ ] Day 39: **Dynamic taxonomy filtering** (render filters based on city's taxonomies)
- [ ] Day 40: **Map styling from taxonomies** (colors/icons from taxonomy values)
- [ ] Day 41: Search functionality (multi-language search)
- [ ] Day 42: Detail popups with translated descriptions
- [ ] Day 43: Language switcher in map UI
- [ ] Day 44: Mobile responsive design

**Deliverable**: ✅ Public can explore multilingual map with city-specific filtering

---

### **Phase 5: Static Content Management (Week 10)**

**Goal**: Built-in CMS for city-specific pages and content

**Week 10 - Page Builder**:
- [ ] Day 45-46: Static pages management (create About, Methodology pages)
- [ ] Day 47: **Page section builder** (hero, text, image, gallery sections)
- [ ] Day 48: Page section translations UI
- [ ] Day 49: **Asset management** (upload logos, images to Supabase Storage)
- [ ] Day 50: Dynamic page rendering (render sections from database)

**Deliverable**: ✅ Cities can customize About/Methodology pages with rich content

---

### **Phase 6: Multi-City Views & Comparison (Week 11)**

**Goal**: Support for viewing multiple cities simultaneously

**Week 11**:
- [ ] Day 51-52: Multi-city query param parsing (?cities=amsterdam,paris)
- [ ] Day 53: Combined map rendering with city color coding
- [ ] Day 54: Multi-city filters and legend
- [ ] Day 55: City comparison mode (side-by-side stats)
- [ ] Day 56: SEO optimization (metadata, structured data, sitemap)

**Deliverable**: ✅ Users can view and compare multiple cities

---

### **Phase 7: Admin Features & Branding (Week 12)**

**Goal**: Admin panel completion, branding, and multi-city user management

**Week 12**:
- [ ] Day 57-58: Admin panel - multi-city user management UI
- [ ] Day 59: City settings (name, coordinates, colors, default locale)
- [ ] Day 60: **Advanced branding customization** (logo, colors, fonts, theme)
- [ ] Day 61: Grant/revoke city access for users
- [ ] Day 62: Test all administrative functions

**Deliverable**: ✅ Admins can fully configure cities, branding, and manage users

---

### **Phase 8: Amsterdam Data Import (Week 13)**

**Goal**: Import existing Amsterdam data with translations and taxonomies

**Week 13**:
- [ ] Day 63-64: **Set up Amsterdam taxonomies** (Size: small/medium/large, Status: endangered/stable)
- [ ] Day 65-66: Import Amsterdam districts, neighborhoods, language data from Airtable
- [ ] Day 67: **Assign taxonomy values** to all imported languages
- [ ] Day 68: Create English translations for all Amsterdam data
- [ ] Day 69: Create Dutch translations for Amsterdam data (AI-assisted)
- [ ] Day 70: Manual review and corrections

**Deliverable**: ✅ Amsterdam data fully imported with EN/NL translations and custom taxonomies

---

### **Phase 9: Testing, Polish & Launch (Weeks 14-15)**

**Goal**: Production-ready launch

**Week 14 - Testing**:
- [ ] Day 71-72: E2E testing (Playwright) - all user flows + i18n + taxonomies
- [ ] Day 73: Performance optimization (Lighthouse audit)
- [ ] Day 74: Security audit (RLS policies, XSS, CSRF, i18n injection)
- [ ] Day 75: Error monitoring setup (Sentry)

**Week 15 - Launch**:
- [ ] Day 76-77: Documentation (user guides in EN/NL/FR, admin documentation for taxonomies/CMS)
- [ ] Day 78: Deploy to production (Vercel)
- [ ] Day 79-80: Final testing with real users
- [ ] Day 81: Soft launch announcement
- [ ] Day 82-83: **Create Amsterdam About page** using CMS
- [ ] Day 84-85: Monitor feedback, bug fixes

**Deliverable**: ✅ Amsterdam live on new platform with full customization!

---

## 💡 Future Enhancements (Post-MVP)

### **Phase 10: Multi-Database Support (Optional)**

**Goal**: Enable per-city or per-region database deployment for data sovereignty

See `docs/MULTI_DATABASE_ARCHITECTURE.md` for detailed implementation plan.

**Estimated Timeline**: 2-3 weeks
- Test database abstraction layer with multiple database configs
- Implement database routing based on city configuration
- Set up Supabase projects for pilot cities
- Data migration scripts for moving cities to dedicated databases
- User authentication federation

**Business Case**: Charge premium ($500/mo) for dedicated databases

---

### **Phase 11: Analytics & Insights (Optional)**
- Dashboard with charts (language distribution, world region breakdown)
- Map view heatmaps and density visualization
- User activity tracking and engagement metrics
- Data quality metrics and completeness reports
- Translation coverage metrics per language
- AI generation cost tracking

### **Phase 12: Advanced Features (Optional)**
- Public API for developers (REST + GraphQL)
- Embed widgets for other websites
- Mobile app (React Native + Expo)
- Advanced search (fuzzy matching, filters by multiple criteria)
- Audio pronunciation guides for endonyms
- Historical data tracking (language spread over time)
- Census data overlays (if city provides data)
- Community contributions (public submissions with moderation)
- Advanced CMS features (version history, A/B testing, preview mode)

### **Phase 13: Monetization (If Decided)**
- **Starter** ($50/mo): Shared database, basic customization, 1 city
- **Professional** ($150/mo): Shared database, full customization (taxonomies + CMS), 3 cities, AI features
- **Enterprise** ($500/mo): Dedicated database, unlimited cities, white label, API access, priority support

---

## 📊 Success Metrics

### **Technical**
- ✅ Sub-2s page load time (Lighthouse)
- ✅ 99.9% uptime (Vercel)
- ✅ Zero critical security vulnerabilities
- ✅ <100ms API response time (p95)

### **User Experience**
- ✅ Operators can add language in <2 minutes
- ✅ Public map loads in <3 seconds
- ✅ Mobile usability score >90
- ✅ Clear error messages, helpful UI

### **Business** (If Monetizing)
- ✅ 3+ cities launched in Year 1
- ✅ 10,000+ monthly map views per city
- ✅ 90% user satisfaction

---

## ⚠️ Risks & Mitigation (Updated for i18n + AI + Multi-City)

### **High Risk**

**1. Time Underestimation**
- **Risk**: Solo development takes longer than planned (12-14 weeks is ambitious)
- **Mitigation**:
  - Realistic 70-day timeline with buffer
  - Use AI tools (Cursor, Copilot, v0.dev) aggressively
  - Copy-paste components (Shadcn/ui)
  - Start with 2 locales (EN + NL), add FR later
  - Use AI to generate initial Dutch translations
  - Deploy incrementally, not big bang

**2. i18n Complexity**
- **Risk**: Translation management becomes overwhelming
- **Mitigation**:
  - Start with minimal UI translations (key terms only)
  - Use fallback to English everywhere
  - Automate translation file generation where possible
  - Focus on Amsterdam data first (EN/NL only)
  - Add more languages incrementally post-launch

**3. AI Generation Costs**
- **Risk**: OpenAI API costs spiral out of control
- **Mitigation**:
  - Set hard API spending limits in OpenAI dashboard
  - Cache generated descriptions in database
  - Rate limit generations per user/day
  - Monitor costs with ai_generation_log table
  - Consider cheaper models (GPT-3.5) for drafts

**4. Data Migration with Translations**
- **Risk**: Amsterdam import loses data or translation relationships break
- **Mitigation**:
  - Test import script on Airtable copy
  - Manual verification of critical records
  - Keep Airtable as backup during transition
  - Import incrementally (geography → languages → points → descriptions)
  - Verify translation links after each step

### **Medium Risk**

**5. Scope Creep**
- **Risk**: Keep adding "just one more locale/feature"
- **Mitigation**:
  - Strict MVP definition: EN/NL/FR only
  - "Future enhancements" list for later
  - Resist perfectionism
  - Ship and iterate

**6. Burnout**
- **Risk**: 12-14 weeks solo is very intense
- **Mitigation**:
  - Take weekends off (critical!)
  - Celebrate small wins (each phase complete)
  - Don't work nights consistently
  - Week 7 = mid-project break (2-3 days rest)
  - Ask for feedback from trusted people

**7. Multi-Tenancy Security**
- **Risk**: RLS policy bug allows cross-city data access
- **Mitigation**:
  - Write RLS tests for each policy
  - Manual security testing with multiple test users
  - Supabase community review before launch
  - Penetration testing (hire contractor if budget allows)
  - Bug bounty program (post-launch)

**8. Translation Consistency**
- **Risk**: Inconsistent terminology across locales
- **Mitigation**:
  - Create glossary document (EN/NL/FR)
  - Use consistent terminology in UI
  - Review all AI-generated translations
  - Native speaker review before launch (hire if needed)

---

## 🎯 Next Steps

### **Immediate (This Week)**
1. ✅ **Review and approve this updated plan**
2. ⏸️ **Decide URL structure** (path-based vs subdomain) - Recommend path-based for solo
3. ⏸️ **Set up accounts**:
   - GitHub repo
   - Supabase project
   - Vercel account
   - Mapbox account (if new)
4. ⏸️ **Choose project name** (independent branding)

### **Next Week (Phase 1 Start)**
1. Initialize Next.js 14 repository
2. Configure Supabase project
3. Create database schema
4. Implement RLS policies
5. Basic auth setup

---

## 💬 Remaining Questions

### **Technical**
1. **URL structure final decision**: Path-based or subdomain?
   - *Recommendation*: Path-based (`language-map.org/amsterdam`) for simplicity

2. **Project/brand name**: What should we call it?
   - Current: "Language Map" (generic)
   - Suggestions: "Linguamap", "PolyglotCity", "WorldLang", "CityTongues"?

3. **Domain**: Do you own `language-map.org` or similar?

### **Data**
4. **Amsterdam Airtable**: Do I have access to API key already?
5. **Other cities**: Any specific cities you want to target first?
   - Academic contacts in Paris/Toronto/London?
   - Existing datasets available?

---

## ✅ Summary of Changes from Previous Version

### ✅ **Removed**:
- Census data tables and overlays (complexity reduction)
- Material-UI references (switched to Shadcn/ui)
- Team collaboration aspects (solo-optimized)

### ✅ **Added**:
- Superuser role and panel
- Path-based URL structure recommendation
- Solo development optimizations
- Realistic timeline adjustments
- Work efficiency tips
- Burnout mitigation
- Simpler MVP scope

### ✅ **Updated**:
- Database schema (no census_areas)
- RLS policies (three tiers)
- Technology stack (confirmed Shadcn/ui)
- Development phases (50 days, solo-paced)
- Risk assessment (solo-specific risks)

---

## 📚 Appendix: Solo Developer Resources

### **AI Coding Assistants** (Highly Recommended)
- **Cursor**: AI-powered IDE (fork of VS Code)
- **GitHub Copilot**: Code completion
- **v0.dev**: Generate UI components from text prompts
- **ChatGPT/Claude**: Architecture discussions, debugging

### **Component Libraries**
- **Shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/

### **Learning Resources**
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- React Query: https://tanstack.com/query/latest
- Tailwind CSS: https://tailwindcss.com/docs

### **Time Management**
- **Pomodoro Technique**: 25 min work, 5 min break
- **Time blocking**: Dedicate specific hours to coding
- **Weekly reviews**: Track progress, adjust plan

---

**Ready to start Phase 1?**

Let me know:
1. Approval to proceed with this plan?
2. Final decision on URL structure?
3. Project/brand name ideas?
4. Any other concerns before we begin?

---

---

## ✅ Summary of Changes from Version 2.0 to 3.1

### ✅ **Major Architectural Changes**:
1. **Hierarchical Geography** - Added structured tables for districts and neighborhoods
2. **Structured World Data** - World regions and countries with translations
3. **i18n from Day 1** - Complete internationalization infrastructure in database and frontend
4. **Multi-City User Access** - Users can access multiple cities via city_users junction table
5. **Multi-City Views** - Single URL can display data from multiple cities
6. **AI Description Generation** - Built into MVP with source whitelists/blacklists per city
7. **AI-Assisted Translation** - Per-city AI translation with editable outputs
8. **Configurable Locales** - Each city chooses which locales to support

### ✅ **Database Schema Changes**:
- Added 8 new translation tables (world regions, countries, cities, districts, neighborhoods, language families, languages, descriptions)
- **All translation tables** now include AI tracking fields (`is_ai_translated`, `ai_model`, `ai_translated_at`, `reviewed_by`, `reviewed_at`)
- Added `locales` table for supported languages
- Added `city_locales` table (which locales each city supports)
- Added `city_users` junction table (many-to-many)
- Added AI configuration fields to `cities` table (`ai_translation_enabled`, `ai_translation_provider`, `ai_translation_model`, `ai_translation_api_key_encrypted`)
- Added `ai_sources` table for whitelist/blacklist management
- Added `ai_generation_log` table for tracking AI usage
- **Endonym is NOT translated** - Single field on `languages` table, not in `language_translations`
- Removed `city_id` from `user_profiles` (moved to `city_users`)
- Added `neighborhood_id` FK to `language_points`

### ✅ **Updated RLS Policies**:
- All policies now check `city_users` junction table
- Superuser role works across all cities
- Admins can manage multiple cities they have access to
- AI source policies for admin-only access

### ✅ **Technology Stack Additions**:
- `next-intl` - Next.js internationalization
- `@formatjs/intl-locale` - Locale data handling
- `openai` / `anthropic` - AI description generation AND translation

### ✅ **Timeline Revised**:
- **Before**: 8-10 weeks (50 days)
- **After**: 12-14 weeks (70 days)
- **Reason**: Added i18n infrastructure, geographic hierarchy, AI generation, AI translation, multi-city views

### ✅ **URL Structure Enhanced**:
- Multi-city support via query params: `?cities=amsterdam,paris`
- i18n locale prefix: `/en/amsterdam`, `/nl/amsterdam`
- Compare mode: `/amsterdam?compare=paris`

### ✅ **Key Design Decisions**:
1. **Endonyms are universal** - Language endonym (e.g., "日本語") is the same in all UI locales
2. **AI translations are editable** - Users can review and modify AI-generated translations
3. **Per-city AI configuration** - Each city can use different AI models/providers
4. **Per-city locale selection** - Amsterdam might support EN/NL/FR while Tokyo supports EN/JA/ZH
5. **Translation tracking** - All AI-generated translations are flagged and can be reviewed

### ✅ **New Risks Added**:
- i18n complexity and translation management
- AI generation AND translation costs (double AI usage)
- Translation consistency across locales
- API key security (encrypted storage required)
- Increased burnout risk (12-14 weeks)

---

*Prepared by: Claude Code*
*Date: October 29, 2025*
*Version: 3.1 - Enhanced with Configurable AI Translation, Per-City Locales, and Universal Endonyms*
*Status: ⏸️ Paused for Review*
