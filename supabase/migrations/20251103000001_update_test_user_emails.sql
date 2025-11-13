-- Migration: Update test user emails to more intuitive format
-- Created: 2025-11-03
-- Purpose: Update test user emails from amsterdam-admin/amsterdam-operator to admin-ams/operator-ams
--          and ensure superuser@example.com exists

-- Update existing users in auth.users
-- ====================================

-- Update admin email if old email exists
UPDATE auth.users
SET
  email = 'admin-ams@example.com',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    '"admin-ams@example.com"'
  )
WHERE email = 'amsterdam-admin@example.com';

-- Update operator email if old email exists
UPDATE auth.users
SET
  email = 'operator-ams@example.com',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    '"operator-ams@example.com"'
  )
WHERE email = 'amsterdam-operator@example.com';

-- Update existing users in user_profiles
-- =======================================

-- Update admin profile
UPDATE user_profiles
SET email = 'admin-ams@example.com'
WHERE email = 'amsterdam-admin@example.com';

-- Update operator profile
UPDATE user_profiles
SET email = 'operator-ams@example.com'
WHERE email = 'amsterdam-operator@example.com';

-- Ensure new test users exist (if not already present)
-- =====================================================

-- Insert superuser if not exists
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'superuser@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test Superuser"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Insert admin if not exists
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'admin-ams@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Amsterdam Admin User"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Insert operator if not exists
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'operator-ams@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Amsterdam Operator User"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Create/update user profiles
-- ============================

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superuser@example.com',
  'Test Superuser',
  'superuser',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'admin-ams@example.com',
  'Amsterdam Admin User',
  'admin',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'operator-ams@example.com',
  'Amsterdam Operator User',
  'operator',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Grant city access (if not already granted)
-- ===========================================

-- Admin gets admin access to Amsterdam
INSERT INTO city_users (
  city_id,
  user_id,
  role,
  granted_by
)
SELECT
  c.id,
  '00000000-0000-0000-0000-000000000002',
  'admin',
  '00000000-0000-0000-0000-000000000001'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Operator gets operator access to Amsterdam
INSERT INTO city_users (
  city_id,
  user_id,
  role,
  granted_by
)
SELECT
  c.id,
  '00000000-0000-0000-0000-000000000003',
  'operator',
  '00000000-0000-0000-0000-000000000002'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Verification (commented out)
-- =============================
-- SELECT 'Updated test users' as status;
-- SELECT email, role FROM user_profiles WHERE id IN (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000003'
-- );
