-- Update Taxonomy System RLS Policies
-- ===================================
-- Add explicit role checks to all RLS policies for better security

-- 1. Update taxonomy_types RLS policy
DROP POLICY IF EXISTS "City users can manage taxonomy types" ON taxonomy_types;

CREATE POLICY "City users can manage taxonomy types"
  ON taxonomy_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    city_id IN (
      SELECT city_id
      FROM city_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- 2. Update taxonomy_type_translations RLS policy
DROP POLICY IF EXISTS "City users can manage taxonomy type translations" ON taxonomy_type_translations;

CREATE POLICY "City users can manage taxonomy type translations"
  ON taxonomy_type_translations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_type_id IN (
      SELECT t.id
      FROM taxonomy_types t
      JOIN city_users cu ON t.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'operator')
    )
  );

-- 3. Update taxonomy_values RLS policy
DROP POLICY IF EXISTS "City users can manage taxonomy values" ON taxonomy_values;

CREATE POLICY "City users can manage taxonomy values"
  ON taxonomy_values FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_type_id IN (
      SELECT t.id
      FROM taxonomy_types t
      JOIN city_users cu ON t.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'operator')
    )
  );

-- 4. Update taxonomy_value_translations RLS policy
DROP POLICY IF EXISTS "City users can manage taxonomy value translations" ON taxonomy_value_translations;

CREATE POLICY "City users can manage taxonomy value translations"
  ON taxonomy_value_translations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    taxonomy_value_id IN (
      SELECT tv.id
      FROM taxonomy_values tv
      JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
      JOIN city_users cu ON tt.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'operator')
    )
  );

-- 5. Update language_taxonomies RLS policy
DROP POLICY IF EXISTS "City users can manage language taxonomies" ON language_taxonomies;

CREATE POLICY "City users can manage language taxonomies"
  ON language_taxonomies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
    OR
    language_id IN (
      SELECT l.id
      FROM languages l
      JOIN city_users cu ON l.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'operator')
    )
    OR
    taxonomy_value_id IN (
      SELECT tv.id
      FROM taxonomy_values tv
      JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
      JOIN city_users cu ON tt.city_id = cu.city_id
      WHERE cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'operator')
    )
  );
