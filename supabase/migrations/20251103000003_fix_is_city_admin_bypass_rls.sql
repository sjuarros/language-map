-- Migration: Fix infinite recursion in city_users policies
-- Created: 2025-11-03
-- Issue: Admin policies on city_users call is_city_admin, which queries city_users, creating infinite recursion
-- Solution: Remove admin policies (admins don't need to manage city_users anyway)

-- Drop the problematic admin policies that create infinite recursion
-- ===================================================================

DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can insert city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can update city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can delete city_users for their cities" ON city_users;

-- Keep only the non-recursive policies:
-- 1. Users can view their own city access (auth.uid() = user_id)
-- 2. Superusers can manage all city_users (is_superuser queries user_profiles, not city_users)

-- Note: Admins don't need special access to city_users table
-- They can manage users through the admin UI which uses service role

-- Verification (commented out)
-- ============================

-- Test that superuser can still query city_users
-- SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
-- SET LOCAL role TO authenticated;
-- SELECT * FROM city_users LIMIT 1;
