/**
 * Fix: Remove ALL Policies That Call is_superuser() Across All Tables
 *
 * Problem: The is_superuser() function queries user_profiles, which triggers RLS
 * policies, causing infinite recursion. Even though we simplified is_superuser(),
 * it still causes problems because PostgreSQL evaluates ALL applicable policies.
 *
 * Solution: Drop ALL policies that call is_superuser() across the entire database.
 * Superuser operations will be handled exclusively at the application level using
 * service role client.
 */

-- Drop all remaining policies that call is_superuser()
DROP POLICY IF EXISTS "Superusers can manage cities" ON cities;
DROP POLICY IF EXISTS "Superusers can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Superusers can update all invitations" ON invitations;
DROP POLICY IF EXISTS "Superusers can delete all invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view invitation city grants" ON invitation_city_grants;

-- After this migration, NO RLS policies should call is_superuser().
-- All superuser operations MUST use service role client at the application level.
