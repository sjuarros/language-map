-- Create Amsterdam districts and neighborhoods
-- (without translations to avoid FK constraint issues)

-- Insert Amsterdam districts
-- ==========================

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

-- Insert Amsterdam neighborhoods
-- ===============================

-- Jordaan (Centrum)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'jordaan'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'centrum'
ON CONFLICT (district_id, slug) DO NOTHING;

-- De Pijp (Zuid)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'de-pijp'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuid'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Vondelpark (Zuid)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'vondelpark'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'zuid'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Oostelijk Havengebied (Oost)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'oostelijk-havengebied'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'oost'
ON CONFLICT (district_id, slug) DO NOTHING;

-- Amsterdam-Noord (Noord)
INSERT INTO neighborhoods (district_id, slug)
SELECT
  d.id,
  'amsterdam-noord'
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'amsterdam' AND d.slug = 'noord'
ON CONFLICT (district_id, slug) DO NOTHING;