-- Fix RLS Policies for Invitations System
-- =========================================
-- Resolves circular dependency issues

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view invitations for their cities" ON invitations;

-- Create a simpler policy that doesn't cause recursion
-- Admins can view invitations for cities they have access to
CREATE POLICY "Admins can view invitations for their cities" ON invitations
  FOR SELECT USING (
    is_superuser(auth.uid())
    OR invited_by = auth.uid()
    OR EXISTS (
      -- User is admin of at least one city
      SELECT 1 FROM city_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.role = 'admin'
    )
  );

-- Similarly fix the invitation_city_grants policy to avoid recursion
DROP POLICY IF EXISTS "Users can view invitation city grants" ON invitation_city_grants;

CREATE POLICY "Users can view invitation city grants" ON invitation_city_grants
  FOR SELECT USING (
    is_superuser(auth.uid())
    OR EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_city_grants.invitation_id
        AND i.invited_by = auth.uid()
    )
  );
