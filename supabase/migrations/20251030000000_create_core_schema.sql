-- Create Enum Types
-- =================

-- User role enum
CREATE TYPE user_role AS ENUM ('superuser', 'admin', 'operator');

-- City status enum
CREATE TYPE city_status AS ENUM ('draft', 'active', 'archived');

-- Active status enum
CREATE TYPE active_status AS ENUM ('active', 'inactive', 'planned');

-- Active status enum
CREATE TYPE yes_no AS ENUM ('yes', 'no', 'unknown');

-- 1. LOCALES TABLE
-- ================
-- Stores supported locales/languages for UI and translations

CREATE TABLE locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE, -- 'en', 'nl', 'fr', etc.
  name VARCHAR(100) NOT NULL, -- 'English', 'Nederlands', 'Français'
  native_name VARCHAR(100) NOT NULL, -- 'English', 'Nederlands', 'Français'
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on locale code
CREATE INDEX idx_locales_code ON locales(code);

-- Index on active status
CREATE INDEX idx_locales_active ON locales(is_active) WHERE is_active = true;

-- 2. WORLD REGIONS TABLE
-- ======================
-- Top-level geographic regions (Europe, Asia, Africa, etc.)

CREATE TABLE world_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  iso_code VARCHAR(3), -- Optional ISO code (e.g., 'EUR' for Europe)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on slug
CREATE INDEX idx_world_regions_slug ON world_regions(slug);

-- 3. WORLD REGION TRANSLATIONS TABLE
-- ===================================

CREATE TABLE world_region_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_region_id UUID NOT NULL REFERENCES world_regions(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID, -- References user_profiles(id) when available
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one translation per region per locale
  UNIQUE(world_region_id, locale_code)
);

-- Indexes
CREATE INDEX idx_world_region_translations_region_id ON world_region_translations(world_region_id);
CREATE INDEX idx_world_region_translations_locale ON world_region_translations(locale_code);
CREATE INDEX idx_world_region_translations_is_ai ON world_region_translations(is_ai_translated);

-- 4. COUNTRIES TABLE
-- ==================
-- Country information with reference to world regions

CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_region_id UUID NOT NULL REFERENCES world_regions(id),
  slug VARCHAR(100) NOT NULL,
  iso_code_2 CHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 (e.g., 'NL', 'FR')
  iso_code_3 CHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-3 (e.g., 'NLD', 'FRA')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per world region
  UNIQUE(world_region_id, slug)
);

-- Indexes
CREATE INDEX idx_countries_region_id ON countries(world_region_id);
CREATE INDEX idx_countries_iso_2 ON countries(iso_code_2);
CREATE INDEX idx_countries_iso_3 ON countries(iso_code_3);

-- 5. COUNTRY TRANSLATIONS TABLE
-- ==============================

CREATE TABLE country_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one translation per country per locale
  UNIQUE(country_id, locale_code)
);

-- Indexes
CREATE INDEX idx_country_translations_country_id ON country_translations(country_id);
CREATE INDEX idx_country_translations_locale ON country_translations(locale_code);
CREATE INDEX idx_country_translations_is_ai ON country_translations(is_ai_translated);

-- 6. CITIES TABLE
-- ===============
-- City information with geographic coordinates

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id),
  slug VARCHAR(100) NOT NULL,
  status city_status NOT NULL DEFAULT 'draft',
  center_lat DECIMAL(10, 7), -- Latitude of city center
  center_lng DECIMAL(10, 7), -- Longitude of city center
  default_zoom INTEGER DEFAULT 11, -- Default map zoom level
  mapbox_style TEXT DEFAULT 'mapbox://styles/mapbox/streets-v12',
  primary_color VARCHAR(7) DEFAULT '#1976d2', -- Primary brand color (hex)
  -- Map bounds for proper map viewport
  bounds_min_lat DECIMAL(10, 7),
  bounds_max_lat DECIMAL(10, 7),
  bounds_min_lng DECIMAL(10, 7),
  bounds_max_lng DECIMAL(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per country
  UNIQUE(country_id, slug)
);

-- Indexes
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_status ON cities(status);

-- 7. CITY LOCALES TABLE
-- =====================
-- Which locales are enabled for each city

CREATE TABLE city_locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one record per city per locale
  UNIQUE(city_id, locale_code)
);

-- Indexes
CREATE INDEX idx_city_locales_city_id ON city_locales(city_id);
CREATE INDEX idx_city_locales_locale ON city_locales(locale_code);
CREATE INDEX idx_city_locales_enabled ON city_locales(is_enabled) WHERE is_enabled = true;

-- 8. CITY TRANSLATIONS TABLE
-- ==========================

CREATE TABLE city_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name VARCHAR(200) NOT NULL, -- Translated city name
  description TEXT, -- Translated description
  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one translation per city per locale
  UNIQUE(city_id, locale_code)
);

-- Indexes
CREATE INDEX idx_city_translations_city_id ON city_translations(city_id);
CREATE INDEX idx_city_translations_locale ON city_translations(locale_code);
CREATE INDEX idx_city_translations_is_ai ON city_translations(is_ai_translated);

-- Create triggers to update updated_at timestamp
-- ===============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_locales_updated_at BEFORE UPDATE ON locales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_regions_updated_at BEFORE UPDATE ON world_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_region_translations_updated_at BEFORE UPDATE ON world_region_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_translations_updated_at BEFORE UPDATE ON country_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_translations_updated_at BEFORE UPDATE ON city_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable on all tables
-- ================================================

ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_region_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for published content
-- (Full RLS policies for user management will be added in Week 2)

-- Allow public read on locales
CREATE POLICY "Allow public read on locales" ON locales
  FOR SELECT USING (true);

-- Allow public read on world_regions
CREATE POLICY "Allow public read on world_regions" ON world_regions
  FOR SELECT USING (true);

-- Allow public read on world_region_translations
CREATE POLICY "Allow public read on world_region_translations" ON world_region_translations
  FOR SELECT USING (true);

-- Allow public read on countries
CREATE POLICY "Allow public read on countries" ON countries
  FOR SELECT USING (true);

-- Allow public read on country_translations
CREATE POLICY "Allow public read on country_translations" ON country_translations
  FOR SELECT USING (true);

-- Allow public read on cities
CREATE POLICY "Allow public read on cities" ON cities
  FOR SELECT USING (true);

-- Allow public read on city_locales
CREATE POLICY "Allow public read on city_locales" ON city_locales
  FOR SELECT USING (true);

-- Allow public read on city_translations
CREATE POLICY "Allow public read on city_translations" ON city_translations
  FOR SELECT USING (true);
