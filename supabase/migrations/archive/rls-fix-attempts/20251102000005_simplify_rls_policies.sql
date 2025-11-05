/**
 * Fix: Simplify RLS policies to avoid recursion entirely
 *
 * Problem: Complex RLS policies with function calls and subqueries cause infinite recursion.
 *
 * Solution: Drastically simplify RLS policies for user_profiles and city_users to only
 * check auth.uid() = id/user_id. Remove all complex policies that query other tables.
 * Authorization for admin/superuser actions will be handled at the application level.
 */

-- Simplify user_profiles policies: users can only see their own profile
DROP POLICY IF EXISTS "Superusers can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can delete profiles" ON user_profiles;

-- Keep only the simple self-access policies
-- SELECT: Already has "Users can view own profile" with auth.uid() = id
-- UPDATE: Already simplified to auth.uid() = id

--  For admin/superuser operations, the application will use service role

-- city_users is already simplified - keeping only:
-- - "Users can view own city access" (auth.uid() = user_id)
-- - Superuser policies (which won't be used by regular auth flow)

-- This ensures that when middleware checks user_profiles for role/is_active,
-- it only triggers the simple "Users can view own profile" policy with no recursion.
