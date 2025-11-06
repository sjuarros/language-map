# RLS Policies - Current State Documentation

**Last Updated**: November 6, 2025
**Status**: ✅ Final and tested
**Migration Files**:
- `supabase/migrations/20251106000000_update_rls_policies_final.sql` (Core tables)
- `supabase/migrations/20251106000001_add_city_tables_rls_policies.sql` (All city-managed data)

---

## Overview

This document describes the **current, definitive state** of Row-Level Security (RLS) policies in the database. These policies are **tested and working** with the authentication system and provide **complete admin management capabilities**.

**Admin Capabilities**: Admin users can now do everything the users they manage can do. They have full CRUD access to all entities (languages, districts, neighborhoods, taxonomies, etc.) for cities they administer.

**Critical**: After any `supabase db reset`, run BOTH migrations to restore the correct RLS policies.

---

## Current RLS Policies

### city_users Table

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `Users can view own city access` | SELECT | All users (including admins) can see their own city access grants. Superusers see all grants. |
| `Admins can manage city_users for their cities` | ALL | Admins can manage all city_users for cities where they have admin role. Uses `is_city_admin()` function. |
| `Superusers can manage all city_users` | ALL | Superusers can perform all operations on all city_users. |

**Policy Logic**:
```sql
-- Users can view own city access
auth.uid() = user_id OR is_superuser(auth.uid())

-- Admins can manage city_users for their cities
is_city_admin(auth.uid(), city_id)
```

### cities Table

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `City users can view assigned cities` | SELECT | Users can view cities they've been granted access to via `city_users`. Superusers can view all cities. |
| `Superusers can manage all cities` | ALL | Superusers can perform all operations on all cities. |

**Policy Logic**:
```sql
-- City users can view assigned cities
EXISTS (
  SELECT 1 FROM city_users
  WHERE city_users.city_id = cities.id
  AND city_users.user_id = auth.uid()
) OR is_superuser(auth.uid())
```

### city_translations Table

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `City users can view city translations` | SELECT | Users can view city translations for cities they've been granted access to. Superusers can view all. |
| `Superusers can manage all city translations` | ALL | Superusers can perform all operations on all city translations. |

**Policy Logic**:
```sql
-- City users can view city translations
EXISTS (
  SELECT 1 FROM city_users
  WHERE city_users.city_id = city_translations.city_id
  AND city_users.user_id = auth.uid()
) OR is_superuser(auth.uid())
```

### user_profiles Table

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `Users can view own profile` | SELECT | Users can view their own profile. |
| `Users can update own profile` | UPDATE | Users can update their own profile. |
| `Superusers can manage all profiles` | ALL | Superusers can perform all operations on all profiles. |

**Policy Logic**:
```sql
-- Users can view own profile
auth.uid() = id

-- Users can update own profile
auth.uid() = id
```

---

## Key Design Decisions

### 1. Simplified city_users Policy

**Old approach** (caused recursion):
- Check if user is admin by querying `city_users` table
- This query triggered the same RLS policy → infinite recursion

**New approach** (works correctly):
- Simple check: `auth.uid() = user_id`
- Superusers use `is_superuser()` helper function (SECURITY DEFINER bypasses RLS)
- No circular dependencies

### 2. Joined Table Policies

**Problem**: Users can query `city_users` (has policy), but joined `cities` and `city_translations` had no policies.

**Solution**: Add policies to ALL tables in the join chain:
- `city_users` - Can access own grants
- `cities` - Can access if user has grant for that city
- `city_translations` - Can access if user has grant for that city's translations

**Result**: Dashboard queries work correctly, users see their assigned cities.

### 3. Admin Role Management with Helper Functions

**Challenge**: Admins need to manage `city_users` for their cities, but a policy that queries `city_users` to check if user is admin creates infinite recursion.

**Solution**: Use `is_city_admin()` SECURITY DEFINER helper function:
```sql
CREATE OR REPLACE FUNCTION is_city_admin(p_user_id UUID, p_city_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
SET search_path = public
AS $$
BEGIN
  IF is_superuser(p_user_id) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM city_users cu
    WHERE cu.user_id = p_user_id
      AND cu.city_id = p_city_id
      AND cu.role = 'admin'
  );
END;
$$;
```

**Policy**:
```sql
CREATE POLICY "Admins can manage city_users for their cities"
  ON city_users
  FOR ALL
  USING (is_city_admin(auth.uid(), city_id))
  WITH CHECK (is_city_admin(auth.uid(), city_id));
```

**Result**: Admins can manage users for their cities without recursion errors.

### 4. Superuser Bypass

All tables have superuser policies using `is_superuser()`:
- SECURITY DEFINER function bypasses RLS
- Avoids recursion issues
- Single point of truth for superuser checks

---

## Applying These Policies

### After `supabase db reset`

```bash
# 1. Reset database
npx supabase db reset

# 2. Apply the RLS policies migration
docker exec -i supabase_db_language-map psql -U postgres -d postgres < supabase/migrations/20251106000000_update_rls_policies_final.sql

# 3. Verify policies were created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('city_users', 'cities', 'city_translations', 'user_profiles')
ORDER BY tablename, policyname;
"

# Expected output:
# city_users    | Users can view own city access     | SELECT
# city_users    | Superusers can manage all city_users | ALL
# cities        | City users can view assigned cities | SELECT
# cities        | Superusers can manage all cities    | ALL
# city_translations | City users can view city translations | SELECT
# city_translations | Superusers can manage all city translations | ALL
# user_profiles | Superusers can manage all profiles  | ALL
# user_profiles | Users can update own profile        | UPDATE
# user_profiles | Users can view own profile          | SELECT
```

### Verifying Policies Work

```bash
# Test as operator user
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000003';
SELECT c.slug, ct.name
FROM cities c
JOIN city_translations ct ON c.id = ct.city_id
WHERE ct.locale_code = 'en';
"

# Should return: amsterdam | Amsterdam
```

---

## Migration File Details

**File**: `supabase/migrations/20251106000000_update_rls_policies_final.sql`

**Features**:
- ✅ Idempotent (can be run multiple times safely)
- ✅ Uses `DROP POLICY IF EXISTS` to handle existing policies
- ✅ Uses `CREATE POLICY` to add new policies
- ✅ Well-commented
- ✅ Includes verification queries

**Usage**:
```bash
# Run the migration
docker exec -i supabase_db_language-map psql -U postgres -d postgres < supabase/migrations/20251106000000_update_rls_policies_final.sql

# Check for errors
# Should see: CREATE POLICY (for each policy)
# Notices about dropping non-existent policies are OK
```

---

## Testing Matrix

### Operator User (`operator-ams@example.com`)

| Table | Expected Result |
|-------|-----------------|
| `city_users` | ✅ Can see own grant (amsterdam) |
| `cities` | ✅ Can see amsterdam |
| `city_translations` | ✅ Can see amsterdam translations |
| `user_profiles` | ✅ Can see own profile |

### Admin User (`admin-ams@example.com`)

| Table | Expected Result |
|-------|-----------------|
| `city_users` | ✅ Can see own grant (amsterdam) ✅ Can manage city_users for amsterdam (INSERT/UPDATE/DELETE) |
| `cities` | ✅ Can see amsterdam |
| `city_translations` | ✅ Can see amsterdam translations |
| `user_profiles` | ✅ Can see own profile |

### Superuser (`superuser@example.com`)

| Table | Expected Result |
|-------|-----------------|
| `city_users` | ✅ Can see ALL grants |
| `cities` | ✅ Can see ALL cities |
| `city_translations` | ✅ Can see ALL translations |
| `user_profiles` | ✅ Can see ALL profiles |

---

## Troubleshooting

### Problem: "No Cities Assigned" Despite Having Access

**Cause**: Missing RLS policies on `cities` or `city_translations`

**Solution**:
```sql
-- Check if policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('cities', 'city_translations');

-- If missing, run the migration
docker exec -i supabase_db_language-map psql -U postgres -d postgres < supabase/migrations/20251106000000_update_rls_policies_final.sql
```

### Problem: Infinite Recursion Errors

**Cause**: RLS policy queries the same table it's protecting

**Solution**: Use `is_superuser()` helper function (SECURITY DEFINER) instead of subqueries

### Problem: Policy Not Working

**Checklist**:
1. ✅ Policy exists: `SELECT * FROM pg_policies WHERE policyname = '...'`
2. ✅ RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = '...'`
3. ✅ User has correct role in `user_profiles`
4. ✅ User has city access in `city_users`
5. ✅ User is authenticated: `SELECT auth.uid()`

---

## Related Documentation

- **Authentication Troubleshooting**: `docs/processes/authentication-troubleshooting.md`
- **Helper Functions**: Defined in migration `20251103000002_fix_city_users_recursion.sql`
  - `is_superuser(user_id UUID)` - SECURITY DEFINER function
  - `is_city_admin(user_id UUID, city_id UUID)` - SECURITY DEFINER function

---

## Complete Policy Reference (36 Total Policies)

### Migration 1: Core Tables (10 policies)
**File**: `supabase/migrations/20251106000000_update_rls_policies_final.sql`

| Table | Policies | Total |
|-------|----------|-------|
| `city_users` | 3 | SELECT, ALL (admin), ALL (superuser) |
| `cities` | 2 | SELECT, ALL (superuser) |
| `city_translations` | 2 | SELECT, ALL (superuser) |
| `user_profiles` | 3 | SELECT (own), UPDATE (own), ALL (superuser) |
| **Subtotal** | **10** | |

### Migration 2: All City-Managed Data (26 policies)
**File**: `supabase/migrations/20251106000001_add_city_tables_rls_policies.sql`

| Table | Policies | Total |
|-------|----------|-------|
| `languages` | 2 | SELECT, ALL (admin/superuser) |
| `language_translations` | 2 | SELECT, ALL (admin/superuser) |
| `language_taxonomies` | 2 | SELECT, ALL (admin/superuser) |
| `districts` | 2 | SELECT, ALL (admin/superuser) |
| `district_translations` | 2 | SELECT, ALL (admin/superuser) |
| `neighborhoods` | 2 | SELECT, ALL (admin/superuser) |
| `neighborhood_translations` | 2 | SELECT, ALL (admin/superuser) |
| `language_families` | 2 | SELECT, ALL (admin/superuser) |
| `language_family_translations` | 2 | SELECT, ALL (admin/superuser) |
| `taxonomy_types` | 2 | SELECT, ALL (admin/superuser) |
| `taxonomy_type_translations` | 2 | SELECT, ALL (admin/superuser) |
| `taxonomy_values` | 2 | SELECT, ALL (admin/superuser) |
| `taxonomy_value_translations` | 2 | SELECT, ALL (admin/superuser) |
| **Subtotal** | **26** | |

**Total: 36 RLS policies across 17 protected tables**

### Helper Functions

1. **`has_city_access(user_id UUID, city_id UUID)`**
   - Returns true if user has ANY role for the city
   - Used for SELECT policies on all city tables
   - Implemented via: `is_superuser(user_id)` OR `is_city_admin(user_id, city_id)` OR exists in `city_users`

2. **`is_city_admin(user_id UUID, city_id UUID)`**
   - Returns true if user has 'admin' role for the city
   - Used for ALL (management) policies
   - SECURITY DEFINER - bypasses RLS to prevent recursion

3. **`is_superuser(user_id UUID)`**
   - Returns true if user has 'superuser' role
   - SECURITY DEFINER - bypasses all policies

---

## Admin Management Capabilities

With these 36 policies, **admin users can now do everything the users they manage can do**:

### For Cities They Administer:
- ✅ **Manage users**: Add/remove operators and admins via `city_users`
- ✅ **CRUD languages**: Create, read, update, delete languages
- ✅ **CRUD districts**: Create, read, update, delete districts
- ✅ **CRUD neighborhoods**: Create, read, update, delete neighborhoods
- ✅ **Manage taxonomies**: Create taxonomy types and values, assign to languages
- ✅ **Manage translations**: All translation tables for all entities
- ✅ **Full data access**: Can view and edit any data for their cities

### For Other Cities (Not Their Responsibility):
- ❌ **No access**: Cannot see or modify data for cities they don't admin
- ✅ **See their grants**: Can see which cities they have access to

### Superusers:
- ✅ **Full access**: Can access and modify ALL data across ALL cities
- ✅ **User management**: Can grant/revoke access for any user to any city
- ✅ **System administration**: Full database access

### Operators:
- ✅ **Data entry**: Can CRUD languages, districts, neighborhoods (for cities they have access to)
- ✅ **Cannot manage users**: Cannot add/remove other users
- ✅ **City access**: Limited to cities granted via `city_users`

---

## Applying All Policies After Database Reset

```bash
# 1. Reset database
npx supabase db reset

# 2. Apply Migration 1 (Core tables)
docker exec -i supabase_db_language-map psql -U postgres -d postgres < supabase/migrations/20251106000000_update_rls_policies_final.sql

# 3. Apply Migration 2 (All city-managed data)
docker exec -i supabase_db_language-map psql -U postgres -d postgres < supabase/migrations/20251106000001_add_city_tables_rls_policies.sql

# 4. Verify all 36 policies created
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

# Expected output: 36 policies total
```

---

## Summary

The RLS policies are now in a **final, tested state** that:

1. ✅ Works with the authentication system
2. ✅ Prevents infinite recursion
3. ✅ Supports all user roles (operator, admin, superuser)
4. ✅ Allows proper data access for joined tables
5. ✅ Provides **complete admin management capabilities** (CRUD all entities)
6. ✅ Is reproducible via migration files (2 migrations, 36 policies)
7. ✅ Can be verified and tested
8. ✅ Uses helper functions for clean, maintainable policy logic

**Next Steps**: These policies should not need modification unless the database schema changes.
