# Database Migrations

This directory contains all database schema migrations for the Language Map project.

**Last Updated**: November 3, 2025
**Status**: Clean and organized

---

## Current Migration Status

### Applied Migrations (5)

These migrations have been successfully applied to the local database:

1. **20251030000000_create_core_schema.sql** (11K)
   - Creates core tables: locales, world_regions, countries, cities
   - Creates base translations tables
   - Sets up enums and types
   - Enables RLS on core tables

2. **20251030000001_create_geographic_hierarchy.sql** (4.7K)
   - Creates geographic hierarchy tables
   - Sets up relationships between regions → countries → cities
   - Creates translation tables for each level

3. **20251030000002_create_user_management.sql** (11K)
   - Creates user_profiles and city_users tables
   - Creates helper functions (is_superuser, has_city_access, is_city_admin)
   - **Note**: Original RLS policies in this file had circular dependencies (fixed in migration 20251103000000)

4. **20251030000003_create_districts_neighborhoods.sql** (2.5K)
   - Creates districts and neighborhoods tables
   - Creates translation tables
   - Sets up geographic relationships

5. **20251103000000_fix_admin_rls_policies.sql** (4.7K)
   - **CRITICAL FIX**: Removes problematic admin RLS policies that caused infinite recursion
   - Consolidates all RLS fixes from debugging session
   - Drops 5 policies: 4 from city_users, 1 from user_profiles
   - See docs/debugging/admin-authentication-issue-summary.md for details

### Pending Migrations (5)

These migrations are ready to apply when needed:

6. **20251031000000_create_invitations_fixed.sql** (7.2K)
   - Creates invitations system for user onboarding
   - Allows admins to invite operators to cities
   - Includes email templates and expiration logic

7. **20251031000001_fix_invitation_rls.sql** (1.2K)
   - Fixes RLS policies for invitations table
   - Ensures proper access control

8. **20251031001418_fix_helper_functions.sql** (1.7K)
   - Updates helper functions for improved performance
   - Fixes potential edge cases

9. **20251101000000_create_taxonomy_system.sql** (8.1K)
   - Creates flexible taxonomy system
   - Allows cities to define custom language classifications
   - Creates taxonomy_types, taxonomy_values, language_taxonomies tables

10. **20251101010000_update_taxonomy_rls_policies.sql** (3.1K)
    - Sets up RLS policies for taxonomy tables
    - Ensures proper access control for taxonomy management

---

## Archived Migrations

### Archive: RLS Fix Attempts

**Location**: `supabase/migrations/archive/rls-fix-attempts/`
**Count**: 10 files
**Reason**: Redundant with consolidated fix (20251103000000_fix_admin_rls_policies.sql)

During the admin authentication debugging session (Nov 2-3, 2025), multiple iterative attempts were made to fix RLS circular dependency issues. These files represent that exploration process but are now superseded by the consolidated fix.

**Archived files**:
- 20251102000000_fix_city_users_rls_recursion.sql
- 20251102000001_fix_all_city_users_recursion.sql
- 20251102000002_fix_user_profiles_recursion.sql
- 20251102000003_fix_user_update_recursion.sql
- 20251102000004_fix_is_superuser_recursion.sql
- 20251102000005_simplify_rls_policies.sql
- 20251102000006_remove_all_superuser_policies.sql
- 20251102000007_fix_invitations_recursion.sql
- 20251102000008_fix_inviters_policy.sql
- 20251102000009_remove_all_is_superuser_policies.sql

**Keep for**: Historical reference, understanding the debugging process

### Archive: Duplicates

**Location**: `supabase/migrations/archive/duplicates/`
**Count**: 1 file
**Reason**: Superseded by "fixed" version

**Archived files**:
- 20251031000000_create_invitations.sql (original, had issues)

**Replaced by**: 20251031000000_create_invitations_fixed.sql

---

## Seed Data

**Location**: `supabase/seed/`
**Count**: 2 files
**Status**: Not yet applied

Seed data files have been moved to a separate directory because they:
1. Depend on specific setup (Amsterdam city, districts, neighborhoods)
2. Will be loaded as part of Phase 2 implementation
3. Failed when run too early in the migration sequence

**Seed files**:
- 20251030000003_load_seed_data.sql (12K) - Geographic data for Amsterdam
- 20251030000004_load_translations_and_users.sql (12K) - Translations and test users

**How to use**:
```bash
# After Phase 2 setup is complete:
docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f supabase/seed/20251030000003_load_seed_data.sql

docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f supabase/seed/20251030000004_load_translations_and_users.sql
```

---

## Migration Naming Convention

Migrations follow this naming pattern:

```
YYYYMMDDHHMMSS_description.sql
```

Examples:
- `20251030000000_create_core_schema.sql`
- `20251103000000_fix_admin_rls_policies.sql`

**Guidelines**:
- Use descriptive names (create, update, fix, add, remove)
- Keep names concise but clear
- Use snake_case for readability

---

## Applying Migrations

### Local Development

**Method 1: Individual Migration**
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f supabase/migrations/FILENAME.sql
```

**Method 2: Bulk Apply (use with caution)**
```bash
npx supabase db push --db-url "postgresql://postgres:postgres@127.0.0.1:54332/postgres"
```

**Note**: Bulk apply may fail if migrations have dependencies on data that doesn't exist yet.

### Recording Applied Migrations

After manually applying a migration, record it:

```bash
docker exec supabase_db_language-map psql -U postgres -d postgres -c \
  "INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES ('YYYYMMDDHHMMSS', 'description')
   ON CONFLICT (version) DO NOTHING;"
```

### Checking Applied Migrations

```bash
docker exec supabase_db_language-map psql -U postgres -d postgres -c \
  "SELECT version, name FROM supabase_migrations.schema_migrations
   ORDER BY version;"
```

---

## Migration Best Practices

### 1. Idempotency

Always use `IF EXISTS` / `IF NOT EXISTS`:

```sql
-- Good
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE TABLE IF NOT EXISTS table_name (...);

-- Bad
DROP POLICY "policy_name" ON table_name;  -- Fails if doesn't exist
CREATE TABLE table_name (...);  -- Fails if exists
```

### 2. RLS Policy Design

**Avoid circular dependencies** - don't query the same table within its own RLS policy:

```sql
-- ❌ BAD: Causes infinite recursion
CREATE POLICY "Admins can view" ON city_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM city_users cu2  -- Recursion!
      WHERE cu2.user_id = auth.uid()
    )
  );

-- ✅ GOOD: Use helper functions or direct comparisons
CREATE POLICY "Users can view own" ON city_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Superusers can view all" ON city_users
  FOR SELECT USING (is_superuser(auth.uid()));  -- Queries different table
```

### 3. Helper Functions

Use `SECURITY DEFINER` for helper functions that need elevated privileges:

```sql
CREATE OR REPLACE FUNCTION is_superuser(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_user_id AND role = 'superuser'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Documentation

Include clear comments in migration files:

```sql
/**
 * Migration: Create Taxonomy System
 *
 * Purpose: Enable cities to define custom language classification schemes
 * Dependencies: Requires cities table
 * Related: Phase 2 - Reference Data & Operator CRUD
 */

-- Create taxonomy_types table
-- ...
```

### 5. Testing

Before committing migrations:

1. Test on fresh local database
2. Verify RLS policies work correctly
3. Check for circular dependencies
4. Test with different user roles
5. Verify rollback if supported

---

## Common Issues

### Issue: Migration Fails with "relation does not exist"

**Cause**: Migration depends on data or schema that hasn't been created yet
**Solution**: Check migration order, ensure dependencies are met

### Issue: "infinite recursion detected in policy"

**Cause**: RLS policy queries the same table it protects
**Solution**: Use helper functions or direct auth.uid() comparisons
**Example**: See migration 20251103000000_fix_admin_rls_policies.sql

### Issue: Seed data fails with NULL constraint violations

**Cause**: Referenced data (cities, districts) doesn't exist yet
**Solution**: Apply schema migrations first, then seed data
**Location**: Seed files are now in `supabase/seed/` directory

---

## Related Documentation

- **RLS Policy Debugging**: `docs/debugging/admin-authentication-issue-summary.md`
- **RLS Consistency Check**: `docs/debugging/rls-policy-consistency-check.md`
- **Superuser Auth Fix**: `docs/debugging/superuser-authentication-fix-summary.md`
- **Architecture**: `docs/architecture.md`
- **Database Schema**: `docs/architecture.md` (Database Schema section)

---

## Migration History

### October 30, 2024
- Created core schema migrations (4 files)
- Established base database structure
- Set up user management and RLS policies

### October 31, 2024
- Added invitations system
- Fixed invitation RLS policies
- Updated helper functions

### November 1, 2024
- Created taxonomy system for flexible language classification
- Updated taxonomy RLS policies

### November 2, 2024
- **Debugging session**: Multiple RLS fix attempts
- Identified and fixed circular dependency issues
- Files archived (10 iterations)

### November 3, 2024
- **Major cleanup**: Consolidated RLS fixes into single migration
- Reorganized migration directory
- Moved seed data to separate folder
- Archived redundant and duplicate files
- **Final count**: 10 clean migration files (5 applied, 5 pending)

---

**Maintainer Notes**:
- Keep this README updated when adding new migrations
- Document any manual database changes
- Update "Applied Migrations" section when applying pending migrations
- Archive old migrations only if superseded by newer versions
