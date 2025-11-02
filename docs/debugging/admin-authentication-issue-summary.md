# Admin Authentication Issue - Investigation Summary

**Date**: November 2, 2025
**Status**: ⚠️ PARTIALLY RESOLVED - RLS Policy Issue Identified
**User**: test_user_b@example.com (admin role)

---

## Executive Summary

The admin authentication flow was failing due to **Row-Level Security (RLS) policies causing infinite recursion**. The investigation revealed multiple issues:

1. ✅ **FIXED**: Admin layout was a Server Component that couldn't access `sb-auth-token` cookie
2. ⚠️ **IDENTIFIED**: RLS policies on `city_users` and `user_profiles` tables cause infinite recursion
3. ✅ **VERIFIED**: User has correct role and city grants in database
4. ⚠️ **BLOCKING**: Client-side queries to `city_users` fail due to RLS circular dependencies

---

## Investigation Steps

### Step 1: Initial Testing (❌ Failed)
- Attempted to access `/en/admin` with `test_user_b@example.com`
- Result: Redirected to login page
- Session: Valid and not expired
- **Finding**: User IS authenticated but cannot access admin page

### Step 2: Database Verification (✅ Passed)
Initially queried wrong database (`supabase_db_supabase` instead of `supabase_db_language-map`).

**Correct Database Status**:
```sql
-- auth.users
id: ffd82aa8-201a-4efd-a17f-9e3f12a032b3
email: test_user_b@example.com
last_sign_in_at: 2025-11-02 22:08:07 ✅

-- user_profiles
id: ffd82aa8-201a-4efd-a17f-9e3f12a032b3
email: test_user_b@example.com
role: admin ✅
is_active: true ✅

-- city_users
city_id: 33333333-3333-3333-3333-333333333333 (amsterdam)
user_id: ffd82aa8-201a-4efd-a17f-9e3f12a032b3
role: admin ✅
```

### Step 3: Test Data Creation (✅ Completed)
Created missing test data:
- ✅ Locales: en, nl, fr
- ✅ World region: Europe
- ✅ Country: Netherlands
- ✅ City: Amsterdam (active status)
- ✅ City translations (en, nl, fr)
- ✅ City locales enabled
- ✅ City grant for test_user_b

### Step 4: Schema Fixes (✅ Completed)
Fixed admin page query to match actual database schema:
- Changed: `name` and `country` fields don't exist in `cities` table
- Fixed: Query `slug` and `country_id` instead
- Updated TypeScript interfaces to match

### Step 5: Server vs Client Component Issue (✅ FIXED)
**Root Cause #1**: Admin layout (`app/[locale]/admin/layout.tsx`) was a Server Component.

**Problem**: Server Components cannot access cookies set by external libraries like Supabase's `sb-auth-token`. This is documented in `docs/debugging/authentication-debugging-summary.md`.

**Solution**: Converted admin layout to Client Component using `'use client'` directive and client-side auth checks.

### Step 6: RLS Infinite Recursion (⚠️ BLOCKING)
**Root Cause #2**: RLS policies cause circular dependencies.

**Problem Details**:
```
Error: infinite recursion detected in policy for relation "city_users"
Error Code: 42P17
```

**Why It Happens**:

1. Admin page queries `city_users` to get user's accessible cities
2. RLS policy "Admins can view city_users for their cities" checks if user is admin:
   ```sql
   POLICY "Admins can view city_users for their cities" FOR SELECT
     USING ((EXISTS ( SELECT 1
      FROM city_users cu2
     WHERE ((cu2.user_id = auth.uid()) AND (cu2.role = 'admin'::text)
            AND (cu2.city_id = city_users.city_id)))))
   ```
3. This policy queries `city_users` AGAIN to check if user is admin
4. Which triggers the same policy again → **infinite recursion**

**Similar Issue with `user_profiles`**:
The "Admins can view profiles for their cities" policy also has circular dependency through `city_users`.

---

## Current Status

### ✅ Working
- Operator authentication (`operator.test@example.com`)
- Session management and cookie handling
- Client Component authentication pattern
- Database data structure and grants

### ⚠️ Partially Working
- Admin layout loads (no longer redirects to login)
- Authentication check passes
- Shows "Admin Dashboard" heading

### ❌ Not Working
- Querying `city_users` table from client-side
- Admin dashboard cannot load user's cities
- Shows error: "Failed to load cities"

---

## Solutions

### Option 1: Simplify RLS Policies (Recommended)
Modify `city_users` RLS policies to avoid circular dependencies:

```sql
-- Replace the admin policy with a simpler one that doesn't query city_users recursively
DROP POLICY "Admins can view city_users for their cities" ON city_users;

CREATE POLICY "Users can view city_users where they have access" ON city_users
  FOR SELECT
  USING (
    -- Users can see their own grants
    auth.uid() = user_id
    OR
    -- Superusers can see all
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
  );
```

This allows:
- Users to see their own city grants (via `auth.uid() = user_id`)
- Superusers to see all grants
- Removes the circular dependency on `city_users`

### Option 2: Use Service Role for Admin Queries
Create server-side API routes that use the service role key to bypass RLS:

```typescript
// app/api/admin/cities/route.ts
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
  )

  // Query without RLS restrictions
  const { data } = await supabase
    .from('city_users')
    .select('*')

  return Response.json(data)
}
```

### Option 3: Denormalize Role Data
Store role in JWT claims or session metadata to avoid database queries:

```typescript
// Check role from session instead of querying database
const session = await supabase.auth.getSession()
const userRole = session.data.session?.user.user_metadata?.role
```

---

## Recommended Next Steps

1. **Implement Option 1** (Simplify RLS policies) - This is the cleanest solution
   - Update `city_users` RLS policies to remove circular dependencies
   - Test admin authentication flow
   - Verify operator authentication still works

2. **Update Documentation**
   - Document the RLS policy patterns to avoid future circular dependencies
   - Add guidelines for testing RLS policies

3. **Create RLS Testing Suite**
   - Test policies with different user roles
   - Verify no circular dependencies
   - Test edge cases (no grants, multiple cities, etc.)

---

## Key Learnings

1. **Server Components and Cookies**: Server Components in Next.js 15+ cannot access cookies set by external libraries. Always use Client Components for authentication checks.

2. **RLS Circular Dependencies**: Be very careful when RLS policies query the same table they're protecting or related tables that query back. Always check for circular dependencies.

3. **Database Verification**: When debugging, always verify you're querying the correct database instance (especially with multiple Supabase projects).

4. **Client-Side RLS**: Client-side Supabase queries with anon key properly enforce RLS policies, but complex policies with subqueries can cause infinite recursion.

5. **Testing is Critical**: RLS policies should be tested with actual user sessions, not just with service role queries.

---

## Files Modified

1. `/app/[locale]/admin/layout.tsx` - Converted to Client Component
2. `/app/[locale]/admin/page.tsx` - Fixed schema queries, added debug logging

## Files to Modify (Pending)

1. Database: `city_users` table RLS policies
2. Database: `user_profiles` table RLS policies (if needed)

---

**Status**: Investigation complete, solution identified, awaiting RLS policy updates.
