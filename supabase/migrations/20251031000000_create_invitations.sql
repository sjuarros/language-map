-- Create Invitations System
-- ========================
-- Handles user invitations with city access grants

-- 15. INVITATIONS TABLE
-- =====================
-- Stores invitation records for user onboarding

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  full_name VARCHAR(255),
  invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Apply triggers to update updated_at timestamp
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- INVITATIONS RLS POLICIES
-- ========================

-- Inviters can view their own invitations
CREATE POLICY "Inviters can view own invitations" ON invitations
  FOR SELECT USING (invited_by = auth.uid());

-- Superusers can view all invitations
CREATE POLICY "Superusers can view all invitations" ON invitations
  FOR SELECT USING (is_superuser(auth.uid()));

-- Admins can view invitations for their cities
CREATE POLICY "Admins can view invitations for their cities" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cities c
      JOIN city_users cu ON c.id = cu.city_id
      WHERE cu.user_id = auth.uid()
        AND cu.role = 'admin'
        AND c.id IN (
          -- Get cities from invitation grants (we'll check this in the grants table)
          SELECT city_id FROM invitation_city_grants WHERE invitation_id = invitations.id
        )
    )
  );

-- Inviters can insert invitations
CREATE POLICY "Inviters can insert invitations" ON invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND is_superuser(auth.uid())
  );

-- Admins can insert invitations for their cities
CREATE POLICY "Admins can insert invitations for their cities" ON invitations
  FOR INSERT WITH CHECK (
    -- Check if user is admin of at least one city
    EXISTS (
      SELECT 1 FROM city_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.role = 'admin'
    )
  );

-- Inviters can update their own invitations (revoke)
CREATE POLICY "Inviters can update own invitations" ON invitations
  FOR UPDATE USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

-- Superusers can update all invitations
CREATE POLICY "Superusers can update all invitations" ON invitations
  FOR UPDATE USING (is_superuser(auth.uid()));

-- Inviters can delete their own invitations
CREATE POLICY "Inviters can delete own invitations" ON invitations
  FOR DELETE USING (invited_by = auth.uid());

-- Superusers can delete all invitations
CREATE POLICY "Superusers can delete all invitations" ON invitations
  FOR DELETE USING (is_superuser(auth.uid()));

-- 16. INVITATION CITY GRANTS TABLE
-- =================================
-- Maps invitations to cities they should grant access to

CREATE TABLE invitation_city_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one grant per invitation per city
  UNIQUE(invitation_id, city_id)
);

-- Indexes
CREATE INDEX idx_invitation_city_grants_invitation_id ON invitation_city_grants(invitation_id);
CREATE INDEX idx_invitation_city_grants_city_id ON invitation_city_grants(city_id);

-- Enable Row Level Security
ALTER TABLE invitation_city_grants ENABLE ROW LEVEL SECURITY;

-- INVITATION CITY GRANTS RLS POLICIES
-- ====================================

-- Users can view grants for invitations they can see
CREATE POLICY "Users can view invitation city grants" ON invitation_city_grants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_city_grants.invitation_id
        AND (
          i.invited_by = auth.uid()
          OR is_superuser(auth.uid())
        )
    )
  );

-- Inviters can insert grants for their invitations
CREATE POLICY "Inviters can insert invitation city grants" ON invitation_city_grants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_city_grants.invitation_id
        AND i.invited_by = auth.uid()
    )
  );

-- Inviters can delete grants for their invitations
CREATE POLICY "Inviters can delete invitation city grants" ON invitation_city_grants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_city_grants.invitation_id
        AND i.invited_by = auth.uid()
    )
  );

-- HELPER FUNCTION TO ACCEPT INVITATION
-- =====================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_token VARCHAR,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_invitation invitations;
  v_grant invitation_city_grants;
  v_city_id UUID;
  v_result JSON;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token;

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found'
    );
  END IF;

  -- Check if invitation is still valid
  IF v_invitation.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation has expired'
    );
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation has already been accepted'
    );
  END IF;

  IF v_invitation.revoked_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation has been revoked'
    );
  END IF;

  -- Mark invitation as accepted
  UPDATE invitations
  SET accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Grant city access to the user
  FOR v_grant IN
    SELECT * FROM invitation_city_grants
    WHERE invitation_id = v_invitation.id
  LOOP
    -- Insert into city_users if not already granted
    INSERT INTO city_users (city_id, user_id, role, granted_by)
    VALUES (v_grant.city_id, p_user_id, v_grant.role, v_invitation.invited_by)
    ON CONFLICT (city_id, user_id) DO UPDATE
    SET role = v_grant.role,
        granted_by = v_invitation.invited_by,
        granted_at = NOW();
  END LOOP;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Invitation accepted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
