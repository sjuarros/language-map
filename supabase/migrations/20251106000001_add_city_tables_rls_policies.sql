-- Migration: Add RLS Policies for All City-Specific Tables
-- Created: 2025-11-06
-- Purpose: Enable proper access control for all city-managed data
--
-- This migration adds RLS policies to all city-specific tables, ensuring:
-- 1. Superusers can access everything
-- 2. Admins can do everything for cities they manage (using is_city_admin)
-- 3. Operators can access data for cities they've been granted access to
--
-- Tables affected: 13 tables
-- - languages, districts, neighborhoods
-- - language_families, taxonomy_types, taxonomy_values
-- - All translation tables
-- - language_taxonomies (junction table)

-- =============================================================================
-- Helper function: Check if user has access to a city
-- =============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS has_city_access(UUID, UUID);

CREATE OR REPLACE FUNCTION has_city_access(p_user_id UUID, p_city_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Superusers have access to all cities
  IF is_superuser(p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Admins have access to cities they manage
  IF is_city_admin(p_user_id, p_city_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has any role for this city
  RETURN EXISTS (
    SELECT 1 FROM city_users
    WHERE city_users.city_id = p_city_id
    AND city_users.user_id = p_user_id
  );
END;
$$;

COMMENT ON FUNCTION has_city_access(UUID, UUID) IS
  'Check if user has access to a specific city. Returns true for superusers, admins of the city, or users with any role for the city.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_city_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_city_access(UUID, UUID) TO anon;

-- =============================================================================
-- languages RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view languages for accessible cities" ON languages;
DROP POLICY IF EXISTS "Admins can manage languages for their cities" ON languages;
DROP POLICY IF EXISTS "Superusers can manage all languages" ON languages;

CREATE POLICY "Users can view languages for accessible cities"
  ON languages
  FOR SELECT
  USING (has_city_access(auth.uid(), city_id));

CREATE POLICY "Admins and superusers can manage languages"
  ON languages
  FOR ALL
  USING (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()));

-- =============================================================================
-- language_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view language translations" ON language_translations;
DROP POLICY IF EXISTS "Admins can manage language translations" ON language_translations;
DROP POLICY IF EXISTS "Superusers can manage all language translations" ON language_translations;

CREATE POLICY "Users can view language translations"
  ON language_translations
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM languages WHERE id = language_translations.language_id)));

CREATE POLICY "Admins and superusers can manage language translations"
  ON language_translations
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM languages WHERE id = language_translations.language_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM languages WHERE id = language_translations.language_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- language_taxonomies RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view language taxonomies" ON language_taxonomies;
DROP POLICY IF EXISTS "Admins can manage language taxonomies" ON language_taxonomies;
DROP POLICY IF EXISTS "Superusers can manage all language taxonomies" ON language_taxonomies;

CREATE POLICY "Users can view language taxonomies"
  ON language_taxonomies
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM languages WHERE id = language_taxonomies.language_id)));

CREATE POLICY "Admins and superusers can manage language taxonomies"
  ON language_taxonomies
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM languages WHERE id = language_taxonomies.language_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM languages WHERE id = language_taxonomies.language_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- districts RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view districts for accessible cities" ON districts;
DROP POLICY IF EXISTS "Admins can manage districts for their cities" ON districts;
DROP POLICY IF EXISTS "Superusers can manage all districts" ON districts;

CREATE POLICY "Users can view districts for accessible cities"
  ON districts
  FOR SELECT
  USING (has_city_access(auth.uid(), city_id));

CREATE POLICY "Admins and superusers can manage districts"
  ON districts
  FOR ALL
  USING (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()));

-- =============================================================================
-- district_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view district translations" ON district_translations;
DROP POLICY IF EXISTS "Admins can manage district translations" ON district_translations;
DROP POLICY IF EXISTS "Superusers can manage all district translations" ON district_translations;

CREATE POLICY "Users can view district translations"
  ON district_translations
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM districts WHERE id = district_translations.district_id)));

CREATE POLICY "Admins and superusers can manage district translations"
  ON district_translations
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM districts WHERE id = district_translations.district_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM districts WHERE id = district_translations.district_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- neighborhoods RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view neighborhoods for accessible cities" ON neighborhoods;
DROP POLICY IF EXISTS "Admins can manage neighborhoods for their cities" ON neighborhoods;
DROP POLICY IF EXISTS "Superusers can manage all neighborhoods" ON neighborhoods;

CREATE POLICY "Users can view neighborhoods for accessible cities"
  ON neighborhoods
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT d.city_id FROM districts d WHERE d.id = neighborhoods.district_id)));

CREATE POLICY "Admins and superusers can manage neighborhoods"
  ON neighborhoods
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT d.city_id FROM districts d WHERE d.id = neighborhoods.district_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT d.city_id FROM districts d WHERE d.id = neighborhoods.district_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- neighborhood_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view neighborhood translations" ON neighborhood_translations;
DROP POLICY IF EXISTS "Admins can manage neighborhood translations" ON neighborhood_translations;
DROP POLICY IF EXISTS "Superusers can manage all neighborhood translations" ON neighborhood_translations;

CREATE POLICY "Users can view neighborhood translations"
  ON neighborhood_translations
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT d.city_id FROM districts d JOIN neighborhoods n ON d.id = n.district_id WHERE n.id = neighborhood_translations.neighborhood_id)));

CREATE POLICY "Admins and superusers can manage neighborhood translations"
  ON neighborhood_translations
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT d.city_id FROM districts d JOIN neighborhoods n ON d.id = n.district_id WHERE n.id = neighborhood_translations.neighborhood_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT d.city_id FROM districts d JOIN neighborhoods n ON d.id = n.district_id WHERE n.id = neighborhood_translations.neighborhood_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- language_families RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view language families" ON language_families;
DROP POLICY IF EXISTS "Admins can manage language families" ON language_families;
DROP POLICY IF EXISTS "Superusers can manage all language families" ON language_families;

CREATE POLICY "Users can view language families"
  ON language_families
  FOR SELECT
  USING (
    -- Language families are accessible if any language in any city references them
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_families.id
      AND has_city_access(auth.uid(), l.city_id)
    )
  );

CREATE POLICY "Admins and superusers can manage language families"
  ON language_families
  FOR ALL
  USING (
    -- Admins can manage if they can manage any language that uses this family
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_families.id
      AND (is_city_admin(auth.uid(), l.city_id) OR is_superuser(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_families.id
      AND (is_city_admin(auth.uid(), l.city_id) OR is_superuser(auth.uid()))
    )
  );

-- =============================================================================
-- language_family_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view language family translations" ON language_family_translations;
DROP POLICY IF EXISTS "Admins can manage language family translations" ON language_family_translations;
DROP POLICY IF EXISTS "Superusers can manage all language family translations" ON language_family_translations;

CREATE POLICY "Users can view language family translations"
  ON language_family_translations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_family_translations.family_id
      AND has_city_access(auth.uid(), l.city_id)
    )
  );

CREATE POLICY "Admins and superusers can manage language family translations"
  ON language_family_translations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_family_translations.family_id
      AND (is_city_admin(auth.uid(), l.city_id) OR is_superuser(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM languages l
      WHERE l.language_family_id = language_family_translations.family_id
      AND (is_city_admin(auth.uid(), l.city_id) OR is_superuser(auth.uid()))
    )
  );

-- =============================================================================
-- taxonomy_types RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view taxonomy types" ON taxonomy_types;
DROP POLICY IF EXISTS "Admins can manage taxonomy types" ON taxonomy_types;
DROP POLICY IF EXISTS "Superusers can manage all taxonomy types" ON taxonomy_types;

CREATE POLICY "Users can view taxonomy types"
  ON taxonomy_types
  FOR SELECT
  USING (has_city_access(auth.uid(), city_id));

CREATE POLICY "Admins and superusers can manage taxonomy types"
  ON taxonomy_types
  FOR ALL
  USING (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), city_id) OR is_superuser(auth.uid()));

-- =============================================================================
-- taxonomy_type_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view taxonomy type translations" ON taxonomy_type_translations;
DROP POLICY IF EXISTS "Admins can manage taxonomy type translations" ON taxonomy_type_translations;
DROP POLICY IF EXISTS "Superusers can manage all taxonomy type translations" ON taxonomy_type_translations;

CREATE POLICY "Users can view taxonomy type translations"
  ON taxonomy_type_translations
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_type_translations.taxonomy_type_id)));

CREATE POLICY "Admins and superusers can manage taxonomy type translations"
  ON taxonomy_type_translations
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_type_translations.taxonomy_type_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_type_translations.taxonomy_type_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- taxonomy_values RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view taxonomy values" ON taxonomy_values;
DROP POLICY IF EXISTS "Admins can manage taxonomy values" ON taxonomy_values;
DROP POLICY IF EXISTS "Superusers can manage all taxonomy values" ON taxonomy_values;

CREATE POLICY "Users can view taxonomy values"
  ON taxonomy_values
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_values.taxonomy_type_id)));

CREATE POLICY "Admins and superusers can manage taxonomy values"
  ON taxonomy_values
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_values.taxonomy_type_id)) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = taxonomy_values.taxonomy_type_id)) OR is_superuser(auth.uid()));

-- =============================================================================
-- taxonomy_value_translations RLS policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view taxonomy value translations" ON taxonomy_value_translations;
DROP POLICY IF EXISTS "Admins can manage taxonomy value translations" ON taxonomy_value_translations;
DROP POLICY IF EXISTS "Superusers can manage all taxonomy value translations" ON taxonomy_value_translations;

CREATE POLICY "Users can view taxonomy value translations"
  ON taxonomy_value_translations
  FOR SELECT
  USING (has_city_access(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = (SELECT taxonomy_type_id FROM taxonomy_values WHERE id = taxonomy_value_translations.taxonomy_value_id))));

CREATE POLICY "Admins and superusers can manage taxonomy value translations"
  ON taxonomy_value_translations
  FOR ALL
  USING (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = (SELECT taxonomy_type_id FROM taxonomy_values WHERE id = taxonomy_value_translations.taxonomy_value_id))) OR is_superuser(auth.uid()))
  WITH CHECK (is_city_admin(auth.uid(), (SELECT city_id FROM taxonomy_types WHERE id = (SELECT taxonomy_type_id FROM taxonomy_values WHERE id = taxonomy_value_translations.taxonomy_value_id))) OR is_superuser(auth.uid()));

-- =============================================================================
-- Verification
-- =============================================================================

-- Count policies created
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN (
--   'languages', 'language_translations', 'language_taxonomies',
--   'districts', 'district_translations',
--   'neighborhoods', 'neighborhood_translations',
--   'language_families', 'language_family_translations',
--   'taxonomy_types', 'taxonomy_type_translations',
--   'taxonomy_values', 'taxonomy_value_translations'
-- )
-- GROUP BY tablename
-- ORDER BY tablename;

-- Expected: Each table should have 2 policies (SELECT and ALL)
-- Total: 26 policies
