/**
 * Operator Layout Tests
 *
 * Tests for operator layout component with authentication and role checking.
 *
 * @module app/operator/layout.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import OperatorLayout from './layout'
import { redirect } from 'next/navigation'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
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
  isOperator: vi.fn(),
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'operator@example.com',
}

describe('OperatorLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect if user not authenticated', async () => {
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
      await OperatorLayout({ children: <div>Test Content</div> })
    } catch {
      // Redirect throws in tests
      expect(redirect).toHaveBeenCalled()
    }

    expect(redirect).toHaveBeenCalled()
  })

  it('should redirect to home if user is not operator', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
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

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(false)

    await OperatorLayout({ children: <div>Test Content</div> })

    expect(redirect).toHaveBeenCalledWith('/en/')
  })

  it('should render children if user is operator', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
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

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    const TestContent = () => <div>Test Operator Content</div>
    const result = await OperatorLayout({ children: <TestContent /> })

    expect(result).toBeDefined()
  })

  it('should render children if user is admin', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
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

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    const TestContent = () => <div>Test Operator Content</div>
    const result = await OperatorLayout({ children: <TestContent /> })

    expect(result).toBeDefined()
  })

  it('should render children if user is superuser', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
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

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    const TestContent = () => <div>Test Operator Content</div>
    const result = await OperatorLayout({ children: <TestContent /> })

    expect(result).toBeDefined()
  })
})
