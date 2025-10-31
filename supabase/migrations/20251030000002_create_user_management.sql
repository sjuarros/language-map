-- Create User Management Tables
-- ============================

-- 13. USER PROFILES TABLE
-- ========================
-- User profile information with role-based access control

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- 14. CITY USERS TABLE (Junction Table)
-- ======================================
-- Maps users to cities with their role in each city
-- This enables multi-city access for users

CREATE TABLE city_users (
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  granted_by UUID REFERENCES user_profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one record per user per city
  PRIMARY KEY (city_id, user_id)
);

-- Indexes
CREATE INDEX idx_city_users_city_id ON city_users(city_id);
CREATE INDEX idx_city_users_user_id ON city_users(user_id);
CREATE INDEX idx_city_users_role ON city_users(role);

-- Apply triggers to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_users ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- ============

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

-- USER PROFILES POLICIES
-- =======================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Superusers can view all profiles
CREATE POLICY "Superusers can view all profiles" ON user_profiles
  FOR SELECT USING (is_superuser(auth.uid()));

-- Admins can view profiles for their cities
CREATE POLICY "Admins can view profiles for their cities" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM city_users cu
      JOIN user_profiles up ON up.id = cu.user_id
      WHERE up.id = user_profiles.id
        AND cu.city_id IN (
          SELECT city_id FROM city_users
          WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
  );

-- Superusers can insert profiles
CREATE POLICY "Superusers can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (is_superuser(auth.uid()));

-- Superusers can update profiles
CREATE POLICY "Superusers can update profiles" ON user_profiles
  FOR UPDATE USING (is_superuser(auth.uid()))
  WITH CHECK (is_superuser(auth.uid()));

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM user_profiles WHERE id = auth.uid())
  );

-- Superusers can delete profiles
CREATE POLICY "Superusers can delete profiles" ON user_profiles
  FOR DELETE USING (is_superuser(auth.uid()));

-- CITY USERS POLICIES
-- ===================

-- Users can view city access for themselves
CREATE POLICY "Users can view own city access" ON city_users
  FOR SELECT USING (auth.uid() = user_id);

-- Superusers can view all city_users
CREATE POLICY "Superusers can view all city_users" ON city_users
  FOR SELECT USING (is_superuser(auth.uid()));

-- Admins can view city_users for their cities
CREATE POLICY "Admins can view city_users for their cities" ON city_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

-- Superusers can insert city_users
CREATE POLICY "Superusers can insert city_users" ON city_users
  FOR INSERT WITH CHECK (is_superuser(auth.uid()));

-- Admins can insert city_users for their cities
CREATE POLICY "Admins can insert city_users for their cities" ON city_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

-- Superusers can update city_users
CREATE POLICY "Superusers can update city_users" ON city_users
  FOR UPDATE USING (is_superuser(auth.uid()));

-- Admins can update city_users for their cities
CREATE POLICY "Admins can update city_users for their cities" ON city_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

-- Superusers can delete city_users
CREATE POLICY "Superusers can delete city_users" ON city_users
  FOR DELETE USING (is_superuser(auth.uid()));

-- Admins can delete city_users for their cities
CREATE POLICY "Admins can delete city_users for their cities" ON city_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

-- ENHANCED RLS POLICIES FOR EXISTING TABLES
-- ==========================================

-- Update existing RLS policies for cities to use helper functions

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on cities" ON cities;
DROP POLICY IF EXISTS "Allow public read on city_locales" ON city_locales;
DROP POLICY IF EXISTS "Allow public read on city_translations" ON city_translations;
DROP POLICY IF EXISTS "Allow public read on districts" ON districts;
DROP POLICY IF EXISTS "Allow public read on district_translations" ON district_translations;
DROP POLICY IF EXISTS "Allow public read on neighborhoods" ON neighborhoods;
DROP POLICY IF EXISTS "Allow public read on neighborhood_translations" ON neighborhood_translations;

-- CITIES POLICIES
-- ===============

-- Allow authenticated users to view cities they have access to
CREATE POLICY "Users can view accessible cities" ON cities
  FOR SELECT USING (
    -- Public can view active cities
    status = 'active'
    OR
    -- Users with city access can view any city they have access to
    has_city_access(auth.uid(), id)
  );

-- Superusers can manage all cities
CREATE POLICY "Superusers can manage cities" ON cities
  FOR ALL USING (is_superuser(auth.uid()));

-- Admins can update cities they have access to
CREATE POLICY "Admins can update cities" ON cities
  FOR UPDATE USING (has_city_access(auth.uid(), id));

-- CITY LOCALES POLICIES
-- =====================

-- Users can view city_locales for cities they have access to
CREATE POLICY "Users can view city locales" ON city_locales
  FOR SELECT USING (has_city_access(auth.uid(), city_id));

-- CITY TRANSLATIONS POLICIES
-- ==========================

-- Users can view city translations for cities they have access to
CREATE POLICY "Users can view city translations" ON city_translations
  FOR SELECT USING (has_city_access(auth.uid(), city_id));

-- DISTRICTS POLICIES
-- ==================

-- Users can view districts for cities they have access to
CREATE POLICY "Users can view districts" ON districts
  FOR SELECT USING (has_city_access(auth.uid(), city_id));

-- DISTRICT TRANSLATIONS POLICIES
-- ===============================

-- Users can view district translations for cities they have access to
CREATE POLICY "Users can view district translations" ON district_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM districts d
      WHERE d.id = district_translations.district_id
        AND has_city_access(auth.uid(), d.city_id)
    )
  );

-- NEIGHBORHOODS POLICIES
-- ======================

-- Users can view neighborhoods for cities they have access to
CREATE POLICY "Users can view neighborhoods" ON neighborhoods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM districts d
      WHERE d.id = neighborhoods.district_id
        AND has_city_access(auth.uid(), d.city_id)
    )
  );

-- NEIGHBORHOOD TRANSLATIONS POLICIES
-- ===================================

-- Users can view neighborhood translations for cities they have access to
CREATE POLICY "Users can view neighborhood translations" ON neighborhood_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM neighborhoods n
      JOIN districts d ON n.district_id = d.id
      WHERE n.id = neighborhood_translations.neighborhood_id
        AND has_city_access(auth.uid(), d.city_id)
    )
  );

-- FUNCTIONS FOR AUTOMATIC USER PROFILE CREATION
-- ==============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
