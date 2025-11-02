# Authentication Issues - Debugging Session 1

**Date**: November 2, 2025
**Status**: In Progress
**Session Duration**: ~4 hours
**Primary Issue**: Users cannot access protected routes (/operator, /admin, /superuser) despite successful authentication

---

## Executive Summary

Magic link authentication works correctly (emails are sent, tokens are generated, sessions are established), but middleware continues to redirect authenticated users to the login page. The root cause appears to be **cookie name inconsistency** between different Supabase client instances in the application.

**Current Status**: All Supabase clients have been configured to use a consistent simple cookie name (`sb-auth-token`), but authentication is still failing. Further investigation needed.

---

## Initial Problem Description

Three dashboard pages were inaccessible:
- `/en/operator` - For operator role users
- `/en/admin` - For admin role users
- `/en/superuser` - For superuser role users

Users would successfully receive magic links, click them, but then get redirected back to login when attempting to access protected routes.

---

## Investigation Timeline & Findings

### 1. Database Issues (RESOLVED)

**Problem**: Trigger to create `user_profiles` entries was not working
**Root Cause**: Trigger was looking in wrong schema (`auth.users` table doesn't exist in `public` schema)
**Fix**: Updated trigger in migration `20251101000000_create_user_profiles_trigger.sql`:
```sql
-- Changed FROM: INSERT INTO user_profiles ... SELECT ... FROM users
-- Changed TO:   INSERT INTO user_profiles ... SELECT ... FROM auth.users
```

**Verification**: Confirmed user profile exists:
```sql
SELECT id, email, role, is_active FROM user_profiles
WHERE email = 'districts.test@example.com';
-- Result: operator role, is_active = true
```

### 2. RLS Policy Infinite Recursion (RESOLVED)

**Problem**: Middleware queries to `user_profiles` failed with "infinite recursion detected in policy for relation city_users"

**Root Cause**: Complex circular dependencies in RLS policies:
- `user_profiles` policies referenced `city_users`
- `city_users` admin policies queried `city_users` recursively
- `is_superuser()` function queried `user_profiles`
- PostgreSQL evaluates ALL applicable policies, creating infinite loops

**Solution**: Switched middleware to use **service role client** to bypass RLS entirely:

**File**: `/home/sjuarros/Projects/language-map/middleware.ts` (lines 198-220)
```typescript
// Use standard createClient (not createServerClient) for service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

**Additional Fix**: Exposed service role key to Edge runtime via `next.config.ts`:
```typescript
env: {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}
```

**Database Migrations Created** (9 total):
- `20251102000000_fix_city_users_rls_recursion.sql` through `20251102000009_remove_all_is_superuser_policies.sql`
- These removed recursive RLS policies that were causing the infinite recursion

### 3. Middleware Logic Bug (RESOLVED)

**Problem**: i18n middleware was redirecting BEFORE auth check, allowing protected routes to bypass authentication

**Original Flawed Logic** (middleware.ts):
```typescript
// WRONG - i18n redirect happens before auth check!
const i18nResponse = i18nMiddleware(request)
if (i18nResponse.status !== 200) {
  return i18nResponse  // ⚠️ Bypasses auth!
}
const authResponse = await handleAuthorization(request)
```

**Fix**: Reversed order - auth ALWAYS runs first:
```typescript
// CORRECT - auth check happens before i18n
const authResponse = await handleAuthorization(request)
if (authResponse) {
  return authResponse
}
const i18nResponse = i18nMiddleware(request)
return i18nResponse
```

### 4. Cookie Name Inconsistency (PRIMARY ISSUE - PARTIALLY RESOLVED)

**Problem**: Browser Supabase client and server Supabase clients were using different cookie names

**Discovery Process**:
1. Browser creates cookie: `sb-127-auth-token` (simplified hostname)
2. Middleware expects: `sb-127-0-0-1-54331-auth-token` (full hostname with port)
3. Mismatch → middleware can't find session → redirect to login

**Initial Attempted Solutions** (all failed):
- ❌ Tried changing `NEXT_PUBLIC_SUPABASE_URL` from `127.0.0.1:54331` to `localhost:54331`
  - Result: Created different cookie (`sb-localhost-54331-auth-token`) but old cookie still used
- ❌ Tried using `cookieOptions.name` parameter in middleware
  - Result: Parameter appears to be ignored by `@supabase/ssr`
- ❌ Tried complex fallback logic to check multiple cookie name variations
  - Result: Too fragile, didn't solve root issue

**Final Solution Implemented**: Force ALL Supabase clients to use simple consistent cookie name `sb-auth-token`

### 5. Files Modified to Use `sb-auth-token`

All Supabase client configurations updated to consistently use `sb-auth-token`:

#### A. Browser Client
**File**: `/home/sjuarros/Projects/language-map/lib/auth/client.ts` (lines 46-52)
```typescript
export function createAuthClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      name: 'sb-auth-token',  // Simple, consistent cookie name
    },
  })
}
```

#### B. Middleware
**File**: `/home/sjuarros/Projects/language-map/middleware.ts` (lines 168-182)
```typescript
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        console.log('[Middleware] Supabase requesting cookie:', name)
        // Always return our simple cookie regardless of what Supabase asks for
        const value = request.cookies.get('sb-auth-token')?.value
        console.log('[Middleware] Returning sb-auth-token:', value ? 'found' : 'not found')
        return value
      },
      // ... set/remove handlers
    },
  }
)
```

#### C. Auth Callback Route
**File**: `/home/sjuarros/Projects/language-map/app/[locale]/auth/callback/route.ts` (lines 59-61)
```typescript
cookieOptions: {
  name: 'sb-auth-token',  // Use simple, consistent cookie name
},
```

#### D. Operator Page
**File**: `/home/sjuarros/Projects/language-map/app/[locale]/operator/page.tsx` (lines 26-28)
```typescript
get(name: string) {
  // Always use our simple cookie name
  return cookieStore.get('sb-auth-token')?.value
},
```

#### E. Server Client Helper (Centralized)
**File**: `/home/sjuarros/Projects/language-map/lib/supabase/server-client.ts` (lines 53-59)
```typescript
get(name: string) {
  if (cookieOptions?.get) {
    return cookieOptions.get(name)
  }
  // Always use our simple cookie name
  return cookieStore.get('sb-auth-token')?.value
},
```

**Note**: This centralized helper is used by many server components, so this single change affects multiple pages (admin, superuser, etc.)

---

## Current Test Environment State

### User Account
- **Email**: `districts.test@example.com`
- **User ID**: `05a7f234-72b1-46d1-b09c-8e3db9eeaa27`
- **Role**: `operator`
- **Status**: `is_active = true`
- **City Access**: Amsterdam (via `city_users` table)

### Session State
- **Cookie Name**: `sb-auth-token`
- **Cookie Exists**: ✅ Yes (verified in browser)
- **Cookie Format**: `base64-{JSON}`
- **Session Valid**: ✅ Yes (expires at 1762101266 = ~47 minutes from last check)
- **Browser Client Can Read**: ✅ Yes (confirmed via JS console)
- **User ID in Session**: ✅ Correct (`05a7f234-72b1-46d1-b09c-8e3db9eeaa27`)

### Environment Configuration
**File**: `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Supabase Ports** (custom, non-default):
- API: 54331
- Database: 54332
- Studio: 54333
- Mailpit: 54334

---

## Authentication Flow Analysis

### What Works ✅
1. **Magic Link Generation**: Emails are sent successfully
2. **Token Verification**: Clicking magic link processes token
3. **Session Creation**: Browser establishes valid session
4. **Cookie Storage**: `sb-auth-token` cookie is created and stored
5. **Browser Client Auth**: JavaScript can verify authentication status
6. **Service Role Database Queries**: Middleware can query user_profiles via service role client

### What Fails ❌
1. **Middleware Authentication**: Despite valid cookie, middleware redirects to login
2. **Protected Route Access**: All operator/admin/superuser routes inaccessible
3. **Server-Side Auth**: Pages cannot verify authentication (even with correct cookie config)

### Redirect Loop Observed
```
User navigates to: /en/operator
↓
Middleware: Auth check → Redirects to /operator (i18n removes default locale)
↓
Middleware: Auth check on /operator → FAILS → Redirects to /en/login
↓
Result: User ends up at /login
```

**Critical Finding**: Auth passes for `/en/operator` but FAILS for `/operator` (without locale), suggesting middleware behavior may differ based on path structure.

---

## Debugging Artifacts Created

### Test API Route (Not Yet Tested)
**File**: `/home/sjuarros/Projects/language-map/app/api/test-auth/route.ts`

**Purpose**: Diagnose server-side cookie reading capability

**Usage**:
```bash
curl -H 'Cookie: sb-auth-token={value}' http://localhost:3001/api/test-auth
```

**Expected Output**:
```json
{
  "allCookies": [{name: "...", length: 123}],
  "hasAuthCookie": true/false,
  "authCookieLength": 2462,
  "hasUser": true/false,
  "userEmail": "districts.test@example.com",
  "userId": "05a7f234-...",
  "error": null
}
```

**Status**: Created but requires dev server restart to load

### Debug Logging Added
**File**: `middleware.ts` (lines 160-204)

Logs to console:
- All cookies received by middleware
- Cookie names and lengths
- Supabase URL being used
- Authentication path and required role
- User authentication result
- Error details if auth fails

**To View Logs**: Need access to dev server terminal output

---

## Key Technical Insights

### Cookie Format
Supabase SSR library stores session as:
```
Cookie Name: sb-auth-token
Cookie Value: base64-{base64-encoded-JSON}
```

Decoded JSON structure:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "swjnbzhbwl44",
  "user": {
    "id": "05a7f234-72b1-46d1-b09c-8e3db9eeaa27",
    "email": "districts.test@example.com",
    "role": "authenticated",
    // ... more fields
  },
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1762101266
}
```

### Supabase Client Cookie Behavior
- `createBrowserClient()` - Creates cookies with hostname-based names by default
- `createServerClient()` - Expects same cookie names as browser client
- **Problem**: Cookie name generation is inconsistent across different URL formats
- **Solution**: Override with explicit `cookieOptions.name`

### Middleware Edge Runtime Limitations
- Cannot access all environment variables by default
- Requires explicit exposure via `next.config.ts`
- Cannot set cookies (only read them)
- Runs on EVERY request (expensive operations should be minimized)

---

## Files Changed Summary

### Configuration Files
- `.env.local` - Verified Supabase URLs (changed and reverted during debugging)
- `next.config.ts` - Added service role key exposure
- `supabase/config.toml` - Attempted redirect URL changes (reverted)

### Database Migrations
- 9 new migrations to fix RLS recursion issues (20251102000000 through 20251102000009)
- 1 trigger fix migration (20251101000000_create_user_profiles_trigger.sql - modified)

### Application Code
- `middleware.ts` - Service role client, auth-first logic, sb-auth-token cookie
- `lib/auth/client.ts` - Browser client with sb-auth-token
- `app/[locale]/auth/callback/route.ts` - Callback with sb-auth-token
- `app/[locale]/operator/page.tsx` - Operator page with sb-auth-token
- `lib/supabase/server-client.ts` - Centralized server helper with sb-auth-token
- `app/api/test-auth/route.ts` - NEW diagnostic endpoint

---

## Recommended Next Steps

### Immediate Actions (Next Session Start)

#### 1. Restart Dev Server & Test Diagnostic Endpoint
```bash
# Restart to load test-auth API route
# Dev server is always running on port 3001

# Then test with actual session cookie from browser
curl -H 'Cookie: sb-auth-token={actual-cookie-value}' \
  http://localhost:3001/api/test-auth | jq
```

**Expected Outcomes**:
- ✅ If `hasAuthCookie: true, hasUser: true` → Server CAN read cookie, issue is elsewhere
- ❌ If `hasAuthCookie: false` → Cookie not being transmitted (HTTP vs HTTPS? Domain mismatch?)
- ❌ If `hasAuthCookie: true, hasUser: false` → Cookie present but Supabase can't parse/validate it

#### 2. Check Middleware Logs
The middleware has extensive debug logging but we haven't seen the output. Access the dev server terminal and navigate to `/en/operator` while watching logs.

**Look for**:
```
[Middleware] All cookies: [...]
[Middleware] Supabase URL: http://127.0.0.1:54331
[Middleware] Supabase requesting cookie: sb-auth-token
[Middleware] Returning sb-auth-token: found
[Middleware] Path: /en/operator
[Middleware] Required role: operator
[Middleware] Auth result: { hasUser: true/false, ... }
```

**Key Questions**:
- Is `sb-auth-token` in the cookies list?
- Is middleware finding the cookie?
- What is `hasUser` in the auth result?
- Are there any errors?

#### 3. Test with Fresh Magic Link
The current session may have been corrupted by config changes. Generate completely fresh authentication:

```bash
# Clear browser cookies first
# Then generate new magic link
curl -X POST 'http://127.0.0.1:54331/auth/v1/otp' \
  -H 'Content-Type: application/json' \
  -H 'apikey: {SUPABASE_ANON_KEY}' \
  -d '{"email":"districts.test@example.com"}'

# Get link from Mailpit: http://localhost:54334
# Click link in browser
# Try accessing /en/operator
```

### Deeper Investigation (If Above Fails)

#### 4. Verify Cookie Domain/Path Settings
Check if cookie is being set with incorrect domain/path that prevents it from being sent to `/en/operator`:

```javascript
// In browser console
document.cookie.split(';').forEach(c => {
  const [name] = c.trim().split('=');
  if (name === 'sb-auth-token') {
    console.log('Cookie details:', c);
    // Check: Does it have domain=? path=?
  }
});
```

**Expected**: Cookie should have no explicit domain (defaults to current origin) and path=/

#### 5. Compare Browser Client vs Server Client Behavior
Create a parallel test to see if there's a fundamental difference:

**Browser Test** (already confirmed working):
```javascript
const { data } = await supabase.auth.getUser()
// Returns: { user: {...} }
```

**Server Test** (via API route):
```typescript
// /app/api/test-server-auth/route.ts
// Identical logic to middleware, log everything
```

#### 6. Check if @supabase/ssr Version Issue
Verify package version and check for known issues:

```bash
npm list @supabase/ssr
# Check version against: https://github.com/supabase/auth-helpers/issues
```

Consider testing with explicit cookie name in different way:

```typescript
// Alternative approach - bypass cookie helpers entirely
const cookieValue = request.cookies.get('sb-auth-token')?.value
if (cookieValue) {
  // Manually parse and validate JWT token
  // This would bypass @supabase/ssr's cookie handling
}
```

### Alternative Approaches (If Cookie Approach Fails)

#### 7. Session Storage Instead of Cookies
Switch from cookie-based sessions to header-based:

```typescript
// Middleware: Get token from cookie, pass as header
const token = request.cookies.get('sb-auth-token')?.value
if (token) {
  // Parse token, extract access_token, validate manually
  // Or pass to Supabase via Authorization header
}
```

#### 8. Simplified Auth Flow
Bypass middleware auth entirely as temporary measure:

```typescript
// In protected pages (operator/admin/superuser)
// Do auth check in page itself, redirect client-side if failed
// This proves/disproves middleware-specific issue
```

### Documentation/Communication

#### 9. Check Supabase Auth Documentation
Review latest `@supabase/ssr` docs for server-side auth patterns:
- https://supabase.com/docs/guides/auth/server-side
- May have recent changes to cookie handling

#### 10. Minimal Reproduction Case
If issue persists, create minimal Next.js 15 + Supabase SSR reproduction:
- Single page with middleware
- Single magic link auth
- Demonstrate cookie name mismatch
- Could be a bug in `@supabase/ssr` library

---

## Questions to Answer

1. **Is the `sb-auth-token` cookie being sent in HTTP requests to the server?**
   - Test via: `/api/test-auth` endpoint or middleware logs

2. **Can the server successfully read and parse the cookie value?**
   - Test via: `/api/test-auth` endpoint response

3. **Is `createServerClient` actually using the cookie we provide?**
   - Test via: Middleware debug logs showing auth result

4. **Is there a difference in auth behavior between `/en/operator` and `/operator`?**
   - Test via: Direct navigation to both URLs and compare redirects

5. **Are there multiple server instances or caching issues?**
   - Test via: Hard refresh, clear all caches, new browser session

6. **Is the access token in the cookie still valid?**
   - Test via: Decode JWT manually and check expiration

---

## Reference Information

### Test User Credentials
- **Email**: districts.test@example.com
- **Password**: (passwordless - magic link only)
- **Magic Link Generation**: Via Mailpit at http://localhost:54334

### Database Connection
```bash
docker exec supabase_db_supabase psql -U postgres -d postgres
```

### Useful Queries
```sql
-- Verify user profile
SELECT id, email, role, is_active
FROM user_profiles
WHERE email = 'districts.test@example.com';

-- Check city access
SELECT u.email, u.role, cu.role as city_role, c.slug
FROM user_profiles u
JOIN city_users cu ON u.id = cu.user_id
JOIN cities c ON cu.city_id = c.id
WHERE u.email = 'districts.test@example.com';

-- Check auth.users
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'districts.test@example.com';
```

### Browser Cookie Value (Latest)
```
sb-auth-token=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd09pOHZNVEkzTGpBdU1DNHhPalUwTXpNeEwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJd05XRTNaakl6TkMwM01tSXhMVFEyWkRFdFlqQTVZeTA0WlROa1lqbGxaV0ZoTWpjaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOell5TVRBeE1qWTJMQ0pwWVhRaU9qRTNOakl3T1RjMk5qWXNJbVZ0WVdsc0lqb2laR2x6ZEhKcFkzUnpMblJsYzNSQVpYaGhiWEJzWlM1amIyMGlMQ0p3YUc5dVpTSTZJaUlzSW1Gd2NGOXRaWFJoWkdGMFlTSTZleUp3Y205MmFXUmxjaUk2SW1WdFlXbHNJaXdpY0hKdmRtbGtaWEp6SWpwYkltVnRZV2xzSWwxOUxDSjFjMlZ5WDIxbGRHRmtZWFJoSWpwN0ltVnRZV2xzWDNabGNtbG1hV1ZrSWpwMGNuVmxmU3dpY205c1pTSTZJbUYxZEdobGJuUnBZMkYwWldRaUxDSmhZV3dpT2lKaFlXd3hJaXdpWVcxeUlqcGJleUp0WlhSb2IyUWlPaUp2ZEhBaUxDSjBhVzFsYzNSaGJYQWlPakUzTmpJd09UYzJOalo5WFN3aWMyVnpjMmx2Ymw5cFpDSTZJalJqTWpZeE56RTNMVEU1WlRNdE5EQXpPQzA1T1RrNUxUWmpOVGN3WXpJd056VXdPQ0lzSW1selgyRnViMjU1Ylc5MWN5STZabUZzYzJWOS5KbHBtUndxQk9aNHBpVUhiTGNhd1NjMmU0RkN3T3dYM0hEOTJ0c0Q5elV3IiwicmVmcmVzaF90b2tlbiI6InN3am5iemhid2w0NCIsInVzZXIiOnsiaWQiOiIwNWE3ZjIzNC03MmIxLTQ2ZDEtYjA5Yy04ZTNkYjllZWFhMjciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJlbWFpbCI6ImRpc3RyaWN0cy50ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfY29uZmlybWVkX2F0IjoiMjAyNS0xMS0wMVQyMjoyMTo1NS40MzcxNzlaIiwicGhvbmUiOiIiLCJjb25maXJtZWRfYXQiOiIyMDI1LTExLTAxVDIyOjIxOjU1LjQzNzE3OVoiLCJyZWNvdmVyeV9zZW50X2F0IjoiMjAyNS0xMS0wMlQxNTozNDowNC41NzkwOTFaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNS0xMS0wMlQxNTozNDoyNi40MjAxODlaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJpZGVudGl0aWVzIjpbeyJpZGVudGl0eV9pZCI6ImRjMzNkNzk1LTYzMDEtNGJlZi1hM2Q2LTRhYzFiNTczYjVjYSIsImlkIjoiMDVhN2YyMzQtNzJiMS00NmQxLWIwOWMtOGUzZGI5ZWVhYTI3IiwidXNlcl9pZCI6IjA1YTdmMjM0LTcyYjEtNDZkMS1iMDljLThlM2RiOWVlYWEyNyIsImlkZW50aXR5X2RhdGEiOnsiZW1haWwiOiJkaXN0cmljdHMudGVzdEBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIwNWE3ZjIzNC03MmIxLTQ2ZDEtYjA5Yy04ZTNkYjllZWFhMjcifSwicHJvdmlkZXIiOiJlbWFpbCIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMTEtMDFUMjI6MjE6NTUuNDM1NTE3WiIsImNyZWF0ZWRfYXQiOiIyMDI1LTExLTAxVDIyOjIxOjU1LjQzNTU1OFoiLCJ1cGRhdGVkX2F0IjoiMjAyNS0xMS0wMVQyMjoyMTo1NS40MzU1NThaIiwiZW1haWwiOiJkaXN0cmljdHMudGVzdEBleGFtcGxlLmNvbSJ9XSwiY3JlYXRlZF9hdCI6IjIwMjUtMTEtMDFUMjI6MjE6NTUuNDM0MjY4WiIsInVwZGF0ZWRfYXQiOiIyMDI1LTExLTAyVDE1OjM0OjI2LjQyMTc5NFoiLCJpc19hbm9ueW1vdXMiOmZhbHNlfSwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM1ODMuNzI3OTk5OTI1NjEzNCwiZXhwaXJlc19hdCI6MTc2MjEwMTI2Nn0
```

Session expires at: **1762101266** (Unix timestamp)

---

## Success Criteria

The fix will be considered successful when:
1. ✅ User can receive magic link email
2. ✅ User can click magic link and establish session
3. ✅ Session cookie (`sb-auth-token`) is created in browser
4. ⏳ **User can navigate to `/en/operator` and see the operator dashboard** (NOT redirect to login)
5. ⏳ **User can navigate to `/en/admin` and see appropriate page** (or permission denied if not admin)
6. ⏳ **User can navigate to `/en/superuser` and see appropriate page** (or permission denied if not superuser)
7. ⏳ **Middleware logs show successful authentication**
8. ⏳ **No infinite redirect loops**

Currently at: 3/8 complete (37.5%)

---

## Lessons Learned

1. **Cookie naming in `@supabase/ssr` is fragile** - hostname-based naming causes inconsistencies
2. **Always check auth BEFORE i18n redirects** - otherwise protected routes can be bypassed
3. **RLS policies with circular dependencies cause infinite recursion** - use service role for middleware
4. **Edge runtime has limited env var access** - must explicitly expose via next.config
5. **Debugging requires access to server logs** - middleware console.log output not visible in browser
6. **Test each layer independently** - browser ✓, API route ?, middleware ?, page ?

---

## Additional Resources

- Supabase SSR Docs: https://supabase.com/docs/guides/auth/server-side
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- next-intl Middleware: https://next-intl-docs.vercel.app/docs/routing/middleware

---

**Session End**: November 2, 2025 16:50 UTC
**Total Files Modified**: 15+
**Total Database Migrations**: 10
**Next Session Owner**: Continue from "Recommended Next Steps" section
