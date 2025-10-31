-- Fix helper functions by renaming parameters to avoid column ambiguity
-- Issue: PostgreSQL was confused between function parameters and table columns
-- Solution: Use p_ prefix for all parameters to avoid conflicts

-- Drop existing functions
DROP FUNCTION IF EXISTS is_superuser(UUID);
DROP FUNCTION IF EXISTS has_city_access(UUID, UUID);
DROP FUNCTION IF EXISTS is_city_admin(UUID, UUID);

-- Helper function to check if user is superuser
CREATE OR REPLACE FUNCTION is_superuser(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = p_user_id AND up.role = 'superuser'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to a city
CREATE OR REPLACE FUNCTION has_city_access(p_user_id UUID, p_target_city_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superusers can access all cities
  IF is_superuser(p_user_id) THEN
    RETURN true;
  END IF;

  -- Check if user has explicit access to the city
  RETURN EXISTS (
    SELECT 1 FROM city_users cu
    WHERE cu.user_id = p_user_id
      AND cu.city_id = p_target_city_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin of a city
CREATE OR REPLACE FUNCTION is_city_admin(p_user_id UUID, p_target_city_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superusers are admins of all cities
  IF is_superuser(p_user_id) THEN
    RETURN true;
  END IF;

  -- Check if user has admin role for the city
  RETURN EXISTS (
    SELECT 1 FROM city_users cu
    WHERE cu.user_id = p_user_id
      AND cu.city_id = p_target_city_id
      AND cu.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
