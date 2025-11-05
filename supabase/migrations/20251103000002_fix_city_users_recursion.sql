-- Migration: Fix infinite recursion in city_users RLS policies
-- Created: 2025-11-03
-- Issue: Admin policies on city_users query city_users, causing infinite recursion
-- Solution: Create helper function that bypasses RLS, update policies to use it

-- Drop existing problematic policies
-- ==================================

DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can insert city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can update city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can delete city_users for their cities" ON city_users;

-- Create helper function to check if user is admin for a city
-- ============================================================

-- Drop existing function first (may have different parameter names)
DROP FUNCTION IF EXISTS is_city_admin(UUID, UUID);

CREATE OR REPLACE FUNCTION is_city_admin(p_user_id UUID, p_city_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Superusers have admin access to all cities
  IF is_superuser(p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is explicitly an admin for this city
  -- This query bypasses RLS because function is SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 FROM city_users cu
    WHERE cu.user_id = p_user_id
      AND cu.city_id = p_city_id
      AND cu.role = 'admin'
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION is_city_admin(UUID, UUID) IS
  'Check if user is admin for a specific city. Returns true for superusers. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';

-- Recreate policies
-- ==================

-- Superuser policies (using is_superuser which is SECURITY DEFINER)
-- ------------------------------------------------------------------

CREATE POLICY "Superusers can view all city_users" ON city_users
  FOR SELECT USING (is_superuser(auth.uid()));

CREATE POLICY "Superusers can insert city_users" ON city_users
  FOR INSERT WITH CHECK (is_superuser(auth.uid()));

CREATE POLICY "Superusers can update city_users" ON city_users
  FOR UPDATE USING (is_superuser(auth.uid()));

CREATE POLICY "Superusers can delete city_users" ON city_users
  FOR DELETE USING (is_superuser(auth.uid()));

-- Admin policies (using is_city_admin helper function)
-- -----------------------------------------------------

CREATE POLICY "Admins can view city_users for their cities" ON city_users
  FOR SELECT USING (
    is_city_admin(auth.uid(), city_id)
  );

CREATE POLICY "Admins can insert city_users for their cities" ON city_users
  FOR INSERT WITH CHECK (
    is_city_admin(auth.uid(), city_id)
  );

CREATE POLICY "Admins can update city_users for their cities" ON city_users
  FOR UPDATE USING (
    is_city_admin(auth.uid(), city_id)
  );

CREATE POLICY "Admins can delete city_users for their cities" ON city_users
  FOR DELETE USING (
    is_city_admin(auth.uid(), city_id)
  );

-- Grant execute permission on the function
-- ========================================

GRANT EXECUTE ON FUNCTION is_city_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_city_admin(UUID, UUID) TO anon;

-- Verification (commented out)
-- ============================

-- Test that superuser can query city_users without recursion
-- SELECT * FROM city_users LIMIT 1;

-- Test that admin can query city_users for their cities
-- SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000002';
-- SELECT * FROM city_users WHERE city_id = (SELECT id FROM cities WHERE slug = 'amsterdam');
