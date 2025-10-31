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
export function getDashboardPath(role: UserRole | null | undefined): string {
  if (!isValidRole(role)) {
    return '/'
  }

  const dashboardPaths: Record<UserRole, string> = {
    operator: '/operator',
    admin: '/admin',
    superuser: '/superuser'
  }

  return dashboardPaths[role]
}

/**
 * Get navigation items based on user role
 */
export function getNavigationItems(role: UserRole | null | undefined) {
  const baseItems = [
    { name: 'Map', href: '/', icon: 'Map' }
  ]

  if (!isValidRole(role)) {
    return baseItems
  }

  const roleItems: Record<UserRole, Array<{ name: string; href: string; icon: string }>> = {
    operator: [
      { name: 'Dashboard', href: '/operator', icon: 'LayoutDashboard' },
      { name: 'Languages', href: '/operator/languages', icon: 'Languages' }
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
      { name: 'Users', href: '/admin/users', icon: 'Users' },
      { name: 'Settings', href: '/admin/settings', icon: 'Settings' }
    ],
    superuser: [
      { name: 'Dashboard', href: '/superuser', icon: 'LayoutDashboard' },
      { name: 'Cities', href: '/superuser/cities', icon: 'Building' },
      { name: 'Users', href: '/superuser/users', icon: 'Users' }
    ]
  }

  return [...baseItems, ...roleItems[role]]
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  // Public routes (no auth required)
  if (
    pathname === '/' ||
    pathname.startsWith('/en') ||
    pathname.startsWith('/nl') ||
    pathname.startsWith('/fr')
  ) {
    return true
  }

  // If role is not valid, deny access to protected routes
  if (!isValidRole(role)) {
    return false
  }

  // Operator routes
  if (pathname.startsWith('/operator')) {
    return isOperator(role)
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    return isAdmin(role)
  }

  // Superuser routes
  if (pathname.startsWith('/superuser')) {
    return isSuperuser(role)
  }

  // Default: allow
  return true
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
