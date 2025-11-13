---
title: Accidental Changes to Wrong Database
description: Documentation of changes accidentally made to supabase_db_supabase instead of supabase_db_language-map
category: debugging
tags: [database, migration, error, fix]
date: 2025-11-03
status: DOCUMENTED
---

# Accidental Changes to Wrong Database

**Date:** November 3, 2025
**Status:** ✅ Documented
**Issue:** Changes intended for `supabase_db_language-map` were accidentally applied to `supabase_db_supabase`

---

## Executive Summary

During the debugging of infinite recursion in RLS policies, changes were accidentally applied to the **WRONG Supabase instance**. This happened because:

1. Two Supabase instances were running simultaneously:
   - ✅ **Correct**: `supabase_db_language-map` (port 54332) - Language Map project
   - ❌ **Wrong**: `supabase_db_supabase` (port 54322) - Different project

2. Docker commands used `supabase_db_supabase` instead of `supabase_db_language-map`

3. The correct database was only identified after observing that user IDs didn't match

---

## What Was Changed in Wrong Database

### 1. User Email Updates

**Migration:** `20251103000001_update_test_user_emails.sql`

**Changes:**
- Updated user emails to more intuitive format:
  - `amsterdam-admin@example.com` → `admin-ams@example.com`
  - `amsterdam-operator@example.com` → `operator-ams@example.com`
- Created/updated `superuser@example.com` user

**Current State:**
```sql
-- Users in supabase_db_supabase:
superuser@example.com      (role: superuser)
admin-ams@example.com      (role: admin)
operator-ams@example.com   (role: operator)
asmrcolorsoaps@gmail.com   (role: superuser)
test_user_a@example.com    (role: operator)
test_user_b@example.com    (role: admin)
districts.test@example.com (role: operator)
```

### 2. RLS Policy Changes on city_users

**Migration:** `20251103000002_fix_city_users_recursion.sql`

**Changes:**
- ❌ **REMOVED** 4 admin policies:
  - `Admins can view city_users for their cities`
  - `Admins can insert city_users for their cities`
  - `Admins can update city_users for their cities`
  - `Admins can delete city_users for their cities`

**Remaining Policies:**
```sql
-- 5 policies on city_users:
Superusers can view all city_users (SELECT)
Superusers can insert city_users (INSERT)
Superusers can update city_users (UPDATE)
Superusers can delete city_users (DELETE)
Users can view own city access (SELECT)
```

### 3. is_city_admin Function

**Migration:** `20251103000002_fix_city_users_recursion.sql`

**Changes:**
- Created `is_city_admin(p_user_id UUID, p_city_id UUID)` function
- Function uses SECURITY DEFINER to bypass RLS
- Checks if user is admin for a specific city

---

## Impact Assessment

### High Impact
- **RLS Policies Removed**: Admin users in the wrong database can NO LONGER manage city_users through RLS
  - This may break admin functionality if that project relies on these policies
  - Admins would need to use service role or have policies restored

### Low Impact
- **User Emails Changed**: Minor cosmetic change, emails are more intuitive
  - Users may need to use new emails for login
  - Old sessions may be invalidated

### No Impact
- **is_city_admin Function**: Adds functionality, doesn't break existing code
  - Safe to keep or remove

---

## Verification Commands

### Check Wrong Database State

```bash
# Check users
docker exec supabase_db_supabase psql -U postgres -d postgres -c \
  "SELECT email, role FROM user_profiles ORDER BY email"

# Check city_users policies
docker exec supabase_db_supabase psql -U postgres -d postgres -c \
  "SELECT policyname FROM pg_policies WHERE tablename = 'city_users'"

# Check functions
docker exec supabase_db_supabase psql -U postgres -d postgres -c \
  "SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('is_superuser', 'is_city_admin', 'has_city_access')"
```

### Check Correct Database State

```bash
# Check users
docker exec supabase_db_language-map psql -U postgres -d postgres -c \
  "SELECT email, role FROM user_profiles ORDER BY email"

# Check city_users policies
docker exec supabase_db_language-map psql -U postgres -d postgres -c \
  "SELECT policyname FROM pg_policies WHERE tablename = 'city_users'"
```

---

## Rollback Options

### Option 1: Restore Admin Policies (if needed by other project)

```sql
-- Restore admin policies on city_users in supabase_db_supabase
docker exec supabase_db_supabase psql -U postgres -d postgres << 'EOF'

-- Note: These policies will cause infinite recursion if is_city_admin queries city_users
-- Only restore if the other project needs them AND has a different implementation

CREATE POLICY "Admins can view city_users for their cities" ON city_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

CREATE POLICY "Admins can insert city_users for their cities" ON city_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

CREATE POLICY "Admins can update city_users for their cities" ON city_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

CREATE POLICY "Admins can delete city_users for their cities" ON city_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM city_users cu2
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );

EOF
```

### Option 2: Revert User Email Changes (if needed)

```sql
-- Revert to old email format in supabase_db_supabase
docker exec supabase_db_supabase psql -U postgres -d postgres << 'EOF'

UPDATE auth.users SET email = 'amsterdam-admin@example.com'
WHERE email = 'admin-ams@example.com';

UPDATE user_profiles SET email = 'amsterdam-admin@example.com'
WHERE email = 'admin-ams@example.com';

UPDATE auth.users SET email = 'amsterdam-operator@example.com'
WHERE email = 'operator-ams@example.com';

UPDATE user_profiles SET email = 'amsterdam-operator@example.com'
WHERE email = 'operator-ams@example.com';

EOF
```

### Option 3: Do Nothing (Recommended if other project not in active use)

If `supabase_db_supabase` is:
- A test/experimental instance
- Not actively used
- Can tolerate these changes

Then **no action is needed**.

---

## Prevention for Future

### 1. Always Specify Correct Container

Create shell aliases to prevent this error:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias db-language-map="docker exec supabase_db_language-map psql -U postgres -d postgres"
alias db-supabase="docker exec supabase_db_supabase psql -U postgres -d postgres"
```

**Usage:**
```bash
db-language-map -c "SELECT * FROM user_profiles"
db-supabase -c "SELECT * FROM user_profiles"
```

### 2. Check Container Name Before Running Commands

Always verify which container you're targeting:

```bash
# List all Supabase containers
docker ps | grep supabase_db

# Expected output should show:
# supabase_db_language-map (port 54332) ← YOUR PROJECT
# supabase_db_supabase (port 54322)     ← OTHER PROJECT
```

### 3. Use Environment Variables

```bash
# Set active database
export ACTIVE_DB="supabase_db_language-map"

# Use in commands
docker exec $ACTIVE_DB psql -U postgres -d postgres -c "SELECT ..."
```

### 4. Stop Unused Instances

If you're not actively using `supabase_db_supabase`:

```bash
# Stop the other Supabase instance
cd /path/to/other/project
npx supabase stop
```

---

## Lessons Learned

1. **Always Verify Target**: Before running database commands, confirm you're targeting the correct container
2. **Unique Naming**: Use descriptive container names (like `supabase_db_language-map`) to avoid confusion
3. **Test Queries First**: Before applying migrations, run a simple SELECT query to verify you're in the right database
4. **Check User IDs**: When debugging auth issues, verify user IDs exist in the database you're querying
5. **Port Awareness**: Know which ports each project uses (54331-54336 vs 54321-54324)

---

## Current Status

### Language Map Project (supabase_db_language-map) ✅
- **Status**: FIXED - All changes applied correctly
- **User**: `superuser@example.com` with role `superuser`
- **RLS Policies**: Cleaned up, no infinite recursion
- **Authentication**: Working correctly

### Other Project (supabase_db_supabase) ⚠️
- **Status**: MODIFIED - Unintended changes applied
- **Impact**: Admin policies removed, user emails changed
- **Action Needed**: Assess if other project needs rollback
- **Recommendation**: Test other project's admin functionality

---

## Recommended Actions

### Immediate
1. ✅ Document what happened (this file)
2. ⚠️ Test the other project to see if it's affected
3. ⚠️ Decide if rollback is needed for other project

### Short-term
1. 📋 Create database command aliases to prevent future confusion
2. 📋 Update development documentation with container naming conventions
3. 📋 Stop unused Supabase instances when not needed

### Long-term
1. 📋 Consider using docker-compose project names to avoid conflicts
2. 📋 Document all running Supabase instances and their purposes
3. 📋 Create a checklist for database operations

---

## Related Documentation

- **Original Issue**: Infinite recursion in RLS policies
- **Resolution**: [docs/debugging/superuser-authentication-fix-summary.md]
- **User Email Update**: [docs/test-user-email-update.md]

---

**Status**: Documented for reference. No immediate action required unless other project is actively used.
**Date**: November 3, 2025
