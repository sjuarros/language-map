/**
 * Fix: Infinite Recursion in city_users RLS Policies
 *
 * Problem: The "Admins can view city_users for their cities" policy queries city_users
 * within its own RLS check, creating infinite recursion when middleware tries to
 * query user_profiles (which references city_users).
 *
 * Solution: Drop the recursive admin SELECT policy. The "Users can view own city access"
 * policy already allows users to see their own city_users rows. Admins and superusers
 * don't need a separate SELECT policy since they can already view their own rows.
 *
 * For viewing OTHER users' city access (admin functionality), we'll handle that at the
 * application level with explicit queries, not RLS.
 */

-- Drop the recursive policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;

-- The remaining policies are sufficient:
-- 1. "Users can view own city access" - allows auth.uid() = user_id (no recursion)
-- 2. "Superusers can view all city_users" - uses is_superuser() function (no recursion)
--
-- For admin operations (viewing other users' city access), the application will need to
-- use service role or handle it differently.
