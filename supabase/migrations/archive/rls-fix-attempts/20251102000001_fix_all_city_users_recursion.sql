/**
 * Fix: Remove ALL Recursive RLS Policies from city_users
 *
 * Problem: Multiple policies on city_users table query city_users recursively,
 * causing infinite recursion when middleware tries to check user roles.
 *
 * Solution: Drop all recursive admin policies. Users can still view their own
 * city access. Admin operations (managing other users' city access) will be
 * handled at the application level with service role, not through RLS.
 */

-- Drop all recursive admin policies
DROP POLICY IF EXISTS "Admins can delete city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can insert city_users for their cities" ON city_users;
DROP POLICY IF EXISTS "Admins can update city_users for their cities" ON city_users;

-- The remaining policies are sufficient and non-recursive:
-- 1. "Users can view own city access" - SELECT with auth.uid() = user_id
-- 2. "Superusers can view all city_users" - SELECT with is_superuser()
-- 3. "Superusers can insert city_users" - INSERT with is_superuser()
-- 4. "Superusers can update city_users" - UPDATE with is_superuser()
-- 5. "Superusers can delete city_users" - DELETE with is_superuser()
--
-- For admin operations, the application will use service role or implement
-- permission checks at the application layer instead of relying on RLS.
