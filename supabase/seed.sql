-- SEED DATA FOR PHASE 1, DAY 2
-- =============================

-- Insert supported locales
-- ========================
INSERT INTO locales (code, name, native_name, is_default, is_active) VALUES
  ('en', 'English', 'English', true, true),
  ('nl', 'Dutch', 'Nederlands', false, true),
  ('fr', 'French', 'Français', false, true)
ON CONFLICT (code) DO NOTHING;

-- Insert world regions
-- ====================
INSERT INTO world_regions (slug, iso_code) VALUES
  ('europe', 'EUR'),
  ('asia', 'ASI'),
  ('north-america', 'NAM'),
  ('south-america', 'SAM'),
  ('africa', 'AFR'),
  ('oceania', 'OCE'),
  ('antarctica', 'ANT')
ON CONFLICT (slug) DO NOTHING;

-- Insert countries
-- ================
INSERT INTO countries (world_region_id, slug, iso_code_2, iso_code_3)
SELECT
  wr.id,
  'netherlands',
  'NL',
  'NLD'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

-- Get Netherlands UUID for use in city creation
-- (We'll reference this in the INSERT)

-- Insert cities
-- =============
INSERT INTO cities (
  country_id,
  slug,
  status,
  center_lat,
  center_lng,
  default_zoom,
  mapbox_style,
  primary_color,
  bounds_min_lat,
  bounds_max_lat,
  bounds_min_lng,
  bounds_max_lng
)
SELECT
  c.id,
  'amsterdam',
  'active',
  52.3676,
  4.9041,
  11,
  'mapbox://styles/mapbox/streets-v12',
  '#1976d2',
  52.278, -- South
  52.431, -- North
  4.728,  -- East
  5.079   -- West
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT (country_id, slug) DO NOTHING;

-- Insert world region translations
-- ================================
-- Europe
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'Europe',
  'Europe is a continent located entirely in the Northern Hemisphere and mostly in the Eastern Hemisphere.'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Europa',
  'Europa is een continent dat volledig op het noordelijk halfrond en grotendeels op het oostelijk halfrond ligt.'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Europe',
  'L''Europe est un continent situé entièrement dans l''hémisphère nord et principalement dans l''hémisphère est.'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

-- Insert country translations
-- ==========================
-- Netherlands
INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'en',
  'Netherlands',
  'The Netherlands is a country in Western Europe with territories in the Caribbean.'
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'nl',
  'Nederland',
  'Nederland is een land in West-Europa met gebieden in de Caraïben.'
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'fr',
  'Pays-Bas',
  'Les Pays-Bas sont un pays d''Europe occidentale avec des territoires dans les Caraïbes.'
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT DO NOTHING;

-- Insert city translations
-- =======================
-- Amsterdam
INSERT INTO city_translations (city_id, locale_code, name, description, is_ai_translated)
SELECT
  c.id,
  'en',
  'Amsterdam',
  'Amsterdam is the capital and most populous city of the Netherlands.',
  false
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

INSERT INTO city_translations (city_id, locale_code, name, description, is_ai_translated)
SELECT
  c.id,
  'nl',
  'Amsterdam',
  'Amsterdam is de hoofdstad en meest volkrijke stad van Nederland.',
  false
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

INSERT INTO city_translations (city_id, locale_code, name, description, is_ai_translated)
SELECT
  c.id,
  'fr',
  'Amsterdam',
  'Amsterdam est la capitale et la ville la plus peuplée des Pays-Bas.',
  false
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Enable locales for Amsterdam
-- ============================
INSERT INTO city_locales (city_id, locale_code, is_enabled)
SELECT
  c.id,
  'en',
  true
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

INSERT INTO city_locales (city_id, locale_code, is_enabled)
SELECT
  c.id,
  'nl',
  true
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

INSERT INTO city_locales (city_id, locale_code, is_enabled)
SELECT
  c.id,
  'fr',
  true
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Verification queries (commented out, can be used for testing)
-- ============================================================

-- SELECT 'Locales inserted' as status, count(*) as count FROM locales;
-- SELECT 'World regions inserted' as status, count(*) as count FROM world_regions;
-- SELECT 'Countries inserted' as status, count(*) as count FROM countries;
-- SELECT 'Cities inserted' as status, count(*) as count FROM cities;

-- SELECT * FROM locales;
-- SELECT * FROM world_regions;
-- SELECT * FROM countries WHERE iso_code_2 = 'NL';
-- SELECT * FROM cities WHERE slug = 'amsterdam';
