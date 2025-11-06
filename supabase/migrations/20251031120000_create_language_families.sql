-- ============================================
-- LANGUAGE FAMILIES
-- ============================================
-- Language families are hierarchical classifications (e.g., Indo-European, Sino-Tibetan)
-- This table stores the base language family data
-- Translations are stored separately for multi-language support

-- Language Families Table
-- =======================
CREATE TABLE language_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on slug for fast lookups
CREATE INDEX idx_language_families_slug ON language_families(slug);

-- Language Family Translations Table
-- ==================================
CREATE TABLE language_family_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES language_families(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  description TEXT,

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID, -- References user_profiles(id)
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one translation per family per locale
  UNIQUE(family_id, locale_code)
);

-- Indexes for language_family_translations
CREATE INDEX idx_language_family_translations_family_id ON language_family_translations(family_id);
CREATE INDEX idx_language_family_translations_locale ON language_family_translations(locale_code);
CREATE INDEX idx_language_family_translations_is_ai ON language_family_translations(is_ai_translated);

-- Triggers for updated_at
-- =======================
CREATE TRIGGER update_language_families_updated_at BEFORE UPDATE ON language_families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_family_translations_updated_at BEFORE UPDATE ON language_family_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- ========================
ALTER TABLE language_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_family_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Allow public read on language_families" ON language_families
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on language_family_translations" ON language_family_translations
  FOR SELECT USING (true);

-- Authenticated users with any city access can manage language families
-- (Language families are global, not city-specific)
CREATE POLICY "Authenticated users can insert language_families" ON language_families
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );

CREATE POLICY "Authenticated users can update language_families" ON language_families
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );

CREATE POLICY "Authenticated users can delete language_families" ON language_families
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );

-- Language family translations policies
CREATE POLICY "Authenticated users can insert language_family_translations" ON language_family_translations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );

CREATE POLICY "Authenticated users can update language_family_translations" ON language_family_translations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );

CREATE POLICY "Authenticated users can delete language_family_translations" ON language_family_translations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superuser', 'admin', 'operator')
    )
  );
