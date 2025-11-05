-- Create Taxonomy System
-- ======================
-- Flexible taxonomy system for city-specific language classifications
-- This replaces hardcoded enums with a flexible, multi-tenant system

-- 1. TAXONOMY TYPES TABLE
-- ========================
-- Defines classification types (e.g., "Size", "Status", "Script Type")
-- Each city can have its own set of taxonomy types

CREATE TABLE taxonomy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  use_for_map_styling BOOLEAN NOT NULL DEFAULT false,
  use_for_filtering BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per city
  UNIQUE(city_id, slug)
);

-- Indexes
CREATE INDEX idx_taxonomy_types_city_id ON taxonomy_types(city_id);
CREATE INDEX idx_taxonomy_types_slug ON taxonomy_types(slug);
CREATE INDEX idx_taxonomy_types_map_styling ON taxonomy_types(use_for_map_styling) WHERE use_for_map_styling = true;
CREATE INDEX idx_taxonomy_types_filtering ON taxonomy_types(use_for_filtering) WHERE use_for_filtering = true;

-- Enable RLS
ALTER TABLE taxonomy_types ENABLE ROW LEVEL SECURITY;

-- RLS Policy: City users can manage taxonomy types for their cities
CREATE POLICY "City users can manage taxonomy types"
  ON taxonomy_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );

-- 2. TAXONOMY TYPE TRANSLATIONS TABLE
-- ====================================
-- Stores translated names and descriptions for taxonomy types

CREATE TABLE taxonomy_type_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one translation per type per locale
  UNIQUE(taxonomy_type_id, locale_code)
);

-- Indexes
CREATE INDEX idx_taxonomy_type_translations_type_id ON taxonomy_type_translations(taxonomy_type_id);
CREATE INDEX idx_taxonomy_type_translations_locale ON taxonomy_type_translations(locale_code);
CREATE INDEX idx_taxonomy_type_translations_is_ai ON taxonomy_type_translations(is_ai_translated);

-- Enable RLS
ALTER TABLE taxonomy_type_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: City users can manage taxonomy type translations for their cities
CREATE POLICY "City users can manage taxonomy type translations"
  ON taxonomy_type_translations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_type_id IN (
      SELECT t.id
      FROM taxonomy_types t
      JOIN city_users cu ON t.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- 3. TAXONOMY VALUES TABLE
-- =========================
-- Defines values for each taxonomy type (e.g., Small/Medium/Large for "Size")
-- Includes visual styling information for map rendering

CREATE TABLE taxonomy_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_type_id UUID NOT NULL REFERENCES taxonomy_types(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL DEFAULT '#CCCCCC', -- Hex color for map styling
  icon_name VARCHAR(50), -- Lucide icon name
  icon_size_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- Size multiplier for icons
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per taxonomy type
  UNIQUE(taxonomy_type_id, slug)
);

-- Indexes
CREATE INDEX idx_taxonomy_values_type_id ON taxonomy_values(taxonomy_type_id);
CREATE INDEX idx_taxonomy_values_slug ON taxonomy_values(slug);
CREATE INDEX idx_taxonomy_values_display_order ON taxonomy_values(display_order);

-- Enable RLS
ALTER TABLE taxonomy_values ENABLE ROW LEVEL SECURITY;

-- RLS Policy: City users can manage taxonomy values for their cities
CREATE POLICY "City users can manage taxonomy values"
  ON taxonomy_values FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_type_id IN (
      SELECT t.id
      FROM taxonomy_types t
      JOIN city_users cu ON t.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- 4. TAXONOMY VALUE TRANSLATIONS TABLE
-- =====================================
-- Stores translated names and descriptions for taxonomy values

CREATE TABLE taxonomy_value_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one translation per value per locale
  UNIQUE(taxonomy_value_id, locale_code)
);

-- Indexes
CREATE INDEX idx_taxonomy_value_translations_value_id ON taxonomy_value_translations(taxonomy_value_id);
CREATE INDEX idx_taxonomy_value_translations_locale ON taxonomy_value_translations(locale_code);
CREATE INDEX idx_taxonomy_value_translations_is_ai ON taxonomy_value_translations(is_ai_translated);

-- Enable RLS
ALTER TABLE taxonomy_value_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: City users can manage taxonomy value translations for their cities
CREATE POLICY "City users can manage taxonomy value translations"
  ON taxonomy_value_translations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_value_id IN (
      SELECT tv.id
      FROM taxonomy_values tv
      JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
      JOIN city_users cu ON tt.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- 5. LANGUAGE TAXONOMIES JUNCTION TABLE
-- =====================================
-- Maps languages to taxonomy values (many-to-many relationship)
-- Allows multiple taxonomy assignments per language

CREATE TABLE language_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  taxonomy_value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique assignment (language can only have one value per taxonomy type)
  UNIQUE(language_id, taxonomy_value_id)
);

-- Indexes
CREATE INDEX idx_language_taxonomies_language_id ON language_taxonomies(language_id);
CREATE INDEX idx_language_taxonomies_value_id ON language_taxonomies(taxonomy_value_id);

-- Enable RLS
ALTER TABLE language_taxonomies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: City users can manage language taxonomies for their cities
CREATE POLICY "City users can manage language taxonomies"
  ON language_taxonomies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    language_id IN (
      SELECT l.id
      FROM languages l
      JOIN city_users cu ON l.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
    )
    OR
    taxonomy_value_id IN (
      SELECT tv.id
      FROM taxonomy_values tv
      JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
      JOIN city_users cu ON tt.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
    )
  );
