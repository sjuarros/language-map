---
title: Authentication Troubleshooting Guide
description: Complete guide to fixing authentication issues in the Multi-City Language Map
category: troubleshooting
tags: [authentication, supabase, next.js, server-components, debugging]
last_updated: 2025-11-05
---

# Authentication Troubleshooting Guide

This guide provides comprehensive instructions for resolving authentication issues in the Multi-City Language Mapping Platform, particularly after running `supabase db reset`.

## 🚨 Common Symptom

**Magic links don't work after database reset** - Users are redirected to login even with valid sessions.

### Initial Misdiagnosis

You might think the magic links are expiring too quickly, but that's **NOT the root cause**. The real issue is deeper and architectural.

---

## 🔍 Root Cause

**Next.js 15+ Server Components cannot access cookies set by external libraries** (like Supabase's `sb-auth-token` cookie).

### Technical Explanation

```typescript
// ❌ Server Component - CANNOT access sb-auth-token
export default async function Page() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  // Result: Only sees NEXT_LOCALE, NOT sb-auth-token
  console.log(allCookies) // [{ name: 'NEXT_LOCALE', value: 'en' }]
}

// ✅ Client Component - CAN access sb-auth-token
'use client'
export default function Page() {
  const cookies = document.cookie.split(';')
  // Result: Has sb-auth-token!
  console.log(cookies) // [..., 'sb-auth-token=...', ...]
}
```

**Why?** Server Components run in a Node.js environment where `cookies()` only sees cookies managed by Next.js itself. External libraries like Supabase set cookies directly in the browser via JavaScript, bypassing Next.js's cookie management.

---

## ✅ Complete Solution (3 Parts)

### Part 1: Convert Protected Layouts to Client Components

All protected route layouts **MUST** use the `'use client'` directive and client-side authentication checks.

#### Files to Update

- `/app/[locale]/operator/layout.tsx`
- `/app/[locale]/admin/layout.tsx`
- `/app/[locale]/superuser/layout.tsx`

#### Pattern to Use

```typescript
'use client'  // ⚠️ CRITICAL - Must be the very first line

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const locale = pathname?.split('/')[1] || 'en'

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Authentication check only - is user logged in?
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          console.log('[Layout] No user, redirecting to login')
          router.push(`/${locale}/login?redirectTo=/operator`)
          return
        }

        console.log('[Layout] User authenticated:', user.email)
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Layout] Auth error:', err)
        router.push(`/${locale}/login`)
      }
    }

    checkAuth()
  }, [router, locale])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <div>{children}</div>
}
```

#### Key Changes from Server Component Pattern

| Old (Server Component) | New (Client Component) | Why |
|------------------------|------------------------|-----|
| `import { cookies } from 'next/headers'` | Remove this import | Server Components can't see external cookies |
| `import { redirect } from 'next/navigation'` | `import { useRouter } from 'next/navigation'` | Client Components use router, not redirect |
| `import { getLocale } from 'next-intl/server'` | `const pathname = usePathname()` | Parse locale from URL |
| `createServerClient` with cookie handlers | `createAuthClient()` | Use browser-based client |
| `const locale = await getLocale()` | `const locale = pathname.split('/')[1]` | No async locale in client |
| `redirect('/login')` | `router.push('/login')` | Client-side navigation |
| Authentication + Authorization in layout | Authentication only in layout | Separation of concerns |

#### Separation of Concerns

**Layout**: Authentication only
- Checks if user is logged in
- Redirects to login if not authenticated
- Does NOT check user role or permissions

**Page**: Authorization
- Assumes user is authenticated (layout handles this)
- Checks if user has required role (operator/admin/superuser)
- Fetches user-specific data
- Shows appropriate content based on permissions

This prevents:
- RLS circular dependencies in layout queries
- Complex authorization logic in shared components
- Unnecessary database queries on every navigation

---

### Part 2: Update Supabase Configuration

Edit `/home/user/language-map/supabase/config.toml`:

```toml
[auth]
enabled = true
site_url = "http://localhost:3001"
additional_redirect_urls = [
  "https://localhost:3001",
  "http://localhost:3001/en/auth/callback",
  "http://localhost:3001/en/auth/callback?**"
]
# JWT expiry in seconds (86400 = 24 hours for development)
jwt_expiry = 86400
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # Disable email confirmation for development
```

#### What Each Setting Does

- **`site_url`**: The base URL for your application (must match Next.js dev server)
- **`additional_redirect_urls`**: Allowed callback URLs after authentication
- **`jwt_expiry`**: How long the JWT token is valid (24 hours = 86400 seconds)
- **`enable_confirmations`**: Set to `false` for development (no email confirmation required)

#### Why This Matters

Without these settings, Supabase will:
- ❌ Reject magic link redirects as untrusted
- ❌ Expire tokens after 1 hour (default)
- ❌ Block callback URLs that don't match `site_url`

---

### Part 3: Fix RLS Circular Dependencies (Admin Only)

The admin layout has additional RLS policy issues that cause infinite recursion when querying `city_users`.

#### Problem

```sql
-- ❌ OLD POLICY: Causes infinite recursion
CREATE POLICY "Admins can view city_users for their cities" ON city_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM city_users cu2  -- ❌ Queries same table!
      WHERE cu2.user_id = auth.uid()
        AND cu2.role = 'admin'
        AND cu2.city_id = city_users.city_id
    )
  );
```

**Why it fails:**
1. Admin page queries `city_users` to get accessible cities
2. RLS policy checks if user is admin by querying `city_users`
3. That query triggers the same RLS policy again
4. → **Infinite recursion** → PostgreSQL error

#### Solution

Use helper functions to avoid circular dependencies:

```sql
-- ✅ NEW POLICY: Uses helper function
DROP POLICY IF EXISTS "Admins can view city_users for their cities" ON city_users;

CREATE POLICY "Users can view city_users where they have access" ON city_users
  FOR SELECT
  USING (
    -- Users can see their own city grants
    auth.uid() = user_id
    OR
    -- Superusers can see all grants
    is_superuser(auth.uid())
  );
```

#### Helper Functions Already Available

The database schema includes these helper functions:

```sql
-- 1. is_superuser(user_id UUID) -> BOOLEAN
-- Checks if user has superuser role
-- Returns true for superusers, false otherwise

-- 2. has_city_access(user_id UUID, city_id UUID) -> BOOLEAN
-- Checks if user has access to a specific city
-- Returns true if superuser OR has city_users entry

-- 3. is_city_admin(user_id UUID, city_id UUID) -> BOOLEAN
-- Checks if user is admin of a specific city
-- Returns true if superuser OR has admin role in city_users
```

These functions query `user_profiles` and `city_users` but are designed to avoid recursion.

---

## 📋 Step-by-Step Fix After `supabase db reset`

### 1. Verify Layouts Are Client Components

```bash
# Check that 'use client' is the first line in each file
head -1 app/\[locale\]/operator/layout.tsx    # Should output: 'use client'
head -1 app/\[locale\]/admin/layout.tsx       # Should output: 'use client'
head -1 app/\[locale\]/superuser/layout.tsx   # Should output: 'use client'
```

If any file doesn't have `'use client'` as the first line, add it and convert the file using the pattern above.

### 2. Update Supabase Config

```bash
# Edit the config file
nano supabase/config.toml

# Update the [auth] section as shown in Part 2
```

### 3. Verify RLS Policies

```bash
# Connect to database
npx supabase db psql

# Check if simplified RLS policy exists
\d+ city_users  # View policies on city_users table

# Exit psql
\q
```

If you see the old circular policy, run the migration to update it (migration file should already exist from previous fixes).

### 4. Reset and Restart Supabase

```bash
# Stop Supabase
npx supabase stop

# Reset database (applies all migrations)
npx supabase db reset

# Restart Supabase
npx supabase start

# Verify it's running
npx supabase status
```

### 5. Verify Environment Variables

Check `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Note:** Use port **54331** for this project (NOT 54321 - that's a different project).

### 6. Restart Next.js Dev Server

```bash
# If server is running, restart it
# Ctrl+C to stop, then:
npm run dev
```

### 7. Test Authentication Flow

```bash
# 1. Clear browser cookies and localStorage (DevTools → Application)
# 2. Go to http://localhost:3001/en/login
# 3. Enter test email: operator-ams@example.com
# 4. Click "Send magic link"
# 5. Open Mailpit: http://localhost:54334
# 6. Click the magic link in the email
# 7. Should redirect to /en/operator dashboard ✅
```

### 8. Test All User Roles

Test each role to ensure authorization matrix works:

**Operator** (`operator-ams@example.com`):
- ✅ Can access `/en/operator`
- ❌ Cannot access `/en/admin` (redirects to login)
- ❌ Cannot access `/en/superuser` (redirects to login)

**Admin** (`admin-ams@example.com`):
- ✅ Can access `/en/operator`
- ✅ Can access `/en/admin`
- ❌ Cannot access `/en/superuser` (redirects to login)

**Superuser** (`superuser@example.com`):
- ✅ Can access `/en/operator`
- ✅ Can access `/en/admin`
- ✅ Can access `/en/superuser`

---

## 🐛 Debugging Tips

### Check Browser Cookies

```javascript
// Run in browser console
document.cookie.split(';').forEach(c => console.log(c.trim()))

// Look for:
// sb-auth-token=...
// sb-refresh-token=...
```

If you don't see `sb-auth-token`, authentication failed.

### Check Server Logs

```bash
# Look for authentication errors in Next.js console
# Should see:
[Layout] User authenticated: operator-ams@example.com
```

If you see `[Layout] No user, redirecting to login`, authentication failed.

### Check Supabase Logs

```bash
# View Supabase logs
npx supabase logs

# Look for authentication events and errors
```

### Verify Database Users

```sql
-- Connect to database
npx supabase db psql

-- Check test users exist
SELECT email, role, is_active
FROM user_profiles
WHERE email IN ('operator-ams@example.com', 'admin-ams@example.com', 'superuser@example.com');

-- Check city grants
SELECT
  up.email,
  up.role as user_role,
  c.slug as city,
  cu.role as city_role
FROM user_profiles up
LEFT JOIN city_users cu ON up.id = cu.user_id
LEFT JOIN cities c ON cu.city_id = c.id
WHERE up.email = 'operator-ams@example.com';
```

Expected output:
```
            email             | user_role |   city    | city_role
------------------------------+-----------+-----------+-----------
 operator-ams@example.com     | operator  | amsterdam | operator
```

### Check RLS Policies

```sql
-- View RLS policies on city_users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'city_users';

-- Verify no circular dependencies
-- The policy should check auth.uid() = user_id, NOT query city_users again
```

---

## 🎯 Key Learnings

### 1. Server Components and Cookies

**Rule**: Server Components can ONLY see Next.js-managed cookies (like `NEXT_LOCALE`), NOT external library cookies (like `sb-auth-token`).

**Why**: Server Components run in Node.js where `cookies()` is a Next.js API. External libraries set cookies via browser JavaScript, which Next.js can't see during server rendering.

**Solution**: Always use Client Components for authentication checks.

### 2. Client Components for Auth

**Pattern**: All authentication logic must happen in Client Components with `'use client'` directive.

**Why**: Client Components run in the browser where `document.cookie` can access all cookies, including those set by Supabase.

**Implementation**: Use `useEffect` with `createAuthClient()` to check authentication on mount.

### 3. Separation of Concerns

**Layout**: Authentication only (is user logged in?)
- Simple check: `supabase.auth.getUser()`
- Redirect if no user
- No database queries

**Page**: Authorization (does user have required role?)
- Assumes user is authenticated
- Query `user_profiles` for role
- Fetch user-specific data
- Show appropriate content

**Why**: Prevents RLS circular dependencies and keeps layouts simple.

### 4. RLS Helper Functions

**Pattern**: Use helper functions like `is_superuser()` and `has_city_access()` in RLS policies.

**Why**: Direct queries in RLS policies can cause circular dependencies.

**Example**:
```sql
-- ❌ BAD: Circular dependency
USING (EXISTS (SELECT 1 FROM city_users WHERE ...))

-- ✅ GOOD: Helper function
USING (has_city_access(auth.uid(), city_id))
```

### 5. Config Matters

**Critical settings** in `supabase/config.toml`:
- `site_url` must match your Next.js URL
- `additional_redirect_urls` must include all callback URLs
- `jwt_expiry` should be longer for development (24 hours)
- `enable_confirmations` should be `false` for local development

**Impact**: Without these, magic links won't work and tokens will expire quickly.

### 6. Testing After Reset

**Always test** after `supabase db reset`:
1. Clear browser cookies
2. Test login flow for each role
3. Verify authorization matrix
4. Check cross-locale access
5. Test session persistence

**Why**: Database reset resets auth settings, so you need to verify everything works.

---

## 📚 Related Documentation

### Original Debugging Sessions

Complete historical documentation of the investigation:

- **`docs/debugging/authentication-debugging-summary.md`** - Initial discovery of Server Component issue
- **`docs/debugging/admin-authentication-issue-summary.md`** - RLS circular dependency fix
- **`docs/debugging/superuser-authentication-fix-summary.md`** - Applying pattern to superuser
- **`docs/debugging/authentication-issues-session-1.md`** - Detailed debugging session

### Test Results

- **`docs/implementation-phases/phase-2-operator-crud/AUTHENTICATION-TEST-RESULTS.md`** - Comprehensive test results (34/34 tests passed)
- **`docs/implementation-phases/phase-2-operator-crud/authentication-test-report.md`** - Test report with observations
- **`docs/implementation-phases/phase-2-operator-crud/manual-testing-authentication.md`** - Manual testing guide

### Architecture Documentation

- **`docs/architecture.md`** - Authentication & authorization architecture
- **`docs/processes/coding-standards.md`** - Coding standards for auth code
- **`CLAUDE.md`** - Quick reference (Common Pitfalls section)

---

## ✅ Success Criteria

Authentication is working correctly when:

1. ✅ Magic links arrive in Mailpit within 1-2 seconds
2. ✅ Clicking magic link logs user in and redirects to dashboard
3. ✅ User email and ID displayed on dashboard
4. ✅ Authorization matrix enforced (operators can't access admin panel)
5. ✅ Sessions persist across page navigations
6. ✅ Sessions persist across locale changes (en/nl/fr)
7. ✅ No console errors about authentication
8. ✅ Browser has `sb-auth-token` cookie
9. ✅ RLS policies allow appropriate data access
10. ✅ All three roles (operator/admin/superuser) can authenticate

---

## 🆘 Still Having Issues?

If authentication still doesn't work after following this guide:

### 1. Check Supabase Instance

```bash
docker ps | grep supabase

# Should see: supabase_db_language-map (THIS project)
# NOT: supabase_db_supabase (different project)
```

### 2. Verify Port Configuration

```bash
# Check supabase/config.toml
grep "port" supabase/config.toml

# Should see:
# api.port = 54331
# db.port = 54332
# studio.port = 54333
# inbucket.port = 54334
```

### 3. Check Environment Variables

```bash
# Verify .env.local matches Supabase ports
cat .env.local | grep SUPABASE

# Should see:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331 (NOT 54321)
```

### 4. Clear Everything and Start Fresh

```bash
# Nuclear option - clear all state
rm -rf .next
npx supabase stop
docker system prune -f
npx supabase start
npm run dev
```

### 5. Ask for Help

If all else fails, provide:
- Console error messages
- Browser console output (including `document.cookie`)
- Supabase logs (`npx supabase logs`)
- Database user verification query results
- Which step in this guide failed

---

**Last Updated**: November 5, 2025
**Status**: Verified working on Phase 2 (feat/phase-2-reference-data-operator-crud branch)
**Test Coverage**: 34/34 tests passed (100%)
