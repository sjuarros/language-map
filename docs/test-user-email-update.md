---
title: Test User Email Update
description: Update test user emails to more intuitive format
category: development
tags: [testing, users, database, migration]
date: 2025-11-03
---

# Test User Email Update

**Date:** November 3, 2025
**Status:** ✅ Complete
**Migration:** `20251103000001_update_test_user_emails.sql`

---

## Overview

Updated test user email addresses from technical/unintuitive formats to clearer, more memorable addresses that indicate their role and city access.

---

## Changes Made

### Email Address Updates

| Old Email | New Email | Role | City Access |
|-----------|-----------|------|-------------|
| ~~`asmrcolorsoaps@gmail.com`~~ | `superuser@example.com` | superuser | All cities (implicit) |
| ~~`amsterdam-admin@example.com`~~ | `admin-ams@example.com` | admin | Amsterdam |
| ~~`amsterdam-operator@example.com`~~ | `operator-ams@example.com` | operator | Amsterdam |

### Rationale

The new email format follows a clear pattern:
- **`superuser@example.com`**: Immediately identifies as the platform superuser
- **`admin-ams@example.com`**: Role + city abbreviation pattern for admins
- **`operator-ams@example.com`**: Role + city abbreviation pattern for operators

This makes it easier to:
1. **Remember** which user to use for testing
2. **Identify** the role and access level at a glance
3. **Scale** to multiple cities (e.g., `admin-paris@example.com`, `operator-berlin@example.com`)

---

## Files Updated

### 1. Database Migration
**File:** `supabase/migrations/20251103000001_update_test_user_emails.sql`

- Updates existing users in `auth.users` table
- Updates user profiles in `user_profiles` table
- Ensures city access grants in `city_users` table
- Uses `ON CONFLICT DO UPDATE` to handle existing users

### 2. Seed File
**File:** `supabase/seed-users.sql`

- Updated to reflect new email addresses
- Ensures future database resets use correct emails

### 3. Testing Documentation
**File:** `docs/implementation-phases/phase-1-foundation-i18n/day-13-manual-testing-plan.md`

- Updated all references to test user emails
- Updated test user credentials table
- Added city access column for clarity

---

## Migration Applied

The migration was successfully applied on **November 3, 2025**:

```bash
cat supabase/migrations/20251103000001_update_test_user_emails.sql | \
  docker exec -i supabase_db_supabase psql -U postgres -d postgres
```

**Results:**
- ✅ Updated 2 auth.users records (admin, operator)
- ✅ Updated 2 user_profiles records (admin, operator)
- ✅ Ensured 3 test users exist (superuser, admin, operator)
- ✅ Verified city access grants for Amsterdam

---

## Verification

### Check Updated Users

```bash
docker exec supabase_db_supabase psql -U postgres -d postgres -c \
  "SELECT email, role FROM user_profiles WHERE role IN ('superuser', 'admin', 'operator') \
   AND email LIKE '%example.com' ORDER BY role DESC, email"
```

**Expected Output:**
```
          email           |   role
--------------------------+-----------
 superuser@example.com    | superuser
 admin-ams@example.com    | admin
 operator-ams@example.com | operator
```

### Check City Access

```bash
docker exec supabase_db_supabase psql -U postgres -d postgres -c \
  "SELECT u.email, u.role, cu.role as city_role, c.slug as city \
   FROM user_profiles u \
   JOIN city_users cu ON u.id = cu.user_id \
   JOIN cities c ON cu.city_id = c.id \
   WHERE u.email IN ('superuser@example.com', 'admin-ams@example.com', 'operator-ams@example.com') \
   ORDER BY u.role DESC, u.email"
```

**Expected Output:**
```
          email           |   role   | city_role |   city
--------------------------+----------+-----------+-----------
 admin-ams@example.com    | admin    | admin     | amsterdam
 operator-ams@example.com | operator | operator  | amsterdam
```

**Note:** Superuser doesn't appear in `city_users` because they have implicit access to all cities.

---

## Testing with New Credentials

### Login Flow

1. **Navigate to:** http://localhost:3001/en
2. **Click:** "Log In" button
3. **Enter email:** Use one of:
   - `superuser@example.com`
   - `admin-ams@example.com`
   - `operator-ams@example.com`
4. **Check Inbucket:** http://localhost:54334
5. **Click magic link** in email
6. **Verify access:**
   - Superuser → Can access `/en/superuser`
   - Admin → Can access `/en/admin/amsterdam`
   - Operator → Can access `/en/operator/amsterdam`

### Password (for direct database testing)

All test users have the same password (for development only):
```
password123
```

**⚠️ Never use this in production!** These are test accounts only.

---

## Future City Test Users

When adding new cities (e.g., Paris, Berlin), follow the pattern:

```
admin-paris@example.com
operator-paris@example.com

admin-berlin@example.com
operator-berlin@example.com
```

This maintains consistency and makes the purpose of each account immediately clear.

---

## Rollback (if needed)

If you need to revert to old email addresses:

```sql
-- Revert admin email
UPDATE auth.users SET email = 'amsterdam-admin@example.com' WHERE email = 'admin-ams@example.com';
UPDATE user_profiles SET email = 'amsterdam-admin@example.com' WHERE email = 'admin-ams@example.com';

-- Revert operator email
UPDATE auth.users SET email = 'amsterdam-operator@example.com' WHERE email = 'operator-ams@example.com';
UPDATE user_profiles SET email = 'amsterdam-operator@example.com' WHERE email = 'operator-ams@example.com';

-- Revert superuser email (if asmrcolorsoaps@gmail.com was intended)
UPDATE auth.users SET email = 'asmrcolorsoaps@gmail.com' WHERE email = 'superuser@example.com';
UPDATE user_profiles SET email = 'asmrcolorsoaps@gmail.com' WHERE email = 'superuser@example.com';
```

---

## Related Documentation

- **Testing Plan:** [Day 13 Manual Testing Plan](./implementation-phases/phase-1-foundation-i18n/day-13-manual-testing-plan.md)
- **Seed File:** [supabase/seed-users.sql](../supabase/seed-users.sql)
- **Migration:** [supabase/migrations/20251103000001_update_test_user_emails.sql](../supabase/migrations/20251103000001_update_test_user_emails.sql)

---

**Last Updated:** November 3, 2025
