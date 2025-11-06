-- ============================================
-- LANGUAGES
-- ============================================
-- Core language data table
-- Each language belongs to a city and has optional references to family and origin country
-- Endonym (native name) is stored here and is NOT translated
-- Translated names are stored in language_translations table

-- Languages Table
-- ===============
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

-- Indexes for languages
CREATE INDEX idx_languages_city_id ON languages(city_id);
CREATE INDEX idx_languages_family_id ON languages(language_family_id);
CREATE INDEX idx_languages_country_id ON languages(country_of_origin_id);
CREATE INDEX idx_languages_iso_code ON languages(iso_639_3_code);

-- Language Translations Table
-- ===========================
-- Stores translated names for languages (endonym is NOT translated!)
CREATE TABLE language_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  locale_code VARCHAR(5) NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,  -- Translated name (e.g., "Japanese" in EN, "Japanisch" in DE)

  -- AI translation tracking
  is_ai_translated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_translated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one translation per language per locale
  UNIQUE(language_id, locale_code)
);

-- Indexes for language_translations
CREATE INDEX idx_language_translations_language_id ON language_translations(language_id);
CREATE INDEX idx_language_translations_locale ON language_translations(locale_code);
CREATE INDEX idx_language_translations_is_ai ON language_translations(is_ai_translated);

-- Triggers for updated_at
-- =======================
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_translations_updated_at BEFORE UPDATE ON language_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- ========================
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Allow public read on languages" ON languages
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on language_translations" ON language_translations
  FOR SELECT USING (true);

-- City users can manage languages for their cities
CREATE POLICY "City users can insert languages" ON languages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'superuser'
    )
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );

CREATE POLICY "City users can update languages" ON languages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'superuser'
    )
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );

CREATE POLICY "City users can delete languages" ON languages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'superuser'
    )
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );

-- Language translations policies
CREATE POLICY "City users can insert language_translations" ON language_translations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.id = language_id
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'superuser'
        )
        OR
        l.city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "City users can update language_translations" ON language_translations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.id = language_id
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'superuser'
        )
        OR
        l.city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "City users can delete language_translations" ON language_translations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.id = language_id
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'superuser'
        )
        OR
        l.city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
      )
    )
  );
