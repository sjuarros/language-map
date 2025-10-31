/**
 * Unit tests for authorization utilities
 */

import { describe, it, expect } from 'vitest'
import {
  hasRole,
  isSuperuser,
  isAdmin,
  isOperator,
  isValidRole,
  canPerformAction,
  getDashboardPath,
  getNavigationItems,
  canAccessRoute,
  getRoleDisplayName,
  getPermissionErrorMessage,
  compareRoles,
  ROLE_LEVEL
} from './authorization'

describe('Authorization Utils', () => {
  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidRole('operator')).toBe(true)
      expect(isValidRole('admin')).toBe(true)
      expect(isValidRole('superuser')).toBe(true)
    })

    it('should return false for invalid roles', () => {
      expect(isValidRole('user')).toBe(false)
      expect(isValidRole('guest')).toBe(false)
      expect(isValidRole(null)).toBe(false)
      expect(isValidRole(undefined)).toBe(false)
      expect(isValidRole('')).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('should return true when user has exact role', () => {
      expect(hasRole('operator', 'operator')).toBe(true)
      expect(hasRole('admin', 'admin')).toBe(true)
      expect(hasRole('superuser', 'superuser')).toBe(true)
    })

    it('should return true when user has higher role', () => {
      expect(hasRole('admin', 'operator')).toBe(true)
      expect(hasRole('superuser', 'operator')).toBe(true)
      expect(hasRole('superuser', 'admin')).toBe(true)
    })

    it('should return false when user has lower role', () => {
      expect(hasRole('operator', 'admin')).toBe(false)
      expect(hasRole('operator', 'superuser')).toBe(false)
      expect(hasRole('admin', 'superuser')).toBe(false)
    })

    it('should return false for null or undefined roles', () => {
      expect(hasRole(null, 'operator')).toBe(false)
      expect(hasRole(undefined, 'admin')).toBe(false)
    })
  })

  describe('isSuperuser', () => {
    it('should return true only for superuser role', () => {
      expect(isSuperuser('superuser')).toBe(true)
      expect(isSuperuser('admin')).toBe(false)
      expect(isSuperuser('operator')).toBe(false)
      expect(isSuperuser(null)).toBe(false)
      expect(isSuperuser(undefined)).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin and superuser', () => {
      expect(isAdmin('admin')).toBe(true)
      expect(isAdmin('superuser')).toBe(true)
    })

    it('should return false for operator and null/undefined', () => {
      expect(isAdmin('operator')).toBe(false)
      expect(isAdmin(null)).toBe(false)
      expect(isAdmin(undefined)).toBe(false)
    })
  })

  describe('isOperator', () => {
    it('should return true for all valid roles', () => {
      expect(isOperator('operator')).toBe(true)
      expect(isOperator('admin')).toBe(true)
      expect(isOperator('superuser')).toBe(true)
    })

    it('should return false for null and undefined', () => {
      expect(isOperator(null)).toBe(false)
      expect(isOperator(undefined)).toBe(false)
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName('operator')).toBe('Operator')
      expect(getRoleDisplayName('admin')).toBe('Administrator')
      expect(getRoleDisplayName('superuser')).toBe('Superuser')
    })

    it('should return Unknown for invalid roles', () => {
      expect(getRoleDisplayName(null)).toBe('Unknown')
      expect(getRoleDisplayName(undefined)).toBe('Unknown')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getRoleDisplayName('guest' as any)).toBe('Unknown')
    })
  })

  describe('canPerformAction', () => {
    it('should allow superuser to perform all actions', () => {
      expect(canPerformAction('superuser', 'create_city')).toBe(true)
      expect(canPerformAction('superuser', 'manage_users')).toBe(true)
      expect(canPerformAction('superuser', 'manage_data')).toBe(true)
      expect(canPerformAction('superuser', 'view_analytics')).toBe(true)
    })

    it('should allow admin to perform most actions', () => {
      expect(canPerformAction('admin', 'create_city')).toBe(false)
      expect(canPerformAction('admin', 'manage_users')).toBe(true)
      expect(canPerformAction('admin', 'manage_data')).toBe(true)
      expect(canPerformAction('admin', 'view_analytics')).toBe(true)
    })

    it('should allow operator to perform limited actions', () => {
      expect(canPerformAction('operator', 'create_city')).toBe(false)
      expect(canPerformAction('operator', 'manage_users')).toBe(false)
      expect(canPerformAction('operator', 'manage_data')).toBe(true)
      expect(canPerformAction('operator', 'view_analytics')).toBe(false)
    })

    it('should return false for invalid roles', () => {
      expect(canPerformAction(null, 'manage_data')).toBe(false)
      expect(canPerformAction(undefined, 'manage_data')).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(canPerformAction('user' as any, 'manage_data')).toBe(false)
    })
  })

  describe('getDashboardPath', () => {
    it('should return correct dashboard path for each role', () => {
      expect(getDashboardPath('operator')).toBe('/en/operator')
      expect(getDashboardPath('admin')).toBe('/en/admin')
      expect(getDashboardPath('superuser')).toBe('/en/superuser')
    })

    it('should return locale-prefixed root path for invalid roles', () => {
      expect(getDashboardPath(null)).toBe('/en')
      expect(getDashboardPath(undefined)).toBe('/en')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getDashboardPath('guest' as any)).toBe('/en')
    })

    it('should respect custom locale parameter', () => {
      expect(getDashboardPath('operator', 'nl')).toBe('/nl/operator')
      expect(getDashboardPath('admin', 'fr')).toBe('/fr/admin')
    })
  })

  describe('getNavigationItems', () => {
    it('should return base items for null role', () => {
      const items = getNavigationItems(null)
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('Map')
    })

    it('should return operator navigation items', () => {
      const items = getNavigationItems('operator')
      expect(items).toHaveLength(3)
      expect(items[0].name).toBe('Map')
      expect(items[1].name).toBe('Dashboard')
      expect(items[2].name).toBe('Languages')
    })

    it('should return admin navigation items', () => {
      const items = getNavigationItems('admin')
      expect(items).toHaveLength(4)
      expect(items[0].name).toBe('Map')
      expect(items[1].name).toBe('Dashboard')
      expect(items[2].name).toBe('Users')
      expect(items[3].name).toBe('Settings')
    })

    it('should return superuser navigation items', () => {
      const items = getNavigationItems('superuser')
      expect(items).toHaveLength(4)
      expect(items[0].name).toBe('Map')
      expect(items[1].name).toBe('Dashboard')
      expect(items[2].name).toBe('Cities')
      expect(items[3].name).toBe('Users')
    })
  })

  describe('canAccessRoute', () => {
    it('should allow superuser to access all routes', () => {
      expect(canAccessRoute('superuser', '/en/operator')).toBe(true)
      expect(canAccessRoute('superuser', '/en/admin')).toBe(true)
      expect(canAccessRoute('superuser', '/en/superuser')).toBe(true)
      expect(canAccessRoute('superuser', '/en')).toBe(true)
      expect(canAccessRoute('superuser', '/en/amsterdam')).toBe(true)
    })

    it('should allow admin to access admin and operator routes', () => {
      expect(canAccessRoute('admin', '/en/operator')).toBe(true)
      expect(canAccessRoute('admin', '/en/admin')).toBe(true)
      expect(canAccessRoute('admin', '/en/superuser')).toBe(false)
    })

    it('should allow operator to access operator routes only', () => {
      expect(canAccessRoute('operator', '/en/operator')).toBe(true)
      expect(canAccessRoute('operator', '/en/admin')).toBe(false)
      expect(canAccessRoute('operator', '/en/superuser')).toBe(false)
    })

    it('should allow access to public routes for all users', () => {
      expect(canAccessRoute(null, '/')).toBe(true)
      expect(canAccessRoute(null, '/en/amsterdam')).toBe(true)
      expect(canAccessRoute(undefined, '/')).toBe(true)
    })
  })

  describe('compareRoles', () => {
    it('should return 0 for equal roles', () => {
      expect(compareRoles('operator', 'operator')).toBe(0)
      expect(compareRoles('admin', 'admin')).toBe(0)
      expect(compareRoles('superuser', 'superuser')).toBe(0)
    })

    it('should return 1 when first role is higher', () => {
      expect(compareRoles('admin', 'operator')).toBe(1)
      expect(compareRoles('superuser', 'admin')).toBe(1)
      expect(compareRoles('superuser', 'operator')).toBe(1)
    })

    it('should return -1 when first role is lower', () => {
      expect(compareRoles('operator', 'admin')).toBe(-1)
      expect(compareRoles('admin', 'superuser')).toBe(-1)
      expect(compareRoles('operator', 'superuser')).toBe(-1)
    })

    it('should handle null roles', () => {
      expect(compareRoles(null, null)).toBe(0)
      expect(compareRoles(null, 'operator')).toBe(0)
      expect(compareRoles('operator', null)).toBe(0)
    })
  })

  describe('getPermissionErrorMessage', () => {
    it('should generate correct error message', () => {
      const message = getPermissionErrorMessage('create a city', 'admin', 'operator')
      expect(message).toContain('Administrator privileges')
      expect(message).toContain('create a city')
      expect(message).toContain('Operator')
    })

    it('should handle null role', () => {
      const message = getPermissionErrorMessage('view users', 'admin', null)
      expect(message).toContain('Administrator privileges')
      expect(message).toContain('view users')
      expect(message).toContain('No role')
    })
  })

  describe('ROLE_LEVEL', () => {
    it('should have correct level values', () => {
      expect(ROLE_LEVEL.operator).toBe(1)
      expect(ROLE_LEVEL.admin).toBe(2)
      expect(ROLE_LEVEL.superuser).toBe(3)
    })
  })
})
