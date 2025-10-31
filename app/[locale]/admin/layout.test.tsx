/**
 * Admin Layout Tests
 *
 * Tests for admin layout component with authentication and role checking.
 *
 * @module app/admin/layout.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminLayout from './layout'
import { redirect } from 'next/navigation'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/auth/authorization', () => ({
  isAdmin: vi.fn(),
}))

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    try {
      await AdminLayout({ children: <div>Test Content</div> })
    } catch {
      // Redirect throws in tests
      expect(redirect).toHaveBeenCalled()
    }

    expect(redirect).toHaveBeenCalled()
  })

  it('should redirect to login if auth error', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Auth error' },
        }),
      },
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    try {
      await AdminLayout({ children: <div>Test Content</div> })
    } catch {
      // Redirect throws in tests
      expect(redirect).toHaveBeenCalled()
    }

    expect(redirect).toHaveBeenCalled()
  })

  it('should redirect to home if user is not admin', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'operator' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const { isAdmin } = await import('@/lib/auth/authorization')
    vi.mocked(isAdmin).mockReturnValue(false)

    await AdminLayout({ children: <div>Test Content</div> })

    expect(redirect).toHaveBeenCalledWith('/en/')
  })

  it('should render children if user is admin', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const { isAdmin } = await import('@/lib/auth/authorization')
    vi.mocked(isAdmin).mockReturnValue(true)

    const { getLocale } = await import('next-intl/server')
    vi.mocked(getLocale).mockResolvedValue('en')

    const TestContent = () => <div>Test Admin Content</div>
    const result = await AdminLayout({ children: <TestContent /> })

    expect(result).toBeDefined()
  })

  it('should render children if user is superuser', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'superuser' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const { isAdmin } = await import('@/lib/auth/authorization')
    vi.mocked(isAdmin).mockReturnValue(true)

    const TestContent = () => <div>Test Admin Content</div>
    const result = await AdminLayout({ children: <TestContent /> })

    expect(result).toBeDefined()
  })
})
