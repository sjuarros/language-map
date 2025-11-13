-- ============================================
-- LANGUAGE POINTS
-- ============================================
-- Geographic locations where languages are spoken
-- Each point represents a specific location with coordinates
-- and can be linked to a language and optionally a neighborhood

-- Language Points Table
-- =====================
CREATE TABLE language_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,

  -- Geographic coordinates (required)
  latitude NUMERIC(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),

  -- Optional location details
  postal_code TEXT,
  community_name TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes for language_points
CREATE INDEX idx_language_points_language_id ON language_points(language_id);
CREATE INDEX idx_language_points_neighborhood_id ON language_points(neighborhood_id);
CREATE INDEX idx_language_points_coordinates ON language_points(latitude, longitude);

-- Spatial index for geographic queries (using PostGIS if available)
-- Note: This requires PostGIS extension to be enabled
-- CREATE INDEX idx_language_points_location ON language_points USING GIST (ST_MakePoint(longitude, latitude));

-- Trigger for updated_at
-- ======================
CREATE TRIGGER update_language_points_updated_at BEFORE UPDATE ON language_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- ========================
ALTER TABLE language_points ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Allow public read on language_points" ON language_points
  FOR SELECT USING (true);

-- City users can manage language points for their cities
-- (via the language's city_id)
CREATE POLICY "City users can insert language_points" ON language_points
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

CREATE POLICY "City users can update language_points" ON language_points
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

CREATE POLICY "City users can delete language_points" ON language_points
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
