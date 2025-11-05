/**
 * Fix: Remove is_superuser() and city_users from Inviters INSERT policy
 *
 * Problem: "Inviters can insert invitations" policy has WITH CHECK that calls
 * is_superuser() and queries city_users, causing infinite recursion.
 *
 * Solution: Simplify to only check invited_by = auth.uid(). Permission to invite
 * users will be handled at the application level.
 */

-- Drop and recreate the policy without recursion
DROP POLICY IF EXISTS "Inviters can insert invitations" ON invitations;

CREATE POLICY "Inviters can insert invitations" ON invitations
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- This allows any authenticated user to create invitations where they are the inviter.
-- The application layer should enforce additional checks (e.g., only admins can invite).
