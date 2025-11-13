-- ============================================
-- FIX AUTH.USERS NULLABLE COLUMNS
-- ============================================
-- Issue: GoTrue (Supabase Auth service) expects certain columns in auth.users
-- to always have string values, but they were created as nullable VARCHAR columns
-- without default values. This causes "Database error finding user" when sending
-- magic links.
--
-- Error: "sql: Scan error on column index 8, name \"email_change\":
--         converting NULL to string is unsupported"
--
-- Solution: Set default empty strings and update existing NULL values.
--
-- Date: November 5, 2025
-- Context: Discovered during Phase 2 Day 22 testing

-- Update existing NULL values to empty strings
UPDATE auth.users
SET email_change = ''
WHERE email_change IS NULL;

UPDATE auth.users
SET email_change_token_new = ''
WHERE email_change_token_new IS NULL;

-- Set default values for future inserts (requires superuser, may fail in hosted Supabase)
-- These will be attempted but may not succeed depending on permissions
DO $$
BEGIN
  -- Try to set defaults, but don't fail if we don't have permission
  BEGIN
    ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipped setting default for email_change (insufficient privileges)';
  END;

  BEGIN
    ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipped setting default for email_change_token_new (insufficient privileges)';
  END;
END $$;

-- Verify the fix
DO $$
DECLARE
  null_email_change_count INTEGER;
  null_token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_email_change_count
  FROM auth.users
  WHERE email_change IS NULL;

  SELECT COUNT(*) INTO null_token_count
  FROM auth.users
  WHERE email_change_token_new IS NULL;

  IF null_email_change_count > 0 OR null_token_count > 0 THEN
    RAISE WARNING 'Found % NULL email_change and % NULL email_change_token_new values after migration',
                  null_email_change_count, null_token_count;
  ELSE
    RAISE NOTICE 'Successfully fixed all NULL values in auth.users';
  END IF;
END $$;

-- Note: COMMENT statements omitted as they require table ownership (supabase_admin)
-- Documentation is provided in the migration header comments above
