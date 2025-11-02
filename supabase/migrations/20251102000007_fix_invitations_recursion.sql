/**
 * Fix: Remove Recursive Policies from invitations Table
 *
 * Problem: The invitations table has admin policies that query city_users,
 * which can cause cascading RLS evaluation and infinite recursion.
 *
 * Solution: Drop admin policies that query city_users. Invitation management
 * will be handled at the application level using service role.
 */

-- Drop recursive admin policies from invitations
DROP POLICY IF EXISTS "Admins can view invitations for their cities" ON invitations;
DROP POLICY IF EXISTS "Admins can insert invitations for their cities" ON invitations;

-- Keep simple policies that don't cause recursion:
-- - Users can view their own invitations
-- - Inviters can insert invitations (may still have city_users reference but less likely to recurse)
