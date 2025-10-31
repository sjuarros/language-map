-- SEED DATA FOR PHASE 1, DAY 7
-- =============================
-- User management and city access

-- Note: This file contains seed data for testing RLS policies
-- In production, users would sign up via Supabase Auth

-- Insert test users
-- =================

-- Test Superuser
-- This user can access ALL cities
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
) ON CONFLICT (id) DO NOTHING;

-- Test Admin User
-- This user has admin access to Amsterdam
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
  'amsterdam-admin@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Amsterdam Admin User"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Test Operator User
-- This user has operator access to Amsterdam
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
  'amsterdam-operator@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Amsterdam Operator User"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Test Multi-City Admin User
-- This user has admin access to multiple cities
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
  '00000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'multicity-admin@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Multi-City Admin User"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create user profiles (these would normally be created by the trigger)
-- ====================================================================

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
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'amsterdam-admin@example.com',
  'Amsterdam Admin User',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'amsterdam-operator@example.com',
  'Amsterdam Operator User',
  'operator',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'multicity-admin@example.com',
  'Multi-City Admin User',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- Grant city access
-- =================

-- Superuser has access to ALL cities (no entry needed in city_users)
-- Superuser role provides implicit access

-- Amsterdam Admin User gets admin access to Amsterdam
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
ON CONFLICT (city_id, user_id) DO NOTHING;

-- Amsterdam Operator User gets operator access to Amsterdam
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
ON CONFLICT (city_id, user_id) DO NOTHING;

-- Note: In a real scenario, this would be granted by an existing admin
-- For testing purposes, we grant it using the admin user as the granter

-- Multi-City Admin User gets admin access to Amsterdam
INSERT INTO city_users (
  city_id,
  user_id,
  role,
  granted_by
)
SELECT
  c.id,
  '00000000-0000-0000-0000-000000000004',
  'admin',
  '00000000-0000-0000-0000-000000000001'
FROM cities c
WHERE c.slug = 'amsterdam'
ON CONFLICT (city_id, user_id) DO NOTHING;

-- Verification queries (commented out)
-- ====================================

-- SELECT 'Users created' as status, count(*) as count FROM user_profiles;
-- SELECT 'City access granted' as status, count(*) as count FROM city_users;

-- Test queries to verify RLS (uncomment for testing)
-- ===================================================

-- Query 1: Superuser should see all cities
-- SELECT 'Superuser cities' as test, c.slug FROM cities c
-- WHERE c.id IN (SELECT city_id FROM city_users WHERE user_id = '00000000-0000-0000-0000-000000000001');

-- Query 2: Admin user should see Amsterdam
-- SELECT 'Admin cities' as test, c.slug FROM cities c
-- WHERE c.id IN (SELECT city_id FROM city_users WHERE user_id = '00000000-0000-0000-0000-000000000002');

-- Query 3: Operator user should see Amsterdam
-- SELECT 'Operator cities' as test, c.slug FROM cities c
-- WHERE c.id IN (SELECT city_id FROM city_users WHERE user_id = '00000000-0000-0000-0000-000000000003');
