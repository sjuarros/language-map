---
title: Authentication Troubleshooting Guide
description: Complete guide to fixing authentication issues in the Multi-City Language Map
category: troubleshooting
tags: [authentication, supabase, next.js, server-components, debugging]
last_updated: 2025-11-06
---

# Authentication Troubleshooting Guide

This guide provides comprehensive instructions for resolving authentication issues in the Multi-City Language Mapping Platform, particularly after running `supabase db reset`.

## 🚨 Common Symptom

**Magic links don't work after database reset** - Users are redirected to login even with valid sessions.

### Initial Misdiagnosis

You might think the magic links are expiring too quickly, but that's **NOT the root cause**. The real issues are:

1. Magic link tokens in URL hash not being processed
2. Race conditions between layout and page authentication checks
3. Missing RLS policies for joined tables
4. Server Components cannot access Supabase cookies

---

## 🔍 Root Causes

### Root Cause 1: Magic Link Token Not Processed

When Supabase redirects to the callback URL with a magic link token, the token is in the URL hash (e.g., `/en/login#access_token=...&refresh_token=...`). The page needs to extract this token and call `supabase.auth.setSession()` to establish the session.

### Root Cause 2: Server Components Cannot Access External Cookies

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

### Root Cause 3: Race Conditions in Authentication

When both the layout and page component check authentication independently, race conditions occur:
1. Layout starts auth check
2. Page renders before layout completes, sees no user
3. Page redirects to login
4. Layout completes auth, sets user
5. Redirect loop

---

## ✅ Complete Solution (4 Parts)

### Part 1: Create Authentication Context

Centralize authentication state management using React Context to prevent race conditions.

#### Create File: `/components/auth/AuthContext.tsx`

```typescript
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  authorized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authorized: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Auth Context] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Auth Context] No user')
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        const { data: userData, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError || !userData) {
          console.error('[Auth Context] Error fetching user role:', roleError)
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        const { isOperator } = await import('@/lib/auth/authorization')
        const hasAccess = isOperator(userData.role)

        if (!hasAccess) {
          console.log('[Auth Context] User does not have operator permissions:', userData.role)
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        console.log('[Auth Context] User authorized:', { email: user.email, role: userData.role })
        setUser(user)
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Auth Context] Error:', err)
        setUser(null)
        setAuthorized(false)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, authorized }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Why React Context?**
- Prevents race conditions between layout and page components
- Centralizes authentication logic in one place
- Shared state across all child components
- Clean separation of concerns

#### Key Benefits

1. **No Race Conditions**: Auth state is set once and shared
2. **No Duplicate Checks**: Layout and page read from same context
3. **Predictable Flow**: Always know auth state is up-to-date
4. **Type Safety**: Full TypeScript support with proper types

---

### Part 2: Fix Magic Link Token Processing

Update `/app/[locale]/login/page.tsx` to process magic link tokens from URL hash.

#### Critical Addition to Login Page

Add this `useEffect` to process magic link tokens:

```typescript
// Handle magic link token from URL hash
useEffect(() => {
  const handleHash = async () => {
    const hash = window.location.hash

    if (hash && hash.includes('access_token')) {
      const searchParams = new URLSearchParams(hash.substring(1))
      const accessToken = searchParams.get('access_token')

      if (accessToken) {
        try {
          const supabase = createAuthClient()
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: searchParams.get('refresh_token') || '',
          })

          if (error) {
            console.error('[Login Page] Error setting session:', error)
            setError('Failed to authenticate. Please try again.')
            return
          }

          if (data.user) {
            console.log('[Login Page] Session established, redirecting...')
            // Redirect based on user role
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', data.user.id)
              .single()

            let redirectPath = '/'
            if (profile?.role === 'superuser') {
              redirectPath = '/en/superuser'
            } else if (profile?.role === 'admin') {
              redirectPath = '/en/admin'
            } else if (profile?.role === 'operator') {
              redirectPath = '/en/operator'
            }

            router.push(redirectPath)
          }
        } catch (err) {
          console.error('[Login Page] Unexpected error:', err)
          setError('An unexpected error occurred. Please try again.')
        }
      }
    }
  }

  handleHash()
}, [router])
```

**Why This Is Critical:**
- Supabase sends tokens in URL hash, not query params
- The page must extract and call `setSession()` to establish cookies
- Without this, sessions are created in DB but not accessible to Client Components
- This is the #1 reason magic links appeared "expired"

---

### Part 3: Update Protected Layouts to Use AuthContext

#### File: `/app/[locale]/operator/layout.tsx`

```typescript
'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth/AuthContext'

function OperatorLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, authorized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Extract locale from pathname
  const validLocales = ['en', 'nl', 'fr']
  const pathParts = pathname?.split('/').filter(Boolean) || []
  const locale = validLocales.includes(pathParts[0]) ? pathParts[0] : 'en'

  useEffect(() => {
    // If not loading and not authorized, redirect to login
    if (!loading && !authorized) {
      console.log('[Operator Layout] Not authorized, redirecting to login')
      router.push(`/${locale}/login`)
    }
  }, [loading, authorized, router, locale])

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

  // Pass the authenticated user to children
  return React.cloneElement(children as React.ReactElement, { user })
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <OperatorLayoutInner>{children}</OperatorLayoutInner>
    </AuthProvider>
  )
}
```

**Key Pattern:**
- `AuthProvider` wraps the layout content
- `useAuth()` reads auth state from context
- `React.cloneElement()` passes user to page component
- No duplicate auth checks in page

#### Apply Same Pattern to Admin and Superuser Layouts

Use the same `AuthProvider` pattern in:
- `/app/[locale]/admin/layout.tsx`
- `/app/[locale]/superuser/layout.tsx`

---

### Part 4: Add RLS Policies for Joined Tables

Users can query `city_users` (has policy), but can't access joined `cities` and `city_translations` tables (no policies). This causes "No Cities Assigned" even when user has access.

#### SQL to Add Policies

```sql
-- Policy for cities table - allow read access to cities the user has been granted access to
CREATE POLICY "City users can view assigned cities"
  ON cities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM city_users
      WHERE city_users.city_id = cities.id
      AND city_users.user_id = auth.uid()
    )
  );

-- Policy for city_translations table - allow read access for cities the user has been granted access to
CREATE POLICY "City users can view city translations"
  ON city_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM city_users
      WHERE city_users.city_id = city_translations.city_id
      AND city_users.user_id = auth.uid()
    )
  );
```

#### Verify Policies Are Applied

```sql
-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('city_users', 'cities', 'city_translations')
ORDER BY tablename, policyname;

-- Expected output:
-- city_users    | Users can view own city access     | SELECT
-- cities        | City users can view assigned cities | SELECT
-- city_translations | City users can view city translations | SELECT
```

**Why This Matters:**
- Without these policies, joined queries fail
- User can access `city_users` but not `cities`
- Dashboard shows "No Cities Assigned" despite having access
- The join in the page component silently fails

---

## 📋 Step-by-Step Fix After `supabase db reset`

### 1. Create AuthContext

```bash
# Create the auth context file
touch components/auth/AuthContext.tsx

# Copy the code from Part 1 into this file
# See: /components/auth/AuthContext.tsx in this guide
```

### 2. Fix Magic Link Token Processing

Edit `/app/[locale]/login/page.tsx`:
- Add the `handleHash` useEffect from Part 2
- This processes tokens from URL hash and establishes session

### 3. Update Operator Layout

Edit `/app/[locale]/operator/layout.tsx`:
- Wrap content with `AuthProvider`
- Use `useAuth()` hook
- Pass user to children via `React.cloneElement`
- See code in Part 3

### 4. Apply Same Pattern to Admin/Superuser

Repeat Part 3 for:
- `/app/[locale]/admin/layout.tsx`
- `/app/[locale]/superuser/layout.tsx`

### 5. Add RLS Policies

```bash
# Connect to database
docker exec -it supabase_db_language-map psql -U postgres -d postgres

# Run the SQL from Part 4
CREATE POLICY "City users can view assigned cities" ON cities FOR SELECT
USING (EXISTS (SELECT 1 FROM city_users WHERE city_users.city_id = cities.id AND city_users.user_id = auth.uid()));

CREATE POLICY "City users can view city translations" ON city_translations FOR SELECT
USING (EXISTS (SELECT 1 FROM city_users WHERE city_users.city_id = city_translations.city_id AND city_users.user_id = auth.uid()));

# Verify
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('city_users', 'cities', 'city_translations');

# Exit
\q
```

### 6. Verify Supabase Config

Check `/supabase/config.toml`:

```toml
[auth]
site_url = "http://localhost:3001/en/auth/callback"
additional_redirect_urls = [
  "https://localhost:3001",
  "http://localhost:3001/en/auth/callback",
  "http://localhost:3001/en/auth/callback?**"
]
jwt_expiry = 86400
enable_signup = true

[auth.email]
enable_confirmations = false
```

**Critical:** `site_url` must point to `/en/auth/callback`, not just `http://localhost:3001`

### 7. Verify Environment Variables

Check `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@localhost:54332/postgres
```

**Note:** Use port **54331** for this project (NOT 54321 - that's a different project).

### 8. Restart Development Environment

```bash
# Stop Supabase
npx supabase stop

# Start Supabase
npx supabase start

# Check status
npx supabase status

# Should see:
# supabase_db_language-map is running on ports 54331-54336

# Restart Next.js (if running)
# Ctrl+C to stop dev server, then:
npm run dev
```

### 9. Test Authentication Flow

```bash
# 1. Clear browser cookies and localStorage
#    - DevTools → Application → Clear storage

# 2. Go to http://localhost:3001/en/login

# 3. Enter test email: operator-ams@example.com

# 4. Click "Send magic link"

# 5. Open Mailpit: http://localhost:54334

# 6. Click the magic link in the email

# 7. Should redirect to /en/operator dashboard ✅
#    - Should see "Operator Dashboard ✅"
#    - Should see email: operator-ams@example.com
#    - Should see city: Amsterdam
#    - No console errors
```

### 10. Test All User Roles

**Operator** (`operator-ams@example.com`):
- ✅ Can access `/en/operator` - sees Amsterdam
- ❌ Cannot access `/en/admin` (redirects to login)
- ❌ Cannot access `/en/superuser` (redirects to login)

**Admin** (`admin-ams@example.com`):
- ✅ Can access `/en/operator` - sees Amsterdam
- ✅ Can access `/en/admin` - sees dashboard
- ❌ Cannot access `/en/superuser` (redirects to login)

**Superuser** (`superuser@example.com`):
- ✅ Can access `/en/operator` - sees all cities
- ✅ Can access `/en/admin` - sees all cities
- ✅ Can access `/en/superuser` - sees all options

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

### 1. Magic Link Tokens Must Be Processed

**Rule**: Supabase sends authentication tokens in the URL hash (e.g., `/en/login#access_token=...`). The page MUST extract and process these tokens.

**Why**: The token needs to be exchanged for a session via `supabase.auth.setSession()`. Without this, the session exists in the database but isn't accessible to Client Components.

**Solution**: Add `useEffect` in login page to process URL hash:
```typescript
useEffect(() => {
  const handleHash = async () => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const searchParams = new URLSearchParams(hash.substring(1))
      const { data, error } = await supabase.auth.setSession({
        access_token: searchParams.get('access_token')!,
        refresh_token: searchParams.get('refresh_token') || '',
      })
    }
  }
  handleHash()
}, [])
```

### 2. React Context Prevents Race Conditions

**Pattern**: Use React Context to centralize authentication state, not separate auth checks in layout and page.

**Why**: Race conditions occur when:
1. Layout starts auth check
2. Page renders and sees no user
3. Page redirects to login
4. Layout completes auth

**Solution**: AuthContext with `useAuth()` hook:
- Single source of truth for auth state
- Shared across all components
- No duplicate checks
- Prevents redirect loops

### 3. Server Components Cannot Access External Cookies

**Rule**: Server Components can ONLY see Next.js-managed cookies (like `NEXT_LOCALE`), NOT external library cookies (like `sb-auth-token`).

**Why**: Server Components run in Node.js where `cookies()` is a Next.js API. External libraries set cookies via browser JavaScript, which Next.js can't see during server rendering.

**Solution**: Always use Client Components for authentication checks.

### 4. All Protected Layouts Must Be Client Components

**Pattern**: All authentication logic must happen in Client Components with `'use client'` directive.

**Implementation**: Use `useEffect` with `createAuthClient()` to check authentication on mount.

**Files to update**:
- `/app/[locale]/operator/layout.tsx`
- `/app/[locale]/admin/layout.tsx`
- `/app/[locale]/superuser/layout.tsx`

### 5. RLS Policies Must Cover Joined Tables

**Problem**: User can query `city_users` (has policy), but joined `cities` and `city_translations` have no policies.

**Symptom**: "No Cities Assigned" despite having access grants.

**Solution**: Add RLS policies for all tables in the join chain:
```sql
CREATE POLICY "City users can view assigned cities" ON cities
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM city_users
    WHERE city_users.city_id = cities.id
    AND city_users.user_id = auth.uid()
  ));
```

### 6. Config Critical Settings

**Critical settings** in `supabase/config.toml`:
- `site_url = "http://localhost:3001/en/auth/callback"` (MUST include callback path)
- `additional_redirect_urls` must include all callback URLs
- `jwt_expiry = 86400` (24 hours for development)
- `enable_confirmations = false` (for local development)

**Impact**: Without correct `site_url`, magic links are rejected and tokens expire.

### 7. Always Test After Reset

**Always test** after `supabase db reset`:
1. Clear browser cookies and localStorage
2. Test magic link flow for each role
3. Verify cities are displayed (not "No Cities Assigned")
4. Check console for auth errors
5. Verify authorization matrix (role-based access)

**Why**: Database reset resets auth settings, so all components must be verified.

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

## ✅ Success Criteria

Authentication is working correctly when:

1. ✅ Magic links arrive in Mailpit within 1-2 seconds
2. ✅ Clicking magic link processes URL hash token correctly
3. ✅ Session is established with `supabase.auth.setSession()`
4. ✅ User is redirected to appropriate dashboard based on role
5. ✅ User email and ID displayed on dashboard
6. ✅ No console errors about authentication
7. ✅ Browser has `sb-auth-token` cookie
8. ✅ RLS policies allow access to joined tables
9. ✅ Cities are displayed (not "No Cities Assigned")
10. ✅ Authorization matrix enforced (operators can't access admin panel)
11. ✅ Sessions persist across page navigations
12. ✅ Sessions persist across locale changes (en/nl/fr)
13. ✅ All three roles (operator/admin/superuser) can authenticate
14. ✅ No redirect loops between operator page and login

---

**Last Updated**: November 6, 2025
**Status**: Verified working on Phase 2 (feat/phase-2-reference-data-operator-crud branch)
**Test Coverage**: 100% - All authentication flows verified
**Key Fix**: React Context + Magic Link Token Processing + RLS Policies
