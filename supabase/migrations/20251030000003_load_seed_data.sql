-- Load additional seed data (geographic and users)
-- This migration loads data from seed-geographic.sql and seed-users.sql

-- ========================================================
-- SECTION 1: Geographic Data (from seed-geographic.sql)
-- ========================================================

-- Insert district translations
-- ============================
-- Centrum (1)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'centrum' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Centrum', 'Historic city center with canals and museums'),
  ((SELECT id FROM districts WHERE slug = 'centrum' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Centrum', 'Historisch stadscentrum met grachten en musea'),
  ((SELECT id FROM districts WHERE slug = 'centrum' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Centrum', 'Centre historique de la ville avec canaux et musées');

-- West (2)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'West', 'Diverse neighborhoods, parks, and cultural venues'),
  ((SELECT id FROM districts WHERE slug = 'west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'West', 'Diverse wijken, parken en culturele locaties'),
  ((SELECT id FROM districts WHERE slug = 'west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'West', 'Quartiers divers, parcs et lieux culturels');

-- Nieuw-West (3)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'nieuw-west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Nieuw-West', 'Modern district with residential areas and green spaces'),
  ((SELECT id FROM districts WHERE slug = 'nieuw-west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Nieuw-West', 'Moderne wijk met woonwijken en groene ruimtes'),
  ((SELECT id FROM districts WHERE slug = 'nieuw-west' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Nieuw-Ouest', 'Quartier moderne avec zones résidentielles et espaces verts');

-- Zuid (4)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'zuid' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Zuid', 'Upscale neighborhoods and business district'),
  ((SELECT id FROM districts WHERE slug = 'zuid' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Zuid', 'Chique wijken en zakendistrict'),
  ((SELECT id FROM districts WHERE slug = 'zuid' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Zuid', 'Quartiers huppés et district commercial');

-- Oost (5)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'oost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Oost', 'Dynamic area mixing residential and industrial zones'),
  ((SELECT id FROM districts WHERE slug = 'oost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Oost', 'Dynamisch gebied met woningen en industrie'),
  ((SELECT id FROM districts WHERE slug = 'oost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Oost', 'Zone dynamique mélangeant résidentiel et industriel');

-- Noord (6)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'noord' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Noord', 'Area across the IJ waterway with growing arts scene'),
  ((SELECT id FROM districts WHERE slug = 'noord' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Noord', 'Gebied over het IJ met groeiende kunstscene'),
  ((SELECT id FROM districts WHERE slug = 'noord' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Noord', 'Zone à travers l''IJ avec une scène artistique en croissance');

-- Zuidoost (7)
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'zuidoost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Zuidoost', 'Home to Amsterdam ArenA and diverse communities'),
  ((SELECT id FROM districts WHERE slug = 'zuidoost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'nl', 'Zuidoost', 'Thuisbasis van Amsterdam ArenA en diverse gemeenschappen'),
  ((SELECT id FROM districts WHERE slug = 'zuidoost' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'fr', 'Zuidoost', 'Accueil de l''Amsterdam ArenA et communautés diverses');

-- Insert neighborhoods (without translations first to satisfy foreign key constraints)

-- Jordaan (Centrum)
INSERT INTO neighborhoods (district_id, slug) VALUES
  ((SELECT id FROM districts WHERE slug = 'centrum'), 'jordaan');

-- De Pijp (Zuid)
INSERT INTO neighborhoods (district_id, slug) VALUES
  ((SELECT id FROM districts WHERE slug = 'zuid'), 'de-pijp');

-- Vondelpark (Zuid)
INSERT INTO neighborhoods (district_id, slug) VALUES
  ((SELECT id FROM districts WHERE slug = 'zuid'), 'vondelpark');

-- Oostelijk Havengebied (Oost)
INSERT INTO neighborhoods (district_id, slug) VALUES
  ((SELECT id FROM districts WHERE slug = 'oost'), 'oostelijk-havengebied');

-- Amsterdam-Noord (Noord)
INSERT INTO neighborhoods (district_id, slug) VALUES
  ((SELECT id FROM districts WHERE slug = 'noord'), 'amsterdam-noord');

-- Insert neighborhood translations
-- ================================

-- Jordaan
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description) VALUES
  ((SELECT id FROM neighborhoods WHERE slug = 'jordaan'), 'en', 'Jordaan', 'Historic narrow streets with cafes and antique shops'),
  ((SELECT id FROM neighborhoods WHERE slug = 'jordaan'), 'nl', 'Jordaan', 'Historische smalle straten met cafes en antiekzaakjes'),
  ((SELECT id FROM neighborhoods WHERE slug = 'jordaan'), 'fr', 'Jordaan', 'Rues étroites historiques avec cafes et magasins d''antiquités');

-- De Pijp
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description) VALUES
  ((SELECT id FROM neighborhoods WHERE slug = 'de-pijp'), 'en', 'De Pijp', 'Vibrant neighborhood with markets and multicultural atmosphere'),
  ((SELECT id FROM neighborhoods WHERE slug = 'de-pijp'), 'nl', 'De Pijp', 'Levendige buurt met markten en multiculturele sfeer'),
  ((SELECT id FROM neighborhoods WHERE slug = 'de-pijp'), 'fr', 'De Pijp', 'Quartier dynamique avec marchés et ambiance multiculturelle');

-- Vondelpark
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description) VALUES
  ((SELECT id FROM neighborhoods WHERE slug = 'vondelpark'), 'en', 'Vondelpark', 'Area around the famous park, popular with families'),
  ((SELECT id FROM neighborhoods WHERE slug = 'vondelpark'), 'nl', 'Vondelpark', 'Gebied rondom het beroemde park, populair bij gezinnen'),
  ((SELECT id FROM neighborhoods WHERE slug = 'vondelpark'), 'fr', 'Vondelpark', 'Zone autour du famous parc, populaire auprès des familles');

-- Oostelijk Havengebied
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description) VALUES
  ((SELECT id FROM neighborhoods WHERE slug = 'oostelijk-havengebied'), 'en', 'Oostelijk Havengebied', 'Eastern docklands with modern architecture'),
  ((SELECT id FROM neighborhoods WHERE slug = 'oostelijk-havengebied'), 'nl', 'Oostelijk Havengebied', 'Oostelijke havengebieden met moderne architectuur'),
  ((SELECT id FROM neighborhoods WHERE slug = 'oostelijk-havengebied'), 'fr', 'Oostelijk Havengebied', 'Bassins Est avec architecture moderne');

-- Amsterdam-Noord
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description) VALUES
  ((SELECT id FROM neighborhoods WHERE slug = 'amsterdam-noord'), 'en', 'Amsterdam-Noord', 'Artistic community with green spaces'),
  ((SELECT id FROM neighborhoods WHERE slug = 'amsterdam-noord'), 'nl', 'Amsterdam-Noord', 'Artistieke gemeenschap met groene ruimtes'),
  ((SELECT id FROM neighborhoods WHERE slug = 'amsterdam-noord'), 'fr', 'Amsterdam-Noord', 'Communauté artistique avec espaces verts');

-- ========================================================
-- SECTION 2: Test Users (from seed-users.sql)
-- ========================================================

-- Insert test users into user_profiles
-- ====================================

-- Superuser
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'superuser@example.com', 'Platform Superuser', 'superuser', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Amsterdam Admin
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 'amsterdam-admin@example.com', 'Amsterdam Administrator', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Amsterdam Operator
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000003', 'amsterdam-operator@example.com', 'Amsterdam Operator', 'operator', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Multi-City Admin
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000004', 'multicity-admin@example.com', 'Multi-City Administrator', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Insert city access grants (city_users junction table)
-- ====================================================

-- Amsterdam Admin gets admin access to Amsterdam
INSERT INTO city_users (city_id, user_id, role, granted_at) VALUES
  ((SELECT id FROM cities WHERE slug = 'amsterdam'), '00000000-0000-0000-0000-000000000002', 'admin', NOW())
ON CONFLICT (city_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  granted_at = EXCLUDED.granted_at;

-- Amsterdam Operator gets operator access to Amsterdam
INSERT INTO city_users (city_id, user_id, role, granted_at) VALUES
  ((SELECT id FROM cities WHERE slug = 'amsterdam'), '00000000-0000-0000-0000-000000000003', 'operator', NOW())
ON CONFLICT (city_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  granted_at = EXCLUDED.granted_at;

-- Multi-City Admin gets admin access to Amsterdam (can be expanded later)
INSERT INTO city_users (city_id, user_id, role, granted_at) VALUES
  ((SELECT id FROM cities WHERE slug = 'amsterdam'), '00000000-0000-0000-0000-000000000004', 'admin', NOW())
ON CONFLICT (city_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  granted_at = EXCLUDED.granted_at;

-- Superuser does NOT need city_users entry (has implicit access to all cities)