-- Test superuser access to city_users without infinite recursion
-- This simulates what happens during the auth callback

-- Set up the session to simulate superuser authentication
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
SET LOCAL role TO authenticated;

-- Test 1: Can superuser query user_profiles?
SELECT 'Test 1: Query user_profiles' as test;
SELECT id, email, role FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000001';

-- Test 2: Can superuser query city_users?
SELECT 'Test 2: Query city_users' as test;
SELECT city_id, user_id, role FROM city_users LIMIT 3;

-- Test 3: Check if is_superuser function works
SELECT 'Test 3: is_superuser function' as test;
SELECT is_superuser('00000000-0000-0000-0000-000000000001') as is_superuser_result;

-- Test 4: Check if is_city_admin function works
SELECT 'Test 4: is_city_admin function' as test;
SELECT is_city_admin(
  '00000000-0000-0000-0000-000000000002',
  (SELECT id FROM cities WHERE slug = 'amsterdam')
) as is_admin_result;

-- Test 5: Can admin query city_users for their city?
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';
SELECT 'Test 5: Admin query city_users' as test;
SELECT city_id, user_id, role FROM city_users
WHERE city_id = (SELECT id FROM cities WHERE slug = 'amsterdam');

SELECT 'All tests completed successfully!' as result;
