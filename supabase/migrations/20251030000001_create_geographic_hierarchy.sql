-- Create Geographic Hierarchy Tables
-- ==================================

-- 9. DISTRICTS TABLE
-- ===================
-- Administrative districts within cities (e.g., Centrum, West, Zuid)

CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per city
  UNIQUE(city_id, slug)
);

-- Indexes
CREATE INDEX idx_districts_city_id ON districts(city_id);
CREATE INDEX idx_districts_slug ON districts(city_id, slug);

-- 10. DISTRICT TRANSLATIONS TABLE
-- =================================

CREATE TABLE district_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
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
  -- Ensure one translation per district per locale
  UNIQUE(district_id, locale_code)
);

-- Indexes
CREATE INDEX idx_district_translations_district_id ON district_translations(district_id);
CREATE INDEX idx_district_translations_locale ON district_translations(locale_code);
CREATE INDEX idx_district_translations_is_ai ON district_translations(is_ai_translated);

-- 11. NEIGHBORHOODS TABLE
-- ========================
-- Neighborhoods within districts (more granular than districts)

CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique slug per district
  UNIQUE(district_id, slug)
);

-- Indexes
CREATE INDEX idx_neighborhoods_district_id ON neighborhoods(district_id);
CREATE INDEX idx_neighborhoods_slug ON neighborhoods(district_id, slug);

-- 12. NEIGHBORHOOD TRANSLATIONS TABLE
-- ====================================

CREATE TABLE neighborhood_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
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
  -- Ensure one translation per neighborhood per locale
  UNIQUE(neighborhood_id, locale_code)
);

-- Indexes
CREATE INDEX idx_neighborhood_translations_neighborhood_id ON neighborhood_translations(neighborhood_id);
CREATE INDEX idx_neighborhood_translations_locale ON neighborhood_translations(locale_code);
CREATE INDEX idx_neighborhood_translations_is_ai ON neighborhood_translations(is_ai_translated);

-- Apply triggers to update updated_at timestamp
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_district_translations_updated_at BEFORE UPDATE ON district_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhood_translations_updated_at BEFORE UPDATE ON neighborhood_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhood_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read on all geographic hierarchy tables

CREATE POLICY "Allow public read on districts" ON districts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on district_translations" ON district_translations
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on neighborhoods" ON neighborhoods
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on neighborhood_translations" ON neighborhood_translations
  FOR SELECT USING (true);
