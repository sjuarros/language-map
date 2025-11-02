# Seed Data

This directory contains seed data files for populating the database with initial data.

**Last Updated**: November 3, 2025
**Status**: Not yet applied

---

## Overview

Seed data files have been separated from schema migrations because they:

1. **Depend on specific setup** - Require Amsterdam city and districts to exist
2. **Will be loaded later** - Part of Phase 2 implementation
3. **Failed when run early** - Cannot be applied until prerequisite data exists
4. **Are environment-specific** - May differ between development, staging, production

---

## Seed Files

### 1. load_seed_data.sql (12K)

**Original migration**: `20251030000003_load_seed_data.sql`
**Purpose**: Load geographic data for Amsterdam

**Contents**:
- District translations (Centrum, West, Nieuw-West, Zuid, Oost, Noord, Zuidoost)
- Neighborhood translations for all Amsterdam districts
- Geographic boundaries and center points

**Dependencies**:
- Requires `cities` table with Amsterdam entry
- Requires `districts` table with Amsterdam districts
- Requires `locales` table with en, nl, fr
- Requires all translation tables to exist

**Status**: Ready to apply after Amsterdam city setup is complete

---

### 2. load_translations_and_users.sql (12K)

**Original migration**: `20251030000004_load_translations_and_users.sql`
**Purpose**: Load additional translations and test users

**Contents**:
- Additional city translations
- Test user accounts
- User role assignments
- City access grants

**Dependencies**:
- Requires geographic data from `load_seed_data.sql`
- Requires user management tables
- Requires Amsterdam city to exist

**Status**: Ready to apply after seed data is loaded

---

## How to Apply Seed Data

### Prerequisites

Before applying seed data, ensure:

1. ✅ All schema migrations applied (at least through `20251030000003_create_districts_neighborhoods.sql`)
2. ✅ Amsterdam city created in database
3. ✅ Amsterdam districts created
4. ✅ Locales (en, nl, fr) exist

### Apply Seed Data

**Step 1: Load geographic data**
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f /path/to/supabase/seed/20251030000003_load_seed_data.sql
```

**Step 2: Load translations and users**
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f /path/to/supabase/seed/20251030000004_load_translations_and_users.sql
```

**Step 3: Verify data loaded**
```sql
-- Check district translations
SELECT d.slug, dt.name, dt.locale_code
FROM districts d
JOIN district_translations dt ON d.id = dt.district_id
WHERE d.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
ORDER BY d.slug, dt.locale_code;

-- Check neighborhood translations
SELECT n.slug, nt.name, nt.locale_code
FROM neighborhoods n
JOIN neighborhood_translations nt ON n.id = nt.neighborhood_id
JOIN districts d ON n.district_id = d.id
WHERE d.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
ORDER BY n.slug, nt.locale_code
LIMIT 20;
```

---

## Known Issues

### Issue: NULL value in column "district_id" violates not-null constraint

**Error Message**:
```
ERROR: null value in column "district_id" of relation "district_translations" violates not-null constraint
```

**Cause**: The `SELECT` subquery returns NULL because the district doesn't exist yet.

**Example of problematic code**:
```sql
INSERT INTO district_translations (district_id, locale_code, name, description) VALUES
  ((SELECT id FROM districts WHERE slug = 'centrum' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')), 'en', 'Centrum', 'Historic city center');
  -- If Amsterdam or Centrum district doesn't exist, this returns NULL → error
```

**Solution**: Ensure Amsterdam city and all districts are created before loading seed data.

---

## Creating Amsterdam Prerequisites

If Amsterdam doesn't exist yet, create it first:

```sql
-- 1. Create locales (if not exist)
INSERT INTO locales (code, name, native_name, is_default, is_active)
VALUES
  ('en', 'English', 'English', true, true),
  ('nl', 'Dutch', 'Nederlands', false, true),
  ('fr', 'French', 'Français', false, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Create world region (if not exist)
INSERT INTO world_regions (id, slug, iso_code)
VALUES ('11111111-1111-1111-1111-111111111111', 'europe', 'EU')
ON CONFLICT (id) DO NOTHING;

-- 3. Create country (if not exist)
INSERT INTO countries (id, world_region_id, slug, iso_code_2, iso_code_3)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'netherlands', 'NL', 'NLD')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Amsterdam city
INSERT INTO cities (id, country_id, slug, status, center_lat, center_lng, default_zoom)
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'amsterdam', 'active', 52.3676, 4.9041, 12)
ON CONFLICT (id) DO NOTHING;

-- 5. Create Amsterdam districts
-- (Centrum, West, Nieuw-West, Zuid, Oost, Noord, Zuidoost)
-- See main schema migrations for district creation SQL
```

**Note**: This prerequisite data should ideally be in a separate migration or created as part of Phase 2 implementation.

---

## Development Workflow

### Option 1: Manual Seed (Current Approach)

1. Apply all schema migrations
2. Manually create Amsterdam city and districts
3. Apply seed data files
4. Verify data loaded correctly

### Option 2: Idempotent Seed (Recommended for Future)

Refactor seed files to be idempotent and handle missing data:

```sql
-- Example: Better approach
DO $$
DECLARE
  v_city_id UUID;
  v_district_id UUID;
BEGIN
  -- Get or create Amsterdam
  SELECT id INTO v_city_id FROM cities WHERE slug = 'amsterdam';

  IF v_city_id IS NULL THEN
    RAISE NOTICE 'Amsterdam city not found. Skipping seed data.';
    RETURN;
  END IF;

  -- Get district
  SELECT id INTO v_district_id FROM districts
  WHERE slug = 'centrum' AND city_id = v_city_id;

  IF v_district_id IS NOT NULL THEN
    -- Insert translations if district exists
    INSERT INTO district_translations (district_id, locale_code, name, description)
    VALUES (v_district_id, 'en', 'Centrum', 'Historic city center')
    ON CONFLICT (district_id, locale_code) DO UPDATE
    SET name = EXCLUDED.name, description = EXCLUDED.description;
  END IF;
END $$;
```

This approach:
- ✅ Handles missing data gracefully
- ✅ Can be run multiple times safely
- ✅ Provides clear error messages
- ✅ Doesn't fail the entire migration

---

## Future Improvements

1. **Refactor seed files** to be idempotent with ON CONFLICT clauses
2. **Add checks** for prerequisite data existence
3. **Separate by environment** (dev, staging, production)
4. **Create seed functions** instead of raw SQL files
5. **Add verification queries** at end of each file

---

## Related Documentation

- Main migrations README: `../migrations/README.md`
- Architecture docs: `docs/architecture.md`
- Phase 2 implementation: `docs/implementation-phases/phase-2-operator-crud/`

---

**Note**: These seed files will be refactored during Phase 2 implementation to be more robust and environment-aware.
