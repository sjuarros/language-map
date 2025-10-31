-- Load translations and test users
-- (After districts and neighborhoods are created)

-- ========================================================
-- SECTION 1: District Translations
-- ========================================================

-- Centrum
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Centrum',
  'Historic city center with canals and museums'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'centrum'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Centrum',
  'Historisch stadscentrum met grachten en musea'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'centrum'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Centrum',
  'Centre historique de la ville avec canaux et musées'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'centrum'
ON CONFLICT DO NOTHING;

-- West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'West',
  'Diverse neighborhoods, parks, and cultural venues'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'west'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'West',
  'Diverse wijken, parken en culturele locaties'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'west'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'West',
  'Quartiers divers, parcs et lieux culturels'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'west'
ON CONFLICT DO NOTHING;

-- Nieuw-West
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Nieuw-West',
  'Modern district with residential areas and green spaces'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'nieuw-west'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Nieuw-West',
  'Moderne wijk met woonwijken en groene ruimtes'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'nieuw-west'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Nieuw-Ouest',
  'Quartier moderne avec zones résidentielles et espaces verts'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'nieuw-west'
ON CONFLICT DO NOTHING;

-- Zuid
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Zuid',
  'Upscale neighborhoods and business district'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuid'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Zuid',
  'Chique wijken en zakendistrict'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuid'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Zuid',
  'Quartiers huppés et district commercial'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuid'
ON CONFLICT DO NOTHING;

-- Oost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Oost',
  'Dynamic area mixing residential and industrial zones'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'oost'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Oost',
  'Dynamisch gebied met woningen en industrie'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'oost'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Oost',
  'Zone dynamique mélangeant résidentiel et industriel'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'oost'
ON CONFLICT DO NOTHING;

-- Noord
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Noord',
  'Area across the IJ waterway with growing arts scene'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'noord'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Noord',
  'Gebied over het IJ met groeiende kunstscene'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'noord'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Noord',
  'Zone à travers l''IJ avec une scène artistique en croissance'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'noord'
ON CONFLICT DO NOTHING;

-- Zuidoost
INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'en',
  'Zuidoost',
  'Home to Amsterdam ArenA and diverse communities'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuidoost'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'nl',
  'Zuidoost',
  'Thuisbasis van Amsterdam ArenA en diverse gemeenschappen'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuidoost'
ON CONFLICT DO NOTHING;

INSERT INTO district_translations (district_id, locale_code, name, description)
SELECT
  d.id,
  'fr',
  'Zuidoost',
  'Accueil de l''Amsterdam ArenA et communautés diverses'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuidoost'
ON CONFLICT DO NOTHING;

-- ========================================================
-- SECTION 2: Neighborhood Translations
-- ========================================================

-- Jordaan
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Jordaan',
  'Historic narrow streets with cafes and antique shops'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'jordaan'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Jordaan',
  'Historische smalle straten met cafes en antiekzaakjes'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'jordaan'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'fr',
  'Jordaan',
  'Rues étroites historiques avec cafes et magasins d''antiquités'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'jordaan'
ON CONFLICT DO NOTHING;

-- De Pijp
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'De Pijp',
  'Vibrant neighborhood with markets and multicultural atmosphere'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'de-pijp'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'De Pijp',
  'Levendige buurt met markten en multiculturele sfeer'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'de-pijp'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'fr',
  'De Pijp',
  'Quartier dynamique avec marchés et ambiance multiculturelle'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'de-pijp'
ON CONFLICT DO NOTHING;

-- Vondelpark
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Vondelpark',
  'Area around the famous park, popular with families'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'vondelpark'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Vondelpark',
  'Gebied rondom het beroemde park, populair bij gezinnen'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'vondelpark'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'fr',
  'Vondelpark',
  'Zone autour du famous parc, populaire auprès des familles'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'vondelpark'
ON CONFLICT DO NOTHING;

-- Oostelijk Havengebied
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Oostelijk Havengebied',
  'Eastern docklands with modern architecture'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'oostelijk-havengebied'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Oostelijk Havengebied',
  'Oostelijke havengebieden met moderne architectuur'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'oostelijk-havengebied'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'fr',
  'Oostelijk Havengebied',
  'Bassins Est avec architecture moderne'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'oostelijk-havengebied'
ON CONFLICT DO NOTHING;

-- Amsterdam-Noord
INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'en',
  'Amsterdam-Noord',
  'Artistic community with green spaces'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'amsterdam-noord'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'nl',
  'Amsterdam-Noord',
  'Artistieke gemeenschap met groene ruimtes'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'amsterdam-noord'
ON CONFLICT DO NOTHING;

INSERT INTO neighborhood_translations (neighborhood_id, locale_code, name, description)
SELECT
  n.id,
  'fr',
  'Amsterdam-Noord',
  'Communauté artistique avec espaces verts'
FROM neighborhoods n
JOIN districts d ON n.district_id = d.id
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND n.slug = 'amsterdam-noord'
ON CONFLICT DO NOTHING;