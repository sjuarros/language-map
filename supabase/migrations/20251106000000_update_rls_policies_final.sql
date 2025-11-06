-- Migration: Update RLS Policies to Final Working State
-- Created: 2025-11-06
-- Purpose: Document and ensure reproducible RLS policies for authentication
--
-- This migration creates the definitive RLS policies that match the current
-- working state of the application. After running this, the database will
-- have the same policies as the current production state.
--
-- Critical: These policies are tested and working. Do not modify without testing.

-- =============================================================================
-- city_users RLS policies
-- =============================================================================

-- Drop all existing policies (if they exist from previous migrations)
DROP POLICY IF EXISTS "Users can view own city access" ON city_users;
DROP POLICY IF EXISTS "Superusers can view all city_users" ON city_users;
DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Superusers can insert city_users" ON city_users;
DROP POLICY IF EXISTS "Admins can insert city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Superusers can update city_users" ON city_users;
DROP POLICY IF EXISTS "Admins can update city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Superusers can delete city_users" ON city_users;
DROP POLICY IF EXISTS "Admins can delete city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Superusers can manage all city_users" ON city_users;
DROP POLICY IF EXISTS "Admins can manage city_users for their cities" ON city_users;

-- Create simplified policy that works without recursion
-- Users can see their own city access grants
-- Superusers can see all grants (via is_superuser function)
CREATE POLICY "Users can view own city access"
  ON city_users
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    is_superuser(auth.uid())
  );

-- Grant superusers ability to manage all city_users
CREATE POLICY "Superusers can manage all city_users"
  ON city_users
  FOR ALL
  USING (is_superuser(auth.uid()))
  WITH CHECK (is_superuser(auth.uid()));

-- Admins can manage city_users for cities they admin (note: exact name match)
CREATE POLICY "Admins can manage city_users for their cities"
  ON city_users
  FOR ALL
  USING (is_city_admin(auth.uid(), city_id))
  WITH CHECK (is_city_admin(auth.uid(), city_id));

-- =============================================================================
-- cities RLS policies
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "City users can view assigned cities" ON cities;
DROP POLICY IF EXISTS "Superusers can manage all cities" ON cities;

-- Users can view cities they've been granted access to via city_users
CREATE POLICY "City users can view assigned cities"
  ON cities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM city_users
      WHERE city_users.city_id = cities.id
      AND city_users.user_id = auth.uid()
    )
    OR
    is_superuser(auth.uid())
  );

-- Superusers can manage all cities
CREATE POLICY "Superusers can manage all cities"
  ON cities
  FOR ALL
  USING (is_superuser(auth.uid()))
  WITH CHECK (is_superuser(auth.uid()));

-- =============================================================================
-- city_translations RLS policies
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "City users can view city translations" ON city_translations;
DROP POLICY IF EXISTS "Superusers can manage all city translations" ON city_translations;

-- Users can view city_translations for cities they've been granted access to
CREATE POLICY "City users can view city translations"
  ON city_translations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM city_users
      WHERE city_users.city_id = city_translations.city_id
      AND city_users.user_id = auth.uid()
    )
    OR
    is_superuser(auth.uid())
  );

-- Superusers can manage all city_translations
CREATE POLICY "Superusers can manage all city translations"
  ON city_translations
  FOR ALL
  USING (is_superuser(auth.uid()))
  WITH CHECK (is_superuser(auth.uid()));

-- =============================================================================
-- user_profiles RLS policies
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can manage all profiles" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Superusers can manage all profiles
CREATE POLICY "Superusers can manage all profiles"
  ON user_profiles
  FOR ALL
  USING (is_superuser(auth.uid()))
  WITH CHECK (is_superuser(auth.uid()));

-- =============================================================================
-- Verification
-- =============================================================================

-- Verify policies were created
-- Run this query to confirm:
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('city_users', 'cities', 'city_translations', 'user_profiles')
-- ORDER BY tablename, policyname;

-- Expected output:
-- city_users    | Admins can manage city_users for their cities      | ALL
-- city_users    | Superusers can manage all city_users               | ALL
-- city_users    | Users can view own city access                     | SELECT
-- cities        | City users can view assigned cities                | SELECT
-- cities        | Superusers can manage all cities                   | ALL
-- city_translations | City users can view city translations         | SELECT
-- city_translations | Superusers can manage all city translations    | ALL
-- user_profiles | Superusers can manage all profiles                 | ALL
-- user_profiles | Users can update own profile                       | UPDATE
-- user_profiles | Users can view own profile                         | SELECT
