-- ============================================
-- AI DESCRIPTION GENERATION - AI SOURCES
-- ============================================
-- Migration: Create ai_sources table for whitelist/blacklist management
-- Date: November 13, 2025
-- Description: This table stores whitelisted and blacklisted sources for AI description generation per city

-- Create ai_sources table
CREATE TABLE IF NOT EXISTS ai_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                       -- Domain or full URL
  list_type TEXT NOT NULL CHECK (list_type IN ('whitelist', 'blacklist')),
  notes TEXT,                              -- Why whitelisted/blacklisted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  -- Ensure unique URL per list type per city
  UNIQUE(city_id, url, list_type)
);

-- Add comments for documentation
COMMENT ON TABLE ai_sources IS 'Stores whitelisted and blacklisted sources for AI description generation per city';
COMMENT ON COLUMN ai_sources.url IS 'Domain or full URL for the source (e.g., wikipedia.org or https://en.wikipedia.org)';
COMMENT ON COLUMN ai_sources.list_type IS 'Type of list: whitelist (allowed sources) or blacklist (blocked sources)';
COMMENT ON COLUMN ai_sources.notes IS 'Explanation of why this source is whitelisted or blacklisted';

-- Enable Row-Level Security
ALTER TABLE ai_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_sources
-- Policy 1: Public can view whitelisted sources (for transparency)
CREATE POLICY "Public can view whitelist"
  ON ai_sources FOR SELECT
  USING (list_type = 'whitelist');

-- Policy 2: City users can view all sources for their cities
CREATE POLICY "City users can view their city sources"
  ON ai_sources FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
  );

-- Policy 3: City admins can manage sources for their cities
CREATE POLICY "City admins can manage sources"
  ON ai_sources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    (city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid() AND role IN ('admin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    (city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid() AND role IN ('admin')))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_sources_city ON ai_sources(city_id);
CREATE INDEX IF NOT EXISTS idx_ai_sources_list_type ON ai_sources(list_type);
CREATE INDEX IF NOT EXISTS idx_ai_sources_created_by ON ai_sources(created_by);

-- Grant necessary permissions
GRANT SELECT ON ai_sources TO anon, authenticated;
GRANT ALL ON ai_sources TO authenticated;
