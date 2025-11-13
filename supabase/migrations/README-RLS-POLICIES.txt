RLS POLICIES - QUICK REFERENCE
==============================

Status: ✅ Final and tested
Date: 2025-11-06
Total Policies: 36 across 17 protected tables

MIGRATION FILES:
----------------
1. 20251106000000_update_rls_policies_final.sql (Core tables - 10 policies)
2. 20251106000001_add_city_tables_rls_policies.sql (All city data - 26 policies)

AFTER SUPABASE DB RESET:
------------------------
1. Apply Migration 1 (Core tables):
   docker exec -i supabase_db_language-map psql -U postgres -d postgres < 20251106000000_update_rls_policies_final.sql

2. Apply Migration 2 (All city-managed data):
   docker exec -i supabase_db_language-map psql -U postgres -d postgres < 20251106000001_add_city_tables_rls_policies.sql

3. Verify all 36 policies created

COMPLETE POLICY BREAKDOWN (36 total):
------------------------------------
Core Tables (Migration 1 - 10 policies):
  city_users (3 policies)       - SELECT, ALL (admin), ALL (superuser)
  cities (2 policies)           - SELECT, ALL (superuser)
  city_translations (2 policies) - SELECT, ALL (superuser)
  user_profiles (3 policies)    - SELECT (own), UPDATE (own), ALL (superuser)

City-Managed Data (Migration 2 - 26 policies):
  languages (2)                 - SELECT, ALL (admin/superuser)
  language_translations (2)     - SELECT, ALL (admin/superuser)
  language_taxonomies (2)       - SELECT, ALL (admin/superuser)
  districts (2)                 - SELECT, ALL (admin/superuser)
  district_translations (2)     - SELECT, ALL (admin/superuser)
  neighborhoods (2)             - SELECT, ALL (admin/superuser)
  neighborhood_translations (2) - SELECT, ALL (admin/superuser)
  language_families (2)         - SELECT, ALL (admin/superuser)
  language_family_translations (2) - SELECT, ALL (admin/superuser)
  taxonomy_types (2)            - SELECT, ALL (admin/superuser)
  taxonomy_type_translations (2) - SELECT, ALL (admin/superuser)
  taxonomy_values (2)           - SELECT, ALL (admin/superuser)
  taxonomy_value_translations (2) - SELECT, ALL (admin/superuser)

VERIFICATION QUERY (All 36 policies):
------------------------------------
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT 'All Protected Tables' as category, COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN (
  'city_users', 'cities', 'city_translations', 'user_profiles',
  'languages', 'language_translations', 'language_taxonomies',
  'districts', 'district_translations',
  'neighborhoods', 'neighborhood_translations',
  'language_families', 'language_family_translations',
  'taxonomy_types', 'taxonomy_type_translations',
  'taxonomy_values', 'taxonomy_value_translations'
);
"

KEY POINTS:
-----------
✅ Idempotent (can run multiple times)
✅ No recursion issues
✅ Supports all user roles (operator, admin, superuser)
✅ 3 helper functions: is_superuser(), is_city_admin(), has_city_access()
✅ Complete admin management capabilities

ADMIN CAPABILITIES (with 36 policies):
--------------------------------------
Admins can now do EVERYTHING the users they manage can do:

For cities they administer:
  ✅ Manage users (city_users table)
  ✅ CRUD languages
  ✅ CRUD districts
  ✅ CRUD neighborhoods
  ✅ Manage taxonomies (types and values)
  ✅ Manage all translations
  ✅ Full data access for their cities

For other cities:
  ❌ No access to data
  ✅ Can see their own city access grants

Superusers:
  ✅ Full access to ALL data across ALL cities
  ✅ Can grant/revoke user access to any city

Operators:
  ✅ Can CRUD data for cities they have access to
  ❌ Cannot manage users

See docs/processes/RLS-POLICIES-STATE.md for full details.
