/**
 * Fix: Remove ALL Superuser RLS Policies to Prevent Recursion
 *
 * Problem: PostgreSQL evaluates ALL applicable policies for a query, not just one.
 * Even though "Users can view own profile" (auth.uid() = id) should work, PostgreSQL
 * ALSO evaluates "Superusers can view all" policies which call is_superuser(), causing
 * infinite recursion.
 *
 * Solution: Remove ALL superuser policies. Superuser operations will be handled at the
 * application level using service role client, NOT through RLS.
 */

-- Drop all superuser policies from user_profiles
DROP POLICY IF EXISTS "Superusers can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can delete profiles" ON user_profiles;

-- Drop all superuser policies from city_users
DROP POLICY IF EXISTS "Superusers can view all city_users" ON city_users;
DROP POLICY IF EXISTS "Superusers can insert city_users" ON city_users;
DROP POLICY IF EXISTS "Superusers can update city_users" ON city_users;
DROP POLICY IF EXISTS "Superusers can delete city_users" ON city_users;

-- Remaining policies are minimal and non-recursive:
-- user_profiles:
--   - "Users can view own profile" (SELECT with auth.uid() = id)
--   - "Users can update own profile" (UPDATE with auth.uid() = id)
-- city_users:
--   - "Users can view own city access" (SELECT with auth.uid() = user_id)
--
-- All admin and superuser operations MUST use service role client at application level.
