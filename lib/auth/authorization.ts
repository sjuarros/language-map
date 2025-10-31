/**
 * Authorization Utilities
 * ======================
 * Provides role-based access control functions for the application.
 *
 * Role Hierarchy:
 * - operator (1) → Can access operator routes, CRUD data
 * - admin (2) → Can access admin routes, manage users, city settings
 * - superuser (3) → Can access superuser routes, create cities, manage all users
 */

import { locales } from '@/lib/i18n/config'

/**
 * User roles in the system
 */
export type UserRole = 'operator' | 'admin' | 'superuser'

/**
 * Check if a role is valid
 */
export function isValidRole(role: string | null | undefined): role is UserRole {
  return role === 'operator' || role === 'admin' || role === 'superuser'
}

/**
 * Role hierarchy levels for comparison
 */
export const ROLE_LEVEL: Record<UserRole, number> = {
  operator: 1,
  admin: 2,
  superuser: 3
}

/**
 * Check if user has required role (supports role hierarchy)
 *
 * @param userRole - The user's actual role
 * @param requiredRole - The minimum role required
 * @returns true if user has required role or higher
 */
export function hasRole(userRole: string | null | undefined, requiredRole: UserRole): boolean {
  if (!isValidRole(userRole)) {
    return false
  }

  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole]
}

/**
 * Check if user is a superuser
 */
export function isSuperuser(role: string | null | undefined): role is 'superuser' {
  return role === 'superuser'
}

/**
 * Check if user is an admin or superuser
 */
export function isAdmin(role: string | null | undefined): boolean {
  return isSuperuser(role) || role === 'admin'
}

/**
 * Check if user can access operator routes
 */
export function isOperator(role: string | null | undefined): boolean {
  return isAdmin(role) || role === 'operator'
}

/**
 * Get the highest role level a user has
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_LEVEL[role]
}

/**
 * Compare two roles
 * @returns 1 if roleA > roleB, -1 if roleA < roleB, 0 if equal
 */
export function compareRoles(roleA: UserRole | null, roleB: UserRole | null): number {
  if (!roleA || !roleB) return 0
  if (roleA === roleB) return 0
  return ROLE_LEVEL[roleA] > ROLE_LEVEL[roleB] ? 1 : -1
}

/**
 * Get user-friendly role name
 */
export function getRoleDisplayName(role: UserRole | null | undefined): string {
  if (!isValidRole(role)) return 'Unknown'

  const roleNames: Record<UserRole, string> = {
    operator: 'Operator',
    admin: 'Administrator',
    superuser: 'Superuser'
  }

  return roleNames[role]
}

/**
 * Check if user can perform an action based on their role
 */
export function canPerformAction(
  userRole: string | null | undefined,
  action: 'create_city' | 'manage_users' | 'manage_data' | 'view_analytics'
): boolean {
  if (!isValidRole(userRole)) {
    return false
  }

  const permissions: Record<UserRole, string[]> = {
    operator: ['manage_data'],
    admin: ['manage_data', 'manage_users', 'view_analytics'],
    superuser: ['create_city', 'manage_users', 'manage_data', 'view_analytics']
  }

  return permissions[userRole].includes(action)
}

/**
 * Get dashboard redirect path based on user role
 */
export function getDashboardPath(role: UserRole | null | undefined, locale: string = 'en'): string {
  if (!isValidRole(role)) {
    return `/${locale}`
  }

  const dashboardPaths: Record<UserRole, string> = {
    operator: `/${locale}/operator`,
    admin: `/${locale}/admin`,
    superuser: `/${locale}/superuser`
  }

  return dashboardPaths[role]
}

/**
 * Get navigation items based on user role
 */
export function getNavigationItems(role: UserRole | null | undefined, locale: string = 'en') {
  const baseItems = [
    { name: 'Map', href: `/${locale}`, icon: 'Map' }
  ]

  if (!isValidRole(role)) {
    return baseItems
  }

  const roleItems: Record<UserRole, Array<{ name: string; href: string; icon: string }>> = {
    operator: [
      { name: 'Dashboard', href: `/${locale}/operator`, icon: 'LayoutDashboard' },
      { name: 'Languages', href: `/${locale}/operator/languages`, icon: 'Languages' }
    ],
    admin: [
      { name: 'Dashboard', href: `/${locale}/admin`, icon: 'LayoutDashboard' },
      { name: 'Users', href: `/${locale}/admin/users`, icon: 'Users' },
      { name: 'Settings', href: `/${locale}/admin/settings`, icon: 'Settings' }
    ],
    superuser: [
      { name: 'Dashboard', href: `/${locale}/superuser`, icon: 'LayoutDashboard' },
      { name: 'Cities', href: `/${locale}/superuser/cities`, icon: 'Building' },
      { name: 'Users', href: `/${locale}/superuser/users`, icon: 'Users' }
    ]
  }

  return [...baseItems, ...roleItems[role]]
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  // Check if it's a public route (no auth required)
  const segments = pathname.split('/')

  // Root path or direct locale path
  if (pathname === '/' || pathname === '/en' || pathname === '/nl' || pathname === '/fr') {
    return true
  }

  // Auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return true
  }

  // City routes like /en/amsterdam
  if (segments.length >= 3 && segments[1]) {
    const locale = segments[1]
    if (locales.includes(locale as typeof locales[number])) {
      const routeType = segments[2]
      // If it's a protected route, check permissions
      if (routeType === 'admin' || routeType === 'operator' || routeType === 'superuser') {
        // Protected route - check role
        if (!isValidRole(role)) {
          return false
        }

        if (routeType === 'operator') {
          return isOperator(role)
        }
        if (routeType === 'admin') {
          return isAdmin(role)
        }
        if (routeType === 'superuser') {
          return isSuperuser(role)
        }
      } else {
        // City route without admin/operator/superuser - it's public
        return true
      }
    }
  }

  // If role is not valid, deny access
  if (!isValidRole(role)) {
    return false
  }

  // Default: deny
  return false
}

/**
 * Get error message for insufficient permissions
 */
export function getPermissionErrorMessage(
  action: string,
  requiredRole: UserRole,
  actualRole: UserRole | null
): string {
  const roleDisplay = getRoleDisplayName(requiredRole)
  const userRoleDisplay = actualRole ? getRoleDisplayName(actualRole) : 'No role'

  return `You need ${roleDisplay} privileges to ${action}. Your current role: ${userRoleDisplay}`
}
