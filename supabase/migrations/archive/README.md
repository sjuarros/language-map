# Archived Migrations

This directory contains migration files that have been archived because they are no longer needed in the main migration path.

**Last Updated**: November 3, 2025

---

## Why Archive Instead of Delete?

These files are kept for:
1. **Historical reference** - Understanding the debugging process
2. **Learning purposes** - Examples of what NOT to do with RLS policies
3. **Audit trail** - Complete record of database evolution
4. **Documentation** - Support for debugging summaries

---

## Archived Categories

### RLS Fix Attempts (10 files)

**Location**: `rls-fix-attempts/`
**Date**: November 2, 2025
**Status**: Superseded by `20251103000000_fix_admin_rls_policies.sql`

These files represent iterative attempts to fix RLS circular dependency issues during the admin authentication debugging session. Each file fixed one aspect of the problem, but all are now superseded by a single consolidated migration.

**Files**:
1. `20251102000000_fix_city_users_rls_recursion.sql`
   - First attempt: Drop "Admins can view city_users" policy

2. `20251102000001_fix_all_city_users_recursion.sql`
   - Drop INSERT/UPDATE/DELETE admin policies on city_users

3. `20251102000002_fix_user_profiles_recursion.sql`
   - Drop "Admins can view profiles for their cities" policy

4. `20251102000003_fix_user_update_recursion.sql`
   - Fix user update policy recursion

5. `20251102000004_fix_is_superuser_recursion.sql`
   - Fix is_superuser helper function recursion

6. `20251102000005_simplify_rls_policies.sql`
   - Simplify remaining RLS policies

7. `20251102000006_remove_all_superuser_policies.sql`
   - Remove problematic superuser policies

8. `20251102000007_fix_invitations_recursion.sql`
   - Fix invitations table RLS recursion

9. `20251102000008_fix_inviters_policy.sql`
   - Fix inviters policy

10. `20251102000009_remove_all_is_superuser_policies.sql`
    - Remove remaining problematic policies

**Lesson Learned**: When RLS policies need fixing, create a single consolidated migration instead of multiple incremental fixes. This makes the migration history cleaner and easier to understand.

**See**: `docs/debugging/admin-authentication-issue-summary.md` for full context.

---

### Duplicates (1 file)

**Location**: `duplicates/`
**Date**: October 31, 2025
**Status**: Replaced by fixed version

**File**: `20251031000000_create_invitations.sql`

This was the original invitations table creation migration. It had issues and was superseded by:
- `20251031000000_create_invitations_fixed.sql` (in main migrations folder)

**Why both have same timestamp**: The fixed version was created shortly after the original but kept the same base timestamp for reference.

---

## Do NOT Apply These Migrations

These migrations should **NOT** be applied to any database:

1. They are redundant (superseded by newer migrations)
2. They may conflict with the current schema
3. They are kept only for historical/documentation purposes

If you need the functionality these migrations provided, use the current migrations in the main `migrations/` directory.

---

## Related Documentation

- Main migrations README: `../README.md`
- Admin auth debugging: `docs/debugging/admin-authentication-issue-summary.md`
- RLS consistency check: `docs/debugging/rls-policy-consistency-check.md`

---

**Note**: If these files are no longer needed for reference after 6 months, they can be safely deleted. The debugging documentation contains all necessary information about the issues and fixes.
