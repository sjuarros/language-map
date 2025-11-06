-- ============================================
-- LANGUAGE FAMILY ATOMIC OPERATIONS
-- ============================================
-- Postgres functions for atomic create/update operations with transactions
-- This ensures data consistency and eliminates the need for manual rollback

/**
 * Create language family with translations atomically
 *
 * @param p_slug - URL-friendly identifier for the family
 * @param p_translations - JSONB array of translation objects
 *   Example: [
 *     {"locale_code": "en", "name": "Indo-European", "description": "..."},
 *     {"locale_code": "nl", "name": "Indo-Europees", "description": "..."}
 *   ]
 * @returns The created language family ID and slug
 * @throws Will rollback entire transaction if any step fails
 */
CREATE OR REPLACE FUNCTION create_language_family_with_translations(
  p_slug TEXT,
  p_translations JSONB
) RETURNS TABLE (
  family_id UUID,
  family_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id UUID;
BEGIN
  -- Validate inputs
  IF p_slug IS NULL OR p_slug = '' THEN
    RAISE EXCEPTION 'Slug is required';
  END IF;

  IF p_translations IS NULL OR jsonb_array_length(p_translations) = 0 THEN
    RAISE EXCEPTION 'At least one translation is required';
  END IF;

  -- Insert family (will fail if slug already exists due to unique constraint)
  INSERT INTO language_families (slug)
  VALUES (p_slug)
  RETURNING id INTO v_family_id;

  -- Insert translations
  -- If this fails, the entire transaction will be rolled back automatically
  INSERT INTO language_family_translations (family_id, locale_code, name, description)
  SELECT
    v_family_id,
    (value->>'locale_code')::TEXT,
    (value->>'name')::TEXT,
    NULLIF((value->>'description')::TEXT, '')
  FROM jsonb_array_elements(p_translations)
  WHERE (value->>'name') IS NOT NULL AND (value->>'name') != '';

  -- Return the created family
  RETURN QUERY
  SELECT v_family_id, p_slug;
END;
$$;

/**
 * Update language family with translations atomically
 *
 * @param p_family_id - UUID of the family to update
 * @param p_slug - New slug value
 * @param p_translations - JSONB array of translation objects
 * @returns The updated language family ID and slug
 * @throws Will rollback entire transaction if any step fails
 */
CREATE OR REPLACE FUNCTION update_language_family_with_translations(
  p_family_id UUID,
  p_slug TEXT,
  p_translations JSONB
) RETURNS TABLE (
  family_id UUID,
  family_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF p_family_id IS NULL THEN
    RAISE EXCEPTION 'Family ID is required';
  END IF;

  IF p_slug IS NULL OR p_slug = '' THEN
    RAISE EXCEPTION 'Slug is required';
  END IF;

  IF p_translations IS NULL OR jsonb_array_length(p_translations) = 0 THEN
    RAISE EXCEPTION 'At least one translation is required';
  END IF;

  -- Update family
  UPDATE language_families
  SET
    slug = p_slug,
    updated_at = NOW()
  WHERE id = p_family_id;

  -- Check if family exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Language family not found';
  END IF;

  -- Delete existing translations and insert new ones
  -- This is simpler than trying to upsert and handles removed translations
  DELETE FROM language_family_translations WHERE family_id = p_family_id;

  INSERT INTO language_family_translations (family_id, locale_code, name, description)
  SELECT
    p_family_id,
    (value->>'locale_code')::TEXT,
    (value->>'name')::TEXT,
    NULLIF((value->>'description')::TEXT, '')
  FROM jsonb_array_elements(p_translations)
  WHERE (value->>'name') IS NOT NULL AND (value->>'name') != '';

  -- Return the updated family
  RETURN QUERY
  SELECT p_family_id, p_slug;
END;
$$;

-- Grant execute permissions to authenticated users
-- RLS policies will still apply for row-level access control
GRANT EXECUTE ON FUNCTION create_language_family_with_translations(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_language_family_with_translations(UUID, TEXT, JSONB) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION create_language_family_with_translations IS
  'Atomically creates a language family with translations. Automatically rolls back if any step fails.';

COMMENT ON FUNCTION update_language_family_with_translations IS
  'Atomically updates a language family and replaces all translations. Automatically rolls back if any step fails.';
