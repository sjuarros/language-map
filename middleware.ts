/**
 * Middleware for i18n routing and route protection
 *
 * Part 1: i18n routing with next-intl
 * - Handles locale detection and routing
 * - Redirects users to appropriate locale-prefixed URL
 *
 * Part 2: Role-based route protection
 * - Protects /operator, /admin, /superuser routes based on user roles
 * - Requires authentication for protected routes
 * - Redirects unauthenticated users to login
 *
 * Route Protection Rules:
 * - /operator/*  → requires operator, admin, or superuser role
 * - /admin/*     → requires admin or superuser role
 * - /superuser/* → requires superuser role only
 * - /*           → public routes (no auth required)
 */

import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { getDatabaseAdminClient } from '@/lib/database/client'
import { locales, defaultLocale } from './lib/i18n/config'

// Define protected route patterns and required roles
const PROTECTED_ROUTES = {
  '/operator': 'operator', // Requires operator+ role
  '/admin': 'admin',       // Requires admin+ role
  '/superuser': 'superuser' // Requires superuser only
} as const

/**
 * Check if a path matches a protected route pattern
 *
 * @param pathname - The URL pathname to check
 * @param routePattern - The route pattern to match against
 * @returns true if pathname starts with the route pattern
 */
function matchesRoute(pathname: string, routePattern: string): boolean {
  return pathname.startsWith(routePattern)
}

/**
 * Determine the required role for a given route path
 *
 * @param pathname - The URL pathname to analyze
 * @returns The required role ('operator', 'admin', 'superuser') or null if public
 */
function getRequiredRole(pathname: string): typeof PROTECTED_ROUTES[keyof typeof PROTECTED_ROUTES] | null {
  for (const [route, role] of Object.entries(PROTECTED_ROUTES)) {
    if (matchesRoute(pathname, route)) {
      return role
    }
  }
  return null
}

/**
 * Check if user has the required role based on role hierarchy
 *
 * Role hierarchy: superuser (3) > admin (2) > operator (1)
 * Users with higher roles can access lower-level routes
 *
 * @param userRole - The user's actual role
 * @param requiredRole - The minimum role required
 * @returns true if user has the required role or higher
 */
function hasRequiredRole(userRole: string | null, requiredRole: string): boolean {
  if (!userRole) return false

  const roleHierarchy = {
    'operator': 1,
    'admin': 2,
    'superuser': 3
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

/**
 * Extract locale from pathname
 */
function getLocaleFromPathname(pathname: string): (typeof locales)[number] | null {
  const segments = pathname.split('/')
  const locale = segments[1]

  if (locales.includes(locale as typeof locales[number])) {
    return locale as typeof locales[number]
  }

  return null
}

/**
 * Get redirect path based on user role
 */
function getDashboardPath(
  userRole: string | null,
  locale: (typeof locales)[number] = 'en'
): string {
  if (!userRole) return `/${locale}/login`

  switch (userRole) {
    case 'superuser':
      return `/${locale}/superuser`
    case 'admin':
      return `/${locale}/admin`
    case 'operator':
      return `/${locale}/operator`
    default:
      return `/${locale}`
  }
}

/**
 * Handle authorization checks for protected routes
 */
async function handleAuthorization(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip authorization for:
  // - Static files
  // - API routes
  // - _next directory
  // - Auth pages
  // - Public locale routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/en') ||
    pathname.startsWith('/nl') ||
    pathname.startsWith('/fr')
  ) {
    return null
  }

  // Determine required role for this route
  const requiredRole = getRequiredRole(pathname)

  // If route doesn't require authentication, continue
  if (!requiredRole) {
    return null
  }

  // Create Supabase client for authentication check using abstraction layer
  // Note: For middleware auth checks, we use admin client for elevated permissions
  const supabase = getDatabaseAdminClient('system')

  // Check if user is authenticated
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  // If user is not authenticated, redirect to login
  if (!user || error) {
    const locale = getLocaleFromPathname(pathname) || 'en'
    const loginUrl = new URL(`/${locale as 'en' | 'nl' | 'fr'}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get user profile from database to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // If no profile found or user is inactive, redirect to login
  if (!profile || !profile.is_active) {
    const locale = getLocaleFromPathname(pathname) || 'en'
    const loginUrl = new URL(`/${locale as 'en' | 'nl' | 'fr'}/login`, request.url)
    loginUrl.searchParams.set('error', 'account_inactive')
    return NextResponse.redirect(loginUrl)
  }

  // Check if user has required role
  if (!hasRequiredRole(profile.role, requiredRole)) {
    // User doesn't have permission, redirect to appropriate dashboard
    const locale = getLocaleFromPathname(pathname) || 'en'
    const dashboardUrl = new URL(
      getDashboardPath(profile.role, locale as 'en' | 'nl' | 'fr'),
      request.url
    )
    dashboardUrl.searchParams.set('error', 'insufficient_permissions')
    return NextResponse.redirect(dashboardUrl)
  }

  // User is authenticated and authorized
  return null
}

// Create i18n middleware instance
const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

export default async function middleware(request: NextRequest) {
  // All routes now go through i18n middleware first
  // The middleware will handle locale-prefixed routes properly

  // Handle i18n routing
  const i18nResponse = i18nMiddleware(request)

  // If i18n middleware redirected, use that response
  if (i18nResponse.status !== 200) {
    return i18nResponse
  }

  // Then, handle authorization
  const authResponse = await handleAuthorization(request)

  // If authorization redirected, use that response
  if (authResponse) {
    return authResponse
  }

  // Otherwise, continue with the request
  return i18nResponse
}

export const config = {
  // Match all routes except:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - Public files with extensions
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
}
