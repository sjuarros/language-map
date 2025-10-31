-- SEED DATA FOR PHASE 1, DAYS 5-6
-- ================================
-- Geographic hierarchy and reference data

-- Complete world region translations (EN/NL/FR)
-- =============================================

-- Insert European translations (already started in seed.sql, completing here)
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Europe',
  'L''Europe est un continent situé entièrement dans l''hémisphère nord et principalement dans l''hémisphère est.'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

-- Asia
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'Asia',
  'Asia is the largest continent in the world, covering about 30% of Earth''s total land area.'
FROM world_regions wr
WHERE wr.slug = 'asia'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Azië',
  'Azië is het grootste continent ter wereld en beslaat ongeveer 30% van het totale landoppervlak van de aarde.'
FROM world_regions wr
WHERE wr.slug = 'asia'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Asie',
  'L''Asie est le plus grand continent du monde, couvrant environ 30% de la superficie terrestre totale de la Terre.'
FROM world_regions wr
WHERE wr.slug = 'asia'
ON CONFLICT DO NOTHING;

-- North America
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'North America',
  'North America is the third-largest continent by area, located in the northern hemisphere.'
FROM world_regions wr
WHERE wr.slug = 'north-america'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Noord-Amerika',
  'Noord-Amerika is het derde grootste continent naar oppervlakte en ligt op het noordelijk halfrond.'
FROM world_regions wr
WHERE wr.slug = 'north-america'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Amérique du Nord',
  'L''Amérique du Nord est le troisième plus grand continent par sa superficie, situé dans l''hémisphère nord.'
FROM world_regions wr
WHERE wr.slug = 'north-america'
ON CONFLICT DO NOTHING;

-- South America
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'South America',
  'South America is located primarily in the southern hemisphere and is crossed by the equator.'
FROM world_regions wr
WHERE wr.slug = 'south-america'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Zuid-Amerika',
  'Zuid-Amerika ligt voornamelijk op het zuidelijk halfrond en wordt doorkruist door de evenaar.'
FROM world_regions wr
WHERE wr.slug = 'south-america'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Amérique du Sud',
  'L''Amérique du Sud est située principalement dans l''hémisphère sud et est traversée par l''équateur.'
FROM world_regions wr
WHERE wr.slug = 'south-america'
ON CONFLICT DO NOTHING;

-- Africa
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'Africa',
  'Africa is the second-largest and second-most populous continent in the world.'
FROM world_regions wr
WHERE wr.slug = 'africa'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Afrika',
  'Afrika is het op één na grootste en op één na meest bevolkte continent ter wereld.'
FROM world_regions wr
WHERE wr.slug = 'africa'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Afrique',
  'L''Afrique est le deuxième plus grand et le deuxième continent le plus peuplé au monde.'
FROM world_regions wr
WHERE wr.slug = 'africa'
ON CONFLICT DO NOTHING;

-- Oceania
INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'en',
  'Oceania',
  'Oceania is a geographic region that includes Australasia, Melanesia, Micronesia, and Polynesia.'
FROM world_regions wr
WHERE wr.slug = 'oceania'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'nl',
  'Oceanië',
  'Oceanië is een geografische regio die Australazië, Melanesië, Micronesië en Polynesië omvat.'
FROM world_regions wr
WHERE wr.slug = 'oceania'
ON CONFLICT DO NOTHING;

INSERT INTO world_region_translations (world_region_id, locale_code, name, description)
SELECT
  wr.id,
  'fr',
  'Océanie',
  'L''Océanie est une région géographique qui comprend l''Australasie, la Mélanésie, la Micronésie et la Polynésie.'
FROM world_regions wr
WHERE wr.slug = 'oceania'
ON CONFLICT DO NOTHING;

-- Complete country translations
-- ============================

-- Netherlands translations
INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'nl',
  'Nederland',
  'Nederland is een land in West-Europa met hoofdstad Amsterdam.'
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'fr',
  'Pays-Bas',
  'Les Pays-Bas sont un pays d''Europe occidentale avec Amsterdam pour capitale.'
FROM countries c
WHERE c.iso_code_2 = 'NL'
ON CONFLICT DO NOTHING;

-- Insert more countries for global coverage
-- =========================================

-- France
INSERT INTO countries (world_region_id, slug, iso_code_2, iso_code_3)
SELECT
  wr.id,
  'france',
  'FR',
  'FRA'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

-- Germany
INSERT INTO countries (world_region_id, slug, iso_code_2, iso_code_3)
SELECT
  wr.id,
  'germany',
  'DE',
  'DEU'
FROM world_regions wr
WHERE wr.slug = 'europe'
ON CONFLICT DO NOTHING;

-- United States
INSERT INTO countries (world_region_id, slug, iso_code_2, iso_code_3)
SELECT
  wr.id,
  'united-states',
  'US',
  'USA'
FROM world_regions wr
WHERE wr.slug = 'north-america'
ON CONFLICT DO NOTHING;

-- France translations
INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'en',
  'France',
  'France is a country located in Western Europe with Paris as its capital.'
FROM countries c
WHERE c.iso_code_2 = 'FR'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'nl',
  'Frankrijk',
  'Frankrijk is een land in West-Europa met Parijs als hoofdstad.'
FROM countries c
WHERE c.iso_code_2 = 'FR'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'fr',
  'France',
  'La France est un pays situé en Europe occidentale avec Paris pour capitale.'
FROM countries c
WHERE c.iso_code_2 = 'FR'
ON CONFLICT DO NOTHING;

-- Germany translations
INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'en',
  'Germany',
  'Germany is a country located in Central Europe with Berlin as its capital.'
FROM countries c
WHERE c.iso_code_2 = 'DE'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'nl',
  'Duitsland',
  'Duitsland is een land in Midden-Europa met Berlijn als hoofdstad.'
FROM countries c
WHERE c.iso_code_2 = 'DE'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'fr',
  'Allemagne',
  'L''Allemagne est un pays situé en Europe centrale avec Berlin pour capitale.'
FROM countries c
WHERE c.iso_code_2 = 'DE'
ON CONFLICT DO NOTHING;

-- United States translations
INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'en',
  'United States',
  'The United States is a country located in North America with Washington, D.C. as its capital.'
FROM countries c
WHERE c.iso_code_2 = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'nl',
  'Verenigde Staten',
  'De Verenigde Staten is een land in Noord-Amerika met Washington, D.C. als hoofdstad.'
FROM countries c
WHERE c.iso_code_2 = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO country_translations (country_id, locale_code, name, description)
SELECT
  c.id,
  'fr',
  'États-Unis',
  'Les États-Unis sont un pays situé en Amérique du Nord avec Washington, D.C. pour capitale.'
FROM countries c
WHERE c.iso_code_2 = 'US'
ON CONFLICT DO NOTHING;

-- Amsterdam Districts
-- ===================

-- Centrum
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'centrum'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- West
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'west'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Nieuw-West
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'nieuw-west'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Zuid
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'zuid'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Oost
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'oost'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Noord
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'noord'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Zuidoost
INSERT INTO districts (city_id, slug)
SELECT
  c.id,
  'zuidoost'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Amsterdam Districts Translations (EN)
-- =====================================

-- Centrum
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Centrum',
  'Amsterdam''s historic city center, known for its canals, museums, and lively atmosphere.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'West',
  'Western Amsterdam, featuring diverse neighborhoods, parks, and cultural venues.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Nieuw-West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Nieuw-West',
  'New West Amsterdam, a modern district with residential areas and green spaces.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'nieuw-west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuid
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Zuid',
  'Southern Amsterdam, known for its upscale neighborhoods and business district.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Oost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Oost',
  'Eastern Amsterdam, a dynamic area with a mix of residential and industrial spaces.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Noord
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Noord',
  'Northern Amsterdam, located across the IJ waterway with a growing arts scene.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuidoost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Zuidoost',
  'Southeast Amsterdam, home to the Amsterdam ArenA and diverse communities.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuidoost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Amsterdam Districts Translations (NL)
-- =====================================

-- Centrum
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Centrum',
  'Het historische stadscentrum van Amsterdam, bekend om de grachten, musea en levendige sfeer.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'West',
  'West-Amsterdam, met diverse wijken, parken en culturele locaties.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Nieuw-West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Nieuw-West',
  'Nieuw-West Amsterdam, een moderne wijk met woonwijken en groene ruimtes.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'nieuw-west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuid
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Zuid',
  'Zuid-Amsterdam, bekend om de chique wijken en het zakencentrum.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Oost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Oost',
  'Oost-Amsterdam, een dynamisch gebied met een mix van woon- en industriële ruimtes.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Noord
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Noord',
  'Noord-Amsterdam, gelegen aan de overkant van het IJ met een groeiende kunstscene.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuidoost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Zuidoost',
  'Zuidoost-Amsterdam, huis van de Amsterdam ArenA en diverse gemeenschappen.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuidoost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Amsterdam Districts Translations (FR)
-- =====================================

-- Centrum
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Centre',
  'Le centre historique d''Amsterdam, célèbre pour ses canaux, musées et atmosphère dynamique.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Ouest',
  'Amsterdam ouest, présentant des quartiers diversifiés, des parcs et des lieux culturels.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Nieuw-West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Nieuw-West',
  'Nieuw-West Amsterdam, un district moderne avec des zones résidentielles et des espaces verts.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'nieuw-west' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuid
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Sud',
  'Amsterdam sud, connue pour ses quartiers huppés et son quartier d''affaires.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Oost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Est',
  'Amsterdam est, une zone dynamique avec un mélange d''espaces résidentiels et industriels.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Noord
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Nord',
  'Amsterdam nord, située de l''autre côté de l''IJ avec une scène artistique en croissance.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Zuidoost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Sud-Est',
  'Sud-Est Amsterdam, hogar del Amsterdam ArenA y diversas comunidades.'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuidoost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Add sample neighborhoods for Amsterdam
-- ======================================

-- Jordaan (in Centrum)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'jordaan'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT (district_id, slug) DO NOTHING;

-- De Pijp (in Zuid)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'de-pijp'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Vondelpark (in Zuid)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'vondelpark'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Oostelijk Havengebied (in Oost)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'oostelijk-havengebied'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Amsterdam-Noord (in Noord)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'amsterdam-noord'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Neighborhood translations (EN)
-- ==============================

-- Jordaan
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Jordaan',
  'Historic neighborhood in Centrum, known for its narrow streets, cafes, and antique shops.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'jordaan' AND d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- De Pijp
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'De Pijp',
  'Vibrant neighborhood in Zuid, famous for its markets, restaurants, and multicultural atmosphere.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'de-pijp' AND d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Vondelpark
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Vondelpark',
  'Neighborhood surrounding the famous Vondelpark, popular with families and locals.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'vondelpark' AND d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Oostelijk Havengebied
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Oostelijk Havengebied',
  'Eastern Docklands area, featuring modern architecture and waterfront living.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'oostelijk-havengebied' AND d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Amsterdam-Noord
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Amsterdam-Noord',
  'Northern Amsterdam across the IJ, known for its artistic community and green spaces.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'amsterdam-noord' AND d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Neighborhood translations (NL)
-- ==============================

-- Jordaan
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Jordaan',
  'Historische wijk in Centrum, bekend om de smalle straten, cafés en antiekzaken.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'jordaan' AND d.slug = 'centrum' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- De Pijp
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'De Pijp',
  'Levendige wijk in Zuid, beroemd om de markten, restaurants en multiculturele sfeer.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'de-pijp' AND d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Vondelpark
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Vondelpark',
  'Wijk rond het beroemde Vondelpark, populair bij gezinnen en locals.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'vondelpark' AND d.slug = 'zuid' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Oostelijk Havengebied
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Oostelijk Havengebied',
  'Oostelijke havengebied, met moderne architectuur en waterkant woningen.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'oostelijk-havengebied' AND d.slug = 'oost' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Amsterdam-Noord
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Amsterdam-Noord',
  'Noord-Amsterdam aan de overkant van het IJ, bekend om de artistieke gemeenschap en groene ruimtes.'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE n.slug = 'amsterdam-noord' AND d.slug = 'noord' AND c.slug = 'amsterdam'
ON CONFLICT DO NOTHING;

-- Verification queries
-- ====================

-- SELECT 'Districts created' as status, count(*) as count FROM districts;
-- SELECT 'Neighborhoods created' as status, count(*) as count FROM neighborhoods;
