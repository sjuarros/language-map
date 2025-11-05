/**
 * Fix: Remove Problematic Admin RLS Policies
 *
 * Date: November 3, 2025
 * Issue: Admin authentication failing due to RLS circular dependencies
 *
 * This migration consolidates all RLS policy fixes that were applied during
 * the admin authentication debugging session. It drops all admin policies
 * that caused infinite recursion by querying the same tables they protect.
 *
 * Root Cause:
 * - Admin policies on city_users queried city_users recursively
 * - Admin policy on user_profiles queried city_users which triggered recursion
 * - These policies caused "infinite recursion detected" errors (42P17)
 *
 * Solution:
 * - Drop all problematic admin policies
 * - Keep only superuser policies (which use is_superuser() helper)
 * - Keep "users can view own" policies (which use auth.uid() = user_id)
 * - Admin operations now handled at application level with service role
 *
 * Related Documentation:
 * - docs/debugging/admin-authentication-issue-summary.md
 * - docs/debugging/superuser-authentication-fix-summary.md
 */

-- ============================================
-- CITY_USERS TABLE: Remove Admin Policies
-- ============================================

-- Drop all recursive admin policies from city_users
-- These policies queried city_users within city_users RLS checks
DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can insert city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can update city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can delete city_users for their cities" ON city_users;

-- Remaining policies on city_users (non-recursive, working correctly):
-- 1. "Users can view own city access" FOR SELECT
--    USING (auth.uid() = user_id)
--
-- 2. "Superusers can view all city_users" FOR SELECT
--    USING (is_superuser(auth.uid()))
--
-- 3. "Superusers can insert city_users" FOR INSERT
--    WITH CHECK (is_superuser(auth.uid()))
--
-- 4. "Superusers can update city_users" FOR UPDATE
--    USING (is_superuser(auth.uid()))
--
-- 5. "Superusers can delete city_users" FOR DELETE
--    USING (is_superuser(auth.uid()))

-- ============================================
-- USER_PROFILES TABLE: Remove Admin Policies
-- ============================================

-- Drop recursive admin policy from user_profiles
-- This policy joined user_profiles with city_users, causing recursion
DROP POLICY IF EXISTS "Admins can view profiles for their cities" ON user_profiles;

-- Remaining policies on user_profiles (non-recursive, working correctly):
-- 1. "Users can view own profile" FOR SELECT
--    USING (auth.uid() = id)
--
-- 2. "Superusers can view all profiles" FOR SELECT
--    USING (is_superuser(auth.uid()))
--
-- 3. "Superusers can insert profiles" FOR INSERT
--    WITH CHECK (is_superuser(auth.uid()))
--
-- 4. "Superusers can update profiles" FOR UPDATE
--    USING (is_superuser(auth.uid()))
--    WITH CHECK (is_superuser(auth.uid()))
--
-- 5. "Users can update own profile" FOR UPDATE
--    USING (auth.uid() = id)
--    WITH CHECK (auth.uid() = id AND role = ... AND is_active = ...)
--
-- 6. "Superusers can delete profiles" FOR DELETE
--    USING (is_superuser(auth.uid()))

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- To verify the current state, run:
--
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('city_users', 'user_profiles')
-- ORDER BY tablename, policyname;
--
-- Expected city_users policies: 5 total
--   - 4 superuser policies (SELECT, INSERT, UPDATE, DELETE)
--   - 1 user policy (SELECT own)
--
-- Expected user_profiles policies: 6 total
--   - 4 superuser policies (SELECT, INSERT, UPDATE, DELETE)
--   - 2 user policies (SELECT own, UPDATE own)

-- ============================================
-- IMPACT AND LESSONS LEARNED
-- ============================================

-- Impact:
-- ✅ Admin authentication now works correctly
-- ✅ Superuser authentication works correctly
-- ✅ Operator authentication still works (no regression)
-- ✅ No more RLS infinite recursion errors
--
-- Lessons:
-- 1. RLS policies should NOT query the same table they protect
-- 2. Complex authorization logic belongs in application code, not RLS
-- 3. Use helper functions (like is_superuser()) to avoid recursion
-- 4. Always test RLS policies with actual client queries, not just service role
-- 5. Client Components required for Supabase auth (Server Components can't access cookies)
--
-- Architecture Pattern:
-- - Layouts: Authentication only (is user logged in?)
-- - Pages: Authorization (does user have required role/permissions?)
-- - This separation prevents RLS recursion and keeps logic clean
