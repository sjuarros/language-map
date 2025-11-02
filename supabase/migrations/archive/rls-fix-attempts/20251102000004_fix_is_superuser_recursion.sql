/**
 * Fix: Make is_superuser() function bypass RLS to prevent infinite recursion
 *
 * Problem: The is_superuser() function queries user_profiles, which triggers
 * user_profiles RLS policies, which call is_superuser() again, causing infinite recursion.
 *
 * Solution: Add "SET search_path = public" and use a direct query that doesn't
 * trigger RLS. Since the function is SECURITY DEFINER, it runs with elevated
 * privileges and can safely bypass RLS for this specific check.
 */

-- Recreate function with RLS bypass (using CREATE OR REPLACE to avoid dropping policies)
CREATE OR REPLACE FUNCTION is_superuser(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- This query runs with elevated privileges and bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_user_id AND role = 'superuser'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_superuser(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_superuser(uuid) TO anon;
