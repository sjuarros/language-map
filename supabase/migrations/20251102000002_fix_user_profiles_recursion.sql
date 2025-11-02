/**
 * Fix: Remove Recursive RLS Policy from user_profiles
 *
 * Problem: The "Admins can view profiles for their cities" policy on user_profiles
 * joins user_profiles with city_users, which triggers user_profiles RLS policies
 * again, causing infinite recursion.
 *
 * Solution: Drop the recursive admin policy. Users can view their own profile.
 * Superusers can view all profiles. Admin operations (viewing other users' profiles)
 * will be handled at the application level with service role.
 */

-- Drop the recursive admin policy
DROP POLICY IF EXISTS "Admins can view profiles for their cities" ON user_profiles;

-- The remaining SELECT policies are sufficient and non-recursive:
-- 1. "Users can view own profile" - auth.uid() = id
-- 2. "Superusers can view all profiles" - is_superuser(auth.uid())
--
-- For admin operations (viewing other users' profiles), the application will
-- use service role or implement permission checks at the application layer.
